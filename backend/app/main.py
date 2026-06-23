import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers.services import router as services_router
from app.routers.alerts import router as alerts_router
from app.services.monitor import monitor_loop
from app.services.kafka_producer import start_producer, stop_producer
from app.services.kafka_consumer import consumer_loop
from app.services.alerting import alerting_consumer_loop

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
    alerting_task = asyncio.create_task(alerting_consumer_loop())

    yield

    for task in [monitor_task, consumer_task, alerting_task]:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    await stop_producer()


app = FastAPI(
    title="Sentinel",
    description="Plataforma de monitoramento de APIs e serviços em tempo real",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services_router)
app.include_router(alerts_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
