import os
from openai import OpenAI


class OutreachDrafter:
    """Generate personalized outreach drafts for each lead."""

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_key_here":
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = None

    def generate_drafts(self, lead: dict, product: dict) -> dict:
        """Generate email + LinkedIn DM + Reddit reply drafts."""
        if not self.client:
            return self._heuristic_drafts(lead, product)

        post_text = lead.get("text", "")
        product_desc = product.get("description", "")
        product_name = product.get("name", "our product")

        prompts = {
            "email_draft": f"""Write a 3-sentence cold email to someone who posted:
"{post_text[:300]}"

Our product: {product_name} - {product_desc}

Sound human, not salesy. Reference their specific post. Include one soft CTA.
Return ONLY the email text, no subject line.""",
            "linkedin_dm_draft": f"""Write a 2-sentence LinkedIn message to someone who posted:
"{post_text[:300]}"

Our product: {product_name} - {product_desc}

Short, friendly, reference their post.
Return ONLY the message text.""",
            "reddit_reply_draft": f"""Write a helpful Reddit reply to:
"{post_text[:300]}"

Our product: {product_name} - {product_desc}

Answer their question genuinely. Mention product naturally, not pushy.
Sound like a real community member.
Return ONLY the reply text.""",
        }

        drafts = {}
        for key, prompt in prompts.items():
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=200,
                )
                drafts[key] = response.choices[0].message.content.strip()
            except Exception:
                drafts[key] = self._heuristic_drafts(lead, product).get(key, "")

        return drafts

    def _heuristic_drafts(self, lead: dict, product: dict) -> dict:
        """Generate basic drafts when LLM is unavailable."""
        product_name = product.get("name", "our product")
        post_text = lead.get("text", "")[:100]
        author = lead.get("author_username", "there")

        return {
            "email_draft": (
                f"Hi {author},\n\n"
                f"I saw your post about {post_text[:60]}... and thought {product_name} might help.\n\n"
                f"Worth a quick look? Happy to give you free access.\n\n"
                f"Best"
            ),
            "linkedin_dm_draft": (
                f"Hey {author}, saw your post about scheduling — "
                f"curious if you've tried {product_name}? Would love your feedback."
            ),
            "reddit_reply_draft": (
                f"Hey! {product_name} might be worth checking out for this. "
                f"It handles scheduling automatically. Free to try."
            ),
        }
