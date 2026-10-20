import os
import sys
import re
import json
import argparse
from datetime import datetime

# Ensure utf-8 output encoding for Bengali and emoji on Windows
if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8')

from pipeline.collectors.rss_fetcher import fetch_rss_candidates
from pipeline.collectors.article_scraper import scrape_article_body, scrape_article_details
from pipeline.processing.deduplicator import cluster_and_tag_articles
from pipeline.processing.selector import select_stories_for_audiences
from pipeline.processing.synthesizer import synthesize_story_with_ai
from pipeline.models import DailyCapsule, CapsuleStory
from pipeline.storage.firebase_service import (
    push_hourly_buzz_to_firestore,
    stage_bcs_pro_draft_to_firestore,
    publish_bcs_pro_edition
)

def run_hourly_buzz(limit: int = 8):
    """
    Track A: Fast Hourly Path (Automated).
    Ingests latest breaking news across BD and Tech, generates 60-second bilingual summaries,
    and updates the hourly feed for general users.
    """
    now = datetime.now()
    timestamp_str = now.strftime("%Y-%m-%d %H:%M")
    print(f"\n========================================================")
    print(f"⚡ DORPON DAILY HOURLY INGESTION: {timestamp_str}")
    print(f"========================================================")
    
    # 1. Fetch fresh candidate articles (strictly within last 2.5 hours for Live Hourly Wires)
    candidates = fetch_rss_candidates(max_age_hours=2.5)
    if not candidates:
        print("⚠️ No articles in 2.5h window, checking up to 5 hours...")
        candidates = fetch_rss_candidates(max_age_hours=5.0)
    if not candidates:
        print("❌ No fresh articles fetched. Exiting.")
        return None
        
    # 2. Scrape bodies and optional og:image for top candidate articles (first 16)
    print(f"\n📖 Scraping full bodies and lead images for fresh candidates...")
    for art in candidates[:16]:
        details = scrape_article_details(art.url)
        if details.get("body_text"):
            art.body_text = details["body_text"]
        if details.get("image_url"):
            art.image_url = details["image_url"]
            
    # 3. Cross-lingual deduplication & clustering
    print(f"\n🔍 Cross-lingual entity clustering...")
    clusters = cluster_and_tag_articles(candidates)
    print(f"   Generated {len(clusters)} unique event clusters.")
    
    # 4. Synthesize 60-second Daily Buzz summaries with Topic Diversity (Zero Duplication)
    print(f"\n🤖 Generating 60-second Daily Buzz summaries (diverse topics)...")
    buzz_stories = []
    seen_entities = set()
    seen_story_tokens = []
    GENERIC_THEMATIC_ENTITIES = {"interim_cabinet", "bnp_politics", "election_commission", "anti_corruption"}

    for cluster in clusters:
        # Check topic repetition against already-selected hourly stories
        specific_entities = cluster.canonical_entities - GENERIC_THEMATIC_ENTITIES
        if specific_entities and specific_entities.intersection(seen_entities):
            print(f"   ⏩ Skipping duplicate topic cluster: {cluster.primary_title[:50]} (entity: {specific_entities})")
            continue
            
        # Title token similarity check: ensure no 2 stories share 2+ significant title tokens
        art_tokens = set(re.findall(r"\w{4,}", cluster.primary_title.lower()))
        is_duplicate = False
        for prev_tokens in seen_story_tokens:
            if len(art_tokens & prev_tokens) >= 2:
                is_duplicate = True
                break
        if is_duplicate:
            print(f"   ⏩ Skipping title-duplicate cluster: {cluster.primary_title[:50]}")
            continue

        story = synthesize_story_with_ai(cluster, is_bcs_pro=False)
        item = story.model_dump()
        item.pop("bcs_pro", None)  # Lightweight payload for free buzz
        buzz_stories.append(item)
        if specific_entities:
            seen_entities.update(specific_entities)
        seen_story_tokens.append(art_tokens)

        if len(buzz_stories) >= limit:
            break
        
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "output")
    os.makedirs(output_dir, exist_ok=True)
    hourly_path = os.path.join(output_dir, "hourly_buzz_latest.json")
    
    payload = {
        "updated_at": now.isoformat(),
        "total_stories": len(buzz_stories),
        "stories": buzz_stories
    }
    
    with open(hourly_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        
    print(f"\n💾 Saved {len(buzz_stories)} hourly buzz stories to: {hourly_path}")

    # Step 5: Sync directly to Cloud Firestore 'daily_buzz' collection
    try:
        pushed = push_hourly_buzz_to_firestore(buzz_stories)
        print(f"🔥 Successfully synced {pushed} stories to Firestore 'daily_buzz' collection!")
    except Exception as e:
        print(f"⚠️ Warning: Could not sync to Firestore ({e})")

    print(f"========================================================")
    print(f"✅ HOURLY BUZZ UPDATE COMPLETE")
    print(f"========================================================\n")
    return payload

def run_daily_pipeline(bcs_count: int = 4, pool_count: int = 8) -> DailyCapsule:
    """
    Track B: BCS Pro Academic Layer (Civilsdaily Standard).
    Produces the curated 7-section Civilsdaily draft awaiting human editor approval.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"\n========================================================")
    print(f"🌅 DORPON DAILY ACADEMIC PIPELINE: {today_str}")
    print(f"========================================================")
    
    # Step 1: Fetch candidate articles from RSS + Sections
    candidates = fetch_rss_candidates()
    if not candidates:
        print("❌ No candidate articles fetched. Exiting.")
        return None
        
    # Step 2: Scrape bodies and lead images for top candidate articles (first 16)
    print(f"\n📖 Scraping full bodies and lead images for top candidate articles...")
    for art in candidates[:16]:
        details = scrape_article_details(art.url)
        if details.get("body_text"):
            art.body_text = details["body_text"]
        if details.get("image_url"):
            art.image_url = details["image_url"]
            
    # Step 3: Cluster, deduplicate, and compute BCS relevance
    print(f"\n🔍 Clustering events with bilingual entity co-occurrence & scoring BPSC relevance...")
    clusters = cluster_and_tag_articles(candidates)
    print(f"   Generated {len(clusters)} unique event clusters.")
    
    # Step 4: Audience Selection (BCS Pro Preset vs Daily Buzz Interest Pool)
    print(f"\n🎯 Routing stories for audiences:")
    bcs_clusters, pool_clusters = select_stories_for_audiences(
        clusters, bcs_limit=bcs_count, total_pool_limit=pool_count
    )
    bcs_ids = {c.cluster_id for c in bcs_clusters}
    print(f"   ⭐️ Selected {len(bcs_clusters)} stories for BCS Pro Academic Preset")
    print(f"   📰 Selected {len(pool_clusters)} stories for Daily Buzz Interest Pool")
    
    # Step 5: Synthesize bilingual outputs (Civilsdaily 7-Section Blueprint)
    print(f"\n🤖 Synthesizing Bilingual Civilsdaily Blueprints (Daily Buzz + BCS Pro layers)...")
    stories: list[CapsuleStory] = []
    
    for cluster in pool_clusters:
        is_bcs = cluster.cluster_id in bcs_ids
        story = synthesize_story_with_ai(cluster, is_bcs_pro=is_bcs)
        stories.append(story)
        
    capsule = DailyCapsule(
        edition_date=today_str,
        created_at=datetime.now().isoformat(),
        status="PENDING_REVIEW",
        bcs_pro_preset_story_ids=list(bcs_ids),
        stories=stories,
        total_stories=len(stories),
        review_notes="Automated draft generated. Awaiting human editor approval before broadcast."
    )
    
    # Step 6: Persist Capsule
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "output")
    os.makedirs(output_dir, exist_ok=True)
    
    capsule_dict = capsule.model_dump()
    latest_path = os.path.join(output_dir, "capsule_latest.json")
    dated_path = os.path.join(output_dir, f"capsule_{today_str}.json")
    
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(capsule_dict, f, ensure_ascii=False, indent=2)
        
    with open(dated_path, "w", encoding="utf-8") as f:
        json.dump(capsule_dict, f, ensure_ascii=False, indent=2)
        
    print(f"\n💾 Saved Daily Capsule to: {latest_path}")

    # Step 7: Stage in Firestore 'bcs_pro_drafts'
    try:
        edition_id = stage_bcs_pro_draft_to_firestore(capsule)
        print(f"🔥 Staged BCS Pro Civilsdaily draft in Firestore 'bcs_pro_drafts/{edition_id}' (Status: PENDING_REVIEW)")
    except Exception as e:
        print(f"⚠️ Warning: Could not stage draft to Firestore ({e})")

    print(f"========================================================")
    print(f"🎉 PIPELINE RUN COMPLETE: Status is PENDING_REVIEW")
    print(f"========================================================\n")
    return capsule

def approve_draft():
    """Human-in-the-Loop: Marks the current draft as PUBLISHED."""
    latest_path = os.path.join(os.path.dirname(__file__), "..", "data", "output", "capsule_latest.json")
    if not os.path.exists(latest_path):
        print("❌ No draft found to approve.")
        return
    with open(latest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["status"] = "PUBLISHED"
    data["review_notes"] = f"Approved by editor on {datetime.now().isoformat()}"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Approved and published draft: {data.get('edition_date')}")

    # Publish to Firestore 'bcs_pro_published' and update 'latest' pointer
    edition_date = data.get("edition_date")
    if edition_date:
        try:
            publish_bcs_pro_edition(edition_date)
            print(f"🔥 Published edition to Firestore 'bcs_pro_published' (Archived & 'latest' live pointer updated)")
        except Exception as e:
            print(f"⚠️ Warning: Could not publish to Firestore ({e})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dorpon Daily Pipeline Orchestrator")
    parser.add_argument("--mode", choices=["all", "hourly", "bcs-draft", "approve"], default="all",
                        help="Mode to run: 'hourly' for fast Daily Buzz, 'bcs-draft' for morning BCS capsule, 'approve' to publish")
    parser.add_argument("--bcs-count", type=int, default=4, help="Number of BCS Pro stories to select (default: 4)")
    parser.add_argument("--pool-count", type=int, default=8, help="Number of total stories in pool (default: 8)")
    args = parser.parse_args()
    
    if args.mode == "hourly":
        run_hourly_buzz(limit=args.pool_count)
    elif args.mode == "bcs-draft":
        run_daily_pipeline(bcs_count=args.bcs_count, pool_count=args.pool_count)
    elif args.mode == "approve":
        approve_draft()
    else:
        run_daily_pipeline(bcs_count=args.bcs_count, pool_count=args.pool_count)
