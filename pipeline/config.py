import os
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# =====================================================================
# 1. RSS Feed Endpoints (Verified Live & Fast)
# =====================================================================
FEEDS = {
    "prothom_alo_politics": {
        "name": "প্রথম আলো রাজনীতি",
        "url": "https://www.prothomalo.com/api/v1/collections/politics.rss",
        "language": "bn",
        "source_type": "rss"
    },
    "bangla_tribune": {
        "name": "Bangla Tribune",
        "url": "https://www.banglatribune.com/feed/",
        "language": "bn",
        "source_type": "rss"
    },
    "prothom_alo_bn": {
        "name": "প্রথম আলো",
        "url": "https://www.prothomalo.com/stories.rss",
        "language": "bn",
        "source_type": "rss"
    },
    "daily_star_politics": {
        "name": "The Daily Star Politics",
        "url": "https://www.thedailystar.net/politics/rss.xml",
        "language": "en",
        "source_type": "rss"
    },
    "tbs_politics": {
        "name": "The Business Standard Politics",
        "url": "https://www.tbsnews.net/bangladesh/politics/rss.xml",
        "language": "en",
        "source_type": "rss"
    },
    "daily_star_bd": {
        "name": "The Daily Star Bangladesh",
        "url": "https://www.thedailystar.net/bangladesh/rss.xml",
        "language": "en",
        "source_type": "rss"
    },
    "daily_star_crime": {
        "name": "The Daily Star Law & Crime",
        "url": "https://www.thedailystar.net/news/crime-justice/rss.xml",
        "language": "en",
        "source_type": "rss"
    },
    "tbs_main": {
        "name": "The Business Standard",
        "url": "https://www.tbsnews.net/rss.xml",
        "language": "en",
        "source_type": "rss"
    },
    "dhaka_tribune": {
        "name": "Dhaka Tribune",
        "url": "https://www.dhakatribune.com/feed/",
        "language": "en",
        "source_type": "rss"
    },
    "jagonews24": {
        "name": "Jago News 24",
        "url": "https://www.jagonews24.com/rss/rss.xml",
        "language": "bn",
        "source_type": "rss"
    },
    "channel_i": {
        "name": "Channel i",
        "url": "https://www.channelionline.com/feed/",
        "language": "bn",
        "source_type": "rss"
    },
    "techcrunch": {
        "name": "TechCrunch",
        "url": "https://techcrunch.com/feed/",
        "language": "en",
        "source_type": "rss"
    },
    "the_verge": {
        "name": "The Verge",
        "url": "https://www.theverge.com/rss/index.xml",
        "language": "en",
        "source_type": "rss"
    }
}

# Direct HTML Section Fallback Targets (Sources where RSS is broken or capped)
SECTION_TARGETS = [
    {
        "name": "The Financial Express",
        "url": "https://thefinancialexpress.com.bd/economy/bangladesh",
        "base_url": "https://thefinancialexpress.com.bd",
        "language": "en",
        "category_hint": "economy_business"
    },
    {
        "name": "BSS News",
        "url": "https://www.bssnews.net/category/national",
        "base_url": "https://www.bssnews.net",
        "language": "en",
        "category_hint": "governance_law"
    }
]

# Standard Polite Browser Headers
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none"
}

# =====================================================================
# 2. Canonical Interest Categories & Keyword Taxonomy
# =====================================================================
INTEREST_CATEGORIES: Dict[str, Dict[str, any]] = {
    "economy_business": {
        "en": "Economy & Business",
        "bn": "অর্থনীতি ও বাণিজ্য",
        "keywords": [
            "economy", "inflation", "bank", "tax", "gdp", "export", "import", "budget", 
            "finance", "dollar", "reserve", "forex", "interest rate", "revenue", "nbr",
            "অর্থনীতি", "ব্যাংক", "মুদ্রাস্ফীতি", "রিজার্ভ", "বাজেট", "রাজস্ব", "ডলার", "রপ্তানি", "আমদানি"
        ]
    },
    "governance_law": {
        "en": "Governance, Law & Constitution",
        "bn": "শাসনব্যবস্থা, রাজনীতি ও সংবিধান",
        "keywords": [
            "court", "constitution", "police", "election", "commission", "ministry", 
            "parliament", "bpsc", "judiciary", "high court", "supreme court", "ordinance",
            "resignation", "cabinet", "politics", "political", "ishraque", "bnp", "awami",
            "আদালত", "সংবিধান", "নির্বাচন", "মন্ত্রণালয়", "আইন", "প্রশাসন", "দুদক", "হাইকোর্ট", 
            "সুপ্রিম কোর্ট", "অধ্যাদেশ", "পদত্যাগ", "ইশরাক", "বিএনপি", "আওয়ামী লীগ", "মন্ত্রিসভা", 
            "উপদেষ্টা", "রাজনীতি", "রাজনৈতিক", "স্বরাষ্ট্র", "আন্দোলন", "সংসদ"
        ]
    },
    "tech_innovation": {
        "en": "Technology & AI",
        "bn": "প্রযুক্তি ও এআই",
        "keywords": [
            "tech", "ai", "artificial intelligence", "digital", "internet", "telecom", "satellite", 
            "cyber", "innovation", "science", "software", "startup", "cloud",
            "প্রযুক্তি", "বিজ্ঞান", "ইন্টারনেট", "এআই", "সাইবার", "সফটওয়্যার", "টেলিকম"
        ]
    },
    "climate_environment": {
        "en": "Climate & Environment",
        "bn": "পরিবেশ ও জলবায়ু",
        "keywords": [
            "climate", "flood", "river", "environment", "pollution", "cyclone", "forest", 
            "delta", "renewable", "energy", "solar", "biodiversity",
            "পরিবেশ", "জলবায়ু", "বন্যা", "নদী", "দূষণ", "ঘূর্ণিঝড়", "ডেল্টা", "নবায়নযোগ্য", "জ্বালানি"
        ]
    },
    "world_diplomacy": {
        "en": "World & Geopolitics",
        "bn": "আন্তর্জাতিক ও কূটনীতি",
        "keywords": [
            "un", "united nations", "usa", "india", "china", "treaty", "diplomacy", 
            "war", "summit", "bilateral", "sanctions", "geopolitics", "myanmar", "rohingya",
            "যুক্তরাষ্ট্র", "ভারত", "চীন", "জাতিসংঘ", "কূটনীতি", "চুক্তি", "ভূরাজনীতি", "রোহিঙ্গা"
        ]
    },
    "society_education": {
        "en": "Society & Education",
        "bn": "সমাজ ও শিক্ষা",
        "keywords": [
            "education", "university", "health", "hospital", "reform", "youth", "culture", "public health",
            "শিক্ষা", "বিশ্ববিদ্যালয়", "স্বাস্থ্য", "হাসপাতাল", "সংস্কার", "নাগরিক"
        ]
    }
}

# =====================================================================
# 3. Canonical Entity Dictionary for Cross-Lingual Deduplication
# =====================================================================
# Maps Bengali & English keywords to a single canonical entity slug
CANONICAL_ENTITIES = {
    # Monetary / Banking
    "bangladesh_bank": ["bangladesh bank", "বাংলাদেশ ব্যাংক", "central bank", "কেন্দ্রীয় ব্যাংক"],
    "repo_rate": ["repo rate", "রেপো রেট", "policy rate", "নীতিগত সুদহার"],
    "inflation": ["inflation", "মুদ্রাস্ফীতি", "মূল্যস্ফীতি", "price hike", "দ্রব্যমূল্য"],
    "forex_reserves": ["forex reserve", "foreign exchange", "রিজার্ভ", "বৈদেশিক মুদ্রা"],
    "nbr_tax": ["nbr", "national board of revenue", "জাতীয় রাজস্ব বোর্ড", "আয়কর", "tax revenue"],
    "world_bank_imf": ["imf", "world bank", "বিশ্বব্যাংক", "আন্তর্জাতিক মুদ্রা তহবিল"],
    
    # Judiciary & Constitution
    "high_court": ["high court", "supreme court", "হাইকোর্ট", "সুপ্রিম কোর্ট", "আপিল বিভাগ"],
    "constitution": ["constitution", "সংবিধান", "constitutional", "সাংবিধানিক"],
    "writ_petition": ["writ", "রিট", "public interest litigation"],
    "bpsc": ["bpsc", "public service commission", "বিপিএসসি", "কর্মকমিশন"],
    "election_commission": ["election commission", "নির্বাচন কমিশন", "ইসি"],
    "anti_corruption": ["dudok", "acc", "দুদক", "anti-corruption commission"],
    
    # Geopolitics
    "india_bd": ["india", "delhi", "ভারত", "নয়া দিল্লি", "তিস্তা", "teesta"],
    "china_bd": ["china", "beijing", "চীন", "বেইজিং"],
    "usa_bd": ["united states", "usa", "যুক্তরাষ্ট্র", "ওয়াশিংটন", "washington"],
    "rohingya": ["rohingya", "myanmar", "রোহিঙ্গা", "মিয়ানমার"],

    # Politics & Governance Developments
    "ishraque_issue": ["ishraque", "ইশরাক", "ইশরাক হোসেন"],
    "bnp_politics": ["bnp", "বিএনপি", "তারেক রহমান", "খালেদা জিয়া"],
    "interim_cabinet": ["interim government", "অন্তর্বর্তী সরকার", "প্রধান উপদেষ্টা", "ইউনূস", "yunus", "উপদেষ্টা পরিষদ"],
    
    # Climate & Tech
    "delta_plan": ["delta plan", "ব-দ্বীপ পরিকল্পনা", "bep 2100"],
    "ai_tech": ["artificial intelligence", "generative ai", "এআই", "কৃত্রিম বুদ্ধিমত্তা", "machine learning"]
}

# =====================================================================
# 4. Strict Noise Filter (Exclusion keywords)
# =====================================================================
EXCLUSION_KEYWORDS = [
    # Sports
    "cricket", "football", "goal", "ipl", "bpl", "world cup", "match", "wicket", "fifa", "messi", "ronaldo",
    "ক্রিকেট", "ফুটবল", "গোল", "আইপিএল", "বিপিএল", "বিশ্বকাপ", "উইকেট", "ফিফা",
    
    # Showbiz & Entertainment
    "bollywood", "hollywood", "actor", "actress", "wedding", "divorce", "movie", "cinema", 
    "box office", "horoscope", "celebrity", "drama", "hero", "heroine", "ott", "web series",
    "অভিনেতা", "অভিনেত্রী", "সিনেমা", "নাটক", "তারকা", "রাশিফল", "নায়ক", "নায়িকা", "বিনোদন", "সঙ্গীত",
    
    # Petty / Local Blotter Crime (Noise)
    "road accident", "killed in road", "motorcycle accident", "সড়ক দুর্ঘটনা", "নিহত", "লাশ উদ্ধার"
]
