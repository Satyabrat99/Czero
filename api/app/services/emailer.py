import os


class EmailSender:
    """Send email digests using Resend."""

    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "digest@czero.ai")

    def send_digest(self, to_email: str, product_name: str, leads: list[dict]) -> bool:
        """Send weekly digest email with leads."""
        if not self.api_key:
            print("RESEND_API_KEY not set — skipping email")
            return False

        hot_leads = [l for l in leads if l["category"] == "hot"]
        warm_leads = [l for l in leads if l["category"] == "warm"]

        html = self._build_html(product_name, hot_leads, warm_leads)

        try:
            import resend
            resend.api_key = self.api_key
            resend.Emails.send({
                "from": self.from_email,
                "to": to_email,
                "subject": f"{len(hot_leads) + len(warm_leads)} people are looking for {product_name} this week",
                "html": html,
            })
            return True
        except Exception as e:
            print(f"Email send error: {e}")
            return False

    def _build_html(self, product_name: str, hot: list, warm: list) -> str:
        """Build HTML email with leads."""
        leads_html = ""

        for lead in hot[:5]:
            leads_html += f"""
            <div style="border-left: 3px solid #ef4444; padding: 12px; margin: 8px 0; background: #1a1a2e; border-radius: 4px;">
                <div style="color: #ef4444; font-weight: bold;">HOT {lead['final_score']}% — {lead['text'][:100]}...</div>
                <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">{lead['source']} · {lead.get('author_username', '')}</div>
                {f'<div style="color: #60a5fa; font-size: 12px; margin-top: 4px;">{lead["email"]}</div>' if lead.get('email') else ''}
                <div style="margin-top: 8px;"><a href="{lead['source_url']}" style="color: #60a5fa;">View post</a></div>
            </div>"""

        for lead in warm[:5]:
            leads_html += f"""
            <div style="border-left: 3px solid #eab308; padding: 12px; margin: 8px 0; background: #1a1a2e; border-radius: 4px;">
                <div style="color: #eab308; font-weight: bold;">WARM {lead['final_score']}% — {lead['text'][:100]}...</div>
                <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">{lead['source']} · {lead.get('author_username', '')}</div>
                <div style="margin-top: 8px;"><a href="{lead['source_url']}" style="color: #60a5fa;">View post</a></div>
            </div>"""

        return f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 20px;">
            <h1 style="color: #fff;">{len(hot) + len(warm)} people are looking for {product_name}</h1>
            <p style="color: #9ca3af;">Here are the highest-intent leads we found this week:</p>
            {leads_html}
            <div style="text-align: center; margin-top: 20px;">
                <a href="https://czero.ai/dashboard" style="background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View all leads</a>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">Czero — Find the people looking for your product.</p>
        </div>"""
