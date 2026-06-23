"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ServiceCard from "@/components/ServiceCard";
import { api, ServiceStatus, Alert } from "@/lib/api";

export default function Dashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [svcData, alertData] = await Promise.all([
          api.getServices(),
          api.getAlerts().catch(() => []),
        ]);
        setServices(svcData);
        setAlerts(alertData);
      } catch {
        console.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, []);

  const healthyCount = services.filter((s) => s.is_healthy).length;
  const unhealthyCount = services.length - healthyCount;
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">Total de Servicos</p>
            <p className="text-3xl font-bold text-white">{services.length}</p>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">Online</p>
            <p className="text-3xl font-bold text-emerald-400">
              {healthyCount}
            </p>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-1">
              {unhealthyCount > 0 ? "Offline" : "Alertas"}
            </p>
            <p
              className={`text-3xl font-bold ${
                unhealthyCount > 0
                  ? "text-red-400"
                  : unresolvedAlerts.length > 0
                    ? "text-yellow-400"
                    : "text-slate-500"
              }`}
            >
              {unhealthyCount > 0 ? unhealthyCount : unresolvedAlerts.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white mb-4">
              Servicos Monitorados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <ServiceCard key={svc.id} service={svc} />
              ))}
            </div>
          </>
        )}

        {unresolvedAlerts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Alertas Recentes
            </h2>
            <div className="space-y-3">
              {unresolvedAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-card border rounded-xl p-4 ${
                    alert.level === "critical"
                      ? "border-red-500/50"
                      : "border-yellow-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          alert.level === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {alert.level.toUpperCase()}
                      </span>
                      <span className="text-sm text-white font-medium">
                        {alert.service_name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(alert.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
