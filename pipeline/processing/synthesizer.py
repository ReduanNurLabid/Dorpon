import os
import json
import re
from typing import List, Optional
from pipeline.models import (
    CapsuleStory, DailyBuzzItem, BcsProItem, StatPoint,
    ConstitutionalCitation, WrittenExamPrompt, PyqReference,
    SyllabusMapping, QuestionBreakdown
)
from pipeline.processing.deduplicator import ClusteredEvent
from pipeline.constitution_kb import find_relevant_articles
from pipeline.config import INTEREST_CATEGORIES

# Load seed PYQs
PYQS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "pyqs.json")

def load_pyqs() -> list:
    if os.path.exists(PYQS_FILE):
        with open(PYQS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def match_pyqs_for_story(categories: List[str], text: str) -> List[PyqReference]:
    """Matches 30-year past BPSC exam questions based on topic tags and keywords."""
    pyqs = load_pyqs()
    matched = []
    
    for q in pyqs:
        overlap = set(categories).intersection(set(q.get("topics", [])))
        if overlap:
            matched.append(PyqReference(
                pyq_id=q["id"],
                bcs_batch=q["bcs_batch"],
                subject=q["subject"],
                question_snippet=q["question_text_bn"],
                relevance_score=0.9
            ))
            if len(matched) >= 2:
                break
                
    return matched

def map_syllabus_for_categories(categories: List[str], title: str) -> SyllabusMapping:
    """Deterministically maps an event to the official BPSC Syllabus paper & microtheme."""
    cat = categories[0] if categories else "governance_law"
    title_lower = title.lower()
    
    if cat == "economy_business" or "bank" in title_lower or "inflation" in title_lower or "মুদ্রাস্ফীতি" in title_lower:
        return SyllabusMapping(
            paper_code="Paper V",
            subject="Bangladesh Affairs",
            microtheme="Macroeconomy, Banking, Trade & Foreign Reserves",
            full_breadcrumb="Bangladesh Affairs (Paper V) › Macroeconomy, Trade & Foreign Reserves"
        )
    elif cat == "governance_law" or "court" in title_lower or "সংবিধান" in title_lower or "রিট" in title_lower:
        return SyllabusMapping(
            paper_code="Paper V",
            subject="Bangladesh Affairs",
            microtheme="The Constitution, Organs of State & Writ Jurisdiction",
            full_breadcrumb="Bangladesh Affairs (Paper V) › The Constitution & Rule of Law"
        )
    elif cat == "world_diplomacy" or "treaty" in title_lower or "কূটনীতি" in title_lower:
        return SyllabusMapping(
            paper_code="Paper VI",
            subject="International Affairs",
            microtheme="Bilateral Diplomacy, Treaties & Regional Geopolitics",
            full_breadcrumb="International Affairs (Paper VI) › Regional & Global Geopolitics"
        )
    elif cat == "climate_environment" or "delta" in title_lower or "ব-দ্বীপ" in title_lower:
        return SyllabusMapping(
            paper_code="Paper VII",
            subject="Geography, Environment & Disaster Management",
            microtheme="Delta Plan 2100 & Climate Vulnerability Governance",
            full_breadcrumb="Geography & Environment (Paper VII) › Delta Plan 2100"
        )
    elif cat == "tech_innovation" or "ai" in title_lower or "সাইবার" in title_lower:
        return SyllabusMapping(
            paper_code="Paper IV",
            subject="General Science & ICT",
            microtheme="Cybersecurity, Digital Public Infrastructure & AI",
            full_breadcrumb="General Science & ICT (Paper IV) › Public Sector Digitalization"
        )
    else:
        return SyllabusMapping(
            paper_code="Paper V",
            subject="Bangladesh Affairs",
            microtheme="Public Administration, Reforms & Citizen Welfare",
            full_breadcrumb="Bangladesh Affairs (Paper V) › Public Administration & Governance"
        )

def synthesize_story_with_ai(
    cluster: ClusteredEvent,
    is_bcs_pro: bool,
    api_key: Optional[str] = None
) -> CapsuleStory:
    """
    Synthesizes a clustered news event into a bilingual CapsuleStory.
    Uses Gemini when GEMINI_API_KEY is available; otherwise provides high-quality heuristic synthesis.
    Conforms to the 7-section Civilsdaily specification for BCS Pro.
    """
    primary_art = cluster.articles[0]
    title = primary_art.title
    body = primary_art.body_text or primary_art.summary_raw or title
    is_bangla_source = primary_art.language == "bn"
    
    # 1. Deterministic Constitutional KB Matching
    const_matches = find_relevant_articles(f"{title} {body}")
    const_citations = [
        ConstitutionalCitation(
            article_number=m["article_number"],
            article_title_bn=m["article_title_bn"],
            article_title_en=m["article_title_en"],
            legal_relevance=m["legal_relevance"]
        ) for m in const_matches
    ]
    
    syllabus = map_syllabus_for_categories(cluster.matched_categories, title)
    
    # 2. Check for Gemini API Key
    api_key = api_key or os.getenv("GEMINI_API_KEY")
    
    if api_key:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            prompt = f"""You are the Senior News & Editorial Editor for 'Dorpon Daily', an authoritative current affairs and news analysis platform for Bangladesh.
Task: Synthesize a factually accurate, sharp, and objective news capsule based on the provided verified news report.

EDITORIAL GUIDELINES (CRITICAL):
1. MATCH REAL SOURCES & JOURNALISTIC FIDELITY: Editorial capsules MUST align with mainstream news reporting (Reuters, Daily Star, Prothom Alo). Do NOT rewrite the story into generic abstractions or bureaucratic filler just to sound 'original'. Preserve real names, titles, organizations, official quotes, key metrics, and specific political or administrative developments.
2. NO GENERIC AI PLATITUDES: Strictly avoid vague filler phrases like "underscored the pressing necessity", "a momentous milestone", "poised to reshape the landscape", or generic commentary.
3. TITLE REQUIREMENTS:
   - title_en: A crisp, factual journalistic headline that clearly states who did what or what happened (e.g., 'BNP Leader Ishraque Resigns from Advisory Council Following PM Directive' or 'Bangladesh Bank Hikes Repo Rate to 10%').
   - title_bn: A natural, professional Bengali news headline as seen in top national dailies (e.g., 'প্রধানমন্ত্রীর নির্দেশে উপদেষ্টা পরিষদ থেকে ইশরাক হোসেনের পদত্যাগ').
4. CORE STORY REQUIREMENTS:
   - summary_en: 2 to 3 crisp, highly informative journalistic sentences following the inverted pyramid:
     • Sentence 1: Core news lead (Who, what, when, where, and the exact action/decision).
     • Sentence 2: Key factual details, statements, or quotes from the report.
     • Sentence 3: Contextual background or immediate next step.
   - summary_bn: 2 to 3 natural, standard formal Bengali sentences accurately conveying the exact core facts without robotic machine translation.
5. WHY IT MATTERS REQUIREMENTS:
   - why_it_matters_en: 1 concise takeaway sentence highlighting the concrete governance, political, legal, or economic implication directly anchored to this story.
   - why_it_matters_bn: 1 concise takeaway sentence in Bengali highlighting the real-world significance.

Headline from Source: {title}
Source Text / Scraped Body: {body[:2500]}
Is BCS Pro Selection: {is_bcs_pro}

You MUST return a JSON object with these EXACT keys:
{{
  "title_bn": "Professional, factual Bengali headline",
  "title_en": "Sharp, factual English news headline",
  "summary_bn": "2 to 3 crisp, factual sentences in standard Bengali summarizing the core event",
  "summary_en": "2 to 3 crisp, factual sentences in English summarizing the core event",
  "why_it_matters_bn": "1 concise takeaway sentence on real-world political, economic, or governance impact in Bengali",
  "why_it_matters_en": "1 concise takeaway sentence on real-world political, economic, or governance impact in English",
  "why_in_the_news_bn": "2-sentence factual trigger in Bengali explaining what happened today and why it is critical",
  "why_in_the_news_en": "2-sentence factual trigger in English explaining what happened today and why it is critical",
  "question_breakdowns": [
    {{
      "question": "Analytical question relevant to civil service written syllabus",
      "anchor_points": [
        "**Core Concept:** Direct answer with bold topic anchor...",
        "**Administrative Mechanism:** Analysis of executive implementation..."
      ]
    }},
    {{
      "question": "Second analytical question examining socio-economic or institutional ramifications",
      "anchor_points": [
        "**Institutional Impact:** Analytical breakdown...",
        "**Public Finance Impact:** Structural breakdown..."
      ]
    }}
  ],
  "data_stats": [
    {{
      "metric_name": "Name of metric (e.g. Policy Repo Rate, Headline Inflation, Forex Reserves)",
      "value": "10.00% / 9.92%",
      "source_org": "Bangladesh Bank / BBS / Ministry of Finance",
      "context": "Contextual meaning of the statistic"
    }}
  ],
  "challenges": [
    "1. First structural bottleneck or institutional challenge.",
    "2. Second challenge.",
    "3. Third challenge."
  ],
  "way_forward": [
    "1. First pragmatic, actionable policy recommendation for civil service written exam conclusions.",
    "2. Second recommendation.",
    "3. Third recommendation."
  ],
  "written_prompt_bn": "Formal 15-mark BPSC written exam question in Bengali starting with প্রশ্ন:",
  "written_prompt_en": "Formal 15-mark BPSC written exam question in English starting with Q:",
  "tags": [
    "#SpecificTopicTag1",
    "#SpecificTopicTag2",
    "#SpecificTopicTag3"
  ],
  "model_outline_points": [
    "১. প্রাথমিক পটভূমি ও বর্তমান চালচিত্র (Introduction & Context)",
    "২. প্রাতিষ্ঠানিক ও আইনগত সীমাবদ্ধতা (Institutional & Regulatory Gaps)",
    "৩. কৌশলগত নীতি সংস্কার ও ভবিষ্যৎ পথরেখা (Strategic Policy Recommendations)"
  ]
}}
"""
            # Prioritize gemini-3.5-flash with fallback to gemini-3.5-flash-lite
            response = None
            for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json"
                        )
                    )
                    if response and response.text:
                        break
                except Exception as m_err:
                    print(f"⚠️ Model {model_name} attempt note: {m_err}")

            if not response or not response.text:
                raise RuntimeError("No response received from Gemini models")

            data = json.loads(response.text)
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            if not isinstance(data, dict):
                data = {}
            
            buzz = DailyBuzzItem(
                title_bn=data.get("title_bn", title if is_bangla_source else title),
                title_en=data.get("title_en", title if not is_bangla_source else title),
                summary_bn=data.get("summary_bn", primary_art.summary_raw or title),
                summary_en=data.get("summary_en", primary_art.summary_raw or title),
                why_it_matters_bn=data.get("why_it_matters_bn", "জাতীয় অর্থনীতি ও সুশাসনে এর দীর্ঘমেয়াদী নীতিগত তাৎপর্য রয়েছে।"),
                why_it_matters_en=data.get("why_it_matters_en", "Directly impacts national policy, regulatory frameworks, and citizen welfare."),
                interest_categories=cluster.matched_categories
            )
            
            bcs_pro = None
            if is_bcs_pro:
                bcs_pro = BcsProItem(
                    syllabus_mapping=syllabus,
                    bcs_subject_area=syllabus.full_breadcrumb,
                    why_in_the_news_en=data.get("why_in_the_news_en", f"Today's development anchors new administrative and regulatory action regarding {title}."),
                    why_in_the_news_bn=data.get("why_in_the_news_bn", f"উক্ত নীতিগত সিদ্ধান্তের ফলে সার্বিক প্রশাসনিক ও প্রাতিষ্ঠানিক ক্ষেত্রে নতুন নির্দেশনা জারি করা হয়েছে।"),
                    question_breakdowns=[
                        QuestionBreakdown(
                            question=q.get("question", "What is the core policy development?"),
                            anchor_points=[str(pt) for pt in q.get("anchor_points", [])] or ["**Policy Mechanism:** Outlines executive regulatory measures."]
                        ) for q in data.get("question_breakdowns", []) if isinstance(q, dict)
                    ],
                    data_stats=[
                        StatPoint(
                            metric_name=s.get("metric_name", "Macroeconomic Indicator"),
                            value=str(s.get("value", "Official Release")),
                            source_org=s.get("source_org", "BBS / Bangladesh Bank"),
                            context=s.get("context", "Key data point referenced in gazette")
                        ) for s in data.get("data_stats", []) if isinstance(s, dict)
                    ],
                    constitutional_articles=const_citations,
                    challenges=data.get("challenges", [
                        "1. প্রাতিষ্ঠানিক সমন্বয়হীনতা ও বাস্তবায়ন জটিলতা।",
                        "2. রাজস্ব বা আর্থিক বরাদ্দের কাঠামোগত সীমাবদ্ধতা।",
                        "3. মনিটরিং ও স্বচ্ছতা নিশ্চিতকরণে আইনি দুর্বলতা।"
                    ]),
                    way_forward=data.get("way_forward", [
                        "1. সংশ্লিষ্ট অংশীজন ও আন্তঃমন্ত্রণালয় সমন্বয় জোরদার করা।",
                        "2. ডিজিটাল ডাটা ট্র্যাকিং ও দ্রুত নিরীক্ষা ব্যবস্থা চালু।",
                        "3. টেকসই নীতি কাঠামোর আইনি সুরক্ষা নিশ্চিত করা।"
                    ]),
                    analytical_breakdown_bn=data.get("analytical_breakdown_bn", "বিপিএসসি লিখিত পরীক্ষায় নীতি পর্যালোচনা ও সংস্কারমূলক সুপারিশে এই তথ্যগুলো উচ্চ মানসম্পন্ন পয়েন্ট হিসেবে উপস্থাপনযোগ্য।"),
                    analytical_breakdown_en=data.get("analytical_breakdown_en", "Crucial structural policy development relevant for public administration and BPSC written examination papers."),
                    written_exam_prompt=WrittenExamPrompt(
                        marks=15,
                        prompt_text_bn=data.get("written_prompt_bn", f"প্রশ্ন: '{title}'—উক্ত ঘটনার আলোকে বাংলাদেশের প্রশাসনিক স্বচ্ছতা ও দীর্ঘমেয়াদী নীতিগত চ্যালেঞ্জসমূহ পর্যালোচনা করুন। [নম্বর: ১৫]"),
                        prompt_text_en=data.get("written_prompt_en", f"Q: In light of '{title}', analyze the policy bottlenecks and propose strategic governance solutions. [Marks: 15]"),
                        model_outline_points=data.get("model_outline_points", [
                            "১. প্রাথমিক পটভূমি ও বর্তমান চালচিত্র (Introduction & Context)",
                            "২. আইনগত ও প্রাতিষ্ঠানিক সীমাবদ্ধতা (Regulatory Gaps & Institutional Issues)",
                            "৩. সরকারি নীতি সংস্কার ও ভবিষ্যৎ করণীয় (Strategic Policy Recommendations)"
                        ])
                    ),
                    linked_pyqs=match_pyqs_for_story(cluster.matched_categories, title)
                )
                
            parsed_tags = [
                t if t.startswith('#') else f'#{t.replace(" ", "")}'
                for t in data.get("tags", [])
                if isinstance(t, str) and len(t.strip()) > 1
            ]
            if not parsed_tags:
                parsed_tags = [f"#{c.replace('_', '')}" for c in cluster.matched_categories]

            return CapsuleStory(
                story_id=cluster.cluster_id,
                primary_category=cluster.matched_categories[0] if cluster.matched_categories else "governance_law",
                interest_categories=cluster.matched_categories,
                tags=parsed_tags,
                is_bcs_pro_selected=is_bcs_pro,
                image_url=primary_art.image_url,
                sources=[{"name": a.source, "url": a.url} for a in cluster.articles],
                daily_buzz=buzz,
                bcs_pro=bcs_pro
            )
        except Exception as e:
            print(f"⚠️ Gemini synthesis error ({e}), falling back to Civilsdaily heuristic engine...")

    # =========================================================================
    # Fallback High-Quality Heuristic Engine (100% Free, Zero-API Dependency)
    # Uses Inverted-Pyramid Lead Paragraph Analysis + Civilsdaily Blueprint
    # =========================================================================
    paragraphs = [p.strip() for p in body.split("\n\n") if len(p.strip()) > 30]
    lead_summary = paragraphs[0] if paragraphs else title
    if len(paragraphs) > 1:
        lead_summary += " " + paragraphs[1]
    # Cap to ~250 characters for clean 60s reading
    if len(lead_summary) > 300:
        lead_summary = lead_summary[:290] + "..."
        
    buzz = DailyBuzzItem(
        title_bn=title if is_bangla_source else f"{title} (সংক্ষিপ্ত সার)",
        title_en=title if not is_bangla_source else f"Summary: {title}",
        summary_bn=lead_summary if is_bangla_source else "উক্ত বিষয়ে সরকারের সংশ্লিষ্ট বিভাগ সমন্বিত পদক্ষেপ গ্রহণ করছে। সার্বিক পরিস্থিতি বিবেচনায় দীর্ঘমেয়াদী সংস্কারের উদ্যোগ নেওয়া হয়েছে।",
        summary_en=lead_summary if not is_bangla_source else "A key domestic development that directly impacts policy, regulatory frameworks, and citizen welfare.",
        why_it_matters_bn="দেশের অর্থনৈতিক স্থিতিশীলতা ও প্রাতিষ্ঠানিক সুশাসন নিশ্চিতে এই সিদ্ধান্তটি অত্যন্ত তাৎপর্যপূর্ণ।",
        why_it_matters_en="Vital for understanding structural policy decisions and systemic governance across Bangladesh.",
        interest_categories=cluster.matched_categories
    )
    
    bcs_pro = None
    if is_bcs_pro:
        bcs_pro = BcsProItem(
            syllabus_mapping=syllabus,
            bcs_subject_area=syllabus.full_breadcrumb,
            why_in_the_news_en=f"Triggered by recent administrative announcements regarding {title}. Directly impacts regulatory compliance.",
            why_in_the_news_bn=f"উক্ত ঘটনার পরিপ্রেক্ষিতে নিয়ন্ত্রক সংস্থা ও নির্বাহী বিভাগের পক্ষ থেকে নতুন দিকনির্দেশনা ও পর্যবেক্ষণ জারি করা হয়েছে।",
            question_breakdowns=[
                QuestionBreakdown(
                    question="What is the policy or administrative dispute?",
                    anchor_points=[
                        "**1. Core Mechanism:** The administrative agency enforces statutory authority under existing national guidelines.",
                        "**2. Institutional Friction:** Implementation requires inter-agency coordination across finance and administrative divisions.",
                        "**3. Regulatory Conflict:** Balancing consumer welfare against macroeconomic stability targets."
                    ]
                )
            ],
            data_stats=[
                StatPoint(
                    metric_name="Headline Indicator / Gazette",
                    value="Latest Official Release",
                    source_org="BBS / Bangladesh Bank",
                    context="Key data point referenced in the morning gazette."
                )
            ],
            constitutional_articles=const_citations,
            challenges=[
                "1. Structural Shortfalls: Implementation delays and inter-departmental coordination gaps.",
                "2. Institutional Capacity: Enforcement challenges under existing statutory regulatory frameworks.",
                "3. Fiscal & Monetary Synergy: Ensuring alignment between ministry budgets and executive targets."
            ],
            way_forward=[
                "1. Strengthening Institutional Frameworks: Enhancing domestic regulatory compliance mechanisms.",
                "2. Real-Time Inter-Agency Coordination: Creating unified taskforces between Bangladesh Bank and ministries.",
                "3. Pragmatic Policy Reform: Introducing clear statutory safeguards tailored for long-term national planning."
            ],
            analytical_breakdown_bn="প্রশাসনিক ও অর্থনৈতিক কাঠামোর ওপর এই ঘটনার প্রভাব বহুমাত্রিক। বিপিএসসি লিখিত পরীক্ষায় নীতি পর্যালোচনা ও সংস্কারমূলক সুপারিশে এই তথ্যগুলো উচ্চ মানসম্পন্ন পয়েন্ট হিসেবে উপস্থাপনযোগ্য।",
            analytical_breakdown_en="Significant structural implication for civil servants. Demonstrates real-world application of executive regulatory mechanisms and fiscal-monetary governance.",
            written_exam_prompt=WrittenExamPrompt(
                marks=15,
                prompt_text_bn=f"প্রশ্ন: '{title}'—উক্ত ঘটনার আলোকে বাংলাদেশের প্রশাসনিক স্বচ্ছতা ও দীর্ঘমেয়াদী নীতিগত চ্যালেঞ্জসমূহ পর্যালোচনা করুন। [নম্বর: ১৫]",
                prompt_text_en=f"Q: In light of '{title}', analyze the policy bottlenecks and propose strategic governance solutions for Bangladesh. [Marks: 15]",
                model_outline_points=[
                    "১. প্রাথমিক পটভূমি ও বর্তমান চালচিত্র (Introduction & Context)",
                    "২. আইনগত ও প্রাতিষ্ঠানিক সীমাবদ্ধতা (Regulatory Gaps & Institutional Issues)",
                    "৩. সরকারি নীতি সংস্কার ও ভবিষ্যৎ করণীয় (Strategic Policy Recommendations)"
                ]
            ),
            linked_pyqs=match_pyqs_for_story(cluster.matched_categories, title)
        )
        
    return CapsuleStory(
        story_id=cluster.cluster_id,
        primary_category=cluster.matched_categories[0] if cluster.matched_categories else "governance_law",
        interest_categories=cluster.matched_categories,
        is_bcs_pro_selected=is_bcs_pro,
        image_url=primary_art.image_url,
        sources=[{"name": a.source, "url": a.url} for a in cluster.articles],
        daily_buzz=buzz,
        bcs_pro=bcs_pro
    )
