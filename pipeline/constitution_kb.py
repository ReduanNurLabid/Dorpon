"""
Knowledge Base of Key Articles of the Constitution of the People's Republic of Bangladesh.
Used for deterministic citation matching and hallucination prevention in BCS Pro layers.
"""

CONSTITUTION_ARTICLES = {
    "7": {
        "title_bn": "সংবিধানের প্রাধান্য",
        "title_en": "Supremacy of the Constitution",
        "part": "Part I: The Republic",
        "summary": "All powers in the Republic belong to the people and an act inconsistent with the Constitution is void."
    },
    "11": {
        "title_bn": "গণতন্ত্র ও মানবাধিকার",
        "title_en": "Democracy and Human Rights",
        "part": "Part II: Fundamental Principles of State Policy",
        "summary": "The Republic shall be a democracy in which fundamental human rights and freedoms are guaranteed."
    },
    "15": {
        "title_bn": "মৌলিক প্রয়োজনের ব্যবস্থা",
        "title_en": "Provision of Basic Necessities",
        "part": "Part II: Fundamental Principles of State Policy",
        "summary": "State responsibility to secure food, clothing, shelter, education and medical care, and right to work."
    },
    "16": {
        "title_bn": "গ্রামীণ উন্নয়ন ও কৃষি বিপ্লব",
        "title_en": "Rural Development and Agricultural Revolution",
        "part": "Part II: Fundamental Principles of State Policy",
        "summary": "State measures to bring about rural development, electrification, cottage industries, agriculture."
    },
    "18A": {
        "title_bn": "পরিবেশ ও জীব-বৈচিত্র্য সংরক্ষণ ও উন্নয়ন",
        "title_en": "Protection and Improvement of Environment and Biodiversity",
        "part": "Part II: Fundamental Principles of State Policy",
        "summary": "State duty to protect and improve the environment and preserve natural resources, wetlands, forests and wildlife."
    },
    "19": {
        "title_bn": "সুযোগের সমতা",
        "title_en": "Equality of Opportunity",
        "part": "Part II: Fundamental Principles of State Policy",
        "summary": "State endeavor to ensure equality of opportunity to all citizens and remove social and economic inequality."
    },
    "20": {
        "title_bn": "অধিকার ও কর্তব্যরূপে কর্ম",
        "title_en": "Work as a Right and Duty",
        "part": "Part II: Fundamental Principles of State Policy",
        "summary": "Work is a right, a duty and a matter of honour for every capable citizen. Proper reward for labour."
    },
    "27": {
        "title_bn": "আইনের দৃষ্টিতে সমতা",
        "title_en": "Equality before Law",
        "part": "Part III: Fundamental Rights",
        "summary": "All citizens are equal before law and are entitled to equal protection of law."
    },
    "28": {
        "title_bn": "ধর্ম প্রভৃতি কারণে বৈষম্য",
        "title_en": "Discrimination on grounds of religion, race, caste, sex or place of birth",
        "part": "Part III: Fundamental Rights",
        "summary": "State shall not discriminate against any citizen on grounds only of religion, race, caste, sex or place of birth. Special provisions for women, children or backward sections."
    },
    "31": {
        "title_bn": "আইনের আশ্রয়লাভের অধিকার",
        "title_en": "Right to Protection of Law",
        "part": "Part III: Fundamental Rights",
        "summary": "To enjoy the protection of the law, and to be treated in accordance with law, is the inalienable right of every citizen."
    },
    "32": {
        "title_bn": "জীবন ও ব্যক্তি-স্বাধীনতার অধিকাররক্ষণ",
        "title_en": "Protection of Right to Life and Personal Liberty",
        "part": "Part III: Fundamental Rights",
        "summary": "No person shall be deprived of life or personal liberty save in accordance with law."
    },
    "39": {
        "title_bn": "চিন্তা ও বিবেকের স্বাধীনতা এবং বাক্-স্বাধীনতা",
        "title_en": "Freedom of Thought and Conscience, and of Speech",
        "part": "Part III: Fundamental Rights",
        "summary": "Freedom of thought, conscience, speech, expression, and freedom of the press are guaranteed subject to reasonable restrictions."
    },
    "102": {
        "title_bn": "হাইকোর্ট বিভাগের কতিপয় আদেশ ও নির্দেশ ইত্যাদি দানের ক্ষমতা (রিট)",
        "title_en": "Power of High Court Division to issue certain orders and directions (Writ Jurisdiction)",
        "part": "Part VI: The Judiciary",
        "summary": "High Court powers to enforce fundamental rights and issue writ petitions (Mandamus, Certiorari, Habeas Corpus, Prohibition, Quo Warranto)."
    },
    "137": {
        "title_bn": "কর্মকমিশন প্রতিষ্ঠা (বিপিএসসি)",
        "title_en": "Establishment of Public Service Commissions (BPSC)",
        "part": "Part IX: The Services of Bangladesh",
        "summary": "Constitutional establishment of the Bangladesh Public Service Commission (BPSC)."
    },
    "140": {
        "title_bn": "কমিশনের কার্যাবলী",
        "title_en": "Functions of Commission",
        "part": "Part IX: The Services of Bangladesh",
        "summary": "Functions of the BPSC to conduct tests and examinations for the selection of suitable persons for the service of the Republic."
    }
}

def find_relevant_articles(text: str) -> list[dict]:
    """
    Scans news text ONLY for explicit constitutional, judicial writ, or fundamental rights issues.
    Returns an empty list [] if not directly applicable (e.g. general economic, commodity, or corporate news).
    """
    text_lower = text.lower()
    
    # Strict gatekeeper: Must explicitly mention the Constitution, High Court/Supreme Court, Writs, or Constitutional bodies
    constitutional_anchors = [
        "সংবিধান", "constitution", "constitutional",
        "হাইকোর্ট", "সুপ্রিম কোর্ট", "high court", "supreme court",
        "রিট", "writ petition", "মৌলিক অধিকার", "fundamental rights",
        "বিপিএসসি", "bpsc", "নির্বাচন কমিশন", "election commission",
        "অর্ডিন্যান্স", "ordinance", "গেজেট", "gazette"
    ]
    
    if not any(anchor in text_lower for anchor in constitutional_anchors):
        return []
        
    matches = []
    
    triggers = {
        "7": ["সংবিধানের প্রাধান্য", "unconstitutional", "supremacy of constitution"],
        "15": ["মৌলিক চাহিদা নিশ্চিত", "state obligation", "basic necessities guarantee"],
        "18A": ["পরিবেশ সংরক্ষণ আইন", "wetland protection ruling", "river pollution verdict", "নদী রক্ষা"],
        "27": ["আইনের দৃষ্টিতে সমতা", "rule of law violation", "equality before law"],
        "28": ["কোটা", "quota", "discrimination", "নারী অধিকার সংরক্ষণ", "অনগ্রসর নাগরিক"],
        "31": ["আইনের আশ্রয়লাভ", "due process", "detention without trial", "বেআইনি আটক"],
        "39": ["বাক-স্বাধীনতা", "freedom of press", "সাইবার নিরাপত্তা আইন", "cyber security act"],
        "102": ["রিট আবেদন", "writ petition", "হাইকোর্টের রুল", "suo moto", "হাইকোর্ট আদেশ", "judiciary ruling"],
        "137": ["বিপিএসসি", "bpsc", "পাবলিক সার্ভিস কমিশন", "civil service recruitment"]
    }
    
    for art_num, kw_list in triggers.items():
        if any(kw in text_lower for kw in kw_list):
            info = CONSTITUTION_ARTICLES.get(art_num)
            if info:
                matches.append({
                    "article_number": f"Article {art_num} (অনুচ্ছেদ {art_num})",
                    "article_title_bn": info["title_bn"],
                    "article_title_en": info["title_en"],
                    "legal_relevance": info["summary"]
                })
    return matches

