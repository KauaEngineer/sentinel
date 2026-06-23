from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.service import Alert, Service
from app.schemas.service import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertOut])
async def list_alerts(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Alert, Service.name)
        .join(Service, Alert.service_id == Service.id)
        .order_by(Alert.created_at.desc())
        .limit(min(limit, 200))
    )
    rows = result.all()
    return [
        AlertOut(
            id=alert.id,
            service_id=alert.service_id,
            service_name=name,
            level=alert.level,
            message=alert.message,
            created_at=alert.created_at,
            resolved=alert.resolved,
        )
        for alert, name in rows
    ]
