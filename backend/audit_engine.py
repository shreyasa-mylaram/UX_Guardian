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
    1. Category (Accessibility, UX, SEO, Performance)
    2. Severity (low, medium, high, critical)
    3. Title (Short description)
    4. Description (Conversational explanation of root cause and business/user impact)
    5. Recommendation (How to fix it)
    6. Selector (CSS selector of the element, if applicable)
    7. Code Snippet (HTML/CSS of the current state, if applicable)
    8. Fixed Code (HTML/CSS/Tailwind of the recommended fix)
    
    Return the response as a JSON array of objects with the exact keys: category, severity, title, description, recommendation, selector, code_snippet, fixed_code.
    Ensure the JSON is valid and ONLY output JSON. Do not include markdown code block syntax (like ```json).
    """

    try:
        response = model.generate_content([prompt, image_parts[0]])
        # Parse the JSON response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        issues = json.loads(response_text)
        return issues
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return []
