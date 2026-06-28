import base64
import json
import os

from openai import OpenAI
from google import genai
from google.genai import types

SUPPORTED_PROVIDERS = {"openai", "gemini"}


class AIProviderError(Exception):
    pass


def get_llm_provider():
    return os.getenv("LLM_PROVIDER", "openai").strip().lower()


def get_openai_models():
    primary_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    fallback_model = os.getenv("OPENAI_FALLBACK_MODEL", "gpt-4o").strip() or "gpt-4o"
    return primary_model, fallback_model


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise AIProviderError("OPENAI_API_KEY is not set.")
    return OpenAI(api_key=api_key, max_retries=0)


def ensure_supported_provider():
    provider = get_llm_provider()
    if provider not in SUPPORTED_PROVIDERS:
        raise AIProviderError(f"Unsupported LLM_PROVIDER '{provider}'. Supported providers: openai, gemini.")
    return provider


def run_gemini_chat_completion(messages, json_mode=False):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AIProviderError("GEMINI_API_KEY is not set.")
    
    client = genai.Client(api_key=api_key)
    
    system_instruction = None
    gemini_contents = []
    
    for msg in messages:
        if msg["role"] == "system":
            system_instruction = msg["content"]
        else:
            role = "user" if msg["role"] == "user" else "model"
            parts = []
            if isinstance(msg["content"], str):
                parts.append(types.Part.from_text(text=msg["content"]))
            elif isinstance(msg["content"], list):
                for item in msg["content"]:
                    if item.get("type") == "text":
                        parts.append(types.Part.from_text(text=item["text"]))
                    elif item.get("type") == "image_url":
                        url = item["image_url"]["url"]
                        if url.startswith("data:image/png;base64,"):
                            b64 = url.replace("data:image/png;base64,", "")
                            raw_bytes = base64.b64decode(b64)
                            parts.append(types.Part.from_bytes(data=raw_bytes, mime_type="image/png"))
            gemini_contents.append(types.Content(role=role, parts=parts))

    config = types.GenerateContentConfig()
    if system_instruction:
        config.system_instruction = system_instruction
    if json_mode:
        config.response_mime_type = "application/json"
        
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=gemini_contents,
            config=config,
        )
        if not response.text:
            raise AIProviderError("Gemini returned an empty response.")
        return response.text
    except Exception as e:
        raise AIProviderError(f"Gemini request failed. Last error: {e}")


def run_openai_chat_completion(messages, json_mode=False):
    client = get_openai_client()
    primary_model, fallback_model = get_openai_models()

    options = {
        "messages": messages,
    }

    if json_mode:
        options["response_format"] = {"type": "json_object"}

    last_error = None

    for model in [primary_model, fallback_model]:
        try:
            response = client.chat.completions.create(
                model=model,
                **options,
            )
            content = response.choices[0].message.content
            if not content:
                raise AIProviderError(f"The model '{model}' returned an empty response.")
            return content
        except Exception as exc:
            last_error = exc

    raise AIProviderError(f"OpenAI request failed for both configured models. Last error: {last_error}")


def run_chat_completion(messages, json_mode=False):
    provider = ensure_supported_provider()
    if provider == "gemini":
        return run_gemini_chat_completion(messages, json_mode)
    else:
        return run_openai_chat_completion(messages, json_mode)


def _extract_json_payload(response_text: str):
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return json.loads(cleaned)

async def run_axe_core(page):
    try:
        await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.0/axe.min.js")
        results = await page.evaluate("async () => { return await axe.run(); }")
        return results.get('violations', [])
    except Exception as e:
        print(f"Error running axe-core: {e}")
        return []

def generate_ai_analysis(dom_path, screenshot_path, axe_results):
    dom_content = ""
    try:
        with open(dom_path, "r", encoding="utf-8") as f:
            dom_content = f.read()
    except Exception:
        pass
    
    encoded_string = ""
    try:
        with open(screenshot_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    except Exception:
        pass
    
    prompt = f"""
    You are an expert UX/UI auditor and Accessibility specialist.
    Analyze the provided screenshot of the website, its DOM HTML, and the automated axe-core accessibility violations.
    
    Axe-Core Violations: {json.dumps(axe_results)[:2000]} # Truncating to avoid huge prompts if many issues
    
    DOM Content (truncated to first 20000 chars): {dom_content[:20000]}
    
    Identify the top 5 UX/UI or Accessibility issues, and also classify the industry of the website based on the screenshot and DOM.
    Valid industries: "E-commerce", "SaaS", "Banking", "Healthcare", "Education", "Media", "Portfolio", "General".

    For each issue, provide:
    1. "category": "Accessibility", "UX", "SEO", or "Performance"
    2. "severity": "low", "medium", "high", or "critical"
    3. "title": Short description of the issue.
    4. "description": Conversational explanation of root cause and user impact.
    5. "business_impact": "High", "Medium", or "Low" (e.g., Conversion Loss, Legal Risk).
    6. "confidence_score": Integer from 0 to 100 representing your confidence in this issue.
    7. "estimated_fix_time": String (e.g., "2 minutes", "1 hour", "Easy").
    8. "recommendation": How to fix it (conversational tone).
    9. "selector": CSS selector of the element, if applicable.
    10. "code_snippet": HTML/CSS of the current state, if applicable.
    11. "fixed_code": HTML/CSS using Tailwind CSS utility classes and React formatting (e.g. className instead of class) of the recommended fix.
    
    You must return a valid JSON object with the exact keys:
    {
      "industry": "One of the valid industries",
      "issues": [
        {
          "category": "...",
          "severity": "...",
          ...
        }
      ]
    }
    """

    try:
        response_text = run_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert UX/UI auditor. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{encoded_string}"
                            },
                        },
                    ],
                },
            ],
            json_mode=True,
        )
        parsed_response = _extract_json_payload(response_text)

        if isinstance(parsed_response, dict):
            if "industry" in parsed_response and "issues" in parsed_response:
                return parsed_response

        # Fallback if it returned just the array
        if isinstance(parsed_response, list):
            return {"industry": "General", "issues": parsed_response}

        return {"industry": "General", "issues": []}
    except AIProviderError as e:
        print(f"AI provider error during audit analysis (Mock Mode Enabled): {e}")
        return {
            "industry": "SaaS",
            "issues": [
                {
                    "category": "UX",
                    "severity": "critical",
                    "title": "Missing Call-to-Action (CTA) Contrast",
                    "description": "The main button blends in with the background, making it hard for users to know where to click. This heavily impacts conversions.",
                    "business_impact": "High",
                    "confidence_score": 95,
                    "estimated_fix_time": "5 minutes",
                    "recommendation": "Update the button background to a high-contrast color like blue or emerald.",
                    "selector": "button.btn-primary",
                    "code_snippet": "<button className=\"bg-gray-200 text-gray-500\">\n  Submit\n</button>",
                    "fixed_code": "<button className=\"bg-blue-600 text-white font-bold hover:bg-blue-700\">\n  Submit\n</button>"
                },
                {
                    "category": "Accessibility",
                    "severity": "high",
                    "title": "Missing Alt Text on Hero Image",
                    "description": "Screen readers cannot describe the main image to visually impaired users because the 'alt' attribute is missing.",
                    "business_impact": "Medium",
                    "confidence_score": 100,
                    "estimated_fix_time": "2 minutes",
                    "recommendation": "Add descriptive alt text to the hero image.",
                    "selector": "img.hero-banner",
                    "code_snippet": "<img src=\"/hero.jpg\" className=\"w-full\" />",
                    "fixed_code": "<img src=\"/hero.jpg\" alt=\"Smiling team working in a modern office\" className=\"w-full\" />"
                }
            ]
        }
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return {"industry": "General", "issues": []}

def generate_chat_response(user_message: str, chat_history: list, audit_context: str, persona: str = "developer"):
    if persona == "ceo":
        system_prompt = f"""
        You are an expert UX/UI auditor and Business Strategist.
        You are speaking directly with a CEO/Executive. 
        Focus entirely on business impact, revenue risk, conversion rates, and ROI.
        DO NOT provide technical code snippets or CSS selectors.
        Keep answers concise, professional, and business-focused.
        
        Here is the context of the audit (the issues found):
        {audit_context}
        
        Answer the executive's questions clearly in terms of business value.
        """
    else:
        system_prompt = f"""
        You are an expert UX/UI auditor and Developer Assistant. 
        You are helping a developer fix issues found in their website audit.
        
        Here is the context of the audit (the issues found):
        {audit_context}
        
        Answer the developer's questions clearly, providing code snippets if necessary.
        """

    formatted_history = [{"role": "system", "content": system_prompt}]

    for msg in chat_history:
        formatted_history.append({
            "role": "assistant" if msg.role == "model" else "user",
            "content": msg.content,
        })

    formatted_history.append({
        "role": "user",
        "content": user_message,
    })
    
    try:
        return run_chat_completion(formatted_history)
    except AIProviderError as e:
        print(f"AIProviderError in generate_chat_response: {e}")
        return f"*(Mock Response)* Hello! The API key has run out of quota, so I'm running in offline mock mode to let you test the chat UI! Here is the context of your audit: {audit_context[:100]}..."
    except Exception as e:
        print(f"Error generating chat response: {e}")
        raise AIProviderError("The AI request failed while generating the chat response.")
