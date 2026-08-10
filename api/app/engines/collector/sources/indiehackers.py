"""IndieHackers collector - searches for posts asking for tools.

NOTE: IndieHackers API has changed and now requires authentication.
This collector is disabled until we get API access.
For now, Exa semantic search covers IndieHackers content.
"""

import httpx
from .base import BaseSourceManager, Signal


class IndieHackersCollector(BaseSourceManager):
    """Search IndieHackers for posts asking for tools.
    
    DISABLED: IndieHackers API now requires authentication.
    Use Exa semantic search as fallback.
    """

    INTENT_PHRASES = [
        "recommend", "looking for", "alternative to", "anyone know",
        "need", "suggestion", "what do you use", "best tool",
    ]

    def name(self) -> str:
        return "indiehackers"

    async def collect(self, product: dict) -> list[Signal]:
        # IndieHackers API requires authentication now
        # Return empty for now - Exa covers this content
        return []
