# CZERO — Project Context for Handoff

**Project:** Czero — Intent-Based Lead Gen SaaS  
**Hook:** "Get your first 10 users by Sunday"  
**Stack:** Next.js 15 + FastAPI + MiMo (mimo-v2.5) + Supabase + Railway  
**Repo:** `C:\Users\satya\Czero`  
**Admin:** admin@czero.ai / CzeroAdmin123!  
**Status:** MVP pipeline working, iterating on signal quality

---

## 1. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        CZERO ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND (Next.js 15)          BACKEND (FastAPI)               │
│  ───────────────────────        ─────────────────               │
│  • Dashboard (leads table)    • /api/products/full-pipeline     │
│  • Settings (keywords, comps) • /api/products/collect           │
│  • Landing page               • /api/products/score             │
│  • Auth (Supabase/Clerk)      • /api/products/leads             │
│                                                                  │
│  COLLECTOR ENGINE (9 sources)                                    │
│  ───────────────────────────                                     │
│  ✅ Reddit RSS          (real-time, 0-48h)                       │
│  ✅ Hacker News         (real-time, 0-24h)                       │
│  ✅ Lobste.rs           (real-time, 0-24h)                       │
│  ✅ Dev.to              (recent, 0-7d)                           │
│  ✅ Exa Web             (24h filter, NOISE FILTER)               │
│  ✅ Exa Reddit          (24h filter, NOISE FILTER)               │
│  ✅ Exa Twitter         (24h filter, NOISE FILTER)               │
│  ✅ Exa LinkedIn        (24h filter, NOISE FILTER)               │
│  ✅ Exa Quora           (24h filter, NOISE FILTER)               │
│  ❌ IndieHackers        (API requires auth, disabled)            │
│  📋 Apify Twitter       (roadmap)                                │
│  📋 Apify LinkedIn      (roadmap)                                │
│                                                                  │
│  SCORING ENGINE (MiMo batch)                                     │
│  ─────────────────────────                                       │
│  1. Pre-filter: removes promotional/builder content             │
│  2. LLM batch scoring: 50 signals/call, distinguishes buyers    │
│  3. Returns: hot (80+), warm (60-79), cold (<60 filtered)       │
│                                                                  │
│  STORAGE: Supabase (PostgreSQL)                                  │
│  ─────────────────────────────────                               │
│  • products, signals, leads, users                               │
│  • Row Level Security enabled                                    │
│                                                                  │
│  DEPLOY: Railway (backend) + Vercel (frontend)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. WHAT'S BUILT (COMPLETE)

| Component | Status | Details |
|-----------|--------|---------|
| **Collector Engine** | ✅ Done | 9 sources, parallel collection, 24h freshness filter on all Exa |
| **Scoring Engine** | ✅ Done | MiMo batch (50/call), pre-filter, buyer vs builder distinction |
| **Full Pipeline API** | ✅ Done | `/api/products/full-pipeline` - collect → score → return leads |
| **Frontend Dashboard** | ✅ Done | Leads table, stats cards, hot/warm/cold tabs |
| **Settings Page** | ✅ Done | URL, keywords, competitors input → triggers pipeline |
| **Auth** | ✅ Done | Supabase email/password, protected routes |
| **Landing Page** | ✅ Done | "Get first 10 users by Sunday" hook |
| **Billing** | 📋 Demo | Stripe/Paddle integration scaffolded |
| **Railway Deploy** | ✅ Done | Backend deployed, env vars configured |

---

## 3. CURRENT CHALLENGES (BLOCKERS)

### 🔴 CHALLENGE 1: Signal Quality — **HIGHEST PRIORITY**

**Problem:** Exa sources return massive noise despite 24h filter

```
CURRENT EXA RESULTS (sample):
├── ❌ "Synonyms of spring - Merriam-Webster" (dictionary)
├── ❌ "Pounce® 384EC insecticide" (pesticide, not SaaS)
├── ❌ "Manchester United begin talks" (football)
├── ❌ "10 Best Lead Gen Tools 2024" (article, not buyer)
├── ❌ "Lead Generation Best Practices" (guide, not buyer)
├── ❌ "Download Pounce app" (wrong product)
└── ✅ "Anyone know good lead gen tool?" (BUYER - rare)

NOISE RATE: ~85% of Exa results are irrelevant
```

**Root Cause:** 
- Generic keywords like "lead generation" match everything
- Exa searches web broadly, not focused communities
- No buyer-intent filtering at collection time

**Attempted Fixes:**
- ✅ 24h freshness filter (PHASE-6) — helps but not enough
- 📋 PHASE-7: Buyer-intent keyword generator + noise filter (ready to implement)
- 📋 Need: Community-focused collection (Reddit/HN weight > web)

---

### 🟡 CHALLENGE 2: Keyword Strategy — User Input Quality

**Problem:** Users enter generic keywords → get generic results

```
USER ENTERS:           "lead generation, SaaS leads, B2B"
BETTER WOULD BE:       "looking for alternative to Pounce, 
                        anyone know good lead gen tool, 
                        frustrated with current lead gen"
```

**Solution Ready (PHASE-7):**
- Keyword generator service from product URL + competitors
- Suggested keyword buttons in Settings UI
- Buyer-intent templates: "alternative to X", "looking for Y", "frustrated with Z"

---

### 🟡 CHALLENGE 3: Source Weighting

**Current:** All sources equal weight
**Reality:**
```
QUALITY TIER 1 (high buyer intent):  Reddit, HN, Lobste.rs
QUALITY TIER 2 (medium):             Dev.to, Twitter
QUALITY TIER 3 (low, noisy):         Exa Web, Exa LinkedIn, Exa Quora
```

**Need:** Weight Tier 1 higher, reduce Tier 3 volume, or add better filters

---

### 🟢 CHALLENGE 4: Scoring Edge Cases

**MiMo sometimes misclassifies:**
- "Building a lead gen tool" → scored as buyer (builder, not buyer)
- "Lead gen agency offering services" → scored as buyer (promoter)
- "Just launched my lead gen SaaS" → scored as buyer (promoter)

**Pre-filter catches ~70%, but LLM still gets confused on edge cases**

---

## 4. DATA FLOW (CRITICAL PATH)

```
User enters product URL + keywords + competitors
         │
         ▼
┌──────────────────────────────────────────┐
│  POST /api/products/full-pipeline        │
│  (api/app/api/products/full_pipeline.py) │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  COLLECTOR ENGINE                        │
│  (api/app/engines/collector/engine.py)   │
│  • Runs all 9 sources in parallel        │
│  • Each source: async collect()          │
│  • Returns Signal[]                      │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  SCORING ENGINE                          │
│  (api/app/engines/scoring/engine.py)     │
│  1. Pre-filter (removes promo/builder)   │
│  2. Batch score with MiMo (50/batch)     │
│  3. Returns Lead[] with score + reason   │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  STORE + RETURN                          │
│  • Save to Supabase (signals + leads)    │
│  • Return {leads, stats, signals_count}  │
└──────────────────────────────────────────┘
         │
         ▼
Frontend Dashboard: Hot / Warm / Cold tabs + Stats
```

---

## 5. KEY FILES TO KNOW

### Backend (FastAPI)
```
api/
├── app/
│   ├── api/products/full_pipeline.py    # MAIN ENTRYPOINT
│   ├── engines/
│   │   ├── collector/
│   │   │   ├── engine.py                # Orchestrates 9 sources
│   │   │   ├── sources/
│   │   │   │   ├── exa.py               # Exa Web (has 24h + noise filter)
│   │   │   │   ├── exa_reddit.py        # Exa Reddit (24h filter)
│   │   │   │   ├── exa_twitter.py       # Exa Twitter (24h filter)
│   │   │   │   ├── exa_linkedin.py      # Exa LinkedIn (24h filter)
│   │   │   │   ├── exa_quora.py         # Exa Quora (24h filter)
│   │   │   │   ├── reddit_rss.py        # Reddit RSS (real-time)
│   │   │   │   ├── hackernews.py        # HN Algolia (real-time)
│   │   │   │   ├── lobsters.py          # Lobste.rs (real-time)
│   │   │   │   └── devto.py             # Dev.to (recent)
│   │   └── scoring/
│   │       ├── engine.py                # Batch scoring orchestrator
│   │       └── mimo_client.py           # MiMo API client
│   ├── services/
│   │   └── keyword_generator.py         # 📋 TO CREATE (PHASE-7)
│   └── models/
│       └── signal.py, lead.py
├── venv/                                # Python venv
└── requirements.txt
```

### Frontend (Next.js 15)
```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                 # Leads table + stats
│   │   │   └── settings/
│   │   │       └── page.tsx             # Settings with keyword suggestions
│   │   ├── login/page.tsx
│   │   └── page.tsx                     # Landing page
│   ├── lib/
│   │   └── supabase.ts                  # Supabase client
│   └── components/
└── package.json
```

---

## 6. ENVIRONMENT VARIABLES (RAILWAY)

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MIMO_API_KEY=sk-...                      # Command Code / MiMo
EXA_API_KEY=xxx                          # Exa.ai
FRONTEND_URL=https://czero.vercel.app

# Optional
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 7. TEST COMMANDS

```bash
# Backend - Run locally
cd C:/Users/satya/Czero/api
PYTHONPATH=. venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# Test full pipeline
curl -X POST http://localhost:8000/api/products/full-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://pounce.so",
    "name": "Pounce",
    "description": "AI lead gen for SaaS",
    "keywords": ["looking for alternative to Pounce", "anyone know good lead gen tool"],
    "competitor_names": ["ReplyGain", "HuntIQ"],
    "subreddit_list": ["SaaS", "startups"],
    "icp": {}
  }'

# Test freshness (run in api dir)
PYTHONPATH=. venv/Scripts/python.exe -c "
import asyncio
from app.engines.collector.engine import CollectorEngine
engine = CollectorEngine()
signals = asyncio.run(engine.collect({'keywords': ['lead gen'], 'competitor_names': ['Pounce']}))
for s in signals:
    print(f'{s.source} | {s.text[:80]}')
"

# Frontend
cd C:/Users/satya/Czero/frontend
npm run dev
```

---

## 8. WHAT'S NEXT (PRIORITY ORDER)

| Phase | Task | File | Effort |
|-------|------|------|--------|
| **7** | Buyer-intent keyword generator + noise filter | `build-prompts/PHASE-7-KEYWORDS.md` | 2-3 hrs |
| **8** | Source weighting (Tier 1 > Tier 3) | collector/engine.py | 1-2 hrs |
| **9** | Apify Twitter/LinkedIn collectors | new sources | 3-4 hrs |
| **10** | Competitor monitoring dashboard | new API + UI | 2-3 hrs |
| **11** | Email notifications for hot leads | cron + SendGrid | 1-2 hrs |

---

## 9. COMPETITOR LANDSCAPE (FOR TESTING)

**Test against these — NOT your own product:**
| Competitor | URL | What They Do |
|------------|-----|--------------|
| **Pounce** | pounce.so | AI lead gen, our primary benchmark |
| **ReplyGain** | replygain.com | Cold email + lead gen |
| **HuntIQ** | huntiq.com | Lead discovery |
| **Clay** | clay.com | Data enrichment + outreach |
| **Apollo** | apollo.io | Sales intelligence |
| **Instantly** | instantly.ai | Cold email automation |

**Key Insight:** When testing, use Pounce.so as the "product" and search for people complaining about it or looking for alternatives. That's where real buyers are.

---

## 10. GOTCHAS / LESSONS LEARNED

1. **Don't test with your own product** — no one is talking about it yet. Test with competitors.
2. **Exa is noisy** — web search returns everything. Reddit/HN are 10x better signal.
3. **MiMo batch scoring** — 50 signals/call is 5x faster than single. But prompt must be precise.
4. **24h filter is critical** — signals older than 24h have near-zero conversion.
5. **Pre-filter before LLM** — saves tokens and improves accuracy (removes obvious promo/builder).
6. **Railway deployment** — use `host: 0.0.0.0`, `port: os.environ.get('PORT')`, Linux paths.
7. **Supabase RLS** — enable Row Level Security, policies must match user_id.
8. **Keyword quality = lead quality** — generic keywords = generic noise. Buyer-intent keywords = buyers.

---

## 11. QUICK START FOR NEW AGENT

```bash
# 1. Clone & setup
cd C:/Users/satya/Czero
# Backend
cd api && python -m venv venv && venv/Scripts/activate && pip install -r requirements.txt
# Frontend  
cd ../frontend && npm install

# 2. Set env vars (copy .env.example to .env)
# 3. Run backend: PYTHONPATH=. venv/Scripts/python.exe -m uvicorn app.main:app --reload
# 4. Run frontend: npm run dev
# 5. Test pipeline with Pounce.so + competitor keywords
```

---

## 12. CONTACT / CONTEXT

- **User:** India-based indie hacker, uses Command Code for coding
- **Budget-conscious:** Prefers free/open-source, MiMo for cost savings
- **Style:** Ship fast, iterate with data, honest assessment over politeness
- **Current focus:** Signal quality → then scale sources → then monetization

---

**END OF CONTEXT** — This captures everything needed to continue development on Czero.