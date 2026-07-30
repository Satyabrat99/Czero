# Phase 1 Update: Reddit via Exa (No API Needed)

> Feed this to Command Code. It updates the Reddit collector to use Exa instead of PRAW (which is blocked for new apps).

---

## Context

Reddit has blocked new API access since November 2025. The "Responsible Builder Policy" rejects personal projects. We cannot use PRAW (Reddit API) for new apps.

**Solution:** Use Exa semantic search to search Reddit content. This is actually BETTER than PRAW because Exa does semantic search (finds "need a way to bill clients" when keyword is "invoicing").

---

## What Changes

1. **Delete** `api/app/engines/collector/sources/reddit.py` (the PRAW-based one)
2. **Create** `api/app/engines/collector/sources/reddit_via_exa.py` (new, Exa-based)
3. **Update** `api/app/engines/collector/orchestrator.py` to use new Reddit collector
4. **Remove** Reddit API credentials from `.env` (no longer needed)
5. **Add** a `sources` field to the Exa source manager for dual-mode (Reddit-specific + general)

---

## Step 1: Create Reddit-Via-Exa Collector

Create file `api/app/engines/collector/sources/reddit_via_exa.py`:

```python
import os
import re
from datetime import datetime, timedelta
from exa_py import Exa
from .base import BaseSourceManager, Signal


class RedditViaExaCollector(BaseSourceManager):
    """
    Reddit signal collection using Exa semantic search.
    
    Instead of Reddit API (blocked), we use Exa to search Reddit content.
    This is BETTER than PRAW because:
    - No API approval needed
    - Semantic search catches posts that keyword search misses
    - Exa already crawls Reddit regularly
    
    Two search modes:
    1. Reddit-specific: searches ONLY reddit.com with intent patterns
    2. General: catches Reddit posts via semantic search across web
    """
    
    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None
    
    def name(self) -> str:
        return "reddit"
    
    async def collect(self, product: dict) -> list[Signal]:
        """Search Reddit via Exa for buying intent signals."""
        if not self.exa:
            print("EXA_API_KEY not set — skipping Reddit collection")
            return []
        
        signals = []
        keywords = product.get("keywords", [])
        competitors = product.get("competitor_names", [])
        description = product.get("description", "")
        
        # Build Reddit-specific queries with intent patterns
        queries = self._build_queries(keywords, competitors, description)
        
        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    type="auto",
                    numResults=15,
                    include_domains=["reddit.com", "old.reddit.com"],
                    startPublishedDate=(datetime.now() - timedelta(days=7)).isoformat(),
                    contents={"highlights": True}
                )
                
                for result in results.results:
                    # Check if post has buying intent
                    intent = self._detect_intent(result.text or "")
                    if intent["score"] < 30:
                        continue  # Skip low-intent posts
                    
                    # Extract username from URL if possible
                    username = self._extract_username(result.url)
                    
                    signal = Signal(
                        source="reddit",
                        source_url=result.url,
                        author_username=username,
                        text=result.text or result.title or "",
                        posted_at=result.publishedDate,
                        metadata={
                            "subreddit": self._extract_subreddit(result.url),
                            "intent_type": intent["type"],
                            "intent_score": intent["score"],
                            "exa_score": getattr(result, 'score', None),
                        }
                    )
                    signals.append(signal)
                    
            except Exception as e:
                print(f"Reddit Exa error for '{query[:60]}...': {e}")
                continue
        
        return signals
    
    def _build_queries(self, keywords: list, competitors: list, description: str) -> list[str]:
        """Build Reddit-specific search queries with intent patterns."""
        queries = []
        
        # Direct need queries (highest intent)
        for kw in keywords[:5]:
            queries.append(f'site:reddit.com ("{kw}" OR "{kw} alternative" OR "{kw} recommendation")')
        
        # Competitor switching queries (high intent)
        for comp in competitors[:3]:
            queries.append(f'site:reddit.com ("{comp}" AND ("alternative" OR "switching" OR "better than"))')
        
        # Problem-focused queries
        queries.append(f'site:reddit.com ("looking for" OR "recommend" OR "need") {description[:50]}')
        
        # Pain point queries (high urgency)
        if keywords:
            queries.append(f'site:reddit.com ("frustrated" OR "hate" OR "tired of" OR "done with") {keywords[0]}')
        
        # Question queries (recommendation requests)
        queries.append(f'site:reddit.com ("anyone know" OR "what do you use" OR "what\'s the best") {keywords[0] if keywords else description[:30]}')
        
        return queries
    
    def _detect_intent(self, text: str) -> dict:
        """Detect buying intent in Reddit post text."""
        text_lower = text.lower()
        
        # Strong intent (score 70-100)
        strong_signals = [
            "recommend", "alternative to", "looking for", "anyone know",
            "need", "suggestion", "what do you use", "what's the best"
        ]
        
        # Moderate intent (score 40-69)
        moderate_signals = [
            "switching from", "frustrated", "better than", "worth it",
            "help me find", "suggestion for", "advice on"
        ]
        
        # Weak intent (score 30-39)
        weak_signals = [
            "how do you", "what tool", "pricing", "comparison"
        ]
        
        for signal in strong_signals:
            if signal in text_lower:
                return {"type": "strong", "score": 85}
        
        for signal in moderate_signals:
            if signal in text_lower:
                return {"type": "moderate", "score": 60}
        
        for signal in weak_signals:
            if signal in text_lower:
                return {"type": "weak", "score": 40}
        
        return {"type": "none", "score": 0}
    
    def _extract_subreddit(self, url: str) -> str:
        """Extract subreddit name from Reddit URL."""
        match = re.search(r'reddit\.com/r/(\w+)', url)
        return match.group(1) if match else "unknown"
    
    def _extract_username(self, url: str) -> str:
        """Extract username from Reddit URL if available."""
        # Post URLs don't always contain username
        # Try to extract from URL pattern
        match = re.search(r'reddit\.com/user/(\w+)', url)
        if match:
            return match.group(1)
        # Try comment URL pattern
        match = re.search(r'/comments/\w+/.*?/(\w+)/', url)
        if match:
            return match.group(1)
        return "unknown"
```

---

## Step 2: Delete Old Reddit Collector

Delete file: `api/app/engines/collector/sources/reddit.py`

(This was the PRAW-based collector that needs Reddit API credentials)

---

## Step 3: Update Orchestrator

Update `api/app/engines/collector/orchestrator.py`:

```python
import asyncio
from datetime import datetime
from .sources.reddit_via_exa import RedditViaExaCollector  # Changed from reddit import
from .sources.hn import HNSourceManager
from .sources.exa import ExaSourceManager
from .sources.twitter import TwitterSourceManager
from .sources.linkedin import LinkedInSourceManager
from .merger import SignalMerger


class CollectorEngine:
    """
    Master orchestrator for signal collection.
    
    KEY: All sources run INDEPENDENTLY in parallel.
    Results MERGE at the end. No source filters another.
    
    Sources:
    - Reddit via Exa (semantic search, no API needed)
    - Exa general (web-wide semantic search)
    - HN via Algolia (free, no approval)
    - Twitter via Scweet (free, needs auth_token)
    - LinkedIn via no-cookies scraper (free)
    """
    
    def __init__(self):
        self.sources = {
            "reddit": RedditViaExaCollector(),  # Changed from RedditSourceManager
            "hn": HNSourceManager(),
            "exa": ExaSourceManager(),
            "twitter": TwitterSourceManager(),
            "linkedin": LinkedInSourceManager(),
        }
        self.merger = SignalMerger()
    
    async def collect_for_product(self, product: dict) -> dict:
        """Collect all signals for a product from all sources in parallel."""
        tasks = []
        for name, source in self.sources.items():
            tasks.append(self._collect_with_timeout(source, product, timeout=30))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_signals = []
        source_stats = {}
        for name, result in zip(self.sources.keys(), results):
            if isinstance(result, Exception):
                source_stats[name] = {"status": "error", "count": 0, "error": str(result)}
            else:
                all_signals.append(result)
                source_stats[name] = {"status": "ok", "count": len(result)}
        
        unique_signals = self.merger.merge_and_dedup(all_signals)
        
        return {
            "total_raw": sum(s["count"] for s in source_stats.values()),
            "total_unique": len(unique_signals),
            "source_stats": source_stats,
            "signals": unique_signals,
            "timestamp": datetime.now().isoformat(),
        }
    
    async def _collect_with_timeout(self, source, product, timeout: int):
        try:
            return await asyncio.wait_for(source.collect(product), timeout=timeout)
        except asyncio.TimeoutError:
            print(f"Source {source.name()} timed out after {timeout}s")
            return []
        except Exception as e:
            print(f"Source {source.name()} failed: {e}")
            return []
```

---

## Step 4: Update .env

Remove Reddit API credentials from `api/.env` (no longer needed):

```
# OLD (remove these):
# REDDIT_CLIENT_ID=...
# REDDIT_CLIENT_SECRET=...
# REDDIT_USER_AGENT=...

# Keep these:
EXA_API_KEY=your_exa_key_here
OPENAI_API_KEY=your_openai_key_here
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Step 5: Test

```bash
cd api && python -m uvicorn app.main:app --reload
```

```bash
curl -X POST http://localhost:8000/api/products/collect \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://linear.app",
    "name": "Linear",
    "description": "Project management tool for software teams",
    "keywords": ["project management", "issue tracker", "task management"],
    "competitor_names": ["Jira", "Asana"],
    "subreddit_list": ["SaaS", "startups"]
  }'
```

**Verify:**
- Reddit signals are found (via Exa semantic search)
- No Reddit API credentials needed
- Exa returns Reddit posts with buying intent
- Other sources (HN, Exa general) still work

---

## What Changed Summary

| Before | After |
|--------|-------|
| Reddit via PRAW (needs API credentials) | Reddit via Exa (no credentials needed) |
| Keyword search only | Semantic search (catches different phrasing) |
| Blocked for new apps | Works immediately |
| 1 source (Reddit API) | 1 source (Reddit via Exa) + general Exa |

**Net result:** Same Reddit coverage, better quality (semantic > keyword), zero API approval needed.

---

## Git Commit

```bash
git add .
git commit -m "fix: replace Reddit PRAW with Exa-based Reddit collector (no API needed)"
```
