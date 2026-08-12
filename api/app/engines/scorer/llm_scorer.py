import os
import json
import re
import html
from openai import OpenAI


def clean_text(text: str) -> str:
    """Clean raw text: unescape HTML entities and strip HTML tags."""
    if not text:
        return ""
    # Unescape HTML entities (&gt; -> >, &#x2F; -> /, &amp; -> &, etc.)
    text = html.unescape(text)
    # Strip HTML tags like <p>, <pre>, <code>, <a>, <span>
    text = re.sub(r'<[^>]+>', ' ', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


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

LOW SCORE (0-39) — NOT BUYERS (SELLERS / PROMOTERS / AGENCIES):
- "SEEKING WORK" / "Freelancer" / "Agency" — seller advertising services, NOT a buyer
- "Hiring" / "Job posting" / "Co-founder wanted" — hiring ad, NOT a buyer
- "I built X" / "Show HN" — competitor/builder promoting their app, NOT a buyer
- "Check out my product" / "Lite Agent is..." — promotional showcase, NOT a buyer
- "10 best X tools" / "Scrapy vs Selenium" — comparison article/guide, NOT a buyer
- "X just launched" — news, NOT a buyer

DO NOT score high just because keywords match.
- "Seeking work | Team of developers available" → SCORE 0 (agency/seller)
- "Lite Agent is a browser copilot | Hiring Sales Agent" → SCORE 0 (promoting/hiring)
- "Scrapy vs Selenium in 2026" → SCORE 15 (guide/article)
- "Looking for a good scraping API tool" → SCORE 90 (actual buyer)

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

LOW SCORE (0-39) — NOT BUYERS (SELLERS / PROMOTERS / AGENCIES / ARTICLES):
- "SEEKING WORK" / "Freelancer" / "Agency" — seller offering services (SCORE 0)
- "Hiring" / "Job post" — hiring ad (SCORE 0)
- "I built X" / "Show HN" / "Lite Agent is..." — self-promoter (SCORE 0)
- "Tool A vs Tool B" / "Best tools for X" — blog post/article (SCORE 15)

IMPORTANT: Evaluate EACH post completely independently. Do NOT mix context between posts.

POSTS:
{posts_text}

For EACH post, return JSON array in exact matching order:
[
  {{"score": N, "reason": "1-2 sentences explaining WHY this post author is or isn't a buyer"}},
  ...
]
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
    "nvidia": {
        "name": "Nvidia NIM",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "meta/llama-3.1-8b-instruct",
        "env_key": "NVIDIA_API_KEY",
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
    LLM scoring with multi-provider support, HTML cleaning, heuristic pre-filtering,
    and chunked batch scoring (max 10 signals per call).
    """

    TIMEOUT_SECONDS = 60
    MAX_BATCH_SIZE = 10

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
        """Intelligent heuristic scoring that distinguishes buyers from promoters, agencies, and articles."""
        cleaned = clean_text(text)
        text_lower = cleaned.lower()

        # SELLER / AGENCY / FREELANCER / JOB SEEKER patterns — score 0 (sellers/job seekers, NOT buyers)
        seller_patterns = [
            r"seeking work", r"seeking contract", r"available for hire",
            r"freelancer", r"agency", r"team of developers", r"pm \+ 1 qa",
            r"hiring sales agent", r"hiring developer", r"hiring engineer",
            r"job opening", r"co-founder wanted",
            r"willing to relocate", r"relocate:", r"technologies:",
            r"resume", r"curriculum vitae", r"portfolio:",
            r"location:", r"remote: yes", r"remote: no",
            r"seeking role", r"open to work",
        ]
        for pattern in seller_patterns:
            if re.search(pattern, text_lower):
                return {"score": 0, "reason": "Seller/agency/job seeker post — author is offering services or seeking a job, not buying"}


        # PROMOTIONAL patterns — these are builders/promoters, NOT buyers
        promotional_patterns = [
            r"i built", r"i made", r"i created", r"i launched",
            r"check out", r"my product", r"my app", r"my saas",
            r"just launched", r"introducing", r"announcing", r"new feature",
            r"beta users", r"beta testers", r"early access",
            r"join waitlist", r"sign up",
            r"show hn:", r"show hn",
            r"10 best", r"top 10", r"list of", r"comparison of", r" vs ",
            r"how to use", r"tutorial", r"guide to", r"learn about",
            r"case study", r"success story", r"testimonial",
            r"looking for.*beta", r"looking for.*testers",
            r"we (are|just|have|built|launched)",
            r"what (saas|tool|app) (do you|should i|would)",
            r"ideas? to get money",
        ]
        for pattern in promotional_patterns:
            if re.search(pattern, text_lower):
                return {"score": 15, "reason": "Promotional/builder/article content — author is promoting or publishing, not buying"}

        # STRONG BUYER signals — actively looking to buy
        strong_buyer_patterns = [
            r"looking for (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative|api)",
            r"need (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative|api)",
            r"anyone know (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative|api)",
            r"recommend (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative|api)",
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
            r"considering", r"comparing", r"has anyone tried", r"evaluating",
            r"worth it", r"how do you handle", r"better than", r"suggestion", r"advice",
        ]
        for pattern in medium_buyer_patterns:
            if re.search(pattern, text_lower):
                return {"score": 60, "reason": "Medium buyer intent — considering options"}

        # WEAK signals — just discussing
        weak_signals = ["looking for", "need", "anyone know", "recommend"]
        for phrase in weak_signals:
            if phrase in text_lower:
                return {"score": 45, "reason": "Weak intent signal — might be buying, needs LLM judgment"}

        return {"score": 25, "reason": "No clear buying intent detected"}

    async def score(self, text: str, product_description: str, icp: dict) -> dict:
        """Score a single signal for buying intent."""
        cleaned = clean_text(text)
        
        # Check heuristic first — if clearly seller/promo, short-circuit
        h_score = self._heuristic_score(cleaned)
        if h_score["score"] <= 25:
            return h_score

        if not self.client:
            return h_score

        prompt = SCORE_PROMPT.format(
            product_description=product_description,
            source="social media",
            text=cleaned[:500],
        )

        try:
            kwargs = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 200
            }
            if self.extra_body:
                kwargs["extra_body"] = self.extra_body

            response = self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content or ""
            result = _parse_json_robust(content)
            if not result:
                return h_score
            if isinstance(result, list) and len(result) > 0:
                result = result[0]
            return {
                "score": min(100, max(0, result.get("score", 0))),
                "reason": result.get("reason", "No reason provided")
            }
        except Exception as e:
            print(f"LLM scoring error ({self.provider_name}): {e}")
            return h_score

    async def score_batch(self, signals: list, product_description: str, icp: dict) -> list[dict]:
        """
        Score multiple signals safely:
        1. Clean text & apply heuristic pre-filter to drop sellers/promoters (Score <= 25).
        2. Send remaining ambiguous signals to LLM in mini-batches of MAX_BATCH_SIZE (10).
        """
        results = [None] * len(signals)
        llm_candidates = []  # List of (original_index, cleaned_text, signal_source)

        # Step 1: Pre-filter all signals using heuristics & clean HTML
        for i, signal in enumerate(signals):
            cleaned = clean_text(signal.text)
            # Mutate text on signal so frontend receives sanitized text
            signal.text = cleaned

            h_score = self._heuristic_score(cleaned)
            if h_score["score"] <= 25:
                results[i] = h_score
            else:
                llm_candidates.append((i, cleaned, getattr(signal, 'source', 'web')))

        # If all were pre-filtered or no LLM client available, return immediately
        if not llm_candidates or not self.client:
            for i in range(len(signals)):
                if results[i] is None:
                    results[i] = self._heuristic_score(signals[i].text)
            return results

        # Step 2: Process LLM candidates in mini-batches of 10
        for b_start in range(0, len(llm_candidates), self.MAX_BATCH_SIZE):
            chunk = llm_candidates[b_start : b_start + self.MAX_BATCH_SIZE]
            
            posts_text = ""
            for idx, (orig_idx, cleaned_text, source) in enumerate(chunk):
                posts_text += f"\n--- POST {idx + 1} OF {len(chunk)} (Source: {source}) ---\n{cleaned_text[:350]}\n"

            prompt = BATCH_SCORE_PROMPT.format(
                product_description=product_description,
                posts_text=posts_text,
            )

            try:
                kwargs = {
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "max_tokens": 600
                }
                if self.extra_body:
                    kwargs["extra_body"] = self.extra_body

                response = self.client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content or ""
                chunk_scores = _parse_json_robust(content)

                if not isinstance(chunk_scores, list):
                    if isinstance(chunk_scores, dict) and "scores" in chunk_scores:
                        chunk_scores = chunk_scores["scores"]
                    else:
                        chunk_scores = []

                for idx, (orig_idx, cleaned_text, source) in enumerate(chunk):
                    if idx < len(chunk_scores) and isinstance(chunk_scores[idx], dict):
                        sc = chunk_scores[idx]
                        results[orig_idx] = {
                            "score": min(100, max(0, sc.get("score", 0))),
                            "reason": sc.get("reason", "No reason provided")
                        }
                    else:
                        # Fallback to heuristic if LLM output missed an item
                        results[orig_idx] = self._heuristic_score(cleaned_text)

            except Exception as e:
                print(f"LLM batch chunk scoring error ({self.provider_name}): {e}")
                for orig_idx, cleaned_text, source in chunk:
                    results[orig_idx] = self._heuristic_score(cleaned_text)

        return results

