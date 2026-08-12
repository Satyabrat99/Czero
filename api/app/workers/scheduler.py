import asyncio
import logging
from app.services.db import DBService
from app.engines.collector import CollectorEngine
from app.engines.scorer import ScorerEngine
from app.engines.enricher import EnricherEngine
from app.services.drafter import OutreachDrafter

logger = logging.getLogger("scheduler")

class MonitoringScheduler:
    """Background service that periodically pulls active product configurations,
    collects and scores signals, and caches/saves high-intent leads to Supabase.
    """

    def __init__(self):
        self.db = DBService()
        self.collector = CollectorEngine()
        self.scorer = ScorerEngine()
        self.enricher = EnricherEngine()
        self.drafter = OutreachDrafter()
        self.is_running = False
        self._task = None

    async def run_single_iteration(self):
        """Run a single check over all active products."""
        logger.info("Starting scheduler active monitoring iteration...")
        products = self.db.get_active_products()
        if not products:
            logger.info("No active products to monitor.")
            return

        for product in products:
            product_id = product["id"]
            user_id = product["user_id"]
            url = product["url"]
            logger.info(f"Processing active product: {product.get('name')} ({url})")

            try:
                # 1. Fetch existing lead URLs for caching/dedup
                cached_urls = self.db.get_existing_lead_urls(product_id)

                # 1.5 Determine monitoring window (7 days for niche vs. 24h for general)
                is_niche = product.get("icp", {}).get("is_niche", False)
                product["timeframe_hours"] = 168 if is_niche else 24
                logger.info(f"Using timeframe_hours: {product['timeframe_hours']} (Niche: {is_niche})")

                # 2. Collect signals
                collection_result = await self.collector.collect_for_product(product)
                signals = collection_result.get("signals", [])
                
                # 3. Filter out cached/already scored signals
                new_signals = []
                seen_in_run = set()
                for signal in signals:
                    # Deduplication using in-memory seen list + DB cache check
                    if signal.source_url not in cached_urls and signal.source_url not in seen_in_run:
                        new_signals.append(signal)
                        seen_in_run.add(signal.source_url)
                
                logger.info(f"Product {product.get('name')}: Collected {len(signals)} raw. {len(new_signals)} are new.")
                
                if not new_signals:
                    logger.info(f"No new signals to process for product {product_id}")
                    continue

                # 4. Score new signals
                scored_leads = await self.scorer.score_signals(new_signals, product)
                
                # 5. Keep only hot + warm leads with final_score >= 60
                good_leads = [l for l in scored_leads if l["category"] in ["hot", "warm"] and l["final_score"] >= 60]
                logger.info(f"Scoring resulted in {len(good_leads)} qualified leads out of {len(new_signals)} signals.")
                
                if not good_leads:
                    continue

                # 6. Enrich hot + warm leads
                enriched_leads = await self.enricher.enrich_batch(good_leads)
                
                # 7. Generate drafts
                for lead in enriched_leads:
                    drafts = self.drafter.generate_drafts(lead, product)
                    lead.update(drafts)

                # 8. Prepare database insertion payload
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

                # 9. Save new leads to database
                self.db.save_leads(db_leads)
                logger.info(f"Successfully saved {len(db_leads)} leads for product {product_id}")

            except Exception as e:
                logger.error(f"Error processing product {product_id} in scheduler: {e}", exc_info=True)

    def start_loop_thread(self, interval_seconds: int = 900):
        """Start the loop in a dedicated background thread to prevent blocking the main event loop."""
        import threading
        import time
        self.is_running = True
        
        def loop_target():
            logger.info(f"Background thread started: monitoring loop at interval {interval_seconds}s")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            while self.is_running:
                try:
                    loop.run_until_complete(self.run_single_iteration())
                except Exception as e:
                    logger.error(f"Error in scheduler background thread iteration: {e}")
                
                # Sleep in thread without blocking the main process event loop
                time.sleep(interval_seconds)
            
            loop.close()
            logger.info("Background monitoring thread shut down.")

        self._thread = threading.Thread(target=loop_target, daemon=True)
        self._thread.start()

    async def start_loop(self, interval_seconds: int = 900):
        """Legacy async start loop - redirects to background thread to prevent blocking."""
        self.start_loop_thread(interval_seconds)

    def stop_loop(self):
        """Stop the background loops."""
        self.is_running = False
        logger.info("Scheduler monitoring loop stopped.")

# Instantiate shared instance
scheduler = MonitoringScheduler()
