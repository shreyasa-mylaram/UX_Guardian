import json
import base64
import os
import google.generativeai as genai

# Setup Gemini API
# Assuming GEMINI_API_KEY is in environment
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

async def run_axe_core(page):
    """
    Injects axe-core into the playwright page and runs accessibility checks.
    """
    try:
        await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.0/axe.min.js")
        results = await page.evaluate("async () => { return await axe.run(); }")
        return results.get('violations', [])
    except Exception as e:
        print(f"Error running axe-core: {e}")
        return []

def generate_ai_analysis(dom_path, screenshot_path, axe_results):
    """
    Calls Gemini API to reason about the UI/UX and Accessibility issues.
    """
    if not api_key:
        print("GEMINI_API_KEY not set. Skipping AI analysis.")
        return []

    # Read the files
    with open(dom_path, "r", encoding="utf-8") as f:
        dom_content = f.read()
    
    # We might need to truncate the DOM if it's too large, but Gemini 1.5 Pro has a large context window.
    # For now, let's keep it simple.

    model = genai.GenerativeModel('gemini-1.5-pro')
    
    # Upload the image (or pass base64)
    # Using base64 for simplicity in this example
    with open(screenshot_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        
    image_parts = [
        {
            "mime_type": "image/png",
            "data": encoded_string
        }
    ]
    
    prompt = f"""
    You are an expert UX/UI auditor and Accessibility specialist.
    Analyze the provided screenshot of the website, its DOM HTML, and the automated axe-core accessibility violations.
    
    Axe-Core Violations: {json.dumps(axe_results)[:2000]} # Truncating to avoid huge prompts if many issues
    
    DOM Content (truncated to first 20000 chars): {dom_content[:20000]}
    
    Identify the top 5 UX/UI or Accessibility issues.
    For each issue, provide:
    1. "category": "Accessibility", "UX", "SEO", or "Performance"
    2. "severity": "low", "medium", "high", or "critical"
    3. "title": Short description of the issue.
    4. "description": Conversational explanation of root cause and business/user impact.
    5. "recommendation": How to fix it (conversational tone).
    6. "selector": CSS selector of the element, if applicable.
    7. "code_snippet": HTML/CSS of the current state, if applicable.
    8. "fixed_code": HTML/CSS using Tailwind CSS utility classes and React formatting (e.g. className instead of class) of the recommended fix.
    
    You must return a valid JSON array of objects.
    """

    try:
        response = model.generate_content(
            [prompt, image_parts[0]],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        # Parse the JSON response
        response_text = response.text.strip()
        issues = json.loads(response_text)
        return issues
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return []

def generate_chat_response(user_message: str, chat_history: list, audit_context: str):
    """
    Answers a developer's question about the audit using the Gemini API.
    """
    if not api_key:
        return "GEMINI_API_KEY not set. Cannot generate response."

    model = genai.GenerativeModel('gemini-1.5-pro')
    
    # Construct the system context
    system_prompt = f"""
    You are an expert UX/UI auditor and Developer Assistant. 
    You are helping a developer fix issues found in their website audit.
    
    Here is the context of the audit (the issues found):
    {audit_context}
    
    Answer the developer's questions clearly, providing code snippets if necessary.
    """
    
    # Format history for Gemini
    formatted_history = []
    for msg in chat_history:
        formatted_history.append({
            "role": "model" if msg.role == "model" else "user",
            "parts": [msg.content]
        })
    
    try:
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(f"SYSTEM CONTEXT: {system_prompt}\n\nUSER QUESTION: {user_message}")
        return response.text
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I'm sorry, I encountered an error while trying to answer your question."
