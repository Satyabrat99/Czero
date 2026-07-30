# Phase 3: Contact Enrichment Engine

> Feed this to Command Code after Phase 2 is verified. This builds the Enricher — parallel sources, SMTP verify, quality grading.

---

## Task

Build the Enricher Engine that finds email + LinkedIn for leads using parallel sources, verifies emails with SMTP, and grades quality (A/B/C).

---

## Step 1: Enrichment Sources

Create file `api/app/engines/enricher/__init__.py`:
```python
from .orchestrator import EnricherEngine
__all__ = ["EnricherEngine"]
```

Create file `api/app/engines/enricher/sources/__init__.py` (empty)

Create file `api/app/engines/enricher/sources/base.py`:
```python
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
```

---

## Step 2: GitHub Enricher

Create file `api/app/engines/enricher/sources/github_enricher.py`:
```python
import httpx
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
                
                # Extract LinkedIn from bio/blog
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
```

---

## Step 3: Email Verifier

Create file `api/app/engines/enricher/verifier.py`:
```python
import re
import dns.resolver


DISPOSABLE_DOMAINS = {
    "guerrillamail.com", "tempmail.com", "throwaway.email",
    "mailinator.com", "yopmail.com", "10minutemail.com",
    "sharklasers.com", "dispostable.com", "tmpmail.net",
    "tempail.com", "tempr.email",
}

ROLE_PREFIXES = [
    "info", "sales", "support", "help", "admin", "office",
    "contact", "hello", "team", "staff", "billing", "marketing",
]

PERSONAL_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "icloud.com", "mail.com", "protonmail.com",
]


class ContactVerifier:
    """Multi-layer email verification."""
    
    def verify_email(self, email: str) -> dict:
        """Verify email and return quality assessment."""
        result = {
            "valid": False,
            "verification": "unknown",
            "confidence": 0,
            "grade": "C",
            "grade_reason": "",
        }
        
        # Layer 1: Format check
        if not re.match(r'^[\w.+-]+@[\w-]+\.[\w.]+$', email):
            result["verification"] = "invalid_format"
            return result
        
        domain = email.split("@")[1]
        local = email.split("@")[0]
        
        # Layer 2: Disposable check
        if domain in DISPOSABLE_DOMAINS:
            result["verification"] = "disposable"
            return result
        
        # Layer 3: DNS MX check
        try:
            mx_records = dns.resolver.resolve(domain, 'MX')
            if not mx_records:
                result["verification"] = "no_mx_record"
                return result
        except Exception:
            result["verification"] = "no_mx_record"
            return result
        
        # Layer 4: Grade email quality
        is_role = any(local.startswith(prefix) for prefix in ROLE_PREFIXES)
        is_personal = domain in PERSONAL_DOMAINS
        
        if is_role:
            result["grade"] = "C"
            result["grade_reason"] = "Role-based email (generic inbox)"
            result["confidence"] = 40
        elif is_personal:
            result["grade"] = "B"
            result["grade_reason"] = "Personal email (may not check for business)"
            result["confidence"] = 60
        else:
            result["grade"] = "A"
            result["grade_reason"] = "Professional direct email"
            result["confidence"] = 85
        
        result["valid"] = True
        result["verification"] = "dns_verified"
        
        return result
```

---

## Step 4: Enrichment Orchestrator

Create file `api/app/engines/enricher/orchestrator.py`:
```python
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
        
        # Run ALL sources in parallel
        tasks = [source.enrich(username) for source in self.sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter valid results
        valid = [r for r in results if r and r.has_contact()]
        
        if not valid:
            lead["email"] = None
            lead["linkedin_url"] = None
            lead["enrichment_source"] = None
            return lead
        
        # Pick BEST result by quality_score
        best = max(valid, key=lambda r: r.quality_score)
        
        # Verify email if found
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
```

---

## Step 5: Update API Route

Update `api/app/routes/products.py` — add enrichment to collect-and-score:
```python
from app.engines.enricher import EnricherEngine

# Add after scorer initialization
enricher = EnricherEngine()

# Update collect_and_score endpoint to include enrichment
@router.post("/collect-and-score")
async def collect_and_score(product: ProductCreate):
    """Collect, score, AND enrich signals."""
    # Collect
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]
    
    # Score
    leads = await scorer.score_signals(signals, product.model_dump())
    
    # Enrich hot + warm leads only
    enrichable = [l for l in leads if l["category"] in ["hot", "warm"]]
    enriched = await enricher.enrich_batch(enrichable)
    
    # Merge enriched back
    enriched_map = {l["source_url"]: l for l in enriched}
    for i, lead in enumerate(leads):
        if lead["source_url"] in enriched_map:
            leads[i] = enriched_map[lead["source_url"]]
    
    # Stats
    hot = sum(1 for l in leads if l["category"] == "hot")
    warm = sum(1 for l in leads if l["category"] == "warm")
    cold = sum(1 for l in leads if l["category"] == "cold")
    with_email = sum(1 for l in leads if l.get("email"))
    with_linkedin = sum(1 for l in leads if l.get("linkedin_url"))
    
    return {
        "collection": {
            "total_raw": collection_result["total_raw"],
            "total_unique": collection_result["total_unique"],
        },
        "scoring": {"total": len(leads), "hot": hot, "warm": warm, "cold": cold},
        "enrichment": {"with_email": with_email, "with_linkedin": with_linkedin},
        "leads": leads[:20],
    }
```

---

## Step 6: Test Enrichment

```bash
curl -X POST http://localhost:8000/api/products/collect-and-score \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://linear.app",
    "name": "Linear",
    "description": "Project management tool",
    "keywords": ["project management"],
    "competitor_names": [],
    "subreddit_list": ["SaaS"]
  }'
```

**Verify:** Hot/warm leads have `email` and/or `linkedin_url` fields populated (or null if not found). Email grades (A/B/C) are assigned.

---

## Verification Checklist

1. ✅ GitHub enrichment finds profiles for developers
2. ✅ Email verification rejects disposable domains
3. ✅ Email grading: A (professional), B (personal), C (role-based)
4. ✅ DNS MX check works (rejects non-existent domains)
5. ✅ Parallel execution (all sources run, best picked)
6. ✅ Git commit: `feat: contact enrichment engine with verification`
