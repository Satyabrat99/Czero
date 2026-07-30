import os
from openai import OpenAI


class OutreachDrafter:
    """Generate personalized outreach drafts for each lead."""

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None

    def generate_drafts(self, lead: dict, product: dict) -> dict:
        """Generate email + LinkedIn DM + Reddit reply drafts."""
        if not self.client:
            return {
                "email_draft": "OPENAI_API_KEY not configured",
                "linkedin_dm_draft": "OPENAI_API_KEY not configured",
                "reddit_reply_draft": "OPENAI_API_KEY not configured",
            }

        post_text = lead.get("text", "")
        product_desc = product.get("description", "")

        email_prompt = f"""Write a 3-sentence cold email to someone who posted:
"{post_text[:300]}"

Our product: {product_desc}

Sound human, not salesy. Reference their specific post. Include one soft CTA.
Return ONLY the email text, no subject line."""

        linkedin_prompt = f"""Write a 2-sentence LinkedIn message to someone who posted:
"{post_text[:300]}"

Our product: {product_desc}

Short, friendly, reference their post.
Return ONLY the message text."""

        reddit_prompt = f"""Write a helpful Reddit reply to:
"{post_text[:300]}"

Our product: {product_desc}

Answer their question genuinely. Mention product naturally, not pushy.
Sound like a real community member.
Return ONLY the reply text."""

        drafts = {}
        for key, prompt in [("email_draft", email_prompt), ("linkedin_dm_draft", linkedin_prompt), ("reddit_reply_draft", reddit_prompt)]:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=200
                )
                drafts[key] = response.choices[0].message.content.strip()
            except Exception as e:
                drafts[key] = f"Draft generation error: {e}"

        return drafts
