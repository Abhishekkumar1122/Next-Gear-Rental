"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminActivityFeed } from "@/components/admin-activity-feed";
import { AdminActionPanel } from "@/components/admin-action-panel";
import { SparklineCard } from "@/components/admin-dashboard/sparkline-card";
import { Settings, Check, Edit2, Zap, Smartphone, Monitor } from "lucide-react";

type MonthlyData = {
  month: string;
  revenue: number;
  bookings: number;
};

type Props = {
  paidTotal: number;
  totalRefunds: number;
  totalBookings: number;
  activeRidersCount: number;
  paidCount: number;
  refundedCount: number;
  failedCount: number;
  totalPayments: number;
  pctPaid: number;
  pctRefunded: number;
  pctFailed: number;
  monthlyRevenueData: MonthlyData[];
  revenueSparkline: any;
  bookingsSparkline: any;
  activeRidersSparkline: any;
  refundsSparkline: any;
  visitsSparkline: any;
};

const MOCK_MONTHLY_DATA: MonthlyData[] = [
  { month: "Jan", revenue: 45000, bookings: 32 },
  { month: "Feb", revenue: 38000, bookings: 28 },
  { month: "Mar", revenue: 52000, bookings: 41 },
  { month: "Apr", revenue: 64000, bookings: 49 },
  { month: "May", revenue: 85000, bookings: 68 },
  { month: "Jun", revenue: 110000, bookings: 88 },
  { month: "Jul", revenue: 125000, bookings: 98 },
  { month: "Aug", revenue: 142000, bookings: 112 },
  { month: "Sep", revenue: 115000, bookings: 92 },
  { month: "Oct", revenue: 135000, bookings: 104 },
  { month: "Nov", revenue: 160000, bookings: 128 },
  { month: "Dec", revenue: 190000, bookings: 154 },
];

export function AdminOverviewClient(props: Props) {
  // 1. Real vs Mock Mode State (Persisted in localStorage)
  const [isRealMode, setIsRealMode] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 2. Custom Target Goals State
  const [monthlyTarget, setMonthlyTarget] = useState<number>(150000);
  const [yearlyTarget, setYearlyTarget] = useState<number>(1500000);
  const [isEditingTargets, setIsEditingTargets] = useState<boolean>(false);
  const [tempMonthlyTarget, setTempMonthlyTarget] = useState<string>("150000");
  const [tempYearlyTarget, setTempYearlyTarget] = useState<string>("1500000");

  // 3. Real-Time Live Traffic State
  const [liveTraffic, setLiveTraffic] = useState<{
    totalVisits: number;
    mobilePct: number;
    desktopPct: number;
    ctrPct: number;
    sparkline: number[];
  }>({
    totalVisits: 142,
    mobilePct: 58,
    desktopPct: 42,
    ctrPct: 18.5,
    sparkline: [20, 28, 24, 35, 42, 38, 48],
  });

  useEffect(() => {
    setIsMounted(true);
    const savedMode = localStorage.getItem("nextgear_admin_mode");
    if (savedMode) {
      setIsRealMode(savedMode === "real");
    }
    const savedMonthly = localStorage.getItem("nextgear_target_monthly");
    if (savedMonthly) setMonthlyTarget(Number(savedMonthly) || 150000);
    const savedYearly = localStorage.getItem("nextgear_target_yearly");
    if (savedYearly) setYearlyTarget(Number(savedYearly) || 1500000);

    // Fetch live traffic stats from API
    const fetchTraffic = async () => {
      try {
        const res = await fetch("/api/analytics/track", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLiveTraffic(data);
        }
      } catch {}
    };

    void fetchTraffic();
    const interval = setInterval(fetchTraffic, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = (mode: "real" | "mock") => {
    const isReal = mode === "real";
    setIsRealMode(isReal);
    localStorage.setItem("nextgear_admin_mode", isReal ? "real" : "mock");
  };

  const handleSaveTargets = () => {
    const m = Math.max(1000, Number(tempMonthlyTarget) || 150000);
    const y = Math.max(10000, Number(tempYearlyTarget) || 1500000);
    setMonthlyTarget(m);
    setYearlyTarget(y);
    localStorage.setItem("nextgear_target_monthly", String(m));
    localStorage.setItem("nextgear_target_yearly", String(y));
    setIsEditingTargets(false);
  };

  // Dynamic values depending on Real vs Mock mode
  const activePaidTotal = isRealMode ? props.paidTotal : 984246;
  const activeRefunds = isRealMode ? props.totalRefunds : 0;
  const activeRiders = isRealMode ? props.activeRidersCount : 248;
  const activeBookings = isRealMode ? props.totalBookings : 342;
  const activeVisits = isRealMode ? (liveTraffic.totalVisits || 1) : 189240;
  const activeCtr = isRealMode ? liveTraffic.ctrPct : 24.6;
  const activeMobilePct = isRealMode ? liveTraffic.mobilePct : 58;
  const activeDesktopPct = isRealMode ? liveTraffic.desktopPct : 42;

  const currentMonthlyData = isRealMode ? props.monthlyRevenueData : MOCK_MONTHLY_DATA;
  const maxRev = useMemo(() => Math.max(...currentMonthlyData.map((m) => m.revenue), 100), [currentMonthlyData]);
  const maxBook = useMemo(() => Math.max(...currentMonthlyData.map((m) => m.bookings), 10), [currentMonthlyData]);

  // Target percentages
  const monthlyPct = Math.min(100, Math.round((activePaidTotal / monthlyTarget) * 100));
  const yearlyPct = Math.min(100, Math.round((activePaidTotal / yearlyTarget) * 100));

  return (
    <div className="space-y-6">
      {/* 🎛️ TOP MODE SWITCHER & CUSTOM TARGET BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 p-3.5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleToggleMode("real")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                isRealMode
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isRealMode ? "bg-emerald-300 animate-ping" : "bg-white/20"}`} />
              🟢 REAL LIVE DATA
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("mock")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                !isRealMode
                  ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-600/30 scale-[1.02]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <span>✨</span> SHOWROOM / MOCK
            </button>
          </div>

          <span className="text-[10px] text-white/40 font-mono hidden md:inline">
            {isRealMode ? "⚡ 100% Genuine Database & Sensor Analytics" : "🌟 High-Volume Presentation Mode"}
          </span>
        </div>

        {/* Edit Targets Action Button */}
        <button
          type="button"
          onClick={() => {
            setTempMonthlyTarget(String(monthlyTarget));
            setTempYearlyTarget(String(yearlyTarget));
            setIsEditingTargets(!isEditingTargets);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>{isEditingTargets ? "Close Target Settings" : "Set Target Goals"}</span>
        </button>
      </div>

      {/* 🎯 Floating Centered Modal Popup for Target Goals */}
      {isEditingTargets && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsEditingTargets(false)}
        >
          <div 
            className="w-full max-w-lg p-6 rounded-3xl bg-[#0e0e0e] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">
                    Set Revenue Target Benchmarks
                  </h4>
                  <p className="text-[10px] text-white/50">Custom targets update the circular gauge rings dynamically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTargets(false)}
                className="text-white/40 hover:text-white text-base font-bold p-1 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-extrabold text-amber-400 block tracking-wider">
                  Monthly Target (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={tempMonthlyTarget}
                    onChange={(e) => setTempMonthlyTarget(e.target.value)}
                    className="w-full bg-black/90 border border-white/20 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition"
                    placeholder="150000"
                    autoFocus
                  />
                </div>
                <p className="text-[9px] text-white/40">Default: ₹1,50,000 / month</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-extrabold text-amber-400 block tracking-wider">
                  Yearly Target (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={tempYearlyTarget}
                    onChange={(e) => setTempYearlyTarget(e.target.value)}
                    className="w-full bg-black/90 border border-white/20 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition"
                    placeholder="1500000"
                  />
                </div>
                <p className="text-[9px] text-white/40">Default: ₹15,00,000 / year</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditingTargets(false)}
                className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTargets}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition transform active:scale-95"
              >
                <Check className="w-4 h-4" /> Save Target Goals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Sparkline Analytic Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SparklineCard
          icon="💰"
          label="Paid Revenue"
          value={`₹${activePaidTotal.toLocaleString("en-IN")}`}
          helper={isRealMode ? "All paid invoices" : "Projected YTD volume"}
          pill={isRealMode ? "Real DB" : "+24%"}
          pillColor="green"
          accentColor="red"
          linePath={props.revenueSparkline.linePath}
          areaPath={props.revenueSparkline.areaPath}
          dotX={props.revenueSparkline.lastX}
          dotY={props.revenueSparkline.lastY}
        />
        <SparklineCard
          icon="🔄"
          label="Total Refunds"
          value={`₹${activeRefunds.toLocaleString("en-IN")}`}
          helper="Cancelled bookings"
          pill="0%"
          pillColor="green"
          accentColor="yellow"
          linePath={props.refundsSparkline.linePath}
          areaPath={props.refundsSparkline.areaPath}
          dotX={props.refundsSparkline.lastX}
          dotY={props.refundsSparkline.lastY}
        />
        <SparklineCard
          icon="👤"
          label="Active Riders"
          value={String(activeRiders)}
          helper={isRealMode ? "Verified identities" : "Active sessions"}
          pill={isRealMode ? "Synced" : "+18%"}
          pillColor="green"
          accentColor="cyan"
          linePath={props.activeRidersSparkline.linePath}
          areaPath={props.activeRidersSparkline.areaPath}
          dotX={props.activeRidersSparkline.lastX}
          dotY={props.activeRidersSparkline.lastY}
        />
        <SparklineCard
          icon="📅"
          label="Total Bookings"
          value={String(activeBookings)}
          helper={isRealMode ? "Platform live orders" : "Past 30 days history"}
          pill={isRealMode ? "Live" : "-5%"}
          pillColor={isRealMode ? "green" : "red"}
          accentColor="purple"
          linePath={props.bookingsSparkline.linePath}
          areaPath={props.bookingsSparkline.areaPath}
          dotX={props.bookingsSparkline.lastX}
          dotY={props.bookingsSparkline.lastY}
        />
      </div>

      {/* Web Traffic & Device Analytics Panel (Real vs Mock) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Traffic Visits Card with Real Stock Market / TradingView Intraday Graph */}
        <div className="rounded-2xl border border-white/5 bg-[#0a0f0d] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-48 group hover:border-emerald-500/50 transition-all duration-300">
          {/* Background Stock Market Candlestick & Volatility Area Graph */}
          <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
            <svg className="w-full h-full text-emerald-500" viewBox="0 0 140 55" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stock-visits-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Financial Horizontal Grid Lines (Support / Resistance Levels) */}
              <line x1="0" y1="12" x2="140" y2="12" stroke="rgba(16,185,129,0.2)" strokeDasharray="3 3" strokeWidth="0.6" />
              <line x1="0" y1="26" x2="140" y2="26" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" strokeWidth="0.5" />
              <line x1="0" y1="40" x2="140" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" strokeWidth="0.5" />

              {/* Intraday High/Low Candlestick Vertical Stems */}
              <line x1="18" y1="28" x2="18" y2="44" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <line x1="36" y1="22" x2="36" y2="38" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <line x1="58" y1="18" x2="58" y2="32" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <line x1="78" y1="14" x2="78" y2="28" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <line x1="102" y1="8" x2="102" y2="22" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <line x1="124" y1="4" x2="124" y2="16" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              
              {/* High-Frequency Stock Price Area Fill */}
              <path
                d="M 0 55 L 0 42 L 10 38 L 18 40 L 26 33 L 36 35 L 44 26 L 52 29 L 58 21 L 68 24 L 78 17 L 86 20 L 94 13 L 102 15 L 112 9 L 120 12 L 130 5 L 140 7 L 140 55 Z"
                fill="url(#stock-visits-grad)"
              />
              {/* Sharp Stock Market Volatility Zig-Zag Line */}
              <path
                d="M 0 42 L 10 38 L 18 40 L 26 33 L 36 35 L 44 26 L 52 29 L 58 21 L 68 24 L 78 17 L 86 20 L 94 13 L 102 15 L 112 9 L 120 12 L 130 5 L 140 7"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Market Pivot Dots */}
              <circle cx="44" cy="26" r="1.5" fill="#34d399" />
              <circle cx="78" cy="17" r="1.5" fill="#34d399" />
              <circle cx="112" cy="9" r="1.5" fill="#34d399" />

              {/* Real-time Head Price Beacon */}
              <circle cx="140" cy="7" r="2.5" fill="#34d399" />
              <circle cx="140" cy="7" r="6" fill="#34d399" opacity="0.5" className="animate-ping" />
            </svg>
          </div>

          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/70 font-mono">
                TRAFFIC / INTRADAY
              </span>
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-emerald-950">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>BULLISH +14.2%</span>
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-3xl font-black text-white leading-none tracking-tight font-mono">
                {activeVisits.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10px] text-emerald-400/80 font-medium">
                {isRealMode ? "Live verified session ticks" : "Simulated market sessions"}
              </p>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-white/50 pt-2 border-t border-emerald-900/30">
            <span>RSI: 68.4 (High Momentum)</span>
            <span className="text-emerald-400 font-bold">▲ 140 Ticks/min</span>
          </div>
        </div>

        {/* Interaction & CTR Card with Stock Market Volatility Graph */}
        <div className="rounded-2xl border border-white/5 bg-[#120a0d] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-48 group hover:border-rose-500/50 transition-all duration-300">
          {/* Background Stock Market Area Graph */}
          <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
            <svg className="w-full h-full text-rose-500" viewBox="0 0 140 55" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stock-ctr-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#e11d48" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#9f1239" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Financial Horizontal Grid Lines */}
              <line x1="0" y1="14" x2="140" y2="14" stroke="rgba(244,63,94,0.2)" strokeDasharray="3 3" strokeWidth="0.6" />
              <line x1="0" y1="28" x2="140" y2="28" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" strokeWidth="0.5" />
              <line x1="0" y1="42" x2="140" y2="42" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" strokeWidth="0.5" />

              {/* Candlestick Stems */}
              <line x1="22" y1="32" x2="22" y2="48" stroke="#f43f5e" strokeWidth="0.8" opacity="0.6" />
              <line x1="48" y1="24" x2="48" y2="40" stroke="#f43f5e" strokeWidth="0.8" opacity="0.6" />
              <line x1="82" y1="16" x2="82" y2="30" stroke="#f43f5e" strokeWidth="0.8" opacity="0.6" />
              <line x1="116" y1="8" x2="116" y2="22" stroke="#f43f5e" strokeWidth="0.8" opacity="0.6" />
              
              {/* Area Fill */}
              <path
                d="M 0 55 L 0 46 L 12 44 L 22 47 L 34 38 L 44 41 L 56 30 L 68 33 L 78 22 L 90 26 L 102 16 L 114 19 L 126 10 L 140 12 L 140 55 Z"
                fill="url(#stock-ctr-grad)"
              />
              {/* Sharp Stock Zig-Zag Line */}
              <path
                d="M 0 46 L 12 44 L 22 47 L 34 38 L 44 41 L 56 30 L 68 33 L 78 22 L 90 26 L 102 16 L 114 19 L 126 10 L 140 12"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pivot Dots */}
              <circle cx="56" cy="30" r="1.5" fill="#fb7185" />
              <circle cx="102" cy="16" r="1.5" fill="#fb7185" />

              {/* Head Cursor */}
              <circle cx="140" cy="12" r="2.5" fill="#fb7185" />
              <circle cx="140" cy="12" r="6" fill="#fb7185" opacity="0.5" className="animate-ping" />
            </svg>
          </div>

          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400/70 font-mono">
                CONVERSION / CTR
              </span>
              <span className="text-[10px] font-black text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full">
                TARGET: 25%
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <p className="text-3xl font-black text-white leading-none tracking-tight font-mono">{activeCtr}%</p>
              <span className="text-[10px] text-rose-400 font-bold font-mono">Vol: 1.2K</span>
            </div>
            <p className="mt-1 text-[10px] text-white/50">Search to booking ratio</p>
          </div>

          <div className="relative z-10 space-y-1.5 text-[10px] pt-1">
            <div className="flex justify-between text-white/60 text-[9px] font-mono">
              <span>PROGRESS TOWARDS TARGET</span>
              <span className="font-bold text-rose-400">{Math.min(100, Math.round((activeCtr / 25) * 100))}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 h-1.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((activeCtr / 25) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* User Device breakdown (Mobile vs Desktop) */}
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-48">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">User Device Split</p>
            <p className="text-[11px] text-white/60 leading-relaxed mt-1">
              {isRealMode ? "Live user-agent viewport detection" : "Ratio of traffic from mobile vs desktop"}
            </p>
          </div>
          <div className="space-y-3 text-[10px]">
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-white/80">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-red-400" /> Mobile Users
                </span>
                <span>{activeMobilePct}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[var(--brand-red)] h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all duration-500"
                  style={{ width: `${activeMobilePct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-white/80">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" /> Desktop / Laptop
                </span>
                <span>{activeDesktopPct}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${activeDesktopPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualization section: Donut + Bar Graph */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Donut Chart: Booking status breakdown */}
        <div className="md:col-span-4 rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50 border-b border-white/5 pb-2.5">
              Settlement Status Breakdown
            </h3>
            <div className="relative py-6 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90">
                <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.02)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="var(--brand-red)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 * (1 - (props.paidCount || 1) / (props.totalPayments || 1))}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center leading-none text-center">
                <span className="text-xl font-black text-white">{props.pctPaid}%</span>
                <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1 font-bold">Paid Ratio</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-red)]" />
                <span className="text-white/60">Paid</span>
              </div>
              <span className="font-bold text-white">{props.paidCount} ({props.pctPaid}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                <span className="text-white/60">Refunded</span>
              </div>
              <span className="font-bold text-white">{props.refundedCount} ({props.pctRefunded}%)</span>
            </div>
          </div>
        </div>

        {/* Bar Chart: Sales & Views comparison (Restored) */}
        <div className="md:col-span-8 rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50">
                Sales & Views Comparison
              </h3>
              <span className="text-[9px] font-mono uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                {isRealMode ? "Real Platform Trends" : "Showroom Mock Volume"}
              </span>
            </div>

            <div className="h-48 mt-6 flex items-end justify-between gap-2 px-2 relative border-b border-white/5 pb-1">
              <div className="absolute inset-x-0 bottom-12 border-t border-white/5" />
              <div className="absolute inset-x-0 bottom-24 border-t border-white/5" />
              <div className="absolute inset-x-0 bottom-36 border-t border-white/5" />

              {currentMonthlyData.map((item) => {
                const revHeight = maxRev > 0 && item.revenue > 0 ? Math.max(8, Math.round((item.revenue / maxRev) * 100)) : (item.revenue > 0 ? 8 : 2);
                const bookHeight = maxBook > 0 && item.bookings > 0 ? Math.max(8, Math.round((item.bookings / maxBook) * 100)) : (item.bookings > 0 ? 8 : 2);

                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                    <div className="flex items-end justify-center gap-1.5 w-full h-full">
                      <div
                        style={{ height: `${revHeight}%` }}
                        className={`w-2.5 rounded-t-sm transition-all duration-500 relative ${
                          item.revenue > 0
                            ? "bg-gradient-to-t from-orange-600 to-amber-400 shadow-md shadow-orange-500/20"
                            : "bg-white/10 opacity-30"
                        }`}
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-red-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                          ₹{item.revenue.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div
                        style={{ height: `${bookHeight}%` }}
                        className={`w-2.5 rounded-t-sm transition-all duration-500 relative ${
                          item.bookings > 0
                            ? "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md shadow-cyan-500/20"
                            : "bg-white/10 opacity-30"
                        }`}
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-700 text-[8px] font-black text-white px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                          {item.bookings} Bookings
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40 mt-2 font-bold tracking-wider uppercase select-none">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 text-[10px] uppercase font-black tracking-wider mt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-orange-600 to-amber-400 shadow-sm shadow-orange-500/30" />
              <span className="text-white/60">Sales Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-blue-600 to-cyan-400 shadow-sm shadow-cyan-500/30" />
              <span className="text-white/60">Booking Count</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 DEDICATED MULTI-LINE OPERATIONAL TRAJECTORY GRAPH (Refined Vibrant Colors) */}
      <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Multi-Line Operations & Growth Trajectory
              </h3>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Correlated metrics tracking Revenue Velocity, Fleet Utilization, and Traffic Conversions across monthly intervals.
            </p>
          </div>

          {/* Color Legend with Modern Line Indicators */}
          <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-sm shadow-red-500/50" />
              <span className="text-rose-300">Revenue Velocity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/50" />
              <span className="text-cyan-300">Live Web Traffic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-purple-400 to-violet-500 shadow-sm shadow-purple-400/50" />
              <span className="text-purple-300">Fleet Utilization</span>
            </div>
          </div>
        </div>

        {/* Realistic Multi-Line SVG Canvas with Vertical Dashed Grid Lines & Nodes */}
        <div className="relative w-full h-64 select-none pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 540 220" preserveAspectRatio="none">
            {/* Horizontal baseline */}
            <line x1="20" y1="180" x2="520" y2="180" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* Vertical Dashed Grid Lines & Interval Ticks */}
            {currentMonthlyData.map((item, idx) => {
              const x = 35 + idx * (470 / Math.max(1, currentMonthlyData.length - 1));
              const tickColors = ["#f43f5e", "#06b6d4", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#eab308"];
              const color = tickColors[idx % tickColors.length];

              return (
                <g key={`multigrid-${item.month}`}>
                  {/* Vertical Dashed Line */}
                  <line
                    x1={x}
                    y1={15}
                    x2={x}
                    y2={180}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Bottom Color Tick Marker & Stem */}
                  <rect x={x - 3.5} y={181} width="7" height="4" rx="1" fill={color} />
                  <line x1={x} y1={185} x2={x} y2={193} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                  {/* Month Label */}
                  <text x={x} y={206} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    {item.month}
                  </text>
                </g>
              );
            })}

            {/* --- LINE 1: CYAN / ELECTRIC BLUE (Web Traffic Index) --- */}
            {(() => {
              const points = currentMonthlyData.map((item, idx) => {
                const x = 35 + idx * (470 / Math.max(1, currentMonthlyData.length - 1));
                const rawViews = item.bookings * 40 + (item.revenue > 0 ? (item.revenue / 220) : 55);
                const maxV = Math.max(150, maxBook * 50);
                const y = 165 - Math.min(140, Math.max(18, (rawViews / maxV) * 140));
                return { x, y };
              });
              const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "");

              return (
                <g>
                  <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((pt, i) => (
                    <g key={`cyan-node-${i}`} className="group/node cursor-pointer">
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#06b6d4" stroke="#0c0c0c" strokeWidth="1.5" className="transition-all duration-200 group-hover/node:r-6.5" />
                      <circle cx={pt.x} cy={pt.y} r="10" fill="#06b6d4" opacity="0.25" className="opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* --- LINE 2: VIBRANT VIOLET / PURPLE (Fleet Utilization Index) --- */}
            {(() => {
              const points = currentMonthlyData.map((item, idx) => {
                const x = 35 + idx * (470 / Math.max(1, currentMonthlyData.length - 1));
                const y = 165 - Math.min(135, Math.max(25, (item.bookings / maxBook) * 125 + (idx % 2 === 0 ? 12 : -8)));
                return { x, y };
              });
              const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "");

              return (
                <g>
                  <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((pt, i) => (
                    <g key={`purple-node-${i}`} className="group/node cursor-pointer">
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#a855f7" stroke="#0c0c0c" strokeWidth="1.5" className="transition-all duration-200 group-hover/node:r-6.5" />
                      <circle cx={pt.x} cy={pt.y} r="10" fill="#a855f7" opacity="0.25" className="opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* --- LINE 3: BRAND CRIMSON / ROSE (Revenue Velocity) --- */}
            {(() => {
              const points = currentMonthlyData.map((item, idx) => {
                const x = 35 + idx * (470 / Math.max(1, currentMonthlyData.length - 1));
                const normalized = item.revenue > 0 ? (item.revenue / maxRev) : 0.2;
                const y = 165 - Math.min(145, Math.max(20, normalized * 140));
                return { x, y };
              });
              const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "");

              return (
                <g>
                  <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((pt, i) => (
                    <g key={`rose-node-${i}`} className="group/node cursor-pointer">
                      <circle cx={pt.x} cy={pt.y} r="5.5" fill="#f43f5e" stroke="#0c0c0c" strokeWidth="1.5" className="transition-all duration-200 group-hover/node:r-7" />
                      <circle cx={pt.x} cy={pt.y} r="11" fill="#f43f5e" opacity="0.3" className="opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Dynamic Target Goal Section (Customizable by Admin) */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Monthly Revenue Target</h4>
              <button
                type="button"
                onClick={() => {
                  setTempMonthlyTarget(String(monthlyTarget));
                  setTempYearlyTarget(String(yearlyTarget));
                  setIsEditingTargets(true);
                }}
                className="text-[9px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 transition"
              >
                <Edit2 className="w-2.5 h-2.5" /> EDIT
              </button>
            </div>
            <p className="text-2xl font-black text-white">₹{activePaidTotal.toLocaleString("en-IN")}</p>
            <p className="text-xs text-green-400 font-bold flex items-center gap-1">
              <span>▲ {monthlyPct}%</span>
              <span className="text-white/40 font-normal">vs target ₹{monthlyTarget.toLocaleString("en-IN")}</span>
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--brand-red)"
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - monthlyPct}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-white">{monthlyPct}%</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Yearly Revenue Target</h4>
              <button
                type="button"
                onClick={() => {
                  setTempMonthlyTarget(String(monthlyTarget));
                  setTempYearlyTarget(String(yearlyTarget));
                  setIsEditingTargets(true);
                }}
                className="text-[9px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 transition"
              >
                <Edit2 className="w-2.5 h-2.5" /> EDIT
              </button>
            </div>
            <p className="text-2xl font-black text-white">₹{activePaidTotal.toLocaleString("en-IN")}</p>
            <p className="text-xs text-green-400 font-bold flex items-center gap-1">
              <span>▲ {yearlyPct}%</span>
              <span className="text-white/40 font-normal">vs target ₹{yearlyTarget.toLocaleString("en-IN")}</span>
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#d97706"
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - yearlyPct}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-white">{yearlyPct}%</span>
          </div>
        </div>
      </div>

      {/* Admin Action Control Center */}
      <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Quick Actions</p>
        <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Admin Control Center</h2>
        <p className="text-xs text-white/60 leading-relaxed mt-1">Initialize mock databases, bypass payment triggers, or audit vehicle parameters instantly.</p>
        <div className="mt-5">
          <AdminActionPanel />
        </div>
      </section>

      {/* Real Live Activity Stream Feed */}
      <AdminActivityFeed isRealMode={isRealMode} />
    </div>
  );
}
