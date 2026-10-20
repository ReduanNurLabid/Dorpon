import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict
import time
import re
from pipeline.config import DEFAULT_HEADERS

DISCLAIMER_PATTERNS = [
    r"copyright\s*:",
    r"any unauthorized use or reproduction",
    r"all rights reserved",
    r"strictly prohibited and constitutes copyright",
    r"reproduction of this news or photos without written permission",
    r"prothom alo english desk",
    r"staff correspondent"
]

def is_boilerplate(text: str) -> bool:
    lower = text.lower()
    for pat in DISCLAIMER_PATTERNS:
        if re.search(pat, lower):
            return True
    return False

def scrape_article_details(url: str, timeout: int = 10, polite_delay: float = 0.3) -> Dict[str, Optional[str]]:
    """
    Extracts clean article body and optional lead image from any news source.
    Returns:
        {
            "body_text": str or None,
            "image_url": str or None
        }
    """
    result = {"body_text": None, "image_url": None}
    try:
        if polite_delay > 0:
            time.sleep(polite_delay)
            
        resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
        if resp.status_code != 200:
            return result
            
        soup = BeautifulSoup(resp.content, "html.parser")

        # 1. Extract optional og:image
        og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
        if og_img and og_img.get("content"):
            img_src = og_img["content"].strip()
            if img_src.startswith("http") and not any(ext in img_src.lower() for ext in ["logo", "favicon", "placeholder"]):
                result["image_url"] = img_src
        
        # 2. Decompose noisy HTML tags
        for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form", "figcaption", "noscript", "svg"]):
            tag.decompose()
            
        # 3. Decompose noisy CSS classes (ads, social buttons, banners, comments)
        noise_patterns = [
            "advertisement", "ad-box", "ad-container", "banner", "social-share",
            "related-news", "related-stories", "comments", "tags-list", "author-bio",
            "newsletter-signup", "breadcrumb"
        ]
        # Never decompose elements that contain main article bodies
        protected_classes = ["detail_widget", "detail_widget2", "widget_wrap", "story-content", "story-element", "content-detail", "post-content"]
        for el in soup.find_all(class_=lambda c: c and any(k in str(c).lower() for k in noise_patterns)):
            if not getattr(el, "attrs", None):
                continue
            classes = el.attrs.get("class", [])
            cls_str = " ".join(classes).lower() if isinstance(classes, list) else str(classes).lower()
            if not any(prot in cls_str for prot in protected_classes):
                el.decompose()
            
        paragraphs = []
        
        # 4. Source-specific content selectors
        # Prothom Alo
        pa_content = soup.find(class_=lambda c: c and any(k in str(c) for k in ["story-element", "story-content", "content-wrapper"]))
        if pa_content:
            p_tags = pa_content.find_all("p")
            paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 25]
            
        # The Daily Star
        if not paragraphs:
            ds_content = soup.find(class_=lambda c: c and any(k in str(c) for k in ["field-name-body", "article-details", "node-news", "section-article"]))
            if ds_content:
                p_tags = ds_content.find_all("p")
                paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 25]
                
        # The Business Standard (TBS)
        if not paragraphs:
            tbs_content = soup.find(class_=lambda c: c and any(k in str(c) for k in ["story-content", "body-content", "field-body"]))
            if tbs_content:
                p_tags = tbs_content.find_all("p")
                paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 25]
                
        # Dhaka Tribune & Bangla Tribune
        if not paragraphs:
            dt_content = soup.find(class_=lambda c: c and any(k in str(c) for k in ["detail_widget2", "detail_widget", "content-detail", "story-content", "post-content", "report-content", "article-content"]))
            if dt_content:
                p_tags = dt_content.find_all("p")
                paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 25]

        # The Financial Express & BSS News
        if not paragraphs:
            fe_content = soup.find(class_=lambda c: c and any(k in str(c) for k in ["article-body", "news-details", "news-content", "news-detail"]))
            if fe_content:
                p_tags = fe_content.find_all("p")
                paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 25]
                
        # Universal Semantic <article> fallback
        if not paragraphs:
            article_tag = soup.find("article") or soup.find("main")
            if article_tag:
                p_tags = article_tag.find_all("p")
                paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 30]
                
        # Universal Density fallback
        if not paragraphs:
            p_tags = soup.find_all("p")
            paragraphs = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) > 35]
            
        # Clean reporter byline noise & copyright notices
        cleaned_paragraphs = []
        for p in paragraphs:
            clean_p = re.sub(r"\s+", " ", p).strip()
            if len(clean_p) > 25 and not clean_p.startswith("ছবি:") and not clean_p.startswith("Photo:") and not is_boilerplate(clean_p):
                cleaned_paragraphs.append(clean_p)
                
        if cleaned_paragraphs:
            result["body_text"] = "\n\n".join(cleaned_paragraphs[:8])
            
        return result
        
    except Exception as e:
        print(f"[Scraper] Failed to scrape article from {url}: {e}")
        return result

def scrape_article_body(url: str, timeout: int = 10, polite_delay: float = 0.3) -> Optional[str]:
    """Backward-compatible helper returning only body text."""
    details = scrape_article_details(url, timeout, polite_delay)
    return details.get("body_text")
