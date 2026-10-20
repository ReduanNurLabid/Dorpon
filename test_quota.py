import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

models = ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"]

for m in models:
    try:
        print(f"Testing {m} plain prompt...")
        res = client.models.generate_content(
            model=m,
            contents="Say 'API OK' in 2 words."
        )
        print(f"-> SUCCESS with {m}: {res.text.strip()}")
        break
    except Exception as e:
        print(f"-> FAILED with {m}: {e}\n")
