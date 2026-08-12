# Phase 6: Intelligent Scoring & Filtering System

> Feed this to Command Code. This fixes the scoring to only show high-quality, relevant leads with actual buying intent.

---

## Problem

Current scoring is too lenient:
```
POST: "Reddit lead generation: find buyers who are already looking for you | RedShip"
SCORE: 75% HOT ❌
REALITY: This is a COMPETITOR promoting their product, not a buyer
```

We need to distinguish:
- ✅ BUYERS: "Anyone know a good lead gen tool?" → HIGH SCORE
- ❌ BUILDERS: "I built a lead gen tool" → LOW SCORE
- ❌ PROMOTERS: "Check out my product" → LOW SCORE
- ❌ ARTICLES: "10 best lead gen tools" → LOW SCORE

---

## Task

1. Update the LLM scoring prompt to detect buyer intent vs promotion
2. Add pre-filtering to remove promotional content
3. Only return hot/warm leads (score ≥ 60)
4. Improve "Why This Lead" explanations

---

## Step 1: Update LLM Scoring Prompt

**File:** `api/app/engines/scorer/llm_scorer.py`

Replace the scoring prompt with this more intelligent version:

```python
SCORE_PROMPT = """You are an expert buyer intent classifier for B2B SaaS products.

Your job: Score this post 0-100 based on HOW LIKELY the author is to BUY a product like ours.

PRODUCT WE'RE SELLING: {product_description}

POST TO SCORE:
Source: {source}
Text: {text}

SCORING RULES (CRITICAL):

HIGH SCORE (70-100) — ACTUAL BUYERS:
- "Looking for X" / "Need X" / "Anyone know X?" — actively searching
- "Alternative to [Competitor]" — ready to switch
- "Frustrated with X" — pain signal, wants solution
- "What do you use for X?" — asking for recommendations
- "Budget approved for X" — ready to buy

MEDIUM SCORE (40-69) — POTENTIAL BUYERS:
- "Considering X" — in research phase
- "Comparing X vs Y" — evaluating options
- "Has anyone tried X?" — curious but not committed

LOW SCORE (0-39) — NOT BUYERS:
- "I built X" — competitor/builder, NOT a buyer
- "Check out my product" — promotional, NOT a buyer
- "10 best X tools" — article/listicle, NOT a buyer
- "X just launched" — news, NOT a buyer
- "How X works" — educational, NOT a buyer
- Mentions product names without asking for alternatives

DO NOT score high just because keywords match.
A post can contain "looking for" but still be promotional:
- "Looking for beta users for my product" → LOW SCORE (promoting)
- "Looking for a good invoicing tool" → HIGH SCORE (buying)

Return JSON: {{"score": N, "reason": "1-2 sentences explaining WHY this is or isn't a buyer"}}
"""
```

---

## Step 2: Add Pre-Filter for Promotional Content

**File:** `api/app/engines/scorer/pre_filter.py`

Update the pre-filter to catch promotional content BEFORE LLM scoring:

```python
class SoftPreFilter:
    """
    Filters out obvious noise BEFORE LLM scoring.
    Saves LLM costs by removing 60-70% of irrelevant content.
    """
    
    # Phrases that indicate PROMOTIONAL content (not buying)
    PROMOTIONAL_PHRASES = [
        "i built", "i made", "check out", "my product", "my app",
        "just launched", "introducing", "announcing", "new feature",
        "beta users", "early access", "join waitlist", "sign up",
        "10 best", "top 10", "list of", "comparison of",
        "how to use", "tutorial", "guide to", "learn about",
        "case study", "success story", "testimonial",
    ]
    
    # Phrases that indicate BUYING intent
    BUYING_PHRASES = [
        "looking for", "need", "anyone know", "recommend",
        "alternative to", "switching from", "frustrated with",
        "better than", "what do you use", "what's the best",
        "help me find", "suggestions", "advice",
        "budget approved", "ready to buy", "evaluation",
    ]
    
    def should_keep(self, text: str) -> bool:
        """Return True if signal should proceed to LLM scoring."""
        text_lower = text.lower()
        
        # Check for promotional content FIRST
        has_promotional = any(phrase in text_lower for phrase in self.PROMOTIONAL_PHRASES)
        
        # Check for buying intent
        has_buying = any(phrase in text_lower for phrase in self.BUYING_PHRASES)
        
        # Decision logic:
        # - Has promotional + no buying intent → DISCARD
        # - Has buying intent → KEEP (let LLM decide)
        # - Neither → DISCARD
        
        if has_promotional and not has_buying:
            return False  # Promotional, not buying
        
        if has_buying:
            return True   # Has buying intent, let LLM score
        
        return False  # No clear signal, discard
```

---

## Step 3: Update Orchestrator to Only Return Hot/Warm

**File:** `api/app/routes/products.py`

Update the full-pipeline endpoint to only return relevant leads:

```python
@router.post("/full-pipeline")
async def full_pipeline(product: ProductCreate):
    """Complete pipeline: collect -> score -> enrich -> draft. Only hot/warm."""
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
```

---

## Step 4: Improve "Why This Lead" Explanations

**File:** `api/app/services/drafter.py`

Update the drafter to generate better explanations:

```python
def generate_drafts(self, lead: dict, product: dict) -> dict:
    """Generate email + LinkedIn DM + Reddit reply drafts."""
    
    post_text = lead.get("text", "")
    product_desc = product.get("description", "")
    reasoning = lead.get("reasoning", "")
    
    email_prompt = f"""Write a 3-sentence cold email to someone who posted:
"{post_text[:300]}"

Our product: {product_desc}
Why we're reaching out: {reasoning}

Rules:
- Reference their SPECIFIC post (not generic)
- Sound human, not salesy
- One soft CTA (not pushy)
- Keep it under 50 words

Return ONLY the email text, no subject line."""
    
    # ... rest of draft generation
```

---

## Expected Results

```
BEFORE (bad):
├── "Reddit lead generation: find buyers..." → 75% HOT ❌
├── "I built a scheduling app" → 85% HOT ❌
└── "10 best tools" → 70% HOT ❌

AFTER (good):
├── "Anyone know a good lead gen tool?" → 90% HOT ✅
├── "Looking for Calendly alternative" → 85% HOT ✅
├── "Frustrated with current CRM" → 80% HOT ✅
├── "I built a scheduling app" → 15% COLD ✅ (filtered out)
├── "10 best tools" → 10% COLD ✅ (filtered out)
└── "Check out my product" → 5% COLD ✅ (filtered out)
```

---

## Git Commit

```bash
git add .
git commit -m "feat: intelligent scoring - only show high-intent buyers"
```
