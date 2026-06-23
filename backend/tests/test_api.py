import pytest
from datetime import datetime, timezone

from app.models.service import Service, ServiceEvent, Alert


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_services_empty(client):
    resp = await client.get("/api/services/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_services(client, db_session):
    svc = Service(name="test-api", is_healthy=True)
    db_session.add(svc)
    await db_session.commit()

    resp = await client.get("/api/services/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "test-api"
    assert data[0]["is_healthy"] is True


@pytest.mark.asyncio
async def test_get_service_not_found(client):
    resp = await client.get("/api/services/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_service_detail(client, db_session):
    svc = Service(name="payment-api", is_healthy=False)
    db_session.add(svc)
    await db_session.flush()

    event = ServiceEvent(
        service_id=svc.id,
        is_healthy=False,
        response_time_ms=150,
        error_message="Service temporarily unavailable",
    )
    db_session.add(event)
    await db_session.commit()

    resp = await client.get("/api/services/payment-api")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "payment-api"
    assert data["is_healthy"] is False
    assert len(data["recent_events"]) == 1
    assert data["recent_events"][0]["response_time_ms"] == 150


@pytest.mark.asyncio
async def test_get_service_events(client, db_session):
    svc = Service(name="auth-service", is_healthy=True)
    db_session.add(svc)
    await db_session.flush()

    for i in range(5):
        db_session.add(ServiceEvent(
            service_id=svc.id,
            is_healthy=i % 2 == 0,
            response_time_ms=10 + i,
        ))
    await db_session.commit()

    resp = await client.get("/api/services/auth-service/events?limit=3")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_alerts_empty(client):
    resp = await client.get("/api/alerts/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_alerts_list(client, db_session):
    svc = Service(name="user-service", is_healthy=False)
    db_session.add(svc)
    await db_session.flush()

    alert = Alert(
        service_id=svc.id,
        level="warning",
        message="user-service falhou 3 vezes consecutivas.",
        resolved=False,
    )
    db_session.add(alert)
    await db_session.commit()

    resp = await client.get("/api/alerts/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["service_name"] == "user-service"
    assert data[0]["level"] == "warning"
    assert data[0]["resolved"] is False
