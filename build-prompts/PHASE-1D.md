# Phase 1D: Reddit RSS Collector (Using OpenMagpie Pattern)

> Feed this to Command Code. This adds reliable Reddit access using RSS feeds with proper rate limit handling.

---

## Context: What We Learned from OpenMagpie

OpenMagpie is an open-source social listening tool that successfully accesses Reddit via RSS feeds. We studied their codebase and found the key patterns to copy:

### Key Discovery

```
Reddit blocks .json endpoints (403)
But .rss endpoints WORK (200 OK)

Example:
├── reddit.com/r/SaaS/new.json → 403 BLOCKED
├── reddit.com/r/SaaS/new/.rss → 200 OK ✅
└── The .rss suffix bypasses the block
```

### Rate Limit Handling (From OpenMagpie)

Reddit rate-limits anonymous RSS access. OpenMagpie handles this with:
- Exponential backoff on 429 errors
- Retry up to 6 times
- Read x-ratelimit-reset header
- Cap delay at 60 seconds

### Constants to Copy

```python
REDDIT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
MAX_RATE_LIMIT_RETRIES = 6
RATE_LIMIT_BACKOFF_BASE_SECONDS = 2.0
RATE_LIMIT_DELAY_CAP_SECONDS = 60.0
PAGE_SIZE = 100
MAX_PAGES = 5
```

---

## Task

Create a new Reddit RSS collector that:
1. Uses RSS feeds (not JSON API)
2. Handles rate limits with exponential backoff
3. Parses posts with feedparser
4. Detects buying intent
5. Integrates with our existing collector engine

---

## File to Create

**File:** `api/app/engines/collector/sources/reddit_rss.py`

```python
"""
Reddit RSS Collector - Based on OpenMagpie pattern.

Key insight: Reddit blocks .json endpoints but .rss works.
This collector uses RSS feeds for reliable, free Reddit access.
"""

import re
import time
import logging
from datetime import UTC, datetime
from typing import Callable

import feedparser
import httpx

from .base import BaseSourceManager, Signal

logger = logging.getLogger("collector")

# Constants from OpenMagpie (proven to work)
REDDIT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
MAX_RATE_LIMIT_RETRIES = 6
RATE_LIMIT_BACKOFF_BASE_SECONDS = 2.0
RATE_LIMIT_DELAY_CAP_SECONDS = 60.0
PAGE_SIZE = 100
MAX_PAGES = 5

# Intent phrases (from our existing pre-filter)
INTENT_PHRASES = [
    "looking for", "need", "anyone know", "recommend",
    "alternative to", "switching from", "frustrated with",
    "better than", "suggestion", "advice", "help me find",
    "what do you use", "what's the best", "how do you",
    "any suggestions", "open to", "ready to buy",
]


class RedditRSSCollector(BaseSourceManager):
    """
    Reddit collector using RSS feeds.
    
    Based on OpenMagpie's Reddit connector pattern.
    Uses .rss endpoints (not .json) which bypass Reddit's blocks.
    Handles rate limits with exponential backoff.
    """
    
    def name(self) -> str:
        return "reddit"
    
    def __init__(self):
        self.client = httpx.Client(
            timeout=15.0,
            headers={"User-Agent": REDDIT_USER_AGENT}
        )
    
    async def collect(self, product: dict) -> list[Signal]:
        """Collect signals from Reddit via RSS."""
        signals = []
        subreddits = product.get("subreddit_list", ["SaaS", "startups"])
        keywords = product.get("keywords", [])
        
        # Use combined multi-reddit URL (reduces requests)
        # Cap at 5 subreddits to stay under URL length limit
        slug = "+".join(subreddits[:5])
        url = f"https://www.reddit.com/r/{slug}/new/.rss"
        
        for attempt in range(MAX_RATE_LIMIT_RETRIES):
            try:
                r = self.client.get(url, params={"limit": PAGE_SIZE})
                
                # Handle rate limiting
                if r.status_code == 429:
                    delay = self._get_delay(r, attempt)
                    logger.info(f"Reddit rate limited, waiting {delay:.0f}s (attempt {attempt + 1})")
                    time.sleep(delay)
                    continue
                
                r.raise_for_status()
                
                # Parse RSS feed
                posts = self._parse_rss(r.text, keywords)
                signals.extend(posts)
                
                break  # Success, exit retry loop
                
            except httpx.HTTPStatusError as e:
                logger.error(f"Reddit HTTP error: {e}")
                break
            except Exception as e:
                logger.error(f"Reddit RSS error: {e}")
                break
        
        return signals
    
    def _get_delay(self, response: httpx.Response, attempt: int) -> float:
        """Calculate delay for rate limit retry (from OpenMagpie)."""
        # Try to read x-ratelimit-reset header
        reset = response.headers.get("x-ratelimit-reset")
        if reset:
            try:
                return min(float(reset), RATE_LIMIT_DELAY_CAP_SECONDS)
            except (ValueError, TypeError):
                pass
        
        # Exponential backoff
        delay = RATE_LIMIT_BACKOFF_BASE_SECONDS * (2 ** attempt)
        return min(delay, RATE_LIMIT_DELAY_CAP_SECONDS)
    
    def _parse_rss(self, xml_text: str, keywords: list[str]) -> list[Signal]:
        """Parse Reddit RSS feed and extract signals."""
        signals = []
        
        parsed = feedparser.parse(xml_text)
        
        # Check for valid feed
        if not parsed.entries and not getattr(parsed, "version", ""):
            logger.warning("Invalid Reddit RSS feed format")
            return signals
        
        for entry in parsed.entries:
            # Extract post data
            title = entry.get("title", "")
            content = entry.get("summary", "")
            link = entry.get("link", "")
            author = entry.get("author", "unknown")
            
            # Combine for full text
            full_text = f"{title}\n\n{content}"
            
            # Check for keyword match
            if not self._matches_keywords(full_text, keywords):
                continue
            
            # Detect buying intent
            intent = self._detect_intent(full_text)
            if intent["score"] < 30:
                continue
            
            # Parse published date
            published = entry.get("published_parsed")
            if isinstance(published, time.struct_time):
                occurred_at = datetime(
                    published.tm_year, published.tm_mon, published.tm_mday,
                    published.tm_hour, published.tm_min, published.tm_sec,
                    tzinfo=UTC
                )
            else:
                continue
            
            # Extract subreddit from URL
            subreddit = self._extract_subreddit(link)
            
            signals.append(Signal(
                source="reddit",
                source_url=link,
                author_username=author,
                text=full_text[:1000],
                posted_at=occurred_at,
                metadata={
                    "subreddit": subreddit,
                    "intent_type": intent["type"],
                    "intent_score": intent["score"],
                }
            ))
        
        return signals
    
    def _matches_keywords(self, text: str, keywords: list[str]) -> bool:
        """Check if text contains any keywords."""
        text_lower = text.lower()
        return any(kw.lower() in text_lower for kw in keywords)
    
    def _detect_intent(self, text: str) -> dict:
        """Detect buying intent in post text."""
        text_lower = text.lower()
        
        for phrase in INTENT_PHRASES:
            if phrase in text_lower:
                return {"type": "strong", "score": 85}
        
        return {"type": "none", "score": 0}
    
    def _extract_subreddit(self, url: str) -> str:
        """Extract subreddit name from URL."""
        match = re.search(r'reddit\.com/r/(\w+)', url)
        return match.group(1) if match else "unknown"
```

---

## Update Orchestrator

**File:** `api/app/engines/collector/orchestrator.py`

Replace the old Reddit collector with the new RSS-based one:

```python
from .sources.reddit_rss import RedditRSSCollector

class CollectorEngine:
    def __init__(self):
        self.sources = [
            RedditRSSCollector(),  # NEW: RSS-based Reddit
            HNSourceManager(),
            ExaSourceManager(),
            # ... other sources
        ]
```

---

## Install Dependencies

```bash
cd api
pip install feedparser
```

---

## Test Commands

After implementation, verify:

```bash
cd api
PYTHONPATH=. python -c "
import asyncio
from app.engines.collector.sources.reddit_rss import RedditRSSCollector

collector = RedditRSSCollector()
product = {
    'name': 'Cal.com',
    'description': 'Scheduling tool',
    'keywords': ['scheduling', 'calendar', 'booking'],
    'subreddit_list': ['SaaS', 'startups']
}

signals = asyncio.run(collector.collect(product))
print(f'Reddit RSS: {len(signals)} signals')
for sig in signals[:3]:
    print(f'  [{sig.metadata.get(\"subreddit\")}] {sig.text[:60]}...')
    print(f'    Intent: {sig.metadata.get(\"intent_type\")}')
    print()
"
```

Expected: 5-20 signals from Reddit (depending on rate limits).

---

## What This Solves

```
BEFORE:
├── Reddit blocked from datacenter (403)
├── No Reddit signals
└── Missing high-intent buyers

AFTER:
├── Reddit via RSS (works!)
├── 5-20 signals per collection
├── Rate limit handling (reliable)
├── Intent detection (filtered)
└── Free forever (no API needed)
```

---

## Git Commit

```bash
git add .
git commit -m "feat: add Reddit RSS collector with rate limit handling"
```
