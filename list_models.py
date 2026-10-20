import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    for m in client.models.list():
        print(f"Model: {m.name} | Methods: {getattr(m, 'supported_generation_methods', getattr(m, 'supported_actions', ''))}")
except Exception as e:
    print(f"Error listing models: {e}")
