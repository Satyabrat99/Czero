# Phase 6: Polish + Beta Launch

> Feed this to Command Code after Phase 5 is verified. This adds loading states, error handling, empty states, and mobile responsiveness.

---

## Task

Polish the UX: loading states, error handling, empty states, mobile responsiveness, and deploy to production.

---

## Step 1: Loading States

Add loading states to all async pages:

`frontend/app/dashboard/page.tsx` — add loading skeleton:
```tsx
'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch leads from API
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => { setLeads(data.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">🔥 Leads</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse border-l-4 border-gray-700 p-4 rounded bg-gray-900">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ... rest of component
}
```

---

## Step 2: Error Handling

Create `frontend/lib/api.ts` with error handling:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.detail || `API error: ${res.status}`)
  }
  return res.json()
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.detail || `API error: ${res.status}`)
  }
  return res.json()
}
```

---

## Step 3: Empty States

Add meaningful empty states to each page:

Dashboard empty state:
```tsx
{leads.length === 0 && !loading && (
  <div className="text-center py-20">
    <div className="text-6xl mb-4">🔍</div>
    <h2 className="text-xl font-bold mb-2">No leads yet</h2>
    <p className="text-gray-400 mb-6">We're scanning the web for people who need your product.</p>
    <p className="text-gray-500 text-sm">First leads appear within 24 hours.</p>
    <a href="/dashboard/settings" className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
      Configure monitoring →
    </a>
  </div>
)}
```

Settings empty state:
```tsx
{!product && (
  <div className="text-center py-20">
    <div className="text-6xl mb-4">👋</div>
    <h2 className="text-xl font-bold mb-2">Welcome! Let's get started.</h2>
    <p className="text-gray-400">Paste your product URL and we'll analyze it.</p>
  </div>
)}
```

---

## Step 4: Mobile Responsiveness

Ensure all pages work on mobile:

- Dashboard: cards stack vertically, full-width
- Lead detail: full-width layout, readable text
- Settings: full-width inputs, large touch targets
- Landing: hero text scales down, buttons full-width

Test on: iPhone SE (375px), iPhone 14 (390px), Android Chrome

---

## Step 5: Deploy Frontend to Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_API_URL (your Railway backend URL)

---

## Step 6: Deploy Backend to Railway

```bash
cd api
# Create Dockerfile if not exists
# Push to GitHub
# Connect to Railway
# Set environment variables
```

---

## Verification Checklist

1. ✅ Loading spinners appear during API calls
2. ✅ Error messages show when API fails (not blank pages)
3. ✅ Empty states guide users when no data exists
4. ✅ Mobile: all pages readable and tappable
5. ✅ Frontend deployed to Vercel
6. ✅ Backend deployed to Railway
7. ✅ Git commit: `feat: polish, loading states, error handling, deploy`
