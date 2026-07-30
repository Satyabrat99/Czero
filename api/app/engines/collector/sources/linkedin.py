from .base import BaseSourceManager, Signal


class LinkedInSourceManager(BaseSourceManager):
    """
    LinkedIn signal collection using no-cookies scraper.

    STUB: Implement after core sources are working.
    LinkedIn has 8-char search limit and anti-scraping measures.
    """

    def name(self) -> str:
        return "linkedin"

    async def collect(self, product: dict) -> list[Signal]:
        # TODO: Implement with linkedin-post-search-scraper
        # For MVP, Reddit + HN + Exa provide enough coverage
        return []
