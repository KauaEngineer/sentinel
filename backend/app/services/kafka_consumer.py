import json
import logging

from aiokafka import AIOKafkaConsumer
from sqlalchemy import select
from sqlalchemy.sql import func

from app.config import settings
from app.database import async_session
from app.models.service import Service, ServiceEvent

logger = logging.getLogger(__name__)


async def process_event(data: dict):
    async with async_session() as session:
        svc = (
            await session.execute(
                select(Service).where(Service.name == data["service_name"])
            )
        ).scalar_one_or_none()

        if not svc:
            svc = Service(name=data["service_name"], is_healthy=data["is_healthy"])
            session.add(svc)
            await session.flush()

        svc.is_healthy = data["is_healthy"]
        svc.last_checked_at = func.now()

        event = ServiceEvent(
            service_id=svc.id,
            is_healthy=data["is_healthy"],
            response_time_ms=data["response_time_ms"],
            error_message=data.get("error_message"),
        )
        session.add(event)
        await session.commit()

        status = "healthy" if data["is_healthy"] else "UNHEALTHY"
        logger.info(f"Persisted event: [{data['service_name']}] {status}")


async def consumer_loop():
    consumer = AIOKafkaConsumer(
        settings.kafka_topic_events,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="sentinel-persister",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
    )
    await consumer.start()
    logger.info("Kafka consumer started — listening for service events")

    try:
        async for msg in consumer:
            try:
                await process_event(msg.value)
            except Exception:
                logger.exception(f"Failed to process event: {msg.value}")
    finally:
        await consumer.stop()
        logger.info("Kafka consumer stopped")
