import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

for m in ["gemini-flash-latest", "gemini-3.1-flash-lite"]:
    try:
        print(f"Testing {m} with search...")
        res = client.models.generate_content(
            model=m,
            contents="Top news headline today in 1 sentence",
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        print(f"SUCCESS with {m}: {res.text[:100]}")
        break
    except Exception as e:
        print(f"FAILED with {m}: {e}\n")
