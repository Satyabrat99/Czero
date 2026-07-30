from fastapi import APIRouter
from pydantic import BaseModel
from app.engines.collector import CollectorEngine

router = APIRouter()
collector = CollectorEngine()


class AnalyzeRequest(BaseModel):
    url: str


class ProductCreate(BaseModel):
    url: str
    name: str = ""
    description: str = ""
    keywords: list[str] = []
    competitor_names: list[str] = []
    subreddit_list: list[str] = ["SaaS", "startups", "Entrepreneur"]


@router.post("/analyze")
async def analyze_product(req: AnalyzeRequest):
    """Analyze a URL and extract product info using LLM."""
    # TODO: Implement LLM analysis in Phase 2
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
