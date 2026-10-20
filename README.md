# Dorpon Daily (দর্পণ) — Autonomous News Ingestion & AI Synthesis Platform

**Daily Current Affairs That Save Time • সময় বাঁচানো প্রতিদিনের চলতি ঘটনাবলী**

Dorpon Daily is an intelligent, bilingual (English & বাংলা) news aggregation and deep-dive current affairs platform designed for professionals, researchers, and conscious readers in Bangladesh and the global diaspora. It transforms high-velocity media noise into calm, verified, high-signal intelligence through automated ingestion, Gemini AI synthesis, and a distraction-free mobile and web reader.

---

## 🌟 Key Features

### 1. Dual-Layer News Experience
* **Hourly Breaking Wires & Daily Buzz**: 60-second minimalist capsules summarizing breaking national and international developments. Every dispatch provides the core story, verified source attribution, and a quick *"Why It Matters"* takeaway.
* **In-Depth Current Affairs Dossiers**: Strategic analytical breakdowns exploring complex policy, macroeconomic, geopolitical, and environmental affairs with root-cause timelines, official statistical telemetry, and long-term outlooks.

### 2. Seamless Bilingual Support (বাংলা ও English)
* Full dynamic translation and language toggle across the entire application.
* Readers can toggle between **English** and **বাংলা** on the fly with a single tap in the settings or directly inside article canvas screens.
* Integrated Bengali typography powered by Google Fonts (`Hind Siliguri`) and editorial serif/sans-serif modes.

### 3. Hands-Free Audio Briefings
* Continuous, synchronized audio player sheet and persistent mini-dock player.
* Delivers hands-free morning broadcasts and summaries for commute or multi-tasking.

### 4. Autonomous Cloud Pipeline
* Automated GitHub Actions cron runner executing hourly at off-peak intervals.
* Cross-source deduplication, scraping, Gemini AI structured extraction, and instant Firebase Firestore live sync.

### 5. Reader Account & Preferences
* Secure authentication (Sign In, Create Account, or Continue as Guest).
* Persistent bookmarking, reading history, customizable font choices, notification toggles, and offline cache management.

---

## 🏗️ Architecture Overview

```
Dorpon Daily/
├── .github/workflows/
│   └── pipeline_cron.yml      # Autonomous hourly GitHub Actions workflow
├── pipeline/
│   ├── config.py              # RSS feeds, taxonomy, and category schemas
│   ├── models.py              # Pydantic schemas (DailyBuzz, CurrentAffairs, DailyCapsule)
│   ├── constitution_kb.py     # Bangladesh constitutional articles reference database
│   ├── collectors/
│   │   ├── rss_fetcher.py     # Scrapes RSS feeds (The Daily Star, Prothom Alo, etc.)
│   │   └── article_scraper.py # Clean article body text extraction
│   ├── processing/
│   │   ├── deduplicator.py    # Cross-source event clustering & importance scoring
│   │   ├── selector.py        # Editorial interest and topical categorization
│   │   └── synthesizer.py     # Gemini AI bilingual synthesis (English & Bangla)
│   ├── hourly_worker.py       # Hourly breaking news ingestion & Firestore sync script
│   └── run_pipeline.py        # Master morning capsule synthesis script
├── dorpon_app/                # Flutter Client Application (Web, Android, iOS)
│   ├── lib/
│   │   ├── models/            # Capsule and story models
│   │   ├── screens/           # Home, Discover, Current Affairs, Saved, Settings/Profile
│   │   ├── services/          # SettingsService, AuthService, ApiService, AudioBriefingService
│   │   ├── theme/             # Obsidian dark glass tokens and design system
│   │   └── widgets/           # Floating dock, mini player, ambient background, auth modal
│   └── pubspec.yaml           # Flutter dependencies & assets
└── data/
    └── output/                # Local cache of generated JSON capsules
```

---

## ⚡ Quickstart Guide

### 1. Ingestion & AI Pipeline (Python)

#### Prerequisites
* Python 3.12+
* Google Gemini API Key (`GEMINI_API_KEY`)
* Firebase Service Account JSON (`FIREBASE_SERVICE_ACCOUNT_JSON`)

```bash
# Setup virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Run manual hourly pipeline
python -m pipeline.hourly_worker --limit 6

# Run full morning edition capsule
python -m pipeline.run_pipeline
```

---

### 2. Client Application (Flutter)

#### Run as Local Web App
```bash
cd dorpon_app
flutter pub get
flutter run -d web-server --web-port=5050 --web-hostname=0.0.0.0
```
* Access from local computer: `http://localhost:5050`
* Access from phone on the same Wi-Fi: `http://<your-local-ip>:5050`
* *(Tip)* In Chrome on Android/iOS, tap **"Add to Home Screen"** to install it directly as an app icon with instant launch!

---

## 🔒 Security & Firestore Rules

Client applications have secure, public read-only access to published dispatches (`daily_buzz`, `hourly_buzz`, `bcs_pro_published`). All modifications, updates, and ingestions are exclusively performed via authenticated server runners using the Firebase Admin SDK.

---

## 📄 License
Mindful Daily Sanctuary © 2026 Dorpon. All rights reserved.
