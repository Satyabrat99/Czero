# Phase 2 Update: Filter Cold Leads + Speed Up Scoring

> Feed this to Command Code. Two improvements: remove cold leads from output, speed up LLM scoring.

---

## Change 1: Filter Cold Leads

**Problem:** Cold leads (score < 45) are useless. Don't return them to users.

**Solution:** Filter out cold leads in the API response. Only return hot + warm.

Update `api/app/routes/products.py` — in both endpoints, filter cold leads:

```python
@router.post("/collect-and-score")
async def collect_and_score(product: ProductCreate):
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]
    leads = await scorer.score_signals(signals, product.model_dump())
    
    # Enrich hot + warm
    enrichable = [l for l in leads if l["category"] in ["hot", "warm"]]
    enriched = await enricher.enrich_batch(enrichable)
    enriched_map = {l["source_url"]: l for l in enriched}
    for i, lead in enumerate(leads):
        if lead["source_url"] in enriched_map:
            leads[i] = enriched_map[lead["source_url"]]
    
    # FILTER: Only return hot + warm leads
    hot_warm_leads = [l for l in leads if l["category"] in ["hot", "warm"]]
    
    hot = sum(1 for l in hot_warm_leads if l["category"] == "hot")
    warm = sum(1 for l in hot_warm_leads if l["category"] == "warm")
    
    return {
        "collection": {
            "total_raw": collection_result["total_raw"],
            "total_unique": collection_result["total_unique"],
        },
        "scoring": {"total": len(leads), "hot": hot, "warm": warm, "cold_filtered": len(leads) - len(hot_warm_leads)},
        "leads": hot_warm_leads[:20],
    }


@router.post("/full-pipeline")
async def full_pipeline(product: ProductCreate):
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]
    leads = await scorer.score_signals(signals, product.model_dump())
    
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
```

---

## Change 2: Speed Up Scoring (Batch Mode)

**Problem:** MiMo is slow (~10s per lead). 20 leads = 200 seconds.

**Solution:** Batch score 5 signals in one LLM call. Reduces API calls by 80%.

Update `api/app/engines/scorer/llm_scorer.py`:

```python
async def score_batch(self, signals: list, product_description: str, icp: dict) -> list[dict]:
    """Score multiple signals in one LLM call (much faster)."""
    if not self.client:
        return [{"score": 0, "reason": "LLM API key not configured"}] * len(signals)
    
    # Build batch prompt
    posts_text = ""
    for i, signal in enumerate(signals):
        posts_text += f"\n--- POST {i+1} ---\n{signal.text[:300]}\n"
    
    prompt = f"""Score these {len(signals)} social media posts for buying intent (0-100 each).

Product: {product_description}
Target customer: {json.dumps(icp)}

Posts:
{posts_text}

For EACH post, return score and reason.
Return JSON array: [{{"score": N, "reason": "..."}}, ...]"""

    try:
        kwargs = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 500
        }
        if self.extra_body:
            kwargs["extra_body"] = self.extra_body
        
        response = self.client.chat.completions.create(**kwargs)
        
        result = json.loads(response.choices[0].message.content)
        
        # Handle both array and object responses
        if isinstance(result, list):
            scores = result
        elif isinstance(result, dict) and "scores" in result:
            scores = result["scores"]
        else:
            scores = [result] * len(signals)
        
        # Pad if needed
        while len(scores) < len(signals):
            scores.append({"score": 0, "reason": "Score not provided"})
        
        return [
            {
                "score": min(100, max(0, s.get("score", 0))),
                "reason": s.get("reason", "No reason")
            }
            for s in scores[:len(signals)]
        ]
    except Exception as e:
        print(f"LLM batch scoring error: {e}")
        return [{"score": 0, "reason": f"Error: {e}"}] * len(signals)
```

Update `api/app/engines/scorer/orchestrator.py` to use batch scoring:

```python
async def score_signals(self, signals: list, product: dict) -> list[dict]:
    self.pre_filter = SoftPreFilter(product.get("keywords", []))
    
    # Pre-filter first
    filtered = [s for s in signals if self.pre_filter.should_keep(s.text)]
    
    # Batch score in groups of 5
    all_scored = []
    batch_size = 5
    for i in range(0, len(filtered), batch_size):
        batch = filtered[i:i+batch_size]
        batch_results = await self.llm_scorer.score_batch(
            batch, 
            product.get("description", ""), 
            product.get("icp", {})
        )
        
        for signal, score_result in zip(batch, batch_results):
            score = score_result["score"]
            reason = score_result["reason"]
            
            if score >= 70: category = "hot"
            elif score >= 45: category = "warm"
            else: category = "cold"
            
            all_scored.append({
                "signal_id": getattr(signal, 'id', None),
                "source": signal.source,
                "source_url": signal.source_url,
                "author_username": signal.author_username,
                "text": signal.text[:500],
                "final_score": score,
                "category": category,
                "reasoning": reason,
                "posted_at": signal.posted_at.isoformat() if hasattr(signal.posted_at, 'isoformat') else str(signal.posted_at),
                "metadata": signal.metadata,
            })
    
    all_scored.sort(key=lambda x: x["final_score"], reverse=True)
    return all_scored
```

---

## Expected Improvement

| Metric | Before | After |
|--------|--------|-------|
| Cold leads in output | Shown | Filtered out |
| Leads returned | All (hot+warm+cold) | Only hot+warm |
| LLM calls for 20 signals | 20 calls (~200s) | 4 calls (~40s) |
| Speed improvement | Baseline | **5x faster** |

---

## Git Commit

```bash
git add .
git commit -m "feat: filter cold leads + batch scoring for 5x speedup"
```
