"use client";

import { ServiceEvent } from "@/lib/api";

interface Props {
  events: ServiceEvent[];
}

export default function UptimeBar({ events }: Props) {
  const sorted = [...events].reverse();
  const total = sorted.length;
  const healthy = sorted.filter((e) => e.is_healthy).length;
  const uptimePct = total > 0 ? (healthy / total) * 100 : 100;

  const getColor = (pct: number) => {
    if (pct >= 95) return "bg-emerald-400";
    if (pct >= 80) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">Uptime</span>
        <span className="text-sm font-mono font-semibold text-white">
          {uptimePct.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(uptimePct)}`}
          style={{ width: `${uptimePct}%` }}
        />
      </div>
      <div className="flex gap-1 mt-3">
        {sorted.slice(-30).map((e) => (
          <div
            key={e.id}
            className={`flex-1 h-6 rounded-sm ${
              e.is_healthy ? "bg-emerald-400/60" : "bg-red-400/60"
            }`}
            title={`${new Date(e.checked_at).toLocaleString("pt-BR")} — ${
              e.is_healthy ? "OK" : "Falha"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
