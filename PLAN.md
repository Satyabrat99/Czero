# Czero — Complete Project Plan

> **"Paste your SaaS URL. Get people who need it — this week."**

Czero monitors Reddit, Twitter/X, LinkedIn, and Hacker News for people actively looking for solutions like yours. It scores buying intent, finds their contact info, and drafts personalized outreach — so you show up before your competitors do.

---

## Table of Contents

1. [Product Vision & Why This Works](#1-product-vision--why-this-works)
2. [Complete Architecture](#2-complete-architecture)
3. [Tech Stack (Detailed)](#3-tech-stack-detailed)
4. [Things to Keep in Mind](#4-things-to-keep-in-mind)
5. [Phase 0: Foundation (Week 1)](#5-phase-0-foundation)
6. [Phase 1: Signal Collection Engine (Week 2)](#6-phase-1-signal-collection-engine)
7. [Phase 2: Intent Scoring Engine (Week 3)](#7-phase-2-intent-scoring-engine)
8. [Phase 3: Contact Enrichment (Week 4)](#8-phase-3-contact-enrichment)
9. [Phase 4: Delivery — Email + Dashboard (Week 5)](#9-phase-4-delivery)
10. [Phase 5: Auth, Payments, Landing Page (Week 6)](#10-phase-5-auth-payments-landing)
11. [Phase 6: Polish, Beta Launch (Week 7-8)](#11-phase-6-polish-beta-launch)
12. [Phase 7: Public Launch + Growth (Week 9+)](#12-phase-7-public-launch)
13. [Cost Structure & Unit Economics](#13-cost-structure)
14. [Competitive Positioning](#14-competitive-positioning)

---

## 1. Product Vision & Why This Works

### The Problem (Validated by 15+ Competitors)

86% of indie SaaS founders make $0. Building is easy. Selling is harder. Founders don't know WHO to reach out to, WHERE those people are, or WHEN they're actively looking.

### The Solution

Czero is a dead-simple product:

```
Input:  Paste your SaaS URL
Output: People actively looking for your product this week
        + Their contact info
        + Ready-to-send personalized messages
```

### Why This Works (Market Validation)

- **15+ competitors** exist in this space (Buska, ReplyGain, HuntIQ, Leado, LeadRadar, Reddscan, Prospy, IntentHunter, Subreach, Leedlime, SnitchFeed, LeadProton, Tractionly, Pluggo, Coven)
- **Buska** (market leader) has 2,000+ paying teams at $49-249/mo
- **Reddit lead gen** is a proven channel — multiple competitors report 3-8x reply rates vs cold outreach
- **No competitor** combines: paste URL setup + multi-platform monitoring + contact enrichment + dead-simple UX at an affordable price

### Our Edge (What Nobody Else Does)

1. **Paste URL → auto-setup** — Only ReplyGain and Leedlime do this. We do it better.
2. **Multi-source intent confirmation** — Same person posting across Reddit + Twitter = 3x confidence boost. Nobody does this.
3. **Contact enrichment built-in** — Most tools show the post but not the email. We include email + LinkedIn in every lead.
4. **"Explain Why" panel** — Every lead shows detailed reasoning, not just a score.
5. **Dead simple** — 3 screens. No CRM. No pipeline. No kanban. Just leads.
6. **$29/mo sweet spot** — Between $15 Reddit-only tools and $49+ complex platforms.

---

## 2. Complete Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CZERO ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   FRONTEND   │    │   BACKEND    │    │   WORKERS    │      │
│  │  Next.js 15  │◄──►│  FastAPI     │◄──►│  Celery +    │      │
│  │  Tailwind    │    │  Python      │    │  Redis       │      │
│  │  Supabase    │    │              │    │              │      │
│  │  Auth        │    │              │    │              │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  SUPABASE    │    │  EXTERNAL    │    │  SIGNAL      │      │
│  │  Postgres    │    │  APIs        │    │  SOURCES     │      │
│  │  Realtime    │    │              │    │              │      │
│  │  Storage     │    │  Exa.ai      │    │  Reddit PRAW │      │
│  └──────────────┘    │  TinyFish    │    │  Twitter     │      │
│                      │  LLM APIs    │    │  (Scweet)    │      │
│                      │  Resend      │    │  LinkedIn    │      │
│                      └──────────────┘    │  HN Algolia  │      │
│                                          └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
USER PASTES URL
      │
      ▼
┌─────────────────┐
│ 1. URL ANALYSIS │ ──► TinyFish Fetch (free) → LLM extracts ICP, keywords, pain points
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ 2. PARALLEL SIGNAL COLLECTION (all sources independent)│
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Reddit   │ │ Twitter  │ │ Exa      │ │ HN +   │ │
│  │ PRAW     │ │ Scweet   │ │ Semantic │ │ Linked │ │
│  │ (free)   │ │ (free)   │ │ ($0.007) │ │ (free) │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │             │            │            │       │
│       └─────────────┴─────┬──────┴────────────┘       │
│                           │                            │
│                    ┌──────▼──────┐                     │
│                    │ MERGE +     │                     │
│                    │ DEDUP       │                     │
│                    └──────┬──────┘                     │
│  Each source runs         │                            │
│  INDEPENDENTLY.           │  ~60 unique signals       │
│  They don't filter        │                            │
│  each other.              │                            │
└───────────────────────────┼────────────────────────────┘
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 3. PRE-FILTER   │ ──► Keyword match (free) → Remove 90% noise
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 4. LLM SCORING  │ ──► GPT-4o-mini scores intent 0-100 ($0.002/post)
│                  │     ICP match 0-100
│                  │     Returns: score, reason, category
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 5. MULTI-SOURCE │ ──► Same author on multiple platforms? Bonus points.
│  CONFIRMATION   │     Spike detection (baseline vs current).
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 6. ENRICHMENT   │ ──► Score ≥ 60 → Exa Agent API finds email + LinkedIn
│  (Only hot/warm)│     Score < 60 → Skip (save money)
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 7. OUTREACH     │ ──► LLM drafts personalized email + LinkedIn DM + Reddit reply
│  GENERATION     │     References specific post, sounds human.
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 8. STORE +      │ ──► Save to Supabase
│  DELIVER        │     Weekly email digest (Resend)
│                  │     Dashboard (3 screens)
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ 9. FEEDBACK     │ ──► 👍/👎 on every lead
│  LOOP           │     Trains scoring engine
│                  │     Results improve over time
└─────────────────┘
```

### Database Schema (Supabase/Postgres)

```sql
-- Users (managed by Supabase Auth)
-- id, email, created_at

-- Products (what the user is monitoring)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    url TEXT NOT NULL,
    name TEXT,
    description TEXT,           -- AI-extracted: "AI invoicing for freelancers"
    icp JSONB,                  -- {"roles": ["freelancer"], "company_size": "1-10", "industry": "services"}
    pain_points TEXT[],         -- ["manual invoicing", "chasing payments", "tax prep"]
    keywords TEXT[],            -- ["invoice", "billing", "freelancer", "accounting"]
    competitor_names TEXT[],    -- ["FreshBooks", "QuickBooks", "Wave"]
    subreddit_list TEXT[],      -- ["r/freelance", "r/SaaS", "r/smallbusiness"]
    scan_frequency INTERVAL DEFAULT '24 hours',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Signals (raw posts/comments found)
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    source TEXT NOT NULL,        -- 'reddit', 'twitter', 'linkedin', 'hn', 'exa'
    source_url TEXT NOT NULL,    -- direct link to the post
    author_username TEXT,
    author_profile_url TEXT,
    text TEXT NOT NULL,          -- full post/comment text
    subreddit TEXT,              -- for Reddit
    score_raw INT,              -- upvotes/likes on the original post
    posted_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT now(),
    dedup_key TEXT UNIQUE       -- hash of source + author + text snippet
);

-- Leads (scored and enriched signals)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    signal_id UUID REFERENCES signals(id),
    intent_score INT NOT NULL,          -- 0-100
    icp_match_score INT,                -- 0-100
    recency_score INT,                  -- 0-100
    multi_source_bonus INT DEFAULT 0,   -- bonus for cross-platform signals
    final_score INT NOT NULL,           -- weighted combination
    category TEXT NOT NULL,              -- 'hot', 'warm', 'cold'
    reasoning TEXT,                      -- "Why this lead?" explanation
    -- Contact info (enriched)
    email TEXT,
    linkedin_url TEXT,
    real_name TEXT,
    company_name TEXT,
    -- Outreach drafts
    email_draft TEXT,
    linkedin_dm_draft TEXT,
    reddit_reply_draft TEXT,
    -- Feedback
    user_feedback TEXT,                  -- 'useful', 'not_useful', NULL
    feedback_at TIMESTAMPTZ,
    -- Status
    status TEXT DEFAULT 'new',          -- 'new', 'viewed', 'contacted', 'converted'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly digests (tracking what was sent)
CREATE TABLE digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    week_start DATE,
    lead_count INT,
    hot_count INT,
    warm_count INT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Scoring feedback (for learning)
CREATE TABLE scoring_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    predicted_score INT,
    actual_relevance TEXT,      -- 'useful', 'not_useful'
    feedback_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Tech Stack (Detailed)

### Frontend

| Technology | Version | Why |
|-----------|---------|-----|
| **Next.js** | 15 | React framework with App Router, SSR, API routes. You already know this stack. |
| **Tailwind CSS** | 4 | Utility-first CSS. Fast to build, easy to customize. |
| **shadcn/ui** | Latest | Pre-built components (buttons, cards, inputs). Dark mode ready. No dependency lock-in. |
| **Supabase Auth** | Latest | Email/password + Google OAuth. Free tier. Built into Supabase. |
| **Zustand** | Latest | Lightweight state management. Simpler than Redux for this scope. |
| **Resend React Email** | Latest | For rendering email templates. |

**Why Next.js + Tailwind + shadcn/ui:**
- You already know this stack (DesignFlow project)
- Fastest path to production UI
- shadcn/ui gives production-quality components without design debt
- Dark mode works out of the box
- Mobile responsive by default

### Backend

| Technology | Version | Why |
|-----------|---------|-----|
| **Python** | 3.11+ | Best language for async scraping + LLM integration |
| **FastAPI** | Latest | Async Python web framework. Fast, modern, auto-docs. |
| **Celery** | 5.x | Background task queue for signal collection + scoring |
| **Redis** | 7.x | Celery broker + caching layer |
| **Pydantic** | 2.x | Data validation (built into FastAPI) |

**Why Python + FastAPI:**
- PRAW (Reddit), Scweet (Twitter), BeautifulSoup — all Python libraries
- FastAPI handles async scraping tasks natively
- Celery manages background workers (signal collection runs 24/7)
- Easy to integrate with LLM APIs (OpenAI, Anthropic, etc.)

### Database & Auth

| Technology | Why |
|-----------|-----|
| **Supabase (Postgres)** | Free tier: 500MB, 50k MAU auth, realtime, REST API. Perfect for MVP. |
| **Supabase Auth** | Built-in email/password + OAuth. No separate auth service needed. |
| **Supabase Storage** | If we need to store any files (screenshots, exports). |

**Why Supabase:**
- Free tier covers MVP entirely (500MB DB, 50k MAU)
- Auth is built-in (no Clerk/NextAuth complexity)
- Postgres = industry standard, no vendor lock-in
- REST API auto-generated (no need to write CRUD endpoints)
- Realtime subscriptions (for live lead updates if needed later)

### Signal Collection Libraries

| Source | Library | Cost | Setup |
|--------|---------|------|-------|
| **Reddit** | PRAW (Python Reddit API Wrapper) | Free | Need Reddit app credentials (free) |
| **Twitter/X** | Scweet | Free | Need auth_token from browser (free) |
| **LinkedIn** | linkedin-post-search-scraper-no-cookies | Free | No login needed |
| **Hacker News** | Algolia HN Search API | Free | No auth needed |
| **Exa Semantic Search** | exa-py | $7/1k requests | $20 free credits on signup |

**Why these specific libraries:**
- PRAW is the official Reddit wrapper — stable, well-documented, 100 req/min free
- Scweet uses X's internal GraphQL API — verified working in 2026, no API key needed
- LinkedIn no-cookies scraper — no account risk, no legal issues
- Algolia HN — free, fast, reliable, covers all HN history
- Exa — semantic search across the entire web in one API call. Finds intent signals that keyword matching misses.

### LLM APIs

| Provider | Model | Cost | Use Case |
|----------|-------|------|----------|
| **OpenAI** | GPT-4o-mini | $0.15/1M input, $0.60/1M output | Intent scoring, ICP matching, outreach drafts |
| **Anthropic** | Claude Haiku | $0.25/1M input, $1.25/1M output | Alternative/fallback for scoring |

**Why GPT-4o-mini as primary:**
- Cheapest capable model ($0.15/1M input tokens)
- Fast (good for scoring hundreds of posts)
- Structured output support (JSON mode)
- We use it for 3 things: scoring, ICP matching, outreach drafts

**Cost per lead:** ~$0.002-0.01 (scoring + enrichment + draft generation)

### Contact Enrichment

| Provider | Cost | What It Does |
|----------|------|-------------|
| **Exa Agent API** | $0.012-1.00/run | Find email + LinkedIn profile from username/name |
| **KeeLead** (open source) | Free | 35 free data sources, email verification |

**Why Exa Agent API:**
- Pay-per-use (no subscription)
- Can find email, LinkedIn, company info from a username
- Already using Exa for search — same API key
- Fallback to KeeLead (open source) if Exa fails

### Email Delivery

| Provider | Cost | Why |
|----------|------|-----|
| **Resend** | Free (3k emails/mo) | Simple API, React Email templates, generous free tier |

**Why Resend:**
- Free tier covers MVP (3,000 emails/month = ~300 users × 10 emails)
- React Email for beautiful templates
- No Deliverability headaches (they handle it)

### Hosting & Deployment

| Service | Cost | What It Hosts |
|---------|------|---------------|
| **Vercel** | Free (hobby) | Next.js frontend |
| **Railway** | $5/mo | FastAPI backend + Celery workers + Redis |
| **Supabase Cloud** | Free | Database + Auth |

**Why Vercel + Railway:**
- Vercel: best Next.js hosting, free hobby tier, instant deploys
- Railway: cheap Python hosting, built-in Redis, background workers
- Supabase Cloud: free database + auth, no infra to manage

### Development Tools

| Tool | Purpose |
|------|---------|
| **uv** | Python package manager (faster than pip) |
| **pytest** | Python testing |
| **ESLint + Prettier** | JavaScript/TypeScript linting |
| **GitHub Actions** | CI/CD |
| **Docker** | Containerization for Railway deployment |

---

## 4. Things to Keep in Mind

### Technical Pitfalls

1. **Reddit API Rate Limits**
   - PRAW: 100 requests/minute (with OAuth app)
   - Without OAuth: RSS fallback, but rate-limited per IP
   - **Mitigation:** Always use OAuth app. Cache results. Don't hammer same subreddit.

2. **Twitter/X Account Bans**
   - Scweet uses browser cookies (auth_token)
   - Heavy usage can trigger account suspension
   - **Mitigation:** Use 2-3 accounts in rotation. Slow scan intervals (not real-time). Never scrape too fast.

3. **LinkedIn Anti-Scraping**
   - The no-cookies scraper works but LinkedIn actively blocks scrapers
   - **Mitigation:** Rate limit requests. Use multiple IP addresses. Accept that LinkedIn will be flaky.

4. **LLM Costs Can Spiral**
   - Scoring 1000 posts/day × $0.002 = $2/day per user
   - 100 users = $200/day in LLM costs
   - **Mitigation:** Aggressive pre-filtering (remove 90% of posts before LLM scoring). Batch scoring. Use GPT-4o-mini (cheapest).

5. **Deduplication is Critical**
   - Same post appears on Reddit + Twitter (cross-posted)
   - Same person posts in multiple subreddits
   - **Mitigation:** Hash-based dedup (source + author + text snippet). Dedup before scoring.

6. **Email Deliverability**
   - Weekly digest emails can land in spam
   - **Mitigation:** Use Resend (good deliverability). Authenticate domain (SPF/DKIM). Start with small volume.

### Business Pitfalls

7. **Don't Build Too Much Before Launch**
   - 15+ competitors exist. Speed matters more than features.
   - **Mitigation:** MVP in 6 weeks. Launch with Reddit + HN only. Add Twitter/LinkedIn in V2.

8. **Free Tier Can Burn You**
   - Free users consume API calls (Exa, LLM) without paying
   - **Mitigation:** Free tier = 3 leads/week, NO contact info, NO outreach drafts. Just posts + scores. Teaser, not the product.

9. **Contact Enrichment Accuracy**
   - Emails found by Exa/KeeLead may be outdated or wrong
   - **Mitigation:** Show confidence level. Let users verify. Never promise 100% accuracy.

10. **Reddit Community Backlash**
    - Reddit communities hate spam. If users spam our suggested replies, we get blamed.
    - **Mitigation:** Position as "helpful, not spammy." Drafts reference the specific post. Never suggest copy-paste spam.

11. **Competitor Response**
    - Buska, ReplyGain, and others could copy our features quickly
    - **Mitigation:** Move fast. Build the feedback loop (user ratings train scoring). The data flywheel is the moat — more users = better scoring = better results.

12. **Pricing Psychology**
    - $29/mo is the sweet spot. Below = perceived as low quality. Above = too much for indie hackers.
    - **Mitigation:** Start at $29/mo. Offer annual discount ($24/mo). Never discount below $19/mo.

### Legal/Ethical

13. **CAN-SPAM / GDPR**
    - We're finding contact info and suggesting outreach
    - **Mitigation:** We don't send emails — users do. We provide drafts. Include "this is a suggestion, verify before sending" disclaimer.

14. **Reddit Terms of Service**
    - Reddit allows API access (PRAW is official). But auto-posting is against ToS.
    - **Mitigation:** We NEVER auto-post. We generate drafts. Users copy-paste manually. This is explicitly allowed.

15. **Twitter/X Terms of Service**
    - Scweet uses internal API. Not officially sanctioned.
    - **Mitigation:** Use for monitoring only, not posting. Keep usage moderate. Have fallback (Exa search covers Twitter too).

---

## 5. Phase 0: Foundation

**Goal:** Project setup, database, basic API skeleton.

**Why first:** Everything depends on having a working project structure, database, and API. Without this, nothing else can be built.

### Tasks

1. **Initialize Next.js project**
   - `npx create-next-app@latest czero --typescript --tailwind --app`
   - Install shadcn/ui: `npx shadcn@latest init`
   - Set up project structure:
     ```
     czero/
     ├── app/
     │   ├── page.tsx (landing)
     │   ├── dashboard/
     │   │   ├── page.tsx (leads list)
     │   │   ├── [leadId]/page.tsx (lead detail)
     │   │   └── settings/page.tsx
     │   ├── auth/
     │   │   ├── login/page.tsx
     │   │   └── signup/page.tsx
     │   └── api/ (proxy routes to backend)
     ├── components/
     ├── lib/
     └── styles/
     ```

2. **Set up Supabase**
   - Create Supabase project (free tier)
   - Run SQL migrations (database schema from architecture section)
   - Configure auth (email/password + Google OAuth)
   - Get API keys (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

3. **Initialize Python backend**
   - `uv init czero-api`
   - Install dependencies: `fastapi`, `uvicorn`, `celery[redis]`, `redis`, `praw`, `exa-py`, `openai`, `pydantic`
   - Create project structure:
     ```
     czero-api/
     ├── app/
     │   ├── main.py (FastAPI app)
     │   ├── config.py (settings)
     │   ├── models/ (Pydantic models)
     │   ├── routes/ (API endpoints)
     │   ├── services/ (business logic)
     │   │   ├── analyzer.py (URL analysis)
     │   │   ├── collector.py (signal collection)
     │   │   ├── scorer.py (intent scoring)
     │   │   ├── enricher.py (contact enrichment)
     │   │   ├── drafter.py (outreach generation)
     │   │   └── emailer.py (digest emails)
     │   └── workers/ (Celery tasks)
     │       ├── collect_signals.py
     │       ├── score_leads.py
     │       └── generate_digests.py
     ├── tests/
     ├── requirements.txt
     └── Dockerfile
     ```

4. **Set up Redis + Celery**
   - Add Redis to Railway (or use Upstash free tier)
   - Configure Celery broker
   - Create basic worker that prints "hello"

5. **Set up GitHub repo**
   - Private repo on GitHub
   - GitHub Actions for CI (lint, test, build)
   - Branch protection on main

6. **Deploy skeleton**
   - Frontend → Vercel (auto-deploy from main)
   - Backend → Railway (Dockerfile)
   - Verify both are running

**Deliverable:** Running frontend + backend + database. Empty but functional.

---

## Phase 1: Signal Collection Engine

**Goal:** Given a product URL and keywords, collect signals from Reddit + HN + Exa (and later Twitter + LinkedIn).

**Why second:** Signal collection is the foundation of the product. Without signals, there are no leads. This phase proves the core technical hypothesis: "Can we reliably find buying intent signals?"

### CRITICAL ARCHITECTURE: Parallel Independent Collection

```
WRONG: Keyword Search → Filter → Exa on filtered results
RIGHT: Keyword Search ─────┐
       Exa Semantic ────────┼──→ Merge + Dedup → Scorer
       HN / LinkedIn ───────┘
       
Each source runs INDEPENDENTLY. They don't filter each other.
Results MERGE at the end. Each contributes unique coverage.
```

### Tasks

1. **URL Analysis Service** (`analyzer.py`)
   - Input: URL
   - Fetch page content (TinyFish Fetch — free)
   - Send to GPT-4o-mini: "Extract ICP, keywords, pain points, competitor names from this product website"
   - Output: JSON with all fields
   - Store in `products` table

2. **Reddit Signal Collector** (`collector.py`)
   - Input: product keywords + subreddit list
   - Use PRAW to search each subreddit for matching posts
   - For each match: extract post text, author, URL, score, timestamp
   - Dedup by hash (source + author + text snippet)
   - Store in `signals` table

3. **Hacker News Signal Collector**
   - Input: product keywords
   - Use Algolia HN Search API
   - Search Ask HN + Show HN + all stories
   - Extract matching posts
   - Store in `signals` table

4. **Celery Worker for Background Collection**
   - Task: `collect_signals(product_id)`
   - Runs every 24 hours per product
   - Calls Reddit + HN collectors
   - Deduplicates results
   - Updates `signals` table

5. **Test with Real Data**
   - Add a test product (e.g., a real SaaS URL)
   - Run signal collection manually
   - Verify signals appear in database
   - Check quality: are the signals actually relevant?

**Deliverable:** System that finds Reddit + HN posts matching a product's keywords. Signals stored in database.

---

## Phase 2: Intent Scoring Engine

**Goal:** Score each signal for buying intent. Show "Why this lead?" explanation.

**Why third:** Raw signals are noisy. Without scoring, users get 100 irrelevant posts. Scoring is what turns noise into leads. This is the product's core value.

### MVP Approach (Simple — Improve with Data)

```
MVP SCORING = 3 steps, not 6
├── 1. Soft pre-filter (discard pure noise, let Exa results through)
├── 2. LLM scores intent 0-100 (one call, $0.002/post)
└── 3. Category: hot/warm/cold + "Explain Why"

That's it. No competitor scoring, no spike detection, no adaptive batching.
Just: filter → LLM → done.

We improve with feedback data over time:
├── Month 1: Add recency weighting (if data shows it helps)
├── Month 3: Add competitor scoring (if data shows it helps)
├── Month 4: Add multi-source boost (if data shows it helps)
└── Month 6+: TabFM/TabPFN ML scoring (when we have 1000+ feedback points)
```

### Tasks

1. **Keyword Pre-Filter** (`scorer.py`)
   - Input: signal text + product keywords
   - Fast regex/keyword match
   - Remove posts that don't match any keywords
   - Keep only posts with at least 1 keyword match
   - **Goal:** Remove 90% of noise before LLM scoring (saves money)

2. **LLM Intent Scoring**
   - Input: signal text + product description + ICP + pain points
   - Send to GPT-4o-mini with structured prompt:
     ```
     Rate this post's buying intent 0-100.
     90-100: Direct, explicit need ("I need X", "anyone know a good Y?")
     70-89: Strong related need ("looking for alternative to Z")
     50-69: Moderate need (discussing the problem space)
     0-49: Low/no intent
     
     Also rate ICP match 0-100.
     
     Return JSON: {"intent": N, "icp_match": N, "reason": "..."}
     ```
   - Output: intent score, ICP match, reasoning text

3. **Recency Scoring**
   - Post < 24h old → recency = 100
   - Post 1-3 days old → recency = 70
   - Post 3-7 days old → recency = 40
   - Post 7+ days old → recency = 10

4. **Final Score Calculation**
   ```
   final_score = (intent_score × 0.40) + (icp_match × 0.25) + (recency × 0.15) + (multi_source × 0.10) + (spike × 0.10)
   ```
   - Category: hot (≥70), warm (50-69), cold (≤49)

5. **"Explain Why" Panel**
   - For each lead, generate 3-5 bullet points explaining why it was picked
   - Example: "✓ Directly asking for your type of product ✓ Freelancer — matches your ICP ✓ Posted 4 hours ago — very fresh"
   - Store in `leads.reasoning`

6. **Celery Worker for Scoring**
   - Task: `score_leads(product_id)`
   - Runs after signal collection
   - Scores all new signals
   - Creates entries in `leads` table

7. **Test with Real Data**
   - Run scoring on signals from Phase 1
   - Manually verify: are hot leads actually hot?
   - Check: are cold leads actually cold?
   - Iterate on scoring prompt if needed

**Deliverable:** System that scores signals 0-100 and generates "Explain Why" text. Hot/warm leads identified.

---

## 8. Phase 3: Contact Enrichment

**Goal:** For hot/warm leads, find email + LinkedIn URL.

**Why fourth:** A lead without contact info is useless. But enrichment costs money ($0.01-0.05/lead), so we only enrich high-score leads. This phase turns leads into actionable contacts.

### Tasks

1. **Exa Agent API Integration** (`enricher.py`)
   - Input: author username + real name (if available) + source platform
   - Call Exa Agent API: "Find email and LinkedIn profile for this person"
   - Output: email, linkedin_url, real_name, company_name
   - Cost: ~$0.01-0.05 per lookup

2. **Fallback: KeeLead (Open Source)**
   - If Exa fails or returns no results
   - Use KeeLead's 35 free data sources
   - Try GitHub, Dev.to, StackOverflow profiles
   - Extract email from public profiles

3. **Email Verification**
   - Use KeeLead's email verification (DNS + MX + SMTP checks)
   - Mark email as "verified" or "unverified"
   - Never show unverified emails without warning

4. **Enrichment Celery Worker**
   - Task: `enrich_leads(product_id)`
   - Runs after scoring
   - Only enriches leads with score ≥ 60 (saves money)
   - Stores results in `leads` table

5. **Test with Real Data**
   - Take 10 hot leads from Phase 2
   - Enrich them
   - Verify: do emails actually work? Do LinkedIn URLs resolve?
   - Measure enrichment success rate (aim for >50%)

**Deliverable:** Hot/warm leads have email + LinkedIn info. System skips enriching cold leads to save money.

---

## 9. Phase 4: Delivery — Email + Dashboard

**Goal:** Deliver leads to users via weekly email digest + 3-screen dashboard.

**Why fifth:** The pipeline works (collect → score → enrich). Now we need to deliver results to users. This is where the product becomes visible.

### Tasks

1. **Outreach Draft Generation** (`drafter.py`)
   - Input: lead (signal + score + contact info) + product info
   - Generate 3 drafts:
     - Email draft (3-4 sentences, references specific post, sounds human)
     - LinkedIn DM draft (shorter, references post, asks for connection)
     - Reddit reply draft (helpful, answers their question, mentions product naturally)
   - Store in `leads` table

2. **Weekly Email Digest** (`emailer.py`)
   - Template: clean, minimal email showing leads sorted by score
   - Each lead shows: score, post text, source, "View draft" link
   - Sent every Monday 9am (user's timezone)
   - Using Resend API + React Email templates

3. **Dashboard — Settings Screen**
   - Form: URL input, "Analyze" button
   - Shows AI-extracted product info (editable)
   - Keyword management (add/remove)
   - Subreddit management
   - Scan frequency setting
   - Save button

4. **Dashboard — Leads List Screen**
   - Table of leads sorted by score (highest first)
   - Columns: score badge (🔥🟡❄️), post preview, source, time ago, feedback buttons
   - Click to view detail
   - Filter: hot/warm/cold, source, date range

5. **Dashboard — Lead Detail Screen**
   - "Explain Why" panel (bullets)
   - Contact info (email, LinkedIn)
   - 3 draft previews (email, LinkedIn DM, Reddit reply)
   - Copy buttons for each draft
   - Original post link
   - 👍/👎 feedback buttons

6. **Test End-to-End**
   - Create test product
   - Wait for signals (or seed test data)
   - Verify email digest arrives
   - Verify dashboard shows leads
   - Click through to lead detail
   - Copy a draft

**Deliverable:** Complete user experience. Email arrives weekly. Dashboard shows leads with drafts. Users can act on leads.

---

## 10. Phase 5: Auth, Payments, Landing Page

**Goal:** Users can sign up, pay, and use the product.

**Why sixth:** The product works. Now we need to monetize it. Auth + payments are the last piece before launch.

### Tasks

1. **Authentication**
   - Supabase Auth: email/password + Google OAuth
   - Login page, signup page, forgot password
   - Protected routes (redirect to login if not authed)
   - Session management

2. **Landing Page**
   - Hero: "Paste your SaaS URL. Get people who need it — this week."
   - How it works (3 steps with icons)
   - Pricing table (Free / Starter $29 / Pro $79)
   - Testimonials (from beta users)
   - CTA: "Get Started Free"
   - Social proof: "Join 100+ founders finding customers on autopilot"

3. **Stripe Integration**
   - Plans: Free (3 leads/week), Starter ($29/mo, 10 leads/week), Pro ($79/mo, 25 leads/week)
   - Stripe Checkout for payment
   - Stripe Webhooks for subscription events
   - Usage tracking (leads delivered per user)

4. **Onboarding Flow**
   - After signup → redirect to Settings
   - Paste URL → AI analyzes → show results
   - "Start Monitoring" button
   - "We'll email you your first leads in 24 hours"

5. **Usage Limits**
   - Free: 3 leads/week, no contact info, no drafts
   - Starter: 10 leads/week, contact info + drafts
   - Pro: 25 leads/week, daily alerts, priority scoring
   - Enforce limits in API + Celery workers

6. **Test Full Flow**
   - Sign up as new user
   - Paste a real URL
   - Wait for signals
   - Receive email digest
   - View in dashboard
   - Upgrade to paid plan
   - Verify Stripe charges

**Deliverable:** Complete product with auth, payments, and onboarding. Ready for real users.

---

## 11. Phase 6: Polish, Beta Launch

**Goal:** Refine UX, fix bugs, launch to 30 beta users.

**Why seventh:** The product works end-to-end. Now we need to make it good enough that people pay for it. Beta users give us feedback to iterate fast.

### Tasks

1. **UX Polish**
   - Loading states for all async operations
   - Error handling (user-friendly messages)
   - Empty states (no leads yet, what to expect)
   - Mobile responsiveness (test on phone)
   - Dark mode (default, but toggle available)

2. **Performance Optimization**
   - Lazy load lead list (infinite scroll or pagination)
   - Cache product analysis results
   - Optimize LLM calls (batch scoring)
   - Database indexes on frequently queried columns

3. **Beta User Recruitment**
   - Post on r/SaaS, r/indiehackers, r/startups
   - Post in Twitter #buildinpublic community
   - Share in AI/startup Discord servers
   - Goal: 30 beta users, pre-revenue or < $1k MRR
   - Free for 30 days in exchange for feedback

4. **Feedback Collection**
   - In-app feedback button
   - Weekly survey (Google Forms)
   - 1-on-1 calls with 5 most active users
   - Track: which leads were useful? Which weren't?

5. **Bug Fixes + Iteration**
   - Fix scoring based on feedback
   - Improve keyword auto-generation
   - Fix any enrichment failures
   - Improve email deliverability

**Deliverable:** Polished product with 30 beta users giving feedback. Core metrics tracked.

---

## 12. Phase 7: Public Launch + Growth

**Goal:** Open to public, acquire paying customers, start growing.

**Why last:** We need a working product + happy beta users before going public. Premature launch kills startups.

### Tasks

1. **Public Launch**
   - Open signup to everyone
   - Show HN post: "We helped 30 founders find their first customers — here's what we learned"
   - Product Hunt launch (if momentum)
   - Update landing page with beta user testimonials

2. **Twitter/X Monitoring (V2)**
   - Add Scweet integration
   - Monitor Twitter for buying signals
   - This is a major feature — competitors charge $99+/mo for this

3. **LinkedIn Monitoring (V2)**
   - Add LinkedIn no-cookies scraper
   - Monitor LinkedIn posts for buying signals
   - Another major differentiator

4. **Spike Detection (V2)**
   - Track signal frequency over time per product
   - When a product goes from 0 mentions to 5 in a week → "Surge detected"
   - Bombora-style intelligence at indie SaaS pricing

5. **Growth Loops**
   - Referral program: "Give a friend 1 month free, get 1 month free"
   - "Powered by Czero" badge on outreach drafts (if user enables)
   - Content marketing: blog posts about Reddit lead gen strategies
   - SEO: target "reddit lead generation tool" keywords

6. **Metrics to Track**
   - Signups per week
   - Free → Paid conversion rate (target: 10-15%)
   - MRR growth
   - Churn rate (target: <5%/mo)
   - Lead quality score (user feedback average)
   - Enrichment success rate

**Deliverable:** Public product with growing revenue. V2 features (Twitter, LinkedIn, spike detection) live.

---

## 13. Cost Structure & Unit Economics

### Per-User Costs (Starter Plan: $29/mo)

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Exa searches (100/week) | $2.80 | $7/1k requests |
| LLM scoring (200 posts/week) | $0.56 | GPT-4o-mini at $0.15/1M input |
| Contact enrichment (20 leads/week) | $0.80 | Exa Agent API at $0.01-0.05/lead |
| Outreach drafts (20/week) | $0.12 | GPT-4o-mini, ~500 tokens each |
| Email delivery (Resend) | $0 | Free tier (3k emails/mo) |
| Supabase (DB + Auth) | $0 | Free tier (500MB, 50k MAU) |
| Vercel (frontend) | $0 | Free tier |
| Railway (backend) | $0.50 | $5/mo ÷ 10 users |
| Redis (Upstash) | $0 | Free tier |
| **Total per user** | **$4.78** | |
| **Revenue per user** | **$29.00** | |
| **Gross margin** | **83%** | |

### Break-Even Analysis

| Metric | Value |
|--------|-------|
| Monthly fixed costs (Railway + domains + tools) | ~$50 |
| Gross margin per user | $24.22 |
| Users to break even | ~3 users |
| Users to cover full-time time investment | ~20 users |

---

## 14. Competitive Positioning

### Positioning Statement

> **Czero** is the simplest way for indie SaaS founders to find their first customers. Paste your URL. Get people who need your product — with their contact info and ready-to-send messages.

### How We Beat Each Competitor

| Competitor | Their Weakness | Our Advantage |
|-----------|---------------|---------------|
| **Buska** | Complex, $49/mo minimum | Simple, $29/mo |
| **ReplyGain** | Early stage, no enrichment | Working product, contact info |
| **HuntIQ** | Reddit-only | Multi-platform |
| **Leado** | Reddit-only, aggressive outreach | Multi-platform, human-friendly |
| **LeadRadar** | Reddit-only | Multi-platform |
| **Reddscan** | Reddit-only | Multi-platform |
| **Prospy** | Reddit/HN not ready yet | All platforms working |
| **IntentHunter** | $149/mo minimum | $29/mo |
| **Subreach** | Reddit-only, auto-DM (risky) | Multi-platform, human-approved |
| **SnitchFeed** | No HN | HN included |
| **LeadProton** | LinkedIn only at $45/mo | LinkedIn included at $29/mo |
| **Tractionly** | Reddit-only | Multi-platform |
| **Pluggo** | X + Reddit only, Slack-only delivery | Multi-platform, email + dashboard |
| **Coven** | Not launched yet (waitlist) | Already working |

### Messaging

**Landing page hero:**
> "Stop guessing who to sell to."
> "Paste your SaaS URL. Get people who need it — this week."

**Pricing page:**
> "One closed deal pays for a year of Czero."

**Email subject:**
> "🔥 4 people are looking for something like [Product Name]"

---

*This plan is a living document. Update as we learn from building and user feedback.*
