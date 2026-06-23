import type { ServiceStatus, ServiceEvent, Alert, ServiceAnalysis } from "./api";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEvents(serviceName: string, serviceId: number, failRate: number): ServiceEvent[] {
  const events: ServiceEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const isHealthy = Math.random() > failRate;
    events.push({
      id: serviceId * 100 + i,
      service_id: serviceId,
      is_healthy: isHealthy,
      response_time_ms: isHealthy ? randomBetween(2, 25) : randomBetween(100, 500),
      error_message: isHealthy ? null : "Service temporarily unavailable",
      checked_at: new Date(now - i * 30_000).toISOString(),
    });
  }

  return events;
}

const SERVICES_CONFIG = [
  { name: "payment-api", failRate: 0.15 },
  { name: "user-service", failRate: 0.05 },
  { name: "inventory-api", failRate: 0.10 },
  { name: "notification-service", failRate: 0.20 },
  { name: "auth-service", failRate: 0.03 },
];

let cachedServices: ServiceStatus[] | null = null;
let cachedEvents: Record<string, ServiceEvent[]> = {};

function ensureGenerated() {
  if (cachedServices) return;

  cachedServices = SERVICES_CONFIG.map((cfg, i) => {
    const events = generateEvents(cfg.name, i + 1, cfg.failRate);
    cachedEvents[cfg.name] = events;
    return {
      id: i + 1,
      name: cfg.name,
      is_healthy: events[0].is_healthy,
      last_checked_at: events[0].checked_at,
    };
  });
}

export const demoData = {
  getServices(): ServiceStatus[] {
    ensureGenerated();
    return cachedServices!;
  },

  getService(name: string) {
    ensureGenerated();
    const svc = cachedServices!.find((s) => s.name === name);
    if (!svc) return null;
    return {
      ...svc,
      recent_events: cachedEvents[name] || [],
    };
  },

  getEvents(name: string): ServiceEvent[] {
    ensureGenerated();
    return cachedEvents[name] || [];
  },

  getAlerts(): Alert[] {
    ensureGenerated();
    const alerts: Alert[] = [];
    let id = 1;

    for (const svc of cachedServices!) {
      const events = cachedEvents[svc.name];
      let streak = 0;
      for (const e of events) {
        if (!e.is_healthy) streak++;
        else break;
      }

      if (streak >= 3) {
        alerts.push({
          id: id++,
          service_id: svc.id,
          service_name: svc.name,
          level: streak >= 6 ? "critical" : "warning",
          message: `${svc.name} falhou ${streak} vezes consecutivas.`,
          created_at: events[0].checked_at,
          resolved: false,
        });
      }
    }

    return alerts;
  },

  getAnalysis(name: string): ServiceAnalysis | null {
    ensureGenerated();
    const events = cachedEvents[name];
    if (!events || events.length === 0) return null;

    const total = events.length;
    const healthy = events.filter((e) => e.is_healthy).length;
    const uptimePct = (healthy / total) * 100;
    const responseTimes = events
      .filter((e) => e.response_time_ms !== null)
      .map((e) => e.response_time_ms!);
    const avgResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    const insights: string[] = [];

    if (uptimePct === 100) {
      insights.push(`Servico com disponibilidade perfeita nos ultimos ${total} checks.`);
    } else if (uptimePct >= 95) {
      insights.push(`Disponibilidade alta (${uptimePct.toFixed(1)}%). Falhas esporadicas detectadas.`);
    } else if (uptimePct >= 80) {
      insights.push(`Disponibilidade moderada (${uptimePct.toFixed(1)}%). Recomenda-se investigar.`);
    } else {
      insights.push(`Disponibilidade critica (${uptimePct.toFixed(1)}%). Servico instavel.`);
    }

    let maxStreak = 0, cur = 0;
    for (const e of [...events].reverse()) {
      if (!e.is_healthy) { cur++; maxStreak = Math.max(maxStreak, cur); }
      else cur = 0;
    }
    if (maxStreak >= 3) {
      insights.push(`Sequencia de ${maxStreak} falhas consecutivas detectada.`);
    }

    return {
      service_name: name,
      total_events: total,
      uptime_pct: uptimePct,
      avg_response_ms: avgResponse,
      insights,
    };
  },
};
