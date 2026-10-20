import os
import json
import re
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Test gemini-3.5-flash with a pure standard prompt (no search tools)
article_context = """
Headline: China pulls out of $392m Sri Lanka port logistics venture
Outlet: The Daily Star Business
URL: https://www.thedailystar.net/business/global-economy/news/china-pulls-out-sri-lanka-port-logistics-venture-4302886
Raw facts: A Chinese state-owned firm has withdrawn from a $392 million joint venture to develop a major logistics hub at Sri Lanka’s main seaport, the key local partner said Monday. The Sri Lanka Ports Authority (SLPA) said China Merchants Port Holdings had decided not to proceed with the collaboration announced in 2023, but the project would continue. SLPA stated the decision was reached following an assessment of prevailing external circumstances, commercial considerations and interests of respective shareholders.
"""

prompt = f"""
You are the Chief News Editor for Dorpon Daily.
Read the following factual report from an external news outlet:
{article_context}

Task:
Write a completely original, concise news capsule for Dorpon Daily. Do NOT copy the source's prose verbatim.
Synthesize the key event, why it matters geopolitically/economically for competitive exam candidates and informed citizens, and properly cite the source.

Return a JSON object with:
- "title": Clean, punchy headline
- "category": "Geopolitics"
- "source_name": "The Daily Star"
- "source_url": "https://www.thedailystar.net/business/global-economy/news/china-pulls-out-sri-lanka-port-logistics-venture-4302886"
- "summary": 2-3 sentences of original, objective summary
- "exam_takeaway": 1 sentence highlighting the strategic relevance (e.g. Belt and Road Initiative, South Asian port politics)
- "read_time": "1 min"

Output JSON only.
"""

print("Testing gemini-3.5-flash standard prompt...")
try:
    res = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt
    )
    print("SUCCESS with gemini-3.5-flash standard prompt:")
    print(res.text)
except Exception as e:
    print(f"FAILED with gemini-3.5-flash: {e}")
    # Also test gemini-3.5-flash-lite as comparison
    try:
        res = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )
        print("SUCCESS with gemini-3.5-flash-lite:")
        print(res.text)
    except Exception as e2:
        print(f"FAILED lite: {e2}")
