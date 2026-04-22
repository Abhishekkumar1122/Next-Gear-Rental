"use client";

import { useState } from "react";
import { CustomerBookingsPanel } from "@/components/customer-bookings-panel";
import { CustomerWaitlistPanel } from "@/components/customer-waitlist-panel";
import { CustomerKycAutomationPanel } from "@/components/customer-kyc-automation-panel";
import { CustomerDamageChecklistPanel } from "@/components/customer-damage-checklist-panel";
import { ReturnTrackingPanel } from "@/components/return-tracking-panel";
import Link from "next/link";

type Tab = "bookings" | "payments" | "kyc" | "damage" | "waitlist" | "tracking" | "returns" | "support";

type Booking = {
  id: string;
  vehicleId: string;
  userName: string;
  userEmail: string;
  city: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  currency: string;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "bookings", label: "My Bookings", icon: "🏍️" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "kyc", label: "KYC", icon: "🪪" },
  { id: "damage", label: "Damage Checks", icon: "🛠️" },
  { id: "waitlist", label: "Waitlist", icon: "⏳" },
  { id: "tracking", label: "Tracking", icon: "📍" },
  { id: "returns", label: "Returns", icon: "↩️" },
  { id: "support", label: "Support", icon: "💬" },
];

export function CustomerDashboardClient({ email, name, initialBookings = [] }: { email: string; name: string; initialBookings?: Booking[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-black/50">Customer Dashboard</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold">
              Welcome back, <span className="capitalize">{name}</span> 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-black/60 break-all">{email}</p>
          </div>
          <Link
            href="/vehicles"
            className="w-full sm:w-auto rounded-full bg-[var(--brand-red)] px-4 sm:px-5 py-2.5 text-sm font-semibold text-white text-center shadow-lg shadow-red-500/30 transition hover:scale-105"
          >
            + Book Vehicle
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 rounded-2xl border border-black/10 bg-white p-1 shadow-sm md:p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-shrink-0 items-center justify-center gap-1 sm:gap-2 rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-500/20"
                : "text-black/60 hover:bg-black/5 hover:text-black"
            }`}
          >
            <span className="text-sm sm:text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm min-h-[300px] md:p-6">
        {activeTab === "bookings" && (
          <div>
            <div className="mb-4 md:mb-5">
              <h2 className="text-lg md:text-xl font-bold">My Bookings</h2>
              <p className="mt-0.5 text-xs md:text-sm text-black/60">
                All your bookings appear here in real-time. Cancel any confirmed booking directly.
              </p>
            </div>
            <CustomerBookingsPanel userEmail={email} initialBookings={initialBookings} />
          </div>
        )}

        {activeTab === "payments" && (
          <PaymentsTab email={email} />
        )}

        {activeTab === "kyc" && (
          <CustomerKycAutomationPanel userEmail={email} defaultName={name} />
        )}

        {activeTab === "damage" && (
          <CustomerDamageChecklistPanel userEmail={email} />
        )}

        {activeTab === "tracking" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Delivery Tracking</h2>
            <p className="text-sm text-black/60">Track live pickup and drop-off for your active bookings.</p>
            <Link
              href="/dashboard/customer/tracking"
              className="inline-flex items-center gap-2 rounded-xl bg-black/5 border border-black/10 px-4 py-3 text-sm font-medium text-black transition hover:bg-black/10"
            >
              📍 Open Live Tracking →
            </Link>
          </div>
        )}

        {activeTab === "returns" && (
          <ReturnsTab email={email} />
        )}

        {activeTab === "waitlist" && (
          <CustomerWaitlistPanel userEmail={email} />
        )}

        {activeTab === "support" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Support Center</h2>
            <p className="text-sm text-black/60">Raise tickets, track issues, and chat with support.</p>
            <Link
              href="/dashboard/customer/support"
              className="inline-flex items-center gap-2 rounded-xl bg-black/5 border border-black/10 px-4 py-3 text-sm font-medium text-black transition hover:bg-black/10"
            >
              💬 Open Support Center →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentsTab({ email }: { email: string }) {
  const [items, setItems] = useState<
    { id: string; provider: string; status: string; amountINR: number; currency: string; bookingId: string; cityName: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // Try to get bookings and build a payment summary from them
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const bookings = data.bookings ?? [];
      setItems(
        bookings.map((b: { id: string; totalAmountINR: number; currency: string; city: string; status: string }) => ({
          id: `pay-${b.id}`,
          provider: "Razorpay",
          status: b.status === "cancelled" ? "REFUNDED" : "PAID",
          amountINR: b.totalAmountINR,
          currency: b.currency,
          bookingId: b.id,
          cityName: b.city,
        })),
      );
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    PAID: "text-green-700 bg-green-50 border-green-200",
    REFUNDED: "text-orange-700 bg-orange-50 border-orange-200",
    FAILED: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold">Payment History</h2>
          <p className="text-xs md:text-sm text-black/60 mt-1">All payments and refunds linked to your bookings.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-black/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition hover:bg-black/5 disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? "Loading..." : loaded ? "↻ Refresh" : "Load Payments"}
        </button>
      </div>

      {!loaded && !loading && (
        <div className="rounded-xl border border-dashed border-black/15 p-4 md:p-6 text-center text-xs md:text-sm text-black/50">
          Click &quot;Load Payments&quot; to view payment history.
        </div>
      )}

      {loaded && items.length === 0 && (
        <p className="text-xs md:text-sm text-black/60">No payment records found.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-black/10 p-3 md:p-4 text-xs md:text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-black">{item.provider}</p>
              <p className="text-xs text-black/50 break-all">Booking: {item.bookingId} · {item.cityName}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="font-bold text-black whitespace-nowrap">₹{item.amountINR.toLocaleString("en-IN")}</p>
              <span className={`rounded-full border px-2 sm:px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusColor[item.status] ?? "bg-black/5 text-black"}`}>
                {item.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReturnsTab({ email }: { email: string }) {
  const [bookings, setBookings] = useState<
    { id: string; endDate: string; status: string; city: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const bookings = data.bookings ?? [];
      setBookings(bookings);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold">Return Requests</h2>
          <p className="text-xs md:text-sm text-black/60 mt-1">Track bike returns, damage assessments, and refund status.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-black/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition hover:bg-black/5 disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? "Loading..." : loaded ? "↻ Refresh" : "Load Returns"}
        </button>
      </div>

      {!loaded && !loading && (
        <div className="rounded-xl border border-dashed border-black/15 p-4 md:p-6 text-center text-xs md:text-sm text-black/50">
          Click &quot;Load Returns&quot; to view your return requests.
        </div>
      )}

      {loaded && bookings.length === 0 && (
        <p className="text-xs md:text-sm text-black/60">No bookings found. Book a bike first to initiate returns.</p>
      )}

      {loaded && bookings.map((booking) => (
        <div key={booking.id} className="rounded-xl border border-black/10 overflow-hidden">
          <ReturnTrackingPanel
            bookingId={booking.id}
            customerName={email.split("@")[0]}
          />
        </div>
      ))}
    </div>
  );
}
