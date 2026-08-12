import os
import asyncio
from exa_py import AsyncExa
from datetime import datetime, timedelta
from .base import BaseSourceManager, Signal, get_exa_semaphore

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


class ExaSourceManager(BaseSourceManager):
    """
    Exa.ai semantic search — finds signals across the ENTIRE web.
    This is our edge: finds posts that MEAN the same thing but use different words.
    """

    def __init__(self):
        self._exa = None

    def _get_client(self):
        if self._exa is None:
            api_key = os.getenv("EXA_API_KEY")
            if not api_key:
                return None
            self._exa = AsyncExa(api_key=api_key)
        return self._exa

    def name(self) -> str:
        return "exa"

    async def collect(self, product: dict) -> list[Signal]:
        """Semantic search for buying intent signals across the web."""
        exa = self._get_client()
        if not exa:
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

        timeframe_hours = product.get("timeframe_hours", 24)
        start_published_date = (datetime.now() - timedelta(hours=timeframe_hours)).isoformat() + "Z"

        async def run_search(query: str):
            semaphore = get_exa_semaphore()
            async with semaphore:
                try:
                    results = await exa.search(
                        query,
                        type="auto",
                        num_results=10,
                        start_published_date=start_published_date,
                        contents={"highlights": True}
                    )
                    return results.results
                except Exception as e:
                    print(f"Exa error for '{query}': {e}")
                    return []

        search_tasks = [run_search(q) for q in queries]
        results_list = await asyncio.gather(*search_tasks)

        for results in results_list:
            for result in results:
                text = result.text or result.title or ""

                # FILTER: Skip noise
                if is_noise(text):
                    continue

                source = self._detect_source(result.url)

                signal = Signal(
                    source=source,
                    source_url=result.url,
                    author_username=result.author or "unknown",
                    text=text,
                    posted_at=result.published_date,
                    metadata={
                        "exa_score": getattr(result, 'score', None),
                        "domain": result.url.split("/")[2] if "/" in result.url else "",
                    }
                )
                signals.append(signal)

        return signals

    def _detect_source(self, url: str) -> str:
        if "reddit.com" in url:
            return "reddit"
        if "twitter.com" in url or "x.com" in url:
            return "twitter"
        if "linkedin.com" in url:
            return "linkedin"
        if "news.ycombinator.com" in url:
            return "hn"
        return "web"
