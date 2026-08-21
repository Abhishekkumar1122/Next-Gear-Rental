"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type BookingStatus = "confirmed" | "completed" | "cancelled";

type BookingItem = {
  id: string;
  status: "confirmed" | "completed" | "cancelled";
};

export function AdminActionPanel() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [status, setStatus] = useState<BookingStatus>("completed");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBookings = useCallback(async () => {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setBookings(data.bookings ?? []);
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const total = bookings.length;
  const confirmed = bookings.filter((item) => item.status === "confirmed").length;
  const cancelled = bookings.filter((item) => item.status === "cancelled").length;

  async function runAction() {
    if (!bookingId.trim()) {
      setMessage("Enter a booking ID.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const endpoint = status === "cancelled" ? `/api/bookings/${bookingId.trim()}/cancel` : `/api/bookings/${bookingId.trim()}/status`;
      const body = status === "cancelled" ? { reason: "Cancelled by admin panel" } : { status };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Action failed");
      }

      setMessage(`Action applied: ${status.toUpperCase()} on ${bookingId.trim()}`);
      await fetchBookings();
      setBookingId("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function simulateWebhook(provider: string) {
    setSimulating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/webhooks/requeue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          eventType: "payment.success"
        }),
      });

      if (res.ok) {
        setMessage(`Success: Simulated incoming ${provider} webhook requeued.`);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Simulation trigger failed");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="space-y-5 text-white select-none">
      <div className="grid gap-3 grid-cols-3">
        <StatCard label="Total Bookings" value={String(total)} />
        <StatCard label="Confirmed" value={String(confirmed)} />
        <StatCard label="Cancelled" value={String(cancelled)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Navigation Shortcuts */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">Quick Navigation Shortcuts</p>
            <p className="text-[10px] text-white/50 leading-relaxed mt-1">Jump to other control desks in Next Gear administration.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] uppercase font-black tracking-wider">
            <Link href="/dashboard/admin?section=approvals" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3 py-2 transition duration-300">Approvals</Link>
            <Link href="/dashboard/admin?section=support" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3 py-2 transition duration-300">Support</Link>
            <Link href="/dashboard/admin?section=finance" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 transition duration-300">Payments</Link>
            <Link href="/dashboard/admin?section=deliveries" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 transition duration-300">Deliveries</Link>
          </div>
        </div>

        {/* Override status controls */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">Trigger Booking Operations</p>
            <p className="text-[10px] text-white/50 leading-relaxed mt-1">Directly bypass API cycles to override booking statuses.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Booking ID (e.g., bk-12)"
              className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--brand-red)]"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--brand-red)]"
            >
              <option value="completed" className="bg-[#121212]">Mark Completed</option>
              <option value="confirmed" className="bg-[#121212]">Reopen as Confirmed</option>
              <option value="cancelled" className="bg-[#121212]">Cancel Booking</option>
            </select>
            <button
              onClick={() => void runAction()}
              disabled={loading}
              className="rounded-xl bg-[var(--brand-red)] hover:bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Applying..." : "Apply Action"}
            </button>
          </div>
        </div>

        {/* Webhook API Diagnostics Simulator */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">Mock Webhook Simulator</p>
            <p className="text-[10px] text-white/50 leading-relaxed mt-1">Simulate inbound callback events from gateways for operations diagnostics.</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => void simulateWebhook("STRIPE")}
              disabled={simulating}
              className="w-full text-center rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 py-2.5 text-[9px] uppercase font-black tracking-wider transition cursor-pointer text-white disabled:opacity-65"
            >
              Post Stripe Callback
            </button>
            <button
              onClick={() => void simulateWebhook("RAZORPAY")}
              disabled={simulating}
              className="w-full text-center rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 py-2.5 text-[9px] uppercase font-black tracking-wider transition cursor-pointer text-white disabled:opacity-65"
            >
              Post Razorpay Callback
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-2 text-[10px] font-bold text-white/80 animate-pulse">
          📋 Console Status: {message}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center hover:border-red-500/30 transition">
      <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
