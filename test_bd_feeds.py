import requests
import xml.etree.ElementTree as ET

bd_feeds = [
    ("The Daily Star", "https://www.thedailystar.net/frontpage/rss.xml"),
    ("Financial Express", "https://thefinancialexpress.com.bd/feed/"),
    ("Prothom Alo Eng", "https://en.prothomalo.com/feed")
]

headers = {"User-Agent": "Mozilla/5.0"}
all_articles = []

for name, feed_url in bd_feeds:
    try:
        r = requests.get(feed_url, headers=headers, timeout=6)
        if r.status_code == 200:
            root = ET.fromstring(r.content)
            count = 0
            for item in root.findall(".//item")[:4]:
                title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                desc = item.find("description").text if item.find("description") is not None else ""
                pubDate = item.find("pubDate").text if item.find("pubDate") is not None else ""
                all_articles.append({
                    "outlet": name,
                    "title": title,
                    "link": link,
                    "snippet": desc[:150],
                    "pubDate": pubDate
                })
                count += 1
            print(f"[{name}] Successfully fetched {count} articles.")
        else:
            print(f"[{name}] HTTP status {r.status_code}")
    except Exception as e:
        print(f"[{name}] Error: {e}")

print(f"\nTotal live candidate articles collected: {len(all_articles)}")
for i, a in enumerate(all_articles, 1):
    print(f"{i}. [{a['outlet']}] {a['title']}")
