"""
Reddit RSS Collector - Based on OpenMagpie pattern.

Key insight: Reddit blocks .json endpoints but .rss works.
This collector uses RSS feeds for reliable, free Reddit access.
"""

import re
import time
import logging
import asyncio
from datetime import UTC, datetime, timedelta
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
        # We will instantiate AsyncClient per request to avoid session conflicts in multi-threaded environments
        pass
    
    async def collect(self, product: dict) -> list[Signal]:
        """Collect signals from Reddit via RSS."""
        signals = []
        subreddits = product.get("subreddit_list", ["SaaS", "startups"])
        keywords = product.get("keywords", [])
        
        # Use combined multi-reddit URL (reduces requests)
        # Cap at 5 subreddits to stay under URL length limit
        slug = "+".join(subreddits[:5])
        url = f"https://www.reddit.com/r/{slug}/new/.rss"
        
        async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": REDDIT_USER_AGENT}) as client:
            for attempt in range(MAX_RATE_LIMIT_RETRIES):
                try:
                    r = await client.get(url, params={"limit": PAGE_SIZE})
                    
                    # Handle rate limiting
                    if r.status_code == 429:
                        delay = self._get_delay(r, attempt)
                        logger.info(f"Reddit rate limited, waiting {delay:.0f}s (attempt {attempt + 1})")
                        await asyncio.sleep(delay)
                        continue
                    
                    r.raise_for_status()
                    
                    # Parse RSS feed
                    posts = self._parse_rss(r.text, keywords, product.get("timeframe_hours", 24))
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
    
    def _parse_rss(self, xml_text: str, keywords: list[str], timeframe_hours: int = 24) -> list[Signal]:
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
            
            # Check if post age is within our monitoring timeframe window
            if datetime.now(UTC) - occurred_at > timedelta(hours=timeframe_hours):
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

        # PROMOTIONAL patterns — these are builders/promoters, NOT buyers
        # Check these FIRST to catch "Looking for beta testers", "I built X", etc.
        promotional_patterns = [
            r"i built", r"i made", r"i created", r"i launched",
            r"check out", r"my product", r"my app", r"my saas",
            r"just launched", r"introducing", r"announcing",
            r"beta users", r"beta testers", r"early access",
            r"join waitlist", r"sign up",
            r"10 best", r"top 10", r"list of", r"comparison of",
            r"looking for.*beta",
            r"looking for.*testers",
            r"what (saas|tool|app) (do you|should i|would)",
            r"what do you wish",
            r"ideas? to get money",
            r"co-founder wanted",
            r"looking for (a )?(full[- ]?stack|developer|engineer|technical)",
        ]
        for pattern in promotional_patterns:
            if re.search(pattern, text_lower):
                return {"type": "promotional", "score": 15}

        # STRONG BUYER signals — actively looking to buy
        strong_buyer_patterns = [
            r"looking for (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"need (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"anyone know (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"recommend (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"alternative to",
            r"switching from",
            r"frustrated with",
            r"ready to buy",
            r"budget approved",
            r"what do you use for",
            r"what'?s the best",
            r"help me find",
        ]
        for pattern in strong_buyer_patterns:
            if re.search(pattern, text_lower):
                return {"type": "strong", "score": 80}

        # MEDIUM BUYER signals — considering options
        medium_buyer_patterns = [
            r"considering",
            r"comparing",
            r"has anyone tried",
            r"evaluating",
            r"worth it",
            r"how do you handle",
        ]
        for pattern in medium_buyer_patterns:
            if re.search(pattern, text_lower):
                return {"type": "medium", "score": 60}

        # WEAK signals — just discussing
        weak_signals = [
            "looking for", "need", "anyone know", "recommend",
        ]
        for phrase in weak_signals:
            if phrase in text_lower:
                return {"type": "weak", "score": 45}

        return {"type": "none", "score": 0}
    
    def _extract_subreddit(self, url: str) -> str:
        """Extract subreddit name from URL."""
        match = re.search(r'reddit\.com/r/(\w+)', url)
        return match.group(1) if match else "unknown"
