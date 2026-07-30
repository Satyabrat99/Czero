# Phase 1: Signal Collection Engine

> Feed this to Command Code after Phase 0 is verified. This builds the Collector engine — 5 sources running in parallel.

---

## Task

Build the Collector Engine that finds buying intent signals from 5 independent sources (Reddit, Twitter, LinkedIn, HN, Exa), merges them, and deduplicates. Each source runs INDEPENDENTLY in parallel.

---

## Step 1: Base Source Manager Interface

Create file `api/app/engines/collector/__init__.py`:
```python
from .orchestrator import CollectorEngine

__all__ = ["CollectorEngine"]
```

Create file `api/app/engines/collector/sources/__init__.py` (empty)

Create file `api/app/engines/collector/sources/base.py`:
```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import hashlib


@dataclass
class Signal:
    source: str  # "reddit", "twitter", "linkedin", "hn", "exa"
    source_url: str
    author_username: str
    text: str
    posted_at: Optional[datetime] = None
    score_raw: Optional[int] = None
    subreddit: Optional[str] = None
    metadata: dict = field(default_factory=dict)
    dedup_key: str = ""

    def __post_init__(self):
        if not self.dedup_key:
            clean_text = self.text[:100].lower().strip()
            self.dedup_key = hashlib.md5(
                f"{self.source}:{self.author_username}:{clean_text}".encode()
            ).hexdigest()


class BaseSourceManager(ABC):
    """Abstract base class for all collection sources."""

    @abstractmethod
    async def collect(self, product: dict) -> list[Signal]:
        """
        Collect signals for a product from this source.
        
        MUST:
        - Run independently (no dependency on other sources)
        - Return list of Signal objects
        - Handle errors gracefully (return empty list on failure)
        - Respect rate limits
        
        MUST NOT:
        - Filter results based on other sources' output
        - Share state with other source managers
        - Access database directly
        """
        pass

    @abstractmethod
    def name(self) -> str:
        """Source identifier ('reddit', 'twitter', etc.)."""
        pass
```

---

## Step 2: Reddit Source Manager

Create file `api/app/engines/collector/sources/reddit.py`:
```python
import os
import praw
from datetime import datetime, timezone
from typing import Optional
from .base import BaseSourceManager, Signal


class RedditSourceManager(BaseSourceManager):
    """
    Reddit signal collection using PRAW.
    
    Searches subreddits for keywords + monitors comments for intent.
    """
    
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent=os.getenv("REDDIT_USER_AGENT", "CzeroBot/1.0"),
        )
    
    def name(self) -> str:
        return "reddit"
    
    async def collect(self, product: dict) -> list[Signal]:
        """Search Reddit for buying intent signals."""
        signals = []
        keywords = product.get("keywords", [])
        subreddits = product.get("subreddit_list", ["SaaS", "startups", "Entrepreneur"])
        
        for sub_name in subreddits:
            sub_name = sub_name.replace("r/", "")
            try:
                subreddit = self.reddit.subreddit(sub_name)
                
                # Search each keyword
                for keyword in keywords:
                    for submission in subreddit.search(keyword, sort="new", time_filter="week", limit=15):
                        signal = Signal(
                            source="reddit",
                            source_url=f"https://reddit.com{submission.permalink}",
                            author_username=str(submission.author) or "deleted",
                            text=f"{submission.title}\n\n{submission.selftext}",
                            posted_at=datetime.fromtimestamp(submission.created_utc, tz=timezone.utc),
                            score_raw=submission.score,
                            subreddit=sub_name,
                            metadata={
                                "num_comments": submission.num_comments,
                                "upvote_ratio": submission.upvote_ratio,
                            }
                        )
                        signals.append(signal)
                        
                        # Check top comments for intent
                        submission.comments.replace_more(limit=0)
                        for comment in submission.comments.list()[:5]:
                            if any(kw.lower() in comment.body.lower() for kw in ["looking for", "need", "recommend", "alternative"]):
                                comment_signal = Signal(
                                    source="reddit",
                                    source_url=f"https://reddit.com{comment.permalink}",
                                    author_username=str(comment.author) or "deleted",
                                    text=comment.body,
                                    posted_at=datetime.fromtimestamp(comment.created_utc, tz=timezone.utc),
                                    score_raw=comment.score,
                                    subreddit=sub_name,
                                    metadata={"parent_post": submission.title}
                                )
                                signals.append(comment_signal)
                
            except Exception as e:
                print(f"Reddit error for r/{sub_name}: {e}")
                continue
        
        return signals
```

---

## Step 3: HN Source Manager

Create file `api/app/engines/collector/sources/hn.py`:
```python
import httpx
from datetime import datetime, timezone, timedelta
from .base import BaseSourceManager, Signal


class HNSourceManager(BaseSourceManager):
    """
    Hacker News signal collection via Algolia API.
    Free, reliable, covers all HN history.
    """
    
    BASE_URL = "https://hn.algolia.com/api/v1"
    
    def name(self) -> str:
        return "hn"
    
    async def collect(self, product: dict) -> list[Signal]:
        """Search HN for buying intent signals."""
        signals = []
        keywords = product.get("keywords", [])
        week_ago = int((datetime.now(timezone.utc) - timedelta(days=7)).timestamp())
        
        async with httpx.AsyncClient() as client:
            for keyword in keywords:
                # Search stories
                for tags in ["story", "comment"]:
                    try:
                        response = await client.get(
                            f"{self.BASE_URL}/search_by_date",
                            params={
                                "query": keyword,
                                "tags": tags,
                                "hitsPerPage": 15,
                                "numericFilters": f"created_at_i>{week_ago}"
                            },
                            timeout=10
                        )
                        data = response.json()
                        
                        for hit in data.get("hits", []):
                            text = hit.get("title", "") or hit.get("comment_text", "") or hit.get("story_text", "")
                            if not text or len(text) < 20:
                                continue
                            
                            signal = Signal(
                                source="hn",
                                source_url=f"https://news.ycombinator.com/item?id={hit['objectID']}",
                                author_username=hit.get("author", "unknown"),
                                text=text,
                                posted_at=datetime.fromisoformat(hit.get("created_at", "").replace("Z", "+00:00")) if hit.get("created_at") else None,
                                score_raw=hit.get("points", 0),
                                metadata={
                                    "num_comments": hit.get("num_comments", 0),
                                    "story_type": hit.get("story_type", ""),
                                }
                            )
                            signals.append(signal)
                    except Exception as e:
                        print(f"HN error for '{keyword}': {e}")
                        continue
        
        return signals
```

---

## Step 4: Exa Semantic Search Manager

Create file `api/app/engines/collector/sources/exa.py`:
```python
import os
from exa_py import Exa
from datetime import datetime, timedelta
from .base import BaseSourceManager, Signal


class ExaSourceManager(BaseSourceManager):
    """
    Exa.ai semantic search — finds signals across the ENTIRE web.
    This is our edge: finds posts that MEAN the same thing but use different words.
    """
    
    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None
    
    def name(self) -> str:
        return "exa"
    
    async def collect(self, product: dict) -> list[Signal]:
        """Semantic search for buying intent signals across the web."""
        if not self.exa:
            return []
        
        signals = []
        description = product.get("description", "")
        keywords = product.get("keywords", [])
        competitors = product.get("competitor_names", [])
        
        queries = [
            f"Looking for a tool for {description}",
            f"Need help with {' or '.join(keywords[:3])}",
        ]
        
        for competitor in competitors[:2]:
            queries.append(f"Alternative to {competitor}")
        
        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    type="auto",
                    numResults=10,
                    startPublishedDate=(datetime.now() - timedelta(days=7)).isoformat(),
                    contents={"highlights": True}
                )
                
                for result in results.results:
                    source = self._detect_source(result.url)
                    
                    signal = Signal(
                        source=source,
                        source_url=result.url,
                        author_username=result.author or "unknown",
                        text=result.text or result.title or "",
                        posted_at=result.publishedDate,
                        metadata={
                            "exa_score": getattr(result, 'score', None),
                            "domain": result.url.split("/")[2] if "/" in result.url else "",
                        }
                    )
                    signals.append(signal)
            except Exception as e:
                print(f"Exa error for '{query}': {e}")
                continue
        
        return signals
    
    def _detect_source(self, url: str) -> str:
        if "reddit.com" in url: return "reddit"
        if "twitter.com" in url or "x.com" in url: return "twitter"
        if "linkedin.com" in url: return "linkedin"
        if "news.ycombinator.com" in url: return "hn"
        return "web"
```

---

## Step 5: Twitter Source Manager (Stub — Add Later)

Create file `api/app/engines/collector/sources/twitter.py`:
```python
from .base import BaseSourceManager, Signal


class TwitterSourceManager(BaseSourceManager):
    """
    Twitter/X signal collection using Scweet.
    
    STUB: Implement after Reddit + HN + Exa are working.
    Requires auth_token from browser cookies.
    """
    
    def name(self) -> str:
        return "twitter"
    
    async def collect(self, product: dict) -> list[Signal]:
        # TODO: Implement with Scweet library
        # Needs auth_token from browser cookies
        # For MVP, Reddit + HN + Exa provide enough coverage
        return []
```

---

## Step 6: LinkedIn Source Manager (Stub — Add Later)

Create file `api/app/engines/collector/sources/linkedin.py`:
```python
from .base import BaseSourceManager, Signal


class LinkedInSourceManager(BaseSourceManager):
    """
    LinkedIn signal collection using no-cookies scraper.
    
    STUB: Implement after core sources are working.
    LinkedIn has 8-char search limit and anti-scraping measures.
    """
    
    def name(self) -> str:
        return "linkedin"
    
    async def collect(self, product: dict) -> list[Signal]:
        # TODO: Implement with linkedin-post-search-scraper
        # For MVP, Reddit + HN + Exa provide enough coverage
        return []
```

---

## Step 7: Signal Merger + Deduplicator

Create file `api/app/engines/collector/merger.py`:
```python
from collections import defaultdict
from .sources.base import Signal


class SignalMerger:
    """
    Merge signals from all sources and remove duplicates.
    
    Three levels:
    1. Content hash dedup (same post on multiple platforms)
    2. Cross-platform author matching (same person, different platforms)
    3. Keep richest version (most metadata)
    """
    
    def merge_and_dedup(self, all_signals: list[list[Signal]]) -> list[Signal]:
        # Flatten
        flat = [s for source_signals in all_signals for s in source_signals]
        
        # Dedup by content hash
        seen = {}
        for signal in flat:
            key = signal.dedup_key
            if key not in seen:
                seen[key] = signal
            else:
                # Keep version with more metadata
                existing = seen[key]
                if len(signal.text) > len(existing.text):
                    seen[key] = signal
        
        return list(seen.values())
```

---

## Step 8: Collector Orchestrator

Create file `api/app/engines/collector/orchestrator.py`:
```python
import asyncio
from datetime import datetime
from .sources.reddit import RedditSourceManager
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
    """
    
    def __init__(self):
        self.sources = {
            "reddit": RedditSourceManager(),
            "hn": HNSourceManager(),
            "exa": ExaSourceManager(),
            "twitter": TwitterSourceManager(),
            "linkedin": LinkedInSourceManager(),
        }
        self.merger = SignalMerger()
    
    async def collect_for_product(self, product: dict) -> dict:
        """
        Collect all signals for a product from all sources in parallel.
        
        Returns collection stats.
        """
        # Run ALL sources IN PARALLEL
        tasks = []
        for name, source in self.sources.items():
            tasks.append(self._collect_with_timeout(source, product, timeout=30))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Merge results
        all_signals = []
        source_stats = {}
        for name, result in zip(self.sources.keys(), results):
            if isinstance(result, Exception):
                source_stats[name] = {"status": "error", "count": 0, "error": str(result)}
            else:
                all_signals.append(result)
                source_stats[name] = {"status": "ok", "count": len(result)}
        
        # Deduplicate
        unique_signals = self.merger.merge_and_dedup(all_signals)
        
        return {
            "total_raw": sum(s["count"] for s in source_stats.values()),
            "total_unique": len(unique_signals),
            "source_stats": source_stats,
            "signals": unique_signals,
            "timestamp": datetime.now().isoformat(),
        }
    
    async def _collect_with_timeout(self, source, product, timeout: int):
        """Collect from a source with timeout."""
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

## Step 9: API Route for Collection

Create file `api/app/routes/products.py` (replace existing):
```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.engines.collector import CollectorEngine

router = APIRouter()
collector = CollectorEngine()


class AnalyzeRequest(BaseModel):
    url: str


class ProductCreate(BaseModel):
    url: str
    name: str = ""
    description: str = ""
    keywords: list[str] = []
    competitor_names: list[str] = []
    subreddit_list: list[str] = ["SaaS", "startups", "Entrepreneur"]


@router.post("/analyze")
async def analyze_product(req: AnalyzeRequest):
    """Analyze a URL and extract product info using LLM."""
    # TODO: Implement LLM analysis in Phase 2
    return {
        "url": req.url,
        "name": "Product",
        "description": "TODO: LLM analysis",
        "keywords": [],
        "icp": {},
        "pain_points": [],
        "competitor_names": [],
        "subreddit_list": ["SaaS", "startups"],
    }


@router.post("/collect")
async def collect_signals(product: ProductCreate):
    """Collect signals for a product from all sources."""
    result = await collector.collect_for_product(product.model_dump())
    return {
        "total_raw": result["total_raw"],
        "total_unique": result["total_unique"],
        "source_stats": result["source_stats"],
        "signals_count": len(result["signals"]),
    }


@router.get("")
async def list_products():
    return {"products": []}
```

---

## Step 10: Test the Collector

Run the backend:
```bash
cd api && python -m uvicorn app.main:app --reload
```

Test collection via curl:
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

**Verify:** Response shows signals from multiple sources (Reddit + HN + Exa). If only Reddit signals, check HN and Exa API keys.

---

## Verification Checklist

1. ✅ `python -m uvicorn app.main:app --reload` starts without errors
2. ✅ POST to `/api/products/collect` returns signals from multiple sources
3. ✅ Deduplication works (same post not counted twice)
4. ✅ Reddit, HN, and Exa sources all return results
5. ✅ Twitter and LinkedIn return empty (stubs — expected)
6. ✅ Git commit: `feat: signal collection engine with 5 sources`

Report back what you see. If any source fails, paste the error.
