"""Lobste.rs collector - searches for tech discussions asking for tools."""

import httpx
from .base import BaseSourceManager, Signal


class LobstersCollector(BaseSourceManager):
    """Search Lobste.rs for tech discussions asking for tools."""

    def name(self) -> str:
        return "lobsters"

    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])

        try:
            r = httpx.get("https://lobste.rs/newest.json", timeout=10)
            if r.status_code == 200:
                stories = r.json()
                for story in stories:
                    title = story.get("title", "")
                    title_lower = title.lower()
                    if any(kw.lower() in title_lower for kw in keywords):
                        signals.append(Signal(
                            source="lobsters",
                            source_url=story.get("url", story.get("comments_url", "")),
                            author_username=story.get("submitter_user", {}).get("username", "unknown"),
                            text=title,
                            metadata={
                                "score": story.get("score", 0),
                                "comments": story.get("comment_count", 0),
                                "tags": story.get("tags", []),
                            },
                        ))
        except Exception as e:
            print(f"Lobste.rs error: {e}")

        return signals
