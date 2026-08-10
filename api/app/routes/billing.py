"""Billing routes - Demo mode (no real Stripe integration)."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CheckoutRequest(BaseModel):
    price_id: str
    plan_name: str


class DemoSubscription(BaseModel):
    status: str
    plan: str
    message: str


@router.post("/checkout")
async def create_checkout(request: CheckoutRequest) -> dict:
    """Create demo checkout session (simulates Stripe)."""
    return {
        "session_url": f"/dashboard?demo_subscription={request.plan_name}",
        "demo": True,
        "message": "Demo mode - no real payment processed",
    }


@router.post("/subscribe")
async def demo_subscribe(request: CheckoutRequest) -> DemoSubscription:
    """Demo subscription endpoint."""
    return DemoSubscription(
        status="active",
        plan=request.plan_name,
        message=f"Demo subscription activated for {request.plan_name} plan",
    )


@router.get("/status")
async def subscription_status() -> dict:
    """Get subscription status (demo - always returns free tier)."""
    return {
        "plan": "free",
        "status": "active",
        "leads_per_week": 3,
        "has_contact_info": False,
        "demo": True,
    }
