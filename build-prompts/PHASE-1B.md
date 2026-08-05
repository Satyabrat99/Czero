# Phase 1B: Add New API Sources (IndieHackers, Lobste.rs, Dev.to)

> Feed this to Command Code. This adds 3 new free API sources to the collector.

---

## Task

Add 3 new source collectors that use free public APIs. These are independent modules that follow the same pattern as existing sources.

---

## Context

Read these files first to understand the pattern:
- `api/app/engines/collector/sources/base.py` — Base class
- `api/app/engines/collector/sources/hn.py` — Example implementation
- `api/app/engines/collector/orchestrator.py` — How sources are registered

---

## New Sources to Create

### 1. IndieHackers Collector

**File:** `api/app/engines/collector/sources/indiehackers.py`

**API:** `https://www.indiehackers.com/api/v1/posts`

**What to search for:**
- Posts containing product keywords
- Posts asking for recommendations
- Posts mentioning competitors

**Implementation:**
```python
import httpx
from .base import BaseSourceManager, Signal

class IndieHackersCollector(BaseSourceManager):
    """Search IndieHackers for posts asking for tools."""
    
    def name(self) -> str:
        return "indiehackers"
    
    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])
        competitors = product.get("competitor_names", [])
        
        # Search for each keyword
        for kw in keywords[:3]:
            try:
                r = httpx.get(
                    f"https://www.indiehackers.com/api/v1/posts?q={kw}&sort_by=latest&per_page=10",
                    headers={"User-Agent": "CzeroBot/1.0"},
                    timeout=10
                )
                if r.status_code == 200:
                    posts = r.json().get("posts", [])
                    for post in posts:
                        # Check for intent
                        text = post.get("title", "") + " " + post.get("body", "")
                        if self._has_intent(text):
                            signals.append(Signal(
                                source="indiehackers",
                                source_url=f"https://www.indiehackers.com/post/{post.get('slug', '')}",
                                author_username=post.get("user", {}).get("name", "unknown"),
                                text=text[:1000],
                                metadata={"score": post.get("score", 0)}
                            ))
            except Exception as e:
                print(f"IndieHackers error: {e}")
        
        return signals
    
    def _has_intent(self, text: str) -> bool:
        """Check if post has buying intent."""
        intent_phrases = [
            "recommend", "looking for", "alternative to", "anyone know",
            "need", "suggestion", "what do you use", "best tool"
        ]
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in intent_phrases)
```

### 2. Lobste.rs Collector

**File:** `api/app/engines/collector/sources/lobsters.py`

**API:** `https://lobste.rs/newest.json`

**Implementation:**
```python
import httpx
from .base import BaseSourceManager, Signal

class LobstersCollector(BaseSourceManager):
    """Search Lobste.rs for tech discussions asking for tools."""
    
    def name(self) -> str:
        return "lobsters"
    
    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])
        
        try:
            r = httpx.get("https://lobste.rs/newest.json", timeout=10)
            if r.status_code == 200:
                stories = r.json()
                for story in stories:
                    title = story.get("title", "")
                    tags = story.get("tags", [])
                    
                    # Check if relevant
                    title_lower = title.lower()
                    if any(kw.lower() in title_lower for kw in keywords):
                        signals.append(Signal(
                            source="lobsters",
                            source_url=story.get("url", story.get("comments_url", "")),
                            author_username=story.get("submitter_user", {}).get("username", "unknown"),
                            text=title,
                            metadata={
                                "score": story.get("score", 0),
                                "comments": story.get("comment_count", 0),
                                "tags": tags
                            }
                        ))
        except Exception as e:
            print(f"Lobste.rs error: {e}")
        
        return signals
```

### 3. Dev.to Collector

**File:** `api/app/engines/collector/sources/devto.py`

**API:** `https://dev.to/api/articles`

**Implementation:**
```python
import httpx
from .base import BaseSourceManager, Signal

class DevtoCollector(BaseSourceManager):
    """Search Dev.to for articles discussing tools."""
    
    def name(self) -> str:
        return "devto"
    
    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])
        
        for kw in keywords[:3]:
            try:
                r = httpx.get(
                    f"https://dev.to/api/articles?tag={kw}&per_page=10",
                    timeout=10
                )
                if r.status_code == 200:
                    articles = r.json()
                    for article in articles:
                        title = article.get("title", "")
                        desc = article.get("description", "")
                        text = f"{title} {desc}"
                        
                        signals.append(Signal(
                            source="devto",
                            source_url=article.get("url", ""),
                            author_username=article.get("user", {}).get("username", "unknown"),
                            text=text[:1000],
                            metadata={
                                "reactions": article.get("positive_reactions_count", 0),
                                "comments": article.get("comments_count", 0)
                            }
                        ))
            except Exception as e:
                print(f"Dev.to error: {e}")
        
        return signals
```

---

## Update Orchestrator

**File:** `api/app/engines/collector/orchestrator.py`

Add the new sources:

```python
from .sources.indiehackers import IndieHackersCollector
from .sources.lobsters import LobstersCollector
from .sources.devto import DevtoCollector

class CollectorEngine:
    def __init__(self):
        self.sources = [
            HNSourceManager(),
            IndieHackersCollector(),
            LobstersCollector(),
            DevtoCollector(),
            ExaSourceManager(),
            TwitterSourceManager(),
            LinkedInSourceManager(),
        ]
```

---

## Test Commands

After implementation, verify:
```bash
cd api
PYTHONPATH=. python -c "
import asyncio
from app.engines.collector import CollectorEngine
engine = CollectorEngine()
result = asyncio.run(engine.collect_for_product({
    'name': 'Test',
    'description': 'Scheduling tool',
    'keywords': ['scheduling', 'calendar'],
    'competitor_names': ['Calendly'],
    'subreddit_list': ['SaaS']
}))
print(f'Total: {result[\"total_unique\"]}')
for source, stats in result['source_stats'].items():
    print(f'  {source}: {stats[\"count\"]}')
"
```

Expected: All sources return signals (except Reddit/Twitter stubs).

---

## Git Commit

```bash
git add .
git commit -m "feat: add IndieHackers, Lobste.rs, and Dev.to collectors"
```
