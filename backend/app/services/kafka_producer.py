import json
import logging
from datetime import datetime, timezone

from aiokafka import AIOKafkaProducer

from app.config import settings

logger = logging.getLogger(__name__)

producer: AIOKafkaProducer | None = None


async def start_producer():
    global producer
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
    )
    await producer.start()
    logger.info("Kafka producer started")


async def stop_producer():
    global producer
    if producer:
        await producer.stop()
        producer = None
        logger.info("Kafka producer stopped")


async def publish_event(
    service_name: str,
    is_healthy: bool,
    response_time_ms: int,
    error_message: str | None,
):
    if not producer:
        logger.error("Kafka producer not initialized")
        return

    event = {
        "service_name": service_name,
        "is_healthy": is_healthy,
        "response_time_ms": response_time_ms,
        "error_message": error_message,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    await producer.send_and_wait(settings.kafka_topic_events, event)
    logger.info(f"Published event to Kafka: [{service_name}] healthy={is_healthy}")
