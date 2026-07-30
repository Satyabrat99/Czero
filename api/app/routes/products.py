from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_products():
    return {"products": []}


@router.post("")
async def create_product():
    return {"message": "TODO: create product"}
