"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ServiceEvent } from "@/lib/api";

interface Props {
  events: ServiceEvent[];
}

export default function ResponseTimeChart({ events }: Props) {
  const data = [...events]
    .reverse()
    .map((e) => ({
      time: new Date(e.checked_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ms: e.response_time_ms ?? 0,
      healthy: e.is_healthy,
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        Sem dados de resposta ainda
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="msGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} />
        <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="ms" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Area
          type="monotone"
          dataKey="ms"
          stroke="#3b82f6"
          fill="url(#msGradient)"
          strokeWidth={2}
          name="Tempo de resposta"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
