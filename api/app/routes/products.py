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
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]

    leads = await scorer.score_signals(signals, product.model_dump())

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
