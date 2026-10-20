import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Testing gemini-3.5-flash-lite with Google Search grounding...")
    res = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents="What is one major news event in Bangladesh in the last 24 hours? Provide the title and outlet.",
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.2,
        ),
    )
    print("-> SUCCESS:")
    print(res.text)
except Exception as e:
    print(f"-> FAILED: {e}")
