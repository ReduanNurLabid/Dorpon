import sys
import feedparser
import uuid
import re
import requests
import calendar
import datetime
import email.utils
from bs4 import BeautifulSoup
from typing import List, Set, Optional

if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8')

from pipeline.config import FEEDS, SECTION_TARGETS, DEFAULT_HEADERS, EXCLUSION_KEYWORDS
from pipeline.models import RawArticle

def parse_entry_datetime(entry) -> Optional[datetime.datetime]:
    """Parses publication datetime into a UTC-aware datetime object."""
    if getattr(entry, "published_parsed", None):
        try:
            epoch = calendar.timegm(entry.published_parsed)
            return datetime.datetime.fromtimestamp(epoch, tz=datetime.timezone.utc)
        except Exception:
            pass
    raw = getattr(entry, "published", "") or getattr(entry, "pubDate", "")
    if raw:
        try:
            dt = email.utils.parsedate_to_datetime(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            return dt.astimezone(datetime.timezone.utc)
        except Exception:
            pass
    return None

def is_excluded(title: str, summary: str = "") -> bool:
    """Checks whether an article falls into excluded categories (sports, showbiz, gossip)."""
    text = (title + " " + summary).lower()
    for kw in EXCLUSION_KEYWORDS:
        if kw in text:
            return True
    return False

def clean_html_tags(raw_html: str) -> str:
    """Strips HTML tags and extra whitespaces."""
    if not raw_html:
        return ""
    clean = re.sub(r"<[^>]+>", " ", raw_html)
    return " ".join(clean.split())

def fetch_section_candidates() -> List[RawArticle]:
    """Fetches candidate articles from direct section pages (for sources without working RSS)."""
    candidates: List[RawArticle] = []
    
    for sec in SECTION_TARGETS:
        try:
            print(f"🌐 Crawling section for {sec['name']} ({sec['url']})...")
            resp = requests.get(sec["url"], headers=DEFAULT_HEADERS, timeout=4)
            if resp.status_code != 200:
                continue
                
            soup = BeautifulSoup(resp.content, "html.parser")
            seen_links = set()
            
            if "financialexpress" in sec["url"]:
                # FE article links are like: /economy/... or /global/...
                for a in soup.find_all("a", href=True):
                    href = a["href"].strip()
                    title = a.get_text().strip()
                    if len(title) > 25 and ("/economy/" in href or "/national/" in href):
                        full_url = href if href.startswith("http") else f"{sec['base_url']}{href}"
                        if full_url not in seen_links and not is_excluded(title):
                            seen_links.add(full_url)
                            candidates.append(RawArticle(
                                id=str(uuid.uuid5(uuid.NAMESPACE_URL, full_url)),
                                source=sec["name"],
                                url=full_url,
                                title=title,
                                summary_raw=title,
                                language=sec["language"],
                                category_hint=sec["category_hint"]
                            ))
                            if len(seen_links) >= 8:
                                break
                                
            elif "bssnews" in sec["url"]:
                # BSS article links are like: https://www.bssnews.net/news/<id>
                for a in soup.find_all("a", href=True):
                    href = a["href"].strip()
                    title = a.get_text().strip()
                    if href.startswith("https://www.bssnews.net/news/") and any(c.isdigit() for c in href):
                        if len(title) > 20 and href not in seen_links and not is_excluded(title):
                            seen_links.add(href)
                            candidates.append(RawArticle(
                                id=str(uuid.uuid5(uuid.NAMESPACE_URL, href)),
                                source=sec["name"],
                                url=href,
                                title=title,
                                summary_raw=title,
                                language=sec["language"],
                                category_hint=sec["category_hint"]
                            ))
                            if len(seen_links) >= 8:
                                break
                                
        except Exception as e:
            print(f"⚠️ Error crawling section {sec['name']}: {e}")
            
    return candidates

def fetch_rss_candidates(max_age_hours: Optional[float] = None) -> List[RawArticle]:
    """
    Fetches candidate articles from all verified live RSS feeds and section targets.
    If max_age_hours is set (e.g. 2.0 for live hourly wires), strictly filters out older news.
    """
    candidates: List[RawArticle] = []
    seen_urls: Set[str] = set()
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    
    # 1. Fetch from live RSS feeds
    for feed_key, feed_meta in FEEDS.items():
        try:
            print(f"📡 Fetching RSS from {feed_meta['name']} ({feed_meta['url']})...")
            resp = requests.get(feed_meta["url"], headers=DEFAULT_HEADERS, timeout=4)
            if resp.status_code != 200:
                continue
            parsed = feedparser.parse(resp.content)
            entries = parsed.entries or []
            print(f"   Found {len(entries)} entries in {feed_meta['name']}")
            
            for entry in entries:
                title = clean_html_tags(getattr(entry, "title", "")).strip()
                link = getattr(entry, "link", "").strip()
                summary = clean_html_tags(getattr(entry, "summary", "") or getattr(entry, "description", ""))
                published = getattr(entry, "published", "") or getattr(entry, "pubDate", "")
                
                if not title or not link or link in seen_urls:
                    continue

                # Strict Freshness Filter for Live Hourly Wires
                if max_age_hours is not None:
                    pub_dt = parse_entry_datetime(entry)
                    if pub_dt:
                        age_hours = (now_utc - pub_dt).total_seconds() / 3600.0
                        if age_hours > max_age_hours or age_hours < -0.5:
                            continue
                
                # Filter out sports, entertainment, horoscope, petty crime
                if is_excluded(title, summary):
                    continue
                
                # Check for photo galleries and videos
                if any(x in link for x in ["/photo/", "/videos/", "/video/", "/gallery/"]):
                    continue
                
                seen_urls.add(link)
                article_id = str(uuid.uuid5(uuid.NAMESPACE_URL, link))
                
                article = RawArticle(
                    id=article_id,
                    source=feed_meta["name"],
                    url=link,
                    title=title,
                    summary_raw=summary,
                    published_at=published,
                    language=feed_meta["language"],
                    category_hint=getattr(entry, "category", None)
                )
                candidates.append(article)
                
        except Exception as e:
            print(f"⚠️ Error fetching feed {feed_key}: {e}")
            
    # 2. Fetch from direct section fallbacks (Financial Express, BSS News)
    # Only include if not strictly capped to fresh 2-hour window or if fresh
    if max_age_hours is None or max_age_hours >= 6:
        section_candidates = fetch_section_candidates()
        for sc in section_candidates:
            if sc.url not in seen_urls:
                seen_urls.add(sc.url)
                candidates.append(sc)
            
    print(f"✅ Total clean candidate articles fetched across all sources: {len(candidates)}")
    return candidates
