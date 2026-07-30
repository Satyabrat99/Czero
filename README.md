# Czero

> "Paste your SaaS URL. Get people who need it — this week."

Find buying intent signals across Reddit, Twitter, LinkedIn, HN, and the entire web. Score them for intent. Find contact info. Draft outreach messages.

## Tech Stack
- Frontend: Next.js 15 + Tailwind + shadcn/ui
- Backend: Python FastAPI + Celery
- Database: Supabase (Postgres)
- Hosting: Vercel + Railway

## Development
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd api && python -m uvicorn app.main:app --reload
```
