"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBookingId } from "@/lib/pricing-tiers";

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
  confirmed: "bg-emerald-950 text-emerald-400 border border-emerald-800/30",
  cancelled: "bg-red-950 text-red-400 border border-red-800/30",
  completed: "bg-cyan-950 text-cyan-400 border border-cyan-800/30",
};

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const mIdx = parseInt(month, 10) - 1;
  return `${day} ${monthNames[mIdx] || month}, ${year}`;
}

function formatTimeDisplay(timeStr?: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${ampm}`;
}

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
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchTerm(searchParam);
      }
    }

    const timer = setInterval(() => {
      void fetchBookings();
    }, 15000);

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
    const confirm = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirm) return;

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
    const confirm = window.confirm("Are you sure you want to mark this booking as completed?");
    if (!confirm) return;

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
    <div className="space-y-5 text-white">
      {/* Metrics Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Bookings" value={stats.total} />
        <StatTile label="Confirmed" value={stats.confirmed} />
        <StatTile label="Cancelled" value={stats.cancelled} />
        <StatTile label="Completed" value={stats.completed} />
      </div>

      {/* Filter Row */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_180px_auto] text-xs">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search bookings by ID, customer name, email, or city..."
          className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | BookingStatus)}
          className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        >
          <option value="all" className="bg-[#121212]">All Statuses</option>
          <option value="confirmed" className="bg-[#121212]">Confirmed</option>
          <option value="cancelled" className="bg-[#121212]">Cancelled</option>
          <option value="completed" className="bg-[#121212]">Completed</option>
        </select>
        <button
          onClick={() => void fetchBookings()}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 font-bold uppercase tracking-wider text-white transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/25 px-4 py-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* List / Cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 text-center text-xs text-white/50">
          No bookings found matching filters.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition duration-300">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <p className="font-extrabold text-white text-sm">
                    Booking: {formatBookingId(item.id, item.city)}
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {item.userName} · <span className="text-white/40">{item.userEmail}</span>
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border ${STATUS_BADGES[item.status]}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-3.5 grid gap-2.5 text-xs text-white/70 sm:grid-cols-2">
                <p>📍 Location Hub: <span className="font-bold text-white">{item.city}</span></p>
                <p>🏍️ Assigned Vehicle: <span className="font-mono text-white/95">{item.vehicleId}</span></p>
                <p className="sm:col-span-2">
                  📅 Rental Period: <span className="font-bold text-white">{formatDateDisplay(item.startDate)} {item.startTime ? `(${formatTimeDisplay(item.startTime)})` : ""}</span> ➔ <span className="font-bold text-white">{formatDateDisplay(item.endDate)} {item.endTime ? `(${formatTimeDisplay(item.endTime)})` : ""}</span>
                </p>
                <p className="sm:col-span-2 font-extrabold text-white">
                  💰 Total Paid: ₹{item.totalAmountINR.toLocaleString("en-IN")} <span className="text-[10px] text-white/40">{item.currency}</span>
                </p>
              </div>

              <div className="mt-4.5 pt-3.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.status === "confirmed" ? (
                    <>
                      <button
                        onClick={() => void markCompleted(item.id)}
                        disabled={completingId === item.id}
                        className="rounded-full border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-950/40 transition cursor-pointer"
                      >
                        {completingId === item.id ? "Completing..." : "Complete Ride"}
                      </button>
                      <button
                        onClick={() => void cancelBooking(item.id)}
                        disabled={cancellingId === item.id}
                        className="rounded-full border border-red-500/30 bg-red-950/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                      >
                        {cancellingId === item.id ? "Cancelling..." : "Cancel Ride"}
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider">Historical Record</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Log Created: {new Date(item.createdAt).toLocaleString()}
                </span>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center hover:border-red-500/20 transition">
      <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
