# Czero — Project Context Prompt

> Feed this to Command Code BEFORE any step prompts. This is the single source of truth for the project.

---

## What We're Building

**Czero** is a SaaS tool that helps indie SaaS founders find their first customers.

**One-liner:** "Paste your SaaS URL. Get people who need it — this week."

**How it works:**
1. User pastes their product URL
2. AI analyzes the product (ICP, keywords, pain points)
3. We monitor Reddit, Twitter, LinkedIn, HN, and the entire web (via Exa) for people expressing need
4. We score each signal for buying intent
5. We find contact info (email + LinkedIn)
6. We draft personalized outreach messages
7. User gets a weekly email digest with leads

**Target users:** Indie SaaS founders, pre-revenue or < $1k MRR
**Pricing:** Free (3 leads/week) / Starter $29/mo (10/week) / Pro $79/mo (25/week)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui | Fast UI, dark mode, mobile responsive |
| Backend | Python FastAPI | Async scraping + LLM integration |
| Database | Supabase (Postgres) | Free tier, auth built-in, REST API |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Task Queue | Celery + Redis (Upstash) | Background signal collection |
| LLM | GPT-4o-mini (OpenAI) | Intent scoring + outreach drafts |
| Signal Collection | PRAW (Reddit), Scweet (Twitter), Exa (semantic), Algolia (HN) | 5 parallel sources |
| Contact Enrichment | Exa Agent API + KeeLead (open source) | Parallel, pick best |
| Email | Resend | Weekly digest delivery |
| Hosting | Vercel (frontend) + Railway (backend) | Cheap, easy deploy |

---

## Project Structure

```
czero/
├── frontend/                    # Next.js 15
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx           # Root layout (dark theme)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx       # Dashboard layout
│   │   │   ├── page.tsx         # Leads list
│   │   │   ├── settings/page.tsx
│   │   │   └── leads/[leadId]/page.tsx
│   │   └── api/                 # Proxy routes (optional)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── LeadCard.tsx
│   │   ├── ScoreBadge.tsx
│   │   └── ExplainWhy.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── middleware.ts
│   └── package.json
│
├── api/                         # Python FastAPI
│   ├── app/
│   │   ├── main.py              # Entry point
│   │   ├── config.py            # Settings
│   │   ├── models/              # Pydantic models
│   │   ├── routes/              # API endpoints
│   │   ├── engines/             # ⭐ 3 core engines
│   │   │   ├── collector/       # Signal collection
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── merger.py
│   │   │   │   └── sources/
│   │   │   │       ├── base.py
│   │   │   │       ├── reddit.py
│   │   │   │       ├── twitter.py
│   │   │   │       ├── linkedin.py
│   │   │   │       ├── hn.py
│   │   │   │       └── exa.py
│   │   │   ├── scorer/          # Intent scoring
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── pre_filter.py
│   │   │   │   └── llm_scorer.py
│   │   │   └── enricher/        # Contact enrichment
│   │   │       ├── orchestrator.py
│   │   │       ├── sources/
│   │   │       ├── verifier.py
│   │   │       └── cache.py
│   │   ├── services/            # Shared services
│   │   └── workers/             # Celery tasks
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── PLAN.md
├── ROADMAP.md
├── ENGINES.md
├── ARCHITECTURE.md
└── build-prompts/               # Prompts for Command Code
    ├── PROJECT-CONTEXT.md       # This file
    ├── PHASE-0.md
    ├── PHASE-1.md
    └── ...
```

---

## Database Schema

```sql
-- Products (what user is monitoring)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    url TEXT NOT NULL,
    name TEXT,
    description TEXT,
    icp JSONB DEFAULT '{}',
    pain_points TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    competitor_names TEXT[] DEFAULT '{}',
    subreddit_list TEXT[] DEFAULT '{}',
    scan_frequency INTERVAL DEFAULT '24 hours',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Signals (raw posts found)
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    author_username TEXT,
    text TEXT NOT NULL,
    subreddit TEXT,
    score_raw INT,
    posted_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT now(),
    dedup_key TEXT UNIQUE
);

-- Leads (scored + enriched signals)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    signal_id UUID REFERENCES signals(id),
    final_score INT NOT NULL,
    category TEXT NOT NULL,
    reasoning TEXT,
    email TEXT,
    linkedin_url TEXT,
    real_name TEXT,
    company_name TEXT,
    email_draft TEXT,
    linkedin_dm_draft TEXT,
    reddit_reply_draft TEXT,
    user_feedback TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints

```
POST   /api/products/analyze      # Analyze URL → product info
POST   /api/products              # Create product
GET    /api/products              # List user's products
GET    /api/leads?product_id=X    # Get leads for product
POST   /api/leads/{id}/feedback   # Submit 👍/👎
GET    /api/health                # Health check
```

---

## Conventions

1. **Python:** Use type hints, docstrings, async/await everywhere
2. **TypeScript:** Strict mode, no `any`, use interfaces
3. **Styling:** Tailwind only, dark theme default, shadcn/ui components
4. **Git:** Conventional commits (feat:, fix:, chore:)
5. **Testing:** pytest for Python, manual verification for frontend
6. **Error handling:** Never crash silently, always log errors
7. **Environment:** Never hardcode API keys, always use .env

---

## Key Design Decisions

1. **Collection = Parallel** — 5 sources run independently, merge at end
2. **Scoring = Simple (MVP)** — Soft filter → LLM score → category. No complex layers yet.
3. **Enrichment = Parallel** — Run ALL sources, pick BEST result (not first found)
4. **Delivery = Email + Dashboard** — Weekly digest + 3-screen dashboard
5. **Free tier = Teaser** — Show leads without contact info, paywall for contacts

---

## What NOT to Build Yet

- ❌ Competitor scoring (add later with data)
- ❌ Spike detection (needs baseline data)
- ❌ ML scoring (TabFM/TabPFN — needs 1000+ feedback points)
- ❌ Complex dashboard (pipeline, kanban, CRM)
- ❌ Auto-outreach (we generate drafts, humans send them)
- ❌ Slack/Discord alerts (Pro tier feature, later)
