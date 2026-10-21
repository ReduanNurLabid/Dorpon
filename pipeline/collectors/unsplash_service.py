"""
Dorpon Daily - Unsplash Image Service
--------------------------------------
Fetches a contextually relevant photo from the Unsplash API using a
keyword derived from the story's category and headline.

API Reference: https://unsplash.com/documentation#search-photos

Environment variable required:
    UNSPLASH_ACCESS_KEY  — Your Unsplash app's Access Key (public).
                           Get one at https://unsplash.com/developers

Usage:
    from pipeline.collectors.unsplash_service import fetch_unsplash_image
    image_url = fetch_unsplash_image("flood Bangladesh climate")
"""

import os
import re
import time
import requests
from typing import Optional

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
UNSPLASH_API_BASE = "https://api.unsplash.com"
UNSPLASH_SEARCH_ENDPOINT = f"{UNSPLASH_API_BASE}/search/photos"

# Desired photo orientation for news cards (landscape fits best)
DEFAULT_ORIENTATION = "landscape"

# Per-category fallback keyword bank so we always have a meaningful query
# even when the headline yields no good tokens.
CATEGORY_FALLBACK_KEYWORDS = {
    "economy_business":   "finance economy bangladesh",
    "governance_law":     "parliament law court bangladesh",
    "tech_innovation":    "technology innovation digital",
    "climate_environment":"nature climate flood bangladesh",
    "world_diplomacy":    "diplomacy world politics flag",
    "society_education":  "education university students bangladesh",
}


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def build_search_query(headline: str, category: str, max_tokens: int = 4) -> str:
    """
    Derives a clean English search query from a headline + category.

    Strategy:
      1. Strip Bengali Unicode, punctuation, and common stop-words.
      2. Take up to `max_tokens` meaningful tokens from the headline.
      3. Append a broad English category hint for richer results.

    Args:
        headline:   Story headline (may contain Bengali/English mix).
        category:   Canonical interest category slug (e.g. 'economy_business').
        max_tokens: Maximum number of headline tokens to keep.

    Returns:
        A short English search string ready for the Unsplash API.
    """
    STOP_WORDS = {
        # English
        "the", "a", "an", "and", "or", "but", "for", "with", "from", "of",
        "on", "in", "at", "to", "by", "as", "is", "are", "was", "were",
        "has", "have", "had", "its", "be", "this", "that", "over", "up",
        "new", "two", "three", "four", "five", "six", "vs",
        # Filler news words
        "says", "report", "update", "news", "daily", "latest", "breaking",
    }

    # 1. Drop all Bengali/non-ASCII characters
    ascii_text = re.sub(r"[^\x00-\x7F]+", " ", headline)

    # 2. Extract alphabetic tokens, lower-cased
    tokens = re.findall(r"[a-zA-Z]{3,}", ascii_text)
    meaningful = [t.lower() for t in tokens if t.lower() not in STOP_WORDS]

    headline_part = " ".join(meaningful[:max_tokens])

    # 3. Attach a broad category hint for visual relevance
    category_hint = {
        "economy_business":   "business",
        "governance_law":     "government",
        "tech_innovation":    "technology",
        "climate_environment":"environment",
        "world_diplomacy":    "diplomacy",
        "society_education":  "education",
    }.get(category, "")

    query_parts = [p for p in [headline_part, category_hint] if p]
    query = " ".join(query_parts).strip()

    # 4. Fallback to category keyword bank if nothing useful survived
    if not query or len(query) < 4:
        query = CATEGORY_FALLBACK_KEYWORDS.get(category, "bangladesh news")

    return query


def fetch_unsplash_image(
    query: str,
    category: str = "",
    orientation: str = DEFAULT_ORIENTATION,
    timeout: int = 8,
) -> Optional[str]:
    """
    Searches Unsplash for a photo matching `query` and returns the
    regular-size image URL (≈1080 px wide), or None on any failure.

    The function:
      - Uses the Unsplash Search Photos endpoint (/search/photos).
      - Picks the **first result** (highest relevance rank).
      - Returns the `regular` URL (good quality, not oversized).
      - Appends `?utm_source=dorpon_daily&utm_medium=referral` as required
        by the Unsplash API Terms of Service (hotlinking attribution).
      - Falls back silently to None so the pipeline can use og:image instead.

    Args:
        query:       Search keyword string.
        category:    Category slug used for fallback query if primary fails.
        orientation: 'landscape' | 'portrait' | 'squarish'
        timeout:     HTTP request timeout in seconds.

    Returns:
        str  — Unsplash image URL  (regular size, with UTM attribution)
        None — if API key missing, quota exceeded, or no results found.
    """
    access_key = os.getenv("UNSPLASH_ACCESS_KEY", "").strip()
    if not access_key:
        print("   ⚠️  UNSPLASH_ACCESS_KEY not set — skipping Unsplash image fetch.")
        return None

    def _search(q: str) -> Optional[str]:
        """Inner helper: perform one Unsplash search and return URL or None."""
        headers = {
            "Authorization": f"Client-ID {access_key}",
            "Accept-Version": "v1",
        }
        params = {
            "query":       q,
            "orientation": orientation,
            "per_page":    1,
            "content_filter": "high",  # Safe-for-all-audiences content filter
        }
        try:
            resp = requests.get(
                UNSPLASH_SEARCH_ENDPOINT,
                headers=headers,
                params=params,
                timeout=timeout,
            )

            if resp.status_code == 401:
                print("   ❌ Unsplash: Invalid Access Key (401). Check UNSPLASH_ACCESS_KEY.")
                return None

            if resp.status_code == 403:
                print("   ❌ Unsplash: Rate limit or permission denied (403).")
                return None

            if resp.status_code == 429:
                # Unsplash free tier: 50 requests/hour
                print("   ⚠️  Unsplash: Rate-limited (429). Hourly quota exceeded.")
                return None

            if resp.status_code != 200:
                print(f"   ⚠️  Unsplash: Unexpected status {resp.status_code} for query '{q}'.")
                return None

            data = resp.json()
            results = data.get("results", [])
            if not results:
                return None

            photo = results[0]
            urls = photo.get("urls", {})
            raw_url = urls.get("regular") or urls.get("full") or urls.get("small")
            if not raw_url:
                return None

            # Append required UTM attribution per Unsplash API Terms
            separator = "&" if "?" in raw_url else "?"
            attributed_url = f"{raw_url}{separator}utm_source=dorpon_daily&utm_medium=referral"

            photographer = photo.get("user", {}).get("name", "Unknown")
            print(f"   🖼️  Unsplash image found for '{q}' (Photo by {photographer} on Unsplash)")
            return attributed_url

        except requests.exceptions.Timeout:
            print(f"   ⚠️  Unsplash: Request timed out for query '{q}'.")
            return None
        except requests.exceptions.RequestException as exc:
            print(f"   ⚠️  Unsplash: Network error — {exc}")
            return None
        except (KeyError, ValueError) as exc:
            print(f"   ⚠️  Unsplash: Unexpected response format — {exc}")
            return None

    # Primary search attempt
    url = _search(query)
    if url:
        return url

    # Fallback: use category keyword bank for a broader query
    if category:
        fallback_query = CATEGORY_FALLBACK_KEYWORDS.get(category, "bangladesh")
        if fallback_query and fallback_query != query:
            print(f"   🔄 Unsplash: Retrying with category fallback query '{fallback_query}'...")
            time.sleep(0.3)
            url = _search(fallback_query)

    return url


def fetch_story_image(
    headline_en: str,
    headline_bn: str,
    category: str,
    existing_image_url: Optional[str] = None,
) -> Optional[str]:
    """
    High-level convenience wrapper used by the pipeline.

    Logic:
      1. If `existing_image_url` is already a good scraped og:image, return it
         unchanged (saves Unsplash quota).
      2. Otherwise, build a query from the English headline + category and
         call the Unsplash API.

    Args:
        headline_en:        English headline from the synthesizer.
        headline_bn:        Bengali headline (used only as signal; not sent to API).
        category:           Canonical category slug.
        existing_image_url: og:image scraped from the source article (may be None).

    Returns:
        The best available image URL, or None.
    """
    # Prefer good og:image already scraped; skip Unsplash if we have one
    if existing_image_url and existing_image_url.startswith("http"):
        return existing_image_url

    query = build_search_query(headline_en or headline_bn or "", category)
    return fetch_unsplash_image(query, category=category)
