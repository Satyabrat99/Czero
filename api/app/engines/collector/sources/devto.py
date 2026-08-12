"""Dev.to collector - searches for articles discussing tools."""

import httpx
from .base import BaseSourceManager, Signal


class DevtoCollector(BaseSourceManager):
    """Search Dev.to for articles discussing tools."""

    def name(self) -> str:
        return "devto"

    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])

        async with httpx.AsyncClient() as client:
            for kw in keywords[:3]:
                try:
                    r = await client.get(
                        f"https://dev.to/api/articles?tag={kw}&per_page=10",
                        timeout=10,
                    )
                    if r.status_code == 200:
                        articles = r.json()
                        for article in articles:
                            title = article.get("title", "")
                            desc = article.get("description", "")
                            text = f"{title} {desc}"
                            signals.append(Signal(
                                source="devto",
                                source_url=article.get("url", ""),
                                author_username=article.get("user", {}).get("username", "unknown"),
                                text=text[:1000],
                                metadata={
                                    "reactions": article.get("positive_reactions_count", 0),
                                    "comments": article.get("comments_count", 0),
                                },
                            ))
                except Exception as e:
                    print(f"Dev.to error: {e}")

        return signals
