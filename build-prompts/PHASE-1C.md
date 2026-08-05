# Phase 1C: Add Exa Semantic Sources (Reddit, Twitter, ProductHunt, Quora)

> Feed this to Command Code after Phase 1B. This adds Exa-based collectors for restricted platforms.

---

## Task

Add 4 new source collectors that use Exa semantic search to find content from restricted platforms (Reddit, Twitter, ProductHunt, Quora).

---

## Context

Read these files first:
- `api/app/engines/collector/sources/base.py` — Base class
- `api/app/engines/collector/sources/exa.py` — Existing Exa implementation

---

## How Exa Works for This

Exa doesn't directly access Reddit/Twitter APIs. Instead, it:
1. Indexes content from across the web
2. Finds blog posts, articles, discussions that MENTION these platforms
3. Returns URLs and content

So we search Exa for: "Reddit post about scheduling tool" → Exa finds blog posts that discuss Reddit posts about scheduling.

This is not perfect, but it gives us signals from these platforms without needing API access.

---

## New Sources to Create

### 1. Exa Reddit Collector

**File:** `api/app/engines/collector/sources/exa_reddit.py`

```python
import os
from exa_py import Exa
from .base import BaseSourceManager, Signal

class ExaRedditCollector(BaseSourceManager):
    """Find Reddit content via Exa semantic search."""
    
    def name(self) -> str:
        return "reddit"
    
    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None
    
    async def collect(self, product: dict) -> list[Signal]:
        if not self.exa:
            return []
        
        signals = []
        keywords = product.get("keywords", [])
        competitors = product.get("competitor_names", [])
        
        queries = []
        for kw in keywords[:3]:
            queries.append(f"Reddit {kw} recommendation")
        for comp in competitors[:2]:
            queries.append(f"Reddit {comp} alternative")
        
        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    num_results=5,
                    contents={"highlights": True}
                )
                for result in results.results:
                    if "reddit.com" in result.url or "reddit" in (result.title or "").lower():
                        signals.append(Signal(
                            source="reddit",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"}
                        ))
            except Exception as e:
                print(f"Exa Reddit error: {e}")
        
        return signals
```

### 2. Exa Twitter Collector

**File:** `api/app/engines/collector/sources/exa_twitter.py`

```python
import os
from exa_py import Exa
from .base import BaseSourceManager, Signal

class ExaTwitterCollector(BaseSourceManager):
    """Find Twitter content via Exa semantic search."""
    
    def name(self) -> str:
        return "twitter"
    
    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None
    
    async def collect(self, product: dict) -> list[Signal]:
        if not self.exa:
            return []
        
        signals = []
        keywords = product.get("keywords", [])
        
        queries = [f"Twitter {kw} recommendation" for kw in keywords[:3]]
        
        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    num_results=5,
                    contents={"highlights": True}
                )
                for result in results.results:
                    if "twitter.com" in result.url or "x.com" in result.url:
                        signals.append(Signal(
                            source="twitter",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"}
                        ))
            except Exception as e:
                print(f"Exa Twitter error: {e}")
        
        return signals
```

### 3. Exa ProductHunt Collector

**File:** `api/app/engines/collector/sources/exa_producthunt.py`

```python
import os
from exa_py import Exa
from .base import BaseSourceManager, Signal

class ExaProductHuntCollector(BaseSourceManager):
    """Find ProductHunt discussions via Exa semantic search."""
    
    def name(self) -> str:
        return "producthunt"
    
    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None
    
    async def collect(self, product: dict) -> list[Signal]:
        if not self.exa:
            return []
        
        signals = []
        keywords = product.get("keywords", [])
        competitors = product.get("competitor_names", [])
        
        queries = []
        for kw in keywords[:2]:
            queries.append(f"ProductHunt {kw} alternative")
        for comp in competitors[:2]:
            queries.append(f"ProductHunt {comp} alternative")
        
        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    num_results=5,
                    contents={"highlights": True}
                )
                for result in results.results:
                    if "producthunt.com" in result.url:
                        signals.append(Signal(
                            source="producthunt",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"}
                        ))
            except Exception as e:
                print(f"Exa ProductHunt error: {e}")
        
        return signals
```

### 4. Exa Quora Collector

**File:** `api/app/engines/collector/sources/exa_quora.py`

```python
import os
from exa_py import Exa
from .base import BaseSourceManager, Signal

class ExaQuoraCollector(BaseSourceManager):
    """Find Quora answers via Exa semantic search."""
    
    def name(self) -> str:
        return "quora"
    
    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None
    
    async def collect(self, product: dict) -> list[Signal]:
        if not self.exa:
            return []
        
        signals = []
        keywords = product.get("keywords", [])
        
        queries = [f"Quora best {kw}" for kw in keywords[:3]]
        
        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    num_results=5,
                    contents={"highlights": True}
                )
                for result in results.results:
                    if "quora.com" in result.url:
                        signals.append(Signal(
                            source="quora",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"}
                        ))
            except Exception as e:
                print(f"Exa Quora error: {e}")
        
        return signals
```

---

## Update Orchestrator

**File:** `api/app/engines/collector/orchestrator.py`

```python
from .sources.exa_reddit import ExaRedditCollector
from .sources.exa_twitter import ExaTwitterCollector
from .sources.exa_producthunt import ExaProductHuntCollector
from .sources.exa_quora import ExaQuoraCollector

class CollectorEngine:
    def __init__(self):
        self.sources = [
            # Tier 1: Free APIs
            HNSourceManager(),
            IndieHackersCollector(),
            LobstersCollector(),
            DevtoCollector(),
            # Tier 2: Exa Semantic
            ExaRedditCollector(),
            ExaTwitterCollector(),
            ExaProductHuntCollector(),
            ExaQuoraCollector(),
            # Existing
            ExaSourceManager(),
            TwitterSourceManager(),
            LinkedInSourceManager(),
        ]
```

---

## Test Commands

```bash
cd api
PYTHONPATH=. python -c "
import asyncio
from app.engines.collector import CollectorEngine
engine = CollectorEngine()
result = asyncio.run(engine.collect_for_product({
    'name': 'Cal.com',
    'description': 'Scheduling tool',
    'keywords': ['scheduling', 'calendar', 'booking'],
    'competitor_names': ['Calendly'],
    'subreddit_list': ['SaaS']
}))
print(f'Total: {result[\"total_unique\"]}')
for source, stats in result['source_stats'].items():
    if stats['count'] > 0:
        print(f'  {source}: {stats[\"count\"]}')
"
```

Expected: All 9 sources return signals.

---

## Git Commit

```bash
git add .
git commit -m "feat: add Exa semantic collectors for Reddit, Twitter, ProductHunt, Quora"
```
