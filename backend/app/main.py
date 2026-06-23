import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.database import engine, Base
from app.routers.services import router as services_router
from app.services.monitor import monitor_loop
from app.services.kafka_producer import start_producer, stop_producer
from app.services.kafka_consumer import consumer_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    await start_producer()

    monitor_task = asyncio.create_task(monitor_loop())
    consumer_task = asyncio.create_task(consumer_loop())

    yield

    monitor_task.cancel()
    consumer_task.cancel()
    for task in [monitor_task, consumer_task]:
        try:
            await task
        except asyncio.CancelledError:
            pass

    await stop_producer()


app = FastAPI(
    title="Sentinel",
    description="Plataforma de monitoramento de APIs e serviços em tempo real",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(services_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
