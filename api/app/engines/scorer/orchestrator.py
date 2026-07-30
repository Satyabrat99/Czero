from .pre_filter import SoftPreFilter
from .llm_scorer import LLMIntentScorer


class ScorerEngine:
    """
    Dead simple scoring for MVP.

    1. Soft pre-filter (discard pure noise)
    2. LLM scores intent 0-100 (one call)
    3. Category: hot/warm/cold
    Done.
    """

    def __init__(self):
        self.pre_filter = None
        self.llm_scorer = LLMIntentScorer()

    async def score_signals(self, signals: list, product: dict) -> list[dict]:
        """Score a list of signals for a product."""
        self.pre_filter = SoftPreFilter(product.get("keywords", []))

        leads = []
        for signal in signals:
            if not self.pre_filter.should_keep(signal.text):
                continue

            result = await self.llm_scorer.score(
                text=signal.text,
                product_description=product.get("description", ""),
                icp=product.get("icp", {})
            )

            score = result["score"]
            reason = result["reason"]

            if score >= 70:
                category = "hot"
            elif score >= 45:
                category = "warm"
            else:
                category = "cold"

            lead = {
                "signal_id": getattr(signal, 'id', None),
                "source": signal.source,
                "source_url": signal.source_url,
                "author_username": signal.author_username,
                "text": signal.text[:500],
                "final_score": score,
                "category": category,
                "reasoning": reason,
                "posted_at": signal.posted_at.isoformat() if hasattr(signal.posted_at, 'isoformat') else signal.posted_at,
                "metadata": signal.metadata,
            }
            leads.append(lead)

        leads.sort(key=lambda x: x["final_score"], reverse=True)

        return leads
