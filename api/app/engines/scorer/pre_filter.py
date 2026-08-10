import re


class SoftPreFilter:
    """
    Filters out obvious noise BEFORE LLM scoring.
    Saves LLM costs by removing 60-70% of irrelevant content.

    distinguishes BUYERS from BUILDERS/PROMOTERS/ARTICLES.
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

    # Regex patterns for promotional content
    PROMOTIONAL_PATTERNS = [
        r"i (built|made|created|launched)",
        r"check out (my|our|this)",
        r"(my|our) (product|app|tool|saas|startup)",
        r"just (launched|released|shipped)",
        r"(introducing|announcing) \w+",
        r"\d+ best \w+ (tools|apps|products|solutions)",
        r"top \d+ \w+ (tools|apps|products|solutions)",
        r"beta (users|testers|access)",
        r"early access",
        r"join (waitlist|beta)",
        r"sign up (for|to)",
        r"what (saas|tool|app) (do you|should i|would)",
        r"what do you wish",
        r"ideas? to get money",
        r"co-founder wanted",
        r"looking for (a )?(full[- ]?stack|developer|engineer|technical)",
    ]

    # Regex patterns for buying intent
    BUYING_PATTERNS = [
        r"looking for (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
        r"need (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
        r"anyone know (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
        r"recommend (a|an|the|some|any)? ?\w+ (tool|software|app|platform|solution|alternative)",
        r"alternative to",
        r"switching from",
        r"frustrated with",
        r"what do you use for",
        r"what'?s the best",
        r"help me find",
        r"ready to buy",
        r"budget approved",
    ]

    def __init__(self, keywords: list[str]):
        self.keywords = [kw.lower() for kw in keywords]
        self.keyword_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(kw) for kw in self.keywords) + r')\b',
            re.IGNORECASE
        )

    def should_keep(self, text: str) -> bool:
        """Return True if signal should proceed to LLM scoring."""
        text_lower = text.lower()

        # Check for promotional content FIRST
        has_promotional = (
            any(phrase in text_lower for phrase in self.PROMOTIONAL_PHRASES) or
            any(re.search(p, text_lower) for p in self.PROMOTIONAL_PATTERNS)
        )

        # Check for buying intent
        has_buying = (
            any(phrase in text_lower for phrase in self.BUYING_PHRASES) or
            any(re.search(p, text_lower) for p in self.BUYING_PATTERNS)
        )

        # Check for keyword match
        has_keyword = bool(self.keyword_pattern.search(text))

        # Decision logic:
        # - Has promotional + no buying intent → DISCARD
        # - Has buying intent → KEEP (let LLM decide)
        # - Has keyword + no clear signal → KEEP (let LLM decide)
        # - Neither → DISCARD

        if has_promotional and not has_buying:
            return False  # Promotional, not buying

        if has_buying:
            return True  # Has buying intent, let LLM score

        if has_keyword:
            return True  # Keyword match, let LLM decide

        return False  # No clear signal, discard
