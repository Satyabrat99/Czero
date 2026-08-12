import asyncio
import os
from dotenv import load_dotenv
load_dotenv()  # Loads from the local api/.env file

from app.services.analyzer import ProductAnalyzer

async def test_relevance():
    print("==================================================")
    print("Testing Analyzer Prompt Update for Niche & Competitors")
    print("==================================================")
    
    analyzer = ProductAnalyzer()
    if not analyzer.client:
        print("ERROR: OpenAI/NVIDIA client not initialized. Check your credentials in .env.")
        return
        
    # EDIT THIS sample text to test different landing pages and see what the prompt extracts!
    sample_text = """
    PounceCart - Sell more on Shopify in one click.
    Tired of losing customers at checkout? PounceCart is the best Shopify checkout booster that recovers abandoned carts.
    Unlike CartLoop or SMSBump, we don't spam users. We use clean, high-converting WhatsApp recovery flows.
    Designed for Shopify merchants, dropshippers, and e-commerce stores looking to recover lost revenue.
    """
    
    print("Running LLM analysis on sample text...")
    try:
        profile = await analyzer.analyze(sample_text)
        print("\nExtracted Profile Result:")
        print(f"Name: {profile.get('name')}")
        print(f"Description: {profile.get('description')}")
        print(f"Competitor Names: {profile.get('competitor_names')}")
        print(f"Subreddits: {profile.get('subreddit_list')}")
        print(f"Keywords: {profile.get('keywords')}")
        print(f"ICP: {profile.get('icp')}")
        
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    asyncio.run(test_relevance())
