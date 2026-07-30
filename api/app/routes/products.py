from fastapi import APIRouter
from pydantic import BaseModel
from app.engines.collector import CollectorEngine
from app.engines.scorer import ScorerEngine
from app.engines.enricher import EnricherEngine

router = APIRouter()
collector = CollectorEngine()
scorer = ScorerEngine()
enricher = EnricherEngine()


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
    """Collect, score, AND enrich signals."""
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]

    leads = await scorer.score_signals(signals, product.model_dump())

    enrichable = [l for l in leads if l["category"] in ["hot", "warm"]]
    enriched = await enricher.enrich_batch(enrichable)

    enriched_map = {l["source_url"]: l for l in enriched}
    for i, lead in enumerate(leads):
        if lead["source_url"] in enriched_map:
            leads[i] = enriched_map[lead["source_url"]]

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


@router.post("/collect")
async def collect_signals(product: ProductCreate):
    """Collect signals for a product from all sources."""
    result = await collector.collect_for_product(product.model_dump())
    return {
        "total_raw": result["total_raw"],
        "total_unique": result["total_unique"],
        "source_stats": result["source_stats"],
        "signals_count": len(result["signals"]),
    }


@router.get("")
async def list_products():
    return {"products": []}
