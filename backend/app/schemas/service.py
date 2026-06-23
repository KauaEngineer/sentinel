from datetime import datetime
from pydantic import BaseModel


class ServiceStatus(BaseModel):
    id: int
    name: str
    is_healthy: bool
    last_checked_at: datetime | None

    model_config = {"from_attributes": True}


class ServiceEventOut(BaseModel):
    id: int
    service_id: int
    is_healthy: bool
    response_time_ms: int | None
    error_message: str | None
    checked_at: datetime

    model_config = {"from_attributes": True}


class ServiceDetail(ServiceStatus):
    recent_events: list[ServiceEventOut]
