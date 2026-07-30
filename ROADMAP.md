# Czero — Build Roadmap (Chunked & Independent Tasks)

> Each task is self-contained. Give it to an agent with the task description + relevant context files. It should produce a working artifact without needing to know about other tasks.

---

## Dependency Map

```
PHASE 0 (Foundation)
├── T0.1 Next.js Setup ─────────────────────┐
├── T0.2 Supabase Setup ────────────────────┤
├── T0.3 Python Backend Setup ──────────────┤
├── T0.4 Redis + Celery Setup ──────────────┤
├── T0.5 Database Schema ───────────────────┤
├── T0.6 GitHub Repo + CI ──────────────────┤
└── T0.7 Deploy Skeleton ───────────────────┘
         │
         ▼
PHASE 1 (Signal Collection) ─── Can start after T0.1-T0.5 done
├── T1.1 URL Analyzer Service ──────────────┐
├── T1.2 Reddit Collector ──────────────────┤
├── T1.3 HN Collector ─────────────────────┤
├── T1.4 Signal Deduplication ─────────────┤
├── T1.5 Celery Worker: Collect ───────────┤
└── T1.6 Integration Test: Collect ────────┘
         │
         ▼
PHASE 2 (Intent Scoring) ─── Can start after T1.1-T1.4 done
├── T2.1 Keyword Pre-Filter ───────────────┐
├── T2.2 LLM Intent Scorer ───────────────┤
├── T2.3 Recency + Spike Scoring ─────────┤
├── T2.4 "Explain Why" Generator ─────────┤
├── T2.5 Final Score Calculator ───────────┤
├── T2.6 Celery Worker: Score ────────────┤
└── T2.7 Integration Test: Score ─────────┘
         │
         ▼
PHASE 3 (Contact Enrichment) ─── Can start after T2.5 done
├── T3.1 Exa Agent Enricher ──────────────┐
├── T3.2 KeeLead Fallback ────────────────┤
├── T3.3 Email Verifier ──────────────────┤
├── T3.4 Celery Worker: Enrich ───────────┤
└── T3.5 Integration Test: Enrich ────────┘
         │
         ▼
PHASE 4 (Delivery) ─── Can start after T2.5 + T3.4 done
├── T4.1 Outreach Draft Generator ────────┐
├── T4.2 Email Digest Template ───────────┤
├── T4.3 Resend Email Sender ─────────────┤
├── T4.4 Celery Worker: Digest ───────────┤
├── T4.5 Dashboard: Settings Page ────────┤
├── T4.6 Dashboard: Leads List Page ──────┤
├── T4.7 Dashboard: Lead Detail Page ─────┤
├── T4.8 Dashboard: Auth (Login/Signup) ──┤
└── T4.9 Integration Test: Full Flow ─────┘
         │
         ▼
PHASE 5 (Payments + Landing) ─── Can start after T4.8 done
├── T5.1 Landing Page ────────────────────┐
├── T5.2 Stripe Integration ──────────────┤
├── T5.3 Usage Limits ────────────────────┤
├── T5.4 Onboarding Flow ─────────────────┤
├── T5.5 Free Tier Teaser ────────────────┤
└── T5.6 Integration Test: Pay ───────────┘
         │
         ▼
PHASE 6 (Polish + Beta)
├── T6.1 Loading States ──────────────────┐
├── T6.2 Error Handling ──────────────────┤
├── T6.3 Empty States ────────────────────┤
├── T6.4 Mobile Responsiveness ───────────┤
├── T6.5 Dark Mode ───────────────────────┤
├── T6.6 Performance Optimization ────────┤
├── T6.7 Beta User Recruitment ───────────┤
└── T6.8 Feedback Collection ─────────────┘
```

---

## Parallel Work Opportunities

### Wave 1: Foundation (All independent — delegate 5 agents)
```
T0.1 Next.js Setup ────────────── Agent A
T0.2 Supabase Setup ───────────── Agent B
T0.3 Python Backend Setup ─────── Agent C
T0.4 Redis + Celery Setup ─────── Agent D
T0.5 Database Schema ──────────── Agent E
```

### Wave 2: Signal Collection (All independent — delegate 4 agents)
```
T1.1 URL Analyzer Service ─────── Agent A
T1.2 Reddit Collector ─────────── Agent B
T1.3 HN Collector ─────────────── Agent C
T1.4 Signal Deduplication ─────── Agent D
```

### Wave 3: Scoring + Enrichment (Independent — delegate 5 agents)
```
T2.1 Keyword Pre-Filter ───────── Agent A
T2.2 LLM Intent Scorer ────────── Agent B
T2.3 Recency + Spike ──────────── Agent C
T2.4 "Explain Why" Generator ──── Agent D
T3.1 Exa Agent Enricher ───────── Agent E
```

### Wave 4: Frontend + Delivery (Independent — delegate 5 agents)
```
T4.5 Dashboard: Settings ──────── Agent A
T4.6 Dashboard: Leads List ────── Agent B
T4.7 Dashboard: Lead Detail ───── Agent C
T4.1 Outreach Draft Generator ─── Agent D
T4.2 Email Digest Template ────── Agent E
```

---

## Phase 0: Foundation

### T0.1 — Next.js Frontend Setup
**What:** Initialize Next.js 15 project with Tailwind, shadcn/ui, App Router
**Input:** Nothing (fresh project)
**Output:** Running Next.js app at `C:\Users\satya\Czero\frontend\`
**Agent instructions:**
```
Create a Next.js 15 project at C:\Users\satya\Czero\frontend\
1. npx create-next-app@latest . --typescript --tailwind --app --eslint
2. Install shadcn/ui: npx shadcn@latest init
3. Install: npm install zustand @supabase/supabase-js
4. Create folder structure:
   app/
   ├── page.tsx (landing placeholder)
   ├── dashboard/
   │   ├── layout.tsx (sidebar layout)
   │   ├── page.tsx (leads list placeholder)
   │   └── settings/page.tsx (placeholder)
   ├── auth/
   │   ├── login/page.tsx
   │   └── signup/page.tsx
   └── layout.tsx (root layout with dark theme)
   components/ui/ (shadcn components)
   lib/supabase.ts (supabase client placeholder)
   lib/api.ts (API client placeholder)
5. Set up dark theme as default
6. Verify: npm run dev shows placeholder pages
```
**Dependencies:** None
**Estimated time:** 15 min

---

### T0.2 — Supabase Project Setup
**What:** Create Supabase project, configure auth, get API keys
**Input:** Supabase account (free)
**Output:** Supabase project with API keys ready
**Agent instructions:**
```
1. Go to supabase.com → Create new project "czero"
2. Note down:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service role key (SUPABASE_SERVICE_ROLE_KEY)
3. Enable Email/Password auth in Authentication → Providers
4. Enable Google OAuth (create Google Cloud OAuth credentials)
5. Create .env.local in C:\Users\satya\Czero\frontend\ with:
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
6. Create .env in C:\Users\satya\Czero\api\ with:
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
```
**Dependencies:** None
**Estimated time:** 10 min

---

### T0.3 — Python Backend Setup
**What:** Initialize FastAPI project with all dependencies
**Input:** Nothing (fresh project)
**Output:** Running FastAPI server at `C:\Users\satya\Czero\api\`
**Agent instructions:**
```
Create a Python project at C:\Users\satya\Czero\api\
1. uv init (or python -m venv venv && venv\Scripts\activate)
2. Install dependencies:
   uv add fastapi uvicorn celery[redis] redis praw exa-py openai \
          pydantic httpx python-dotenv resend supabase
3. Create project structure:
   app/
   ├── __init__.py
   ├── main.py (FastAPI app with CORS, health endpoint)
   ├── config.py (pydantic Settings: load from .env)
   ├── models/
   │   ├── __init__.py
   │   ├── product.py (Pydantic models for Product)
   │   ├── signal.py (Pydantic models for Signal)
   │   ├── lead.py (Pydantic models for Lead)
   │   └── user.py (Pydantic models for User)
   ├── routes/
   │   ├── __init__.py
   │   ├── products.py (CRUD for products)
   │   ├── leads.py (GET leads, feedback)
   │   └── health.py (health check)
   ├── services/
   │   ├── __init__.py
   │   ├── analyzer.py (placeholder)
   │   ├── collector.py (placeholder)
   │   ├── scorer.py (placeholder)
   │   ├── enricher.py (placeholder)
   │   ├── drafter.py (placeholder)
   │   └── emailer.py (placeholder)
   └── workers/
       ├── __init__.py
       ├── celery_app.py (Celery config)
       ├── collect_signals.py (placeholder)
       ├── score_leads.py (placeholder)
       └── generate_digests.py (placeholder)
4. main.py should:
   - Create FastAPI app
   - Add CORS middleware (allow localhost:3000)
   - Include health route
   - Return {"status": "ok"} at GET /
5. Verify: uvicorn app.main:app --reload → opens Swagger docs
```
**Dependencies:** None
**Estimated time:** 15 min

---

### T0.4 — Redis + Celery Setup
**What:** Set up Redis connection and Celery worker
**Input:** Redis running (Upstash free tier or local)
**Output:** Celery worker that can process tasks
**Agent instructions:**
```
In C:\Users\satya\Czero\api\:
1. Sign up at upstash.com → Create Redis instance (free tier)
2. Note REDIS_URL
3. Add to .env:
   REDIS_URL=redis://default:password@host:port
4. Create app/workers/celery_app.py:
   from celery import Celery
   import os
   
   celery_app = Celery(
       "czero",
       broker=os.getenv("REDIS_URL"),
       backend=os.getenv("REDIS_URL")
   )
   celery_app.conf.update(
       task_serializer="json",
       result_serializer="json",
       accept_content=["json"],
       timezone="UTC",
       enable_utc=True,
       task_track_started=True,
   )
   
   # Auto-discover tasks
   celery_app.autodiscover_tasks(["app.workers"])
5. Create a test task in app/workers/test_task.py:
   @celery_app.task
   def test_task(x, y):
       return x + y
6. Verify: 
   - Terminal 1: celery -A app.workers.celery_app worker --loglevel=info
   - Terminal 2: python -c "from app.workers.celery_app import celery_app; celery_app.send_task('app.workers.test_task.test_task', args=[4,4])"
   - Worker shows task received and completed
```
**Dependencies:** None
**Estimated time:** 10 min

---

### T0.5 — Database Schema
**What:** Create all database tables via Supabase SQL editor
**Input:** Supabase project from T0.2
**Output:** All tables created with RLS policies
**Agent instructions:**
```
In Supabase SQL Editor, run:

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Signals table
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('reddit', 'twitter', 'linkedin', 'hn', 'exa')),
    source_url TEXT NOT NULL,
    author_username TEXT,
    author_profile_url TEXT,
    text TEXT NOT NULL,
    subreddit TEXT,
    score_raw INT,
    posted_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT now(),
    dedup_key TEXT UNIQUE
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
    intent_score INT NOT NULL CHECK (intent_score >= 0 AND intent_score <= 100),
    icp_match_score INT CHECK (icp_match_score >= 0 AND icp_match_score <= 100),
    recency_score INT CHECK (recency_score >= 0 AND recency_score <= 100),
    multi_source_bonus INT DEFAULT 0,
    final_score INT NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
    category TEXT NOT NULL CHECK (category IN ('hot', 'warm', 'cold')),
    reasoning TEXT,
    email TEXT,
    linkedin_url TEXT,
    real_name TEXT,
    company_name TEXT,
    email_draft TEXT,
    linkedin_dm_draft TEXT,
    reddit_reply_draft TEXT,
    user_feedback TEXT CHECK (user_feedback IN ('useful', 'not_useful', NULL)),
    feedback_at TIMESTAMPTZ,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'contacted', 'converted')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Digests table
CREATE TABLE IF NOT EXISTS digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    week_start DATE,
    lead_count INT DEFAULT 0,
    hot_count INT DEFAULT 0,
    warm_count INT DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Scoring feedback table
CREATE TABLE IF NOT EXISTS scoring_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    predicted_score INT,
    actual_relevance TEXT CHECK (actual_relevance IN ('useful', 'not_useful')),
    feedback_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_signals_product_id ON signals(product_id);
CREATE INDEX idx_signals_source ON signals(source);
CREATE INDEX idx_signals_dedup_key ON signals(dedup_key);
CREATE INDEX idx_leads_product_id ON leads(product_id);
CREATE INDEX idx_leads_final_score ON leads(final_score DESC);
CREATE INDEX idx_leads_category ON leads(category);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_products_user_id ON products(user_id);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own products
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Users can see leads for their products
CREATE POLICY "Users can view own leads" ON leads
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM products WHERE products.id = leads.product_id AND products.user_id = auth.uid())
    );
CREATE POLICY "Users can update own leads" ON leads
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM products WHERE products.id = leads.product_id AND products.user_id = auth.uid())
    );

-- Users can see signals for their products
CREATE POLICY "Users can view own signals" ON signals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM products WHERE products.id = signals.product_id AND products.user_id = auth.uid())
    );

-- Service role bypass (for backend)
CREATE POLICY "Service role full access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true) WITH CHECK (true);
```
**Dependencies:** T0.2
**Estimated time:** 10 min

---

### T0.6 — GitHub Repo + CI
**What:** Create GitHub repo, set up CI pipeline
**Input:** Code from T0.1-T0.4
**Output:** Private GitHub repo with CI passing
**Agent instructions:**
```
1. Create private GitHub repo: Czero
2. Initialize git in C:\Users\satya\Czero\
3. Create .gitignore:
   node_modules/
   .env
   .env.local
   __pycache__/
   *.pyc
   .venv/
   dist/
   build/
   .DS_Store
4. Commit all code
5. Push to GitHub
6. Create .github/workflows/ci.yml:
   name: CI
   on: [push, pull_request]
   jobs:
     frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - run: cd frontend && npm ci && npm run build
     backend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-python@v5
           with:
             python-version: '3.11'
         - run: cd api && pip install -r requirements.txt && python -m pytest
7. Verify CI passes
```
**Dependencies:** T0.1, T0.3
**Estimated time:** 10 min

---

### T0.7 — Deploy Skeleton
**What:** Deploy frontend to Vercel, backend to Railway
**Input:** Code from T0.1-T0.4
**Output:** Both services running online
**Agent instructions:**
```
FRONTEND (Vercel):
1. Go to vercel.com → Import GitHub repo "Czero"
2. Framework: Next.js, Root Directory: frontend
3. Add env vars (SUPABASE_URL, SUPABASE_ANON_KEY)
4. Deploy
5. Verify: https://czero.vercel.app shows landing page

BACKEND (Railway):
1. Go to railway.app → New Project → Deploy from GitHub
2. Select repo, set root directory: api
3. Add Dockerfile if needed, or use Nixpacks
4. Add env vars (REDIS_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
5. Set port: 8000
6. Deploy
7. Verify: https://czero-api.up.railway.app/health returns {"status": "ok"}
```
**Dependencies:** T0.1, T0.3, T0.4, T0.6
**Estimated time:** 15 min

---

## Phase 1: Signal Collection

### T1.1 — URL Analyzer Service
**What:** Given a URL, extract product info (ICP, keywords, pain points) using LLM
**Input:** Product URL
**Output:** Product analysis JSON stored in Supabase
**Agent instructions:**
```
Implement app/services/analyzer.py:

1. Create function analyze_url(url: str) -> dict:
   - Fetch URL content using httpx (or TinyFish Fetch API if key available)
   - Send content to GPT-4o-mini:
     """
     Analyze this SaaS product website.
     Return JSON:
     {
       "name": "product name",
       "description": "one sentence description",
       "icp": {
         "roles": ["target job titles"],
         "company_size": "1-10 / 10-50 / 50-200 / 200+",
         "industry": ["target industries"]
       },
       "pain_points": ["pain 1", "pain 2", "pain 3"],
       "keywords": ["keyword1", "keyword2", ...],  // 15-20 keywords to monitor
       "competitor_names": ["competitor1", "competitor2", ...],
       "subreddit_suggestions": ["subreddit1", "subreddit2", ...]  // 8-10 subreddits
     }
     """
   - Parse JSON response
   - Return structured dict

2. Create API route POST /api/products/analyze:
   - Input: {"url": "https://..."}
   - Calls analyze_url()
   - Returns analysis
   - Stores in products table

3. Test: analyze https://linear.app → should return ICP matching project management tools
```
**Dependencies:** T0.3, T0.2
**Estimated time:** 30 min

---

### T1.2 — Reddit Signal Collector
**What:** Search Reddit for posts matching product keywords. This is ONE of 5 independent sources.
**Input:** Keywords + subreddit list
**Output:** List of matching signals
**CRITICAL: This source runs INDEPENDENTLY. It does NOT filter or pre-process for other sources.**
**Agent instructions:**
```
Implement app/services/collector.py (Reddit part):

1. Set up PRAW:
   - Create Reddit app at reddit.com/prefs/apps (script type)
   - Get client_id, client_secret
   - Add to .env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT

2. Create class RedditCollector:
   - __init__: create PRAW Reddit instance
   - search(self, keywords: list[str], subreddits: list[str], limit: int = 100) -> list[dict]:
     - For each subreddit:
       - Search each keyword in that subreddit
       - Sort by new (most recent)
       - Extract: text, author, url, score, created_utc, subreddit
     - Dedup by dedup_key (hash of source + author + text[:100])
     - Return list of signal dicts

3. Dedup key formula:
   import hashlib
   dedup_key = hashlib.md5(f"reddit:{author}:{text[:100]}".encode()).hexdigest()

4. Test: search ["invoicing", "billing"] in ["r/freelance", "r/SaaS"]
   - Should return posts about invoicing tools

IMPORTANT: This collector runs INDEPENDENTLY of other sources.
It does NOT share results with Twitter/Exa/HN collectors.
All results MERGE at the orchestrator level.
```
**Dependencies:** T0.3
**Estimated time:** 30 min

---

### T1.3 — Hacker News Signal Collector
**What:** Search HN for posts matching product keywords
**Input:** Keywords
**Output:** List of matching signals
**Agent instructions:**
```
Implement app/services/collector.py (HN part):

1. Create class HNCollector:
   - search(self, keywords: list[str], limit: int = 50) -> list[dict]:
     - For each keyword:
       - Call Algolia HN Search API:
         GET https://hn.algolia.com/api/v1/search_by_date?query={keyword}&tags=(story,comment)&hitsPerPage=20
       - Filter: created_at_i > (now - 7 days)
       - Extract: text (title + story_text or comment_text), author, url, points, created_at, objectID
       - Build source_url: https://news.ycombinator.com/item?id={objectID}
     - Dedup by dedup_key (hash of "hn:{author}:{text[:100]}")
     - Return list of signal dicts

2. Dedup key:
   dedup_key = hashlib.md5(f"hn:{author}:{text[:100]}".encode()).hexdigest()

3. Test: search ["invoicing tool", "billing software"]
   - Should return HN posts about invoicing
```
**Dependencies:** T0.3
**Estimated time:** 20 min

---

### T1.4 — Signal Deduplication Service
**What:** Deduplicate signals across sources and time
**Input:** Raw signals from multiple collectors
**Output:** Deduplicated signals
**Agent instructions:**
```
Implement app/services/dedup.py:

1. Create class SignalDeduplicator:
   - __init__: supabase client
   - dedup(self, signals: list[dict]) -> list[dict]:
     - For each signal:
       - Check if dedup_key exists in signals table
       - If exists → skip
       - If not → add to output list
     - Batch insert new signals to Supabase
     - Return only new (non-duplicate) signals

2. Create helper: generate_dedup_key(source, author, text) -> str:
   - Clean text: lowercase, strip whitespace, take first 100 chars
   - Hash: md5(f"{source}:{author}:{clean_text}")
   - Return hex digest

3. Test: 
   - Insert same signal twice → only 1 stored
   - Insert same content from different sources → both stored (different dedup_key)
```
**Dependencies:** T0.3, T0.2
**Estimated time:** 20 min

---

### T1.5 — Celery Worker: Signal Collection
**What:** Background task that runs ALL sources IN PARALLEL + merge + dedup
**Input:** Product ID
**Output:** New signals stored in Supabase
**Agent instructions:**
```
Implement app/workers/collect_signals.py:

1. Create task @celery_app.task def collect_signals(product_id: str):
   - Fetch product from Supabase
   
   - Create ALL source managers (independent of each other):
     RedditCollector, TwitterCollector, LinkedInCollector, HNCollector, ExaCollector
   
   - Run ALL sources IN PARALLEL (asyncio.gather):
     tasks = [
       reddit_collector.search(product.keywords, product.subreddit_list),
       twitter_collector.search(product.keywords, product.competitor_names),
       linkedin_collector.search(product.keywords),
       hn_collector.search(product.keywords),
       exa_collector.search(product.description, product.keywords, product.competitor_names),
     ]
     results = await asyncio.gather(*tasks, return_exceptions=True)
   
   - MERGE all results into one flat list
   - DEDUPLICATE (content hash + cross-platform author matching)
   - Store unique signals in Supabase
   - Log: "Collected {total} raw → {unique} unique signals"

2. Register task in celery_app.py autodiscover

KEY: Each source runs INDEPENDENTLY. They don't filter each other.
Results MERGE at this orchestrator level.

3. Test:
   - Create test product in Supabase
   - Run: celery -A app.workers.celery_app call app.workers.collect_signals.collect_signals --args='["product-uuid"]'
   - Check signals table has entries from MULTIPLE sources
```
**Dependencies:** T0.4, T1.2, T1.3, T1.4
**Estimated time:** 20 min

---

### T1.6 — Integration Test: Signal Collection
**What:** End-to-end test of PARALLEL signal collection from multiple sources
**Input:** Test product URL
**Output:** Verified signals in database from MULTIPLE independent sources
**Agent instructions:**
```
Write tests/test_collect.py:

1. Create test product with URL "https://linear.app"
   - Keywords: ["project management", "issue tracker", "task management"]
   - Subreddits: ["r/SaaS", "r/startups"]

2. Run collect_signals(product_id)

3. Assert:
   - signals table has > 0 entries
   - Each signal has: source, text, author, source_url, dedup_key
   - No duplicate dedup_keys
   - signals come from MULTIPLE sources (Reddit AND Exa at minimum)
   - Verify parallel execution: all sources ran independently

4. Run again → should find 0 new signals (dedup working)

5. pytest tests/test_collect.py -v

KEY VALIDATION: Check that signals exist from Reddit, HN, AND Exa.
If only Reddit signals exist, the parallel architecture isn't working.
```
**Dependencies:** T1.5
**Estimated time:** 15 min

---

## Phase 2: Intent Scoring

### MVP vs Full Scorer (Important!)

```
MVP SCORING = Simple 3 steps
├── 1. Soft pre-filter (discard pure noise)
├── 2. LLM scores intent 0-100 (one call)
└── 3. Category: hot/warm/cold

FULL SCORING = Add layers over time (Month 3+)
├── Competitor mention scoring
├── Spike detection
├── Multi-source confirmation
├── Adaptive batching
├── Self-learning weights
└── ML scoring (TabFM/TabPFN)

KEY: Collection is FULL from Day 1 (5 sources parallel).
     Scoring is SIMPLE from Day 1 (LLM only).
     We improve scoring with data, not speculation.
```

### T2.1 — Soft Pre-Filter
**What:** Discard ONLY high-confidence noise. Let everything else through to LLM.
**Input:** Signal text + product keywords + intent phrases
**Output:** FilterResult (discard/pass)
**NOTE: This is NOT the old hard filter. Semantic matches from Exa PASS through.**
**Agent instructions:**
```
Implement app/services/pre_filter.py:

1. Create class SoftPreFilter:
   - __init__(self, keywords, intent_phrases):
     - Build keyword regex
     - Build intent phrase regex

   - should_keep(self, text: str) -> bool:
     has_keyword = bool(self.keyword_pattern.search(text))
     has_intent = bool(self.intent_pattern.search(text))
     
     # DISCARD: No keyword AND no intent → almost certainly noise
     if not has_keyword and not has_intent:
       return False
     
     # PASS: Everything else goes to LLM
     # (keyword only, intent only, both — all pass)
     return True

KEY: Exa semantic matches (e.g., "need a way to bill clients")
     have INTENT but no KEYWORD → they PASS through.
     Only pure noise is discarded.

2. Test:
   - "Anyone know a good invoicing tool?" → PASS (keyword + intent)
   - "Need a way to bill clients" → PASS (intent, no keyword — from Exa)
   - "I love sunny weather" → DISCARD (no match)
```
**Dependencies:** None (pure function)
**Estimated time:** 15 min

---

### T2.2 — LLM Intent Scorer (Simple)
**What:** One LLM call scores intent 0-100 + generates reasoning. No batching complexity.
**Input:** Signal text + product info
**Output:** Score (0-100) + reasoning
**Agent instructions:**
```
Implement app/services/scorer.py:

1. Create class SimpleScorer:
   - __init__(self, llm_client):
     self.llm = llm_client

   - async def score(self, signal: Signal, product: Product) -> dict:
     prompt = f"""Score this post for buying intent (0-100).

Product: {product.description}
Target customer: {product.icp}

Post: "{signal.text[:500]}"

Score:
- 90-100: Directly asking for this type of product
- 70-89: Strong interest in solving this problem
- 50-69: Discussing the problem space
- 30-49: Tangential mention
- 0-29: No intent

Return JSON: {{"score": N, "reason": "1-2 sentences"}}"""

     result = self.llm.chat(
       model="gpt-4o-mini",
       messages=[{"role": "user", "content": prompt}],
       response_format={"type": "json_object"}
     )
     
     return json.loads(result)

KEY: One call per signal. No batching. Simple.
     We'll optimize later when we have data.

2. Test:
   - "Anyone know a good invoicing tool?" → score 85-95
   - "I just sent an invoice" → score 10-20
   - "Need help with billing" → score 70-80
```
**Dependencies:** T0.3
**Estimated time:** 20 min

---

### T2.3 — MVP Scorer (Orchestrator)
**What:** Combines pre-filter + LLM scoring into simple pipeline.
**Input:** List of signals + product
**Output:** List of scored leads
**Agent instructions:**
```
Implement app/services/scorer.py:

1. Create class MVPScorer:
   - __init__(self, pre_filter, llm_scorer):
     self.filter = pre_filter
     self.scorer = llm_scorer

   - async def score_batch(self, signals, product) -> list[Lead]:
     leads = []
     for signal in signals:
       # Step 1: Soft pre-filter
       if not self.filter.should_keep(signal.text):
         continue
       
       # Step 2: LLM scoring
       result = await self.scorer.score(signal, product)
       score = result["score"]
       reason = result["reason"]
       
       # Step 3: Category
       if score >= 70: category = "hot"
       elif score >= 45: category = "warm"
       else: category = "cold"
       
       # Step 4: Create lead
       lead = Lead(
         signal_id=signal.id,
         product_id=product.id,
         final_score=score,
         category=category,
         reasoning=reason,
       )
       leads.append(lead)
     
     return leads

KEY: Simple loop. No layers. No pipelines.
     Filter → Score → Categorize → Done.

2. Test:
   - 60 signals in → ~25 leads out (hot + warm)
   - Each lead has score, category, reasoning
```
**Dependencies:** T2.1, T2.2
**Estimated time:** 15 min

---

### T2.4 — "Explain Why" Generator
**What:** Generate human-readable explanation for why a lead was picked
**Input:** Signal + scores + product info
**Output:** List of bullet points
**Agent instructions:**
```
Implement app/services/explainer.py:

1. Create class LeadExplainer:
   - explain(self, signal: dict, scores: dict, product: dict) -> str:
     - Build bullets list based on scores:
       - If intent_score >= 80: "✓ Directly asking for your type of product"
       - If intent_score >= 60: "✓ Strong interest in solving this problem"
       - If intent_score >= 40: "✓ Discussing the problem your product solves"
       - If icp_match >= 80: "✓ Perfect match for your ideal customer"
       - If icp_match >= 60: "✓ Fits your target customer profile"
       - If recency >= 90: "✓ Posted very recently — thread is active"
       - If recency >= 60: "✓ Recent post — still relevant"
       - If multi_source > 0: "✓ This person is active across multiple platforms"
       - Always: "✓ Source: {source} · Posted {time_ago}"
     - Join with newlines
     - Return reasoning text

2. Test:
   - High intent + high ICP + fresh post → should generate 3-4 positive bullets
   - Low intent → should note "moderate interest"
```
**Dependencies:** None (pure function)
**Estimated time:** 15 min

---

### T2.5 — Final Score Calculator
**What:** Combine all scores into final score + category
**Input:** Intent score, ICP match, recency, multi-source bonus, spike
**Output:** Final score 0-100 + category
**Agent instructions:**
```
Implement app/services/scorer.py (final calculation):

1. Create function calculate_final_score(
     intent_score: int,
     icp_match_score: int,
     recency_score: int,
     multi_source_bonus: int,
     spike_bonus: int
   ) -> dict:
   
   final = (
     intent_score * 0.40 +
     icp_match_score * 0.25 +
     recency_score * 0.15 +
     multi_source_bonus * 0.10 +
     spike_bonus * 0.10
   )
   
   final = min(100, max(0, round(final)))
   
   if final >= 70: category = "hot"
   elif final >= 50: category = "warm"
   else: category = "cold"
   
   return {"final_score": final, "category": category}

2. Test:
   - intent=90, icp=85, recency=100, multi=10, spike=0 → final=87 (hot)
   - intent=40, icp=30, recency=40, multi=0, spike=0 → final=36 (cold)
   - intent=60, icp=55, recency=70, multi=5, spike=0 → final=58 (warm)
```
**Dependencies:** None (pure function)
**Estimated time:** 10 min

---

### T2.6 — Celery Worker: Intent Scoring
**What:** Background task that scores all unscored signals for a product
**Input:** Product ID
**Output:** Leads created in Supabase
**Agent instructions:**
```
Implement app/workers/score_leads.py:

1. Create task @celery_app.task def score_leads(product_id: str):
   - Fetch product from Supabase
   - Fetch all signals for this product that don't have a lead entry yet
   - For each signal:
     a. Run KeywordPreFilter → skip if filtered out
     b. Run IntentScorer → get intent_score, icp_match_score, reasoning
     c. Run recency_score() → get recency_score
     d. Run SpikeDetector.detect_spike() → get spike_bonus
     e. Calculate final_score + category
     f. Run LeadExplainer → get reasoning text
     g. Insert into leads table
   - Log: "Scored {total} signals, {hot} hot, {warm} warm, {cold} cold"

2. Test:
   - Create test product with signals
   - Run score_leads(product_id)
   - Check leads table has entries with scores
```
**Dependencies:** T2.1, T2.2, T2.3, T2.4, T2.5
**Estimated time:** 25 min

---

### T2.7 — Integration Test: Scoring
**What:** End-to-end test of scoring pipeline
**Input:** Test signals in database
**Output:** Verified leads with correct scores
**Agent instructions:**
```
Write tests/test_score.py:

1. Create test product + 10 test signals (mix of high/low intent)
2. Run score_leads(product_id)
3. Assert:
   - Leads table has entries
   - Hot leads have score >= 70
   - Cold leads have score < 50
   - Each lead has reasoning text (not empty)
   - Each lead has category in ['hot', 'warm', 'cold']

4. pytest tests/test_score.py -v
```
**Dependencies:** T2.6
**Estimated time:** 15 min

---

## Phase 3: Contact Enrichment

### T3.1 — Exa Agent Enricher
**What:** Find email + LinkedIn for a lead using Exa API
**Input:** Author username + name
**Output:** Email + LinkedIn URL
**Agent instructions:**
```
Implement app/services/enricher.py (Exa part):

1. Get Exa API key from exa.ai (free $20 credits)

2. Create class ExaEnricher:
   - __init__: Exa client
   - enrich(self, username: str, real_name: str = None, source: str = None) -> EnrichmentResult:
     - Build search query: "find email and LinkedIn for {real_name or username}"
     - Call Exa Agent API with contact lookup
     - Parse response: email, linkedin_url, real_name, company_name
     - Calculate quality_score based on result quality
     - Return EnrichmentResult with quality_score (for picking BEST result)
     - Handle errors gracefully (return None on failure)

3. Add to .env: EXA_API_KEY=your_key

4. Test:
   - Enrich a known person → should find email + LinkedIn
   - Enrich unknown person → should return None (not crash)
```
**Dependencies:** T0.3
**Estimated time:** 25 min

---

### T3.2 — KeeLead Fallback Enricher
**What:** Fallback enrichment using open-source KeeLead
**Input:** Author username
**Output:** Email + profile info
**Agent instructions:**
```
Implement app/services/enricher.py (KeeLead fallback):

1. Install KeeLead: pip install keelead (or clone from GitHub)

2. Create class KeeLeadEnricher:
   - search(self, username: str) -> EnrichmentResult:
     - Search GitHub for username
     - Search Dev.to for username
     - Search StackOverflow for username
     - Extract email from public profiles
     - Calculate quality_score
     - Return EnrichmentResult

3. Create class EnrichmentManager:
   - __init__: ALL enrichment sources as list
   - enrich(self, signal) -> EnrichmentResult:
     - Run ALL sources in PARALLEL (not waterfall)
     - Collect all results
     - Pick BEST result by quality_score (not first found)
     - Verify the best result
     - Return verified result

KEY: Run ALL sources in parallel, pick BEST.
     NOT: try source 1 → found → return (might miss better result from source 2).

4. Test:
   - Try enriching a GitHub user → should find profile info
   - Verify: parallel execution, best result selected
```
**Dependencies:** T3.1
**Estimated time:** 25 min

---

### T3.3 — Email Verifier (SMTP + Catch-all)
**What:** Multi-layer email verification including SMTP mailbox check
**Input:** Email address
**Output:** Verification status + quality score
**Agent instructions:**
```
Implement app/services/verifier.py:

1. Create class ContactVerifier:
   - verify(self, result: EnrichmentResult) -> EnrichmentResult:
     
     # Layer 1: Format check
     if not valid_format(result.email):
       result.verification = "invalid_format"
       return result
     
     # Layer 2: Disposable domain check
     if domain in disposable_domains:
       result.verification = "disposable"
       return result
     
     # Layer 3: DNS MX check
     if not mx_exists(domain):
       result.verification = "no_mx_record"
       return result
     
     # Layer 4: SMTP mailbox verification (does email exist?)
     smtp_result = await smtp_verify(result.email)
     if smtp_result == "invalid":
       result.verification = "mailbox_not_found"
       return result
     
     # Layer 5: Catch-all detection
     is_catchall = await check_catchall(domain)
     
     # Calculate verification confidence
     if smtp_result == "valid" and not is_catchall:
       result.verification = "verified"
       result.verification_confidence = 95
     elif smtp_result == "valid" and is_catchall:
       result.verification = "catch_all"
       result.verification_confidence = 60
     
     return result

2. Create class EmailQualityScorer:
   - ROLE_PREFIXES = ["info", "sales", "support", "help", "admin", ...]
   - PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", ...]
   - score(self, email) -> EmailQuality:
     if role-based: grade="C", score=30
     if personal: grade="B", score=50
     if professional: grade="A", score=90

3. Add uv dependency: aiosmtplib, dnspython

4. Test:
   - Verify "test@gmail.com" → valid, A grade
   - Verify "fake@xyznonexistent123.com" → invalid
   - Verify "info@company.com" → verified, C grade (role-based)
   - Verify random@catch-all-domain.com → catch_all detection works
```
**Dependencies:** None (pure function)
**Estimated time:** 30 min

---

### T3.4 — Celery Worker: Enrichment
**What:** Background task that enriches hot/warm leads
**Input:** Product ID
**Output:** Enriched leads with contact info
**Agent instructions:**
```
Implement app/workers/enrich_leads.py:

1. Create task @celery_app.task def enrich_leads(product_id: str):
   - Fetch leads for this product where:
     - category IN ('hot', 'warm')
     - email IS NULL (not yet enriched)
     - created_at > (now - 7 days)
   - For each lead:
     a. Get signal (author_username, real_name, source)
     b. Run EnrichmentManager.enrich()
     c. If email found → run EmailVerifier.verify()
     d. Update lead with: email, linkedin_url, real_name, company_name
   - Log: "Enriched {total} leads, {found} with email"

2. Rate limit: max 10 enrichments per minute (Exa API limits)

3. Test:
   - Create 5 hot leads with no email
   - Run enrich_leads(product_id)
   - Check leads table has email/linkedin for some leads
```
**Dependencies:** T3.1, T3.2, T3.3
**Estimated time:** 20 min

---

### T3.5 — Integration Test: Enrichment
**What:** End-to-end test of enrichment pipeline
**Input:** Test leads with known authors
**Output:** Verified enriched leads
**Agent instructions:**
```
Write tests/test_enrich.py:

1. Create test leads with known Reddit/Twitter usernames
2. Run enrich_leads(product_id)
3. Assert:
   - At least some leads have email (not all will be found)
   - Emails pass verification
   - LinkedIn URLs are valid format
   - Leads that couldn't be enriched have NULL fields (not empty strings)

4. pytest tests/test_enrich.py -v
```
**Dependencies:** T3.4
**Estimated time:** 15 min

---

## Phase 4: Delivery

### T4.1 — Outreach Draft Generator
**What:** Generate personalized email/LinkedIn/Reddit drafts for each lead
**Input:** Lead + product info
**Output:** 3 draft messages
**Agent instructions:**
```
Implement app/services/drafter.py:

1. Create class OutreachDrafter:
   - generate(self, lead: dict, product: dict) -> dict:
     - Build context: lead's post text, product description, ICP
     
     - Email draft prompt:
       "Write a 3-sentence email to someone who posted: '{post_text}'
        Our product: {product.description}
        Sound human, not salesy. Reference their specific post.
        Include one soft CTA (demo, trial, quick chat)."
     
     - LinkedIn DM draft prompt:
       "Write a 2-sentence LinkedIn message to someone who posted: '{post_text}'
        Our product: {product.description}
        Short, friendly, reference their post."
     
     - Reddit reply draft prompt:
       "Write a helpful Reddit reply to: '{post_text}'
        Our product: {product.description}
        Answer their question genuinely. Mention product naturally, not pushy.
        Sound like a real community member."
     
     - Generate all 3 using GPT-4o-mini
     - Return {"email_draft": ..., "linkedin_dm_draft": ..., "reddit_reply_draft": ...}

2. Test:
   - Lead: "Anyone know a good invoicing tool?" + Product: "AI invoicing for freelancers"
   - Email draft should reference the post, mention InvoicePilot, have soft CTA
```
**Dependencies:** T0.3
**Estimated time:** 25 min

---

### T4.2 — Email Digest Template
**What:** Beautiful email template for weekly lead digest
**Input:** List of leads
**Output:** HTML email ready to send
**Agent instructions:**
```
Create app/templates/digest_email.html:

1. Design a clean, minimal email:
   - Header: "🔥 {count} people are looking for {product_name} this week"
   - Greeting: "Hey {first_name},"
   - Lead cards (sorted by score, highest first):
     - Score badge (🔥 hot / 🟡 warm)
     - Post text (truncated to 100 chars)
     - Source + time ago
     - "View lead →" button linking to dashboard
   - Footer: "View all leads on dashboard →" link
   - Unsubscribe link

2. Style: Dark background, clean typography, mobile-friendly
3. Use React Email or simple HTML template
4. Test: render template with sample data → looks good in email preview
```
**Dependencies:** None (template only)
**Estimated time:** 25 min

---

### T4.3 — Resend Email Sender
**What:** Send email digests using Resend API
**Input:** User email + lead data
**Output:** Email delivered
**Agent instructions:**
```
Implement app/services/emailer.py:

1. Get Resend API key from resend.com (free tier)

2. Create class EmailSender:
   - __init__: Resend client
   - send_digest(self, to_email: str, product_name: str, leads: list[dict]) -> bool:
     - Render digest_email.html with leads data
     - Send via Resend:
       resend.Emails.send({
         "from": "Czero <digest@yourdomain.com>",
         "to": to_email,
         "subject": f"🔥 {len(leads)} people are looking for {product_name} this week",
         "html": rendered_template
       })
     - Return True on success, False on failure

3. Add to .env: RESEND_API_KEY=your_key

4. Configure custom domain in Resend (for deliverability)

5. Test:
   - Send test email to your own address
   - Verify: email arrives, looks correct, links work
```
**Dependencies:** T4.2
**Estimated time:** 20 min

---

### T4.4 — Celery Worker: Digest Generation
**What:** Weekly task that generates and sends email digests
**Input:** All active users with products
**Output:** Emails sent
**Agent instructions:**
```
Implement app/workers/generate_digests.py:

1. Create task @celery_app.task def generate_weekly_digests():
   - Fetch all active products with is_active = true
   - For each product:
     a. Fetch leads from last 7 days where category IN ('hot', 'warm')
     b. If leads exist:
       - Fetch user email from auth
       - Render digest email
       - Send via EmailSender
       - Create digest record in digests table
     c. Log: "Sent digest to {email}: {count} leads"

2. Schedule: Run every Monday 9am UTC via Celery Beat:
   celery_app.conf.beat_schedule = {
       'weekly-digests': {
           'task': 'app.workers.generate_digests.generate_weekly_digests',
           'schedule': crontab(hour=9, minute=0, day_of_week=1),
       },
   }

3. Test:
   - Create test product with leads
   - Run generate_weekly_digests() manually
   - Check: email sent, digest record created
```
**Dependencies:** T4.1, T4.3
**Estimated time:** 20 min

---

### T4.5 — Dashboard: Settings Page
**What:** Product setup page (paste URL, configure monitoring)
**Input:** Authenticated user
**Output:** Working settings page
**Agent instructions:**
```
Create frontend app/dashboard/settings/page.tsx:

1. Form fields:
   - Product URL input + "Analyze" button
   - After analysis shows:
     - Product name (editable)
     - Description (editable)
     - Keywords (tag list, add/remove)
     - Subreddits (tag list, add/remove)
     - Competitor names (tag list, add/remove)
     - Pain points (list, add/remove)
   - Scan frequency dropdown (12h / 24h / 48h)
   - "Save & Start Monitoring" button

2. Flow:
   - User enters URL → clicks "Analyze"
   - Loading state: "Analyzing your product..."
   - API call: POST /api/products/analyze
   - Results fill form (all editable)
   - User tweaks keywords/subreddits
   - Clicks "Save" → POST /api/products
   - Success: "Monitoring started! First leads in 24 hours."

3. Use shadcn/ui components (Input, Button, Badge, Card)

4. Style: Dark theme, clean, spacious

5. Test: Navigate to /dashboard/settings → form appears → can submit URL → form fills
```
**Dependencies:** T0.1, T1.1
**Estimated time:** 40 min

---

### T4.6 — Dashboard: Leads List Page
**What:** Main screen showing all leads sorted by score
**Input:** Authenticated user with product
**Output:** Working leads list
**Agent instructions:**
```
Create frontend app/dashboard/page.tsx:

1. Page layout:
   - Header: "This week: {count} leads ({hot}🔥 {warm}🟡)"
   - Filter bar: All / Hot / Warm / Cold
   - Lead cards (sorted by score, highest first):

2. Lead card:
   ┌──────────────────────────────────────────┐
   │ 🔥 92%  "Anyone know a good AI          │
   │           invoicing tool?"                │
   │           r/freelance · 4h ago            │
   │           [View →]                       │
   └──────────────────────────────────────────┘

3. Click "View →" → navigates to /dashboard/leads/{leadId}

4. Empty state:
   - "No leads yet. We're scanning the web for people who need your product."
   - "First leads appear within 24 hours."

5. API calls:
   - GET /api/leads?product_id={id}&category={filter}
   - Returns paginated leads

6. Test: Navigate to /dashboard → leads appear (or empty state)
```
**Dependencies:** T0.1, T0.5
**Estimated time:** 40 min

---

### T4.7 — Dashboard: Lead Detail Page
**What:** Full lead view with contact info, drafts, and feedback
**Input:** Lead ID
**Output:** Working detail page
**Agent instructions:**
```
Create frontend app/dashboard/leads/[leadId]/page.tsx:

1. Layout:
   - Back button "← Back to Leads"
   - Score badge: "🔥 92% confidence"
   - Post text + source + time
   - "View original post" link

2. "WHY THIS LEAD" section:
   - Bulleted list from reasoning field
   - Example:
     ✓ Directly asking for your type of product
     ✓ Freelancer — matches your ICP
     ✓ Posted 4 hours ago — very fresh

3. "CONTACT INFO" section:
   - Reddit: u/username
   - Email: email@example.com
   - LinkedIn: linkedin.com/in/username
   - (Show "Not found" if unavailable)

4. "READY TO SEND" section:
   - Tab: Email / LinkedIn DM / Reddit Reply
   - Each tab shows the draft in a code block
   - "Copy" button for each

5. Feedback section:
   - "Was this lead useful?"
   - 👍 Yes  👎 No
   - POST /api/leads/{id}/feedback

6. Test: Click a lead → all sections populate → copy button works
```
**Dependencies:** T0.1, T4.6
**Estimated time:** 40 min

---

### T4.8 — Dashboard: Auth (Login/Signup)
**What:** Authentication pages with Supabase Auth
**Input:** Supabase project
**Output:** Working login/signup/logout
**Agent instructions:**
```
Create auth pages:

1. frontend/app/auth/login/page.tsx:
   - Email + password form
   - "Continue with Google" button
   - "Don't have account? Sign up" link
   - On success: redirect to /dashboard

2. frontend/app/auth/signup/page.tsx:
   - Email + password form
   - "Continue with Google" button
   - "Already have account? Log in" link
   - On success: redirect to /dashboard/settings (first time)

3. frontend/lib/supabase.ts:
   - Create Supabase client
   - Helper: getCurrentUser()
   - Helper: signOut()

4. frontend/middleware.ts:
   - Protect /dashboard/* routes
   - Redirect to /auth/login if not authenticated

5. Test:
   - Sign up with email → redirects to settings
   - Log out → redirects to login
   - Try accessing /dashboard without login → redirects to login
```
**Dependencies:** T0.1, T0.2
**Estimated time:** 30 min

---

### T4.9 — Integration Test: Full Flow
**What:** End-to-end test of the complete user flow
**Input:** Running frontend + backend + database
**Output:** Verified complete flow
**Agent instructions:**
```
Manual E2E test:

1. Sign up as new user
2. Navigate to Settings
3. Enter URL "https://linear.app"
4. Click "Analyze" → verify product info appears
5. Click "Save & Start Monitoring"
6. Trigger signal collection manually (or wait)
7. Check signals table has entries
8. Trigger scoring manually (or wait)
9. Check leads table has entries
10. Navigate to /dashboard → leads appear
11. Click a lead → detail page shows
12. Copy a draft → verify it's personalized
13. Click 👍 → feedback saved

Document any bugs found.
```
**Dependencies:** All T4.x
**Estimated time:** 30 min

---

## Phase 5: Payments + Landing

### T5.1 — Landing Page
**What:** Public marketing page for non-logged-in visitors
**Input:** None
**Output:** Beautiful landing page
**Agent instructions:**
```
Create frontend app/page.tsx:

1. Sections:
   - Hero: "Find the people already looking for your product."
     + URL input + "Get Started Free" button
   - How it works (3 steps with icons):
     1. Paste your URL → AI analyzes your product
     2. We monitor Reddit, Twitter, LinkedIn, HN 24/7
     3. Get leads + contact info + ready-to-send messages
   - Pricing (3 cards):
     - Free: 3 leads/week, no contact info
     - Starter $29/mo: 10 leads/week + contact info + drafts
     - Pro $79/mo: 25 leads/week + daily alerts + priority
   - FAQ (5 questions)
   - Footer: "Built for the 86% of founders stuck at $0"

2. Style: Dark theme, premium feel, mobile responsive
3. CTA buttons → /auth/signup

4. Test: Visit / → page loads → looks good on mobile → buttons work
```
**Dependencies:** T0.1
**Estimated time:** 45 min

---

### T5.2 — Stripe Integration
**What:** Payment processing for Starter and Pro plans
**Input:** Stripe account
**Output:** Working checkout + subscription management
**Agent instructions:**
```
1. Create Stripe account → get API keys

2. Create products in Stripe:
   - Czero Starter: $29/month
   - Czero Pro: $79/month

3. Backend: app/routes/billing.py:
   - POST /api/billing/checkout → creates Stripe Checkout session
   - POST /api/billing/webhook → handles payment events
   - GET /api/billing/subscription → returns user's plan

4. Stripe webhook events to handle:
   - checkout.session.completed → activate subscription
   - customer.subscription.updated → update plan
   - customer.subscription.deleted → downgrade to free

5. Store in Supabase: add "plan" column to users or separate subscriptions table

6. Frontend: Add "Upgrade" button on dashboard → calls /api/billing/checkout

7. Test:
   - Click "Upgrade" → Stripe Checkout opens
   - Complete payment → dashboard shows "Starter" plan
   - Check Supabase: user has plan = "starter"
```
**Dependencies:** T4.8
**Estimated time:** 40 min

---

### T5.3 — Usage Limits
**What:** Enforce plan-based limits (leads/week, features)
**Input:** User's plan
**Output:** Limits enforced in API + workers
**Agent instructions:**
```
Implement app/services/limits.py:

1. Create PLAN_LIMITS dict:
   PLAN_LIMITS = {
     "free": {"leads_per_week": 3, "show_contact": False, "show_drafts": False},
     "starter": {"leads_per_week": 10, "show_contact": True, "show_drafts": True},
     "pro": {"leads_per_week": 25, "show_contact": True, "show_drafts": True, "daily_alerts": True},
   }

2. Create class UsageLimiter:
   - check_limit(self, user_id: str, plan: str) -> dict:
     - Count leads delivered this week
     - Compare to plan limit
     - Return {"within_limit": bool, "used": N, "limit": N}
   
   - filter_leads(self, leads: list[dict], plan: str) -> list[dict]:
     - If free plan: remove email, linkedin, drafts from leads
     - If within limit: return all leads
     - If over limit: return only first N leads

3. Add to GET /api/leads endpoint: filter by plan limits

4. Test:
   - Free user sees 3 leads, no contact info
   - Starter user sees 10 leads with contact info
   - Pro user sees 25 leads with daily alerts
```
**Dependencies:** T5.2
**Estimated time:** 25 min

---

### T5.4 — Onboarding Flow
**What:** Guide new users through first-time setup
**Input:** Newly signed up user
**Output:** Guided setup experience
**Agent instructions:**
```
Create onboarding flow:

1. After first signup → redirect to /dashboard/settings
2. Show onboarding tooltips:
   - Step 1: "Paste your product URL" (highlight URL input)
   - Step 2: "Click Analyze" (highlight button)
   - Step 3: "Review and edit keywords" (highlight keyword section)
   - Step 4: "Click Save & Start Monitoring" (highlight save button)
3. After save → show success message: "You're all set! First leads arrive in 24 hours."
4. Don't show tooltips again (store in localStorage)

5. Use shadcn/ui Tooltip or custom overlay component

6. Test: New user sees tooltips → completes setup → tooltips don't appear again
```
**Dependencies:** T4.5
**Estimated time:** 20 min

---

### T5.5 — Free Tier Teaser
**What:** Show leads without contact info to encourage upgrade
**Input:** Free tier user
**Output:** Leads visible but blurred/locked
**Agent instructions:**
```
Update frontend app/dashboard/leads/[leadId]/page.tsx:

1. If user is on free plan:
   - Show lead score + post text + reasoning (all visible)
   - Blur/lock contact info section:
     "🔒 Upgrade to Starter ($29/mo) to see contact info and outreach drafts"
   - Show "Upgrade" button

2. If user is on paid plan:
   - Show everything normally

3. On leads list page:
   - Free users see all leads (score + post preview)
   - But contact info only on detail page (locked)

4. Test:
   - Log in as free user → see leads → contact section locked
   - Upgrade → contact section unlocks
```
**Dependencies:** T4.7, T5.2
**Estimated time:** 15 min

---

### T5.6 — Integration Test: Payments
**What:** End-to-end test of payment flow
**Input:** Stripe test mode
**Output:** Verified payment flow
**Agent instructions:**
```
Manual test with Stripe test cards:

1. Sign up as new user (free plan)
2. Verify: can see 3 leads, contact info locked
3. Click "Upgrade to Starter"
4. Stripe Checkout opens (test mode)
5. Use test card: 4242 4242 4242 4242
6. Complete payment
7. Verify: redirected to dashboard, plan shows "Starter"
8. Verify: can see 10 leads, contact info visible
9. Verify: Supabase shows plan = "starter"

10. Test cancellation:
    - Go to billing portal (or use Stripe dashboard)
    - Cancel subscription
    - Verify: plan reverts to "free"
    - Verify: contact info locked again
```
**Dependencies:** T5.2, T5.3
**Estimated time:** 20 min

---

## Phase 6: Polish + Beta

### T6.1 — Loading States
**What:** Add loading spinners/skeletons for all async operations
**Input:** All pages
**Output:** No blank pages during loading
**Agent instructions:**
```
Add loading states to all pages:

1. Settings page: "Analyzing your product..." spinner during URL analysis
2. Leads list: Skeleton cards while fetching leads
3. Lead detail: Skeleton while fetching lead data
4. Email digest: N/A (pre-rendered)
5. Dashboard: Skeleton on initial load

Use shadcn/ui Skeleton component.
Test: Every page shows loading state, not blank.
```
**Dependencies:** All Phase 4 tasks
**Estimated time:** 20 min

---

### T6.2 — Error Handling
**What:** User-friendly error messages for all failure cases
**Input:** All API calls + frontend
**Output:** No raw error messages shown to users
**Agent instructions:**
```
Add error handling:

1. Backend: All endpoints return structured errors:
   {"error": "message", "code": "ERROR_CODE"}

2. Frontend: Catch errors and show toast notifications:
   - "Failed to analyze URL. Please check the URL and try again."
   - "Failed to load leads. Please refresh the page."
   - "Payment failed. Please try again."

3. Use shadcn/ui Toast component

4. Test: Disconnect network → error toast appears (not blank page)
```
**Dependencies:** All Phase 4 tasks
**Estimated time:** 20 min

---

### T6.3 — Empty States
**What:** Helpful messages when there's no data yet
**Input:** All pages with data
**Output:** Informative empty states
**Agent instructions:**
```
Add empty states:

1. No product configured:
   "👋 Welcome! Paste your product URL to get started."

2. Product configured, no leads yet:
   "🔍 We're scanning the web for people who need your product.
    First leads appear within 24 hours."

3. No hot leads this week:
   "🟡 No hot leads this week. We'll keep monitoring.
    Try adding more keywords in Settings."

4. No contact info found:
   "📧 We couldn't find contact info for this lead.
    Try reaching out on the platform directly."

5. Use illustrations/icons + clear copy

6. Test: Every page has meaningful empty state
```
**Dependencies:** All Phase 4 tasks
**Estimated time:** 15 min

---

### T6.4 — Mobile Responsiveness
**What:** Ensure all pages work on mobile
**Input:** All pages
**Output:** Mobile-friendly UI
**Agent instructions:**
```
Test and fix mobile layout:

1. Leads list: Cards stack vertically on mobile
2. Lead detail: Full-width layout, readable text
3. Settings form: Full-width inputs on mobile
4. Landing page: Hero text scales down, buttons full-width
5. Navigation: Hamburger menu on mobile

Test on: iPhone SE, iPhone 14, Android Chrome
Fix any overflow, tiny text, or tappable areas too small.
```
**Dependencies:** All Phase 4 tasks
**Estimated time:** 25 min

---

### T6.5 — Dark Mode Polish
**What:** Ensure dark mode is consistent across all components
**Input:** All pages
**Output:** Polished dark theme
**Agent instructions:**
```
Audit dark mode:

1. Check all shadcn/ui components render correctly in dark mode
2. Check custom components (lead cards, score badges)
3. Check email template in dark mode email clients
4. Ensure text contrast meets WCAG AA (4.5:1 ratio)
5. Add light mode toggle (optional, dark is default)

Test: Every page in dark mode → no white backgrounds, no unreadable text.
```
**Dependencies:** All Phase 4 tasks
**Estimated time:** 15 min

---

### T6.6 — Performance Optimization
**What:** Optimize loading speed and API response times
**Input:** All pages + API
**Output:** Fast, responsive app
**Agent instructions:**
```
Performance improvements:

1. Frontend:
   - Lazy load lead list (pagination or infinite scroll)
   - Optimize images (next/image)
   - Enable Next.js ISR for landing page

2. Backend:
   - Add database indexes (already in schema)
   - Cache product analysis results (don't re-analyze same URL)
   - Batch LLM scoring (send 5 posts per API call instead of 1)
   - Add Redis caching for frequently accessed data

3. Workers:
   - Process signals in batches (not one-by-one)
   - Rate limit external API calls

4. Test: Lighthouse score > 90 for landing page
```
**Dependencies:** All Phase 4 tasks
**Estimated time:** 30 min

---

### T6.7 — Beta User Recruitment
**What:** Find 30 beta users for testing
**Input:** Working product
**Output:** 30 active beta users
**Agent instructions:**
```
Recruitment channels:

1. Reddit posts:
   - r/SaaS: "I built a tool that finds your first customers on Reddit"
   - r/indiehackers: "Looking for beta testers — AI lead gen for SaaS"
   - r/startups: "Free tool for founders stuck at $0 revenue"
   
2. Twitter/X:
   - Post in #buildinpublic
   - DM founders who just launched products

3. Discord:
   - AI/startup Discords
   - Indie hacker communities

4. Goal: 30 users with live products, pre-revenue or < $1k MRR
5. Offer: Free for 30 days in exchange for weekly feedback

6. Track: Signups, active users, feedback quality
```
**Dependencies:** T6.1-T6.6
**Estimated time:** Ongoing (parallel with development)

---

### T6.8 — Feedback Collection
**What:** Systematic feedback from beta users
**Input:** Active beta users
**Output:** Feedback data + product improvements
**Agent instructions:**
```
Feedback system:

1. In-app feedback:
   - 👍/👎 on every lead (already built in T4.7)
   - "Feedback" button in settings → opens typeform/google form

2. Weekly survey (Google Forms):
   - "How many useful leads did you get this week?"
   - "What would make Czero more valuable?"
   - "Would you pay $29/mo for this?"

3. 1-on-1 calls:
   - Schedule 5 calls with most active users
   - Ask: "Walk me through how you used Czero this week"
   - Record insights

4. Metrics to track:
   - Lead usefulness rate (% of 👍)
   - User retention (weekly active users)
   - Feature requests (categorize)
   - Churn reasons

5. Iterate: Fix top 3 issues from feedback before public launch
```
**Dependencies:** T6.7
**Estimated time:** Ongoing

---

## Quick Reference: Task Dependencies

```
T0.1 ──┐
T0.2 ──┤
T0.3 ──┼── T0.7 ── T0.6
T0.4 ──┤
T0.5 ──┘
         │
         ▼
T1.1 ── T1.2 ── T1.4 ── T1.5 ── T1.6
T1.3 ──┘
         │
         ▼
T2.1 ──┐
T2.2 ──┤
T2.3 ──┼── T2.6 ── T2.7
T2.4 ──┤
T2.5 ──┘
         │
         ▼
T3.1 ── T3.2 ── T3.4 ── T3.5
T3.3 ──┘
         │
         ▼
T4.1 ── T4.4
T4.2 ── T4.3 ──┘
T4.5 ──┐
T4.6 ──┤── T4.9
T4.7 ──┤
T4.8 ──┘
         │
         ▼
T5.1 ──┐
T5.2 ──┼── T5.6
T5.3 ──┤
T5.4 ──┤
T5.5 ──┘
         │
         ▼
T6.1-T6.6 (polish) ── T6.7 (beta) ── T6.8 (feedback)
```

---

*Each task is independent enough to delegate to an agent. Give the agent the task description + relevant context files. They should produce a working artifact.*
