"""
Generates buyer-intent keywords from product URL and description.
Instead of generic keywords like "lead generation", we generate
specific phrases that buyers actually use.
"""


class KeywordGenerator:
    """Generate buyer-intent keywords from product info."""

    INTENT_TEMPLATES = [
        # Looking for alternatives
        "looking for {competitor} alternative",
        "alternative to {competitor}",
        "switching from {competitor}",
        "replace {competitor}",

        # Asking for recommendations
        "anyone know good {keyword}",
        "recommend {keyword} tool",
        "best {keyword} for {audience}",
        "{keyword} suggestion",

        # Expressing pain
        "frustrated with {keyword}",
        "{keyword} not working",
        "need better {keyword}",
        "tired of {keyword}",

        # Comparison
        "{competitor} vs",
        "{competitor} comparison",
        "is {competitor} worth it",
    ]

    NOISE_PHRASES = [
        # Dictionary/thesaurus
        "synonyms", "thesaurus", "dictionary", "definition",

        # Wrong product type
        "insecticide", "pesticide", "chemical", "formula",

        # Sports/entertainment
        "football", "soccer", "united", "match", "game",
        "download", "play", "stream",

        # Generic content
        "best practices", "guide to", "how to use",
        "top 10", "list of", "comparison",
        "tutorial", "documentation", "api reference",
    ]

    BUYER_INTENT_PHRASES = [
        "looking for", "need", "anyone know", "recommend",
        "alternative to", "switching from", "frustrated with",
        "what do you use", "what's the best", "help me find",
    ]

    def generate_keywords(
        self,
        product_url: str,
        product_name: str,
        competitors: list[str],
        target_audience: str = "SaaS founders",
    ) -> list[str]:
        """Generate buyer-intent keywords from product info."""
        keywords = []

        # Extract main keyword from product name
        main_keyword = product_name.lower().replace(".com", "").replace(".ai", "")

        # Generate competitor-focused keywords
        for comp in competitors[:3]:
            keywords.append(f"looking for {comp} alternative")
            keywords.append(f"alternative to {comp}")
            keywords.append(f"switching from {comp}")

        # Generate general buyer-intent keywords
        keywords.append(f"anyone know good {main_keyword}")
        keywords.append(f"recommend {main_keyword} tool")
        keywords.append(f"best {main_keyword} for {target_audience}")
        keywords.append(f"frustrated with {main_keyword}")

        return keywords[:15]  # Limit to 15 keywords

    def is_noise(self, text: str) -> bool:
        """Check if text is noise (not relevant)."""
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in self.NOISE_PHRASES)

    def has_buyer_intent(self, text: str) -> bool:
        """Check if text shows buyer intent."""
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in self.BUYER_INTENT_PHRASES)
