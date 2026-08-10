"""Exa Quora collector - finds Quora answers via semantic search."""

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
                results = self.exa.search(query, num_results=5, contents={"highlights": True})
                for result in results.results:
                    if "quora.com" in result.url:
                        signals.append(Signal(
                            source="quora",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"},
                        ))
            except Exception as e:
                print(f"Exa Quora error: {e}")

        return signals
