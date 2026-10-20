# Dorpon Daily — Ingestion, AI Processing & Curation Pipeline

**Daily Current Affairs That Save Time**  
Dual-mode daily capsule for Bangladesh:
- **Daily Buzz**: 100% Free, 60-second minimalist news summaries tailored to user interests.
- **BCS Pro**: Paid Premium study engine with data, constitutional articles, analytical breakdowns, and 30 years of linked past BPSC exam questions.

---

## Architecture Overview

```
c:\Users\Reduan\Downloads\Dorpon Daily\
├── pipeline\
│   ├── config.py                 # RSS endpoints, Category taxonomy, BPSC preset weights
│   ├── models.py                 # Pydantic schemas (DailyBuzz, BcsPro, DailyCapsule)
│   ├── constitution_kb.py        # Verified Bangladesh Constitution lookup (153 articles)
│   ├── collectors\
│   │   ├── rss_fetcher.py        # Fetches live RSS from Daily Star & Prothom Alo
│   │   └── article_scraper.py    # Extracts clean article body paragraphs
│   ├── processing\
│   │   ├── deduplicator.py       # Cross-source event clustering & BPSC scoring
│   │   ├── selector.py           # Routes stories (BCS Preset vs User Interests)
│   │   └── synthesizer.py        # Bilingual synthesis (Gemini 1.5 + Fallback engine)
│   └── run_pipeline.py           # Master 4:30 AM cron ingestion script
├── api\
│   └── server.py                 # FastAPI backend serving Flutter client & Admin UI
└── data\
    ├── output\                   # Generated daily editions (e.g. capsule_latest.json)
    └── pyqs.json                 # 30-Year Past BPSC Exam Question Bank
```

---

## How It Solves Audience Routing

### 1. BCS Pro (Strict Academic Preset)
- Filters on BPSC syllabus pillars: Macroeconomy, Constitution/Law, Foreign Diplomacy, Climate/Delta Plan, Public Admin.
- The pipeline scores each morning's news and selects the top **3 to 5 stories**.
- Enriches with:
  - 📊 BBS & Bangladesh Bank statistics
  - 📜 Real Constitutional articles verified against `constitution_kb.py`
  - 🏛️ BPSC Written Analytical Breakdown
  - ✍️ Formal 10–15 mark exam question + 3-point model outline
  - 📚 Linked 30-Year PYQs

### 2. Daily Buzz (Personalized Interest Routing)
- The pipeline curates an 8 to 10 story pool across:
  - `economy_business`
  - `governance_law`
  - `tech_innovation`
  - `climate_environment`
  - `world_diplomacy`
  - `society_education`
- The Flutter client sends the user's selected interests: `GET /api/feed/buzz?interests=tech_innovation,economy_business`.
- The API dynamically serves their top 3–5 cards. If no preferences are set, it returns the top national highlights.

---

## Quickstart Commands

### 1. Run Morning Ingestion Pipeline
```powershell
.\venv\Scripts\python.exe -m pipeline.run_pipeline
```

### 2. Start API Server (for Flutter App & Admin)
```powershell
.\venv\Scripts\uvicorn.exe api.server:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- BCS Pro Feed: `http://localhost:8000/api/feed/bcs-pro`
- Daily Buzz Feed (Personalized): `http://localhost:8000/api/feed/buzz?interests=economy_business`
- Human Review Approval: `POST http://localhost:8000/api/admin/approve`
