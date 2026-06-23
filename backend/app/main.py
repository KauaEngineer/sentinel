import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.database import engine, Base
from app.routers.services import router as services_router
from app.services.monitor import monitor_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    task = asyncio.create_task(monitor_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Sentinel",
    description="Plataforma de monitoramento de APIs e serviços em tempo real",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(services_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
