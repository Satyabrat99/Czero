# Phase 2: Intent Scoring Engine (Simple MVP)

> Feed this to Command Code after Phase 1 is verified. This builds the Scorer — simple 3-step scoring.

---

## Task

Build the MVP Scorer Engine: soft pre-filter → LLM scoring → category. Dead simple, no complex layers.

---

## Step 1: Soft Pre-Filter

Create file `api/app/engines/scorer/__init__.py`:
```python
from .orchestrator import ScorerEngine
__all__ = ["ScorerEngine"]
```

Create file `api/app/engines/scorer/pre_filter.py`:
```python
import re


class SoftPreFilter:
    """
    Discard ONLY high-confidence noise.
    Let everything else through to LLM.
    
    Exa semantic matches (e.g., "need a way to bill clients")
    have INTENT but no KEYWORD → they PASS through.
    Only pure noise is discarded.
    """
    
    INTENT_PHRASES = [
        "looking for", "need", "anyone know", "recommend",
        "alternative to", "switching from", "frustrated with",
        "better than", "suggestion", "advice", "help me find",
        "what do you use", "what's the best", "how do you",
        "any suggestions", "open to", "ready to buy",
    ]
    
    def __init__(self, keywords: list[str]):
        self.keywords = [kw.lower() for kw in keywords]
        self.keyword_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(kw) for kw in self.keywords) + r')\b',
            re.IGNORECASE
        )
        self.intent_pattern = re.compile(
            r'(' + '|'.join(re.escape(p) for p in self.INTENT_PHRASES) + r')',
            re.IGNORECASE
        )
    
    def should_keep(self, text: str) -> bool:
        """Return True if signal should proceed to LLM scoring."""
        has_keyword = bool(self.keyword_pattern.search(text))
        has_intent = bool(self.intent_pattern.search(text))
        
        # DISCARD: No keyword AND no intent → almost certainly noise
        if not has_keyword and not has_intent:
            return False
        
        # PASS: Everything else goes to LLM
        return True
```

---

## Step 2: LLM Intent Scorer

Create file `api/app/engines/scorer/llm_scorer.py`:
```python
import os
import json
from openai import OpenAI


class LLMIntentScorer:
    """
    One LLM call scores intent 0-100 + generates reasoning.
    Simple. No batching complexity.
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def score(self, text: str, product_description: str, icp: dict) -> dict:
        """Score a single signal for buying intent."""
        
        prompt = f"""Score this social media post for buying intent (0-100).

Product: {product_description}
Target customer: {json.dumps(icp)}

Post: "{text[:500]}"

Score:
- 90-100: Directly asking for this type of product
- 70-89: Strong interest in solving this problem
- 50-69: Discussing the problem space
- 30-49: Tangential mention
- 0-29: No intent

Return JSON: {{"score": N, "reason": "1-2 sentences explaining why"}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=200
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                "score": min(100, max(0, result.get("score", 0))),
                "reason": result.get("reason", "No reason provided")
            }
        except Exception as e:
            print(f"LLM scoring error: {e}")
            return {"score": 0, "reason": f"Scoring error: {e}"}
```

---

## Step 3: MVP Scorer Orchestrator

Create file `api/app/engines/scorer/orchestrator.py`:
```python
from .pre_filter import SoftPreFilter
from .llm_scorer import LLMIntentScorer


class ScorerEngine:
    """
    Dead simple scoring for MVP.
    
    1. Soft pre-filter (discard pure noise)
    2. LLM scores intent 0-100 (one call)
    3. Category: hot/warm/cold
    Done.
    """
    
    def __init__(self):
        self.pre_filter = None  # Initialized per product
        self.llm_scorer = LLMIntentScorer()
    
    async def score_signals(self, signals: list, product: dict) -> list[dict]:
        """Score a list of signals for a product."""
        
        # Initialize pre-filter with product keywords
        self.pre_filter = SoftPreFilter(product.get("keywords", []))
        
        leads = []
        for signal in signals:
            # Step 1: Soft pre-filter
            if not self.pre_filter.should_keep(signal.text):
                continue
            
            # Step 2: LLM scoring
            result = await self.llm_scorer.score(
                text=signal.text,
                product_description=product.get("description", ""),
                icp=product.get("icp", {})
            )
            
            score = result["score"]
            reason = result["reason"]
            
            # Step 3: Category
            if score >= 70:
                category = "hot"
            elif score >= 45:
                category = "warm"
            else:
                category = "cold"
            
            # Create lead
            lead = {
                "signal_id": getattr(signal, 'id', None),
                "source": signal.source,
                "source_url": signal.source_url,
                "author_username": signal.author_username,
                "text": signal.text[:500],
                "final_score": score,
                "category": category,
                "reasoning": reason,
                "posted_at": signal.posted_at.isoformat() if signal.posted_at else None,
                "metadata": signal.metadata,
            }
            leads.append(lead)
        
        # Sort by score (highest first)
        leads.sort(key=lambda x: x["final_score"], reverse=True)
        
        return leads
```

---

## Step 4: API Route for Scoring

Update file `api/app/routes/products.py` (add collect + score endpoint):
```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.engines.collector import CollectorEngine
from app.engines.scorer import ScorerEngine

router = APIRouter()
collector = CollectorEngine()
scorer = ScorerEngine()


class AnalyzeRequest(BaseModel):
    url: str


class ProductCreate(BaseModel):
    url: str
    name: str = ""
    description: str = ""
    keywords: list[str] = []
    competitor_names: list[str] = []
    subreddit_list: list[str] = ["SaaS", "startups", "Entrepreneur"]
    icp: dict = {}


@router.post("/analyze")
async def analyze_product(req: AnalyzeRequest):
    """Analyze a URL and extract product info using LLM."""
    # TODO: Implement LLM analysis in Phase 3
    return {
        "url": req.url,
        "name": "Product",
        "description": "TODO: LLM analysis",
        "keywords": [],
        "icp": {},
        "pain_points": [],
        "competitor_names": [],
        "subreddit_list": ["SaaS", "startups"],
    }


@router.post("/collect-and-score")
async def collect_and_score(product: ProductCreate):
    """Collect signals AND score them in one call."""
    # Collect
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]
    
    # Score
    leads = await scorer.score_signals(signals, product.model_dump())
    
    # Stats
    hot = sum(1 for l in leads if l["category"] == "hot")
    warm = sum(1 for l in leads if l["category"] == "warm")
    cold = sum(1 for l in leads if l["category"] == "cold")
    
    return {
        "collection": {
            "total_raw": collection_result["total_raw"],
            "total_unique": collection_result["total_unique"],
            "source_stats": collection_result["source_stats"],
        },
        "scoring": {
            "total_scored": len(leads),
            "hot": hot,
            "warm": warm,
            "cold": cold,
        },
        "leads": leads[:20],  # Return top 20
    }


@router.get("")
async def list_products():
    return {"products": []}
```

---

## Step 5: Test the Scorer

Run the backend:
```bash
cd api && python -m uvicorn app.main:app --reload
```

Test collect + score:
```bash
curl -X POST http://localhost:8000/api/products/collect-and-score \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://linear.app",
    "name": "Linear",
    "description": "Project management tool for software teams",
    "keywords": ["project management", "issue tracker", "task management"],
    "competitor_names": ["Jira", "Asana"],
    "subreddit_list": ["SaaS", "startups"],
    "icp": {"roles": ["developer", "PM"], "company_size": "10-50"}
  }'
```

**Verify:** Response shows leads with scores, categories, and reasoning. Hot leads (70+) should be people actively asking for project management tools.

---

## Verification Checklist

1. ✅ Pre-filter discards noise (posts with no keyword AND no intent)
2. ✅ Pre-filter lets Exa semantic matches through (intent but no keyword)
3. ✅ LLM scores each post 0-100 with reasoning
4. ✅ Categories: hot (≥70), warm (45-69), cold (<45)
5. ✅ Leads sorted by score (highest first)
6. ✅ Git commit: `feat: intent scoring engine (simple MVP)`
