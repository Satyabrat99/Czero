"""Exa ProductHunt collector - finds ProductHunt discussions via semantic search."""

import os
from datetime import datetime, timedelta
from exa_py import Exa
from .base import BaseSourceManager, Signal


class ExaProductHuntCollector(BaseSourceManager):
    """Find ProductHunt discussions via Exa semantic search."""

    def name(self) -> str:
        return "producthunt"

    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = Exa(api_key=api_key) if api_key else None

    async def collect(self, product: dict) -> list[Signal]:
        if not self.exa:
            return []

        signals = []
        keywords = product.get("keywords", [])
        competitors = product.get("competitor_names", [])

        queries = [f"ProductHunt {kw} alternative" for kw in keywords[:2]]
        queries += [f"ProductHunt {comp} alternative" for comp in competitors[:2]]

        for query in queries:
            try:
                results = self.exa.search(
                    query,
                    num_results=5,
                    start_published_date=(datetime.now() - timedelta(hours=24)).isoformat(),
                    contents={"highlights": True},
                )
                for result in results.results:
                    if "producthunt.com" in result.url:
                        signals.append(Signal(
                            source="producthunt",
                            source_url=result.url,
                            author_username="unknown",
                            text=result.text or result.title or "",
                            metadata={"via": "exa_semantic"},
                        ))
            except Exception as e:
                print(f"Exa ProductHunt error: {e}")

        return signals
