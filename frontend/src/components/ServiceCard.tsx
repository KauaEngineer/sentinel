"use client";

import Link from "next/link";
import { ServiceStatus } from "@/lib/api";

function formatTime(iso: string | null): string {
  if (!iso) return "Nunca verificado";
  const date = new Date(iso);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ServiceCard({ service }: { service: ServiceStatus }) {
  const isHealthy = service.is_healthy;

  return (
    <Link href={`/services/${service.name}`}>
      <div className="bg-card border border-card-border rounded-xl p-5 hover:border-accent/50 transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
            {service.name}
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isHealthy
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isHealthy ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isHealthy ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Verificado: {formatTime(service.last_checked_at)}
        </p>
      </div>
    </Link>
  );
}
