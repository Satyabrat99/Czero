"""Exa Twitter collector - finds Twitter content via semantic search."""

import os
import asyncio
from datetime import datetime, timedelta
from exa_py import AsyncExa
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


class ExaTwitterCollector(BaseSourceManager):
    """Find Twitter content via Exa semantic search."""

    def name(self) -> str:
        return "twitter"

    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        self.exa = AsyncExa(api_key=api_key) if api_key else None

    async def collect(self, product: dict) -> list[Signal]:
        if not self.exa:
            return []

        signals = []
        keywords = product.get("keywords", [])

        queries = [f"Twitter {kw} recommendation" for kw in keywords[:3]]

        start_published_date = (datetime.now() - timedelta(hours=24)).isoformat()

        async def run_search(query: str):
            semaphore = get_exa_semaphore()
            async with semaphore:
                try:
                    results = await self.exa.search(
                        query,
                        num_results=5,
                        start_published_date=start_published_date,
                        contents={"highlights": True},
                    )
                    return results.results
                except Exception as e:
                    print(f"Exa Twitter error for '{query}': {e}")
                    return []

        search_tasks = [run_search(q) for q in queries]
        results_list = await asyncio.gather(*search_tasks)

        for results in results_list:
            for result in results:
                text = result.text or result.title or ""

                # FILTER: Skip noise
                if is_noise(text):
                    continue

                if "twitter.com" in result.url or "x.com" in result.url:
                    signals.append(Signal(
                        source="twitter",
                        source_url=result.url,
                        author_username="unknown",
                        text=text,
                        metadata={"via": "exa_semantic"},
                    ))

        return signals
