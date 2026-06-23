from collections import Counter

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service, ServiceEvent


async def analyze_service(session: AsyncSession, service_name: str) -> dict | None:
    svc = (
        await session.execute(select(Service).where(Service.name == service_name))
    ).scalar_one_or_none()
    if not svc:
        return None

    events_result = await session.execute(
        select(ServiceEvent)
        .where(ServiceEvent.service_id == svc.id)
        .order_by(ServiceEvent.checked_at.desc())
        .limit(500)
    )
    events = events_result.scalars().all()

    if not events:
        return {
            "service_name": service_name,
            "total_events": 0,
            "uptime_pct": 100.0,
            "avg_response_ms": 0.0,
            "insights": ["Sem dados suficientes para analise."],
        }

    total = len(events)
    healthy = sum(1 for e in events if e.is_healthy)
    uptime_pct = (healthy / total) * 100
    response_times = [e.response_time_ms for e in events if e.response_time_ms is not None]
    avg_response = sum(response_times) / len(response_times) if response_times else 0

    insights = []

    if uptime_pct == 100:
        insights.append(f"Servico com disponibilidade perfeita nos ultimos {total} checks.")
    elif uptime_pct >= 95:
        insights.append(f"Disponibilidade alta ({uptime_pct:.1f}%). Falhas esporadicas detectadas.")
    elif uptime_pct >= 80:
        insights.append(f"Disponibilidade moderada ({uptime_pct:.1f}%). Recomenda-se investigar a causa das falhas.")
    else:
        insights.append(f"Disponibilidade critica ({uptime_pct:.1f}%). Servico instavel — acao imediata necessaria.")

    failures = [e for e in events if not e.is_healthy]
    if failures:
        hour_counts: Counter[int] = Counter()
        for f in failures:
            if f.checked_at:
                hour_counts[f.checked_at.hour] += 1
        if hour_counts:
            peak_hour = hour_counts.most_common(1)[0]
            if peak_hour[1] >= 3:
                insights.append(
                    f"Padrao detectado: concentracao de falhas as {peak_hour[0]}h "
                    f"({peak_hour[1]} ocorrencias)."
                )

    max_consecutive_failures = 0
    current_streak = 0
    for e in reversed(events):
        if not e.is_healthy:
            current_streak += 1
            max_consecutive_failures = max(max_consecutive_failures, current_streak)
        else:
            current_streak = 0

    if max_consecutive_failures >= 3:
        insights.append(
            f"Sequencia de {max_consecutive_failures} falhas consecutivas detectada. "
            f"Possivel indisponibilidade prolongada."
        )

    if response_times:
        recent_avg = sum(response_times[:10]) / min(10, len(response_times))
        older_avg = sum(response_times[-10:]) / min(10, len(response_times))
        if older_avg > 0 and recent_avg > older_avg * 1.5:
            insights.append(
                f"Tempo de resposta aumentou: {older_avg:.0f}ms -> {recent_avg:.0f}ms. "
                f"Possivel degradacao de performance."
            )

    if not insights:
        insights.append("Servico operando dentro dos parametros normais.")

    return {
        "service_name": service_name,
        "total_events": total,
        "uptime_pct": uptime_pct,
        "avg_response_ms": avg_response,
        "insights": insights,
    }
