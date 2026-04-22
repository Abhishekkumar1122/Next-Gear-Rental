"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
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
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
  timezone?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  confirmed: {
    label: "Confirmed",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

interface Props {
  userEmail: string;
  initialBookings?: Booking[];
}

export function CustomerBookingsPanel({ userEmail, initialBookings = [] }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState(initialBookings.length === 0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    // Only fetch if no initial bookings provided (data not pre-fetched on server)
    if (initialBookings.length === 0) {
      fetchBookings();
    }
  }, [fetchBookings, initialBookings.length]);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setMessage("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Customer requested cancellation" }),
      });
      if (res.ok) {
        setMessage(`Booking ${bookingId} cancelled. Refund will be processed within 5–7 business days.`);
        setConfirmCancel(null);
        setCancelReason("");
        await fetchBookings();
      } else {
        const d = await res.json();
        setMessage(d.error ?? "Cancellation failed. Please try again.");
      }
    } finally {
      setCancellingId(null);
    }
  }

  const active = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) => b.status !== "confirmed");

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-black/5" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center">
        <div className="text-4xl mb-3">🏍️</div>
        <p className="font-semibold text-black/70">No bookings yet</p>
        <p className="mt-1 text-sm text-black/50">Book a vehicle and it will appear here instantly.</p>
        <Link
          href="/vehicles"
          className="mt-4 inline-block rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white transition hover:scale-105"
        >
          Browse Vehicles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${message.includes("cancelled") ? "border-orange-200 bg-orange-50 text-orange-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Active bookings */}
      {active.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-black/50">
            Active ({active.length})
          </h3>
          <div className="space-y-3">
            {active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                confirmCancel={confirmCancel}
                setConfirmCancel={setConfirmCancel}
                cancelReason={cancelReason}
                setCancelReason={setCancelReason}
                cancellingId={cancellingId}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past bookings */}
      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-black/50">
            Past ({past.length})
          </h3>
          <div className="space-y-3">
            {past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                confirmCancel={confirmCancel}
                setConfirmCancel={setConfirmCancel}
                cancelReason={cancelReason}
                setCancelReason={setCancelReason}
                cancellingId={cancellingId}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={fetchBookings}
        className="w-full rounded-xl border border-black/10 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5"
      >
        ↻ Refresh bookings
      </button>
    </div>
  );
}

function BookingCard({
  booking,
  confirmCancel,
  setConfirmCancel,
  cancelReason,
  setCancelReason,
  cancellingId,
  onCancel,
}: {
  booking: Booking;
  confirmCancel: string | null;
  setConfirmCancel: (id: string | null) => void;
  cancelReason: string;
  setCancelReason: (r: string) => void;
  cancellingId: string | null;
  onCancel: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const nights =
    Math.max(
      1,
      Math.ceil(
        (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="font-mono text-xs text-black/40">{booking.id}</span>
          </div>
          <p className="mt-1.5 font-semibold text-black">
            📍 {booking.city}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[var(--brand-red)]">
            ₹{booking.totalAmountINR.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-black/50">{booking.currency}</p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-black/70 sm:grid-cols-3">
        <div>
          <span className="text-xs text-black/40">From</span>
          <p className="font-medium text-black">{booking.startDate}</p>
          {booking.startTime && <p className="text-xs">{booking.startTime}</p>}
        </div>
        <div>
          <span className="text-xs text-black/40">To</span>
          <p className="font-medium text-black">{booking.endDate}</p>
          {booking.endTime && <p className="text-xs">{booking.endTime}</p>}
        </div>
        <div>
          <span className="text-xs text-black/40">Duration</span>
          <p className="font-medium text-black">
            {booking.rentalHours ? `${booking.rentalHours} hrs` : `${nights} day${nights !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {booking.addons && booking.addons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {booking.addons.map((a) => (
            <span key={a} className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/60">
              + {a}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-black/40">
        Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>

      {/* Cancel action — only for confirmed bookings */}
      {booking.status === "confirmed" && (
        <div className="mt-4 border-t border-black/5 pt-4">
          {confirmCancel === booking.id ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Confirm cancellation?</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={2}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  {cancellingId === booking.id ? "Cancelling..." : "Yes, Cancel Booking"}
                </button>
                <button
                  onClick={() => { setConfirmCancel(null); setCancelReason(""); }}
                  className="flex-1 rounded-lg border border-black/10 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCancel(booking.id)}
              className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}

      {booking.status === "cancelled" && (
        <div className="mt-3 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-xs text-orange-700">
          ⚠️ This booking was cancelled. Refund (if applicable) will be processed within 5–7 business days.
        </div>
      )}
    </div>
  );
}
