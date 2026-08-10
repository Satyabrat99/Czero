# Czero — Build Checklist (Updated)

## Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 0** | Foundation (Next.js + FastAPI) | ✅ DONE |
| **Phase 1A** | HN + Exa collection | ✅ DONE |
| **Phase 2** | Intent scoring (MiMo) | ✅ DONE |
| **Phase 3** | Contact enrichment | ✅ DONE |
| **Phase 4** | Delivery (email + dashboard) | ✅ DONE |

## Ready to Build

| Phase | Description | Command Code Prompt |
|-------|-------------|---------------------|
| **Phase 1B** | IndieHackers + Lobste.rs + Dev.to | `build-prompts/PHASE-1B.md` |
| **Phase 1C** | Exa Reddit/Twitter/PH/Quora | `build-prompts/PHASE-1C.md` |
| **Phase 1D** | Reddit RSS (OpenMagpie pattern) | `build-prompts/PHASE-1D.md` |
| **Phase 5** | Auth + payments + landing page | `build-prompts/PHASE-5.md` |

## Future (After Revenue)

| Phase | Description | Cost |
|-------|-------------|------|
| **Phase 6** | Polish + deploy | $0 |
| **Phase 7** | Apify Reddit/Twitter | $29/mo |
| **Phase 8** | LinkedIn integration | $29/mo |

---

## Build Order (Recommended)

```
1. PHASE-1D → Reddit RSS collector (proves Reddit works)
2. PHASE-1B → Add IndieHackers, Lobste.rs, Dev.to
3. PHASE-1C → Add Exa semantic sources
4. PHASE-5 → Auth + payments + landing page
5. Ship → Find 30 beta users
6. Revenue → Fund Apify
```

---

## Source Matrix (After All Phases)

| Source | Method | Cost | Phase |
|--------|--------|------|-------|
| HN | Public API | $0 | 1A ✅ |
| Reddit | RSS feeds | $0 | 1D 🆕 |
| IndieHackers | Public API | $0 | 1B 🆕 |
| Lobste.rs | Public API | $0 | 1B 🆕 |
| Dev.to | Public API | $0 | 1B 🆕 |
| GitHub | Public API | $0 | 1A ✅ |
| Exa (general) | Semantic | $0.07/wk | 1A ✅ |
| Exa (Reddit) | Semantic | (included) | 1C 🆕 |
| Exa (Twitter) | Semantic | (included) | 1C 🆕 |
| Exa (ProductHunt) | Semantic | (included) | 1C 🆕 |
| Exa (Quora) | Semantic | (included) | 1C 🆕 |
| **TOTAL** | | **$0.07/wk** | **12 sources**
