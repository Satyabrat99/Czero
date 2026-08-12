from fastapi import APIRouter, Query
from app.services.db import DBService

router = APIRouter()
db = DBService()


@router.get("")
async def list_leads(product_id: str = Query(None)):
    """Fetch leads from database for a specific product or all products."""
    if not db.client:
        return {"leads": []}
    
    try:
        query = db.client.table("leads").select("*")
        if product_id:
            query = query.eq("product_id", product_id)
            
        # Order by creation date (newest first)
        response = query.order("created_at", desc=True).execute()
        return {"leads": response.data or []}
    except Exception as e:
        return {"leads": [], "error": str(e)}
