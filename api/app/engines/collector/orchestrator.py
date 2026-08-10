import asyncio
from datetime import datetime
from .sources.reddit_rss import RedditRSSCollector
from .sources.hn import HNSourceManager
from .sources.exa import ExaSourceManager
from .sources.twitter import TwitterSourceManager
from .sources.linkedin import LinkedInSourceManager
from .merger import SignalMerger


class CollectorEngine:
    """
    Master orchestrator for signal collection.

    KEY: All sources run INDEPENDENTLY in parallel.
    Results MERGE at the end. No source filters another.

    Sources:
    - Reddit via Exa (semantic search, no API needed)
    - Exa general (web-wide semantic search)
    - HN via Algolia (free, no approval)
    - Twitter via Scweet (free, needs auth_token)
    - LinkedIn via no-cookies scraper (free)
    """

    def __init__(self):
        self.sources = {
            "reddit": RedditRSSCollector(),
            "hn": HNSourceManager(),
            "exa": ExaSourceManager(),
            "twitter": TwitterSourceManager(),
            "linkedin": LinkedInSourceManager(),
        }
        self.merger = SignalMerger()

    async def collect_for_product(self, product: dict) -> dict:
        """Collect all signals for a product from all sources in parallel."""
        tasks = []
        for name, source in self.sources.items():
            tasks.append(self._collect_with_timeout(source, product, timeout=30))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_signals = []
        source_stats = {}
        for name, result in zip(self.sources.keys(), results):
            if isinstance(result, Exception):
                source_stats[name] = {"status": "error", "count": 0, "error": str(result)}
            else:
                all_signals.append(result)
                source_stats[name] = {"status": "ok", "count": len(result)}

        unique_signals = self.merger.merge_and_dedup(all_signals)

        return {
            "total_raw": sum(s["count"] for s in source_stats.values()),
            "total_unique": len(unique_signals),
            "source_stats": source_stats,
            "signals": unique_signals,
            "timestamp": datetime.now().isoformat(),
        }

    async def _collect_with_timeout(self, source, product, timeout: int):
        try:
            return await asyncio.wait_for(source.collect(product), timeout=timeout)
        except asyncio.TimeoutError:
            print(f"Source {source.name()} timed out after {timeout}s")
            return []
        except Exception as e:
            print(f"Source {source.name()} failed: {e}")
            return []
