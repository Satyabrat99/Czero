"""IndieHackers collector - searches for posts asking for tools."""

import httpx
from .base import BaseSourceManager, Signal


class IndieHackersCollector(BaseSourceManager):
    """Search IndieHackers for posts asking for tools."""

    INTENT_PHRASES = [
        "recommend", "looking for", "alternative to", "anyone know",
        "need", "suggestion", "what do you use", "best tool",
    ]

    def name(self) -> str:
        return "indiehackers"

    async def collect(self, product: dict) -> list[Signal]:
        signals = []
        keywords = product.get("keywords", [])

        for kw in keywords[:3]:
            try:
                r = httpx.get(
                    f"https://www.indiehackers.com/api/v1/posts?q={kw}&sort_by=latest&per_page=10",
                    headers={"User-Agent": "CzeroBot/1.0"},
                    timeout=10,
                )
                if r.status_code == 200:
                    posts = r.json().get("posts", [])
                    for post in posts:
                        text = post.get("title", "") + " " + post.get("body", "")
                        if self._has_intent(text):
                            signals.append(Signal(
                                source="indiehackers",
                                source_url=f"https://www.indiehackers.com/post/{post.get('slug', '')}",
                                author_username=post.get("user", {}).get("name", "unknown"),
                                text=text[:1000],
                                metadata={"score": post.get("score", 0)},
                            ))
            except Exception as e:
                print(f"IndieHackers error: {e}")

        return signals

    def _has_intent(self, text: str) -> bool:
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in self.INTENT_PHRASES)
