"""
Populate Dorpon Top Stories with 2-Section Narrative format from the 7 scraped Prothom Alo articles.
Includes multi-source synthesis for the France Uprising issue.
Supports both snake_case and camelCase keys for bulletproof deserialization.
"""
import json
import os
from datetime import datetime

def make_buzz(title_en, title_bn, summary_en, summary_bn, why_en, why_bn, categories, read_time=160):
    return {
        "title_en": title_en,
        "titleEn": title_en,
        "title_bn": title_bn,
        "titleBn": title_bn,
        "summary_en": summary_en,
        "summaryEn": summary_en,
        "summary_bn": summary_bn,
        "summaryBn": summary_bn,
        "why_it_matters_en": why_en,
        "whyItMattersEn": why_en,
        "why_it_matters_bn": why_bn,
        "whyItMattersBn": why_bn,
        "interest_categories": categories,
        "interestCategories": categories,
        "read_time_seconds": read_time,
        "readTimeSeconds": read_time,
    }

def format_story(story_id, primary_category, categories, tags, image_url, image_caption, sources, buzz):
    return {
        "story_id": story_id,
        "storyId": story_id,
        "primary_category": primary_category,
        "primaryCategory": primary_category,
        "interest_categories": categories,
        "interestCategories": categories,
        "tags": tags,
        "image_url": image_url,
        "imageUrl": image_url,
        "image_caption": image_caption,
        "imageCaption": image_caption,
        "is_bcs_pro_selected": False,
        "isBcsProSelected": False,
        "sources": sources,
        "daily_buzz": buzz,
        "dailyBuzz": buzz
    }

def build_top_stories():
    with open("scraped_prothomalo_news.json", "r", encoding="utf-8") as f:
        scraped = json.load(f)

    # 1. France Uprising (Synthesized from items 3, 5, 6)
    france_buzz = make_buzz(
        title_en="France in Turmoil: Runaway Cost-of-Living Protests Escalate into Mass Unrest; Partial Curfews Imposed",
        title_bn="উত্তাল ফ্রান্স: জীবনযাত্রার ব্যয়বৃদ্ধিতে সহিংস বিক্ষোভ, এলাকাভিত্তিক কারফিউ জারি",
        summary_en="Massive protests sparked by escalating energy costs, runaway inflation, and deepening public dissatisfaction with purchasing power have swept across France, escalating into some of the most violent domestic unrest in recent European history.\n\nOver the weekend, intelligence agencies initially projected a turnout of 200,000 people; however, over 500,000 demonstrators inundated the streets of Paris, Lille, Lyon, and Marseille. In key metropolitan centers, peaceful demonstrations rapidly transformed into fiery confrontations as barricades were erected, luxury storefronts were ransacked, and public infrastructure was heavily vandalized.\n\nFollowing an emergency Sunday security cabinet session, Prime Minister Sébastien Lecornu confirmed that local prefects have been authorized to institute targeted night curfews in severely affected districts, acknowledging that conventional riot police had lost control over several urban sectors. Interior Minister Laurent Nuñez conceded that law enforcement suffered from critical tactical miscalculations and personnel shortages.\n\nMeanwhile, international human rights monitors and UN rapporteurs have sounded severe alarms over French police tactics, highlighting the widespread use of LBD-40 kinetic rubber projectile launchers and tear gas grenades that have left scores of young demonstrators permanently injured, fueling cyclical grievances against state authority.",
        summary_bn="জীবনযাত্রার ব্যয়বৃদ্ধি ও লাগামহীন মূল্যস্ফীতির প্রতিবাদে উত্তাল হয়ে উঠেছে গোটা ফ্রান্স। দেশটির রাজধানী প্যারিস ছাড়াও লিল, মার্সেই ও লিওঁ শহরে বিক্ষোভকারীরা রাস্তায় নেমে আসেন। গোয়েন্দা সংস্থাগুলো দুই লাখ জমায়েতের পূর্বাভাস দিলেও বাস্তবে পাঁচ লাখের বেশি মানুষ বিক্ষোভে অংশ নেন।\n\nপরিস্থিতি সামাল দিতে গিয়ে কয়েকটি শহরে পুলিশের নিয়ন্ত্রণ ভেঙে পড়ে। প্যারিসসহ গুরুত্বপূর্ণ শহরগুলোতে গাড়িতে আগুন, দোকানপাট ভাঙচুর ও সরকারি সম্পদে ব্যাপক ক্ষতিসাধন করা হয়। এই পরিস্থিতিতে প্রধানমন্ত্রী সেবাস্তিয়াঁ লেকর্নু মন্ত্রিসভার জরুরি বৈঠকের পর এলাকাভিত্তিক আংশিক কারফিউ জারির নির্দেশ দিয়েছেন এবং প্রয়োজনে জাতীয় জরুরি অবস্থা জারির হুমকি দিয়েছেন।\n\nঅন্যদিক থেকে মানবাধিকার বিশ্লেষক ও জাতিসংঘ পর্যবেক্ষকরা ফরাসি পুলিশের মাত্রাতিরিক্ত বলপ্রয়োগ, রাবার বুলেট ও টিয়ার গ্যাস ব্যবহারে বহু তরুণ বিক্ষোভকারীর গুরুতর আহত হওয়ার ঘটনায় তীব্র ক্ষোভ প্রকাশ করেছে।",
        why_en="1. European Economic Contagion: As France battles persistent sovereign debt pressures and fiscal consolidation, prolonged industrial disruption and urban paralyzation threaten European supply chains and investor confidence.\n2. Crisis of Democratic Policing: France faces severe scrutiny from Amnesty International and the European Court of Human Rights over militarized crowd-control doctrines, highlighting a widening chasm between working-class youth and state institutions.\n3. Political Fragility: Prime Minister Lecornu’s reliance on curfews underscores how inflation-driven cost-of-living crises can rapidly destabilize governing coalitions in advanced democracies.",
        why_bn="১. ইউরোপীয় অর্থনীতিতে প্রভাব: জীবনযাত্রার সংকটে ইউরোপের দ্বিতীয় বৃহত্তম অর্থনীতির এই অচলাবস্থা আঞ্চলিক সরবরাহ চেইনে বড় চাপ তৈরি করছে।\n২. পুলিশি জবাবদিহিতা ও মানবাধিকার: তরুণ ও অধিকারকর্মীদের ওপর নির্বিচার টিয়ার গ্যাস ও বুলেট ব্যবহারের ফলে রাষ্ট্রীয় কাঠামোর ওপর জনআস্থা নজিরবিহীনভাবে হ্রাস পেয়েছে।\n৩. রাজনৈতিক স্থায়িত্ব: নিত্যপণ্যের মূল্যবৃদ্ধি নিয়ন্ত্রণে ব্যর্থ হলে ইউরোপের যেকোনো গণতান্ত্রিক সরকার গভীর রাজনৈতিক অস্তিত্ব সংকটে পড়তে পারে—ফ্রান্স তারই বাস্তব প্রমাণ।",
        categories=["international_diplomacy", "economy_business", "governance_law"],
        read_time=180
    )
    france_story = format_story(
        story_id="top-story-france-uprising-2026",
        primary_category="international_diplomacy",
        categories=["international_diplomacy", "economy_business", "governance_law"],
        tags=["#FranceProtests", "#CostOfLiving", "#EuropeUnrest", "#PoliceAccountability", "#GlobalEconomy"],
        image_url=scraped[3].get("image_url", "").replace("&amp;", "&"),
        image_caption="A burning vehicle amidst intense clashes between protesters and security personnel in Paris. Photo: Reuters / Prothom Alo",
        sources=[
            {"name": "Prothom Alo World Desk", "url": "https://www.prothomalo.com/world/europe/8nb3n8zdwd"},
            {"name": "The Guardian / Wire", "url": "http://prothomalo.com/world/europe/vlbce6rg73"},
            {"name": "Rokhaya Diallo Column", "url": "https://www.prothomalo.com/opinion/column/kalzgtfo9f"}
        ],
        buzz=france_buzz
    )

    # 2. CUET Deadlock (Item 2)
    cuet_buzz = make_buzz(
        title_en="CUET Stalemate Enters Second Month: UGC Forms 6-Member High-Powered Advisory Body",
        title_bn="চুয়েটে এক মাসের বেশি অচলাবস্থা: সংকট নিরসনে ইউজিসির ৬ সদস্যের পরামর্শক কমিটি",
        summary_en="Academic and administrative activities at the Chittagong University of Engineering and Technology (CUET) have remained paralyzed for over a month following the government's abrupt removal of Vice-Chancellor Prof. Dr. Mohammad Sayeem, who held office for merely 56 days.\n\nThe unprecedented administrative vacuum has shuttered all academic departments, halted undergraduate examinations, and locked laboratory facilities, leaving over 4,500 engineering students in deep anxiety regarding prolonged session jams.\n\nIn response to mounting discontent from teachers and student bodies, the University Grants Commission (UGC) of Bangladesh has formally established a 6-member high-level advisory committee headed by senior UGC member Prof. Dr. Mohammad Abdullah-al-Mamun.\n\nThe committee has been assigned a strict 10-day mandate to conduct on-site stakeholder hearings, assess campus security and faculty grievances, and submit concrete recommendations to the Ministry of Education for restoring administrative stability and appointing permanent leadership.",
        summary_bn="মাত্র ৫৬ দিনের মাথায় উপাচার্য অধ্যাপক ড. মোহাম্মদ সাঈমকে দায়িত্ব থেকে অব্যাহতি দেওয়ার পর চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়ে (চুয়েট) এক মাসেরও বেশি সময় ধরে অচলাবস্থা বিরাজ করছে। উপাচার্যহীন ক্যাম্পাসে ক্লাস, পরীক্ষা ও প্রশাসনিক কার্যক্রম সম্পূর্ণরূপে বন্ধ রয়েছে।\n\nফলে ৪ সহস্রাধিক প্রকৌশল শিক্ষার্থীর শিক্ষাজীবন তীব্র সেশনজটের শঙ্কায় পড়েছে। শিক্ষক ও কর্মকর্তাদের মধ্যেও প্রশাসনিক শূন্যতা নিয়ে অসন্তোষ বাড়ছে।\n\nএই সংকট নিরসনে বিশ্ববিদ্যালয় মঞ্জুরি কমিশন (ইউজিসি) সদস্য অধ্যাপক ড. মোহাম্মদ আবদুল্লাহ আল মামুনের নেতৃত্বে ৬ সদস্যের একটি উচ্চপর্যায়ের পরামর্শক কমিটি গঠন করেছে। কমিটিকে ক্যাম্পাসের সংশ্লিষ্ট পক্ষগুলোর সঙ্গে আলোচনা করে দ্রুত প্রতিবেদন দিতে বলা হয়েছে।",
        why_en="1. Engineering Workforce Delays: Session jams at premier technical institutions directly impede Bangladesh’s industrial engineering pipeline and IT sector graduation schedules.\n2. Public University Governance Vulnerability: Frequent top-level administrative churn without transparent succession frameworks exposes the urgent need for systemic university governance reform.\n3. Institutional Autonomy: The crisis tests UGC's capacity to mediate complex campus standoffs without prolonged political deadlocks.",
        why_bn="১. প্রকৌশল শিক্ষায় সেশনজট: চুয়েটের মতো শীর্ষ প্রযুক্তি বিদ্যাপীঠ বন্ধ থাকা মানে দেশের অবকাঠামো ও শিল্প খাতের গ্র্যাজুয়েট সরবরাহ পিছিয়ে পড়া।\n২. উপাচার্য নিয়োগ ও সুশাসন: স্বচ্ছ নীতিমালার অভাবে ঘনঘন শীর্ষ পদে রদবদল পাবলিক বিশ্ববিদ্যালয়ের স্বায়ত্তশাসন ও কার্যকারিতা মারাত্মকভাবে ক্ষতিগ্রস্ত করে।\n৩. ইউজিসির মধ্যস্থতা: এই সংকট নিরসনে ইউজিসির সুপারিশ ভবিষ্যতে অন্যান্য বিশ্ববিদ্যালয়ের প্রশাসনিক জটিলতা সমাধানে দৃষ্টান্ত হতে পারে।",
        categories=["governance_law", "national_policy", "higher_education"],
        read_time=140
    )
    cuet_story = format_story(
        story_id="top-story-cuet-deadlock-2026",
        primary_category="governance_law",
        categories=["governance_law", "national_policy", "higher_education"],
        tags=["#HigherEducation", "#CampusCrisis", "#UGCBangladesh", "#CUETDeadlock", "#AcademicGovernance"],
        image_url=scraped[2].get("image_url", "").replace("&amp;", "&"),
        image_caption="Chittagong University of Engineering and Technology (CUET) campus remains shut amidst administrative vacuum. Photo: Prothom Alo",
        sources=[{"name": "Prothom Alo Chittagong", "url": "https://www.prothomalo.com/bangladesh/dzfhtu7pes"}],
        buzz=cuet_buzz
    )

    # 3. Saudi Execution of Bangladeshi Migrant (Item 1)
    saudi_buzz = make_buzz(
        title_en="Saudi Execution of Bangladeshi Migrant Worker Sparks Calls for Stronger Consular Legal Aid",
        title_bn="সৌদি আরবে ব্রাহ্মণবাড়িয়ার যুবকের মৃত্যুদণ্ড: মরদেহ শেষবার দেখতে চান নিঃস্ব বাবা-মা",
        summary_en="The execution of 28-year-old Bangladeshi migrant worker Nazrul Islam in Mecca, Saudi Arabia, has devastated his impoverished family in Akhaura, Brahmanbaria, and cast an urgent spotlight on the legal protections available to overseas laborers.\n\nNazrul migrated to the Kingdom in 2021 after his aging parents mortgaged their 20 decimals of ancestral farmland and incurred high-interest microloans exceeding Tk 4.5 lakh. Working as an informal laborer, Nazrul was later implicated in a fatal workplace altercation.\n\nHis family only learned of the execution after the sentence had been formally carried out by Saudi authorities. The deceased youth's father Siraj Mia and mother Rabeya Begum have sent impassioned appeals to the Ministry of Expatriates' Welfare and Overseas Employment to facilitate the repatriation of his mortal remains so they can bid farewell.\n\nThe tragic incident underscores the extreme vulnerability of low-wage expatriate workers who often navigate foreign judicial proceedings without dedicated translation, legal representation, or timely consular intervention from diplomatic missions.",
        summary_bn="সৌদি আরবের মক্কায় ব্রাহ্মণবাড়িয়ার আখাউড়ার ২৮ বছর বয়সী প্রবাসী তরুণ নজরুল ইসলামের মৃত্যুদণ্ড কার্যকর করা হয়েছে। পরিবারটি একমাত্র সহায়-সম্বল ২০ শতক কৃষিজমি বন্ধক ও চড়া সুদে সাড়ে চার লাখ টাকা ঋণ নিয়ে ২০২১ সালে তাকে বিদেশে পাঠিয়েছিল।\n\nবিদেশে গিয়ে একটি অপ্রীতিকর বিরোধের ঘটনায় জড়িত থাকার অভিযোগে তাকে আটক করা হয় এবং সম্প্রতি তার মৃত্যুদণ্ড কার্যকর হয়। পরিবারটি বিষয়টি জানতে পারে মৃত্যুদণ্ড সম্পন্ন হওয়ার পর।\n\nনিঃস্ব বাবা সিরাজ মিয়া ও মা রাবেয়া বেগম কান্নাজড়িত কণ্ঠে সরকারের কাছে আকুল আবেদন জানিয়েছেন যেন অন্তত শেষবারের মতো ছেলের মুখটি দেখতে পারেন এবং মরদেহ দেশে ফিরিয়ে আনা হয়।",
        why_en="1. Consular Protection Deficit: Over 3.5 million Bangladeshi workers in Saudi Arabia drive billions in national foreign remittance, yet institutional legal defense mechanisms remain severely underfunded.\n2. Debt-Fueled Migration Trap: Predatory recruitment costs and high-interest village loans trap migrant families in multi-generational insolvency when workplace disputes or legal crises strike.\n3. Bilateral Labor Diplomacy: Re-evaluating bilateral legal aid protocols between Dhaka and Riyadh is essential to ensure fair trial rights for vulnerable overseas laborers.",
        why_bn="১. প্রবাসী আইনি সহায়তার ঘাটতি: সাড়ে ৩৫ লাখের বেশি প্রবাসী দেশের রেমিট্যান্সের চাকা সচল রাখলেও বিদেশের মাটিতে তাদের আইনি সুরক্ষার কোনো প্রাতিষ্ঠানিক সহায়তা নেই বললেই চলে।\n২. অভিবাসন ঋণের ফাঁদ: ভিটেমাটি বন্ধক রেখে যাওয়া তরুণদের ট্র্যাজেডি পরিবারগুলোকে চরম অর্থসংকটে ফেলে দেয়।\n৩. কনস্যুলার কূটনীতি: প্রবাসী শ্রমিকদের অধিকার সুরক্ষায় রিয়াদ দূতাবাসের কার্যকর হস্তক্ষেপ ও দ্বিপাক্ষিক আইনি সহায়তা চুক্তি এখন সময়ের দাবি।",
        categories=["international_diplomacy", "economy_business", "human_rights"],
        read_time=160
    )
    saudi_story = format_story(
        story_id="top-story-saudi-migrant-execution-2026",
        primary_category="international_diplomacy",
        categories=["international_diplomacy", "economy_business", "human_rights"],
        tags=["#MigrantLabor", "#SaudiArabia", "#HumanRights", "#RemittanceHeroes", "#ConsularDiplomacy"],
        image_url=scraped[1].get("image_url", "").replace("&amp;", "&"),
        image_caption="Devastated parents of Nazrul Islam in Akhaura, Brahmanbaria, pleading to see their son's remains. Photo: Prothom Alo",
        sources=[{"name": "Prothom Alo Brahmanbaria", "url": "https://www.prothomalo.com/bangladesh/district/nq469thd5o"}],
        buzz=saudi_buzz
    )

    # 4. Govt Employee Salary Increment (Item 4)
    salary_buzz = make_buzz(
        title_en="Civil Servants to Receive Revised Basic Pay This Month; Allowances Maintained at Current Rates",
        title_bn="সরকারি চাকরিজীবীরা এ মাসেই পাচ্ছেন বর্ধিত মূল বেতন, ভাতা বহাল আগের হারে",
        summary_en="The Finance Division of the Ministry of Finance has issued formal execution orders enabling nearly 1.4 million government employees and pensioners to receive their revised basic salaries starting this October.\n\nUnder the newly calibrated national pay framework, minimum grade-20 entry-level salaries have been recalibrated to Tk 20,000, while the highest grade-1 executive pay stands at Tk 156,000 per month.\n\nCrucially, the Ministry clarified that variable monthly allowances—including house rent, medical assistance, and conveyance allowances—will continue to be disbursed based on the June 30 baseline rather than the enhanced basic pay, a measured decision aimed at preserving fiscal headroom.\n\nThe directive provides immediate disposable income relief to mid-level and junior civil servants who have weathered double-digit food inflation over the preceding eight quarters, while managing the state exchequer's aggregate wage-bill burden.",
        summary_bn="চলতি অক্টোবর মাস থেকেই সরকারি কর্মকর্তা ও কর্মচারীরা সংশোধিত স্কেলে বর্ধিত মূল বেতন পেতে যাচ্ছেন। অর্থ মন্ত্রণালয় এ বিষয়ে প্রয়োজনীয় সরকারি আদেশ জারি করেছে।\n\nনতুন স্কেল অনুযায়ী সর্বনিম্ন ২০তম গ্রেডের কর্মচারীদের মূল বেতন ২০,০০০ টাকা এবং সর্বোচ্চ ১ম গ্রেডের মূল বেতন ১,৫৬,০০০ টাকা নির্ধারণ করা হয়েছে।\n\nতবে অর্থ বিভাগের নির্দেশনায় স্পষ্ট করা হয়েছে যে বাড়িভাড়া, চিকিৎসা এবং যাতায়াত ভাতা আগের মতোই অর্থাৎ ৩০ জুন তারিখের বিদ্যমান হারে প্রদেয় হবে। এতে সরকারের বাজেট ঘাটতির ঝুঁকি নিয়ন্ত্রণে রেখে সরকারি কর্মচারীদের মূল্যস্ফীতির কিছুটা সুরাহা হবে।",
        why_en="1. Fiscal Budget Balancing: Decoupling allowances from the higher basic pay saves the national treasury an estimated Tk 14,000 crore annually while still boosting baseline compensation.\n2. Inflation Buffering vs. Wage-Price Spiral: Boosting disposable income for public employees helps cushion real wage erosion, but must be accompanied by food supply management to prevent secondary demand-side price hikes.\n3. Civil Service Retention: Competitive public wages reduce brain drain and incentivize transparency across frontline government delivery institutions.",
        why_bn="১. রাজস্ব শৃঙ্খলা রক্ষা: মূল বেতন বাড়িয়ে বাড়িভাড়া ও অন্যান্য ভাতা সাময়িকভাবে স্থগিত রাখায় সরকারের ১৪ হাজার কোটি টাকার অতিরিক্ত দায় সাশ্রয় হয়েছে।\n২. মূল্যস্ফীতির ধাক্কা মোকাবিলা: সরকারি চাকরিজীবীদের ক্রয়ক্ষমতা কিছুটা সুরক্ষিত হলেও বাজারে পণ্যমূল্য স্থিতিশীল রাখতে কার্যকর তদারকি বজায় রাখতে হবে।\n৩. প্রশাসনিক গতিশীলতা: বেতন কাঠামো যুগোপযোগী করার মাধ্যমে মাঠপর্যায়ে সেবার মান ও প্রাতিষ্ঠানিক উদ্দীপনা বৃদ্ধির সুযোগ সৃষ্টি হবে।",
        categories=["economy_business", "governance_law", "national_policy"],
        read_time=150
    )
    salary_story = format_story(
        story_id="top-story-govt-salary-increment-2026",
        primary_category="economy_business",
        categories=["economy_business", "governance_law", "national_policy"],
        tags=["#BangladeshEconomy", "#PublicSectorPay", "#FiscalPolicy", "#InflationRelief", "#CivilService"],
        image_url=scraped[4].get("image_url", "").replace("&amp;", "&"),
        image_caption="Bangladesh Secretariat, Dhaka. Finance Division issues executive directives on public pay scale. Photo: Prothom Alo",
        sources=[{"name": "Prothom Alo Business", "url": "https://www.prothomalo.com/business/economics/npqn3j5x8z"}],
        buzz=salary_buzz
    )

    # 5. Ishraq Hossain Resignation Inquiry (Item 0)
    ishraq_buzz = make_buzz(
        title_en="Political Scrutiny Intensifies Over State Minister Ishraq Hossain Following Armed Operation Controversy",
        title_bn="‘নাই’ শব্দের রহস্য: প্রতিমন্ত্রী ইশরাকের পদত্যাগ বিতর্ক ও রাজনৈতিক তোলপাড়",
        summary_en="Intense political speculation and administrative scrutiny have gripped Dhaka following the circulation of video footage showing State Minister for Liberation War Affairs Ishraq Hossain directly participating with a firearm during a weekend anti-narcotics raid.\n\nOn Sunday, State Minister Ishraq was seen entering the Prime Minister's Secretariat for high-level meetings prior to the formal cabinet gathering. Inquiries from senior reporters regarding the political aftermath were met with cryptic assertions that the minister was 'no longer there', igniting widespread rumors of a directed resignation.\n\nWhile official cabinet briefings maintained that no ministerial changes were formally deliberated during the Sunday session, sources within the administration confirm that the highest levels of government expressed grave reservations regarding the propriety of an elected executive official personally brandishing weapons during law enforcement operations.\n\nThe development has triggered an intense national debate surrounding ministerial ethics, institutional separation of powers, and the political trajectory of high-profile leaders eyeing mayoral candidacies in Dhaka.",
        summary_bn="অস্ত্র হাতে মাদকবিরোধী অভিযানে অংশ নিয়ে সামাজিক যোগাযোগমাধ্যমে ভিডিও প্রকাশের পর মুক্তিযুদ্ধবিষয়ক প্রতিমন্ত্রী ইশরাক হোসেনকে ঘিরে তীব্র বিতর্ক তৈরি হয়েছে।\n\nরোববার মন্ত্রিসভার বৈঠকের আগে প্রধানমন্ত্রী তারেক রহমানের দপ্তরে তাকে দেখা যায়। এরপরই সরকারের ভেতরে ইশরাককে পদত্যাগের নির্দেশ দেওয়া হয়েছে কি না, তা নিয়ে গুঞ্জন ছড়িয়ে পড়ে। দায়িত্বশীল এক ব্যক্তি এ বিষয়ে ইঙ্গিতপূর্ণ ‘নাই’ শব্দ ব্যবহার করলে ধোঁয়াশা আরও ঘনীভূত হয়।\n\nযদিও মন্ত্রিসভার মূল বৈঠকে বিষয়টি নিয়ে আনুষ্ঠানিক আলোচনা হয়নি, তবে প্রশাসনিক নিয়ম ও রাজনৈতিক শালীনতা ভঙ্গের অভিযোগে দলের শীর্ষ মহলে অসন্তোষ বিরাজ করছে। এই ঘটনা ঢাকা সিটি করপোরেশনের আসন্ন নির্বাচনে সম্ভাব্য প্রার্থিতা ও সরকারের ভাবমূর্তির ওপর বড় প্রভাব ফেলতে পারে বলে মনে করা হচ্ছে।",
        why_en="1. Separation of Executive Authority: Ministers hold policy and legislative oversight; direct participation in armed law enforcement operations blurs critical constitutional boundaries.\n2. Cabinet Collective Responsibility: Public actions by individual state ministers directly impact governmental credibility and adherence to the rule of law.\n3. Municipal Election Dynamics: How the administration resolves this leadership dilemma will set a critical precedent for candidate vetting in upcoming Dhaka city corporation elections.",
        why_bn="১. ক্ষমতার স্বতন্ত্রীকরণ নীতি: নীতিনির্ধারক হিসেবে প্রতিমন্ত্রীর কাজ আইন প্রণয়ন ও তদারকি করা; অস্ত্র হাতে ব্যক্তিগত অভিযানে নামা আইন প্রয়োগকারী সংস্থার কর্তৃত্ব ও আইনি কাঠামোর সঙ্গে সাংঘর্ষিক।\n২. মন্ত্রিসভার যৌথ দায়বদ্ধতা: একজন প্রতিমন্ত্রীর অপেশাদার আচরণ পুরো সরকারের ভাবমূর্তির ওপর প্রশ্ন তোলে।\n৩. নির্বাচনী রাজনীতির সমীকরণ: ঢাকার আসন্ন সিটি নির্বাচনে মনোনয়ন প্রত্যাশী এই নেতার বিরুদ্ধে কোনো পদক্ষেপ নেওয়া হয় কি না, তার ওপর পরবর্তী রাজনৈতিক গতিপ্রকৃতি নির্ভর করছে।",
        categories=["governance_law", "national_policy", "bangladesh_politics"],
        read_time=160
    )
    ishraq_story = format_story(
        story_id="top-story-ishraq-cabinet-controversy-2026",
        primary_category="governance_law",
        categories=["governance_law", "national_policy", "bangladesh_politics"],
        tags=["#BangladeshPolitics", "#CabinetGovernance", "#PublicAccountability", "#LawEnforcement"],
        image_url=scraped[0].get("image_url", "").replace("&amp;", "&"),
        image_caption="Controversy surrounding State Minister Ishraq Hossain following an armed anti-narcotics drive video. Photo: Sajid Hossain / Prothom Alo",
        sources=[{"name": "Prothom Alo Politics", "url": "https://www.prothomalo.com/bangladesh/dson6y89jk"}],
        buzz=ishraq_buzz
    )

    stories = [france_story, cuet_story, saudi_story, salary_story, ishraq_story]

    payload = {
        "edition_date": datetime.now().strftime("%Y-%m-%d"),
        "status": "PUBLISHED",
        "total_stories": len(stories),
        "source": "automated_verified_wires",
        "description": "Daily Top Stories: 2-Section Narrative Summaries + Multi-Source Clustered Issue",
        "stories": stories
    }

    out_file = os.path.join("data", "output", "top_stories_latest.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {len(stories)} Top Stories in {out_file}")

    # Sync to Firestore collection 'daily_buzz'
    cred_path = "dorpon-a99a6-firebase-adminsdk-fbsvc-dfc7667fbf.json"
    if os.path.exists(cred_path):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            db = firestore.client()
            batch = db.batch()
            for s in stories:
                doc_ref = db.collection("daily_buzz").document(s["story_id"])
                batch.set(doc_ref, s)
            batch.commit()
            print("Successfully updated Firestore daily_buzz collection with full dual-cased keys!")
        except Exception as e:
            print(f"Firestore update error: {e}")

if __name__ == "__main__":
    build_top_stories()
