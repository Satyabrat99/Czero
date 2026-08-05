# Czero — Updated Build Plan

## The Goal

**Help SaaS devs / vibe coders get their first users** by finding people actively looking for tools like theirs.

## The Hook

```
"Get your first 10 users by Sunday"

We monitor IndieHackers, HN, GitHub, Reddit, Twitter, 
ProductHunt, and Quora for people asking for tools like yours.

You reply. They sign up. You grow.
```

---

## Build Order (Updated)

```
PHASE 0: Foundation ✅ DONE
├── Next.js frontend
├── FastAPI backend
└── Git repo

PHASE 1: Signal Collection (Current)
├── Phase 1A: HN + Exa ✅ DONE
├── Phase 1B: IndieHackers + Lobste.rs + Dev.to 🆕
└── Phase 1C: Exa Reddit/Twitter/ProductHunt/Quora 🆕

PHASE 2: Intent Scoring ✅ DONE (with MiMo)

PHASE 3: Contact Enrichment ✅ DONE

PHASE 4: Delivery (Email + Dashboard) ✅ DONE

PHASE 5: Auth + Payments + Landing Page ⬜ NEXT
├── Supabase auth
├── Stripe payments
└── Landing page with new hook

PHASE 6: Polish + Deploy ⬜
└── Loading states, error handling, mobile
```

---

## Build Prompts (Ready)

| File | Description | Status |
|------|-------------|--------|
| `build-prompts/PROJECT-CONTEXT.md` | Full project context | ✅ |
| `build-prompts/PHASE-0.md` | Foundation setup | ✅ Done |
| `build-prompts/PHASE-1.md` | Signal collection | ✅ Done |
| `build-prompts/PHASE-1B.md` | New API sources | 🆕 Ready |
| `build-prompts/PHASE-1C.md` | Exa semantic sources | 🆕 Ready |
| `build-prompts/PHASE-2.md` | Intent scoring | ✅ Done |
| `build-prompts/PHASE-3.md` | Contact enrichment | ✅ Done |
| `build-prompts/PHASE-4.md` | Delivery layer | ✅ Done |
| `build-prompts/PHASE-5.md` | Auth + payments | ⬜ Next |
| `build-prompts/PHASE-6.md` | Polish + deploy | ⬜ |

---

## What's Done

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (Next.js) | ✅ | 3 dashboard pages |
| Backend (FastAPI) | ✅ | Full pipeline endpoint |
| HN collector | ✅ | Working |
| Exa general search | ✅ | Working |
| Reddit collector | ⚠️ | Blocked (Exa fallback ready) |
| Twitter collector | ⚠️ | Stub (Exa fallback ready) |
| LinkedIn collector | ⚠️ | Stub (Exa fallback ready) |
| Scoring (MiMo) | ✅ | Working with batch mode |
| Email enrichment | ✅ | GitHub + verification |
| Email digest | ✅ | Resend integration |
| Dashboard | ✅ | Leads list + settings + detail |

---

## What's Next

```
1. Run PHASE-1B (Command Code) → Add IndieHackers, Lobste.rs, Dev.to
2. Run PHASE-1C (Command Code) → Add Exa Reddit/Twitter/PH/Quora
3. Run PHASE-5 (Command Code) → Auth + payments + landing page
4. Ship and find 30 beta users
5. Get 10 paying users
6. Fund Apify for Reddit/Twitter/LinkedIn
```

---

## Source Matrix (After Phase 1B + 1C)

| Source | Method | Cost | Status |
|--------|--------|------|--------|
| HN | Public API | $0 | ✅ Working |
| IndieHackers | Public API | $0 | 🆕 Phase 1B |
| Lobste.rs | Public API | $0 | 🆕 Phase 1B |
| Dev.to | Public API | $0 | 🆕 Phase 1B |
| GitHub | Public API | $0 | ✅ Working |
| Reddit | Exa semantic | $0.07/wk | 🆕 Phase 1C |
| Twitter | Exa semantic | $0.07/wk | 🆕 Phase 1C |
| ProductHunt | Exa semantic | $0.07/wk | 🆕 Phase 1C |
| Quora | Exa semantic | $0.07/wk | 🆕 Phase 1C |
| **TOTAL** | | **$0.21/wk** | **9 sources** |

---

## Future: When Funded

| Source | Method | Cost | When |
|--------|--------|------|------|
| Reddit | Apify scraper | $29/mo | After 10 paying users |
| Twitter | Apify scraper | $29/mo | After 10 paying users |
| LinkedIn | Apify scraper | $29/mo | After 10 paying users |
| **TOTAL** | | **$87/mo** | **12 sources** |

---

## Landing Page (New Hook)

```
HEADLINE: Get your first 10 users by Sunday

SUBHEAD: Paste your URL. We find people asking for tools like yours. 
         You reply. They sign up.

WHAT WE MONITOR:
├── IndieHackers
├── Hacker News
├── GitHub
├── Reddit (via semantic search)
├── Twitter (via semantic search)
├── ProductHunt
├── Quora
├── Dev.to
└── Lobste.rs

PRICING:
├── Free: 5 leads/week
├── Pro: $19/mo (25 leads/week)
└── 30-day money-back guarantee

CTA: Start Finding Users Free →
```
