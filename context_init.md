# Czero Active Development Context (context_init.md)

This file contains the current dev status, architectural changes, and active session context for Czero. Keep this file updated at the end of each implementation phase.

---

## 1. Project Context & Stack
- **Core Goal**: Social listening and automated intent-scoring to get a SaaS product's first 10 users.
- **Frontend**: Next.js App Router (styled with Tailwind CSS).
- **Backend**: FastAPI (Python 3.12, asyncio event loop).
- **Database**: Supabase (PostgreSQL) with tables `products` and `leads`.
- **LLM Engine**: NVIDIA NIM API (`meta/llama-3.1-8b-instruct`) for product analysis and lead scoring.

---

## 2. Implemented Features & Architecture

### A. Webpage Scraper & LLM Analyzer
- **Scraper (`scraper.py`)**: Uses an asynchronous HTTP client to scrape raw landing page text. Bypasses CAPTCHA / Cloudflare blockages automatically by falling back to Exa's `get_contents` endpoint.
- **Product Analyzer (`analyzer.py`)**: Prompts Llama 3.1 8B to generate a structured product report (Name, Description, Keywords, Competitors, Subreddits, ICP).

### B. Database Integration Service (`db.py`)
- Initialized Supabase admin client using the `SUPABASE_SERVICE_ROLE_KEY`.
- Exposes functions for upserting products, bulk inserting leads, and fetching cached URLs.

### C. Background Monitoring Scheduler (`scheduler.py`)
- Natively runs as an asynchronous background loop inside FastAPI.
- Loops through all active products every 15 minutes, collects matching signals (HN/Reddit), scores them, enriches leads, drafts copy, and persists them in Supabase.

### D. Caching & Deduplication Layer
- Before executing the LLM Scorer, the background scheduler queries the `leads` table for existing URLs.
- Matches are skipped, eliminating duplicate LLM billing and preserving scoring state.

### E. Frontend Settings & Dashboard Real-Time Feeds
- **Settings**: Step-by-step landing page scanner. Converts approved profiles into database product context configurations.
- **Dashboard**: Fetches leads dynamically from the Supabase database with a 15-second polling loop for real-time visual updates.

### G. False Positive Elimination & Intent Scoring Fixes
- **HTML Sanitization**: Added `clean_text` in [llm_scorer.py](file:///c:/Users/satya/Czero/api/app/engines/scorer/llm_scorer.py) to unescape HTML entities (`&gt;`, `&#x2F;`, `&amp;`) and strip HTML tags (`<p>`, `<code>`, `<pre>`).
- **Agency & Seller Pre-Filter**: Added regex rules to auto-drop agency/freelancer posts (`"SEEKING WORK"`), job ads (`"Hiring"`), and product showcases (`"Lite Agent is..."`) to **Score 0 (COLD)** before LLM evaluation.
- **Mini-Batch Chunking**: Reduced LLM batch size to max 10 posts per prompt to eliminate cross-post context hallucinations.

### H. Product Leads Feed UI & Live Radar Status Bar
- **Live Background Monitoring Bar**: Pulsing emerald radar orb (`animate-ping`) and dynamic **15-minute countdown timer** (`14:59` $\rightarrow$ `00:00`) showing exact time until the next automated background sweep.
- **Category Tab Filters**: Instant tab filtering for `All Leads`, `🔥 Hot (80+)`, and `⚡ Warm (40-79)`.
- **Upgraded Lead Cards**: Direct `"Open Thread ↗"` button to jump straight to source URLs, highlighted AI reasoning boxes, and score relevance pills.

---

## 3. Next Session Roadmap
- **Email Outreach Integration**: Connect Gmail OAuth or Resend to send AI outreach drafts directly from the Czero dashboard.
- **LinkedIn / X Link Posting**: Implement deep linking to the lead source to enable founders to jump directly to threads for manual commenting.
- **Daily Digest Emails**: Build a background email cron to send a summary of new `hot` leads daily to the product owner's inbox.
- **Privy Design System [COMPLETED]**: Replaced generic styling with the Privy ink-on-marble editorial design. Configured custom Inter/Source Serif 4 typography, flat high-contrast cards, Obsidian Ink inputs/buttons, and the Iris Pulse announcement bar across all dashboard layouts.

---

## 4. Competitive & Quality Checklist (Handwritten Notes Alignment)
To maintain elite lead precision and out-compete platforms like Pounce or Redship, Czero enforces the following checks:

1. **Proper Product Context**: Product profiles are fully generated from landing pages and reviewed by the founder to establish exact keywords/subreddits.
2. **System Prompt of Product Analyzer**: Standardized templates in [analyzer.py](file:///c:/Users/satya/Czero/api/app/services/analyzer.py) force Llama 3.1 8B to output B2B intent parameters and exclude the product itself from competitor lists.
3. **Platform to Monitor / Working**: Actively pulls Reddit (RSS), HN (Algolia API), and web-wide (Exa semantic search), with async client pooling and timeouts to prevent page hangs.
4. **Scoring Strategy**: A hybrid layout: Heuristic filters strip spam/listicles/agencies, followed by semantic scoring in [llm_scorer.py](file:///c:/Users/satya/Czero/api/app/engines/scorer/llm_scorer.py) using specific rules (HOT: 70-100, WARM: 40-69, COLD: 0-39).
5. **Quality of Leads / Relevancy**: LLM scoring and heuristic pre-filters strictly fail promotional posts ("I built X" or "We just launched Y") and agency seller ads ("SEEKING WORK") that match keywords but have 0 buying intent.
6. **More Monitoring / Frequent Monitoring**: Scheduler task loops active database products every 15 minutes to guarantee real-time matches, complete with a live 15-minute countdown indicator on the dashboard UI.
7. **Freshness of Lead**: Custom sliding timeframe windows (24h general / 7d niche) ensure we capture delayed search index results while discarding stale leads, backed by database deduplication to keep costs at zero.

