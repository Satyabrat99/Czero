import os
import json
import re
from openai import OpenAI


def _parse_json_robust(text):
    """Parse JSON with fallback for malformed responses."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        scores = re.findall(r'"score":\s*(\d+)', text)
        reasons = re.findall(r'"reason":\s*"([^"]+)"', text)
        if scores:
            return [{'score': int(s), 'reason': reasons[i] if i < len(reasons) else 'No reason'}
                    for i, s in enumerate(scores)]
        return None


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


BATCH_SCORE_PROMPT = """You are an expert buyer intent classifier for B2B SaaS products.

Your job: Score each post 0-100 based on HOW LIKELY the author is to BUY a product like ours.

PRODUCT WE'RE SELLING: {product_description}

SCORING RULES (CRITICAL):

HIGH SCORE (70-100) — ACTUAL BUYERS:
- "Looking for X" / "Need X" / "Anyone know X?" — actively searching
- "Alternative to [Competitor]" — ready to switch
- "Frustrated with X" — pain signal, wants solution
- "What do you use for X?" — asking for recommendations

MEDIUM SCORE (40-69) — POTENTIAL BUYERS:
- "Considering X" — in research phase
- "Comparing X vs Y" — evaluating options

LOW SCORE (0-39) — NOT BUYERS:
- "I built X" — competitor/builder, NOT a buyer
- "Check out my product" — promotional, NOT a buyer
- "10 best X tools" — article/listicle, NOT a buyer
- "X just launched" — news, NOT a buyer

DO NOT score high just because keywords match.
- "Looking for beta users for my product" → LOW SCORE (promoting)
- "Looking for a good invoicing tool" → HIGH SCORE (buying)

POSTS:
{posts_text}

For EACH post, return: {{"score": N, "reason": "1-2 sentences explaining WHY this is or isn't a buyer"}}
Return JSON array: [{{"score": N, "reason": "..."}}, ...]
"""


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
        "extra_body": None,
    },
    "commandcode": {
        "name": "CommandCode",
        "base_url": "https://api.commandcode.ai/provider/v1",
        "model": "deepseek/deepseek-v4-flash",
        "env_key": "COMMANDCODE_API_KEY",
        "extra_body": None,
    },
    "heuristic": {
        "name": "Heuristic",
        "base_url": "",
        "model": "",
        "env_key": "HEURISTIC_DUMMY",
        "extra_body": None,
    },
}


class LLMIntentScorer:
    """
    LLM scoring with multi-provider support and batch mode.

    Distinguishes BUYERS from BUILDERS/PROMOTERS/ARTICLES.
    Falls back to heuristic scoring if LLM unavailable.
    """

    TIMEOUT_SECONDS = 60

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
                base_url=provider["base_url"],
                timeout=self.TIMEOUT_SECONDS,
            )
            print(f"LLM scorer initialized: {provider['name']} ({self.model})")
        else:
            self.client = None
            print(f"WARNING: {provider['env_key']} not set — using heuristic scoring")

    def _heuristic_score(self, text: str) -> dict:
        """Intelligent heuristic scoring that distinguishes buyers from promoters."""
        text_lower = text.lower()

        # PROMOTIONAL patterns — these are builders/promoters, NOT buyers
        promotional_patterns = [
            r"i built", r"i made", r"i created", r"i launched",
            r"check out", r"my product", r"my app", r"my saas",
            r"just launched", r"introducing", r"announcing", r"new feature",
            r"beta users", r"beta testers", r"early access",
            r"join waitlist", r"sign up",
            r"10 best", r"top 10", r"list of", r"comparison of",
            r"how to use", r"tutorial", r"guide to", r"learn about",
            r"case study", r"success story", r"testimonial",
            r"looking for.*beta",
            r"looking for.*testers",
            r"we (are|just|have|built|launched)",
            r"what (saas|tool|app) (do you|should i|would)",
            r"what do you wish",
            r"ideas? to get money",
            r"co-founder wanted",
            r"looking for (a )?(full[- ]?stack|developer|engineer|technical)",
        ]
        for pattern in promotional_patterns:
            if re.search(pattern, text_lower):
                return {"score": 15, "reason": "Promotional/builder content — author is building, not buying"}

        # STRONG BUYER signals — actively looking to buy
        strong_buyer_patterns = [
            r"looking for (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"need (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"anyone know (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"recommend (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
            r"alternative to",
            r"switching from",
            r"frustrated with",
            r"ready to buy",
            r"budget approved",
            r"what do you use for",
            r"what'?s the best",
            r"help me find",
            r"any suggestions for",
        ]
        for pattern in strong_buyer_patterns:
            if re.search(pattern, text_lower):
                return {"score": 80, "reason": "Strong buyer intent — actively searching for a solution"}

        # MEDIUM BUYER signals — considering options
        medium_buyer_patterns = [
            r"considering",
            r"comparing",
            r"has anyone tried",
            r"evaluating",
            r"worth it",
            r"how do you handle",
            r"better than",
            r"suggestion",
            r"advice",
        ]
        for pattern in medium_buyer_patterns:
            if re.search(pattern, text_lower):
                return {"score": 60, "reason": "Medium buyer intent — considering options"}

        # WEAK signals — just discussing
        weak_signals = [
            "looking for", "need", "anyone know", "recommend",
        ]
        for phrase in weak_signals:
            if phrase in text_lower:
                return {"score": 45, "reason": "Weak intent signal — might be buying, needs LLM judgment"}

        return {"score": 25, "reason": "No clear buying intent detected"}

    async def score(self, text: str, product_description: str, icp: dict) -> dict:
        """Score a single signal for buying intent."""
        if not self.client:
            return self._heuristic_score(text)

        prompt = SCORE_PROMPT.format(
            product_description=product_description,
            source="social media",
            text=text[:500],
        )

        try:
            kwargs = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 200
            }
            if self.extra_body:
                kwargs["extra_body"] = self.extra_body

            response = self.client.chat.completions.create(**kwargs)

            content = response.choices[0].message.content or ""
            result = _parse_json_robust(content)
            if not result:
                return self._heuristic_score(text)
            return {
                "score": min(100, max(0, result.get("score", 0))),
                "reason": result.get("reason", "No reason provided")
            }
        except Exception as e:
            print(f"LLM scoring error ({self.provider_name}): {e}")
            return self._heuristic_score(text)

    async def score_batch(self, signals: list, product_description: str, icp: dict) -> list[dict]:
        """Score multiple signals in one LLM call."""
        if not self.client:
            return [self._heuristic_score(s.text) for s in signals]

        posts_text = ""
        for i, signal in enumerate(signals):
            posts_text += f"\n--- POST {i+1} (Source: {signal.source}) ---\n{signal.text[:300]}\n"

        prompt = BATCH_SCORE_PROMPT.format(
            product_description=product_description,
            posts_text=posts_text,
        )

        try:
            kwargs = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 500
            }
            if self.extra_body:
                kwargs["extra_body"] = self.extra_body

            response = self.client.chat.completions.create(**kwargs)

            content = response.choices[0].message.content or ""
            result = _parse_json_robust(content)

            if isinstance(result, list):
                scores = result
            elif isinstance(result, dict) and "scores" in result:
                scores = result["scores"]
            else:
                return [self._heuristic_score(s.text) for s in signals]

            while len(scores) < len(signals):
                scores.append({"score": 25, "reason": "Score not provided"})

            return [
                {
                    "score": min(100, max(0, s.get("score", 0))),
                    "reason": s.get("reason", "No reason")
                }
                for s in scores[:len(signals)]
            ]
        except Exception as e:
            print(f"LLM batch scoring error ({self.provider_name}): {e}")
            return [self._heuristic_score(s.text) for s in signals]
