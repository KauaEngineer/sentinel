"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ResponseTimeChart from "@/components/ResponseTimeChart";
import UptimeBar from "@/components/UptimeBar";
import { api, ServiceDetail, ServiceAnalysis } from "@/lib/api";

export default function ServiceDetailPage() {
  const params = useParams();
  const name = params.name as string;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [analysis, setAnalysis] = useState<ServiceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [svcData, analysisData] = await Promise.all([
          api.getService(name),
          api.getAnalysis(name).catch(() => null),
        ]);
        setService(svcData);
        setAnalysis(analysisData);
      } catch {
        console.error("Failed to fetch service");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-slate-400">Servico nao encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition-colors mb-6 inline-block"
        >
          &larr; Voltar ao dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className={`w-4 h-4 rounded-full ${
              service.is_healthy
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                : "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.5)]"
            }`}
          />
          <h2 className="text-2xl font-bold text-white">{service.name}</h2>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              service.is_healthy
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {service.is_healthy ? "Online" : "Offline"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">
              Tempo de Resposta
            </h3>
            <ResponseTimeChart events={service.recent_events} />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">
              Disponibilidade
            </h3>
            <UptimeBar events={service.recent_events} />

            {analysis && (
              <div className="mt-6 pt-6 border-t border-card-border">
                <h4 className="text-sm font-semibold text-slate-400 mb-3">
                  Analise IA
                </h4>
                <div className="space-y-2">
                  {analysis.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="text-sm text-slate-300 bg-accent/10 rounded-lg p-3 border border-accent/20"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Uptime</p>
                    <p className="text-sm font-semibold text-white">
                      {analysis.uptime_pct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Resp. Media</p>
                    <p className="text-sm font-semibold text-white">
                      {analysis.avg_response_ms.toFixed(0)}ms
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">
            Historico de Eventos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-card-border">
                  <th className="text-left py-2 px-3">Horario</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Tempo (ms)</th>
                  <th className="text-left py-2 px-3">Erro</th>
                </tr>
              </thead>
              <tbody>
                {service.recent_events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-card-border/50 hover:bg-slate-800/30"
                  >
                    <td className="py-2 px-3 text-slate-300 font-mono text-xs">
                      {new Date(event.checked_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          event.is_healthy
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {event.is_healthy ? "OK" : "FALHA"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-mono">
                      {event.response_time_ms ?? "-"}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-xs truncate max-w-xs">
                      {event.error_message || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
