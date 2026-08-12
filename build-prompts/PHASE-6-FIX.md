# Phase 6 Update: Full Post Content + Better Scoring

> Feed this to Command Code along with PHASE-6-SCORING.md

---

## Additional Fix: Full Post Content

The current collector truncates posts to 1000 chars and includes HTML. We need:

1. **Full post content** (not truncated)
2. **Clean text** (no HTML tags)
3. **Better data for scoring**

---

## Fix 1: Update Signal Model

**File:** `api/app/engines/collector/sources/base.py`

Make sure Signal model stores full content:

```python
@dataclass
class Signal:
    source: str
    source_url: str
    author_username: str
    text: str  # Full post content (not truncated)
    posted_at: datetime
    metadata: dict = field(default_factory=dict)
    dedup_key: str = ""
```

---

## Fix 2: Update Reddit RSS Collector

**File:** `api/app/engines/collector/sources/reddit_rss.py`

Store full content and clean HTML:

```python
def _parse_rss(self, xml_text: str, keywords: list[str]) -> list[Signal]:
    """Parse Reddit RSS feed and extract signals."""
    signals = []
    
    parsed = feedparser.parse(xml_text)
    
    if not parsed.entries and not getattr(parsed, "version", ""):
        return signals
    
    for entry in parsed.entries:
        title = entry.get("title", "")
        content = entry.get("summary", "")
        link = entry.get("link", "")
        author = entry.get("author", "unknown")
        
        # Clean HTML tags from content
        import re
        clean_content = re.sub(r'<[^>]+>', '', content)
        clean_content = clean_content.replace('<!-- SC_OFF -->', '').replace('<!-- SC_ON -->', '')
        clean_content = clean_content.strip()
        
        # Combine title + full content (NOT truncated)
        full_text = f"{title}\n\n{clean_content}" if clean_content else title
        
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
        
        subreddit = self._extract_subreddit(link)
        
        signals.append(Signal(
            source="reddit",
            source_url=link,
            author_username=author,
            text=full_text,  # FULL content, not truncated
            posted_at=occurred_at,
            metadata={
                "subreddit": subreddit,
                "intent_type": intent["type"],
                "intent_score": intent["score"],
            }
        ))
    
    return signals
```

---

## Fix 3: Update Exa Collectors

**File:** `api/app/engines/collector/sources/exa_reddit.py`

Store full content from Exa:

```python
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
                num_results=10,  # Get more results
                contents={"highlights": True, "text": True}  # Get full text
            )
            for result in results.results:
                if "reddit.com" in result.url or "reddit" in (result.title or "").lower():
                    # Use full text if available, otherwise title
                    full_text = result.text or result.title or ""
                    
                    signals.append(Signal(
                        source="reddit",
                        source_url=result.url,
                        author_username="unknown",
                        text=full_text,  # FULL content
                        posted_at=datetime.now(),
                        metadata={
                            "via": "exa_semantic",
                            "title": result.title or "",
                        }
                    ))
        except Exception as e:
            print(f"Exa Reddit error: {e}")
    
    return signals
```

---

## Fix 4: Update Lead Detail Page

**File:** `frontend/src/app/dashboard/leads/[leadId]/page.tsx`

Show full post content (not truncated):

```tsx
{/* Post Content */}
<div className="bg-gray-900 p-4 rounded mb-6">
  <h2 className="text-sm font-medium text-gray-400 mb-2">Full Post</h2>
  <p className="text-white whitespace-pre-wrap">{lead.text}</p>
</div>
```

---

## What This Fixes

```
BEFORE:
├── Post: "New to B2B sales..." (truncated, 100 chars)
├── HTML tags visible
└── Can't read full context

AFTER:
├── Post: Full content (500+ chars)
├── Clean text (no HTML)
└── Can read full context for better outreach
```

---

## Git Commit

```bash
git add .
git commit -m "feat: full post content + clean HTML + better scoring"
```
