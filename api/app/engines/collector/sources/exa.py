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
        self._exa = None

    def _get_client(self):
        if self._exa is None:
            api_key = os.getenv("EXA_API_KEY")
            if not api_key:
                return None
            self._exa = Exa(api_key=api_key)
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

        for query in queries:
            try:
                results = exa.search(
                    query,
                    type="auto",
                    num_results=10,
                    start_published_date=(datetime.now() - timedelta(days=7)).isoformat(),
                    contents={"highlights": True}
                )

                for result in results.results:
                    source = self._detect_source(result.url)

                    signal = Signal(
                        source=source,
                        source_url=result.url,
                        author_username=result.author or "unknown",
                        text=result.text or result.title or "",
                        posted_at=result.published_date,
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
        if "reddit.com" in url:
            return "reddit"
        if "twitter.com" in url or "x.com" in url:
            return "twitter"
        if "linkedin.com" in url:
            return "linkedin"
        if "news.ycombinator.com" in url:
            return "hn"
        return "web"
