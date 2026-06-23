const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export const api = {
  getServices: () => fetchApi<ServiceStatus[]>("/api/services/"),
  getService: (name: string) => fetchApi<ServiceDetail>(`/api/services/${name}`),
  getEvents: (name: string, limit = 100) =>
    fetchApi<ServiceEvent[]>(`/api/services/${name}/events?limit=${limit}`),
  getAlerts: () => fetchApi<Alert[]>("/api/alerts/"),
  getAnalysis: (name: string) =>
    fetchApi<ServiceAnalysis>(`/api/services/${name}/analysis`),
};
