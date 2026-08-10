"""Lobste.rs collector - searches for tech discussions asking for tools."""

import httpx
from .base import BaseSourceManager, Signal

LOBSTERS_URL = "https://lobste.rs/newest.json"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Czero-Collector/1.0 (https://github.com/czero)",
}
MAX_RETRIES = 2
TIMEOUT = 15


class LobstersCollector(BaseSourceManager):
    """Search Lobste.rs for tech discussions asking for tools."""

    def name(self) -> str:
        return "lobsters"

    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])
        if not keywords:
            return signals

        last_err = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(
                    headers=HEADERS,
                    follow_redirects=True,
                    timeout=TIMEOUT,
                ) as client:
                    r = await client.get(LOBSTERS_URL)
                    r.raise_for_status()
                    stories = r.json()
                    for story in stories:
                        title = story.get("title", "")
                        title_lower = title.lower()
                        if any(kw.lower() in title_lower for kw in keywords):
                            # submitter_user is a string (username), not a dict
                            author = story.get("submitter_user", "unknown")
                            if isinstance(author, dict):
                                author = author.get("username", "unknown")
                            
                            signals.append(Signal(
                                source="lobsters",
                                source_url=story.get("url", story.get("comments_url", "")),
                                author_username=author,
                                text=title,
                                metadata={
                                    "score": story.get("score", 0),
                                    "comments": story.get("comment_count", 0),
                                    "tags": story.get("tags", []),
                                },
                            ))
                    return signals
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                last_err = e
                if attempt < MAX_RETRIES:
                    continue
            except Exception as e:
                last_err = e
                break

        print(f"Lobste.rs error ({last_err.__class__.__name__}): {last_err}")
        return signals
