"""
Dorpon Daily - Firestore Duplicate Cleanup & Source Consolidator
---------------------------------------------------------------
Scans 'daily_buzz' and 'hourly_buzz' collections in Firestore.
Identifies duplicate stories covering the exact same news event.
Consolidates distinct sources into a canonical document and deletes duplicates.
"""

import re
import sys
from typing import Set, Dict, List, Any
from collections import defaultdict

if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8')

from pipeline.storage.firebase_service import get_firestore_client

STOPWORDS = {
    'to', 'for', 'on', 'in', 'and', 'the', 'a', 'an', 'of', 'with', 'after', 'by', 'at', 'from', 'is', 'are', 'over',
    'this', 'that', 'claims', 'warns', 'urges', 'states', 'holds', 'makes', 'summary', 'about', 'first', 'into',
    'এর', 'ও', 'এবং', 'নিয়ে', 'হতে', 'থেকে', 'করা', 'হয়েছে', 'জন্য', 'পর', 'দাবি', 'জানালেন', 'নিয়ে'
}

# Specific high-signal tokens where 2 matches mean identical event
HIGH_SIGNAL_PAIRS = {
    ('tarique', 'japan'), ('tariq', 'japan'), ('tarique', 'tokyo'), ('tariq', 'tokyo'),
    ('ishraque', 'resignation'), ('ishraq', 'resignation'), ('ishraque', 'পদত্যাগ'),
    ('hegseth', 'israel'), ('hegseth', 'defense'),
    ('nahid', 'resignation'), ('nahid', 'home minister'),
    ('rohingya', 'aid'), ('rohingya', 'humanitarian'),
    ('secretariat', 'buildings'), ('secretariat', 'sher-e-bangla'),
}

def extract_meaningful_tokens(text: str) -> Set[str]:
    if not text:
        return set()
    words = re.findall(r'[\w\u0980-\u09FF]{3,}', text.lower())
    return {w for w in words if w not in STOPWORDS}

def are_duplicate_titles(t1: str, t2: str) -> bool:
    s1 = extract_meaningful_tokens(t1)
    s2 = extract_meaningful_tokens(t2)
    if not s1 or not s2:
        return False

    overlap = s1 & s2

    # Check high signal pairs
    combined = s1 | s2
    for tok_a, tok_b in HIGH_SIGNAL_PAIRS:
        if tok_a in combined and tok_b in combined:
            if (tok_a in s1 or tok_b in s1) and (tok_a in s2 or tok_b in s2):
                return True

    # 3+ significant token overlap
    if len(overlap) >= 3:
        return True

    # Similarity ratio >= 0.45 with at least 2 tokens
    ratio = len(overlap) / min(len(s1), len(s2))
    if ratio >= 0.45 and len(overlap) >= 2:
        return True

    return False

def cleanup_collection(db, collection_name: str):
    print(f"\n========================================================")
    print(f"🧹 Scanning collection '{collection_name}' for duplicates...")
    print(f"========================================================")

    docs = list(db.collection(collection_name).stream())
    print(f"Fetched {len(docs)} documents.")

    stories = []
    for d in docs:
        data = d.to_dict()
        data["_doc_id"] = d.id
        buzz = data.get("daily_buzz", {})
        title = buzz.get("title_en") or buzz.get("title_bn") or data.get("primary_title") or ""
        data["_title"] = title
        stories.append(data)

    # Cluster duplicates
    clusters: List[List[Dict[str, Any]]] = []
    assigned = set()

    for i, s1 in enumerate(stories):
        if s1["_doc_id"] in assigned:
            continue
        cluster = [s1]
        assigned.add(s1["_doc_id"])

        for j in range(i + 1, len(stories)):
            s2 = stories[j]
            if s2["_doc_id"] in assigned:
                continue

            # Compare titles (English or Bangla)
            t1_en = (s1.get("daily_buzz") or {}).get("title_en") or ""
            t2_en = (s2.get("daily_buzz") or {}).get("title_en") or ""
            t1_bn = (s1.get("daily_buzz") or {}).get("title_bn") or ""
            t2_bn = (s2.get("daily_buzz") or {}).get("title_bn") or ""

            match = False
            if t1_en and t2_en and are_duplicate_titles(t1_en, t2_en):
                match = True
            elif t1_bn and t2_bn and are_duplicate_titles(t1_bn, t2_bn):
                match = True
            elif are_duplicate_titles(s1["_title"], s2["_title"]):
                match = True

            if match:
                cluster.append(s2)
                assigned.add(s2["_doc_id"])

        clusters.append(cluster)

    duplicates_found = 0
    docs_deleted = 0

    for cluster in clusters:
        if len(cluster) <= 1:
            continue

        duplicates_found += len(cluster) - 1
        # Pick the canonical story: prefer one with image or longest summary/title
        canonical = max(cluster, key=lambda x: (
            1 if x.get("image_url") else 0,
            len(x.get("sources", [])),
            len((x.get("daily_buzz") or {}).get("summary_en") or "")
        ))

        canonical_id = canonical["_doc_id"]
        print(f"\n📌 Canonical story: [{canonical_id[:8]}] {canonical['_title'][:65]}")

        # Consolidate all sources
        all_sources = []
        seen_urls = set()
        for c in cluster:
            for src in c.get("sources", []):
                url = src.get("url") or src.get("name")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_sources.append(src)

        # Update canonical document with combined sources
        db.collection(collection_name).document(canonical_id).update({
            "sources": all_sources
        })
        print(f"   ✅ Consolidated {len(all_sources)} sources into canonical doc.")

        # Delete the redundant duplicate documents
        for c in cluster:
            dup_id = c["_doc_id"]
            if dup_id != canonical_id:
                print(f"   🗑️ Deleting duplicate: [{dup_id[:8]}] {c['_title'][:55]}")
                db.collection(collection_name).document(dup_id).delete()
                docs_deleted += 1

    print(f"\n✨ Cleanup finished for '{collection_name}':")
    print(f"   Duplicate events detected: {duplicates_found}")
    print(f"   Redundant docs deleted: {docs_deleted}")
    print(f"   Unique stories remaining: {len(stories) - docs_deleted}")

def main():
    db = get_firestore_client()
    cleanup_collection(db, "daily_buzz")
    cleanup_collection(db, "hourly_buzz")

if __name__ == "__main__":
    main()
