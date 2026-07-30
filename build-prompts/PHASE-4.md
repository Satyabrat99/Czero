# Phase 4: Delivery — Email Digest + Dashboard

> Feed this to Command Code after Phase 3 is verified. This builds the email digest + 3-screen dashboard.

---

## Task

Build the delivery layer: weekly email digest using Resend + 3-screen dashboard (Settings, Leads List, Lead Detail).

---

## Step 1: Email Digest Service

Create file `api/app/services/emailer.py`:
```python
import os
from resend import Email


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
        
        # Build email HTML
        html = self._build_html(product_name, hot_leads, warm_leads)
        
        try:
            Email.send({
                "from": self.from_email,
                "to": to_email,
                "subject": f"🔥 {len(hot_leads) + len(warm_leads)} people are looking for {product_name} this week",
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
                <div style="color: #ef4444; font-weight: bold;">🔥 {lead['final_score']}% — {lead['text'][:100]}...</div>
                <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">{lead['source']} · {lead.get('author_username', '')}</div>
                {f'<div style="color: #60a5fa; font-size: 12px; margin-top: 4px;">📧 {lead["email"]}</div>' if lead.get('email') else ''}
                <div style="margin-top: 8px;"><a href="{lead['source_url']}" style="color: #60a5fa;">View post →</a></div>
            </div>"""
        
        for lead in warm[:5]:
            leads_html += f"""
            <div style="border-left: 3px solid #eab308; padding: 12px; margin: 8px 0; background: #1a1a2e; border-radius: 4px;">
                <div style="color: #eab308; font-weight: bold;">🟡 {lead['final_score']}% — {lead['text'][:100]}...</div>
                <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">{lead['source']} · {lead.get('author_username', '')}</div>
                <div style="margin-top: 8px;"><a href="{lead['source_url']}" style="color: #60a5fa;">View post →</a></div>
            </div>"""
        
        return f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 20px;">
            <h1 style="color: #fff;">🔥 {len(hot) + len(warm)} people are looking for {product_name}</h1>
            <p style="color: #9ca3af;">Here are the highest-intent leads we found this week:</p>
            {leads_html}
            <div style="text-align: center; margin-top: 20px;">
                <a href="https://czero.ai/dashboard" style="background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">View all leads →</a>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">Czero — Find the people looking for your product.</p>
        </div>"""
```

---

## Step 2: Outreach Draft Generator

Create file `api/app/services/drafter.py`:
```python
import os
from openai import OpenAI


class OutreachDrafter:
    """Generate personalized outreach drafts for each lead."""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def generate_drafts(self, lead: dict, product: dict) -> dict:
        """Generate email + LinkedIn DM + Reddit reply drafts."""
        
        post_text = lead.get("text", "")
        product_desc = product.get("description", "")
        
        # Email draft
        email_prompt = f"""Write a 3-sentence cold email to someone who posted:
"{post_text[:300]}"

Our product: {product_desc}

Sound human, not salesy. Reference their specific post. Include one soft CTA.
Return ONLY the email text, no subject line."""

        # LinkedIn DM
        linkedin_prompt = f"""Write a 2-sentence LinkedIn message to someone who posted:
"{post_text[:300]}"

Our product: {product_desc}

Short, friendly, reference their post.
Return ONLY the message text."""

        # Reddit reply
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
```

---

## Step 3: Full Pipeline Endpoint

Update `api/app/routes/products.py` — add complete pipeline:
```python
from app.services.drafter import OutreachDrafter
from app.services.emailer import EmailSender

# Add after enricher initialization
drafter = OutreachDrafter()
emailer = EmailSender()


@router.post("/full-pipeline")
async def full_pipeline(product: ProductCreate):
    """Complete pipeline: collect → score → enrich → draft."""
    # Collect
    collection_result = await collector.collect_for_product(product.model_dump())
    signals = collection_result["signals"]
    
    # Score
    leads = await scorer.score_signals(signals, product.model_dump())
    
    # Enrich hot + warm
    enrichable = [l for l in leads if l["category"] in ["hot", "warm"]]
    enriched = await enricher.enrich_batch(enrichable)
    enriched_map = {l["source_url"]: l for l in enriched}
    for i, lead in enumerate(leads):
        if lead["source_url"] in enriched_map:
            leads[i] = enriched_map[lead["source_url"]]
    
    # Generate drafts for hot + warm
    for lead in leads:
        if lead["category"] in ["hot", "warm"]:
            drafts = drafter.generate_drafts(lead, product.model_dump())
            lead.update(drafts)
    
    # Stats
    hot = sum(1 for l in leads if l["category"] == "hot")
    warm = sum(1 for l in leads if l["category"] == "warm")
    with_email = sum(1 for l in leads if l.get("email"))
    with_drafts = sum(1 for l in leads if l.get("email_draft"))
    
    return {
        "stats": {
            "total": len(leads),
            "hot": hot,
            "warm": warm,
            "with_email": with_email,
            "with_drafts": with_drafts,
        },
        "leads": leads[:20],
    }
```

---

## Step 4: Dashboard Pages (Frontend)

Create `frontend/app/dashboard/page.tsx` (Leads List):
```tsx
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">🔥 Leads</h1>
      <p className="text-gray-400 mb-8">People actively looking for your product.</p>
      
      <div className="space-y-4">
        {/* Placeholder lead cards */}
        {[
          { score: 92, text: "Anyone know a good invoicing tool?", source: "Reddit", time: "4h ago", hot: true },
          { score: 87, text: "Looking for FreshBooks alternative", source: "Reddit", time: "1d ago", hot: true },
          { score: 68, text: "How do you handle freelancer billing?", source: "Twitter", time: "2d ago", hot: false },
        ].map((lead, i) => (
          <div key={i} className={`border-l-4 p-4 rounded ${lead.hot ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-bold ${lead.hot ? 'text-red-400' : 'text-yellow-400'}`}>
                {lead.hot ? '🔥' : '🟡'} {lead.score}%
              </span>
              <span className="text-gray-500 text-sm">{lead.source} · {lead.time}</span>
            </div>
            <p className="text-white">"{lead.text}"</p>
            <button className="mt-2 text-blue-400 text-sm hover:underline">View →</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create `frontend/app/dashboard/settings/page.tsx` (Settings):
```tsx
export default function Settings() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">⚙️ Settings</h1>
      <p className="text-gray-400 mb-8">Configure what we monitor for you.</p>
      
      <div className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Product URL</label>
          <input 
            type="url" 
            placeholder="https://your-saas.com" 
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
          />
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium">
          🔍 Analyze & Start Monitoring
        </button>
      </div>
    </div>
  )
}
```

Create `frontend/app/dashboard/leads/[leadId]/page.tsx` (Lead Detail):
```tsx
export default function LeadDetail({ params }: { params: { leadId: string } }) {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <a href="/dashboard" className="text-blue-400 hover:underline mb-4 block">← Back to Leads</a>
      
      <div className="max-w-2xl space-y-6">
        <div className="border-l-4 border-red-500 pl-4">
          <span className="text-red-400 font-bold text-2xl">🔥 92%</span>
          <h2 className="text-xl mt-2">"Anyone know a good invoicing tool?"</h2>
          <p className="text-gray-400 mt-1">Reddit · r/freelance · 4 hours ago</p>
        </div>
        
        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-bold mb-2">WHY THIS LEAD</h3>
          <ul className="text-gray-300 space-y-1">
            <li>✓ Directly asking for your type of product</li>
            <li>✓ Freelancer — matches your ICP</li>
            <li>✓ Posted 4 hours ago — thread is active</li>
          </ul>
        </div>
        
        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-bold mb-2">CONTACT</h3>
          <p className="text-gray-300">📧 joe@example.com</p>
          <p className="text-gray-300">💼 linkedin.com/in/joesmith</p>
        </div>
        
        <div className="bg-gray-900 p-4 rounded">
          <h3 className="font-bold mb-2">READY TO SEND</h3>
          <div className="bg-gray-800 p-3 rounded text-gray-300 text-sm">
            Hey Joe, saw your post about invoicing — I built InvoicePilot, an AI tool that handles billing in seconds. Want to try it free?
          </div>
          <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">Copy Email</button>
        </div>
        
        <div className="flex gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">👍 Useful</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">👎 Not useful</button>
        </div>
      </div>
    </div>
  )
}
```

---

## Step 5: Test Delivery

1. Run backend: `cd api && python -m uvicorn app.main:app --reload`
2. Run frontend: `cd frontend && npm run dev`
3. Test full pipeline: `curl -X POST http://localhost:8000/api/products/full-pipeline ...`
4. Open localhost:3000/dashboard — see lead cards
5. Click a lead — see detail page with drafts

---

## Verification Checklist

1. ✅ Full pipeline returns leads with scores, contact info, and drafts
2. ✅ Dashboard shows lead cards with score badges
3. ✅ Lead detail shows reasoning, contact, and outreach drafts
4. ✅ Copy button works (copies draft to clipboard)
5. ✅ 👍/👎 buttons visible (feedback collection ready)
6. ✅ Git commit: `feat: delivery layer — email digest + dashboard`
