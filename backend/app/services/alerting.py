import json
import logging

from aiokafka import AIOKafkaConsumer
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.service import Service, ServiceEvent, Alert

logger = logging.getLogger(__name__)

CONSECUTIVE_FAILURE_THRESHOLD = 3


async def _count_trailing_failures(session, service_id: int) -> int:
    result = await session.execute(
        select(ServiceEvent)
        .where(ServiceEvent.service_id == service_id)
        .order_by(ServiceEvent.checked_at.desc())
        .limit(CONSECUTIVE_FAILURE_THRESHOLD * 3)
    )
    events = result.scalars().all()

    streak = 0
    for e in events:
        if not e.is_healthy:
            streak += 1
        else:
            break
    return streak


async def check_and_create_alert(service_name: str, is_healthy: bool):
    async with async_session() as session:
        svc = (
            await session.execute(select(Service).where(Service.name == service_name))
        ).scalar_one_or_none()
        if not svc:
            return

        if is_healthy:
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
            return

        streak = await _count_trailing_failures(session, svc.id)

        if streak == CONSECUTIVE_FAILURE_THRESHOLD:
            alert = Alert(
                service_id=svc.id,
                level="warning",
                message=f"{service_name} falhou {streak} vezes consecutivas. Possivel instabilidade.",
            )
            session.add(alert)
            await session.commit()
            logger.warning(f"Alert [warning] created for {service_name}")

        elif streak >= CONSECUTIVE_FAILURE_THRESHOLD * 2 and streak % CONSECUTIVE_FAILURE_THRESHOLD == 0:
            alert = Alert(
                service_id=svc.id,
                level="critical",
                message=f"{service_name} falhou {streak} vezes consecutivas. Servico potencialmente indisponivel.",
            )
            session.add(alert)
            await session.commit()
            logger.warning(f"Alert [critical] created for {service_name}")


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
