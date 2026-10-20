import re
from typing import List, Set
from pipeline.models import RawArticle
from pipeline.config import INTEREST_CATEGORIES, CANONICAL_ENTITIES

class ClusteredEvent:
    def __init__(self, primary_article: RawArticle):
        self.cluster_id = primary_article.id
        self.articles: List[RawArticle] = [primary_article]
        self.primary_title = primary_article.title
        self.matched_categories: List[str] = []
        self.bcs_score: float = 0.0
        self.canonical_entities: Set[str] = set()

def extract_canonical_entities(text: str) -> Set[str]:
    """Extracts normalized entity slugs across English and Bengali text."""
    text_lower = text.lower()
    entities = set()
    for entity_slug, variants in CANONICAL_ENTITIES.items():
        if any(v in text_lower for v in variants):
            entities.add(entity_slug)
    return entities

def categorize_article(text: str) -> List[str]:
    """Matches text against INTEREST_CATEGORIES keywords using strict word boundaries."""
    text_lower = text.lower()
    categories = []
    for cat_id, meta in INTEREST_CATEGORIES.items():
        score = 0
        for kw in meta["keywords"]:
            kw_clean = kw.strip().lower()
            if not kw_clean:
                continue
            if re.match(r'^[a-zA-Z0-9\s]+$', kw_clean):
                pattern = r'\b' + re.escape(kw_clean) + r'\b'
            else:
                pattern = r'(?:^|[^\w\u0980-\u09FF])' + re.escape(kw_clean) + r'(?:$|[^\w\u0980-\u09FF])'
            if re.search(pattern, text_lower):
                score += 1
        if score > 0:
            categories.append(cat_id)
    return categories or ["governance_law"]

def calculate_bcs_relevance(text: str) -> float:
    """
    Computes an academic BCS relevance score (0.0 to 10.0).
    High score for Constitution, Economic data, Judiciary, Treaties, Governance reforms, and Major Cabinet/Political transitions.
    """
    score = 0.0
    text_lower = text.lower()
    
    high_yield_signals = {
        # Economic / Planning (Paper V)
        "inflation": 2.5, "মুদ্রাস্ফীতি": 2.5, "মূল্যস্ফীতি": 2.5,
        "bangladesh bank": 2.5, "বাংলাদেশ ব্যাংক": 2.5, "repo rate": 2.5, "রেপো রেট": 2.5,
        "imf": 2.0, "world bank": 2.0, "bbs": 2.0, "gdp": 2.0, "বাজেট": 2.5, "budget": 2.5,
        "tax": 1.5, "nbr": 2.0, "রাজস্ব": 2.0, "রিজার্ভ": 2.5, "forex reserve": 2.5,
        
        # Constitutional / Judicial (Paper V)
        "constitution": 3.0, "সংবিধান": 3.0, "high court": 2.5, "supreme court": 2.5,
        "হাইকোর্ট": 2.5, "সুপ্রিম কোর্ট": 2.5, "writ": 2.5, "রিট": 2.5, "bpsc": 3.0,
        "ordinance": 2.0, "অধ্যাদেশ": 2.0, "গেজেট": 2.0, "gazette": 2.0,
        "fundamental right": 2.5, "মৌলিক অধিকার": 2.5,
        
        # Governance, Cabinet & High-Impact Political Developments (Paper V)
        "resignation": 2.5, "পদত্যাগ": 2.5, "cabinet": 2.5, "মন্ত্রিসভা": 2.5,
        "interim government": 3.0, "অন্তর্বর্তী": 3.0, "উপদেষ্টা": 2.5, "adviser": 2.5,
        "ishraque": 2.5, "ইশরাক": 2.5, "bnp": 2.0, "বিএনপি": 2.0,
        "election": 2.5, "নির্বাচন": 2.5, "reform": 2.0, "সংস্কার": 2.0,
        
        # Diplomatic / International (Paper VI)
        "bilateral": 2.0, "treaty": 2.5, "united nations": 2.0, "জাতিসংঘ": 2.0,
        "দ্বিপক্ষীয়": 2.0, "পররাষ্ট্র": 2.0, "foreign policy": 2.0, "সমঝোতা স্মারক": 2.5, "mou": 2.0,
        "geopolitics": 2.0, "ভূরাজনীতি": 2.0, "rohingya": 2.0, "রোহিঙ্গা": 2.0,
        
        # Climate / Infrastructure (Paper VII / Geo)
        "delta plan": 3.0, "ব-দ্বীপ পরিকল্পনা": 3.0, "renewable energy": 2.0, "নবায়নযোগ্য জ্বালানি": 2.0,
        "biodiversity": 2.0, "জীববৈচিত্র্য": 2.0,
        
        # Science & Tech (Paper IV)
        "cybersecurity": 2.5, "সাইবার নিরাপত্তা": 2.5, "artificial intelligence": 2.5, "এআই": 2.0
    }
    
    for term, weight in high_yield_signals.items():
        if term in text_lower:
            score += weight
            
    return min(score, 10.0)

def cluster_and_tag_articles(articles: List[RawArticle]) -> List[ClusteredEvent]:
    """
    Groups related articles using cross-lingual entity co-occurrence + token overlap.
    Merges Bengali and English stories on the same event into a single cluster.
    """
    clusters: List[ClusteredEvent] = []
    
    for art in articles:
        combined_text = f"{art.title} {art.summary_raw or ''} {art.body_text or ''}"
        art_entities = extract_canonical_entities(combined_text)
        art_tokens = set(re.findall(r"\w{4,}", art.title.lower()))
        
        matched_cluster = None
        
        for cluster in clusters:
            # Match 1: Cross-lingual entity overlap (shares 2+ canonical entities, e.g. 'bangladesh_bank' + 'repo_rate')
            entity_overlap = len(art_entities.intersection(cluster.canonical_entities))
            if entity_overlap >= 2:
                matched_cluster = cluster
                break
                
            # Match 2: Single highly-specific entity with category overlap
            high_specificity = {"repo_rate", "writ_petition", "delta_plan", "bpsc", "ishraque_issue", "rohingya", "interim_cabinet", "bnp_politics"}
            if entity_overlap >= 1 and art_entities.intersection(high_specificity):
                if set(cluster.matched_categories).intersection(set(categorize_article(combined_text))):
                    matched_cluster = cluster
                    break
            
            # Match 3: Same-language title token overlap
            cluster_tokens = set(re.findall(r"\w{4,}", cluster.primary_title.lower()))
            token_overlap = len(art_tokens.intersection(cluster_tokens))
            if token_overlap >= 3:
                matched_cluster = cluster
                break
                
        if matched_cluster:
            matched_cluster.articles.append(art)
            matched_cluster.canonical_entities.update(art_entities)
            # Recompute combined BCS score
            matched_cluster.bcs_score = max(matched_cluster.bcs_score, calculate_bcs_relevance(combined_text))
        else:
            new_cluster = ClusteredEvent(art)
            new_cluster.matched_categories = categorize_article(combined_text)
            new_cluster.bcs_score = calculate_bcs_relevance(combined_text)
            new_cluster.canonical_entities = art_entities
            clusters.append(new_cluster)
            
    # Sort clusters by BCS score descending
    clusters.sort(key=lambda c: c.bcs_score, reverse=True)
    return clusters
