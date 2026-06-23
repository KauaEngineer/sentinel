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


class AlertOut(BaseModel):
    id: int
    service_id: int
    service_name: str
    level: str
    message: str
    created_at: datetime
    resolved: bool


class ServiceAnalysisOut(BaseModel):
    service_name: str
    total_events: int
    uptime_pct: float
    avg_response_ms: float
    insights: list[str]
