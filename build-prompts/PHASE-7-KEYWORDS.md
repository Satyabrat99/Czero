# Phase 7: Better Keywords & Noise Filter

> Feed this to Command Code. This improves signal quality by using buyer-intent keywords and filtering noise.

---

## Problem

Current approach finds noise:
```
BAD RESULTS:
├── "Synonyms of spring - Merriam-Webster" ❌ (not lead gen)
├── "Pounce® 384EC insecticide" ❌ (wrong product)
├── "Manchester United begin talks" ❌ (football)
├── "10 Best Lead Gen Tools" ❌ (article, not buyer)
└── "Lead Gen Best Practices" ❌ (guide, not buyer)

GOOD RESULTS (what we want):
├── "Anyone know a good lead gen tool?" ✅ (buyer)
├── "Looking for Pounce alternative" ✅ (buyer)
├── "Frustrated with current lead gen" ✅ (buyer)
└── "What do you use for SaaS leads?" ✅ (buyer)
```

---

## Task

1. Add buyer-intent keyword generation
2. Add noise filter for irrelevant content
3. Focus collection on high-quality sources (Reddit, HN)
4. Guide users toward better keywords in Settings

---

## Step 1: Add Buyer-Intent Keyword Generator

**File:** `api/app/services/keyword_generator.py`

Create a service that generates buyer-intent keywords from product info:

```python
"""
Generates buyer-intent keywords from product URL and description.
Instead of generic keywords like "lead generation", we generate
specific phrases that buyers actually use.
"""

class KeywordGenerator:
    """Generate buyer-intent keywords from product info."""
    
    INTENT_TEMPLATES = [
        # Looking for alternatives
        "looking for {competitor} alternative",
        "alternative to {competitor}",
        "switching from {competitor}",
        "replace {competitor}",
        
        # Asking for recommendations
        "anyone know good {keyword}",
        "recommend {keyword} tool",
        "best {keyword} for {audience}",
        "{keyword} suggestion",
        
        # Expressing pain
        "frustrated with {keyword}",
        "{keyword} not working",
        "need better {keyword}",
        "tired of {keyword}",
        
        # Comparison
        "{competitor} vs",
        "{competitor} comparison",
        "is {competitor} worth it",
    ]
    
    NOISE_PHRASES = [
        # Dictionary/thesaurus
        "synonyms", "thesaurus", "dictionary", "definition",
        
        # Wrong product type
        "insecticide", "pesticide", "chemical", "formula",
        
        # Sports/entertainment
        "football", "soccer", "united", "match", "game",
        "download", "play", "stream",
        
        # Generic content
        "best practices", "guide to", "how to use",
        "top 10", "list of", "comparison",
        "tutorial", "documentation", "api reference",
    ]
    
    def generate_keywords(self, product_url: str, product_name: str, 
                          competitors: list[str], target_audience: str) -> list[str]:
        """Generate buyer-intent keywords from product info."""
        keywords = []
        
        # Extract main keyword from product name
        main_keyword = product_name.lower().replace(".com", "").replace(".ai", "")
        
        # Generate competitor-focused keywords
        for comp in competitors[:3]:
            keywords.append(f"looking for {comp} alternative")
            keywords.append(f"alternative to {comp}")
            keywords.append(f"switching from {comp}")
        
        # Generate general buyer-intent keywords
        keywords.append(f"anyone know good {main_keyword}")
        keywords.append(f"recommend {main_keyword} tool")
        keywords.append(f"best {main_keyword} for {target_audience}")
        keywords.append(f"frustrated with {main_keyword}")
        
        return keywords[:15]  # Limit to 15 keywords
    
    def is_noise(self, text: str) -> bool:
        """Check if text is noise (not relevant)."""
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in self.NOISE_PHRASES)
    
    def has_buyer_intent(self, text: str) -> bool:
        """Check if text shows buyer intent."""
        intent_phrases = [
            "looking for", "need", "anyone know", "recommend",
            "alternative to", "switching from", "frustrated with",
            "what do you use", "what's the best", "help me find",
        ]
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in intent_phrases)
```

---

## Step 2: Add Noise Filter to Collector

**File:** `api/app/engines/collector/sources/exa.py`

Filter out noise BEFORE storing signals:

```python
from datetime import datetime, timedelta

# Noise phrases to filter out
NOISE_PHRASES = [
    "synonyms", "thesaurus", "dictionary", "definition",
    "insecticide", "pesticide", "chemical", "formula",
    "football", "soccer", "united", "match",
    "download", "play", "stream", "game",
    "best practices", "guide to", "how to use",
    "top 10", "list of", "tutorial", "documentation",
]

def is_noise(text: str) -> bool:
    """Check if text is noise."""
    text_lower = text.lower()
    return any(phrase in text_lower for phrase in NOISE_PHRASES)

async def collect(self, product: dict) -> list[Signal]:
    if not self.exa:
        return []
    
    signals = []
    keywords = product.get("keywords", [])
    competitors = product.get("competitor_names", [])
    
    # Build buyer-intent queries
    queries = []
    for kw in keywords[:3]:
        queries.append(f"looking for {kw}")
        queries.append(f"{kw} recommendation")
    for comp in competitors[:2]:
        queries.append(f"{comp} alternative")
        queries.append(f"alternative to {comp}")
    
    # Date filter: last 24 hours
    start_date = (datetime.now() - timedelta(hours=24)).isoformat()
    
    for query in queries:
        try:
            results = self.exa.search(
                query,
                num_results=10,
                start_published_date=start_date,
                contents={"highlights": True}
            )
            for result in results.results:
                text = result.text or result.title or ""
                
                # FILTER: Skip noise
                if is_noise(text):
                    continue
                
                # FILTER: Skip if too old
                if result.published_date:
                    try:
                        pub_date = datetime.fromisoformat(result.published_date.replace('Z', '+00:00'))
                        if pub_date < datetime.now().astimezone() - timedelta(hours=24):
                            continue
                    except:
                        pass
                
                signals.append(Signal(
                    source="web",
                    source_url=result.url,
                    author_username="unknown",
                    text=text,
                    posted_at=result.published_date or datetime.now().isoformat(),
                    metadata={"title": result.title or ""}
                ))
        except Exception as e:
            print(f"Exa error: {e}")
    
    return signals
```

---

## Step 3: Update Settings Page to Guide Users

**File:** `frontend/src/app/dashboard/settings/page.tsx`

Add helper text and suggested keywords:

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

  // Suggested keywords based on common patterns
  const suggestedKeywords = [
    "looking for alternative to",
    "anyone know good",
    "recommend tool for",
    "frustrated with",
    "what do you use for",
    "switching from",
  ]

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not logged in')
        setLoading(false)
        return
      }

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

      if (!response.ok) throw new Error('Failed to analyze')

      const data = await response.json()
      localStorage.setItem('czero_leads', JSON.stringify(data.leads || []))
      localStorage.setItem('czero_stats', JSON.stringify(data.stats || {}))
      localStorage.setItem('czero_product', JSON.stringify({ url, keywords, competitors }))
      
      setSuccess(`Found ${data.stats?.total || 0} leads!`)
      setTimeout(() => router.push('/dashboard'), 2000)
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
            <label className="block text-sm font-medium mb-2">
              Keywords (comma separated)
            </label>
            <p className="text-gray-500 text-xs mb-2">
              Use buyer-intent phrases, not generic terms. Better keywords = better leads.
            </p>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="looking for alternative to, anyone know good, recommend tool for"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    if (!keywords.includes(kw)) {
                      setKeywords(keywords ? `${keywords}, ${kw}` : kw)
                    }
                  }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-400"
                >
                  + {kw}
                </button>
              ))}
            </div>
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

## What This Fixes

```
BEFORE (bad keywords):
├── Keywords: "lead generation, SaaS leads"
├── Finds: Articles, guides, noise
└── Quality: LOW

AFTER (buyer-intent keywords):
├── Keywords: "looking for alternative to Pounce, anyone know good lead gen tool"
├── Finds: People actively asking for solutions
└── Quality: HIGH

BEFORE (no noise filter):
├── Finds: "Synonyms of spring - Merriam-Webster"
├── Finds: "Pounce® insecticide"
├── Finds: "Manchester United"
└── Quality: NOISE

AFTER (noise filter):
├── Filters out: dictionaries, wrong products, sports
├── Keeps: Actual buyer discussions
└── Quality: HIGH
```

---

## Git Commit

```bash
git add .
git commit -m "feat: buyer-intent keywords + noise filter + better settings UX"
```
