"""
Dorpon Daily - Hourly Autonomous Ingestion Worker
-------------------------------------------------
1. Gathers candidate articles from live feeds.
2. Scrapes clean body text and optional lead image (og:image).
3. Clusters/deduplicates events.
4. For each selected top event, sends 1 dedicated prompt to Gemini 3.5 Flash:
   - Generates original editorial summary & exam takeaway (never verbatim copying).
   - Accurately cites original publisher as source.
5. Saves output to data/output/hourly_buzz_latest.json and syncs to Firestore.
"""

import sys
import os
import argparse
from datetime import datetime

# UTF-8 stdout for Windows consoles
if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8')

from pipeline.run_pipeline import run_hourly_buzz

def main():
    parser = argparse.ArgumentParser(description="Dorpon Daily Hourly Ingestion Worker")
    parser.add_argument("--limit", type=int, default=4, help="Number of hourly stories to synthesize")
    args = parser.parse_args()

    print(f"\n========================================================")
    print(f"🚀 Launching Dorpon Daily Hourly Worker ({datetime.now().strftime('%Y-%m-%d %H:%M')})")
    print(f"   Target stories: {args.limit} (1 prompt per story to Gemini 3.5 Flash)")
    print(f"========================================================")

    result = run_hourly_buzz(limit=args.limit)
    if result:
        print(f"🎉 Successfully synthesized and synced {result.get('total_stories', 0)} stories.")
    else:
        print("⚠️ Hourly worker completed with no updates.")

if __name__ == "__main__":
    main()
