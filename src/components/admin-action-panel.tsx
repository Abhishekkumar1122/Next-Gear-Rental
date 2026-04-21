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

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Action Panel</h2>
        <span className="text-xs text-black/60">Fast admin operations</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatCard label="Total Bookings" value={String(total)} />
        <StatCard label="Confirmed" value={String(confirmed)} />
        <StatCard label="Cancelled" value={String(cancelled)} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4">
          <p className="text-sm font-semibold">Quick Navigation</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/dashboard/admin/approvals" className="rounded-full border border-black/15 px-3 py-1.5 hover:bg-black/[0.03]">Approvals</Link>
            <Link href="/dashboard/admin/support-tickets" className="rounded-full border border-black/15 px-3 py-1.5 hover:bg-black/[0.03]">Support</Link>
            <Link href="/dashboard/admin/payments" className="rounded-full border border-black/15 px-3 py-1.5 hover:bg-black/[0.03]">Payments</Link>
            <Link href="/dashboard/admin/deliveries" className="rounded-full border border-black/15 px-3 py-1.5 hover:bg-black/[0.03]">Deliveries</Link>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 p-4">
          <p className="text-sm font-semibold">Booking Action</p>
          <div className="mt-3 grid gap-2">
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Booking ID (e.g., bk-12)"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              <option value="completed">Mark Completed</option>
              <option value="confirmed">Reopen as Confirmed</option>
              <option value="cancelled">Cancel Booking</option>
            </select>
            <button
              onClick={() => void runAction()}
              disabled={loading}
              className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Applying..." : "Apply Action"}
            </button>
          </div>
          {message && <p className="mt-2 text-xs text-black/70">{message}</p>}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-3">
      <p className="text-xs uppercase tracking-wide text-black/50">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
