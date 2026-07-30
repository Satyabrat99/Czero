from fastapi import APIRouter
from pydantic import BaseModel
from app.engines.collector import CollectorEngine
from app.engines.scorer import ScorerEngine
from app.engines.enricher import EnricherEngine
from app.services.drafter import OutreachDrafter
from app.services.emailer import EmailSender

router = APIRouter()
collector = CollectorEngine()
scorer = ScorerEngine()
enricher = EnricherEngine()
drafter = OutreachDrafter()
emailer = EmailSender()


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
    # TODO: Implement LLM analysis
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

    # FILTER: Only return hot + warm leads (cold leads are useless)
    hot_warm_leads = [l for l in leads if l["category"] in ["hot", "warm"]]

    hot = sum(1 for l in hot_warm_leads if l["category"] == "hot")
    warm = sum(1 for l in hot_warm_leads if l["category"] == "warm")
    with_email = sum(1 for l in hot_warm_leads if l.get("email"))
    with_linkedin = sum(1 for l in hot_warm_leads if l.get("linkedin_url"))

    return {
        "collection": {
            "total_raw": collection_result["total_raw"],
            "total_unique": collection_result["total_unique"],
        },
        "scoring": {
            "total_scored": len(leads),
            "hot": hot,
            "warm": warm,
            "cold_filtered": len(leads) - len(hot_warm_leads),
        },
        "enrichment": {"with_email": with_email, "with_linkedin": with_linkedin},
        "leads": hot_warm_leads[:20],
    }


@router.post("/full-pipeline")
async def full_pipeline(product: ProductCreate):
    """Complete pipeline: collect -> score -> enrich -> draft."""
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]

    leads = await scorer.score_signals(signals, product.model_dump())

    enrichable = [l for l in leads if l["category"] in ["hot", "warm"]]
    enriched = await enricher.enrich_batch(enrichable)
    enriched_map = {l["source_url"]: l for l in enriched}
    for i, lead in enumerate(leads):
        if lead["source_url"] in enriched_map:
            leads[i] = enriched_map[lead["source_url"]]

    # Generate drafts for hot + warm
    for lead in leads:
        if lead["category"] in ["hot", "warm"]:
            drafts = drafter.generate_drafts(lead, product.model_dump())
            lead.update(drafts)

    # FILTER: Only return hot + warm leads
    hot_warm_leads = [l for l in leads if l["category"] in ["hot", "warm"]]

    hot = sum(1 for l in hot_warm_leads if l["category"] == "hot")
    warm = sum(1 for l in hot_warm_leads if l["category"] == "warm")
    with_email = sum(1 for l in hot_warm_leads if l.get("email"))
    with_drafts = sum(1 for l in hot_warm_leads if l.get("email_draft"))

    return {
        "stats": {
            "total": len(leads),
            "hot": hot,
            "warm": warm,
            "cold_filtered": len(leads) - len(hot_warm_leads),
            "with_email": with_email,
            "with_drafts": with_drafts,
        },
        "leads": hot_warm_leads[:20],
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
