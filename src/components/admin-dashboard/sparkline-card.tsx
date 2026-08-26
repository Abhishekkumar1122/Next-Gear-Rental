"use client";

import React from "react";

type SparklineCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  trend?: string;
  pill?: string;
  pillColor?: "green" | "red" | "yellow";
  isPositive?: boolean;
  accentColor?: "red" | "yellow" | "cyan" | "purple";
  linePath: string;
  areaPath: string;
  dotX?: number;
  dotY?: number;
};

export function SparklineCard({
  label,
  value,
  helper,
  icon,
  trend,
  pill,
  pillColor = "green",
  isPositive = true,
  accentColor = "red",
  linePath,
  areaPath,
  dotX,
  dotY,
}: SparklineCardProps) {
  const config = {
    red: {
      borderHover: "hover:border-red-500/40",
      sparklineColor: "#ef4444",
      iconBg: "bg-red-950/50 border-red-800/40 text-red-400",
      shadowGlow: "shadow-red-950/10",
    },
    yellow: {
      borderHover: "hover:border-amber-500/40",
      sparklineColor: "#f59e0b",
      iconBg: "bg-amber-950/50 border-amber-800/40 text-amber-400",
      shadowGlow: "shadow-amber-950/10",
    },
    cyan: {
      borderHover: "hover:border-cyan-500/40",
      sparklineColor: "#06b6d4",
      iconBg: "bg-cyan-950/50 border-cyan-800/40 text-cyan-400",
      shadowGlow: "shadow-cyan-950/10",
    },
    purple: {
      borderHover: "hover:border-purple-500/40",
      sparklineColor: "#a855f7",
      iconBg: "bg-purple-950/50 border-purple-800/40 text-purple-400",
      shadowGlow: "shadow-purple-950/10",
    },
  };

  const style = config[accentColor] || config.red;
  const badgeText = pill || trend || "+0%";
  const badgeIsGreen = pillColor === "green" || isPositive;

  return (
    <div
      className={`rounded-2xl border border-white/5 bg-[#0c0c0c] p-5 shadow-lg relative overflow-hidden transition-all duration-300 ${style.borderHover} ${style.shadowGlow} group flex flex-col justify-between h-48`}
    >
      <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
        <svg className="w-full h-full" style={{ color: style.sparklineColor }} viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={style.sparklineColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={style.sparklineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#grad-${label.replace(/\s+/g, "")})`} />
          <path d={linePath} fill="none" stroke={style.sparklineColor} strokeWidth="1.4" strokeLinecap="round" />
          {dotX !== undefined && dotY !== undefined && (
            <>
              <circle cx={dotX} cy={dotY} r="1.5" fill="#fff" />
              <circle cx={dotX} cy={dotY} r="3.5" fill={style.sparklineColor} opacity="0.6" className="animate-ping" />
            </>
          )}
        </svg>
      </div>

      <div className="relative z-10 w-full pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-sm shadow-md ${style.iconBg} select-none`}>
            {icon}
          </div>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              badgeIsGreen
                ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/30"
                : "text-rose-400 bg-rose-950/40 border-rose-900/30"
            }`}
          >
            {badgeText}
          </span>
        </div>

        <div className="mt-4.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-2 text-2xl font-black text-white tracking-tight leading-none">{value}</p>
          <p className="mt-1.5 text-[9px] text-white/50">{helper}</p>
        </div>
      </div>
    </div>
  );
}
