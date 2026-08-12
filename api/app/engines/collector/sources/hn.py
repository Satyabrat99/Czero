import httpx
from datetime import datetime, timezone, timedelta
from .base import BaseSourceManager, Signal


class HNSourceManager(BaseSourceManager):
    """
    Hacker News signal collection via Algolia API.
    Free, reliable, covers all HN history.
    """

    BASE_URL = "https://hn.algolia.com/api/v1"

    def name(self) -> str:
        return "hn"

    async def collect(self, product: dict) -> list[Signal]:
        """Search HN for buying intent signals."""
        signals = []
        keywords = product.get("keywords", [])
        timeframe_hours = product.get("timeframe_hours", 24)
        time_threshold = int((datetime.now(timezone.utc) - timedelta(hours=timeframe_hours)).timestamp())

        async with httpx.AsyncClient() as client:
            for keyword in keywords:
                for tags in ["story", "comment"]:
                    try:
                        response = await client.get(
                            f"{self.BASE_URL}/search_by_date",
                            params={
                                "query": keyword,
                                "tags": tags,
                                "hitsPerPage": 15,
                                "numericFilters": f"created_at_i>{time_threshold}"
                            },
                            timeout=10
                        )
                        data = response.json()

                        for hit in data.get("hits", []):
                            text = hit.get("title", "") or hit.get("comment_text", "") or hit.get("story_text", "")
                            if not text or len(text) < 20:
                                continue

                            signal = Signal(
                                source="hn",
                                source_url=f"https://news.ycombinator.com/item?id={hit['objectID']}",
                                author_username=hit.get("author", "unknown"),
                                text=text,
                                posted_at=datetime.fromisoformat(hit.get("created_at", "").replace("Z", "+00:00")) if hit.get("created_at") else None,
                                score_raw=hit.get("points", 0),
                                metadata={
                                    "num_comments": hit.get("num_comments", 0),
                                    "story_type": hit.get("story_type", ""),
                                }
                            )
                            signals.append(signal)
                    except Exception as e:
                        print(f"HN error for '{keyword}': {e}")
                        continue

        return signals
