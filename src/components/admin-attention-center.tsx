"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Flame,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import type { AttentionCenterData, AttentionItem } from "@/lib/attention-center";

interface AdminAttentionCenterProps {
  initialData: AttentionCenterData;
}

export function AdminAttentionCenter({ initialData }: AdminAttentionCenterProps) {
  const [data, setData] = useState<AttentionCenterData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const refreshData = async () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/attention-center", { cache: "no-store" });
        if (res.ok) {
          const fresh = await res.json();
          setData(fresh);
        }
      } catch (e) {
        console.warn("Failed to refresh attention center data:", e);
      }
    });
  };

  const filteredItems = data.items.filter((item) => {
    if (filter === "all") return true;
    return item.severity === filter;
  });

  const getSeverityBadge = (severity: AttentionItem["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          badge: "bg-red-950/80 border-red-500/40 text-red-400",
          dot: "bg-red-500",
          btn: "from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/30",
          cardBorder: "border-red-500/25 hover:border-red-500/50 bg-red-950/15",
          numColor: "text-red-400",
        };
      case "warning":
        return {
          badge: "bg-amber-950/80 border-amber-500/40 text-amber-300",
          dot: "bg-amber-400",
          btn: "from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-black shadow-amber-600/20",
          cardBorder: "border-amber-500/20 hover:border-amber-500/40 bg-amber-950/10",
          numColor: "text-amber-300",
        };
      case "info":
      default:
        return {
          badge: "bg-blue-950/80 border-blue-500/30 text-blue-300",
          dot: "bg-blue-400",
          btn: "from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-600/20",
          cardBorder: "border-white/10 hover:border-blue-500/30 bg-white/[0.02]",
          numColor: "text-white",
        };
    }
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#14141c] via-[#0e0e14] to-[#0a0a0f] p-5 sm:p-6 shadow-2xl shadow-black/80 space-y-5 relative overflow-hidden backdrop-blur-2xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-red-600/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-32 bg-amber-500/5 blur-[90px] pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4.5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Admin Attention Center</span>
                <span className="text-[10px] font-mono font-bold text-white/40 tracking-normal normal-case">
                  (Live Operations Command)
                </span>
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Instant action items across all operational queues requiring admin intervention.
            </p>
          </div>
        </div>

        {/* Global Status Pill & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {data.totalPendingCount > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-950/60 text-xs font-bold text-red-300 shadow-md shadow-red-950/40">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{data.totalPendingCount} Action Items Pending</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All Queues Clean &amp; Active</span>
            </div>
          )}

          <button
            onClick={() => void refreshData()}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition cursor-pointer font-semibold"
            title="Refresh live metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-red-400" : ""}`} />
            <span className="hidden sm:inline">Sync Live</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            filter === "all"
              ? "bg-white/15 text-white font-bold border border-white/20 shadow-sm"
              : "bg-white/5 text-white/50 hover:text-white"
          }`}
        >
          All Items ({data.totalPendingCount})
        </button>
        <button
          onClick={() => setFilter("critical")}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            filter === "critical"
              ? "bg-red-600 text-white font-bold shadow-md shadow-red-600/30"
              : "bg-white/5 text-red-400/80 hover:text-red-300"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Critical ({data.criticalCount})</span>
        </button>
        <button
          onClick={() => setFilter("warning")}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            filter === "warning"
              ? "bg-amber-600 text-black font-bold shadow-md shadow-amber-600/30"
              : "bg-white/5 text-amber-400/80 hover:text-amber-300"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Warnings ({data.warningCount})</span>
        </button>
        <button
          onClick={() => setFilter("info")}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            filter === "info"
              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
              : "bg-white/5 text-blue-400/80 hover:text-blue-300"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Inbound &amp; Support ({data.infoCount})</span>
        </button>
      </div>

      {/* Grid of Actionable Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {filteredItems.map((item) => {
          const cfg = getSeverityBadge(item.severity);
          const hasPending = item.count > 0;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4.5 transition-all duration-200 flex flex-col justify-between space-y-4 group ${
                hasPending
                  ? `${cfg.cardBorder} shadow-lg shadow-black/40`
                  : "border-white/5 bg-white/[0.01] opacity-60 hover:opacity-100"
              }`}
            >
              <div className="space-y-2.5">
                {/* Top Strip */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span>{item.severity}</span>
                  </span>
                </div>

                {/* Count & Title */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono leading-none ${hasPending ? cfg.numColor : "text-white/40"}`}>
                      {item.count}
                    </span>
                    <span className="text-xs font-bold text-white leading-snug">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={item.targetHref}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md group-hover:scale-[1.02] ${
                  hasPending
                    ? `bg-gradient-to-r ${cfg.btn}`
                    : "bg-white/5 hover:bg-white/10 text-white/60 border border-white/10"
                }`}
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
