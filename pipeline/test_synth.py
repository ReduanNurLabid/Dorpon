import os
import sys
import time
from dotenv import load_dotenv

if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

from pipeline.models import RawArticle
from pipeline.processing.deduplicator import ClusteredEvent
from pipeline.processing.synthesizer import synthesize_story_with_ai

sample_art = RawArticle(
    id="test-101",
    source="The Daily Star",
    url="https://www.thedailystar.net/business/economy/news/bangladesh-bank-hikes-repo-rate-10-3728191",
    title="Bangladesh Bank raises repo rate to 10% to curb persistent inflation",
    summary_raw="The central bank has hiked the policy rate by 50 basis points. The move aims to cool down consumer prices.",
    body_text="""
    Bangladesh Bank yesterday raised the policy repo rate by 50 basis points to 10.00 percent from 9.50 percent to rein in persistent inflation.
    The new rate will come into effect from next Sunday, according to a circular issued by the central bank.
    The decision was taken in an emergency Monetary Policy Committee meeting presided over by the governor.
    Headline inflation in Bangladesh stood at 9.92 percent in September, according to BBS data.
    The central bank stated that higher borrowing costs for commercial banks will slow excessive money growth while foreign exchange reserves stand at $24.8 billion under BPM6 calculation.
    """,
    language="en",
    category_hint="economy_business"
)

cluster = ClusteredEvent(sample_art)
cluster.matched_categories = ["economy_business", "governance_law"]
cluster.bcs_score = 9.5

print(f"Testing live Gemini synthesis on model 'gemini-flash-latest'...", flush=True)
start = time.time()
story = synthesize_story_with_ai(cluster, is_bcs_pro=True)
elapsed = time.time() - start

print(f"\n✅ Synthesized successfully in {elapsed:.2f} seconds!", flush=True)
print("\n=== DAILY BUZZ ===")
print("Title BN:", story.daily_buzz.title_bn)
print("Title EN:", story.daily_buzz.title_en)
print("Summary BN:", story.daily_buzz.summary_bn)
print("Summary EN:", story.daily_buzz.summary_en)
print("Why it matters BN:", story.daily_buzz.why_it_matters_bn)
print("Why it matters EN:", story.daily_buzz.why_it_matters_en)

print("\n=== BCS PRO (7-SECTION CIVILSDAILY) ===")
print("Syllabus:", story.bcs_pro.syllabus_mapping.full_breadcrumb if story.bcs_pro.syllabus_mapping else story.bcs_pro.bcs_subject_area)
print("Why in News (EN):", story.bcs_pro.why_in_the_news_en)
print("Why in News (BN):", story.bcs_pro.why_in_the_news_bn)
print("\nQuestion Breakdowns:")
for qb in story.bcs_pro.question_breakdowns:
    print(f"  Q: {qb.question}")
    for pt in qb.anchor_points:
        print(f"     {pt}")

print("\nChallenges:")
for c in story.bcs_pro.challenges:
    print(f"  {c}")

print("\nWay Forward (15-Mark Points):")
for w in story.bcs_pro.way_forward:
    print(f"  {w}")

print("\nWritten Exam Prompt:")
print(f"  [Marks: {story.bcs_pro.written_exam_prompt.marks}] {story.bcs_pro.written_exam_prompt.prompt_text_bn}")
print(f"  EN: {story.bcs_pro.written_exam_prompt.prompt_text_en}")
print("  Model Outline:")
for pt in story.bcs_pro.written_exam_prompt.model_outline_points:
    print(f"     • {pt}")
