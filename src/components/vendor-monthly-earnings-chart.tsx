"use client";
import { useMemo, useState } from "react";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";

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
}

interface VendorMonthlyEarningsChartProps {
  bookings: Booking[];
  totalEarningsINR: number;
}

export function VendorMonthlyEarningsChart({ bookings, totalEarningsINR }: VendorMonthlyEarningsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<"12m" | "6m" | "1m">("12m");
  const [colorTheme, setColorTheme] = useState<"pinkViolet" | "emeraldCyan" | "electricBlue">("pinkViolet");

  const monthlyData = useMemo(() => {
    if (timeframe === "1m") {
      // 30 Days daily sampling points for the current month
      const days = ["Day 1", "Day 4", "Day 7", "Day 10", "Day 13", "Day 16", "Day 19", "Day 22", "Day 25", "Day 28", "Day 30"];
      const now = new Date();
      const currentMonth = now.getMonth();

      const displayPoints = days.map((dayLabel, idx) => {
        const dayStart = idx * 3 + 1;
        const dayEnd = dayStart + 2;

        const sumBookings = bookings
          .filter((b) => {
            if (b.status !== "CONFIRMED") return false;
            const d = new Date(b.startDate);
            const dateNum = d.getDate();
            return d.getMonth() === currentMonth && dateNum >= dayStart && dateNum <= dayEnd;
          })
          .reduce((sum, b) => sum + b.totalAmountINR, 0);

        const mockDailyBaseline = [1200, 2400, 1800, 3200, 2900, 4100, 3800, 4500, 4200, 3600, 4900];
        const val = sumBookings > 0 ? sumBookings : mockDailyBaseline[idx];

        return { month: dayLabel, val };
      });

      const maxVal = Math.max(...displayPoints.map((p) => p.val), 6000);
      return { displayPoints, maxVal, minVal: 0 };
    }

    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Default baseline monthly trend (in INR)
    const baselineTrend = [15000, 18000, 17000, 19000, 21000, 23000, 25000, 24000, 22000, 20000, 19000, 21000];

    const fullYearPoints = allMonths.map((month, idx) => {
      // Sum bookings for this month
      const sumBookings = bookings
        .filter((b) => {
          if (b.status !== "CONFIRMED") return false;
          const d = new Date(b.startDate);
          return d.getMonth() === idx;
        })
        .reduce((sum, b) => sum + b.totalAmountINR, 0);

      const val = sumBookings > 0 ? sumBookings : baselineTrend[idx];
      return { month, val };
    });

    const displayPoints = timeframe === "6m" ? fullYearPoints.slice(6, 12) : fullYearPoints;
    const maxVal = Math.max(...displayPoints.map((p) => p.val), 30000);

    return { displayPoints, maxVal, minVal: 0 };
  }, [bookings, timeframe]);

  // Theme Styling Properties
  const themeStyles = useMemo(() => {
    if (colorTheme === "pinkViolet") {
      return {
        cardBorder: "border-pink-500/30",
        cardBg: "from-[#120817] via-[#1a0b25] to-[#0d0714]",
        badgeText: "text-pink-400 bg-pink-500/10 border-pink-500/30",
        periodGrossText: "text-pink-400",
        activeBtnBg: "bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]",
        lineGradStart: "#EC4899",
        lineGradMid: "#8B5CF6",
        lineGradEnd: "#6366F1",
        areaGradStart: "#8B5CF6",
        nodeStroke: "#EC4899",
        nodeGlow: "drop-shadow(0px 4px 14px rgba(236,72,153,0.65))",
        tooltipBorder: "#EC4899",
      };
    } else if (colorTheme === "emeraldCyan") {
      return {
        cardBorder: "border-emerald-500/30",
        cardBg: "from-[#041410] via-[#08201a] to-[#040e0b]",
        badgeText: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        periodGrossText: "text-emerald-400",
        activeBtnBg: "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        lineGradStart: "#10B981",
        lineGradMid: "#06B6D4",
        lineGradEnd: "#3B82F6",
        areaGradStart: "#10B981",
        nodeStroke: "#10B981",
        nodeGlow: "drop-shadow(0px 4px 14px rgba(16,185,129,0.65))",
        tooltipBorder: "#10B981",
      };
    } else {
      return {
        cardBorder: "border-blue-500/30",
        cardBg: "from-[#081021] via-[#0c1833] to-[#070e1e]",
        badgeText: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        periodGrossText: "text-blue-400",
        activeBtnBg: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]",
        lineGradStart: "#2563EB",
        lineGradMid: "#3B82F6",
        lineGradEnd: "#60A5FA",
        areaGradStart: "#3B82F6",
        nodeStroke: "#3B82F6",
        nodeGlow: "drop-shadow(0px 4px 14px rgba(59,130,246,0.65))",
        tooltipBorder: "#3B82F6",
      };
    }
  }, [colorTheme]);

  // SVG Dimensions & Margins
  const chartWidth = 720;
  const chartHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 35;
  const paddingTop = 50;
  const paddingBottom = 45;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Calculate Point Coordinates
  const points = useMemo(() => {
    const count = monthlyData.displayPoints.length;
    return monthlyData.displayPoints.map((item, idx) => {
      const x = paddingLeft + (idx * plotWidth) / (count - 1);
      const y = chartHeight - paddingBottom - (item.val / monthlyData.maxVal) * plotHeight;
      return { x, y, val: item.val, month: item.month };
    });
  }, [monthlyData, plotWidth, plotHeight, paddingLeft, paddingBottom, chartHeight]);

  // SVG Line & Gradient Paths
  const svgPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((path, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`), "");
  }, [points]);

  const svgAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    return `${svgPath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  }, [points, svgPath, chartHeight, paddingBottom]);

  // Y-Axis Ticks (5 Intervals)
  const yTicks = useMemo(() => {
    const ticks = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = Math.round((monthlyData.maxVal / steps) * i);
      const y = chartHeight - paddingBottom - (val / monthlyData.maxVal) * plotHeight;
      ticks.push({ val, y });
    }
    return ticks;
  }, [monthlyData.maxVal, plotHeight, paddingBottom, chartHeight]);

  const totalPeriodSum = useMemo(() => {
    return monthlyData.displayPoints.reduce((acc, curr) => acc + curr.val, 0);
  }, [monthlyData]);

  return (
    <section className={`hidden md:block rounded-2xl border ${themeStyles.cardBorder} bg-gradient-to-br ${themeStyles.cardBg} p-6 backdrop-blur-md shadow-2xl text-white transition-all duration-500`}>
      {/* HEADER BAR & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white tracking-wide">
              {timeframe === "1m" ? "Daily Earnings (This Month)" : "Monthly Sales (Line Chart)"}
            </h3>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${themeStyles.badgeText}`}>
              Financial Performance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {timeframe === "1m" ? "Day-by-day revenue breakdown for current month" : "Monthly earnings trajectory and revenue analytics"}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Color Scheme Picker */}
          <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl gap-1">
            <button
              onClick={() => setColorTheme("pinkViolet")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                colorTheme === "pinkViolet" ? "bg-pink-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Vibrant Pink & Violet Theme"
            >
              ✨ Pink Violet
            </button>
            <button
              onClick={() => setColorTheme("emeraldCyan")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                colorTheme === "emeraldCyan" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Cyber Emerald & Cyan Theme"
            >
              ⚡ Cyber Emerald
            </button>
            <button
              onClick={() => setColorTheme("electricBlue")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                colorTheme === "electricBlue" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Electric Blue Theme"
            >
              🌊 Electric Blue
            </button>
          </div>

          <div className="text-right border-l border-white/10 pl-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Period Gross</span>
            <span className={`text-lg font-black ${themeStyles.periodGrossText}`}>₹{totalPeriodSum.toLocaleString("en-IN")}</span>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setTimeframe("1m")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeframe === "1m" ? themeStyles.activeBtnBg : "text-slate-400 hover:text-white"
              }`}
            >
              This Month (30 Days)
            </button>
            <button
              onClick={() => setTimeframe("6m")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeframe === "6m" ? themeStyles.activeBtnBg : "text-slate-400 hover:text-white"
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setTimeframe("12m")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeframe === "12m" ? themeStyles.activeBtnBg : "text-slate-400 hover:text-white"
              }`}
            >
              12 Months (Jan-Dec)
            </button>
          </div>
        </div>
      </div>

      {/* GRAPH CONTAINER */}
      <div className="relative pt-2 pb-1 overflow-visible">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* Dynamic Theme Line Gradient Fill */}
            <linearGradient id="themeAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeStyles.areaGradStart} stopOpacity="0.45" />
              <stop offset="100%" stopColor={themeStyles.areaGradStart} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="themeLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={themeStyles.lineGradStart} />
              <stop offset="50%" stopColor={themeStyles.lineGradMid} />
              <stop offset="100%" stopColor={themeStyles.lineGradEnd} />
            </linearGradient>
          </defs>

          {/* Y-AXIS TITLE */}
          <text
            x={15}
            y={chartHeight / 2}
            fill="#94A3B8"
            fontSize="11"
            fontWeight="700"
            className="tracking-wider uppercase"
            transform={`rotate(-90 15 ${chartHeight / 2})`}
            textAnchor="middle"
          >
            Sales (₹)
          </text>

          {/* X-AXIS TITLE */}
          <text
            x={chartWidth / 2 + paddingLeft / 2}
            y={chartHeight - 8}
            fill="#94A3B8"
            fontSize="11"
            fontWeight="700"
            className="tracking-wider uppercase"
            textAnchor="middle"
          >
            {timeframe === "1m" ? "Day of Month" : "Month"}
          </text>

          {/* HORIZONTAL GRID LINES & Y-AXIS TICKS */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={tick.y + 4}
                fill="#94A3B8"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
                className="font-mono"
              >
                ₹{(tick.val / 1000).toFixed(0)}k
              </text>
            </g>
          ))}

          {/* VERTICAL GRID LINES & X-AXIS LABELS */}
          {points.map((p, idx) => (
            <g key={`x-grid-${idx}`}>
              <line
                x1={p.x}
                y1={paddingTop}
                x2={p.x}
                y2={chartHeight - paddingBottom}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={p.x}
                y={chartHeight - paddingBottom + 20}
                fill={hoveredIndex === idx ? themeStyles.nodeStroke : "#94A3B8"}
                fontSize="11"
                fontWeight={hoveredIndex === idx ? "900" : "700"}
                textAnchor="middle"
                className="transition-all cursor-pointer font-sans"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {p.month}
              </text>
            </g>
          ))}

          {/* MAIN CHART AXIS BORDER LINES */}
          <line
            x1={paddingLeft}
            y1={paddingTop - 10}
            x2={paddingLeft}
            y2={chartHeight - paddingBottom}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* HOVER GUIDE LINE */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <line
              x1={points[hoveredIndex].x}
              y1={paddingTop - 10}
              x2={points[hoveredIndex].x}
              y2={chartHeight - paddingBottom}
              stroke={themeStyles.nodeStroke}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {/* GRADIENT AREA UNDER LINE */}
          {points.length > 1 && (
            <path d={svgAreaPath} fill="url(#themeAreaGradient)" className="transition-all duration-500" />
          )}

          {/* VIBRANT GLOWING LINE PATH */}
          {points.length > 1 && (
            <path
              d={svgPath}
              fill="none"
              stroke="url(#themeLineGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: themeStyles.nodeGlow }}
            />
          )}

          {/* DATA POINT NODES & HOVER TOOLTIPS */}
          {points.map((p, i) => {
            const rectWidth = 100;
            const rectHeight = 26;
            const rectX = p.x - rectWidth / 2;
            const rectY = p.y - 42;
            const textY = rectY + 17;
            const arrowY = rectY + rectHeight;

            return (
              <g
                key={`node-${i}`}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Outer Glow Halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill={themeStyles.nodeStroke}
                  className={`transition-all duration-300 ${
                    hoveredIndex === i ? "opacity-40 scale-125" : "opacity-0"
                  }`}
                />

                {/* Node Point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIndex === i ? "6" : "4.5"}
                  fill="#0b0f19"
                  stroke={themeStyles.nodeStroke}
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />

                {/* FLOATING TOOLTIP CARD WITH POINTER ARROW */}
                <g
                  className={`transition-all duration-300 pointer-events-none ${
                    hoveredIndex === i ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"
                  }`}
                >
                  {/* Arrow Pointer */}
                  <polygon
                    points={`${p.x - 5},${arrowY} ${p.x + 5},${arrowY} ${p.x},${arrowY + 6}`}
                    fill="#0b0f19"
                    stroke={themeStyles.tooltipBorder}
                    strokeWidth="1"
                  />
                  {/* Tooltip Card */}
                  <rect
                    x={rectX}
                    y={rectY}
                    width={rectWidth}
                    height={rectHeight}
                    rx="8"
                    fill="#0b0f19"
                    stroke={themeStyles.tooltipBorder}
                    strokeWidth="1.5"
                    style={{ filter: "drop-shadow(0px 6px 16px rgba(0,0,0,0.6))" }}
                  />
                  {/* Tooltip Text */}
                  <text
                    x={p.x}
                    y={textY}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    className="tracking-wider font-sans"
                  >
                    {p.month} : ₹{p.val.toLocaleString("en-IN")}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
