"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { api, Alert } from "@/lib/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setAlerts(await api.getAlerts());
      } catch {
        console.error("Failed to fetch alerts");
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-white mb-6">
          Historico de Alertas
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center">
            <p className="text-slate-400">Nenhum alerta registrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-card border rounded-xl p-4 ${
                  alert.resolved
                    ? "border-card-border opacity-60"
                    : alert.level === "critical"
                      ? "border-red-500/50"
                      : "border-yellow-500/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
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
                    {alert.resolved && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                        RESOLVIDO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(alert.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-2">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
