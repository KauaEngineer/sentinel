import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers.services import router as services_router
from app.routers.alerts import router as alerts_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    tasks: list[asyncio.Task] = []

    if settings.enable_monitor:
        from app.services.kafka_producer import start_producer, stop_producer
        from app.services.monitor import monitor_loop

        await start_producer()
        tasks.append(asyncio.create_task(monitor_loop()))
        logger.info("Monitor role enabled — this pod runs health checks")
    else:
        stop_producer = None
        logger.info("Monitor role disabled — this pod only serves API")

    if settings.enable_consumer:
        from app.services.kafka_consumer import consumer_loop
        from app.services.alerting import alerting_consumer_loop

        tasks.append(asyncio.create_task(consumer_loop()))
        tasks.append(asyncio.create_task(alerting_consumer_loop()))
        logger.info("Consumer role enabled — this pod processes Kafka events")

    yield

    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    if stop_producer:
        await stop_producer()


app = FastAPI(
    title="Sentinel",
    description="Plataforma de monitoramento de APIs e servicos em tempo real",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3080",
        "https://*.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(services_router)
app.include_router(alerts_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
