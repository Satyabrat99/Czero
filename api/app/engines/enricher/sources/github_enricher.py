import httpx
from typing import Optional
from .base import BaseEnricher, EnrichmentResult


class GitHubEnricher(BaseEnricher):
    """Search GitHub for user profile + email."""

    async def enrich(self, username: str, real_name: str = None, source: str = None) -> Optional[EnrichmentResult]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.github.com/users/{username}",
                    headers={"Accept": "application/vnd.github.v3+json"},
                    timeout=10
                )

                if response.status_code != 200:
                    return None

                data = response.json()
                email = data.get("email")
                name = data.get("name")
                blog = data.get("blog", "")
                bio = data.get("bio", "")
                company = data.get("company")

                linkedin = None
                for text in [blog, bio]:
                    if text and "linkedin.com" in text:
                        import re
                        match = re.search(r"https?://linkedin\.com/in/[^\s]+", text)
                        if match:
                            linkedin = match.group(0)
                            break

                if email or linkedin:
                    return EnrichmentResult(
                        email=email,
                        linkedin_url=linkedin,
                        real_name=name,
                        company_name=company,
                        source="github",
                        quality_score=70 if email else 50,
                    )
        except Exception as e:
            print(f"GitHub enrichment error: {e}")

        return None
