import pytest
from datetime import datetime, timezone

from app.models.service import Service, ServiceEvent
from app.services.analysis import analyze_service


@pytest.mark.asyncio
async def test_analysis_not_found(db_session):
    result = await analyze_service(db_session, "nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_analysis_no_events(db_session):
    svc = Service(name="empty-api", is_healthy=True)
    db_session.add(svc)
    await db_session.commit()

    result = await analyze_service(db_session, "empty-api")
    assert result["total_events"] == 0
    assert result["uptime_pct"] == 100.0


@pytest.mark.asyncio
async def test_analysis_perfect_uptime(db_session):
    svc = Service(name="stable-api", is_healthy=True)
    db_session.add(svc)
    await db_session.flush()

    for _ in range(10):
        db_session.add(ServiceEvent(
            service_id=svc.id,
            is_healthy=True,
            response_time_ms=5,
        ))
    await db_session.commit()

    result = await analyze_service(db_session, "stable-api")
    assert result["uptime_pct"] == 100.0
    assert result["avg_response_ms"] == 5.0
    assert any("perfeita" in i for i in result["insights"])


@pytest.mark.asyncio
async def test_analysis_detects_low_uptime(db_session):
    svc = Service(name="flaky-api", is_healthy=False)
    db_session.add(svc)
    await db_session.flush()

    for i in range(10):
        db_session.add(ServiceEvent(
            service_id=svc.id,
            is_healthy=i < 3,
            response_time_ms=10,
        ))
    await db_session.commit()

    result = await analyze_service(db_session, "flaky-api")
    assert result["uptime_pct"] == 30.0
    assert any("critica" in i.lower() for i in result["insights"])


@pytest.mark.asyncio
async def test_analysis_detects_consecutive_failures(db_session):
    svc = Service(name="failing-api", is_healthy=False)
    db_session.add(svc)
    await db_session.flush()

    for i in range(6):
        db_session.add(ServiceEvent(
            service_id=svc.id,
            is_healthy=i < 2,
            response_time_ms=10,
        ))
    await db_session.commit()

    result = await analyze_service(db_session, "failing-api")
    assert any("consecutivas" in i for i in result["insights"])
