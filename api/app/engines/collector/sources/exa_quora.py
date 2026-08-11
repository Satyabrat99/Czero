"""Exa Quora collector - finds Quora answers via semantic search."""

import os
from datetime import datetime, timedelta
from exa_py import Exa
from .base import BaseSourceManager, Signal

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
                results = self.exa.search(
                    query,
                    num_results=5,
                    start_published_date=(datetime.now() - timedelta(hours=24)).isoformat(),
                    contents={"highlights": True},
                )
                for result in results.results:
                    text = result.text or result.title or ""

                    # FILTER: Skip noise
                    if is_noise(text):
                        continue

                    if "quora.com" in result.url:
                        signals.append(Signal(
                            source="quora",
                            source_url=result.url,
                            author_username="unknown",
                            text=text,
                            metadata={"via": "exa_semantic"},
                        ))
            except Exception as e:
                print(f"Exa Quora error: {e}")

        return signals
