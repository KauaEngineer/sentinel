import asyncio
import logging
import time

import httpx
from sqlalchemy import select
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.service import Service, ServiceEvent

logger = logging.getLogger(__name__)


async def discover_services(session: AsyncSession) -> list[str]:
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


async def run_checks():
    async with async_session() as session:
        service_names = await discover_services(session)

        for name in service_names:
            svc = (
                await session.execute(select(Service).where(Service.name == name))
            ).scalar_one_or_none()
            if not svc:
                svc = Service(name=name, is_healthy=True)
                session.add(svc)

        await session.commit()

        async with httpx.AsyncClient() as client:
            for name in service_names:
                result = await check_service(client, name)
                svc = (
                    await session.execute(select(Service).where(Service.name == name))
                ).scalar_one_or_none()

                svc.is_healthy = result["is_healthy"]
                svc.last_checked_at = func.now()

                event = ServiceEvent(
                    service_id=svc.id,
                    is_healthy=result["is_healthy"],
                    response_time_ms=result["response_time_ms"],
                    error_message=result["error_message"],
                )
                session.add(event)

                status = "healthy" if result["is_healthy"] else "UNHEALTHY"
                logger.info(f"[{name}] {status} ({result['response_time_ms']}ms)")

            await session.commit()


async def monitor_loop():
    logger.info(f"Starting monitor loop (interval: {settings.check_interval_seconds}s)")
    while True:
        try:
            await run_checks()
        except Exception:
            logger.exception("Error during monitoring cycle")
        await asyncio.sleep(settings.check_interval_seconds)
