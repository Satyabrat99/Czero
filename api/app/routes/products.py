import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.engines.collector import CollectorEngine
from app.engines.scorer import ScorerEngine
from app.engines.enricher import EnricherEngine
from app.services.drafter import OutreachDrafter
from app.services.emailer import EmailSender
from app.services.scraper import WebPageScraper
from app.services.analyzer import ProductAnalyzer
from app.services.db import DBService

logger = logging.getLogger("routes.products")

router = APIRouter()
collector = CollectorEngine()
scorer = ScorerEngine()
enricher = EnricherEngine()
drafter = OutreachDrafter()
emailer = EmailSender()

scraper_service = WebPageScraper()
analyzer_service = ProductAnalyzer()
db_service = DBService()


class AnalyzeRequest(BaseModel):
    url: str
    screenshot: str | None = None


class ProductCreate(BaseModel):
    url: str
    name: str = ""
    description: str = ""
    keywords: list[str] = []
    competitor_names: list[str] = []
    subreddit_list: list[str] = ["SaaS", "startups", "Entrepreneur"]
    icp: dict = {}


class ProductSetupPayload(BaseModel):
    user_id: str
    url: str
    name: str
    description: str
    keywords: list[str]
    competitor_names: list[str] = []
    subreddit_list: list[str] = ["SaaS", "startups", "Entrepreneur"]
    icp: dict = {}


async def _ensure_product_details(product: ProductCreate) -> dict:
    """Helper to auto-analyze and populate empty product fields from URL."""
    prod_dict = product.model_dump()
    
    # Trigger LLM analysis if either description or keywords are missing
    if not prod_dict.get("description") or not prod_dict.get("keywords"):
        scraped = await scraper_service.scrape(prod_dict["url"])
        if scraped:
            analysis = await analyzer_service.analyze(scraped)
            
            # Populate empty fields with analyzed data
            if not prod_dict.get("name") and analysis.get("name"):
                prod_dict["name"] = analysis["name"]
            if not prod_dict.get("description") and analysis.get("description"):
                prod_dict["description"] = analysis["description"]
            if not prod_dict.get("keywords") and analysis.get("keywords"):
                prod_dict["keywords"] = analysis["keywords"]
            if not prod_dict.get("competitor_names") and analysis.get("competitor_names"):
                prod_dict["competitor_names"] = analysis["competitor_names"]
            if not prod_dict.get("icp") and analysis.get("icp"):
                prod_dict["icp"] = analysis["icp"]
            
            # Only override subreddits if it was default
            if (not prod_dict.get("subreddit_list") or prod_dict.get("subreddit_list") == ["SaaS", "startups", "Entrepreneur"]) and analysis.get("subreddit_list"):
                prod_dict["subreddit_list"] = analysis["subreddit_list"]
                
    # Use fallback values if still empty after scraping/analyzer
    if not prod_dict.get("name"):
        # Simple fallback from domain
        domain = prod_dict["url"].replace("https://", "").replace("http://", "").split("/")[0]
        prod_dict["name"] = domain.split(".")[0].capitalize()
        
    return prod_dict


@router.post("/analyze")
async def analyze_product(req: AnalyzeRequest):
    """Analyze a URL and extract product info using LLM, with optional vision support for screenshots."""
    scraped = await scraper_service.scrape(req.url)
    if not scraped:
        raise HTTPException(
            status_code=400,
            detail="Failed to scrape webpage. Make sure the URL is valid and accessible."
        )
    
    profile = await analyzer_service.analyze(scraped)
    profile["url"] = req.url
    
    # Run vision analysis if screenshot is provided
    if req.screenshot:
        visual_desc = await analyzer_service.analyze_screenshot(req.screenshot)
        if "icp" in profile:
            profile["icp"]["visual_description"] = visual_desc
            
    return profile


@router.post("/setup")
async def setup_product(product: ProductSetupPayload):
    """Save product context to Supabase products table and run initial lead pipeline."""
    # 1. Save configuration context to database
    logger.info(f"Saving product config for user {product.user_id} and URL {product.url}")
    saved_product = db_service.save_product(product.model_dump())
    if not saved_product:
        raise HTTPException(
            status_code=500,
            detail="Failed to save product configuration context to database."
        )

    # 2. Trigger an initial run as a background task so onboarding doesn't wait
    async def initial_run_task():
        try:
            product_id = saved_product["id"]
            user_id = saved_product["user_id"]
            logger.info(f"Starting initial leads run for product context: {product_id}")

            # 2.1 Fetch existing lead URLs for caching/dedup
            cached_urls = db_service.get_existing_lead_urls(product_id)

            # 2.15 Compute onboarding backfill window (30 days for niche vs. 7 days for general)
            is_niche = saved_product.get("icp", {}).get("is_niche", False)
            saved_product["timeframe_hours"] = 720 if is_niche else 168
            logger.info(f"Initial setup run timeframe_hours: {saved_product['timeframe_hours']} (Niche: {is_niche})")

            # 2.2 Collect signals
            collection_result = await collector.collect_for_product(saved_product)
            signals = collection_result.get("signals", [])
            
            # 2.3 Filter out cached/already scored signals
            new_signals = []
            seen_in_run = set()
            for signal in signals:
                if signal.source_url not in cached_urls and signal.source_url not in seen_in_run:
                    new_signals.append(signal)
                    seen_in_run.add(signal.source_url)
            
            logger.info(f"Initial run product {saved_product.get('name')}: Collected {len(signals)} raw. {len(new_signals)} are new.")
            
            if not new_signals:
                logger.info(f"Initial run: No new signals found for product context {product_id}")
                return

            # 2.4 Score new signals
            scored_leads = await scorer.score_signals(new_signals, saved_product)
            
            # 2.5 Keep only hot + warm leads with final_score >= 60
            good_leads = [l for l in scored_leads if l["category"] in ["hot", "warm"] and l["final_score"] >= 60]
            
            if not good_leads:
                logger.info(f"Initial run: No qualified leads scored for product context {product_id}")
                return

            # 2.6 Enrich hot + warm leads
            enriched_leads = await enricher.enrich_batch(good_leads)
            
            # 2.7 Generate drafts
            for lead in enriched_leads:
                drafts = drafter.generate_drafts(lead, saved_product)
                lead.update(drafts)

            # 2.8 Prepare database insertion payload
            db_leads = []
            for lead in enriched_leads:
                db_leads.append({
                    "user_id": user_id,
                    "product_id": product_id,
                    "source": lead["source"],
                    "source_url": lead["source_url"],
                    "author_username": lead.get("author_username", "unknown"),
                    "text": lead["text"],
                    "final_score": lead["final_score"],
                    "category": lead["category"],
                    "reasoning": lead.get("reasoning", ""),
                    "email": lead.get("email"),
                    "linkedin_url": lead.get("linkedin_url"),
                    "email_grade": lead.get("email_grade"),
                    "verification": lead.get("verification"),
                    "email_draft": lead.get("email_draft"),
                    "linkedin_dm_draft": lead.get("linkedin_dm_draft"),
                    "reddit_reply_draft": lead.get("reddit_reply_draft"),
                    "posted_at": lead["posted_at"],
                    "metadata": lead.get("metadata", {})
                })

            # 2.9 Save new leads to database
            db_service.save_leads(db_leads)
            logger.info(f"Initial run: Successfully saved {len(db_leads)} leads for product {product_id}")
            
        except Exception as e:
            logger.error(f"Failed to execute initial monitoring run: {e}", exc_info=True)

    asyncio.create_task(initial_run_task())

    return {
        "status": "success",
        "message": "Product context saved. Monitoring pipeline run started in background.",
        "product": saved_product
    }


@router.post("/collect-and-score")
async def collect_and_score(product: ProductCreate):
    """Collect, score, AND enrich signals."""
    prod_dict = await _ensure_product_details(product)
    collection_result = await collector.collect_for_product(prod_dict)
    signals = collection_result["signals"]

    leads = await scorer.score_signals(signals, prod_dict)

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
    """Complete pipeline: collect -> score -> enrich -> draft. Only hot/warm with score >= 60."""
    prod_dict = await _ensure_product_details(product)
    collection_result = await collector.collect_for_product(prod_dict)
    signals = collection_result["signals"]

    leads = await scorer.score_signals(signals, prod_dict)

    # Enrich hot + warm
    enrichable = [l for l in leads if l["category"] in ["hot", "warm"]]
    enriched = await enricher.enrich_batch(enrichable)
    enriched_map = {l["source_url"]: l for l in enriched}
    for i, lead in enumerate(leads):
        if lead["source_url"] in enriched_map:
            leads[i] = enriched_map[lead["source_url"]]

    # Generate drafts for hot + warm
    for lead in leads:
        if lead["category"] in ["hot", "warm"]:
            drafts = drafter.generate_drafts(lead, prod_dict)
            lead.update(drafts)

    # ONLY return hot + warm leads with score >= 60
    hot_warm_leads = [l for l in leads if l["category"] in ["hot", "warm"] and l["final_score"] >= 60]

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
    prod_dict = await _ensure_product_details(product)
    result = await collector.collect_for_product(prod_dict)
    return {
        "total_raw": result["total_raw"],
        "total_unique": result["total_unique"],
        "source_stats": result["source_stats"],
        "signals_count": len(result["signals"]),
    }


class ScanRequest(BaseModel):
    product_id: str


@router.post("/scan")
async def trigger_manual_scan(req: ScanRequest):
    """Triggers an immediate, synchronous monitoring scan for the given product ID and saves the leads."""
    logger.info(f"Triggering manual monitoring scan for product ID: {req.product_id}")
    
    # 1. Fetch product context from database
    product = db_service.get_product_by_id(req.product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product configuration not found for the given ID."
        )

    try:
        product_id = product["id"]
        user_id = product["user_id"]

        # 2. Fetch existing lead URLs to prevent duplicate billing
        cached_urls = db_service.get_existing_lead_urls(product_id)

        # 3. Compute active monitoring window (168 hours for niche, 24 hours for general)
        is_niche = product.get("icp", {}).get("is_niche", False)
        product["timeframe_hours"] = 168 if is_niche else 24
        logger.info(f"Manual scan timeframe_hours: {product['timeframe_hours']} (Niche: {is_niche})")

        # 4. Collect signals
        collection_result = await collector.collect_for_product(product)
        signals = collection_result.get("signals", [])
        
        # 5. Filter out cached/already scored signals
        new_signals = []
        seen_in_run = set()
        for signal in signals:
            if signal.source_url not in cached_urls and signal.source_url not in seen_in_run:
                new_signals.append(signal)
                seen_in_run.add(signal.source_url)
        
        logger.info(f"Manual scan: Collected {len(signals)} raw. {len(new_signals)} are new.")
        
        if not new_signals:
            return {
                "status": "success",
                "message": "Scan completed. No new leads found.",
                "stats": {
                    "total_raw": collection_result["total_raw"],
                    "total_unique": collection_result["total_unique"],
                    "new_leads_saved": 0
                }
            }

        # 6. Score new signals
        scored_leads = await scorer.score_signals(new_signals, product)
        
        # 7. Keep only hot + warm leads with final_score >= 60
        good_leads = [l for l in scored_leads if l["category"] in ["hot", "warm"] and l["final_score"] >= 60]
        
        if not good_leads:
            return {
                "status": "success",
                "message": "Scan completed. Found signals but none matched B2B intent filters.",
                "stats": {
                    "total_raw": collection_result["total_raw"],
                    "total_unique": collection_result["total_unique"],
                    "new_leads_saved": 0
                }
            }

        # 8. Enrich leads
        enriched_leads = await enricher.enrich_batch(good_leads)
        
        # 9. Generate drafts
        for lead in enriched_leads:
            drafts = drafter.generate_drafts(lead, product)
            lead.update(drafts)

        # 10. Prepare database insertion payload
        db_leads = []
        for lead in enriched_leads:
            db_leads.append({
                "user_id": user_id,
                "product_id": product_id,
                "source": lead["source"],
                "source_url": lead["source_url"],
                "author_username": lead.get("author_username", "unknown"),
                "text": lead["text"],
                "final_score": lead["final_score"],
                "category": lead["category"],
                "reasoning": lead.get("reasoning", ""),
                "email": lead.get("email"),
                "linkedin_url": lead.get("linkedin_url"),
                "email_grade": lead.get("email_grade"),
                "verification": lead.get("verification"),
                "email_draft": lead.get("email_draft"),
                "linkedin_dm_draft": lead.get("linkedin_dm_draft"),
                "reddit_reply_draft": lead.get("reddit_reply_draft"),
                "posted_at": lead["posted_at"],
                "metadata": lead.get("metadata", {})
            })

        # 11. Save new leads to database
        saved_leads = db_service.save_leads(db_leads)
        logger.info(f"Manual scan: Successfully saved {len(saved_leads)} new leads for product {product_id}")

        return {
            "status": "success",
            "message": f"Scan completed successfully. Saved {len(saved_leads)} new leads.",
            "stats": {
                "total_raw": collection_result["total_raw"],
                "total_unique": collection_result["total_unique"],
                "new_leads_saved": len(saved_leads)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to execute manual scan: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run manual scan: {str(e)}"
        )


@router.get("")
async def list_products(user_id: str = Query(..., description="The user ID to fetch products for")):
    """List all configured product workspace monitors for a user with aggregated leads stats."""
    if not db_service.client:
        return {"products": []}
    try:
        logger.info(f"Listing products for user_id: {user_id}")
        response = db_service.client.table("products").select("*").eq("user_id", user_id).execute()
        products = response.data or []
        
        # Local pairing fallback: if no products for this user session, return all products in the DB
        if not products:
            logger.info(f"No products found for user_id: {user_id}. Falling back to list all products in DB for local pairing.")
            all_response = db_service.client.table("products").select("*").execute()
            products = all_response.data or []
        
        # Fetch lead category distribution in one query to optimize latency
        leads_resp = db_service.client.table("leads").select("product_id, category").execute()
        leads_data = leads_resp.data or []
        
        # Group stats in-memory
        stats_by_product = {}
        for lead in leads_data:
            pid = lead.get("product_id")
            cat = lead.get("category")
            if not pid:
                continue
            if pid not in stats_by_product:
                stats_by_product[pid] = {"total": 0, "hot": 0, "warm": 0}
            
            stats_by_product[pid]["total"] += 1
            if cat == "hot":
                stats_by_product[pid]["hot"] += 1
            elif cat == "warm":
                stats_by_product[pid]["warm"] += 1

        # Assign stats to respective workspace products
        for product in products:
            product["stats"] = stats_by_product.get(
                product["id"], 
                {"total": 0, "hot": 0, "warm": 0}
            )
            
        return {"products": products}
    except Exception as e:
        logger.error(f"Error listing products: {e}", exc_info=True)
        return {"products": [], "error": str(e)}
