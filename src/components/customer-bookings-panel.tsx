"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { downloadOfflinePass } from "@/lib/booking-pass-downloader";
import { formatBookingId } from "@/lib/pricing-tiers";
import { TripExtensionModal } from "@/components/trip-extension-modal";

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
  handoverStatus?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  confirmed: {
    label: "Confirmed",
    bg: "bg-green-50/10",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-50/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-50/10",
    text: "text-red-400",
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
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showQRBooking, setShowQRBooking] = useState<Booking | null>(null);
  const [extendingBooking, setExtendingBooking] = useState<Booking | null>(null);
  const [subTab, setSubTab] = useState<"active" | "past">("active");

  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await fetch("/api/vehicles");
        const data = await res.json();
        setVehicles(data.vehicles || []);
      } catch (err) {
        console.error("Failed to load vehicles mapping:", err);
      }
    }
    loadVehicles();
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(userEmail)}&_t=${Date.now()}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (initialBookings.length === 0) {
      fetchBookings();
    }
  }, [fetchBookings, initialBookings.length]);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setMessage("");
    const booking = bookings.find((b) => b.id === bookingId);
    const formattedId = formatBookingId(bookingId, booking?.city, booking?.startDate);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Customer requested cancellation" }),
      });
      if (res.ok) {
        setMessage(`Booking ${formattedId} cancelled. Refund will be processed within 5–7 business days.`);
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
      <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white bg-white/[0.01]">
        <div className="text-4xl mb-3">🏍️</div>
        <p className="font-semibold text-white/70">No bookings yet</p>
        <p className="mt-1 text-sm text-white/50">Book a vehicle and it will appear here instantly.</p>
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
    <div className="space-y-5 text-white">
      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${message.includes("cancelled") ? "border-orange-500/30 bg-orange-500/10 text-orange-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          {message}
        </div>
      )}

      <div className="flex gap-2 border-b border-white/5 pb-3">
        <button
          onClick={() => setSubTab("active")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all duration-200 cursor-pointer border-0 whitespace-nowrap ${
            subTab === "active"
              ? "bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white shadow-[0_4px_12px_rgba(225,29,72,0.2)]"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setSubTab("past")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all duration-200 cursor-pointer border-0 whitespace-nowrap ${
            subTab === "past"
              ? "bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white shadow-[0_4px_12px_rgba(225,29,72,0.2)]"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          Completed ({past.length})
        </button>
      </div>

      {subTab === "active" && (
        <div className="space-y-3">
          {active.length > 0 ? (
            active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                confirmCancel={confirmCancel}
                setConfirmCancel={setConfirmCancel}
                cancelReason={cancelReason}
                setCancelReason={setCancelReason}
                cancellingId={cancellingId}
                onCancel={handleCancel}
                vehicles={vehicles}
                onShowQR={setShowQRBooking}
                onExtend={setExtendingBooking}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white bg-white/[0.01]">
              <div className="text-4xl mb-2">🏍️</div>
              <p className="font-bold text-white/70 text-sm">No Active Bookings</p>
              <p className="mt-1 text-xs text-white/40">Book a vehicle and it will appear here instantly.</p>
              <Link
                href="/vehicles"
                className="mt-3.5 inline-block rounded-xl bg-[var(--brand-red)] px-4.5 py-2 text-xs font-bold text-white transition hover:scale-105"
              >
                Browse Vehicles
              </Link>
            </div>
          )}
        </div>
      )}

      {subTab === "past" && (
        <div className="space-y-3">
          {past.length > 0 ? (
            past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                confirmCancel={confirmCancel}
                setConfirmCancel={setConfirmCancel}
                cancelReason={cancelReason}
                setCancelReason={setCancelReason}
                cancellingId={cancellingId}
                onCancel={handleCancel}
                vehicles={vehicles}
                onShowQR={setShowQRBooking}
                onExtend={setExtendingBooking}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white bg-white/[0.01]">
              <div className="text-4xl mb-2">📁</div>
              <p className="font-bold text-white/70 text-sm">No Completed Rides</p>
              <p className="mt-1 text-xs text-white/40">You don't have any past or cancelled bookings yet.</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={fetchBookings}
        className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 bg-white/5 hover:bg-white/10 transition cursor-pointer border-0 mt-2"
      >
        ↻ Refresh Bookings
      </button>

      {extendingBooking && (
        <TripExtensionModal
          isOpen={Boolean(extendingBooking)}
          onClose={() => setExtendingBooking(null)}
          booking={extendingBooking}
          dailyRateINR={
            vehicles.find((v) => v.id === extendingBooking.vehicleId)?.pricePerDayINR || 1200
          }
          onExtensionSuccess={() => {
            fetchBookings();
            setMessage("🎉 Trip successfully extended! Updated pass & receipt have been generated.");
          }}
        />
      )}

      {showQRBooking && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center text-white shadow-2xl space-y-4 animate-[fade-up_0.3s_ease_forwards]">
            <h4 className="text-base font-extrabold tracking-wider uppercase text-white/95">
              {showQRBooking.handoverStatus === "RELEASED" ? "Return QR Code" : "Pickup QR Code"}
            </h4>
            <p className="text-xs text-white/60">
              {showQRBooking.handoverStatus === "RELEASED" 
                ? "Show this QR to the vendor when returning the vehicle."
                : "Show this QR to the vendor at the hub to pick up your ride."}
            </p>
            <div className="relative inline-block mx-auto bg-white p-4 rounded-2xl shadow-lg border-2 border-white/10">
              <img
                src={`https://quickchart.io/qr?text=${encodeURIComponent(`${window.location.origin}/dashboard/scan-booking?id=${showQRBooking.id}&source=qr`)}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=200&ecLevel=Q`}
                alt="Booking Handover QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
            <p className="text-[10px] font-mono text-white/40">ID: {formatBookingId(showQRBooking.id, showQRBooking.city, showQRBooking.startDate)}</p>
            <div className="pt-1 flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
                      `${window.location.origin}/dashboard/scan-booking?id=${showQRBooking.id}&source=qr`
                    )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=400&ecLevel=Q`;
                    
                    const qrImg = new Image();
                    qrImg.crossOrigin = "anonymous";
                    qrImg.src = qrUrl;
                    await new Promise((resolve) => { qrImg.onload = resolve; });
                    
                    const canvas = document.createElement("canvas");
                    canvas.width = 400;
                    canvas.height = 400;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.drawImage(qrImg, 0, 0, 400, 400);
                    
                    const dataUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `nextgear-booking-${showQRBooking.id}-qr.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (error) {
                    console.error("Failed to download QR Code:", error);
                    window.open(`https://quickchart.io/qr?text=${encodeURIComponent(
                      `${window.location.origin}/dashboard/scan-booking?id=${showQRBooking.id}`
                    )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=400&ecLevel=Q`, "_blank");
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>📥</span> QR
              </button>
              <button
                onClick={() => {
                  const formattedVehicleTitle = showQRBooking.vehicleId
                    .split("-")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                  const isCar = showQRBooking.vehicleId.toLowerCase().includes("car");
                  const rentalDaysVal = showQRBooking.rentalHours
                    ? undefined
                    : Math.max(1, Math.ceil((new Date(showQRBooking.endDate).getTime() - new Date(showQRBooking.startDate).getTime()) / (1000 * 60 * 60 * 24)));

                  const vehicleObj = vehicles.find(v => v.id === showQRBooking.vehicleId);
                  const vehicleImg = vehicleObj?.imageUrls?.[0] || "";
                  const vehicleTitleVal = vehicleObj?.title || formattedVehicleTitle;

                  void downloadOfflinePass({
                    id: showQRBooking.id,
                    customerName: showQRBooking.userName,
                    customerPhone: (showQRBooking as any).customerPhone || "Verified User",
                    vehicleTitle: vehicleTitleVal,
                    cityName: showQRBooking.city,
                    startDate: `${showQRBooking.startDate} ${showQRBooking.startTime || "09:00"}`,
                    endDate: `${showQRBooking.endDate} ${showQRBooking.endTime || "18:00"}`,
                    totalAmountINR: showQRBooking.totalAmountINR,
                    vehicleType: isCar ? "Car" : "Bike",
                    useHourly: Boolean(showQRBooking.rentalHours),
                    rentalHours: showQRBooking.rentalHours,
                    rentalDays: rentalDaysVal,
                    vehicleImage: vehicleImg,
                    airportPickup: vehicleObj?.airportPickup,
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--brand-red)] hover:bg-red-600 text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1 border-0"
              >
                <span>🧾</span> E-Receipt
              </button>
              <button
                onClick={() => setShowQRBooking(null)}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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
  vehicles,
  onShowQR,
  onExtend,
}: {
  booking: Booking;
  confirmCancel: string | null;
  setConfirmCancel: (id: string | null) => void;
  cancelReason: string;
  setCancelReason: (r: string) => void;
  cancellingId: string | null;
  onCancel: (id: string) => void;
  vehicles: any[];
  onShowQR: (b: Booking) => void;
  onExtend: (b: Booking) => void;
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

  const vehicleObj = vehicles.find((v) => v.id === booking.vehicleId);
  const vehicleImg = vehicleObj?.imageUrls?.[0] || "";
  const vehicleTitleVal = vehicleObj?.title || booking.vehicleId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const isCar = booking.vehicleId.toLowerCase().includes("car") || vehicleObj?.category?.toLowerCase() === "car";

  const getCityCode = (cityName: string) => {
    const cityUpper = cityName.toUpperCase();
    if (cityUpper.includes("DELHI")) return "DL-HUB";
    if (cityUpper.includes("NOIDA")) return "UP-HUB";
    if (cityUpper.includes("MUMBAI")) return "MH-HUB";
    if (cityUpper.includes("BENGALURU")) return "KA-HUB";
    if (cityUpper.includes("GURGAON")) return "HR-HUB";
    if (cityUpper.includes("PUNJAB")) return "PB-HUB";
    return "NG-HUB";
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formattedDate = d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short"
      });
      
      let timeFormatted = "09:00 AM";
      if (timeStr) {
        const [hoursStr, minutesStr] = timeStr.split(":");
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const ampm = hours >= 12 ? "PM" : "AM";
          const displayHours = hours % 12 || 12;
          const displayMinutes = String(minutes).padStart(2, "0");
          timeFormatted = `${displayHours}:${displayMinutes} ${ampm}`;
        }
      }
      return `${formattedDate}, ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 select-none flex flex-row gap-5 items-stretch min-w-0">
      {/* Vehicle thumbnail - Hidden on mobile screens, shown only on sm:block */}
      {vehicleImg && (
        <div className="hidden sm:flex w-24 md:w-32 h-auto rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative items-center justify-center shrink-0">
          <img src={vehicleImg} alt={vehicleTitleVal} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>
      )}

      {/* Main Ticket Layout */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2.5 pb-2">
            <div className="min-w-0 text-left">
              <h4 className="text-sm sm:text-base font-extrabold text-white truncate capitalize" title={vehicleTitleVal}>
                {vehicleTitleVal}
              </h4>
            </div>
            {/* Ticket Ref ID Badge */}
            <span className="rounded-lg bg-[var(--brand-red)]/15 border border-[var(--brand-red)]/35 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white uppercase font-mono tracking-wider">
              {formatBookingId(booking.id, booking.city, booking.startDate)}
            </span>
          </div>

          {/* Ticket Route Row (Namo Bharat Style) */}
          <div className="mt-3 flex items-center justify-between gap-3 text-center">
            {/* Left station */}
            <div className="text-left min-w-[70px] sm:min-w-[90px]">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/35 block">PICKUP HUB</span>
              <span className="text-sm sm:text-base font-extrabold text-white block mt-0.5 leading-none">
                {getCityCode(booking.city)}
              </span>
              <span className="text-[10px] text-white/50 block mt-1 font-medium truncate">
                {formatDateTime(booking.startDate, booking.startTime)}
              </span>
            </div>

            {/* Middle connecting line */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <div className="w-full border-t border-dashed border-white/20 my-1 relative flex items-center justify-center">
                <span className="absolute bg-[#121212] px-2 text-xs sm:text-sm">
                  {isCar ? "🚗" : "🏍️"}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-white/45 font-bold tracking-tight mt-1 uppercase">
                {booking.rentalHours ? `${booking.rentalHours} hrs` : `${nights} day${nights !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Right station */}
            <div className="text-right min-w-[70px] sm:min-w-[90px]">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/35 block">RETURN HUB</span>
              <span className="text-sm sm:text-base font-extrabold text-white block mt-0.5 leading-none">
                {getCityCode(booking.city)}
              </span>
              <span className="text-[10px] text-white/50 block mt-1 font-medium truncate">
                {formatDateTime(booking.endDate, booking.endTime)}
              </span>
            </div>
          </div>

          {/* Specs / Info Badges Row */}
          <div className="border-t border-dashed border-white/10 my-3" />
          
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/55 font-medium">
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span className="capitalize">{booking.city} Hub</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>KYC Verified</span>
            </div>

            <div className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} inline-block`} />
              <span className="capitalize font-bold text-white/70">{cfg.label}</span>
            </div>
          </div>
        </div>

        {/* Footer Fare & Actions */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5">
          <div className="flex items-center">
            <span className="text-[9px] sm:text-[10px] text-white/30 uppercase font-black tracking-wider">Fare:</span>
            <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] ml-1">
              ₹{booking.totalAmountINR.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {booking.status === "confirmed" && booking.handoverStatus !== "RETURNED" && (
              <>
                <button
                  onClick={() => onShowQR(booking)}
                  className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] px-2.5 sm:px-3.5 py-1.5 text-[10px] sm:text-xs font-black text-white hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-1 shadow-[0_3px_10px_rgba(225,29,72,0.2)] border-0"
                >
                  <span>📱</span>
                  <span>{booking.handoverStatus === "RELEASED" ? "Return QR" : "Show QR"}</span>
                </button>

                <button
                  onClick={() => onExtend(booking)}
                  className="rounded-xl border border-amber-500/40 hover:border-amber-500/70 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-amber-400 transition-all duration-150 cursor-pointer flex items-center gap-1"
                >
                  <span>⏳</span>
                  <span>Extend</span>
                </button>
              </>
            )}

            {booking.status === "confirmed" && confirmCancel !== booking.id && (!booking.handoverStatus || booking.handoverStatus === "PENDING") && (
              <button
                onClick={() => setConfirmCancel(booking.id)}
                className="rounded-xl border border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-red-400 transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Full-width Glassmorphic Cancellation Drawer Modal Card */}
        {booking.status === "confirmed" && confirmCancel === booking.id && (
          <div className="mt-3 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 via-neutral-900/90 to-red-950/20 p-3.5 space-y-2.5 text-left animate-[fade-in_0.2s_ease-out] shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span>⚠️</span> Confirm Cancellation
              </span>
              <button
                onClick={() => { setConfirmCancel(null); setCancelReason(""); }}
                className="text-[10px] text-white/50 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 transition"
              >
                Close ✕
              </button>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed">
              Are you sure you want to cancel this booking? Full refund will be processed to your payment method.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={1}
              className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-red-400 focus:outline-none resize-none font-sans"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancellingId === booking.id}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 border border-red-400/40 py-2 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 active:scale-95 disabled:opacity-60 transition cursor-pointer shadow-md shadow-red-600/30"
              >
                {cancellingId === booking.id ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
              <button
                onClick={() => { setConfirmCancel(null); setCancelReason(""); }}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white/80 active:scale-95 transition cursor-pointer"
              >
                Keep Ride
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
