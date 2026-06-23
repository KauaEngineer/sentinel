from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.service import Service, ServiceEvent
from app.schemas.service import ServiceStatus, ServiceDetail, ServiceEventOut

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/", response_model=list[ServiceStatus])
async def list_services(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).order_by(Service.name))
    return result.scalars().all()


@router.get("/{service_name}", response_model=ServiceDetail)
async def get_service(service_name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.name == service_name))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    events_result = await db.execute(
        select(ServiceEvent)
        .where(ServiceEvent.service_id == svc.id)
        .order_by(ServiceEvent.checked_at.desc())
        .limit(50)
    )
    events = events_result.scalars().all()

    return ServiceDetail(
        id=svc.id,
        name=svc.name,
        is_healthy=svc.is_healthy,
        last_checked_at=svc.last_checked_at,
        recent_events=[ServiceEventOut.model_validate(e) for e in events],
    )


@router.get("/{service_name}/events", response_model=list[ServiceEventOut])
async def get_service_events(
    service_name: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.name == service_name))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    events_result = await db.execute(
        select(ServiceEvent)
        .where(ServiceEvent.service_id == svc.id)
        .order_by(ServiceEvent.checked_at.desc())
        .limit(min(limit, 500))
    )
    return events_result.scalars().all()
