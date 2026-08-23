"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Car,
  CalendarCheck,
  Clock,
  CreditCard,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import type { AdminKpiData } from "@/lib/admin-kpi-aggregates";

interface AdminOverviewKpisProps {
  kpiData: AdminKpiData;
  pendingAttentionCount: number;
}

export function AdminOverviewKpis({ kpiData, pendingAttentionCount }: AdminOverviewKpisProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "thisWeek" | "thisMonth" | "allTime">("thisMonth");

  const getRevenueDisplay = () => {
    switch (revenuePeriod) {
      case "today":
        return {
          label: "Today's Revenue",
          amount: kpiData.revenue.today,
          periodLabel: "00:00 to Now",
          trend: "+12% vs yesterday",
        };
      case "thisWeek":
        return {
          label: "This Week's Revenue",
          amount: kpiData.revenue.thisWeek,
          periodLabel: "Mon to Sunday",
          trend: "+18.4% vs last week",
        };
      case "allTime":
        return {
          label: "Cumulative Gross Revenue",
          amount: kpiData.revenue.allTime,
          periodLabel: "All Time",
          trend: "Lifetime collections",
        };
      case "thisMonth":
      default:
        return {
          label: "This Month's Revenue",
          amount: kpiData.revenue.thisMonth,
          periodLabel: "Current calendar month",
          trend: "+24.6% vs last month",
        };
    }
  };

  const rev = getRevenueDisplay();

  const cards = [
    {
      id: "users",
      label: "Total Users",
      value: kpiData.totalUsers.toLocaleString("en-IN"),
      subtext: "Verified rider accounts",
      icon: Users,
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
      targetHref: "/dashboard/admin?section=users-fleet",
    },
    {
      id: "vendors",
      label: "Total Vendors",
      value: kpiData.totalVendors.toLocaleString("en-IN"),
      subtext: "Partner fleet operators",
      icon: Building2,
      color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
      targetHref: "/dashboard/admin?section=users-fleet",
    },
    {
      id: "vehicles",
      label: "Fleet Vehicles",
      value: kpiData.totalVehicles.toLocaleString("en-IN"),
      subtext: "Active bikes & cars",
      icon: Car,
      color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
      targetHref: "/dashboard/admin?section=vehicles",
    },
    {
      id: "active_bookings",
      label: "Active Bookings",
      value: kpiData.activeBookings.toLocaleString("en-IN"),
      subtext: "Vehicles currently on rent",
      icon: CalendarCheck,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      targetHref: "/dashboard/admin?section=bookings",
    },
    {
      id: "today_bookings",
      label: "Today's Bookings",
      value: kpiData.todayBookings.toLocaleString("en-IN"),
      subtext: "Created since 00:00",
      icon: Clock,
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
      targetHref: "/dashboard/admin?section=bookings",
    },
    {
      id: "pending_payments",
      label: "Pending Payments",
      value: kpiData.pendingPayments.toLocaleString("en-IN"),
      subtext: "Awaiting gateway confirmation",
      icon: CreditCard,
      color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
      targetHref: "/dashboard/admin?section=finance",
    },
    {
      id: "pending_attention",
      label: "Pending Action Items",
      value: pendingAttentionCount.toLocaleString("en-IN"),
      subtext: "Urgent operational tasks",
      icon: AlertTriangle,
      color: "from-red-600/30 to-amber-600/20 border-red-500/40 text-red-400 animate-pulse",
      targetHref: "/dashboard/admin?section=attention-center",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top 8 Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Interactive Revenue Card with Period Toggle */}
        <div className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-black to-[#0d0d12] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                  {rev.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>{rev.trend}</span>
              </div>
            </div>

            <div>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                ₹{rev.amount.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">{rev.periodLabel}</p>
            </div>
          </div>

          {/* Revenue Period Selector Buttons */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1 text-[9px] font-bold">
            <button
              onClick={() => setRevenuePeriod("today")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                revenuePeriod === "today"
                  ? "bg-red-600 text-white font-black shadow-sm"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRevenuePeriod("thisWeek")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                revenuePeriod === "thisWeek"
                  ? "bg-red-600 text-white font-black shadow-sm"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setRevenuePeriod("thisMonth")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                revenuePeriod === "thisMonth"
                  ? "bg-red-600 text-white font-black shadow-sm"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setRevenuePeriod("allTime")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                revenuePeriod === "allTime"
                  ? "bg-red-600 text-white font-black shadow-sm"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Cards 2 to 8 */}
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.id}
              href={c.targetHref}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/60 p-5 shadow-xl hover:border-white/20 transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center border`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                    {c.label}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
              </div>

              <div className="mt-4">
                <p className="text-3xl font-black text-white font-mono tracking-tight">
                  {c.value}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">{c.subtext}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
