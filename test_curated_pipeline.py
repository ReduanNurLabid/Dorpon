import os
import re
import json
import requests
import feedparser
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("=" * 60)
print("DORPON AI EDITORIAL SCOUT + SCRAPER LIVE TEST")
print("Target Date/Time: ~7:45 AM, 20 October 2026")
print("=" * 60)

# STEP 1: Gather raw candidate feed items
feed_sources = [
    ("The Daily Star Business", "https://www.thedailystar.net/business/rss.xml"),
    ("BBC World News", "https://feeds.bbci.co.uk/news/world/rss.xml"),
    ("Google News BD", "https://news.google.com/rss/headlines/section/geo/BD?hl=en-BD&gl=BD&ceid=BD:en")
]

raw_candidates = []
for source_name, url in feed_sources:
    try:
        parsed = feedparser.parse(url)
        for entry in parsed.entries[:6]:
            title = BeautifulSoup(entry.title, "html.parser").get_text()
            summary = BeautifulSoup(getattr(entry, 'summary', ''), "html.parser").get_text()[:200]
            raw_candidates.append({
                "source": source_name,
                "title": title,
                "link": entry.link,
                "summary": summary
            })
    except Exception as e:
        print(f"Error reading {source_name}: {e}")

print(f"\n[Phase 1] Harvested {len(raw_candidates)} candidate stories across feeds.")

# STEP 2: Gemini 3.5 Flash Editorial Curation
editor_prompt = f"""
You are the Chief News Editor for Dorpon Daily (a premier news & BCS exam prep intelligence platform).
Date: 20 October 2026.

Here is a raw list of candidate stories harvested from live feeds:
{json.dumps(raw_candidates, indent=2)}

YOUR EDITORIAL TASK:
1. FILTER OUT all local corporate PR, trivial updates, filler, or fluff (e.g., bank promotions, routine store openings).
2. SELECT exactly 3 of the most impactful stories with high strategic, geopolitical, or economic consequence.
3. For each selected story, provide:
   - "selected_title": Crisp, authoritative headline.
   - "category": One of ("Bangladesh", "Economy", "Geopolitics", "Technology").
   - "source_outlet": Outlet name.
   - "target_url": The exact link provided in the candidate data.
   - "editorial_reason": Why this matters for competitive exam candidates and leaders.
   - "key_angle": What the core friction or fact is.

Return ONLY a valid JSON array of 3 objects.
"""

print("\n[Phase 2] Prompting Gemini 3.5 Flash to act as Chief Editor & Curate Top 3...")
# Notice: we use gemini-3.5-flash-lite or gemini-3.5-flash
selected_stories = []
for model_candidate in ["gemini-3.5-flash-lite", "gemini-flash-latest"]:
    try:
        res = client.models.generate_content(
            model=model_candidate,
            contents=editor_prompt
        )
        cleaned = re.sub(r"^```json\s*", "", res.text.strip())
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        selected_stories = json.loads(cleaned)
        print(f"-> Curated successfully using {model_candidate}!")
        break
    except Exception as err:
        print(f"-> Model {model_candidate} attempt note: {err}")

print(f"\n[Phase 2 Output] Gemini Editor Selected {len(selected_stories)} Stories:")
for i, s in enumerate(selected_stories, 1):
    print(f" {i}. [{s.get('category')}] {s.get('selected_title')}")
    print(f"    Why: {s.get('editorial_reason')}")
    print(f"    Target URL: {s.get('target_url')}")

# STEP 3: Scraper Extraction on Curated URLs
print("\n[Phase 3] Scraping Deep Content & Metadata from Selected Targets...")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

scraped_entries = []
for s in selected_stories:
    url = s.get("target_url")
    result = {
        "title": s.get("selected_title"),
        "category": s.get("category"),
        "outlet": s.get("source_outlet"),
        "url": url,
        "og_image": None,
        "clean_paragraphs": [],
        "scraped_status": "PENDING"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        result["http_status"] = resp.status_code
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, "html.parser")
            og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
            if og_img and og_img.get("content"):
                result["og_image"] = og_img["content"]
            
            # Extract content paragraphs
            paras = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 60]
            result["clean_paragraphs"] = paras[:4]
            result["scraped_status"] = "SUCCESS" if paras else "NO_PARAGRAPHS"
        else:
            result["scraped_status"] = f"HTTP_{resp.status_code}"
    except Exception as e:
        result["scraped_status"] = f"ERROR: {e}"
        
    scraped_entries.append(result)

# Output summary log
print("\n" + "=" * 60)
print("LIVE SCRAPE PIPELINE RESULTS:")
print("=" * 60)
for i, item in enumerate(scraped_entries, 1):
    print(f"\nStory #{i}: {item['title']}")
    print(f"Status: {item['scraped_status']}")
    print(f"Image OG URL: {item['og_image']}")
    print(f"Extracted Paragraphs Count: {len(item['clean_paragraphs'])}")
    if item['clean_paragraphs']:
        print(f"Lead Paragraph: {item['clean_paragraphs'][0][:140]}...")

with open("live_test_output.json", "w", encoding="utf-8") as f:
    json.dump({
        "timestamp": "2026-10-20T07:45:00+06:00",
        "curated": selected_stories,
        "scraped": scraped_entries
    }, f, indent=2, ensure_ascii=False)

print("\nFull log saved to live_test_output.json")
