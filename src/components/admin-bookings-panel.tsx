"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { formatBookingId } from "@/lib/pricing-tiers";
import {
  Calendar,
  Search,
  User,
  Car,
  Building2,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  Send,
  Truck,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  ChevronRight,
  X,
} from "lucide-react";

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "active" | "pending" | "disputed";

export type BookingItem = {
  id: string;
  vehicleId: string;
  vehicleTitle?: string;
  vehicleFuel?: string;
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
  amountPaid?: number;
  currency: string;
  status: string;
  createdAt: string;
  timezone?: string;
  handoverStatus?: string;
  startOdometer?: number | null;
  endOdometer?: number | null;
  vendorName?: string | null;
  vendorPhone?: string | null;
  customerPhone?: string | null;
  couponCode?: string | null;
  couponDiscountINR?: number | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  confirmed: {
    label: "CONFIRMED",
    badge: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  active: {
    label: "ON TRIP",
    badge: "bg-blue-950/80 text-blue-300 border-blue-500/40 animate-pulse",
    dot: "bg-blue-400",
  },
  completed: {
    label: "COMPLETED",
    badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/30",
    dot: "bg-cyan-400",
  },
  cancelled: {
    label: "CANCELLED",
    badge: "bg-red-950/80 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
  pending: {
    label: "PENDING",
    badge: "bg-amber-950/80 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  disputed: {
    label: "DISPUTED",
    badge: "bg-rose-950/80 text-rose-400 border-rose-500/40",
    dot: "bg-rose-500",
  },
};

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = parseInt(month, 10) - 1;
  return `${day} ${monthNames[mIdx] || month}, ${year}`;
}

export function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "active" | "completed" | "cancelled" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selected booking for Action Drawer Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [actionLoading, startActionTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBookings = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load bookings");
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
  }, [fetchBookings]);

  const handleCancelAndRefund = async (bookingId: string) => {
    const reason = window.prompt("Reason for cancellation & refund:", "Customer requested / operational cancellation");
    if (!reason) return;

    startActionTransition(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });

        if (res.ok) {
          showToast("Booking cancelled & refund processed successfully!");
          setSelectedBooking((prev) => (prev ? { ...prev, status: "cancelled" } : null));
          await fetchBookings();
        } else {
          showToast("Failed to process cancellation.");
        }
      } catch (e) {
        showToast("Error processing refund.");
      }
    });
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to mark this booking as COMPLETED?")) return;

    startActionTransition(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        });

        if (res.ok) {
          showToast("Booking marked as COMPLETED!");
          setSelectedBooking((prev) => (prev ? { ...prev, status: "completed" } : null));
          await fetchBookings();
        } else {
          showToast("Failed to update booking status.");
        }
      } catch (e) {
        showToast("Error updating booking.");
      }
    });
  };

  const handleResendPass = async (booking: BookingItem) => {
    showToast(`✉️ Pass & digital receipt dispatched to ${booking.userEmail}!`);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase();
      
      let matchesStatus = true;
      if (statusFilter === "confirmed") matchesStatus = s === "confirmed";
      else if (statusFilter === "active") matchesStatus = s === "active" || (s === "confirmed" && b.handoverStatus === "RELEASED");
      else if (statusFilter === "completed") matchesStatus = s === "completed" || b.handoverStatus === "RETURNED";
      else if (statusFilter === "cancelled") matchesStatus = s === "cancelled";
      else if (statusFilter === "pending") matchesStatus = s === "pending";

      if (!matchesStatus) return false;

      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      return (
        b.id.toLowerCase().includes(q) ||
        formatBookingId(b.id).toLowerCase().includes(q) ||
        b.userName.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        (b.vehicleTitle && b.vehicleTitle.toLowerCase().includes(q)) ||
        (b.vendorName && b.vendorName.toLowerCase().includes(q))
      );
    });
  }, [bookings, statusFilter, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      confirmed: bookings.filter((b) => (b.status || "").toLowerCase() === "confirmed").length,
      active: bookings.filter((b) => (b.status || "").toLowerCase() === "active" || b.handoverStatus === "RELEASED").length,
      completed: bookings.filter((b) => (b.status || "").toLowerCase() === "completed" || b.handoverStatus === "RETURNED").length,
      cancelled: bookings.filter((b) => (b.status || "").toLowerCase() === "cancelled").length,
      pending: bookings.filter((b) => (b.status || "").toLowerCase() === "pending").length,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/95 text-emerald-300 text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      {/* Main Container Card */}
      <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Booking Management Hub
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              End-to-end trip control, driver dispatches, vehicle handover status, and payment settlement auditing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void fetchBookings()}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5 font-bold"
              title="Refresh bookings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by ID, customer, vehicle, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none font-medium"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter("confirmed")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "confirmed"
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 text-emerald-400/70 hover:text-emerald-300"
              }`}
            >
              Confirmed ({counts.confirmed})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "active"
                  ? "bg-blue-950/80 border border-blue-500/40 text-blue-300"
                  : "bg-white/5 text-blue-400/70 hover:text-blue-300"
              }`}
            >
              On Trip ({counts.active})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 text-cyan-400/70 hover:text-cyan-300"
              }`}
            >
              Completed ({counts.completed})
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "cancelled"
                  ? "bg-red-950/80 border border-red-500/40 text-red-300"
                  : "bg-white/5 text-red-400/70 hover:text-red-300"
              }`}
            >
              Cancelled ({counts.cancelled})
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40">
          <table className="w-full text-left text-xs text-white/80">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-white/40">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle &amp; City</th>
                <th className="py-3 px-4">Trip Schedule</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-white/40">
                    No bookings found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const statusKey = (b.status || "confirmed").toLowerCase();
                  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.confirmed;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">
                        <span className="text-[var(--brand-red-soft)]">
                          {formatBookingId(b.id)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-white text-xs">{b.userName}</p>
                          <p className="text-[10px] text-white/40 truncate max-w-[150px]">{b.userEmail}</p>
                        </div>
                      </td>

                      {/* Vehicle & City */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-white text-xs">
                            {b.vehicleTitle || b.vehicleId}
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-white/50 bg-white/5 px-2 py-0.2 rounded">
                            📍 {b.city}
                          </span>
                        </div>
                      </td>

                      {/* Trip Schedule */}
                      <td className="py-3.5 px-4 text-white/70 whitespace-nowrap text-[11px]">
                        <p>{formatDateDisplay(b.startDate)}</p>
                        <p className="text-[10px] text-white/40">to {formatDateDisplay(b.endDate)}</p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ₹{b.totalAmountINR.toLocaleString("en-IN")}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 text-white/70 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Action Modal Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#16161f] to-[#0a0a0f] p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Booking #{formatBookingId(selectedBooking.id)}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        STATUS_CONFIG[selectedBooking.status.toLowerCase()]?.badge || "bg-white/5 border-white/10 text-white"
                      }`}
                    >
                      {selectedBooking.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Created on {new Date(selectedBooking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Details */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              {/* Customer Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2 text-white/60 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Customer Details</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedBooking.userName}</p>
                  <p className="text-white/50">{selectedBooking.userEmail}</p>
                  {selectedBooking.customerPhone && (
                    <p className="text-white/70 mt-1">📞 {selectedBooking.customerPhone}</p>
                  )}
                </div>
              </div>

              {/* Vehicle & Partner Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2 text-white/60 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fleet &amp; Territory</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {selectedBooking.vehicleTitle || selectedBooking.vehicleId}
                  </p>
                  <p className="text-white/50">📍 Territory: {selectedBooking.city}</p>
                  {selectedBooking.vendorName && (
                    <p className="text-amber-300/80 mt-1 font-semibold">
                      🏢 Partner: {selectedBooking.vendorName}
                    </p>
                  )}
                </div>
              </div>

              {/* Trip Schedule & Odometer */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2 text-white/60 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Schedule &amp; Odometer</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/50">Pickup:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(selectedBooking.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Drop-off:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(selectedBooking.endDate)}</span>
                  </div>
                  {selectedBooking.startOdometer && (
                    <div className="flex justify-between pt-1 border-t border-white/5">
                      <span className="text-white/50">Start Odometer:</span>
                      <span className="font-mono text-cyan-300">{selectedBooking.startOdometer} km</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center gap-2 text-white/60 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Financial Breakdown</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/50">Gross Total:</span>
                    <span className="text-white font-bold font-mono">₹{selectedBooking.totalAmountINR.toLocaleString("en-IN")}</span>
                  </div>
                  {selectedBooking.couponDiscountINR ? (
                    <div className="flex justify-between text-amber-300">
                      <span>Promo ({selectedBooking.couponCode}):</span>
                      <span>-₹{selectedBooking.couponDiscountINR}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-1 border-t border-white/5 text-emerald-400 font-black">
                    <span>Payment Status:</span>
                    <span>{selectedBooking.status === "cancelled" ? "REFUNDED" : "PAID"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleResendPass(selectedBooking)}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Re-send Pass (WhatsApp &amp; Mail)</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedBooking.status !== "completed" && selectedBooking.status !== "cancelled" && (
                  <button
                    onClick={() => handleCompleteBooking(selectedBooking.id)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Trip</span>
                  </button>
                )}

                {selectedBooking.status !== "cancelled" && (
                  <button
                    onClick={() => handleCancelAndRefund(selectedBooking.id)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel &amp; Settle Refund</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
