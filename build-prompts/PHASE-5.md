# Phase 5: Auth + Payments + Landing Page

> Feed this to Command Code after Phase 4 is verified. This adds Supabase auth, Stripe payments, and a real landing page.

---

## Task

Build authentication (Supabase Auth), Stripe payments, landing page, and onboarding flow.

---

## Step 1: Supabase Auth Setup

Create `frontend/lib/supabase.ts` (replace existing):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
}
```

Create `frontend/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb-access-token')
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

---

## Step 2: Login/Signup Pages

Create `frontend/app/auth/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">Login to Czero</h1>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="text-gray-400 text-sm mt-4 text-center">
          Don't have an account? <a href="/auth/signup" className="text-blue-400 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  )
}
```

Create `frontend/app/auth/signup/page.tsx` (similar structure, calls `supabase.auth.signUp`).

---

## Step 3: Landing Page

Replace `frontend/app/page.tsx` with real landing page:
```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-5xl font-bold text-center max-w-3xl">
          Find the people already looking for your product.
        </h1>
        <p className="text-xl text-gray-400 mt-6 text-center max-w-2xl">
          Paste your SaaS URL. We monitor Reddit, Twitter, LinkedIn, HN and the entire web for buying intent signals. Get leads with contact info and ready-to-send messages.
        </p>
        <div className="mt-8 flex gap-4">
          <a href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
            Get Started Free
          </a>
          <a href="#how-it-works" className="border border-gray-600 hover:border-gray-400 text-white px-8 py-3 rounded-lg font-medium">
            How it works
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Paste your URL", desc: "AI analyzes your product and identifies who your customers are." },
            { step: "2", title: "We find buyers", desc: "We monitor social platforms 24/7 for people actively looking for your product." },
            { step: "3", title: "Get leads + drafts", desc: "Receive their contact info and ready-to-send personalized messages." },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-4">{item.step}</div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Free", price: "$0", features: ["3 leads/week", "No contact info", "Score + reasoning only"] },
            { name: "Starter", price: "$29/mo", features: ["10 leads/week", "Email + LinkedIn", "Ready-to-send drafts", "Priority scoring"], popular: true },
            { name: "Pro", price: "$79/mo", features: ["25 leads/week", "Daily alerts", "All platforms", "API access"] },
          ].map((plan, i) => (
            <div key={i} className={`p-6 rounded-lg border ${plan.popular ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}>
              {plan.popular && <div className="text-blue-400 text-sm mb-2">Most popular</div>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="text-3xl font-bold mt-2">{plan.price}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-gray-300">✓ {f}</li>
                ))}
              </ul>
              <a href="/auth/signup" className={`block mt-6 text-center py-2 rounded font-medium ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-gray-600 hover:border-gray-400 text-white'}`}>
                Get started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-500 text-sm">
        <p>Czero — Built for the 86% of founders stuck at $0.</p>
      </footer>
    </div>
  )
}
```

---

## Step 4: Stripe Integration (Backend)

Create `api/app/routes/billing.py`:
```python
import os
from fastapi import APIRouter, Request
import stripe

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


@router.post("/checkout")
async def create_checkout(request: Request):
    """Create Stripe checkout session."""
    body = await request.json()
    price_id = body.get("price_id")
    
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url="http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="http://localhost:3000/dashboard",
    )
    
    return {"session_url": session.url}
```

Add to `api/app/main.py`:
```python
from app.routes import billing
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
```

---

## Step 5: Test Auth + Landing

1. Run frontend: `cd frontend && npm run dev`
2. Visit localhost:3000 — see landing page
3. Click "Get Started Free" → redirects to signup
4. Sign up with email → redirects to dashboard
5. Try accessing /dashboard without login → redirects to /auth/login

---

## Verification Checklist

1. ✅ Landing page looks good (hero, how it works, pricing)
2. ✅ Signup creates user in Supabase
3. ✅ Login works with email/password
4. ✅ Dashboard protected (redirects to login if not authed)
5. ✅ After login, redirects to dashboard
6. ✅ Git commit: `feat: auth, landing page, and stripe integration`
