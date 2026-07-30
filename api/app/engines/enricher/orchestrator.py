import asyncio
from .sources.github_enricher import GitHubEnricher
from .verifier import ContactVerifier


class EnricherEngine:
    """
    Parallel enrichment: run ALL sources, pick BEST result.
    Not waterfall — we don't stop at first found.
    """

    def __init__(self):
        self.sources = [GitHubEnricher()]
        self.verifier = ContactVerifier()

    async def enrich_lead(self, lead: dict) -> dict:
        """Enrich a single lead with contact info."""
        username = lead.get("author_username", "")

        if not username or username in ["deleted", "unknown"]:
            return lead

        tasks = [source.enrich(username) for source in self.sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        valid = [r for r in results if r and r.has_contact()]

        if not valid:
            lead["email"] = None
            lead["linkedin_url"] = None
            lead["enrichment_source"] = None
            return lead

        best = max(valid, key=lambda r: r.quality_score)

        if best.email:
            verification = self.verifier.verify_email(best.email)
            if not verification["valid"]:
                best.email = None
            else:
                best.email_grade = verification["grade"]
                best.verification = verification["verification"]
                best.verification_confidence = verification["confidence"]

        lead["email"] = best.email
        lead["linkedin_url"] = best.linkedin_url
        lead["real_name"] = best.real_name
        lead["company_name"] = best.company_name
        lead["enrichment_source"] = best.source
        lead["email_grade"] = best.email_grade
        lead["verification"] = best.verification

        return lead

    async def enrich_batch(self, leads: list[dict], concurrency: int = 5) -> list[dict]:
        """Enrich multiple leads in parallel."""
        semaphore = asyncio.Semaphore(concurrency)

        async def enrich_with_semaphore(lead):
            async with semaphore:
                return await self.enrich_lead(lead)

        tasks = [enrich_with_semaphore(lead) for lead in leads]
        return await asyncio.gather(*tasks)
