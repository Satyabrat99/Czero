# Phase 0: Foundation Setup

> Feed this prompt to Command Code. It sets up the entire project skeleton.

---

## Task

Initialize the Czero project at `C:\Users\satya\Czero\` with a Next.js 15 frontend and Python FastAPI backend. Create the complete project skeleton with all necessary files, configurations, and database schema.

---

## Step 1: Initialize Frontend

Run these commands from `C:\Users\satya\Czero\`:

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd frontend
npx shadcn@latest init
npx shadcn@latest add button card input badge tabs toast
npm install zustand @supabase/supabase-js
```

Create file `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create file `frontend/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Create file `frontend/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
```

Create placeholder pages (just headings, no real UI yet):

`frontend/app/page.tsx` — Landing page placeholder:
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold">Czero</h1>
      <p className="mt-4 text-gray-400">Find the people already looking for your product.</p>
    </main>
  )
}
```

`frontend/app/dashboard/page.tsx` — Dashboard placeholder:
```tsx
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-400">Leads will appear here.</p>
    </div>
  )
}
```

`frontend/app/dashboard/settings/page.tsx` — Settings placeholder:
```tsx
export default function Settings() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-gray-400">Product setup coming soon.</p>
    </div>
  )
}
```

`frontend/app/auth/login/page.tsx` — Login placeholder:
```tsx
export default function Login() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-gray-400">Auth coming soon.</p>
      </div>
    </div>
  )
}
```

`frontend/app/auth/signup/page.tsx` — Signup placeholder:
```tsx
export default function Signup() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <p className="mt-2 text-gray-400">Auth coming soon.</p>
      </div>
    </div>
  )
}
```

**Verify:** Run `cd frontend && npm run dev` — should show landing page at localhost:3000

---

## Step 2: Initialize Backend

Run these commands from `C:\Users\satya\Czero\`:

```bash
mkdir -p api
cd api
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn pydantic python-dotenv httpx openai supabase celery[redis] praw exa-py
pip freeze > requirements.txt
```

Create file `api/.env`:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here
EXA_API_KEY=your_exa_key_here
REDIS_URL=redis://localhost:6379
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=CzeroBot/1.0
```

Create folder structure:
```
api/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── signal.py
│   │   └── lead.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── products.py
│   │   ├── leads.py
│   │   └── health.py
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── collector/
│   │   │   └── __init__.py
│   │   ├── scorer/
│   │   │   └── __init__.py
│   │   └── enricher/
│   │       └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   └── workers/
│       └── __init__.py
├── tests/
│   └── __init__.py
├── .env
├── requirements.txt
└── Dockerfile
```

Create file `api/app/__init__.py` (empty)

Create file `api/app/config.py`:
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    exa_api_key: str = ""
    redis_url: str = "redis://localhost:6379"
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "CzeroBot/1.0"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

Create file `api/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, products, leads

app = FastAPI(title="Czero API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])

@app.get("/")
async def root():
    return {"status": "ok", "service": "czero-api"}
```

Create file `api/app/routes/__init__.py` (empty)

Create file `api/app/routes/health.py`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/api/health")
async def health_check():
    return {"status": "ok"}
```

Create file `api/app/routes/products.py`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def list_products():
    return {"products": []}

@router.post("")
async def create_product():
    return {"message": "TODO: create product"}
```

Create file `api/app/routes/leads.py`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def list_leads():
    return {"leads": []}
```

Create empty `__init__.py` files for all subdirectories.

Create file `api/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Verify:** Run `cd api && python -m uvicorn app.main:app --reload` — should show Swagger docs at localhost:8000/docs

---

## Step 3: Create Git Repository

```bash
cd C:\Users\satya\Czero
git init
```

Create file `.gitignore`:
```
# Node
node_modules/
.next/
out/

# Python
__pycache__/
*.pyc
.venv/
venv/
dist/
build/

# Environment
.env
.env.local
.env.production

# IDE
.DS_Store
.vscode/
.idea/

# OS
Thumbs.db
```

Create `README.md`:
```markdown
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
```

Commit:
```bash
git add .
git commit -m "chore: initial project setup"
```

---

## Verification Checklist

After completing all steps, verify:

1. ✅ `cd frontend && npm run dev` → landing page loads at localhost:3000
2. ✅ `cd api && python -m uvicorn app.main:app --reload` → Swagger at localhost:8000/docs
3. ✅ `git log` → shows initial commit
4. ✅ File structure matches the plan in PROJECT-CONTEXT.md

Report back what you see. If anything fails, paste the error and I'll fix the prompt.
