import feedparser

feeds = [
    ("The Daily Star Frontpage", "https://www.thedailystar.net/frontpage/rss.xml"),
    ("The Daily Star Business", "https://www.thedailystar.net/business/rss.xml"),
    ("Financial Express", "https://thefinancialexpress.com.bd/feed"),
    ("Reuters World", "https://feeds.bbci.co.uk/news/world/rss.xml"),
]

for name, url in feeds:
    d = feedparser.parse(url)
    print(f"=== {name} (Entries: {len(d.entries)}) ===")
    for entry in d.entries[:3]:
        print(f" - {entry.title} ({entry.link})")
