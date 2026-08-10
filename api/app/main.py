from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, products, leads, billing

app = FastAPI(title="Czero API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "czero-api"}
