import { demoData } from "./demo-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const IS_DEMO = !API_BASE;

export interface ServiceStatus {
  id: number;
  name: string;
  is_healthy: boolean;
  last_checked_at: string | null;
}

export interface ServiceEvent {
  id: number;
  service_id: number;
  is_healthy: boolean;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

export interface ServiceDetail extends ServiceStatus {
  recent_events: ServiceEvent[];
}

export interface Alert {
  id: number;
  service_id: number;
  service_name: string;
  level: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

export interface ServiceAnalysis {
  service_name: string;
  total_events: number;
  uptime_pct: number;
  avg_response_ms: number;
  insights: string[];
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function isDemoMode(): boolean {
  return IS_DEMO;
}

export const api = {
  getServices: (): Promise<ServiceStatus[]> =>
    IS_DEMO
      ? Promise.resolve(demoData.getServices())
      : fetchApi("/api/services/"),

  getService: (name: string): Promise<ServiceDetail> =>
    IS_DEMO
      ? Promise.resolve(demoData.getService(name)!)
      : fetchApi(`/api/services/${name}`),

  getEvents: (name: string, limit = 100): Promise<ServiceEvent[]> =>
    IS_DEMO
      ? Promise.resolve(demoData.getEvents(name).slice(0, limit))
      : fetchApi(`/api/services/${name}/events?limit=${limit}`),

  getAlerts: (): Promise<Alert[]> =>
    IS_DEMO
      ? Promise.resolve(demoData.getAlerts())
      : fetchApi("/api/alerts/"),

  getAnalysis: (name: string): Promise<ServiceAnalysis | null> =>
    IS_DEMO
      ? Promise.resolve(demoData.getAnalysis(name))
      : fetchApi(`/api/services/${name}/analysis`),
};
