import json
import logging
from collections import defaultdict

from aiokafka import AIOKafkaConsumer
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.service import Service, Alert

logger = logging.getLogger(__name__)

CONSECUTIVE_FAILURE_THRESHOLD = 3
failure_streaks: defaultdict[str, int] = defaultdict(int)


async def check_and_create_alert(service_name: str, is_healthy: bool):
    if not is_healthy:
        failure_streaks[service_name] += 1
    else:
        if failure_streaks[service_name] >= CONSECUTIVE_FAILURE_THRESHOLD:
            await _resolve_alerts(service_name)
        failure_streaks[service_name] = 0
        return

    streak = failure_streaks[service_name]
    if streak == CONSECUTIVE_FAILURE_THRESHOLD:
        await _create_alert(
            service_name,
            level="warning",
            message=f"{service_name} falhou {streak} vezes consecutivas. Possivel instabilidade.",
        )
    elif streak >= CONSECUTIVE_FAILURE_THRESHOLD * 2:
        await _create_alert(
            service_name,
            level="critical",
            message=f"{service_name} falhou {streak} vezes consecutivas. Servico potencialmente indisponivel.",
        )


async def _create_alert(service_name: str, level: str, message: str):
    async with async_session() as session:
        svc = (
            await session.execute(select(Service).where(Service.name == service_name))
        ).scalar_one_or_none()
        if not svc:
            return

        alert = Alert(
            service_id=svc.id,
            level=level,
            message=message,
        )
        session.add(alert)
        await session.commit()
        logger.warning(f"Alert [{level}] created for {service_name}: {message}")


async def _resolve_alerts(service_name: str):
    async with async_session() as session:
        svc = (
            await session.execute(select(Service).where(Service.name == service_name))
        ).scalar_one_or_none()
        if not svc:
            return

        unresolved = (
            await session.execute(
                select(Alert).where(
                    Alert.service_id == svc.id,
                    Alert.resolved == False,
                )
            )
        ).scalars().all()

        for alert in unresolved:
            alert.resolved = True
        await session.commit()

        if unresolved:
            logger.info(f"Resolved {len(unresolved)} alerts for {service_name}")


async def alerting_consumer_loop():
    consumer = AIOKafkaConsumer(
        settings.kafka_topic_events,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="sentinel-alerting",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
    )
    await consumer.start()
    logger.info("Alerting consumer started — monitoring for failure patterns")

    try:
        async for msg in consumer:
            try:
                data = msg.value
                await check_and_create_alert(
                    service_name=data["service_name"],
                    is_healthy=data["is_healthy"],
                )
            except Exception:
                logger.exception(f"Failed to process alert event: {msg.value}")
    finally:
        await consumer.stop()
        logger.info("Alerting consumer stopped")
