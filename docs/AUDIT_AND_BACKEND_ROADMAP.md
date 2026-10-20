# Dorpon Daily: Architectural Audit & Backend Engineering Roadmap

**Document Version:** 1.0.0  
**Target Platform:** Python 3.12 (FastAPI / Pydantic / Google GenAI) + Flutter (Dart 3.x)  
**System Objective:** Dual-mode daily current affairs platform for Bangladesh — 60-second minimalist *Daily Buzz* & high-yield academic *BCS Pro* (Civilsdaily standard).

---

## 1. Executive Summary & Architecture Map

Dorpon Daily possesses a modern Obsidian-aesthetic design in Flutter (`dorpon_app`) inspired by Stitch UI, paired with an initial proof-of-concept Python ingestion pipeline and FastAPI server. 

While the presentation layer is visually established, the backend logic, data architecture, and client-server integration are currently decoupled:

```mermaid
flowchart TD
    subgraph Current State
        A1["RSS Feeds: 2 sources"] --> B1["Naive Token Overlap Deduplicator"]
        B1 --> C1["Partial BCS Synthesis"]
        C1 --> D1["Flat file: capsule_latest.json"]
        D1 --> E1["FastAPI: 3 endpoints"]
        E1 -.->|No persistence / Localhost only| F1["Flutter App: Disconnected UI & Mock State"]
    end

    subgraph Target Production Architecture
        A2["Multi-Source Ingestion: DS, Prothom Alo, TBS, FE, BBS, BB"] --> B2["Cross-Lingual Event Clustering & BPSC Scorer"]
        B2 --> C2["Civilsdaily 7-Layer Synthesis Engine: Gemini 1.5 + Heuristic"]
        C2 --> G2["Audio Briefing TTS & Read-Along Timestamps"]
        C2 & G2 --> D2[("Structured Database: SQLite / PostgreSQL")]
        D2 --> E2["REST API: Capsules, Search, Audio, Revision Binder, Preferences"]
        E2 <==>|Reactive State / Caching| F2["Flutter: Ambient Audio Player, Real Revision Binder, Dynamic Feeds"]
    end
```

---

## 2. In-Depth Audit Findings

### 2.1. Ingestion Pipeline & NLP Engine (`pipeline/`)

| Component | Current Implementation | Critical Gaps |
| :--- | :--- | :--- |
| **Data Sources** (`config.py`, `rss_fetcher.py`) | 2 sources: The Daily Star & Prothom Alo RSS. | Missing crucial economic & governance publications in Bangladesh: *The Business Standard (TBS)*, *The Financial Express*, *BSS News (official state agency)*, and Bangladesh Bank press releases. |
| **Deduplication & Clustering** (`deduplicator.py`) | `re.findall(r"\w{4,}", art.title.lower())` with token intersection threshold $\ge 3$. | **Cross-lingual failure:** An English article from Daily Star and a Bengali article from Prothom Alo for the *exact same news event* have $0$ lexical overlap and will never cluster. |
| **BPSC Scoring** (`deduplicator.py`) | Keyword string matching on ~20 terms with cap at 10.0. | Needs weight normalization across syllabus categories (Paper V Bangladesh, Paper VI International, Paper IV Science). |
| **Knowledge Base** (`constitution_kb.py`) | 15 hardcoded articles with keyword search. | Covers only ~10% of the 153 constitutional articles. Needs full fundamental rights (Part III) and directive principles (Part II) coverage. |
| **AI Synthesis** (`synthesizer.py`) | Basic unstructured prompt to `gemini-1.5-flash`; fallback uses static templates. | Does not conform to the 7-section Civilsdaily standard outlined in `docs/BCS_PRO_CIVILSDAILY_SPEC.md`. Fallback stat points are generic placeholders. |

---

### 2.2. Civilsdaily Specification Gap Analysis

In `docs/BCS_PRO_CIVILSDAILY_SPEC.md`, the BPSC study engine requires 7 explicit structural sections:

| Civilsdaily Spec Section | Current `BcsProItem` Schema | Status | Action Required |
| :--- | :--- | :--- | :--- |
| **1. Syllabus Mapping** | `bcs_subject_area: str` | ⚠️ Partial | Add explicit `paper_code` (e.g. `Paper V`), `syllabus_topic`, and `microtheme`. |
| **2. Why in the News** | Borrowed from Daily Buzz | ⚠️ Partial | Add dedicated 2-sentence administrative/legal trigger (`why_in_the_news_en`, `why_in_the_news_bn`). |
| **3. Question-Led Breakdown** | Single string `analytical_breakdown` | ❌ Missing Structure | Structure into QA pairs with bold topic anchors: Policy trigger, administrative mechanism, legal conflict. |
| **4. Hard Data & Telemetry** | `List[StatPoint]` | ✅ Present | Enrich with verifiable BBS, Bangladesh Bank, and World Bank economic telemetry. |
| **5. Challenges & Bottlenecks** | None | ❌ Missing | Add 3 numbered structural/institutional bottlenecks. |
| **6. Way Forward** | None | ❌ Missing | Add 3 high-yield policy reform recommendations for 15-mark answers. |
| **7. Matching 30-Year PYQ** | `List[PyqReference]` | ⚠️ Seed only (6 PYQs) | Expand `pyqs.json` coverage across 35th–45th BCS Preliminary & Written exams. |

---

### 2.3. Backend Storage & REST API (`api/server.py`)

1. **Storage Bottleneck**: All data lives in `data/output/capsule_latest.json`.
   - No historical archive query (users cannot view past capsules).
   - No relational or document database for querying by date, topic, or search keyword.
2. **Missing Endpoint Capabilities**:
   - `GET /api/capsules/archive` — Historical capsule calendar and date index.
   - `GET /api/search?q=...&category=...` — Search across current affairs and PYQ archive.
   - `GET /api/audio/today` — Audio stream URL + timestamped read-along transcript.
   - `GET /api/user/saved` & `POST /api/user/saved` — Cloud sync for the Revision Binder.
   - `GET /api/pyqs` — Filterable 30-year BPSC question bank.
3. **CORS & Network Routing**:
   - Client is hardcoded to `http://localhost:8000`, failing on real Android/iOS devices or emulators.

---

### 2.4. Flutter Frontend & State Architecture (`dorpon_app/`)

1. **State Isolation**:
   - All state is managed locally via `StatefulWidget.setState`.
   - **Discover Channels**: Following/unfollowing topics in `DiscoverScreen` does not update the home feed query in `HomeScreen`.
   - **Revision Binder**: Bookmarking a story in `StudyCanvasScreen` only shows a transient snackbar; it does not persist or populate `SavedScreen`.
   - `SavedScreen` currently displays static, hardcoded placeholder cards.
   - `CurrentAffairsScreen` category filter chips (`All Papers`, `Paper V`, `Macroeconomy`) do not filter the displayed list.
2. **Missing 6:00 AM Audio Player**:
   - Stitch export includes a dedicated, atmospheric read-along audio player (`dorpon_6_00_am_daily_audio_player`), but the "Listen • 4 min" button on `HomeScreen` has no gesture recognizer or modal connection.
3. **Local Persistence**:
   - No offline caching or local database (`shared_preferences` / `hive` / `sqflite`) for reading news offline during commutes.

---

## 3. Comprehensive Implementation Roadmap

### Phase 1: Data Architecture & Complete Civilsdaily Spec (Backend)
- [ ] **Unified Database Layer**: Introduce a lightweight, zero-config relational store (`SQLite` via SQLAlchemy / SQLModel or Python stdlib `sqlite3`) with schema migrations.
  - Tables: `editions`, `stories`, `data_stats`, `constitutional_citations`, `challenges`, `way_forward`, `pyqs`, `user_saved_items`.
- [ ] **Model Upgrade (`pipeline/models.py`)**:
  - Update `BcsProItem` to fully match `BCS_PRO_CIVILSDAILY_SPEC.md` (Syllabus breadcrumb, Why in News, Question-led breakdowns, Challenges, Way Forward, Telemetry, PYQs).
  - Add `AudioEpisode` model with timestamped transcript cues for read-along sync.

### Phase 2: Ingestion & NLP Pipeline Upgrades
- [ ] **Multi-Source Collector**:
  - Add RSS and scrapers for *The Business Standard (TBS)*, *The Financial Express (FE)*, and *BSS News*.
  - Add robust error handling, user-agent rotation, and fallback body extraction.
- [ ] **Cross-Lingual Clustering (`pipeline/processing/deduplicator.py`)**:
  - Implement bilingual entity/topic mapping so Bengali & English reports on the same event cluster into a single coherent story.
- [ ] **Structured Civilsdaily Synthesis (`pipeline/processing/synthesizer.py`)**:
  - Leverage Gemini 1.5 with strict Pydantic JSON schema output.
  - Upgrade heuristic fallback generator to generate realistic 7-layer Civilsdaily blueprints when working offline or without an API key.
- [ ] **Expanded Constitution Knowledge Base (`pipeline/constitution_kb.py`)**:
  - Expand to cover all high-yield articles (Fundamental Rights 26–47, Directive Principles 8–25, Judiciary 94–116, Public Service 137–141, Emergency 141A–141C).

### Phase 3: Audio Briefing Generation & REST API Expansion
- [ ] **Audio Briefing Generator (`pipeline/audio/`)**:
  - Generate 3–4 minute summarized morning audio briefings with story marker timestamps (`00:00`, `01:15`, `02:30`, etc.).
  - Can use `edge-tts` (high-quality neural voices in English and Bengali) or pre-synthesized audio audio-packs.
- [ ] **REST API Endpoints (`api/server.py`)**:
  - `GET /api/feed/buzz` (personalized by interests)
  - `GET /api/feed/bcs-pro` (filtered by paper code / topic)
  - `GET /api/audio/today` (audio stream + synchronized cues)
  - `GET /api/capsules/archive` & `GET /api/capsules/{date}`
  - `GET /api/search` (multi-field search)
  - `GET /api/binder` & `POST /api/binder/toggle` (Revision Binder persistence)

### Phase 4: Flutter State Management & Reactive UI Integration
- [ ] **State & Persistence Architecture**:
  - Add a lightweight state management provider (`ChangeNotifier` / `Provider`) and local storage (`shared_preferences`).
  - Wire `DiscoverScreen` followed channels directly into the dynamic `Daily Buzz` feed.
  - Implement interactive category filtering on `CurrentAffairsScreen`.
- [ ] **Functional Revision Binder (`SavedScreen`)**:
  - Connect bookmarking in `StudyCanvasScreen` to persistent storage.
  - Populate `SavedScreen` dynamically from real saved stats, constitutional articles, written prompts, and PYQs.
- [ ] **Environment-Aware API Service**:
  - Support automatic base URL resolution (`10.0.2.2` for Android emulator, `localhost` for Windows/iOS/Web, custom IP for devices).

### Phase 5: Interactive 6:00 AM Daily Audio Player
- [ ] **Stitch Audio Player Integration**:
  - Implement the audio player bottom sheet modal with:
    - Ambient synaptic glow orb animation.
    - Play / Pause / Seek bar / 15s skip controls.
    - Synchronized read-along transcript highlighting the active story.
    - Speed toggle (1x, 1.25x, 1.5x, 2x).

---

## 4. Immediate Decision Points for User

1. **Database Preference**: Would you prefer **SQLite** (lightweight, zero external server dependency, stored in `data/dorpon.db`) or **PostgreSQL**? (SQLite is recommended for immediate local development and easy deployment).
2. **Audio Narration Engine**: Would you prefer **Edge-TTS** (free, high quality neural voices in Bangla and English) or Gemini multimodal audio generation?
3. **Implementation Sequence**: Shall we begin with **Phase 1 & Phase 2** (updating the backend schema, ingestion, and 7-layer Civilsdaily synthesis), or would you prefer a specific feature first (e.g. the Audio Player or the Revision Binder)?
