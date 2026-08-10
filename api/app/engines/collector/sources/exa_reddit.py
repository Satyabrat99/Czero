"""Exa Reddit collector - finds Reddit content via semantic search."""

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

        queries = [f"Reddit {kw} recommendation" for kw in keywords[:3]]
        queries += [f"Reddit {comp} alternative" for comp in competitors[:2]]

        for query in queries:
            try:
                results = self.exa.search(query, num_results=5, contents={"highlights": True})
                for result in results.results:
                    if "reddit.com" in result.url or "reddit" in (result.title or "").lower():
                        signals.append(Signal(
                            source="reddit",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"},
                        ))
            except Exception as e:
                print(f"Exa Reddit error: {e}")

        return signals
