import os
import json
import re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

prompt = """
You are the Chief News Editor for Dorpon Daily.
Current date/time: Morning of 20 October 2026.
Mission: Find 3 top breaking, high-impact news stories right now (Bangladesh national affairs or major international geopolitical/economic developments).

Use Google Search to find real, current articles published in the last 24 hours.

For each story, provide:
1. "headline": Clear, concise headline.
2. "category": "Bangladesh", "Economy", "Geopolitics", or "Technology".
3. "source_outlet": e.g. "The Daily Star", "Prothom Alo", "Reuters", "BBC", "Financial Express".
4. "source_url": Direct, verified article URL (MUST be a real, specific article link from Google Search, not a generic homepage).
5. "editorial_significance": 1-2 sentences on why this matters for competitive exam aspirants (BCS) and informed citizens.
6. "key_fact": 1 specific quantifiable stat or statement from the story.

Return ONLY a valid JSON array of 3 objects. No conversational preamble.
"""

print("[1/3] Querying Gemini 3.5 Flash with Google Search Grounding...")
try:
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.2,
        ),
    )
    raw_text = response.text
    print("\n--- SCOUT RESPONSE RECEIVED ---")
    print(raw_text)
except Exception as e:
    print(f"Error calling gemini-3.5-flash: {e}")
    raw_text = None

# Extract JSON
stories = []
if raw_text:
    # clean possible markdown ticks
    cleaned = re.sub(r"^```json\s*", "", raw_text.strip())
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        stories = json.loads(cleaned)
        print(f"\n[2/3] Successfully parsed {len(stories)} stories from Gemini scout.")
    except Exception as e:
        print(f"Failed to parse JSON: {e}")

# Scraper verification phase
print("\n[3/3] Testing Scraper against Scouted URLs...")
scraped_results = []
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for i, story in enumerate(stories, 1):
    url = story.get("source_url")
    print(f"\n--- Scraping Story #{i}: {story.get('headline')} ---")
    print(f"Target URL: {url}")
    scrape_log = {
        "story": story,
        "scraped": False,
        "http_status": None,
        "og_title": None,
        "og_image": None,
        "paragraphs_extracted": 0,
        "text_preview": "",
        "notes": []
    }
    
    if not url or not url.startswith("http"):
        scrape_log["notes"].append("Invalid or missing URL")
        scraped_results.append(scrape_log)
        continue

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        scrape_log["http_status"] = resp.status_code
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, "html.parser")
            
            # Extract og:image
            og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
            if og_img and og_img.get("content"):
                scrape_log["og_image"] = og_img["content"]
            
            # Extract og:title
            og_t = soup.find("meta", property="og:title")
            if og_t and og_t.get("content"):
                scrape_log["og_title"] = og_t["content"]
                
            # Extract main article paragraphs
            paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 50]
            scrape_log["paragraphs_extracted"] = len(paragraphs)
            scrape_log["text_preview"] = " ".join(paragraphs[:2])[:250] + "..." if paragraphs else "No long paragraphs found (might be JS rendered or paywalled)"
            scrape_log["scraped"] = True
            
            print(f"-> HTTP {resp.status_code} OK")
            print(f"-> og:image found: {scrape_log['og_image']}")
            print(f"-> Paragraphs extracted: {scrape_log['paragraphs_extracted']}")
            print(f"-> Text preview: {scrape_log['text_preview'][:120]}...")
        else:
            scrape_log["notes"].append(f"HTTP status code {resp.status_code}")
            print(f"-> HTTP Error: {resp.status_code}")
    except Exception as err:
        scrape_log["notes"].append(str(err))
        print(f"-> Scrape error: {err}")
        
    scraped_results.append(scrape_log)

# Save final report to JSON
with open("scout_pipeline_test_report.json", "w", encoding="utf-8") as f:
    json.dump({
        "timestamp": "2026-10-20T07:45:00+06:00",
        "model_used": "gemini-3.5-flash",
        "results": scraped_results
    }, f, indent=2, ensure_ascii=False)

print("\n✓ Pipeline test complete! Saved to scout_pipeline_test_report.json")
