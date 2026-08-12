from dotenv import load_dotenv
from pathlib import Path
import asyncio
import logging
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, products, leads, billing
from app.workers.scheduler import scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background active monitoring task
    logger.info("FastAPI starting up. Launching background active monitoring scheduler...")
    scheduler_task = asyncio.create_task(scheduler.start_loop(interval_seconds=900))
    
    yield
    
    # Shutdown task on exit
    logger.info("FastAPI shutting down. Canceling active monitoring task...")
    scheduler.stop_loop()
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        logger.info("Background active monitoring task cancelled successfully.")

app = FastAPI(title="Czero API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/production flex
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


from pydantic import BaseModel

class SupportMessagePayload(BaseModel):
    email: str
    message: str

@app.post("/api/support")
async def support_message(payload: SupportMessagePayload):
    """Log support messages submitted via the floating Contact modal."""
    logger.info(f"SUPPORT MESSAGE received from {payload.email}: {payload.message}")
    return {"status": "success", "message": "Support message logged successfully."}
