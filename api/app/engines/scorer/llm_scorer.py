import os
import json
from openai import OpenAI

def _parse_json_robust(text):
    """Parse JSON with fallback for malformed responses."""
    import json, re
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        scores = re.findall(r'"score":\s*(\d+)', text)
        reasons = re.findall(r'"reason":\s*"([^"]+)"', text)
        if scores:
            return [{'score': int(s), 'reason': reasons[i] if i < len(reasons) else 'No reason'} 
                    for i, s in enumerate(scores)]
        return None




# Available LLM providers
PROVIDERS = {
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY",
        "extra_body": None,
    },
    "mimo": {
        "name": "Xiaomi MiMo",
        "base_url": "https://api.xiaomimimo.com/v1",
        "model": "mimo-v2.5",
        "env_key": "MIMO_API_KEY",
        "extra_body": {"thinking": {"type": "disabled"}},
    },
}


class LLMIntentScorer:
    """
    LLM scoring with multi-provider support and batch mode.
    
    Supports:
    - OpenAI (gpt-4o-mini)
    - Xiaomi MiMo (mimo-v2.5)
    
    Provider is selected via LLM_PROVIDER env var.
    Falls back to OpenAI if not set.
    """
    
    def __init__(self):
        provider_name = os.getenv("LLM_PROVIDER", "openai")
        provider = PROVIDERS.get(provider_name, PROVIDERS["openai"])
        
        api_key = os.getenv(provider["env_key"])
        self.model = provider["model"]
        self.provider_name = provider["name"]
        self.extra_body = provider.get("extra_body")
        
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
        
        prompt = f"""Score this social media post for BUYING INTENT (0-100).

Product: {product_description}
Target customer: {json.dumps(icp)}

Post: "{text[:500]}"

CRITICAL: We want people who WANT TO BUY, not people who BUILD or DISCUSS.

Score:
- 90-100: Explicitly asking to buy/find/get this type of product ("anyone know a good X?", "looking for X alternative", "need X")
- 70-89: Strong buying signal ("frustrated with current tool", "ready to switch", "budget approved")
- 50-69: Considering ("comparing options", "evaluating solutions")
- 30-49: Just discussing the topic (no buying signal)
- 10-29: Building/competing with this product (COMPETITOR, not buyer)
- 0: Completely unrelated

DO NOT score high for:
- People BUILDING similar products (they are competitors, not buyers)
- People DISCUSSING the topic theoretically
- Articles/tutorials about the topic
- Technical implementations

DO score high for:
- People asking for recommendations
- People expressing frustration with current solutions
- People actively looking to switch or buy

Return JSON: {{"score": N, "reason": "1-2 sentences explaining why"}}"""
        
        try:
            kwargs = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.3,
                "max_tokens": 200
            }
            if self.extra_body:
                kwargs["extra_body"] = self.extra_body
            
            response = self.client.chat.completions.create(**kwargs)
            
            result = _parse_json_robust(response.choices[0].message.content)
            return {
                "score": min(100, max(0, result.get("score", 0))),
                "reason": result.get("reason", "No reason provided")
            }
        except Exception as e:
            print(f"LLM scoring error ({self.provider_name}): {e}")
            return {"score": 0, "reason": f"Scoring error: {e}"}
    
    async def score_batch(self, signals: list, product_description: str, icp: dict) -> list[dict]:
        """Score multiple signals in one LLM call (5x faster than individual)."""
        if not self.client:
            return [{"score": 0, "reason": "LLM API key not configured"}] * len(signals)
        
        # Build batch prompt
        posts_text = ""
        for i, signal in enumerate(signals):
            posts_text += f"\n--- POST {i+1} ---\n{signal.text[:300]}\n"
        
        prompt = f"""Score these {len(signals)} social media posts for BUYING INTENT (0-100 each).

Product: {product_description}
Target customer: {json.dumps(icp)}

CRITICAL: We want people who WANT TO BUY, not people who BUILD or DISCUSS.

Posts:
{posts_text}

For EACH post, score based on:
- 90-100: Explicitly asking to buy/find/get this product
- 70-89: Strong buying signal (frustrated, ready to switch)
- 50-69: Considering options
- 30-49: Just discussing (no buying signal)
- 10-29: Building/competing (COMPETITOR, not buyer)
- 0: Unrelated

DO NOT score high for people BUILDING similar products.
DO NOT score high for articles/tutorials.
DO score high for people ASKING for recommendations.

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
            
            result = _parse_json_robust(response.choices[0].message.content)
            
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
            print(f"LLM batch scoring error ({self.provider_name}): {e}")
            return [{"score": 0, "reason": f"Error: {e}"}] * len(signals)
