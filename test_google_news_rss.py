import requests
from bs4 import BeautifulSoup
import json
import xml.etree.ElementTree as ET

urls = [
    "https://news.google.com/rss/headlines/section/geo/BD?hl=en-BD&gl=BD&ceid=BD:en",
    "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en&gl=US&ceid=US:en"
]

feed_items = []
headers = {"User-Agent": "Mozilla/5.0"}

for url in urls:
    try:
        r = requests.get(url, headers=headers, timeout=5)
        root = ET.fromstring(r.content)
        for item in root.findall(".//item")[:5]:
            title = item.find("title").text if item.find("title") is not None else ""
            link = item.find("link").text if item.find("link") is not None else ""
            pubDate = item.find("pubDate").text if item.find("pubDate") is not None else ""
            feed_items.append({"title": title, "link": link, "pubDate": pubDate})
    except Exception as e:
        print(f"Error fetching {url}: {e}")

print(f"Extracted {len(feed_items)} live breaking headlines from Google News RSS right now:")
for i, item in enumerate(feed_items, 1):
    print(f"{i}. [{item['pubDate'][:16]}] {item['title']}")
