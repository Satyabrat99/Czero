import os
import json
from openai import OpenAI


# Available LLM providers
PROVIDERS = {
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY",
    },
    "mimo": {
        "name": "Xiaomi MiMo",
        "base_url": "https://api.xiaomimimo.com/v1",
        "model": "mimo-v2.5-pro",
        "env_key": "MIMO_API_KEY",
    },
}


class LLMIntentScorer:
    """
    LLM scoring with multi-provider support.
    
    Supports:
    - OpenAI (gpt-4o-mini)
    - Xiaomi MiMo (mimo-v2.5-pro)
    
    Provider is selected via LLM_PROVIDER env var.
    Falls back to OpenAI if not set.
    """
    
    def __init__(self):
        provider_name = os.getenv("LLM_PROVIDER", "openai")
        provider = PROVIDERS.get(provider_name, PROVIDERS["openai"])
        
        api_key = os.getenv(provider["env_key"])
        self.model = provider["model"]
        self.provider_name = provider["name"]
        
        if api_key:
            self.client = OpenAI(
                api_key=api_key,
                base_url=provider["base_url"]
            )
            print(f"LLM scorer initialized: {provider['name']} ({self.model})")
        else:
            self.client = None
            print(f"WARNING: {provider['env_key']} not set — LLM scoring disabled")
    
    async def score(self, text: str, product_description: str, icp: dict) -> dict:
        """Score a single signal for buying intent."""
        if not self.client:
            return {"score": 0, "reason": "LLM API key not configured"}
        
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
                model=self.model,
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
            print(f"LLM scoring error ({self.provider_name}): {e}")
            return {"score": 0, "reason": f"Scoring error: {e}"}
