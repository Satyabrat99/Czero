import asyncio
import os
import json
from unittest.mock import AsyncMock
from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from app.services.db import DBService
from app.workers.scheduler import scheduler
from app.engines.collector.sources.base import Signal

async def main():
    print("==================================================")
    print("Testing Czero Database Scheduler, Caching & Deduplication (Mocked Collector)")
    print("==================================================")
    
    db = DBService()
    if not db.client:
        print("ERROR: Supabase client not initialized. Check your credentials.")
        return
        
    try:
        # 1. Retrieve a valid user_id from auth.users (requires service role key access)
        print("Fetching a valid user from the database...")
        users = db.client.auth.admin.list_users()
        
        if not users:
            print("ERROR: No registered users found in Supabase auth. Please sign up a user first.")
            return
            
        first_user = users[0]
        if hasattr(first_user, "id"):
            user_id = first_user.id
            email = getattr(first_user, "email", "unknown")
        elif isinstance(first_user, dict):
            user_id = first_user.get("id")
            email = first_user.get("email", "unknown")
        else:
            user_id = str(first_user)
            email = "unknown"
            
        print(f"Using test user ID: {user_id} (Email: {email})")
        
        # 2. Setup mock product context
        test_product = {
            "user_id": user_id,
            "url": "https://pounce.so",
            "name": "Pounce Test Mock",
            "description": "AI-powered social lead generation and monitoring tool for SaaS founders.",
            "keywords": ["looking for alternative to Pounce", "anyone know good lead gen tool"],
            "competitor_names": ["ReplyGain", "HuntIQ"],
            "subreddit_list": ["SaaS", "startups"],
            "icp": {
                "target_audience": "SaaS founders",
                "primary_use_case": "Finding high intent sales leads on social media",
                "pain_point_solved": "Manual prospecting takes too long"
            }
        }
        
        print("\nSaving test product context config...")
        saved_product = db.save_product(test_product)
        product_id = saved_product["id"]
        print(f"Product saved! Config ID: {product_id}")
        
        # 3. Clean up any existing test leads for this product to ensure clean run
        db.client.table("leads").delete().eq("product_id", product_id).execute()
        print("Cleaned up existing leads for this test product in database.")

        # 4. Mock the Collector to return a static high-intent signal
        unique_test_url = f"https://reddit.com/r/SaaS/comments/test_dedup_{os.urandom(4).hex()}"
        mock_signal = Signal(
            source="reddit",
            source_url=unique_test_url,
            author_username="test_founder_guy",
            text="I'm looking for a solid alternative to Pounce that can scan Reddit for leads automatically. Any recommendations?",
            posted_at=datetime.utcnow(),
            metadata={}
        )
        
        scheduler.collector.collect_for_product = AsyncMock(return_value={
            "total_raw": 1,
            "total_unique": 1,
            "source_stats": {"reddit": 1},
            "signals": [mock_signal]
        })
        print(f"Mocked Collector to return 1 high-intent signal with URL: {unique_test_url}")
        
        # Fetch initial leads count
        initial_urls = db.get_existing_lead_urls(product_id)
        print(f"Leads count in cache BEFORE run: {len(initial_urls)}")
        
        # 5. Trigger active monitoring iteration (Run #1 - Should score and save)
        print("\nTriggering scheduler iteration Run #1...")
        await scheduler.run_single_iteration()
        
        # Check leads count after Run #1
        urls_after_run1 = db.get_existing_lead_urls(product_id)
        new_leads_count = len(urls_after_run1) - len(initial_urls)
        print(f"Leads count in cache AFTER Run #1: {len(urls_after_run1)} (Added {new_leads_count} new leads)")
        assert new_leads_count == 1, "Run #1 should have added exactly 1 lead."
        assert unique_test_url in urls_after_run1, "The mocked test URL should be stored in the leads table."
        
        # 6. Trigger active monitoring iteration again (Run #2 - Caching should skip scoring and save)
        print("\nTriggering scheduler iteration Run #2...")
        await scheduler.run_single_iteration()
        
        # Check leads count after Run #2
        urls_after_run2 = db.get_existing_lead_urls(product_id)
        runs2_diff = len(urls_after_run2) - len(urls_after_run1)
        print(f"Leads count in cache AFTER Run #2: {len(urls_after_run2)} (Added {runs2_diff} new leads)")
        
        # Assertions
        assert runs2_diff == 0, "Deduplication failed! Run #2 should not add any duplicate leads."
        print("\n[OK] Caching, Deduplication, and Database Storage verified successfully with mock signals!")
        
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    asyncio.run(main())
