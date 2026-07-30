import re


class SoftPreFilter:
    """
    Discard ONLY high-confidence noise.
    Let everything else through to LLM.

    Exa semantic matches (e.g., "need a way to bill clients")
    have INTENT but no KEYWORD → they PASS through.
    Only pure noise is discarded.
    """

    INTENT_PHRASES = [
        "looking for", "need", "anyone know", "recommend",
        "alternative to", "switching from", "frustrated with",
        "better than", "suggestion", "advice", "help me find",
        "what do you use", "what's the best", "how do you",
        "any suggestions", "open to", "ready to buy",
    ]

    def __init__(self, keywords: list[str]):
        self.keywords = [kw.lower() for kw in keywords]
        self.keyword_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(kw) for kw in self.keywords) + r')\b',
            re.IGNORECASE
        )
        self.intent_pattern = re.compile(
            r'(' + '|'.join(re.escape(p) for p in self.INTENT_PHRASES) + r')',
            re.IGNORECASE
        )

    def should_keep(self, text: str) -> bool:
        """Return True if signal should proceed to LLM scoring."""
        has_keyword = bool(self.keyword_pattern.search(text))
        has_intent = bool(self.intent_pattern.search(text))

        if not has_keyword and not has_intent:
            return False

        return True
