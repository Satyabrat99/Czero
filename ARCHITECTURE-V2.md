# Czero — Updated Architecture (v2)

> Restructured to focus on accessible platforms. Ready for Apify/official APIs when funded.

---

## Target User

**Solo SaaS builders / Vibe coders** who build apps and need their first users.

---

## The Hook

```
"Get your first 10 users by Sunday"

We monitor IndieHackers, HN, GitHub, Reddit, Twitter, 
ProductHunt, and Quora for people asking for tools like yours.

You reply. They sign up. You grow.
```

---

## Source Architecture (Pluggable)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOURCE MANAGER (Pluggable)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIER 1: FREE APIs (no cost, reliable)                          │
│  ├── HN (Algolia API)                                           │
│  ├── IndieHackers (Public API)                                  │
│  ├── Lobste.rs (Public API)                                     │
│  ├── Dev.to (Public API)                                        │
│  └── GitHub Issues (Public API)                                 │
│                                                                  │
│  TIER 2: EXA SEMANTIC (finds content from restricted platforms) │
│  ├── Reddit posts (via Exa)                                     │
│  ├── Twitter posts (via Exa)                                    │
│  ├── ProductHunt discussions (via Exa)                          │
│  └── Quora answers (via Exa)                                    │
│                                                                  │
│  TIER 3: FUTURE (when funded)                                   │
│  ├── Reddit (Apify scraper or official API)                     │
│  ├── Twitter (Apify scraper or official API)                    │
│  └── LinkedIn (Apify scraper or official API)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure (Updated)

```
api/app/engines/collector/sources/
├── base.py              # Abstract base class
├── hn.py                # HN via Algolia ✅
├── indiehackers.py      # IndieHackers via API 🆕
├── lobsters.py          # Lobste.rs via API 🆕
├── devto.py             # Dev.to via API 🆕
├── github.py            # GitHub Issues via API ✅
├── exa_reddit.py        # Reddit via Exa semantic 🆕
├── exa_twitter.py       # Twitter via Exa semantic 🆕
├── exa_producthunt.py   # ProductHunt via Exa semantic 🆕
├── exa_quora.py         # Quora via Exa semantic 🆕
│
├── [FUTURE] reddit_apify.py    # Reddit via Apify (when funded)
├── [FUTURE] twitter_apify.py   # Twitter via Apify (when funded)
├── [FUTURE] linkedin_apify.py  # LinkedIn via Apify (when funded)
```

---

## How Apify Integration Will Work (Future)

```python
# When we have funds, just add new source files:

# api/app/engines/collector/sources/reddit_apify.py
class RedditApifyCollector(BaseSourceManager):
    """Reddit via Apify (paid, reliable)."""
    
    async def collect(self, product: dict) -> list[Signal]:
        # Call Apify API
        # Return signals in same format
        pass

# Then register in orchestrator:
# sources = [
#     RedditApifyCollector(),  # Use this when funded
#     # RedditExaCollector(),  # Fallback (free)
# ]
```

**No code changes needed.** Just add new source files and register them.

---

## The Flow

```
USER PASTES URL
      │
      ▼
┌─────────────────────────────────────────┐
│ PRODUCT ANALYSIS                         │
│ Extract ICP, keywords, pain points      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ COLLECTION (9 sources)                   │
│                                         │
│ TIER 1 (Free APIs):                     │
│ ├── HN ─────────┐                      │
│ ├── IndieHackers ┤                      │
│ ├── Lobste.rs ───┼──→ MERGE + DEDUP    │
│ ├── Dev.to ──────┤                      │
│ └── GitHub ──────┘                      │
│                                         │
│ TIER 2 (Exa Semantic):                  │
│ ├── Reddit ─────┐                      │
│ ├── Twitter ────┤                      │
│ ├── ProductHunt ┼──→ MERGE + DEDUP     │
│ └── Quora ──────┘                      │
│                                         │
│ [FUTURE] TIER 3 (Apify/Official):       │
│ ├── Reddit Apify (when funded)          │
│ ├── Twitter Apify (when funded)         │
│ └── LinkedIn Apify (when funded)        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ SCORING (MiMo)                          │
│ 1. Soft pre-filter                      │
│ 2. Batch LLM scoring (5 per call)       │
│ 3. Category: hot/warm/cold              │
│ 4. Filter cold leads                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ENRICHMENT                               │
│ GitHub lookup + email verification      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ OUTREACH DRAFTS                          │
│ ├── Reply draft (for the platform)      │
│ ├── Email draft (if email found)        │
│ └── LinkedIn DM draft (if LinkedIn)     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ DELIVERY                                 │
│ ├── Weekly email digest                 │
│ ├── Dashboard (3 screens)               │
│ └── Slack/Discord alerts (future)       │
└─────────────────────────────────────────┘
```

---

## Landing Page Copy

```
HEADLINE: Get your first 10 users by Sunday

SUBHEAD: Paste your URL. We find people asking for tools like yours on 
         IndieHackers, HN, GitHub, Reddit, Twitter, and ProductHunt. 
         You reply. They sign up.

HOW IT WORKS:
1. Paste your product URL
2. We scan 9 platforms for people asking
3. We score leads for buying intent
4. You reply to the hottest ones
5. They sign up. You grow.

WHAT WE MONITOR:
├── IndieHackers (founders asking for tools)
├── Hacker News (Ask HN, Show HN)
├── GitHub Issues (developers asking for tools)
├── Reddit (via semantic search)
├── Twitter (via semantic search)
├── ProductHunt (discussions asking for alternatives)
├── Quora (people asking for recommendations)
├── Dev.to (developers discussing tools)
└── Lobste.rs (tech community discussions)

PRICING:
├── Free: 5 leads/week
├── Pro: $19/mo (25 leads/week)
├── Team: $49/mo (unlimited leads)
└── 30-day money-back guarantee

CTA: Start Finding Users Free →
```

---

## Pricing (Revised)

| Plan | Price | Leads/Week | Platforms |
|------|-------|------------|-----------|
| **Free** | $0 | 5 | All 9 |
| **Pro** | $19/mo | 25 | All 9 + Email drafts |
| **Team** | $49/mo | Unlimited | All 9 + API access + Slack alerts |

---

## What Changes From Current Build

| Current | Updated |
|---------|---------|
| 2 sources (HN + Exa) | 9 sources (5 APIs + 4 Exa) |
| No IndieHackers | ✅ IndieHackers |
| No Lobste.rs | ✅ Lobste.rs |
| No Dev.to collector | ✅ Dev.to |
| Reddit only via Exa | Reddit via Exa + future Apify |
| Twitter only via Exa | Twitter via Exa + future Apify |
| No ProductHunt | ✅ ProductHunt via Exa |
| No Quora | ✅ Quora via Exa |

---

## Future: When Funded

```
WITH REVENUE (10+ paying users):
├── Add Apify Reddit scraper ($29/mo)
├── Add Apify Twitter scraper ($29/mo)
├── Add Apify LinkedIn scraper ($29/mo)
├── Total: $87/mo for reliable social scraping
└── Now we have 12 sources (9 free + 3 paid)
```

---

## Implementation Order

```
PHASE 1: Add new API sources (IndieHackers, Lobste.rs, Dev.to)
PHASE 2: Add Exa semantic sources (Reddit, Twitter, ProductHunt, Quora)
PHASE 3: Update landing page with new hook
PHASE 4: Ship and find beta users
PHASE 5: Fund Apify for reliable scraping
```
