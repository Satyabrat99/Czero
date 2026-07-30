from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class EnrichmentResult:
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    real_name: Optional[str] = None
    company_name: Optional[str] = None
    source: str = ""
    quality_score: int = 0  # 0-100, higher = better
    verification: str = "unverified"
    verification_confidence: int = 0
    email_grade: str = ""  # A, B, C

    def has_contact(self) -> bool:
        return bool(self.email or self.linkedin_url)


class BaseEnricher(ABC):
    @abstractmethod
    async def enrich(self, username: str, real_name: str = None, source: str = None) -> Optional[EnrichmentResult]:
        """Try to find contact info. Return None if nothing found."""
        pass
