from google import genai
import os

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
models = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash-001', 'gemini-1.5-flash-002', 'gemini-1.5-pro']

for m in models:
    try:
        response = client.models.generate_content(model=m, contents="hi")
        print(f"SUCCESS: {m}")
    except Exception as e:
        print(f"FAILED: {m} - {e}")
