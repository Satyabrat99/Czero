import asyncio
import os
import json
from dotenv import load_dotenv
load_dotenv()

from app.services.scraper import WebPageScraper
from app.services.analyzer import ProductAnalyzer
from app.engines.collector import CollectorEngine
from app.engines.scorer import ScorerEngine

async def main():
    print("==================================================")
    print("Testing Czero End-to-End Nvidia NIM Onboarding & Pipeline")
    print("==================================================")
    print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
    print(f"EXA_API_KEY set: {bool(os.getenv('EXA_API_KEY'))}")
    print(f"NVIDIA_API_KEY set: {bool(os.getenv('NVIDIA_API_KEY'))}")
    
    # 1. Test Scraper & Analyzer
    test_url = "https://pounce.so"
    print(f"\n1. Scraping and analyzing URL: {test_url}...")
    
    scraper = WebPageScraper()
    analyzer = ProductAnalyzer()
    
    text = await scraper.scrape(test_url)
    print(f"Scraped {len(text)} characters of text.")
    
    if not text:
        print("ERROR: Scrape failed entirely.")
        return
        
    print("\nRunning LLM extraction on scraped text...")
    profile = await analyzer.analyze(text)
    profile["url"] = test_url
    print("\nGenerated Product Profile:")
    print(json.dumps(profile, indent=2))
    
    # Assertions
    assert profile["name"] != "", "Product name should not be empty"
    assert profile["description"] != "", "Product description should not be empty"
    assert len(profile["keywords"]) > 0, "Keywords list should not be empty"
    print("\n[OK] Scraper and Analyzer verified successfully!")

    # 2. Test Collector & Scorer with generated profile
    print("\n2. Executing Collector with AI-generated profile...")
    collector = CollectorEngine()
    scorer = ScorerEngine()
    
    collection_result = await collector.collect_for_product(profile)
    print(f"Total Unique Signals Found: {collection_result['total_unique']}")
    print("Source Stats:")
    print(json.dumps(collection_result['source_stats'], indent=2))
    
    print("\n3. Scoring signals with NVIDIA LLM scorer...")
    signals = collection_result["signals"]
    if not signals:
        print("No signals collected. End-to-end test complete (no signals to score).")
        return
        
    leads = await scorer.score_signals(signals, profile)
    print(f"Total Scored: {len(leads)}")
    hot = [l for l in leads if l["category"] == "hot"]
    warm = [l for l in leads if l["category"] == "warm"]
    cold = [l for l in leads if l["category"] == "cold"]
    print(f"Hot: {len(hot)}, Warm: {len(warm)}, Cold: {len(cold)}")

    print("\nTop 5 Scored Leads (NVIDIA LLM):")
    for l in leads[:5]:
        print(f"[{l['category'].upper()} - {l['final_score']}] Source: {l['source']}")
        print(f"URL: {l['source_url']}")
        print(f"Reasoning: {l['reasoning']}")
        print(f"Text snippet: {l['text'][:200]}...")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())
