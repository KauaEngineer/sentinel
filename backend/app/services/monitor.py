import asyncio
import logging
import time

import httpx
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.service import Service
from app.services.kafka_producer import publish_event

logger = logging.getLogger(__name__)


async def discover_services() -> list[str]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.mock_services_url}/services")
        resp.raise_for_status()
        return resp.json()["services"]


async def check_service(client: httpx.AsyncClient, service_name: str) -> dict:
    start = time.monotonic()
    try:
        resp = await client.get(
            f"{settings.mock_services_url}/health/{service_name}", timeout=5.0
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        data = resp.json()
        return {
            "is_healthy": resp.status_code == 200,
            "response_time_ms": elapsed_ms,
            "error_message": data.get("message"),
        }
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "is_healthy": False,
            "response_time_ms": elapsed_ms,
            "error_message": str(exc),
        }


async def ensure_services_registered(service_names: list[str]):
    async with async_session() as session:
        for name in service_names:
            svc = (
                await session.execute(select(Service).where(Service.name == name))
            ).scalar_one_or_none()
            if not svc:
                svc = Service(name=name, is_healthy=True)
                session.add(svc)
        await session.commit()


async def run_checks():
    service_names = await discover_services()
    await ensure_services_registered(service_names)

    async with httpx.AsyncClient() as client:
        for name in service_names:
            result = await check_service(client, name)

            await publish_event(
                service_name=name,
                is_healthy=result["is_healthy"],
                response_time_ms=result["response_time_ms"],
                error_message=result["error_message"],
            )

            status = "healthy" if result["is_healthy"] else "UNHEALTHY"
            logger.info(f"[{name}] {status} ({result['response_time_ms']}ms)")


async def monitor_loop():
    logger.info(f"Starting monitor loop (interval: {settings.check_interval_seconds}s)")
    while True:
        try:
            await run_checks()
        except Exception:
            logger.exception("Error during monitoring cycle")
        await asyncio.sleep(settings.check_interval_seconds)
