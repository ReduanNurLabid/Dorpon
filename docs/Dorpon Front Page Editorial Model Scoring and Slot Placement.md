# Sondesh Express Front Page Editorial Model: Scoring and Slot Placement

Prepared for the Sondesh Express project · October 22, 2026

## Summary

Editorial management splits into three layers: score every story on news value, fill front-page slots under explicit rules, and give the editor override controls. The slotting decision should move out of the React component and into the pipeline, which publishes one manifest that every client renders.

## What the current front page shows

- **The hero does not follow the score (Resolved).** In `api.ts`, replaced raw timestamp sorting with `sortByEditorialRank` (which respects `rank_score`, `importance_score`, and source corroboration over trivial 2-minute timestamp variations).
- **Duplicates across columns (Resolved).** Implemented global slot deduplication in `BroadsheetFrontPage.tsx`. The Wire Desk (`wireDeskStories`) now strictly filters out Hero and Left Column stories, and the Lower Grid excludes all previous stories to guarantee 0 cross-column duplicates.
- **Unsupported claims in the hero summary.** The "মূল বিবরণ" says such crimes are rising at an alarming rate. That is not in the source. The validator should flag trend claims that are not grounded.
- **Placeholder vanity metrics (Resolved).** Removed artificial circulation numbers ("Circulation: 184,200") and replaced with authentic technical/edition tags: `FORMAT: 3-TIER INTELLIGENCE`, `EDITION: DIGITAL BROADSHEET`, `SYNTHESIS: VERIFIED MULTI-SOURCE`.
- **Name resolved.** Standardized uniformly across all web and mobile platforms to **Sondesh Express** (Bengali: **সন্দেশ এক্সপ্রেস**).

## Weak points in the scoring guide

- **Keywords only cover institutions.** The table misses disasters, casualties, prices, service disruptions and public-service news. It also lists Chief Adviser and Advisory Council, while current cards say প্রধানমন্ত্রী. Move the table to a config file and keep it current.
- **No newsworthiness floor.** Rule A passes everything from Bangladeshi outlets, including petty crime. Relevance and importance are separate checks.
- **Corroboration counts cluster size.** BSS and UNB copies repeated across outlets should count as one source.
- **Decay is too steep for a front page.** At γ=1.3 a story loses about 60% of its score in two hours, so the hero would change almost every run.
- **The memory window is off.** "Last 100 stories" is about 30 hours at 60-80 stories a day, not 48. Use a time window.

## Proposed editorial model

### 1. Importance score (0-100), based on news values

| Feature | Weight | Notes |
| --- | --- | --- |
| Impact | 0.30 | casualties, money scale, policy changes, disruption |
| Coverage | 0.20 | independent sources, capped at 4; wire copies count once |
| Prominence | 0.15 | the existing institutions table, now one feature among several |
| Public value | 0.15 | prices, jobs, transport, services, decisions people act on |
| Authority | 0.10 | best source weight in the cluster |
| Proximity | 0.10 | domestic highest, international with a Bangladesh angle lower |

Penalties: about −20 for personal or tabloid crime unless it involves casualties or public figures, and −10 for a single unverified source. All numbers are starting points to tune.

### 2. Slot-specific ranking

Use a separate half-life per slot instead of one global decay: `score = importance × 0.5^(age / half_life)`.

| Slot | Eligibility | Half-life | Rules |
| --- | --- | --- | --- |
| Hero | under 12h, importance ≥ 55, 2+ independent sources or a primary source, not held, not sports or entertainment | 10h | none |
| Secondary (2) | under 24h, importance ≥ 45 | 8h | different category from the hero and from each other, and not too similar to the hero |
| তাজা খবর (4) | under 3h, importance ≥ 35 | 2h | newest first, nothing already placed above |
| Lower grid (6) | under 24h | 14h | category quotas, e.g. at least one each of economy and international |
| Breaking ticker | breaking tier only, 2+ sources, under 6h | n/a | maximum 5 |
| Section pages | per primary category | 24h | top 20 |

A story appears once per front page. It can also appear on its section page.

### 3. Stability

Use hysteresis so the front page does not flicker.

- A challenger replaces the hero only if its score is at least 1.25× the incumbent's, or the incumbent is older than 12 hours.
- Keep a minimum dwell time of about 2 hours.
- A new breaking story scoring above about 80 may take the hero immediately.
- Store current assignments in a `state/frontpage` document.

### 4. Server-side manifest

The pipeline writes `frontpage.json` with `{hero, secondary[], wire[], lower[], sections{}}`, containing story IDs only. The React site and the Flutter app both render it. The logic lives in one testable place, and duplicates cannot occur.

### 5. Explainability

Store a `score_breakdown` on every placed story, so the editor can see why a story became the hero.

### 6. Editor overrides

Add a Front Page tab to the Editor Studio showing current slots and scores, with pin, boost, demote, suppress and retract buttons.

- Store overrides as `editorial_overrides` documents with an expiry time. The pipeline applies them at rank time.
- Retraction removes the story from the feed and attaches a correction note.

### 7. Optional importance rating

- Add one batched Lite call per run that rates each new cluster 1-5 for public importance and flags tabloid content. Treat it as a feature (about 0.2 of the score), not the final decision.
- Log the AI score next to the editor's picks. Once a few hundred stories are labeled, train a small logistic-regression model on the embeddings plus the other features, locally and for free.
- Be careful with click data. Sensational stories get the most taps, so cap its influence or use it only to order stories within the same tier.

## Daily editor routine (10-15 minutes)

- **Morning:** review the held queue, check the hero and top 5, and pin or suppress anything wrong.
- **Evening:** publish or update one explainer.
- **Weekly:** review stories that should have been placed differently and add them as labels.
