# Czero — Build Checklist

> Track progress. Check off each phase as it's completed and verified.

---

## Phase 0: Foundation ⬜
- [ ] Next.js 15 frontend initialized
- [ ] Python FastAPI backend initialized
- [ ] Supabase connected
- [ ] Database schema created
- [ ] Placeholder pages work
- [ ] Git repo created with initial commit
- [ ] `npm run dev` shows landing page
- [ ] `uvicorn app.main:app` shows Swagger docs

## Phase 1: Signal Collection ⬜
- [ ] Base source manager interface
- [ ] Reddit source manager (PRAW)
- [ ] HN source manager (Algolia)
- [ ] Exa semantic search manager
- [ ] Twitter stub (placeholder)
- [ ] LinkedIn stub (placeholder)
- [ ] Signal merger + deduplicator
- [ ] Collector orchestrator (parallel execution)
- [ ] API route for collection
- [ ] Test: signals from multiple sources
- [ ] Git commit: `feat: signal collection engine`

## Phase 2: Intent Scoring ⬜
- [ ] Soft pre-filter
- [ ] LLM intent scorer
- [ ] MVP scorer orchestrator
- [ ] API route for collect-and-score
- [ ] Test: leads with scores and categories
- [ ] Git commit: `feat: intent scoring engine`

## Phase 3: Contact Enrichment ⬜
- [ ] GitHub enricher
- [ ] Email verifier (DNS + disposable)
- [ ] Email quality grading (A/B/C)
- [ ] Enrichment orchestrator (parallel)
- [ ] API route with enrichment
- [ ] Test: leads with contact info
- [ ] Git commit: `feat: contact enrichment engine`

## Phase 4: Delivery ⬜
- [ ] Email digest service (Resend)
- [ ] Outreach draft generator
- [ ] Full pipeline endpoint
- [ ] Dashboard: leads list page
- [ ] Dashboard: lead detail page
- [ ] Dashboard: settings page
- [ ] Test: email digest works
- [ ] Test: dashboard shows leads
- [ ] Git commit: `feat: delivery layer`

## Phase 5: Auth + Payments ⬜
- [ ] Supabase Auth (login/signup)
- [ ] Protected dashboard routes
- [ ] Landing page (real, not placeholder)
- [ ] Stripe integration (backend)
- [ ] Pricing page
- [ ] Test: signup → login → dashboard
- [ ] Git commit: `feat: auth, landing, payments`

## Phase 6: Polish + Deploy ⬜
- [ ] Loading states (skeletons)
- [ ] Error handling (toast notifications)
- [ ] Empty states (helpful messages)
- [ ] Mobile responsive
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Test: full flow end-to-end
- [ ] Git commit: `feat: polish and deploy`

---

## Notes

- Each phase must be verified before moving to next
- If a step fails, fix it before proceeding
- Commit after each verified phase
- Update this checklist as phases complete
