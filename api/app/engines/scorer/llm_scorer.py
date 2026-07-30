import os
import json
from openai import OpenAI


class LLMIntentScorer:
    """
    One LLM call scores intent 0-100 + generates reasoning.
    Simple. No batching complexity.
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None

    async def score(self, text: str, product_description: str, icp: dict) -> dict:
        """Score a single signal for buying intent."""
        if not self.client:
            return {"score": 0, "reason": "OPENAI_API_KEY not configured"}

        prompt = f"""Score this social media post for buying intent (0-100).

Product: {product_description}
Target customer: {json.dumps(icp)}

Post: "{text[:500]}"

Score:
- 90-100: Directly asking for this type of product
- 70-89: Strong interest in solving this problem
- 50-69: Discussing the problem space
- 30-49: Tangential mention
- 0-29: No intent

Return JSON: {{"score": N, "reason": "1-2 sentences explaining why"}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=200
            )

            result = json.loads(response.choices[0].message.content)
            return {
                "score": min(100, max(0, result.get("score", 0))),
                "reason": result.get("reason", "No reason provided")
            }
        except Exception as e:
            print(f"LLM scoring error: {e}")
            return {"score": 0, "reason": f"Scoring error: {e}"}
