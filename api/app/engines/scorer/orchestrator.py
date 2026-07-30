from .pre_filter import SoftPreFilter
from .llm_scorer import LLMIntentScorer


class ScorerEngine:
    """
    Dead simple scoring for MVP with batch mode.
    
    1. Soft pre-filter (discard pure noise)
    2. LLM batch scores intent 0-100 (5 signals per call)
    3. Category: hot/warm/cold
    Done.
    """

    def __init__(self):
        self.pre_filter = None
        self.llm_scorer = LLMIntentScorer()

    async def score_signals(self, signals: list, product: dict) -> list[dict]:
        """Score a list of signals for a product using batch mode."""
        self.pre_filter = SoftPreFilter(product.get("keywords", []))

        # Pre-filter: keep only signals that match keywords or intent phrases
        filtered = [s for s in signals if self.pre_filter.should_keep(s.text)]

        # Batch score in groups of 5 (5x faster than individual)
        all_scored = []
        batch_size = 5

        for i in range(0, len(filtered), batch_size):
            batch = filtered[i:i + batch_size]
            batch_results = await self.llm_scorer.score_batch(
                batch,
                product.get("description", ""),
                product.get("icp", {})
            )

            for signal, score_result in zip(batch, batch_results):
                score = score_result["score"]
                reason = score_result["reason"]

                if score >= 70:
                    category = "hot"
                elif score >= 45:
                    category = "warm"
                else:
                    category = "cold"

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
