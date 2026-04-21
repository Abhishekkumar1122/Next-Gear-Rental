"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BookingStatus = "confirmed" | "cancelled" | "completed";

type BookingItem = {
  id: string;
  vehicleId: string;
  userName: string;
  userEmail: string;
  city: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  rentalHours?: number;
  addons?: string[];
  totalAmountINR: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  timezone?: string;
};

const STATUS_BADGES: Record<BookingStatus, string> = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

export function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load bookings");
      }
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
    const timer = setInterval(() => {
      void fetchBookings();
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchBookings]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return bookings.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.id.toLowerCase().includes(query) ||
        item.userEmail.toLowerCase().includes(query) ||
        item.userName.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query)
      );
    });
  }, [bookings, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      completed: bookings.filter((b) => b.status === "completed").length,
    };
  }, [bookings]);

  async function cancelBooking(bookingId: string) {
    setCancellingId(bookingId);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by admin" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to cancel booking");
      }

      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  }

  async function markCompleted(bookingId: string) {
    setCompletingId(bookingId);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to mark booking completed");
      }

      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark booking completed");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Confirmed" value={stats.confirmed} />
        <StatTile label="Cancelled" value={stats.cancelled} />
        <StatTile label="Completed" value={stats.completed} />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search booking/customer/city"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | BookingStatus)}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() => void fetchBookings()}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.03]"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-lg bg-black/[0.05]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-3 text-sm text-black/60">No bookings found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">Booking {item.id}</p>
                  <p className="text-black/60">{item.userName} · {item.userEmail}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_BADGES[item.status]}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-2 grid gap-1 text-black/70 md:grid-cols-2">
                <p>City: {item.city}</p>
                <p>Vehicle: {item.vehicleId}</p>
                <p>Period: {item.startDate} → {item.endDate}</p>
                <p>Amount: ₹{item.totalAmountINR.toLocaleString("en-IN")} {item.currency}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.status === "confirmed" ? (
                  <>
                    <button
                      onClick={() => void markCompleted(item.id)}
                      disabled={completingId === item.id}
                      className="rounded border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                    >
                      {completingId === item.id ? "Completing..." : "Mark Completed"}
                    </button>
                    <button
                      onClick={() => void cancelBooking(item.id)}
                      disabled={cancellingId === item.id}
                      className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {cancellingId === item.id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-black/50">No actions</span>
                )}
                <span className="text-xs text-black/50">Created: {new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 p-3 text-sm">
      <p className="text-black/60">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
