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
            "economy", "economic", "inflation", "bank", "banking", "tax", "taxes", "gdp", 
            "export", "import", "budget", "finance", "financial", "dollar", "reserve", 
            "forex", "interest rate", "revenue", "nbr", "trade", "commerce", "stock", 
            "market", "share market", "dse", "investment", "investor", "remittance", 
            "imf", "world bank", "central bank", "loan", "default", "customs", "tariff",
            "অর্থনীতি", "অর্থনৈতিক", "ব্যাংক", "মুদ্রাস্ফীতি", "মূল্যস্ফীতি", "রিজার্ভ", 
            "বাজেট", "রাজস্ব", "ডলার", "রপ্তানি", "আমদানি", "বাণিজ্য", "শেয়ারবাজার", 
            "ডিএসই", "রেমিট্যান্স", "বিনিয়োগ", "ঋণ", "কাস্টমস", "ভ্যাট", "ট্যাক্স"
        ]
    },
    "governance_law": {
        "en": "Governance, Law & Constitution",
        "bn": "শাসনব্যবস্থা, রাজনীতি ও সংবিধান",
        "keywords": [
            "court", "constitution", "constitutional", "police", "election", "commission", 
            "ministry", "parliament", "bpsc", "judiciary", "judge", "justice", "high court", 
            "supreme court", "ordinance", "resignation", "cabinet", "politics", "political", 
            "ishraque", "bnp", "awami", "jamaat", "adviser", "interim", "yunus", "governance", 
            "administration", "administrative", "dudok", "acc", "anticorruption", "anti-corruption",
            "protest", "reform", "commissioner", "deputy commissioner", "gazette", "magistrate",
            "আদালত", "সংবিধান", "সাংবিধানিক", "নির্বাচন", "মন্ত্রণালয়", "আইন", "প্রশাসন", 
            "দুদক", "হাইকোর্ট", "সুপ্রিম কোর্ট", "অধ্যাদেশ", "পদত্যাগ", "ইশরাক", "বিএনপি", 
            "আওয়ামী লীগ", "জামায়াত", "মন্ত্রিসভা", "উপদেষ্টা", "রাজনীতি", "রাজনৈতিক", 
            "স্বরাষ্ট্র", "আন্দোলন", "সংসদ", "বিচারপতি", "গেজেট", "সংস্কার", "ইউনূস"
        ]
    },
    "tech_innovation": {
        "en": "Technology & AI",
        "bn": "প্রযুক্তি ও এআই",
        "keywords": [
            "tech", "technology", "ai", "artificial intelligence", "digital", "internet", 
            "telecom", "satellite", "cyber", "cybersecurity", "innovation", "science", 
            "software", "hardware", "startup", "cloud", "data", "algorithm", "php", 
            "vulnerability", "hacker", "hacking", "chip", "semiconductor", "robot", 
            "robotics", "app", "spacex", "nasa", "machine learning",
            "প্রযুক্তি", "বিজ্ঞান", "ইন্টারনেট", "এআই", "কৃত্রিম বুদ্ধিমত্তা", "সাইবার", 
            "সফটওয়্যার", "টেলিকম", "স্যাটেলাইট", "ডিজিটাল", "রোবট", "হ্যাকিং", "স্টার্টআপ"
        ]
    },
    "climate_environment": {
        "en": "Climate & Environment",
        "bn": "পরিবেশ ও জলবায়ু",
        "keywords": [
            "climate", "climate change", "flood", "flooding", "river", "environment", 
            "environmental", "pollution", "air quality", "aqi", "cyclone", "forest", 
            "delta", "renewable", "energy", "solar", "biodiversity", "wildlife", "drought", 
            "carbon", "emission", "heatwave", "rain", "monsoon", "disaster", "ecology",
            "পরিবেশ", "জলবায়ু", "বন্যা", "নদী", "দূষণ", "ঘূর্ণিঝড়", "ডেল্টা", "নবায়নযোগ্য", 
            "জ্বালানি", "বায়ুদূষণ", "তাপপ্রবাহ", "বৃষ্টি", "দুর্যোগ", "বন", "সুন্দরবন"
        ]
    },
    "world_diplomacy": {
        "en": "World & Geopolitics",
        "bn": "আন্তর্জাতিক ও কূটনীতি",
        "keywords": [
            "world", "international", "global", "geopolitics", "geopolitical", "diplomacy", 
            "diplomatic", "foreign", "foreign policy", "foreign minister", "ambassador", 
            "embassy", "treaty", "summit", "bilateral", "sanctions", "war", "conflict", 
            "ceasefire", "peacekeeping", "military", "nato", "pentagon", "white house", 
            "kremlin", "un", "united nations", "security council", "epstein",
            # Key countries and demonyms frequently appearing in world wires
            "india", "indian", "delhi", "modi", "pakistan", "pakistani", "islamabad", 
            "china", "chinese", "beijing", "xi jinping", "usa", "america", "american", 
            "washington", "biden", "trump", "russia", "russian", "moscow", "putin", 
            "ukraine", "kyiv", "zelensky", "israel", "israeli", "netanyahu", "palestine", 
            "palestinian", "gaza", "hamas", "iran", "iranian", "tehran", "middle east", 
            "saudi", "riyadh", "uae", "dubai", "qatar", "myanmar", "burma", "rohingya", 
            "japan", "japanese", "tokyo", "uk", "british", "britain", "london", "europe", 
            "european", "france", "french", "germany", "german", "turkey", "turkish", 
            "north korea", "south korea", "taiwan",
            # Bengali keywords
            "আন্তর্জাতিক", "বিশ্ব", "কূটনীতি", "কূটনৈতিক", "পররাষ্ট্র", "যুদ্ধ", "সংঘাত", 
            "যুদ্ধবিরতি", "শান্তি", "সামরিক", "ন্যাটো", "যুক্তরাষ্ট্র", "আমেরিকা", 
            "হোয়াইট হাউস", "ভারত", "ভারতীয়", "দিল্লি", "মোদি", "চীন", "চীনা", "বেইজিং", 
            "পাকিস্তান", "পাকিস্তানি", "ইসলামাবাদ", "রাশিয়া", "পুতিন", "ইউক্রেন", "জেলেনস্কি", 
            "ইসরায়েল", "ইসরাইল", "ফিলিস্তিন", "গাজা", "হামাস", "ইরান", "তেহরান", 
            "মধ্যপ্রাচ্য", "সৌদি", "মায়ানমার", "মিয়ানমার", "রোহিঙ্গা", "জাতিসংঘ", 
            "নিরাপত্তা পরিষদ", "চুক্তি", "ভূরাজনীতি", "নিষেধাজ্ঞা"
        ]
    },
    "society_education": {
        "en": "Society & Education",
        "bn": "সমাজ ও শিক্ষা",
        "keywords": [
            "education", "university", "college", "school", "student", "students", 
            "teacher", "teachers", "health", "hospital", "doctor", "medical", 
            "culture", "cultural", "public health", "campus", "academic", "youth", 
            "citizens", "religion", "religious", "community", "social", "welfare",
            "শিক্ষা", "বিশ্ববিদ্যালয়", "কলেজ", "স্কুল", "শিক্ষার্থী", "ছাত্র", "শিক্ষক", 
            "স্বাস্থ্য", "হাসপাতাল", "ডাক্তার", "মেডিকেল", "সংস্কার", "নাগরিক", 
            "সংস্কৃতি", "ক্যাম্পাস", "সমাজ", "ধর্মীয়"
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
    "tarique_visit": ["tarique", "তারেক রহমান", "japan", "জাপান", "tokyo", "টোকিও"],
    "ishraque_issue": ["ishraque", "ইশরাক", "ইশরাক হোসেন", "পদত্যাগ"],
    "bnp_politics": ["bnp", "বিএনপি", "খালেদা জিয়া"],
    "interim_cabinet": ["interim government", "অন্তর্বর্তী সরকার", "প্রধান উপদেষ্টা", "ইউনূস", "yunus", "উপদেষ্টা পরিষদ"],
    
    # Climate & Tech
    "delta_plan": ["delta plan", "ব-দ্বীপ পরিকল্পনা", "bep 2100"],
    "ai_tech": ["artificial intelligence", "generative ai", "এআই", "কৃত্রিম বুদ্ধিমত্তা", "machine learning"]
}

# =====================================================================
# 4. Strict Noise Filter (Exclusion keywords)
# =====================================================================
EXCLUSION_KEYWORDS = [
    # Sports - General & Competitions
    "cricket", "football", "soccer", "goal", "ipl", "bpl", "world cup", "match", 
    "wicket", "fifa", "uefa", "messi", "ronaldo", "champions league", "premier league", 
    "la liga", "bundesliga", "serie a", "europa league", "derby", "striker", "goalkeeper",
    "coach", "tennis", "badminton", "hockey", "athletics", "olympics", "nba", "basketball",
    "formula 1", "grand slam", "wimbledon", "stadium", "tournament", "semi-final", 
    "quarter-final", "penalty shootout", "clean sheet",
    # Football Clubs (European & Domestic)
    "arsenal", "bayern", "munich", "barcelona", "real madrid", "chelsea", "liverpool", 
    "manchester city", "man city", "manchester united", "man utd", "juventus", "psg", 
    "paris saint-germain", "inter milan", "ac milan", "tottenham", "borussia", "atletico",
    # Bengali Sports Terms
    "খেলাধুলা", "ক্রিকেট", "ফুটবল", "গোল", "আইপিএল", "বিপিএল", "বিশ্বকাপ", "উইকেট", 
    "ফিফা", "আর্সেনাল", "বায়ার্ন", "বার্সেলোনা", "রিয়াল মাদ্রিদ", "ম্যানচেস্টার", 
    "মেসি", "রোনালদো", "চ্যাম্পিয়নস লিগ", "প্রিমিয়ার লিগ", "সেমিফাইনাল", "কোয়ার্টার ফাইনাল",
    "স্ট্রাইকার", "গোলরক্ষক", "স্টেডিয়াম",
    
    # Showbiz, Celebrity & Tabloid Gossip
    "bollywood", "hollywood", "dhallywood", "actor", "actress", "wedding", "divorce", 
    "movie", "cinema", "box office", "horoscope", "celebrity", "drama", "hero", "heroine", 
    "ott", "web series", "song", "trailer", "teaser", "pageant", "miss world", "miss universe",
    "viral video", "viral photo", "leaked photo", "intimate photo",
    "অভিনেতা", "অভিনেত্রী", "সিনেমা", "নাটক", "তারকা", "রাশিফল", "নায়ক", "নায়িকা", 
    "বিনোদন", "সঙ্গীত", "গান", "ট্রেলার",
    
    # Commercial shopping, gadget discounts & deals (Noise)
    "discount", "deal", "deals", "refurbished", "sale", "save $", "coupon", "cashback",
    "mouse", "headset", "earbuds", "best buy", "amazon deal", "prime day", "black friday", "cyber monday",
    "ছাড়", "মূল্যছাড়", "ডিসকাউন্ট", "অফার", "সেল",

    # Petty / Local Blotter Crime (Noise)
    "road accident", "killed in road", "motorcycle accident", "সড়ক দুর্ঘটনা", "লাশ উদ্ধার"
]
