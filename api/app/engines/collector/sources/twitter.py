from .base import BaseSourceManager, Signal


class TwitterSourceManager(BaseSourceManager):
    """
    Twitter/X signal collection using Scweet.

    STUB: Implement after Reddit + HN + Exa are working.
    Requires auth_token from browser cookies.
    """

    def name(self) -> str:
        return "twitter"

    async def collect(self, product: dict) -> list[Signal]:
        # TODO: Implement with Scweet library
        # Needs auth_token from browser cookies
        # For MVP, Reddit + HN + Exa provide enough coverage
        return []
