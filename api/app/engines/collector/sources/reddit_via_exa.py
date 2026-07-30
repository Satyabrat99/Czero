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

        queries = self._build_queries(keywords, competitors, description)

        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    type="auto",
                    num_results=15,
                    include_domains=["reddit.com", "old.reddit.com"],
                    start_published_date=(datetime.now() - timedelta(days=7)).isoformat(),
                    contents={"highlights": True}
                )

                for result in results.results:
                    intent = self._detect_intent(result.text or "")
                    if intent["score"] < 30:
                        continue

                    username = self._extract_username(result.url)

                    signal = Signal(
                        source="reddit",
                        source_url=result.url,
                        author_username=username,
                        text=result.text or result.title or "",
                        posted_at=result.published_date,
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

        for kw in keywords[:5]:
            queries.append(f'site:reddit.com ("{kw}" OR "{kw} alternative" OR "{kw} recommendation")')

        for comp in competitors[:3]:
            queries.append(f'site:reddit.com ("{comp}" AND ("alternative" OR "switching" OR "better than"))')

        queries.append(f'site:reddit.com ("looking for" OR "recommend" OR "need") {description[:50]}')

        if keywords:
            queries.append(f'site:reddit.com ("frustrated" OR "hate" OR "tired of" OR "done with") {keywords[0]}')

        queries.append(f'site:reddit.com ("anyone know" OR "what do you use" OR "what\'s the best") {keywords[0] if keywords else description[:30]}')

        return queries

    def _detect_intent(self, text: str) -> dict:
        """Detect buying intent in Reddit post text."""
        text_lower = text.lower()

        strong_signals = [
            "recommend", "alternative to", "looking for", "anyone know",
            "need", "suggestion", "what do you use", "what's the best"
        ]

        moderate_signals = [
            "switching from", "frustrated", "better than", "worth it",
            "help me find", "suggestion for", "advice on"
        ]

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
        match = re.search(r'reddit\.com/user/(\w+)', url)
        if match:
            return match.group(1)
        match = re.search(r'/comments/\w+/.*?/(\w+)/', url)
        if match:
            return match.group(1)
        return "unknown"
