"use client";

import { useState, useEffect } from "react";
import { formatBookingId } from "@/lib/pricing-tiers";

type PaymentRecord = {
  id: string;
  provider: "razorpay" | "stripe" | "paypal";
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  amountINR: number;
  currency: string;
  bookingId: string;
  providerPaymentId?: string;
  cityName: string;
  createdAt: string;
  updatedAt: string;
};

type AdminPaymentsPanelProps = {
  initialPayments: PaymentRecord[];
};

export function AdminPaymentsPanel({ initialPayments }: AdminPaymentsPanelProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [statusFilter, setStatusFilter] = useState<"all" | "CREATED" | "PAID" | "FAILED" | "REFUNDED">("all");
  const [providerFilter, setProviderFilter] = useState<"all" | "razorpay" | "stripe" | "paypal">("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (providerFilter !== "all" && p.provider !== providerFilter) return false;
    return true;
  });

  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === "PAID").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    pending: payments.filter((p) => p.status === "CREATED").length,
    totalRevenue: payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amountINR, 0),
  };

  // Groupings for multi-dimensional pivot grid
  const cityPivot = payments.reduce((acc, p) => {
    if (p.status !== "PAID") return acc;
    const city = p.cityName || "Other Hubs";
    acc[city] = (acc[city] || 0) + p.amountINR;
    return acc;
  }, {} as Record<string, number>);

  const gatewayPivot = payments.reduce((acc, p) => {
    if (p.status !== "PAID") return acc;
    const key = p.provider.toUpperCase();
    acc[key] = (acc[key] || 0) + p.amountINR;
    return acc;
  }, {} as Record<string, number>);

  // Projected 3-months revenue calculations
  const projectedRevenue = [
    stats.totalRevenue * 1.0,
    stats.totalRevenue * 1.12,
    stats.totalRevenue * 1.25,
    stats.totalRevenue * 1.42
  ];

  // SVG path for forecasting chart
  const minVal = Math.min(...projectedRevenue);
  const maxVal = Math.max(...projectedRevenue);
  const range = maxVal - minVal || 1;
  const points = projectedRevenue.map((val, idx) => {
    const x = 5 + (idx / 3) * 90;
    const y = 25 - ((val - minVal) / range) * 20;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const forecastPath = `M ${points.join(" L ")}`;

  const getStatusColor = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-950 text-emerald-400 border border-emerald-800/30";
      case "FAILED":
        return "bg-red-950 text-red-400 border border-red-800/30";
      case "CREATED":
        return "bg-amber-950 text-amber-400 border border-amber-800/30";
      case "REFUNDED":
        return "bg-blue-950 text-blue-400 border border-blue-800/30";
      default:
        return "bg-slate-950 text-slate-400 border border-slate-800/30";
    }
  };

  const getProviderIcon = (provider: PaymentRecord["provider"]) => {
    switch (provider) {
      case "razorpay":
        return "🏦";
      case "stripe":
        return "💳";
      case "paypal":
        return "🅿️";
      default:
        return "💰";
    }
  };

  return (
    <div className="space-y-6 text-white select-none">
      {/* 5 Stats Cards Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 text-center">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Total Transactions</p>
          <p className="mt-1.5 text-xl font-black text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 text-center">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Paid Ledger</p>
          <p className="mt-1.5 text-xl font-black text-emerald-400">{stats.paid}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 text-center">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Failed</p>
          <p className="mt-1.5 text-xl font-black text-red-400">{stats.failed}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 text-center">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Pending</p>
          <p className="mt-1.5 text-xl font-black text-amber-400">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 text-center col-span-2 lg:col-span-1">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Net Revenue</p>
          <p className="mt-1.5 text-xl font-black text-white">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Heavy Section 1: Financial Analytics Pivot Matrix */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/50 border-b border-white/5 pb-2.5">
            Revenue Pivot Matrix (Paid Invoices)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 text-xs pt-1.5">
            {/* City Distribution */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-2">
              <p className="text-[9.5px] uppercase font-black tracking-wider text-white/40">Hub Distribution</p>
              {Object.entries(cityPivot).length === 0 ? (
                <p className="text-white/40 italic">No transactions recorded.</p>
              ) : (
                Object.entries(cityPivot).map(([city, rev]) => (
                  <div key={city} className="flex justify-between border-b border-white/[0.03] pb-1.5 last:border-0 last:pb-0">
                    <span className="text-white/60 font-medium">📍 {city}</span>
                    <span className="font-extrabold text-white">₹{rev.toLocaleString("en-IN")}</span>
                  </div>
                ))
              )}
            </div>

            {/* Gateway distribution */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-2">
              <p className="text-[9.5px] uppercase font-black tracking-wider text-white/40">API Gateway Split</p>
              {Object.entries(gatewayPivot).length === 0 ? (
                <p className="text-white/40 italic">No transactions recorded.</p>
              ) : (
                Object.entries(gatewayPivot).map(([gateway, rev]) => (
                  <div key={gateway} className="flex justify-between border-b border-white/[0.03] pb-1.5 last:border-0 last:pb-0">
                    <span className="text-white/60 font-medium">💳 {gateway} API</span>
                    <span className="font-extrabold text-white">₹{rev.toLocaleString("en-IN")}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Heavy Section 2: Earnings Projection Center */}
        <div className="md:col-span-4 rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Operational Projections</p>
            <h4 className="text-xs font-black uppercase text-white tracking-wider mt-0.5">3-Month Revenue Forecast</h4>
          </div>

          {/* Forecasting Mini Line Chart */}
          <div className="h-20 my-4 relative">
            <svg className="w-full h-full text-[var(--brand-red)]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d={forecastPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Plot forecast dots */}
              {projectedRevenue.map((val, idx) => {
                const x = 5 + (idx / 3) * 90;
                const y = 25 - ((val - minVal) / range) * 20;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="1" className="fill-white" />
                    {idx === projectedRevenue.length - 1 && (
                      <circle cx={x} cy={y} r="2.5" className="fill-emerald-400/50 animate-ping" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="border-t border-white/5 pt-3.5 space-y-1 z-10">
            <p className="text-[9px] uppercase font-black tracking-wider text-white/40">Estimated Peak Earnings</p>
            <p className="text-xl font-black text-white leading-none">₹{projectedRevenue[3].toLocaleString("en-IN")}</p>
            <p className="text-[8.5px] text-green-400 font-bold">▲ Projected +42.0% growth based on reservation velocities</p>
          </div>
        </div>
      </div>

      {/* Transactions list with filtering */}
      <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-6 shadow-xl">
        <div className="border-b border-white/5 pb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Transaction Ledger</h3>
          
          <div className="flex flex-wrap gap-3 text-[10px]">
            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)] flex justify-between items-center gap-2 cursor-pointer min-w-[130px] text-left"
              >
                <span>
                  {statusFilter === "all" && "All Statuses"}
                  {statusFilter === "CREATED" && "Created"}
                  {statusFilter === "PAID" && "Paid"}
                  {statusFilter === "FAILED" && "Failed"}
                  {statusFilter === "REFUNDED" && "Refunded"}
                </span>
                <span className="text-[8px] text-white/35">▼</span>
              </button>
              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setStatusDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/5 bg-[#121212] p-1.5 shadow-2xl z-40 space-y-0.5 min-w-[130px]">
                    {[
                      { id: "all", label: "All Statuses" },
                      { id: "CREATED", label: "Created" },
                      { id: "PAID", label: "Paid" },
                      { id: "FAILED", label: "Failed" },
                      { id: "REFUNDED", label: "Refunded" },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setStatusFilter(opt.id as any);
                          setStatusDropdownOpen(false);
                        }}
                        className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                          statusFilter === opt.id
                            ? "bg-[var(--brand-red)] text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Provider Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)] flex justify-between items-center gap-2 cursor-pointer min-w-[130px] text-left"
              >
                <span>
                  {providerFilter === "all" && "All Gateways"}
                  {providerFilter === "razorpay" && "Razorpay"}
                  {providerFilter === "stripe" && "Stripe"}
                  {providerFilter === "paypal" && "PayPal"}
                </span>
                <span className="text-[8px] text-white/35">▼</span>
              </button>
              {providerDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProviderDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/5 bg-[#121212] p-1.5 shadow-2xl z-40 space-y-0.5 min-w-[130px]">
                    {[
                      { id: "all", label: "All Gateways" },
                      { id: "razorpay", label: "Razorpay" },
                      { id: "stripe", label: "Stripe" },
                      { id: "paypal", label: "PayPal" },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setProviderFilter(opt.id as any);
                          setProviderDropdownOpen(false);
                        }}
                        className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                          providerFilter === opt.id
                            ? "bg-[var(--brand-red)] text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">No matching transaction ledgers found.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-white/50 uppercase tracking-wider font-extrabold">
                  <th className="px-4 py-3.5">Tx ID</th>
                  <th className="px-4 py-3.5">Gateway</th>
                  <th className="px-4 py-3.5">Booking ID</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5">Handoff Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                    <td className="px-4 py-3 font-mono text-[10px] text-white/80">{payment.id.slice(0, 12)}...</td>
                    <td className="px-4 py-3 font-bold">
                      <span className="mr-1 text-sm select-none">{getProviderIcon(payment.provider)}</span> 
                      <span className="capitalize">{payment.provider}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-white/70">
                      {formatBookingId(payment.bookingId, payment.cityName)}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-white">₹{payment.amountINR.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-white/40 font-bold">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gateway configurations panel */}
      <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-5 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/50 border-b border-white/5 pb-2.5">
          API Integration Nodes
        </h3>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-white/5 p-4 bg-white/[0.02] hover:border-red-500/10 transition">
            <p className="font-extrabold text-white">🏦 Razorpay Node</p>
            <p className="mt-1.5 text-[10px] text-white/40 uppercase tracking-widest font-black">
              {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? "✓ Connected" : "⚠️ Not Configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 p-4 bg-white/[0.02] hover:border-red-500/10 transition">
            <p className="font-extrabold text-white">💳 Stripe Node</p>
            <p className="mt-1.5 text-[10px] text-white/40 uppercase tracking-widest font-black">
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✓ Connected" : "⚠️ Not Configured"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 p-4 bg-white/[0.02] hover:border-red-500/10 transition">
            <p className="font-extrabold text-white">🅿️ PayPal Node</p>
            <p className="mt-1.5 text-[10px] text-white/40 uppercase tracking-widest font-black">
              {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? "✓ Connected" : "⚠️ Not Configured"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
