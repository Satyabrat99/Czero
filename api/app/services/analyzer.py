import os
import json
import re
import logging
from openai import OpenAI

logger = logging.getLogger("analyzer")

ANALYSIS_PROMPT = """You are an expert product analyst and B2B marketer.
Analyze the following text scraped from a product's landing page.

LANDING PAGE TEXT:
{scraped_text}

Your job is to extract:
1. Product Name (e.g., "Pounce")
2. Product Description (1-2 sentences summarizing the core value proposition and what the tool does)
3. ICP (Ideal Customer Profile) details:
   - target_audience: Specific target professionals/developers or businesses who buy this.
   - primary_use_case: Exactly when and how they use it.
   - pain_point_solved: The specific frustration or bottleneck they bypass.
   - usps: A list of 3-5 Unique Selling Propositions (core technical or product differentiators, e.g. "runs 24/7", "free API access", "bypasses Cloudflare", "one-click installation").
   - problem_solved_description: A detailed, in-depth explanation of the broader problem this product solves.
4. Subreddit List:
   - Generate 3-5 subreddits where target buyers or users discuss this specific domain.
   - CRITICAL: Prefer highly specific, niche subreddits related to the product's technology stack, specific target profession, or industry over generic ones.
   - Guidelines & Examples:
     * If developer tool: suggest stack-specific communities (e.g. ["django", "reactjs", "elixir", "webdev"]) instead of broad ["programming"].
     * If e-commerce tool: suggest ["shopify", "ecommerce", "dropship"] instead of broad ["business"].
     * If marketing tool: suggest ["seo", "copywriting", "socialmedia"] instead of broad ["marketing"].
     * Fallback to generic subreddits (["SaaS", "startups", "Entrepreneur"]) ONLY if the product is a broad general utility.
5. Keywords (5-8 high-intent buyer search queries that a prospective buyer would write online when looking for a tool like this. Use templates like:
   - "recommend [product_category] tool"
   - "best [product_category] for [audience]"
   - "what do you use for [use_case]"
   Make these extremely natural search queries, not single words. Do NOT include competitor-specific phrases since competitors are not predicted.)

Return ONLY a valid JSON object matching this schema:
{
    "name": "string",
    "description": "string",
    "icp": {
        "target_audience": "string",
        "primary_use_case": "string",
        "pain_point_solved": "string",
        "usps": ["string", "string", ...],
        "problem_solved_description": "string"
    },
    "subreddit_list": ["string", "string", ...],
    "keywords": ["string", "string", ...]
}

Do not include any chat preamble, postamble, or formatting (like ```json or ```). Output raw JSON only.
"""

class ProductAnalyzer:
    """Uses NVIDIA NIM (meta/llama-3.1-70b-instruct) to extract product profile."""

    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.model = "meta/llama-3.1-8b-instruct"
        
        if self.api_key:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=30.0
            )
        else:
            self.client = None
            logger.warning("NVIDIA_API_KEY not configured. ProductAnalyzer will return empty profiles.")

    def _clean_json_response(self, text: str) -> str:
        """Extract JSON code block or raw JSON string if formatted with markdown."""
        text = text.strip()
        # Find JSON block if wrapped in ```json ... ```
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            return match.group(1).strip()
        return text

    async def analyze(self, scraped_text: str) -> dict:
        """Analyze page text and extract structured product details using LLM."""
        default_profile = {
            "name": "",
            "description": "",
            "competitor_names": [],
            "icp": {
                "target_audience": "",
                "primary_use_case": "",
                "pain_point_solved": "",
                "usps": [],
                "problem_solved_description": "",
                "visual_description": ""
            },
            "subreddit_list": ["SaaS", "startups", "Entrepreneur"],
            "keywords": []
        }

        if not self.client:
            logger.warning("No NVIDIA client configured. Returning default profile.")
            return default_profile

        if not scraped_text or len(scraped_text.strip()) < 50:
            logger.warning("Scraped text too short to analyze.")
            return default_profile

        # Truncate scraped text to ~3000 tokens (12000 chars) to stay within safety and token limits
        prompt = ANALYSIS_PROMPT.replace("{scraped_text}", scraped_text[:12000])

        try:
            # We run the synchronous completion client call.
            # In a production async app we can wrap this in a run_in_executor to avoid blocking the event loop.
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800,
                response_format={"type": "json_object"}
            )

            raw_content = response.choices[0].message.content or ""
            cleaned_json = self._clean_json_response(raw_content)
            
            profile = json.loads(cleaned_json)
            
            # Basic validation/normalization of keys
            for key in ["name", "description", "icp", "subreddit_list", "keywords"]:
                if key not in profile:
                    profile[key] = default_profile[key]
            
            profile["competitor_names"] = [] # Explicitly empty as competitors are user-supplied
            
            if not isinstance(profile["icp"], dict):
                profile["icp"] = default_profile["icp"]
            else:
                for icp_key in ["target_audience", "primary_use_case", "pain_point_solved", "usps", "problem_solved_description"]:
                    if icp_key not in profile["icp"]:
                        profile["icp"][icp_key] = default_profile["icp"][icp_key]
                profile["icp"]["visual_description"] = ""

            # Cap keywords/competitors limits to prevent huge queries
            profile["keywords"] = [k.strip() for k in profile["keywords"] if k.strip()][:15]
            profile["subreddit_list"] = [s.strip() for s in profile["subreddit_list"] if s.strip()][:5]

            return profile

        except Exception as e:
            logger.error(f"Error calling NVIDIA NIM in ProductAnalyzer: {e}")
            return default_profile

    async def analyze_screenshot(self, image_base64: str) -> str:
        """Use Llama 3.2 Vision model via NVIDIA integrate API to analyze uploaded product screenshot."""
        if not self.client:
            logger.warning("No NVIDIA client. Cannot analyze screenshot.")
            return ""

        # Remove header details if present (e.g. data:image/png;base64,)
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        try:
            logger.info("Sending screenshot base64 to Llama Vision NIM...")
            response = self.client.chat.completions.create(
                model="meta/llama-3.2-11b-vision-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "Analyze this screenshot of a product landing page or interface. Provide a concise 2-3 sentence description of: 1. The visual styling / UI aesthetics, 2. The core visual elements shown (e.g., graphs, code editors, data tables), and 3. The perceived complexity of the software."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=250,
                temperature=0.2
            )
            description = response.choices[0].message.content or ""
            logger.info("Screenshot vision analysis completed successfully.")
            return description.strip()
        except Exception as e:
            logger.error(f"Error analyzing screenshot via NVIDIA Vision model: {e}")
            return ""
