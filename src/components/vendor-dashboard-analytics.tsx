"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { Calendar, Key, RefreshCw } from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  cityName: string;
  startDate: Date | string;
  endDate: Date | string;
  totalAmountINR: number;
  status: string;
  handoverStatus: string;
  user?: {
    name: string | null;
    email: string;
  } | null;
  vehicle?: Vehicle | null;
}

interface VendorDashboardAnalyticsProps {
  bookings: Booking[];
  vehicles: Vehicle[];
}

export function VendorDashboardAnalytics({ bookings, vehicles }: VendorDashboardAnalyticsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Helper to check if two dates are the same day
  const isSameDay = (dateVal: Date | string, targetStr: string) => {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    return d.toISOString().split("T")[0] === targetStr;
  };

  // 1. Today's Handovers Checklist
  const todayHandovers = useMemo(() => {
    const pickups = bookings.filter(
      (b) => b.status === "CONFIRMED" && isSameDay(b.startDate, todayStr) && b.handoverStatus === "PENDING"
    );
    const activeRentals = bookings.filter(
      (b) => b.status === "CONFIRMED" && isSameDay(b.endDate, todayStr) && b.handoverStatus === "RELEASED"
    );
    const completed = bookings.filter(
      (b) =>
        b.status === "CONFIRMED" &&
        (isSameDay(b.startDate, todayStr) || isSameDay(b.endDate, todayStr)) &&
        (b.handoverStatus === "RETURNED" || (isSameDay(b.startDate, todayStr) && b.handoverStatus === "RELEASED"))
    );

    return {
      pickups,
      returns: activeRentals,
      completedCount: completed.length,
      totalCount: pickups.length + activeRentals.length + completed.length,
    };
  }, [bookings, todayStr]);

  // 2. Earnings Trend (Last 7 Days)
  const earningsData = useMemo(() => {
    const days = [];
    const dataPoints = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

      const dayEarnings = bookings
        .filter((b) => b.status === "CONFIRMED" && isSameDay(b.startDate, dayStr))
        .reduce((sum, b) => sum + b.totalAmountINR, 0);

      days.push(dayLabel);
      dataPoints.push(dayEarnings);
    }

    const maxEarnings = Math.max(...dataPoints, 1000);
    return { days, dataPoints, maxEarnings };
  }, [bookings]);

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingTop = 55;
  const paddingBottom = 30;
  const paddingX = 35;

  const points = useMemo(() => {
    return earningsData.dataPoints.map((val, index) => {
      const x = paddingX + (index * (chartWidth - paddingX * 2)) / 6;
      const availableHeight = chartHeight - paddingTop - paddingBottom;
      const y = chartHeight - paddingBottom - (val * availableHeight) / earningsData.maxEarnings;
      return { x, y, val };
    });
  }, [earningsData, chartHeight, chartWidth, paddingTop, paddingBottom, paddingX]);

  const svgPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  const svgAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    return `${svgPath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  }, [points, svgPath, chartHeight, paddingBottom]);

  // 3. Fleet Utilization Rate
  const utilization = useMemo(() => {
    const totalVehicles = vehicles.length;
    if (totalVehicles === 0) return { count: 0, pct: 0 };

    // Active vehicles are those with active/confirmed bookings that have not been returned
    const activeCount = vehicles.filter((v) => {
      return bookings.some((b) => {
        const isConfirmed = b.status === "CONFIRMED" || b.status === "PAID" || b.status === "confirmed";
        if (!isConfirmed || b.handoverStatus === "RETURNED") return false;

        const matchesVehicle =
          b.vehicleId === v.id ||
          b.vehicle?.id === v.id ||
          (b as any).vehicleTitle?.toLowerCase() === v.title.toLowerCase();

        return matchesVehicle;
      });
    }).length;

    return {
      count: activeCount,
      pct: Math.round((activeCount / totalVehicles) * 100),
    };
  }, [bookings, vehicles]);

  // Donut Chart Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilization.pct / 100) * circumference;

  // 4. Vehicle Category Distribution for Donut Chart
  const categoryStats = useMemo(() => {
    const counts = { car: 0, bike: 0, scooter: 0, ev: 0 };
    vehicles.forEach((v) => {
      const type = (v.type || "car").toLowerCase();
      if (type.includes("bike") || type.includes("motorcycle")) counts.bike++;
      else if (type.includes("scooter")) counts.scooter++;
      else if (type.includes("ev") || type.includes("electric")) counts.ev++;
      else counts.car++;
    });
    const total = vehicles.length || 1;
    return [
      { name: "Cars", count: counts.car, pct: Math.round((counts.car / total) * 100), color: "#3B82F6", bg: "bg-blue-500" },
      { name: "Bikes", count: counts.bike, pct: Math.round((counts.bike / total) * 100), color: "#10B981", bg: "bg-emerald-500" },
      { name: "Scooters", count: counts.scooter, pct: Math.round((counts.scooter / total) * 100), color: "#F59E0B", bg: "bg-amber-500" },
      { name: "EVs", count: counts.ev, pct: Math.round((counts.ev / total) * 100), color: "#8B5CF6", bg: "bg-purple-500" },
    ];
  }, [vehicles]);

  const totalWeeklyRevenue = useMemo(() => {
    return earningsData.dataPoints.reduce((acc, curr) => acc + curr, 0);
  }, [earningsData]);

  return (
    <div className="space-y-6">
      {/* DESKTOP-ONLY COLOR-CODED KPI FIGURES BAR */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {/* KPI 1: Fleet Count & Status */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-blue-900/10 to-slate-900/60 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">Total Fleet</span>
            <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-ping opacity-75" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{vehicles.length}</span>
            <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              {utilization.count} Active
            </span>
          </div>
          <p className="mt-2 text-[11px] text-blue-200/60 font-medium">Ready for online bookings</p>
          <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
        </div>

        {/* KPI 2: Utilization % */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-emerald-900/10 to-slate-900/60 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">Utilization Rate</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {utilization.pct}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{utilization.count} <span className="text-sm font-normal text-white/50">/ {vehicles.length}</span></span>
            <span className="text-xs font-bold text-emerald-300">Vehicles In Use</span>
          </div>
          <div className="mt-2 w-full bg-emerald-950/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${utilization.pct}%` }} />
          </div>
          <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        </div>

        {/* KPI 3: 7-Day Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-amber-900/10 to-slate-900/60 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">7-Day Gross</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              INR
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">₹{totalWeeklyRevenue.toLocaleString("en-IN")}</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-200/60 font-medium">Sum of completed & booked rentals</p>
          <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
        </div>

        {/* KPI 4: Pending Handovers */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-red-900/10 to-slate-900/60 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-red-500/40 hover:shadow-red-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400">Handovers Today</span>
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
              {todayHandovers.totalCount} Total
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{todayHandovers.pickups.length + todayHandovers.returns.length}</span>
            <span className="text-xs font-bold text-red-300 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
              Action Required
            </span>
          </div>
          <p className="mt-2 text-[11px] text-red-200/60 font-medium">Verify via QR or booking code</p>
          <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-red-500/10 blur-xl pointer-events-none" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Today's Handovers Checklist */}
        <div className="md:col-span-2 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] backdrop-blur-md p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Today's Handovers</h2>
                <p className="text-xs text-white/60">Manage vehicle pickups and returns</p>
              </div>
              {todayHandovers.totalCount > 0 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-[var(--brand-red)] bg-[var(--brand-red)]/10 px-2.5 py-1 rounded-full border border-[var(--brand-red)]/20">
                    {todayHandovers.completedCount} / {todayHandovers.totalCount} Done
                  </span>
                </div>
              )}
            </div>

            {todayHandovers.pickups.length === 0 && todayHandovers.returns.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-white/20" />
                <p className="text-sm font-semibold">No handovers scheduled for today</p>
                <p className="text-xs text-white/30 mt-0.5">When bookings occur, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {/* Pickups */}
                {todayHandovers.pickups.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl border border-blue-500/15 bg-blue-500/[0.03]">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full mb-1 border border-blue-900/30">
                        <Key className="w-2.5 h-2.5" />
                        <span>Pickup Pending</span>
                      </span>
                      <h4 className="text-xs font-bold text-white">{booking.vehicle?.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        Customer: <span className="font-semibold text-slate-255">{booking.user?.name || booking.user?.email}</span>
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/scan-booking?id=${booking.id}`}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
                    >
                      Verify & Release
                    </Link>
                  </div>
                ))}

                {/* Returns */}
                {todayHandovers.returns.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.03]">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full mb-1 border border-amber-900/30">
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Return Pending</span>
                      </span>
                      <h4 className="text-xs font-bold text-white">{booking.vehicle?.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        Customer: <span className="font-semibold text-slate-255">{booking.user?.name || booking.user?.email}</span>
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/scan-booking?id=${booking.id}&source=qr`}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
                    >
                      Inspect & Return
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {todayHandovers.totalCount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-[var(--brand-red)] h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  style={{ width: `${(todayHandovers.completedCount / todayHandovers.totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Fleet Utilization Rate & Donut Charts */}
        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] backdrop-blur-md p-6 shadow-2xl flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/50">Fleet Utilization</h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Ratio
            </span>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center text-white/40 py-4">
              <p className="text-xs">No vehicles in fleet yet</p>
            </div>
          ) : (
            <div className="relative flex items-center justify-center my-2">
              <svg width="120" height="120" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-white/5"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Foreground circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-[var(--brand-red)] transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 4px rgba(239,68,68,0.4))" }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white">{utilization.pct}%</span>
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">In Use</p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-white/60 font-medium text-center">
            {utilization.count} of {vehicles.length} vehicles currently rented
          </p>

          {/* DESKTOP-ONLY CATEGORY DONUT LEGEND CHART */}
          <div className="hidden md:block w-full mt-4 pt-4 border-t border-white/10">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Category Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categoryStats.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.bg}`} />
                    <span className="text-[11px] font-semibold text-slate-300">{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-white">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Earnings Trend (Last 7 Days) with Graphical Bars on Desktop */}
        <div className="md:col-span-3 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] backdrop-blur-md p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Earnings Analytics & Daily Performance</h3>
              <p className="text-xs text-white/60">Daily revenue trends over the last 7 days</p>
            </div>
            <div className="flex items-center gap-3">
              {hoveredIndex !== null ? (
                <span className="text-xs font-black text-[var(--brand-red)] bg-[var(--brand-red)]/10 px-3.5 py-1.5 rounded-full border border-[var(--brand-red)]/20 animate-pulse transition-all">
                  {earningsData.days[hoveredIndex]} : ₹{earningsData.dataPoints[hoveredIndex].toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-300 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 transition-all">
                  Hover Points / Bars to Inspect
                </span>
              )}
            </div>
          </div>

          <div className="relative pt-6 pb-2 overflow-visible">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-red)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--brand-red)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingTop} x2={chartWidth - paddingX} y2={paddingTop} className="stroke-white/5" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={paddingTop + (chartHeight - paddingTop - paddingBottom) / 2} x2={chartWidth - paddingX} y2={paddingTop + (chartHeight - paddingTop - paddingBottom) / 2} className="stroke-white/5" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={chartHeight - paddingBottom} x2={chartWidth - paddingX} y2={chartHeight - paddingBottom} className="stroke-white/10" strokeWidth="1" />

              {/* DESKTOP-ONLY BAR CHARTS IN BACKGROUND OF LINE */}
              {points.map((p, i) => {
                const barWidth = 18;
                const barHeight = chartHeight - paddingBottom - p.y;
                return (
                  <rect
                    key={`bar-${i}`}
                    x={p.x - barWidth / 2}
                    y={p.y}
                    width={barWidth}
                    height={Math.max(barHeight, 2)}
                    rx="3"
                    className="hidden md:block transition-all duration-300 cursor-pointer"
                    fill="url(#barGradient)"
                    opacity={hoveredIndex === i ? "1" : "0.45"}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}

              {/* Hover Snapping Guide Line */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <line
                  x1={points[hoveredIndex].x}
                  y1={paddingTop - 10}
                  x2={points[hoveredIndex].x}
                  y2={chartHeight - paddingBottom}
                  stroke="rgba(239, 68, 68, 0.45)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Gradient Area */}
              {points.length > 1 && (
                <path d={svgAreaPath} fill="url(#chartGradient)" className="transition-all duration-500" />
              )}

              {/* Line Path */}
              {points.length > 1 && (
                <path d={svgPath} fill="none" className="stroke-[var(--brand-red)] transition-all duration-500" strokeWidth="2.5" strokeLinecap="round" style={{ filter: "drop-shadow(0px 2px 4px rgba(239,68,68,0.3))" }} />
              )}

              {/* Data Points & Floating Arrow Tooltips */}
              {points.map((p, i) => {
                const rectWidth = 86;
                const rectHeight = 24;
                const rectX = p.x - rectWidth / 2;
                const rectY = p.y - 38; // Cleanly floating 38px above point center
                const textY = rectY + 16;
                const arrowY = rectY + rectHeight;

                return (
                  <g
                    key={i}
                    className="group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredIndex === i ? "6" : "4"}
                      className="fill-[var(--brand-ink)] stroke-[var(--brand-red)] transition-all duration-200"
                      strokeWidth="2.5"
                    />
                    <circle cx={p.x} cy={p.y} r="14" className="fill-[var(--brand-red)] opacity-0 hover:opacity-15 transition-all duration-200" />

                    {/* Floating Tooltip Pill with Pointer Arrow */}
                    <g className={`transition-all duration-300 pointer-events-none ${hoveredIndex === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                      {/* Pointer Arrow */}
                      <polygon
                        points={`${p.x - 5},${arrowY} ${p.x + 5},${arrowY} ${p.x},${arrowY + 5}`}
                        fill="#0b0f19"
                        stroke="#ef4444"
                        strokeWidth="1"
                      />
                      {/* Tooltip Background Card */}
                      <rect
                        x={rectX}
                        y={rectY}
                        width={rectWidth}
                        height={rectHeight}
                        rx="7"
                        fill="#0b0f19"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        style={{ filter: "drop-shadow(0px 4px 12px rgba(239,68,68,0.35))" }}
                      />
                      {/* Price Label */}
                      <text
                        x={p.x}
                        y={textY}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                        textAnchor="middle"
                        className="tracking-wider font-sans"
                      >
                        ₹{p.val.toLocaleString("en-IN")}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between px-3 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {earningsData.days.map((day, idx) => (
              <span key={idx} className={hoveredIndex === idx ? "text-[var(--brand-red)] scale-105 transition-all" : "transition-all"}>{day}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
