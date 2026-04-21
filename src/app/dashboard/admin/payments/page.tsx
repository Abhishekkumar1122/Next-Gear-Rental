"use client";

import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { useState, useEffect } from "react";

type PaymentRecord = {
  id: string;
  provider: "razorpay" | "stripe" | "paypal";
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  amountINR: number;
  currency: string;
  bookingId: string;
  providerPaymentId?: string;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentsDashboardPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "CREATED" | "PAID" | "FAILED" | "REFUNDED">("all");
  const [providerFilter, setProviderFilter] = useState<"all" | "razorpay" | "stripe" | "paypal">("all");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, providerFilter]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (providerFilter !== "all") params.append("provider", providerFilter);

      const response = await fetch(`/api/admin/finance/export?${params.toString()}`);
      if (response.ok) {
        const text = await response.text();
        // Parse CSV if needed, or just show mock data
        setPayments(mockPayments);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }

  const mockPayments: PaymentRecord[] = [
    {
      id: "pay-001",
      provider: "razorpay",
      status: "PAID",
      amountINR: 1899,
      currency: "INR",
      bookingId: "BK-1001",
      providerPaymentId: "pay_2a1b2c3d4e",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "pay-002",
      provider: "stripe",
      status: "PAID",
      amountINR: 2499,
      currency: "INR",
      bookingId: "BK-1002",
      providerPaymentId: "pi_1abc2def3ghi",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "pay-003",
      provider: "paypal",
      status: "PAID",
      amountINR: 1599,
      currency: "INR",
      bookingId: "BK-1003",
      providerPaymentId: "EC-57U43971KJ5234567",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: "pay-004",
      provider: "razorpay",
      status: "FAILED",
      amountINR: 1299,
      currency: "INR",
      bookingId: "BK-1004",
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: "pay-005",
      provider: "stripe",
      status: "CREATED",
      amountINR: 2099,
      currency: "INR",
      bookingId: "BK-1005",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const filteredPayments = mockPayments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (providerFilter !== "all" && p.provider !== providerFilter) return false;
    return true;
  });

  const stats = {
    total: mockPayments.length,
    paid: mockPayments.filter((p) => p.status === "PAID").length,
    failed: mockPayments.filter((p) => p.status === "FAILED").length,
    pending: mockPayments.filter((p) => p.status === "CREATED").length,
    totalRevenue: mockPayments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amountINR, 0),
  };

  const getStatusColor = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CREATED":
        return "bg-yellow-100 text-yellow-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <PageShell title="Payments Dashboard" subtitle="Monitor all payment transactions and settlements">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/admin" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
          ← Admin Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Total Transactions</p>
          <p className="mt-2 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-black/60">Paid</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{stats.paid}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-black/60">Failed</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{stats.failed}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs text-black/60">Pending</p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Revenue</p>
          <p className="mt-2 text-2xl font-bold">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Transaction Filters</h2>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex gap-2">
            <p className="text-xs font-semibold text-black/60">Status:</p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="all">All</option>
              <option value="CREATED">Created</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <div className="flex gap-2">
            <p className="text-xs font-semibold text-black/60">Provider:</p>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as any)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="all">All</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Transactions ({filteredPayments.length})</p>
          {filteredPayments.length === 0 ? (
            <p className="text-sm text-black/60">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full text-sm">
                <thead className="border-b border-black/10 bg-black/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Provider</th>
                    <th className="px-4 py-3 text-left font-semibold">Booking</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-black/5 hover:bg-black/[0.01]">
                      <td className="px-4 py-3 font-mono text-xs">{payment.id}</td>
                      <td className="px-4 py-3">
                        <span className="text-lg">{getProviderIcon(payment.provider)}</span> {payment.provider}
                      </td>
                      <td className="px-4 py-3 font-mono">{payment.bookingId}</td>
                      <td className="px-4 py-3 text-right font-semibold">₹{payment.amountINR.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black/60">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Payment Gateway Configuration</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 p-4 bg-black/[0.02]">
            <p className="text-sm font-semibold">🏦 Razorpay</p>
            <p className="mt-2 text-xs text-black/60">
              {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? "✓ Connected" : "⚠️ Not configured"}
            </p>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/[0.02]">
            <p className="text-sm font-semibold">💳 Stripe</p>
            <p className="mt-2 text-xs text-black/60">
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✓ Connected" : "⚠️ Not configured"}
            </p>
          </div>
          <div className="rounded-lg border border-black/10 p-4 bg-black/[0.02]">
            <p className="text-sm font-semibold">🅿️ PayPal</p>
            <p className="mt-2 text-xs text-black/60">
              {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? "✓ Connected" : "⚠️ Not configured"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="font-semibold text-blue-900">Setup Instructions</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-blue-800">
            <li>Add environment variables for each gateway in .env.local</li>
            <li>Set up webhooks in each gateway dashboard</li>
            <li>Razorpay webhooks: /api/payments/webhooks/razorpay</li>
            <li>Stripe webhooks: /api/payments/webhooks/stripe</li>
            <li>PayPal webhooks: /api/payments/webhooks/paypal</li>
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
