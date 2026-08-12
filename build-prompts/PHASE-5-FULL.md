# Phase 5: Connect Full Pipeline (Frontend → Backend)

> Feed this to Command Code. This connects the frontend to the backend and makes the full pipeline work end-to-end.

---

## Current State

The backend is fully functional:
- ✅ Collector engine (12 sources)
- ✅ Scorer engine (MiMo LLM)
- ✅ Enrichment engine (GitHub + SMTP)
- ✅ API endpoints (/analyze, /collect-and-score, /full-pipeline)

The frontend has pages but NO connection to backend:
- ⚠️ Settings page (UI only, no API calls)
- ⚠️ Leads page (UI only, no data)
- ⚠️ Lead detail page (UI only, no data)

---

## Task

Connect the frontend to the backend so the full pipeline works:
1. Settings page → calls /analyze + /full-pipeline
2. Leads page → fetches and displays leads
3. Lead detail page → shows single lead with drafts

---

## Step 1: Fix Settings Page (Connect to Backend)

**File:** `frontend/src/app/dashboard/settings/page.tsx`

Replace the current file with:

```tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const [url, setUrl] = useState('')
  const [keywords, setKeywords] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not logged in')
        setLoading(false)
        return
      }

      // Call backend API
      const response = await fetch('http://localhost:8000/api/products/full-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          name: url.replace('https://', '').replace('http://', ''),
          description: '',
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          competitor_names: competitors.split(',').map(c => c.trim()).filter(c => c),
          subreddit_list: ['SaaS', 'startups', 'Entrepreneur'],
          icp: {}
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze product')
      }

      const data = await response.json()
      
      // Store results in localStorage for now (later: Supabase)
      localStorage.setItem('czero_leads', JSON.stringify(data.leads || []))
      localStorage.setItem('czero_stats', JSON.stringify(data.stats || {}))
      localStorage.setItem('czero_product', JSON.stringify({ url, keywords, competitors }))
      
      setSuccess(`Found ${data.stats?.total || 0} leads! Redirecting...`)
      
      // Redirect to leads page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-400 mb-8">Configure what we monitor for you.</p>

      <div className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Product URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-saas.com"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Keywords (comma separated)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="lead generation, SaaS, indie hacker"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Competitors (comma separated)</label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Pounce, ReplyGain, HuntIQ"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze & Start Monitoring'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## Step 2: Fix Leads Page (Show Results)

**File:** `frontend/src/app/dashboard/page.tsx`

Replace the current file with:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Lead {
  source: string
  source_url: string
  author_username: string
  text: string
  final_score: number
  category: string
  reasoning: string
  email?: string
  linkedin_url?: string
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage (later: Supabase)
    const storedLeads = localStorage.getItem('czero_leads')
    const storedStats = localStorage.getItem('czero_stats')
    
    if (storedLeads) {
      setLeads(JSON.parse(storedLeads))
    }
    if (storedStats) {
      setStats(JSON.parse(storedStats))
    }
    setLoading(false)
  }, [])

  const hotLeads = leads.filter(l => l.category === 'hot')
  const warmLeads = leads.filter(l => l.category === 'warm')

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Your Leads</h1>
        <p className="text-gray-400 mb-8">No leads yet. Configure your product in Settings.</p>
        <Link
          href="/dashboard/settings"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium inline-block"
        >
          Go to Settings
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Your Leads</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded">
          <div className="text-3xl font-bold text-blue-500">{stats.total || leads.length}</div>
          <div className="text-gray-400">Total Leads</div>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <div className="text-3xl font-bold text-red-500">{hotLeads.length}</div>
          <div className="text-gray-400">🔥 Hot Leads</div>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <div className="text-3xl font-bold text-yellow-500">{warmLeads.length}</div>
          <div className="text-gray-400">🟡 Warm Leads</div>
        </div>
      </div>

      {/* Lead List */}
      <div className="space-y-4">
        {leads.map((lead, i) => (
          <Link
            key={i}
            href={`/dashboard/leads/${i}`}
            className="block bg-gray-900 p-4 rounded hover:bg-gray-800 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.category === 'hot' ? 'bg-red-500/20 text-red-400' :
                    lead.category === 'warm' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {lead.category === 'hot' ? '🔥 HOT' : 
                     lead.category === 'warm' ? '🟡 WARM' : '⚪ COLD'}
                  </span>
                  <span className="text-gray-500 text-sm">{lead.source}</span>
                </div>
                <p className="text-white mb-2 line-clamp-2">{lead.text}</p>
                <p className="text-gray-500 text-sm">{lead.reasoning}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-blue-500">{lead.final_score}%</div>
                <div className="text-gray-500 text-xs">score</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

---

## Step 3: Fix Lead Detail Page (Show Single Lead)

**File:** `frontend/src/app/dashboard/leads/[leadId]/page.tsx`

Replace the current file with:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Lead {
  source: string
  source_url: string
  author_username: string
  text: string
  final_score: number
  category: string
  reasoning: string
  email?: string
  linkedin_url?: string
  email_draft?: string
  linkedin_dm_draft?: string
  reddit_reply_draft?: string
}

export default function LeadDetail() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedLeads = localStorage.getItem('czero_leads')
    if (storedLeads) {
      const leads = JSON.parse(storedLeads)
      const index = parseInt(params.leadId as string)
      if (leads[index]) {
        setLead(leads[index])
      }
    }
    setLoading(false)
  }, [params.leadId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-gray-400">Lead not found</p>
        <Link href="/dashboard" className="text-blue-400 hover:underline mt-4 inline-block">
          ← Back to leads
        </Link>
      </div>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Link href="/dashboard" className="text-blue-400 hover:underline mb-4 inline-block">
        ← Back to leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              lead.category === 'hot' ? 'bg-red-500/20 text-red-400' :
              lead.category === 'warm' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {lead.category === 'hot' ? '🔥 HOT' : 
               lead.category === 'warm' ? '🟡 WARM' : '⚪ COLD'}
            </span>
            <span className="text-gray-500">{lead.source}</span>
            <span className="text-gray-500">by {lead.author_username}</span>
          </div>
          <h1 className="text-xl font-bold">Score: {lead.final_score}%</h1>
        </div>
        <a
          href={lead.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          View Original →
        </a>
      </div>

      {/* Post Content */}
      <div className="bg-gray-900 p-4 rounded mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Post</h2>
        <p className="text-white whitespace-pre-wrap">{lead.text}</p>
      </div>

      {/* Why This Lead */}
      <div className="bg-gray-900 p-4 rounded mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Why This Lead</h2>
        <p className="text-white">{lead.reasoning}</p>
      </div>

      {/* Contact Info */}
      {(lead.email || lead.linkedin_url) && (
        <div className="bg-gray-900 p-4 rounded mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-2">Contact Info</h2>
          {lead.email && (
            <p className="text-white mb-1">
              📧 <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">{lead.email}</a>
            </p>
          )}
          {lead.linkedin_url && (
            <p className="text-white">
              💼 <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{lead.linkedin_url}</a>
            </p>
          )}
        </div>
      )}

      {/* Outreach Drafts */}
      <div className="space-y-4">
        {lead.email_draft && (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">📧 Email Draft</h2>
              <button
                onClick={() => copyToClipboard(lead.email_draft!)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-white whitespace-pre-wrap">{lead.email_draft}</p>
          </div>
        )}

        {lead.linkedin_dm_draft && (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">💼 LinkedIn DM Draft</h2>
              <button
                onClick={() => copyToClipboard(lead.linkedin_dm_draft!)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-white whitespace-pre-wrap">{lead.linkedin_dm_draft}</p>
          </div>
        )}

        {lead.reddit_reply_draft && (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">🔴 Reddit Reply Draft</h2>
              <button
                onClick={() => copyToClipboard(lead.reddit_reply_draft!)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-white whitespace-pre-wrap">{lead.reddit_reply_draft}</p>
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="mt-8 flex gap-4">
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium">
          👍 Useful
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-medium">
          👎 Not Useful
        </button>
      </div>
    </div>
  )
}
```

---

## Step 4: Make Sure Backend is Running

The backend must be running on port 8000. Start it with:

```bash
cd api
PYTHONPATH=. venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## What This Enables

```
USER FLOW:
1. User logs in ✅
2. User goes to Settings
3. User enters: URL + Keywords + Competitors
4. User clicks "Analyze & Start Monitoring"
5. Frontend calls backend /full-pipeline
6. Backend collects signals from 12 sources
7. Backend scores with MiMo
8. Backend enriches with GitHub
9. Backend generates drafts
10. Results stored in localStorage
11. User redirected to Leads page
12. User sees leads with scores
13. User clicks lead → sees detail + drafts
14. User copies draft → replies on platform
```

---

## Git Commit

```bash
git add .
git commit -m "feat: connect frontend to backend, full pipeline working"
```
