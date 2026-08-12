# Phase 6 Update: Fresh Content Only (Last 24 Hours)

> Feed this to Command Code. This ensures we only find fresh signals, not old content.

---

## Problem

Exa returns old content (3-7 days old). By the time we find it, the conversation is dead.

```
CURRENT:
├── Exa finds: "Looking for lead gen tool" (posted 5 days ago)
├── User already signed up for competitor
├── Reply now → Too late
└── Conversion: LOW

IDEAL:
├── Exa finds: "Looking for lead gen tool" (posted 2 hours ago)
├── User still deciding
├── Reply now → High conversion
└── Conversion: HIGH
```

---

## Task

Add date filtering to all sources to only get fresh content (last 24 hours).

---

## Fix 1: Update Exa Source Manager

**File:** `api/app/engines/collector/sources/exa.py`

Add date filter to only get posts from last 24 hours:

```python
from datetime import datetime, timedelta

async def collect(self, product: dict) -> list[Signal]:
    if not self.exa:
        return []
    
    signals = []
    keywords = product.get("keywords", [])
    competitors = product.get("competitor_names", [])
    
    # Build queries
    queries = []
    for kw in keywords[:3]:
        queries.append(f"looking for {kw}")
        queries.append(f"{kw} recommendation")
    for comp in competitors[:2]:
        queries.append(f"{comp} alternative")
        queries.append(f"alternative to {comp}")
    
    # Date filter: last 24 hours only
    start_date = (datetime.now() - timedelta(hours=24)).isoformat()
    
    for query in queries:
        try:
            results = self.exa.search(
                query,
                num_results=10,
                start_published_date=start_date,  # LAST 24 HOURS ONLY
                contents={"highlights": True}
            )
            for result in results.results:
                # Skip if too old
                if result.published_date:
                    try:
                        pub_date = datetime.fromisoformat(result.published_date.replace('Z', '+00:00'))
                        if pub_date < datetime.now().astimezone() - timedelta(hours=24):
                            continue  # Skip old posts
                    except:
                        pass
                
                signals.append(Signal(
                    source="web",
                    source_url=result.url,
                    author_username="unknown",
                    text=result.text or result.title or "",
                    posted_at=result.published_date or datetime.now().isoformat(),
                    metadata={
                        "title": result.title or "",
                        "via": "exa_semantic"
                    }
                ))
        except Exception as e:
            print(f"Exa error: {e}")
    
    return signals
```

---

## Fix 2: Update Exa Reddit Collector

**File:** `api/app/engines/collector/sources/exa_reddit.py`

Add date filter:

```python
from datetime import datetime, timedelta

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
    
    # Date filter: last 24 hours only
    start_date = (datetime.now() - timedelta(hours=24)).isoformat()
    
    for query in queries:
        try:
            results = self.exa.search(
                query,
                num_results=10,
                start_published_date=start_date,  # LAST 24 HOURS ONLY
                contents={"highlights": True}
            )
            for result in results.results:
                if "reddit.com" in result.url or "reddit" in (result.title or "").lower():
                    signals.append(Signal(
                        source="reddit",
                        source_url=result.url,
                        author_username="unknown",
                        text=result.text or result.title or "",
                        posted_at=result.published_date or datetime.now().isoformat(),
                        metadata={"via": "exa_semantic"}
                    ))
        except Exception as e:
            print(f"Exa Reddit error: {e}")
    
    return signals
```

---

## Fix 3: Update Exa Twitter Collector

**File:** `api/app/engines/collector/sources/exa_twitter.py`

Add date filter:

```python
from datetime import datetime, timedelta

async def collect(self, product: dict) -> list[Signal]:
    if not self.exa:
        return []
    
    signals = []
    keywords = product.get("keywords", [])
    
    queries = [f"Twitter {kw} recommendation" for kw in keywords[:3]]
    
    # Date filter: last 24 hours only
    start_date = (datetime.now() - timedelta(hours=24)).isoformat()
    
    for query in queries:
        try:
            results = self.exa.search(
                query,
                num_results=10,
                start_published_date=start_date,  # LAST 24 HOURS ONLY
                contents={"highlights": True}
            )
            for result in results.results:
                if "twitter.com" in result.url or "x.com" in result.url:
                    signals.append(Signal(
                        source="twitter",
                        source_url=result.url,
                        author_username="unknown",
                        text=result.text or result.title or "",
                        posted_at=result.published_date or datetime.now().isoformat(),
                        metadata={"via": "exa_semantic"}
                    ))
        except Exception as e:
            print(f"Exa Twitter error: {e}")
    
    return signals
```

---

## Fix 4: Update Exa ProductHunt Collector

**File:** `api/app/engines/collector/sources/exa_producthunt.py`

Add date filter:

```python
from datetime import datetime, timedelta

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
    
    # Date filter: last 24 hours only
    start_date = (datetime.now() - timedelta(hours=24)).isoformat()
    
    for query in queries:
        try:
            results = self.exa.search(
                query,
                num_results=10,
                start_published_date=start_date,  # LAST 24 HOURS ONLY
                contents={"highlights": True}
            )
            for result in results.results:
                if "producthunt.com" in result.url:
                    signals.append(Signal(
                        source="producthunt",
                        source_url=result.url,
                        author_username="unknown",
                        text=result.text or result.title or "",
                        posted_at=result.published_date or datetime.now().isoformat(),
                        metadata={"via": "exa_semantic"}
                    ))
        except Exception as e:
            print(f"Exa ProductHunt error: {e}")
    
    return signals
```

---

## Fix 5: Update Exa Quora Collector

**File:** `api/app/engines/collector/sources/exa_quora.py`

Add date filter:

```python
from datetime import datetime, timedelta

async def collect(self, product: dict) -> list[Signal]:
    if not self.exa:
        return []
    
    signals = []
    keywords = product.get("keywords", [])
    
    queries = [f"Quora best {kw}" for kw in keywords[:3]]
    
    # Date filter: last 24 hours only
    start_date = (datetime.now() - timedelta(hours=24)).isoformat()
    
    for query in queries:
        try:
            results = self.exa.search(
                query,
                num_results=10,
                start_published_date=start_date,  # LAST 24 HOURS ONLY
                contents={"highlights": True}
            )
            for result in results.results:
                if "quora.com" in result.url:
                    signals.append(Signal(
                        source="quora",
                        source_url=result.url,
                        author_username="unknown",
                        text=result.text or result.title or "",
                        posted_at=result.published_date or datetime.now().isoformat(),
                        metadata={"via": "exa_semantic"}
                    ))
        except Exception as e:
            print(f"Exa Quora error: {e}")
    
    return signals
```

---

## What This Fixes

```
BEFORE:
├── Exa returns: "Looking for lead gen tool" (posted 5 days ago)
├── User already signed up for competitor
├── Reply now → Too late
└── Conversion: LOW

AFTER:
├── Exa returns: "Looking for lead gen tool" (posted 2 hours ago)
├── User still deciding
├── Reply now → High conversion
└── Conversion: HIGH
```

---

## Freshness by Source (After Fix)

| Source | Before | After |
|--------|--------|-------|
| Reddit RSS | 0-48 hours | 0-48 hours ✅ |
| HN Algolia | 0-24 hours | 0-24 hours ✅ |
| Exa | 3-7 days old | **0-24 hours** ✅ |
| Dev.to | 0-7 days | 0-7 days ✅ |
| Lobste.rs | 0-24 hours | 0-24 hours ✅ |

---

## Git Commit

```bash
git add .
git commit -m "feat: filter all sources to last 24 hours only"
```
