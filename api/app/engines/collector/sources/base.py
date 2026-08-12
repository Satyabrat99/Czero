from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import hashlib
import asyncio

_exa_semaphore = None

def get_exa_semaphore() -> asyncio.Semaphore:
    global _exa_semaphore
    if _exa_semaphore is None:
        _exa_semaphore = asyncio.Semaphore(3)  # Limit to 3 concurrent Exa queries
    return _exa_semaphore


@dataclass
class Signal:
    source: str  # "reddit", "twitter", "linkedin", "hn", "exa"
    source_url: str
    author_username: str
    text: str
    posted_at: Optional[datetime] = None
    score_raw: Optional[int] = None
    subreddit: Optional[str] = None
    metadata: dict = field(default_factory=dict)
    dedup_key: str = ""

    def __post_init__(self):
        if not self.dedup_key:
            clean_text = self.text[:100].lower().strip()
            self.dedup_key = hashlib.md5(
                f"{self.source}:{self.author_username}:{clean_text}".encode()
            ).hexdigest()


class BaseSourceManager(ABC):
    """Abstract base class for all collection sources."""

    @abstractmethod
    async def collect(self, product: dict) -> list[Signal]:
        """
        Collect signals for a product from this source.

        MUST:
        - Run independently (no dependency on other sources)
        - Return list of Signal objects
        - Handle errors gracefully (return empty list on failure)
        - Respect rate limits

        MUST NOT:
        - Filter results based on other sources' output
        - Share state with other source managers
        - Access database directly
        """
        pass

    @abstractmethod
    def name(self) -> str:
        """Source identifier ('reddit', 'twitter', etc.)."""
        pass
