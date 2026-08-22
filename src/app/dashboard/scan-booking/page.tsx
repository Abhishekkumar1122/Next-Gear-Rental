"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { calculateBookingAmount, formatBookingId } from "@/lib/pricing-tiers";

type BookingDetails = {
  id: string;
  status: string;
  handoverStatus: string;
  cityName: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleTitle: string;
  vehicleStatus: string;
  startOdometer?: number | null;
  endOdometer?: number | null;
  startFuel?: string | null;
  endFuel?: string | null;
  startPhotos?: string[];
  endPhotos?: string[];
  extraChargesPaid?: boolean;
  extraChargesAmount?: number;
};

function ScanBookingContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const source = searchParams.get("source");

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [justReleased, setJustReleased] = useState(false);

  const [unauthorizedVendorDetails, setUnauthorizedVendorDetails] = useState<{
    ownerVendorName?: string;
    vehicleTitle?: string;
    bookingId?: string;
  } | null>(null);

  // Handover inputs
  const [odometer, setOdometer] = useState<string>("");
  const [fuel, setFuel] = useState<string>("Full");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  // Pending Captured Photo for Review & Confirmation Modal
  const [pendingCapturedPhoto, setPendingCapturedPhoto] = useState<{
    slotIdx: number;
    slotName: string;
    geoTaggedUrl: string;
  } | null>(null);

  const [photoSubmitToast, setPhotoSubmitToast] = useState<string | null>(null);

  // Extra payment states
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    extraChargesAmount: number;
    extraKm: number;
    extraKmCharge: number;
    extraHours: number;
    extraHoursCharge: number;
  } | null>(null);

  // Return condition & Damage assessment states
  const [returnCondition, setReturnCondition] = useState<"NO_DAMAGE" | "DAMAGE_DETECTED">("NO_DAMAGE");
  const [selectedDamages, setSelectedDamages] = useState<Record<string, boolean>>({});
  const [customDamageFee, setCustomDamageFee] = useState<string>("");
  const [vendorDamageNotes, setVendorDamageNotes] = useState<string>("");

  // Inspection checklist items
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Payment Collection & Settlement Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<"UPI_QR" | "ONLINE" | "CASH">("UPI_QR");
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [deferPaymentToReturn, setDeferPaymentToReturn] = useState(false);
  
  const totalAmount = booking?.totalAmountINR ?? 0;
  const bookingAmt = (booking as any)?.amountPaid ?? calculateBookingAmount(totalAmount);
  const rawBalanceDue = (booking as any)?.balanceDue ?? Math.max(0, totalAmount - bookingAmt);
  const balanceDue = isPaymentConfirmed ? 0 : rawBalanceDue;

  const calculateDamageTotal = () => {
    let calcTotal = 0;
    const allItems = [
      { id: "minor_scratch", fee: 500 },
      { id: "dent_crack", fee: 1500 },
      { id: "paint_wrap", fee: 1000 },
      { id: "mirror_broken", fee: 600 },
      { id: "headlight_crack", fee: 1200 },
      { id: "indicator_broken", fee: 500 },
      { id: "tyre_puncture", fee: 800 },
      { id: "rim_bent", fee: 2500 },
      { id: "brake_lever", fee: 750 },
      { id: "lost_key", fee: 1500 },
      { id: "clutch_gear", fee: 2200 },
      { id: "battery_wiring", fee: 1800 },
    ];
    allItems.forEach((it) => {
      if (selectedDamages[it.id]) calcTotal += it.fee;
    });
    if (selectedDamages["major_crash"] && customDamageFee) {
      const customVal = parseFloat(customDamageFee);
      if (!isNaN(customVal)) calcTotal += customVal;
    }
    return calcTotal;
  };

  const damageTotal = calculateDamageTotal();
  const grandTotalSettlement = isPaymentConfirmed ? 0 : (balanceDue + damageTotal);

  const expectedItems = booking?.handoverStatus === "PENDING"
    ? [
        "helmet",
        "brakes",
        "engine",
        "body",
        "documents",
        "key",
        ...(balanceDue > 0 ? ["collectedPending"] : [])
      ]
    : ["helmet", "damage", "key", "cleanliness"];

  const isChecklistComplete = expectedItems.every((item) => !!checklist[item]);

  const fetchDetails = async () => {
    if (!bookingId) {
      setError("No Booking ID provided in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setUnauthorizedVendorDetails(null);
    try {
      const res = await fetch(`/api/bookings/handover?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking(data.booking);
        // Pre-fill fields if already populated
        if (data.booking.handoverStatus === "RELEASED") {
          setOdometer(data.booking.endOdometer ? String(data.booking.endOdometer) : "");
          setFuel(data.booking.endFuel ?? "Full");
          setUploadedPhotos(data.booking.endPhotos ?? []);
        } else {
          setOdometer(data.booking.startOdometer ? String(data.booking.startOdometer) : "");
          setFuel(data.booking.startFuel ?? "Full");
          setUploadedPhotos(data.booking.startPhotos ?? []);
        }
      } else {
        if (data.isUnauthorizedVendor || res.status === 403) {
          setUnauthorizedVendorDetails({
            ownerVendorName: data.ownerVendorName,
            vehicleTitle: data.vehicleTitle,
            bookingId: data.bookingId || bookingId,
          });
        }
        setError(data.error ?? "Failed to load booking details.");
      }
    } catch {
      setError("Network error while loading booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [bookingId]);

  const generateGeoTaggedImage = (imageSrc: string, slotName: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const w = img.width || 600;
        const h = img.height || 450;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);

        const now = new Date();
        const dateStr = now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).toUpperCase();
        const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        const cityName = booking?.cityName || "Noida";
        const coords = "28.5355° N, 77.3910° E";

        // Geo Banner Background
        const bannerH = Math.max(60, Math.floor(h * 0.22));
        ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
        ctx.fillRect(0, h - bannerH, w, bannerH);

        // Red Accent Left Bar
        ctx.fillStyle = "#e10600";
        ctx.fillRect(0, h - bannerH, 8, bannerH);

        // Text Line 1: GPS & City
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(12, Math.floor(w * 0.032))}px sans-serif`;
        ctx.fillText(`📍 GPS: ${coords} · ${cityName} Hub`, 16, h - bannerH + Math.floor(bannerH * 0.35));

        // Text Line 2: Timestamp & Zone Name
        ctx.fillStyle = "#ff4d4d";
        ctx.font = `bold ${Math.max(10, Math.floor(w * 0.026))}px monospace`;
        ctx.fillText(`🕒 ${dateStr} ${timeStr} IST | SLOT: ${slotName.toUpperCase()}`, 16, h - bannerH + Math.floor(bannerH * 0.7));

        // Watermark Right Badge
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = `bold ${Math.max(9, Math.floor(w * 0.022))}px sans-serif`;
        ctx.fillText(`🛡️ NEXT GEAR GEO-STAMP`, w - Math.max(150, Math.floor(w * 0.3)), h - Math.floor(bannerH * 0.25));

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const handlePhotoCaptureSlot = async (slotIdx: number, slotName: string, fileOrUrl?: string | File) => {
    const rawPhotos = [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop",
    ];

    let baseSrc = rawPhotos[slotIdx % rawPhotos.length];

    if (fileOrUrl instanceof File) {
      baseSrc = URL.createObjectURL(fileOrUrl);
    } else if (typeof fileOrUrl === "string" && fileOrUrl) {
      baseSrc = fileOrUrl;
    }

    const geoTaggedUrl = await generateGeoTaggedImage(baseSrc, slotName);

    // Open Review & Confirmation Modal with RETRY and OK buttons!
    setPendingCapturedPhoto({
      slotIdx,
      slotName,
      geoTaggedUrl,
    });
  };

  const [photoUploading, setPhotoUploading] = useState(false);

  const handleConfirmPhotoSubmit = async () => {
    if (!pendingCapturedPhoto) return;
    const { slotIdx, slotName, geoTaggedUrl } = pendingCapturedPhoto;

    setPhotoUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/handover/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: geoTaggedUrl })
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setUploadedPhotos((prev) => {
          const next = [...prev];
          next[slotIdx] = data.imageUrl;
          return next;
        });
        setPendingCapturedPhoto(null);
        setPhotoSubmitToast(`🎉 Photo ${slotIdx + 1}/5 (${slotName}) Uploaded Successfully!`);
        setTimeout(() => setPhotoSubmitToast(null), 4000);
      } else {
        setError(data.error ?? "Failed to upload photo to Cloudinary.");
      }
    } catch {
      setError("Network error while uploading photo to Cloudinary.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRetryPhotoCapture = () => {
    setPendingCapturedPhoto(null);
  };

  const handleHandoverAction = async (action: "release" | "return", forceConfirmPayment = false) => {
    if (!bookingId) return;
    
    const odoVal = parseFloat(odometer);
    if (isNaN(odoVal) || odoVal < 0) {
      setError("Please enter a valid odometer reading.");
      return;
    }

    setActionLoading(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await fetch("/api/bookings/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action,
          odometer: odoVal,
          fuel,
          photos: uploadedPhotos,
          confirmExtraPayment: forceConfirmPayment,
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.requiresExtraPayment) {
          // Show payment confirmation modal/panel
          setRequiresPayment(true);
          setPaymentDetails(data);
        } else if (data.success) {
          setSuccessMsg(
            action === "release"
              ? "Vehicle successfully released to customer! Booking status is active."
              : "Vehicle returned successfully! Bike is automatically listed back on the website."
          );
          if (action === "release") {
            setJustReleased(true);
          }
          setRequiresPayment(false);
          setPaymentDetails(null);

          // Show success alert and redirect to Vendor Dashboard after 2 seconds
          setTimeout(() => {
            window.location.href = "/dashboard/vendor";
          }, 2000);
        } else {
          setError(data.error ?? `Failed to perform action: ${action}`);
        }
      } else {
        setError(data.error ?? `Failed to perform action: ${action}`);
      }
    } catch {
      setError("Network error while submitting action.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[var(--brand-red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm tracking-wide">Fetching secure booking metadata...</p>
        </div>
      </div>
    );
  }

  if (unauthorizedVendorDetails || (error && !booking && error.toLowerCase().includes("not authorized vendor"))) {
    return (
      <div className="min-h-screen bg-[#090507] text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Red Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-lg w-full bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-red-950/40 border-2 border-red-500/60 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center relative z-10 backdrop-blur-2xl">
          
          {/* Animated Shield Lock Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl animate-ping pointer-events-none" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-rose-950 border-2 border-red-500/60 flex items-center justify-center text-4xl shadow-xl shadow-red-600/40 relative z-10">
              ⛔
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-red-500/20 border border-red-500/50 px-4 py-1 text-[11px] font-black text-red-400 uppercase tracking-widest">
              UNAUTHORIZED VENDOR
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              You Are Not Authorized to Verify This Booking
            </h2>
            <p className="text-xs text-white/70 leading-relaxed max-w-md mx-auto">
              This vehicle booking belongs to another registered vendor partner. You do not have permission to handover, modify, or verify this vehicle.
            </p>
          </div>

          {/* Vehicle & Registered Owner Info Box */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-white/50 font-medium">Assigned Fleet Owner</span>
              <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                🏢 {unauthorizedVendorDetails?.ownerVendorName || "Registered Partner Vendor"}
              </span>
            </div>
            
            {unauthorizedVendorDetails?.vehicleTitle && (
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white/50 font-medium">Vehicle Model</span>
                <span className="font-bold text-white">🚗 {unauthorizedVendorDetails.vehicleTitle}</span>
              </div>
            )}

            {unauthorizedVendorDetails?.bookingId && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 font-medium">Booking Reference</span>
                <span className="font-mono text-white/80">🎫 {unauthorizedVendorDetails.bookingId}</span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-[11px] text-amber-300 text-left flex items-start gap-2.5">
            <span className="text-base shrink-0">🛡️</span>
            <p className="leading-relaxed">
              <strong>Fleet Security Policy:</strong> Please instruct the customer to present their QR booking pass to the assigned vendor partner (<strong>{unauthorizedVendorDetails?.ownerVendorName || "Vehicle Owner"}</strong>) for vehicle key handover.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/vendor"
              className="flex-1 text-center bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 px-6 py-3 rounded-full text-xs font-black text-white transition shadow-xl shadow-red-600/30 cursor-pointer"
            >
              Return to Vendor Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full border border-red-500/20 bg-red-950/10 rounded-3xl p-8 space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold">Verification Error</h2>
          <p className="text-sm text-white/70">{error}</p>
          <div className="pt-2">
            <Link
              href="/dashboard/vendor"
              className="inline-block bg-white/10 hover:bg-white/15 px-6 py-2.5 rounded-full text-xs font-semibold text-white transition cursor-pointer"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="max-w-xl w-full bg-gradient-to-b from-[#141414] via-[#0f0f0f] to-[#141414] border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        
        {/* Header with Clean Transparent PNG Logo & Branding */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/Logo1.png"
              alt="Next Gear Logo"
              className="h-11 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(225,6,0,0.45)] shrink-0 transition"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-white whitespace-nowrap">
                  NEXT GEAR
                </span>
                <span className="text-[8px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-widest font-mono shrink-0">
                  Official Hub
                </span>
              </div>
              <h1 className="text-xs font-black tracking-wider uppercase text-white/90 mt-0.5 whitespace-nowrap">
                Hub Handover Verification
              </h1>
              <p className="text-[10px] text-[var(--brand-red)] font-mono font-bold mt-0.5">
                ID: {booking ? formatBookingId(booking.id, booking.cityName, booking.startDate) : ""}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase shrink-0 ${
            booking?.status === "COMPLETED"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              : booking?.status === "CANCELLED"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          }`}>
            {booking?.status}
          </span>
        </div>

        {/* Photo Submit Success Toast */}
        {photoSubmitToast && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3.5 text-xs text-emerald-200 flex items-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-[fade-up_0.2s_ease]">
            <span className="text-base">📸</span>
            <span className="font-extrabold">{photoSubmitToast}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 flex items-start gap-3 animate-[fade-up_0.3s_ease]">
            <span className="text-lg">✅</span>
            <div>
              <p className="font-extrabold text-emerald-200 uppercase tracking-wider text-[11px]">Action Confirmed</p>
              <p className="mt-0.5 text-white/80 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300 flex items-start gap-3 animate-[fade-up_0.3s_ease]">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-extrabold text-red-200 uppercase tracking-wider text-[11px]">Handover Alert</p>
              <p className="mt-0.5 text-white/80 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Extra Charges Payment Panel */}
        {requiresPayment && paymentDetails && (
          <div className="bg-amber-950/30 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 animate-[fade-up_0.3s_ease]">
            <div className="flex items-center gap-2 text-amber-400">
              <span className="text-xl">⚠️</span>
              <h4 className="text-xs font-black uppercase tracking-wider">Collect Outstanding Balance</h4>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              This vehicle was returned late or exceeded the daily mileage limit. Collect the following charges from the customer:
            </p>
            <div className="bg-black/60 rounded-xl p-4 space-y-2 text-xs border border-white/10">
              {paymentDetails.extraKm > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">Extra Mileage ({Math.round(paymentDetails.extraKm)} km)</span>
                  <span className="font-mono text-white font-bold">₹{paymentDetails.extraKmCharge}</span>
                </div>
              )}
              {paymentDetails.extraHours > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">Extra Time ({paymentDetails.extraHours} hrs)</span>
                  <span className="font-mono text-white font-bold">₹{paymentDetails.extraHoursCharge}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between font-extrabold text-sm text-amber-400">
                <span>Total Due</span>
                <span className="font-mono">₹{paymentDetails.extraChargesAmount}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleHandoverAction("return", true)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>💸 Confirm Payment & Complete Return</>
                )}
              </button>
              <button
                onClick={() => setRequiresPayment(false)}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-white/10"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Customer & Booking Details */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Customer & Rental Summary</h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              📍 {booking?.cityName} Hub
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <span className="text-white/40 block text-[10px] font-medium uppercase">Customer</span>
              <span className="font-bold text-white mt-0.5 block truncate">{booking?.customerName}</span>
              <span className="text-[10px] font-mono text-white/60 block mt-0.5">{booking?.customerPhone}</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <span className="text-white/40 block text-[10px] font-medium uppercase">Assigned Vehicle</span>
              <span className="font-bold text-white mt-0.5 block truncate">🏍️ {booking?.vehicleTitle}</span>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black mt-1 uppercase ${
                booking?.vehicleStatus === "AVAILABLE"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {booking?.vehicleStatus}
              </span>
            </div>
            
            {/* Grand Total Settlement Card & Direct Pay Trigger */}
            <div className="col-span-2 bg-gradient-to-r from-amber-950/40 via-black to-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 shadow-lg">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Rental Period</span>
                  <span className="font-bold text-white mt-0.5 block">🗓️ {booking?.startDate} → {booking?.endDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Total Settlement Due</span>
                  <span className={`font-black text-sm font-mono ${grandTotalSettlement > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    ₹{grandTotalSettlement.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Dynamic Fee Breakdown if Damage or Balance Exists */}
              {grandTotalSettlement > 0 ? (
                <div className="pt-2 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] text-white/70 font-mono">
                    <span>• Pickup Balance Due: ₹{balanceDue.toLocaleString("en-IN")}</span>
                    {damageTotal > 0 && <span className="text-red-400 font-bold">• Vehicle Care / Inspection Fee: ₹{damageTotal.toLocaleString("en-IN")}</span>}
                  </div>

                  {/* Defer Payment to Return Toggle Option (Pickup Handover) */}
                  {booking?.handoverStatus === "PENDING" && balanceDue > 0 && (
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      deferPaymentToReturn
                        ? "border-amber-400 bg-amber-500/15 text-amber-200"
                        : "border-white/10 bg-black/40 text-white/70 hover:bg-white/5"
                    }`}>
                      <input
                        type="checkbox"
                        checked={deferPaymentToReturn}
                        onChange={(e) => setDeferPaymentToReturn(e.target.checked)}
                        className="h-4 w-4 rounded border-amber-400 bg-black text-amber-500 focus:ring-0 accent-amber-500 mt-0.5"
                      />
                      <div>
                        <span className="font-extrabold text-[11px] block text-amber-300">
                          ⏳ Defer Payment to Vehicle Return Time (Pay at Check-in)
                        </span>
                        <span className="text-[9px] text-white/60 block leading-tight mt-0.5">
                          Allow rider to take vehicle now. Full pending balance of ₹{balanceDue.toLocaleString("en-IN")} will be collected at vehicle return.
                        </span>
                      </div>
                    </label>
                  )}

                  {!deferPaymentToReturn && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:brightness-110 active:scale-98 text-black font-black text-xs rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <span>💳</span>
                      <span>Pay / Collect ₹{grandTotalSettlement.toLocaleString("en-IN")} Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-1 text-center text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <span>✅</span>
                  <span>ALL BALANCE & DAMAGE FEES SETTLED (NO OUTSTANDING DUE)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification & Inspection Workspace */}
        {booking &&
          booking.status !== "CANCELLED" &&
          booking.handoverStatus !== "RETURNED" &&
          !requiresPayment &&
          (booking.handoverStatus === "PENDING" || (booking.handoverStatus === "RELEASED" && !justReleased)) && (
          <div className="space-y-4 pt-5 border-t border-white/10 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span>🔍</span> {booking.handoverStatus === "PENDING" ? "Pickup Inspection Workspace" : "Return Inspection Workspace"}
              </h3>
              <span className="text-[10px] text-white/50 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                Step {booking.handoverStatus === "PENDING" ? "1 of 2" : "2 of 2"}
              </span>
            </div>

            {/* If Return Inspection: 2-Condition Vehicle Return Selector (No Damage vs Damage Detected) */}
            {booking.handoverStatus === "RELEASED" && (
              <div className="space-y-3 pt-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/80 block">
                  Select Return Vehicle Condition:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReturnCondition("NO_DAMAGE")}
                    className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      returnCondition === "NO_DAMAGE"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">🟢</span>
                    <span>No Damage (Clean)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnCondition("DAMAGE_DETECTED")}
                    className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      returnCondition === "DAMAGE_DETECTED"
                        ? "border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">🚨</span>
                    <span>Damage Detected</span>
                  </button>
                </div>

                {/* If Damage Detected: Categorized Multi-Checklist & Penalty Calculator */}
                {returnCondition === "DAMAGE_DETECTED" && (
                  <div className="mt-4 space-y-4 pt-3 border-t border-red-500/30 animate-[fade-up_0.2s_ease]">
                    <div className="flex items-center justify-between text-red-400 font-bold text-[11px] border-b border-red-500/20 pb-2">
                      <span className="flex items-center gap-1.5">
                        <span>🛠️</span> Categorized Damage Assessment & Penalty Calculator
                      </span>
                      <span className="text-[9px] bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full text-red-200 font-mono">
                        Multi-Zone Inspection
                      </span>
                    </div>

                    {/* Categorized Multi-Checklists */}
                    <div className="space-y-4">
                      {[
                        {
                          title: "🛵 Zone 1: Body Panels & Exterior",
                          items: [
                            { id: "minor_scratch", label: "🔩 Minor Scratch / Scuff Mark", fee: 500 },
                            { id: "dent_crack", label: "🛡️ Deep Dent / Body Panel Crack", fee: 1500 },
                            { id: "paint_wrap", label: "🎨 Paint Scratched / Sticker Wrap Tear", fee: 1000 },
                          ],
                        },
                        {
                          title: "🪞 Zone 2: Mirrors, Lights & Accessories",
                          items: [
                            { id: "mirror_broken", label: "🪞 Rear-view Mirror Broken / Missing", fee: 600 },
                            { id: "headlight_crack", label: "💡 Headlight / Tail-light Glass Cracked", fee: 1200 },
                            { id: "indicator_broken", label: "🚨 Indicator / Turn Signal Damaged", fee: 500 },
                          ],
                        },
                        {
                          title: "🛞 Zone 3: Wheels, Tyres & Controls",
                          items: [
                            { id: "tyre_puncture", label: "🛞 Tyre Puncture / Sidewall Cut", fee: 800 },
                            { id: "rim_bent", label: "⚙️ Alloy Rim Bent / Rim Damage", fee: 2500 },
                            { id: "brake_lever", label: "🛴 Brake Lever / Footpeg Bent or Broken", fee: 750 },
                          ],
                        },
                        {
                          title: "⚡ Zone 4: Keys, Engine & Electricals",
                          items: [
                            { id: "lost_key", label: "🔑 Lost Original Key / Remote Fob", fee: 1500 },
                            { id: "clutch_gear", label: "⚙️ Clutch Plate / Gear Shift Damaged", fee: 2200 },
                            { id: "battery_wiring", label: "⚡ Battery Dead / Wiring Harness Damaged", fee: 1800 },
                            { id: "major_crash", label: "💥 Major Structural / Engine Crash Damage", fee: 0, isMajor: true },
                          ],
                        },
                      ].map((category, catIdx) => (
                        <div key={catIdx} className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-red-300 flex items-center justify-between border-b border-white/5 pb-1.5">
                            <span>{category.title}</span>
                          </h4>
                          <div className="space-y-1.5">
                            {category.items.map((item) => (
                              <label
                                key={item.id}
                                className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                                  selectedDamages[item.id]
                                    ? "border-red-500/50 bg-red-950/50 text-red-100 font-semibold"
                                    : "border-white/5 bg-white/[0.01] text-white/60 hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedDamages[item.id]}
                                    onChange={(e) => {
                                      setSelectedDamages((prev) => ({ ...prev, [item.id]: e.target.checked }));
                                    }}
                                    className="h-3.5 w-3.5 rounded border-white/20 bg-black text-red-600 focus:ring-0 accent-red-600"
                                  />
                                  <span className="text-[11px]">{item.label}</span>
                                </div>
                                {item.fee > 0 ? (
                                  <span className="font-mono font-bold text-[11px] text-red-400">₹{item.fee}</span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Custom</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Live Dynamic Total Penalty Summary Card */}
                    {(() => {
                      let calcTotal = 0;
                      const allItems = [
                        { id: "minor_scratch", fee: 500 },
                        { id: "dent_crack", fee: 1500 },
                        { id: "paint_wrap", fee: 1000 },
                        { id: "mirror_broken", fee: 600 },
                        { id: "headlight_crack", fee: 1200 },
                        { id: "indicator_broken", fee: 500 },
                        { id: "tyre_puncture", fee: 800 },
                        { id: "rim_bent", fee: 2500 },
                        { id: "brake_lever", fee: 750 },
                        { id: "lost_key", fee: 1500 },
                        { id: "clutch_gear", fee: 2200 },
                        { id: "battery_wiring", fee: 1800 },
                      ];
                      allItems.forEach((it) => {
                        if (selectedDamages[it.id]) calcTotal += it.fee;
                      });
                      if (selectedDamages["major_crash"] && customDamageFee) {
                        const customVal = parseFloat(customDamageFee);
                        if (!isNaN(customVal)) calcTotal += customVal;
                      }
                      return (
                        <div className="bg-gradient-to-r from-red-950/60 via-black to-red-950/40 border border-red-500/40 rounded-xl p-3.5 flex items-center justify-between text-xs shadow-lg">
                          <div>
                            <span className="text-[10px] uppercase font-black text-red-400 block tracking-wider">Estimated Total Damage Penalty</span>
                            <span className="text-[10px] text-white/50">Auto-calculated from selected zones</span>
                          </div>
                          <span className="text-base font-black font-mono text-red-300 bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/40">
                            ₹{calcTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Custom Penalty Input if Major Damage */}
                    {selectedDamages["major_crash"] && (
                      <div className="space-y-1 pt-1 animate-[fade-up_0.2s_ease]">
                        <label className="text-[10px] uppercase font-bold text-red-300 block">Custom Major Damage Penalty Amount (INR)</label>
                        <input
                          type="number"
                          value={customDamageFee}
                          onChange={(e) => setCustomDamageFee(e.target.value)}
                          placeholder="e.g. 4500"
                          className="w-full rounded-xl bg-black border border-red-500/40 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-400"
                        />
                      </div>
                    )}

                    {/* Damage Details Note */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-white/60 block">Vendor Incident Description / Notes</label>
                      <textarea
                        rows={2}
                        value={vendorDamageNotes}
                        onChange={(e) => setVendorDamageNotes(e.target.value)}
                        placeholder="Provide exact details of damage scuffs, panel cracks, or parts to be replaced..."
                        className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-400 resize-none font-sans"
                      />
                    </div>

                    {/* 24-Hour Dispute Resolution Guarantee Badge */}
                    <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-[10px] text-red-200 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-red-400">
                        <span>⏳</span> 24-Hour Resolution Guarantee:
                      </p>
                      <p className="text-white/70 leading-relaxed">
                        Damage case reported. Vendor arbitration & deposit settlement must be finalized within 24 hours. Photo evidence will be preserved for dispute review.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Odometer Input */}
              <div className="space-y-1">
                <label className="text-white/60 block font-semibold">Odometer Reading (km)</label>
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="e.g. 12450"
                  className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>

              {/* Fuel Level */}
              <div className="space-y-1">
                <label className="text-white/60 block font-semibold">Fuel Level</label>
                <select
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] cursor-pointer"
                >
                  <option value="Full">Full (100%)</option>
                  <option value="75%">75%</option>
                  <option value="50%">50%</option>
                  <option value="25%">25%</option>
                  <option value="Empty">Empty</option>
                </select>
              </div>
            </div>

            {/* Mandatory 5 Photos Upload Section with Single Camera Button */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-white/80 font-black block text-xs tracking-wide">
                  Mandatory Inspection Photos (5 Required)
                </label>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  uploadedPhotos.length >= 5
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {uploadedPhotos.length}/5 Mandatory Photos
                </span>
              </div>

              {/* Single Shutter Camera Capture Button */}
              {uploadedPhotos.length < 5 ? (
                <label className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-[var(--brand-red)] via-rose-600 to-[#ff4d4d] hover:brightness-110 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl cursor-pointer shadow-[0_4px_25px_rgba(225,6,0,0.35)] transition border border-red-400/40 relative select-none">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const idx = uploadedPhotos.length;
                        const slots = ["Front View", "Rear View", "Left Side", "Right Side", "Meter Odometer"];
                        handlePhotoCaptureSlot(idx, slots[idx] || "Inspection", file);
                      }
                    }}
                  />
                  <span className="text-lg">📷</span>
                  <span className="uppercase tracking-wider">
                    TAKE PHOTO {uploadedPhotos.length + 1}/5 ({["Front View", "Rear View", "Left Side", "Right Side", "Meter Odometer"][uploadedPhotos.length]})
                  </span>
                </label>
              ) : (
                <div className="w-full py-3 px-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <span>✅</span>
                  <span>ALL 5 MANDATORY INSPECTION PHOTOS CAPTURED & GEO-TAGGED</span>
                </div>
              )}

              {/* Thumbnails of Captured Photos */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {uploadedPhotos.map((url, idx) => {
                    const slotNames = ["Front", "Rear", "Left", "Right", "Meter"];
                    return (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/20 bg-black/60 shadow-md">
                        <img src={url} alt={slotNames[idx]} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 left-0.5 bg-black/85 text-[7px] font-black text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30 font-mono">
                          📍 GEO
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-black text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold cursor-pointer border border-white/20"
                          title="Remove Photo"
                        >
                          ×
                        </button>
                        <span className="absolute top-0.5 left-0.5 bg-black/75 text-[7px] font-bold text-white/80 px-1 rounded">
                          {idx + 1}. {slotNames[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Auto-Deletion Privacy Policy Notice */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-[10px] text-white/50 leading-relaxed flex items-start gap-2">
                <span className="text-xs shrink-0">🛡️</span>
                <p>
                  <strong className="text-white/80">Security & Privacy Auto-Delete Policy:</strong> Inspection photos are mandatory for safety verification. All inspection photos are automatically purged and permanently deleted from Next Gear servers within <span className="text-amber-400 font-bold">24 to 48 hours</span> after handover completion.
                </p>
              </div>
            </div>

            {/* Inspection Checklist */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="text-white/70 block font-extrabold text-xs">Inspection Verification Checklist</label>
              <div className="space-y-2">
                {(booking.handoverStatus === "PENDING" ? [
                  { id: "helmet", label: "🪖 Safety Helmet Provided to Rider" },
                  { id: "brakes", label: "🔧 Front & Rear Brakes Operation Checked" },
                  { id: "engine", label: "⚙️ Engine Status & Fluid Levels Checked" },
                  { id: "body", label: "🔍 Visual Scratches / Dents Documented" },
                  { id: "documents", label: "📁 RC & Insurance Copies Stored in Boot" },
                  { id: "key", label: "🔑 Physical Vehicle Keys Handed Over" },
                  ...(balanceDue > 0 ? [{ id: "collectedPending", label: `💸 Collected Outstanding Pickup Balance of ₹${balanceDue.toLocaleString("en-IN")} from Customer` }] : [])
                ] : [
                  { id: "helmet", label: "🪖 Safety Helmet Received Back" },
                  { id: "damage", label: "🔍 Body Panel Checked (No Unverified Damage)" },
                  { id: "key", label: "🔑 Physical Keys Received Back" },
                  { id: "cleanliness", label: "🧼 Vehicle Cleanness & General Status Checked" },
                ]).map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      checklist[item.id]
                        ? "border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300 font-bold"
                        : "border-white/10 bg-white/[0.01] text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checklist[item.id]}
                      onChange={(e) => {
                        setChecklist((prev) => ({ ...prev, [item.id]: e.target.checked }));
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-black text-emerald-500 focus:ring-0 accent-emerald-500"
                    />
                    <span className="text-xs">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Verification Actions */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Handover Actions</h3>

          {booking?.status === "CANCELLED" ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl p-4 text-center font-bold">
              ❌ This booking is cancelled. No further actions permitted.
            </div>
          ) : booking?.handoverStatus === "PENDING" ? (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 text-white/80 text-xs rounded-2xl p-4 leading-relaxed">
                👉 **Instructions**: Complete the pickup inspection. Ensure odometer reading, fuel level, all 5 mandatory photos uploaded, checklist verified, and pending pickup balance settled.
              </div>

              {/* If Balance Due > 0 and NOT deferred, button guides vendor to Collect Payment first */}
              {grandTotalSettlement > 0 && !deferPaymentToReturn ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:brightness-110 active:scale-98 text-black font-black text-sm rounded-2xl transition shadow-[0_4px_25px_rgba(245,158,11,0.35)] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <span>💳</span>
                  <span>Collect Pickup Balance (₹{grandTotalSettlement.toLocaleString("en-IN")}) to Release</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleHandoverAction("release")}
                  disabled={actionLoading || requiresPayment || !isChecklistComplete || uploadedPhotos.length < 5}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-sm text-white transition shadow-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : uploadedPhotos.length < 5 ? (
                    <>📷 Take All 5 Mandatory Photos to Handover ({uploadedPhotos.length}/5)</>
                  ) : !isChecklistComplete ? (
                    <>🔒 Complete Inspection Checklist to Handover</>
                  ) : deferPaymentToReturn ? (
                    <>🚀 Handover & Release (₹{balanceDue.toLocaleString("en-IN")} Deferred to Return)</>
                  ) : (
                    <>🚀 Handover & Release Vehicle</>
                  )}
                </button>
              )}
            </div>
          ) : booking?.handoverStatus === "RELEASED" && !requiresPayment ? (
            justReleased ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl p-4 text-center space-y-1.5 animate-[fade-up_0.3s_ease]">
                <p className="font-extrabold text-sm uppercase tracking-wider">🚀 Vehicle Released Successfully</p>
                <p className="text-white/70">The vehicle is now active and in use. To complete the return, please scan the customer's QR code again at return time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 text-white/90 text-xs rounded-2xl p-4 leading-relaxed font-bold">
                  🔔 Pickup Reading: <span className="text-amber-400">{booking.startOdometer} km</span> · Fuel: <span className="text-amber-400">{booking.startFuel}</span>
                </div>

                {grandTotalSettlement > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:brightness-110 active:scale-98 text-black font-black text-sm rounded-2xl transition shadow-[0_4px_25px_rgba(245,158,11,0.35)] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <span>💳</span>
                    <span>Collect Return Settlement (₹{grandTotalSettlement.toLocaleString("en-IN")}) & Complete Return</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleHandoverAction("return")}
                    disabled={actionLoading || !isChecklistComplete || uploadedPhotos.length < 5}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-sm text-white transition shadow-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : uploadedPhotos.length < 5 ? (
                      <>📷 Take All 5 Mandatory Photos to Return ({uploadedPhotos.length}/5)</>
                    ) : !isChecklistComplete ? (
                      <>🔒 Complete Inspection Checklist to Return</>
                    ) : (
                      <>📥 Complete Return & Put Online</>
                    )}
                  </button>
                )}
              </div>
            )
          ) : booking?.handoverStatus === "RETURNED" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl p-4 text-center space-y-1.5 animate-[fade-up_0.3s_ease]">
              <p className="font-extrabold text-sm uppercase tracking-wider">🎉 Check-in Completed</p>
              <p className="text-white/70">This vehicle has been returned and listed back online for new customer reservations.</p>
              <div className="bg-black/40 rounded-xl p-3 text-left mt-2 space-y-1 text-white/80 border border-white/10">
                <p>📈 **Pickup**: {booking.startOdometer} km · Fuel: {booking.startFuel}</p>
                <p>📉 **Return**: {booking.endOdometer} km · Fuel: {booking.endFuel}</p>
                {booking.extraChargesAmount && booking.extraChargesAmount > 0 ? (
                  <p className="text-amber-400 font-bold">💸 Extra Charges Paid: ₹{booking.extraChargesAmount}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <Link
            href="/dashboard/vendor"
            className="text-xs text-white/30 hover:text-white/50 transition decoration-dotted underline"
          >
            Go back to Dashboard
          </Link>
        </div>
      </div>

      {/* Photo Inspection Review & Confirmation Modal */}
      {pendingCapturedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease]">
          <div className="max-w-sm w-full bg-[#121212] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-[scale-up_0.2s_ease] text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white">
                <span className="text-base">📸</span>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">Review Inspection Photo</h4>
                  <p className="text-[10px] text-white/50">Photo {pendingCapturedPhoto.slotIdx + 1} of 5 ({pendingCapturedPhoto.slotName})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetryPhotoCapture}
                className="text-white/40 hover:text-white text-base font-bold transition p-1"
              >
                ✕
              </button>
            </div>

            {/* Photo Viewfinder with Embedded Geo-Tag Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black aspect-[4/3] shadow-inner">
              <img
                src={pendingCapturedPhoto.geoTaggedUrl}
                alt={pendingCapturedPhoto.slotName}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-emerald-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono shadow">
                📍 Geo-Tag Active
              </span>
            </div>

            <p className="text-[10px] text-white/60 text-center leading-relaxed">
              Verify image clarity and Geo-Tag stamp. Click <strong className="text-emerald-400">OK / Confirm</strong> to upload to server or <strong className="text-amber-400">Retry</strong> to retake photo.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl p-2.5 text-center font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Action Buttons: RETRY vs CONFIRM OK */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleRetryPhotoCapture}
                className="py-3 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 font-bold text-xs rounded-xl transition border border-white/15 cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <span>🔄</span>
                <span>Retry / Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhotoSubmit}
                disabled={photoUploading}
                className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer flex items-center justify-center gap-1.5 uppercase min-w-[120px]"
              >
                {photoUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>OK / Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hub Settlement & Payment Collection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease]">
          <div className="max-w-sm w-full bg-[#121212] border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-2xl animate-[scale-up_0.2s_ease] text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">💳</span>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-amber-400">Hub Payment Settlement</h4>
                  <p className="text-[10px] text-white/50">Collect pending rental & settlement charges</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-white/40 hover:text-white text-base font-bold transition p-1"
              >
                ✕
              </button>
            </div>

            {/* Total Amount Settlement Pill */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Grand Total Amount Due</span>
              <div className="text-2xl font-black font-mono text-amber-400">
                ₹{grandTotalSettlement.toLocaleString("en-IN")}
              </div>
              <div className="text-[9px] text-white/50 space-x-2 pt-0.5">
                <span>Pickup Balance: ₹{balanceDue.toLocaleString("en-IN")}</span>
                {damageTotal > 0 && <span className="text-red-400 font-bold">· Vehicle Care Fee: ₹{damageTotal.toLocaleString("en-IN")}</span>}
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 block">Select Payment Mode:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "UPI_QR", label: "📲 UPI QR", icon: "📱" },
                  { id: "ONLINE", label: "💳 Online", icon: "🌐" },
                  { id: "CASH", label: "💵 Cash", icon: "💸" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedPaymentMode(mode.id as any)}
                    className={`py-2 px-1.5 rounded-xl border text-center font-bold text-[10px] transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      selectedPaymentMode === mode.id
                        ? "border-amber-500 bg-amber-500/20 text-amber-300 font-black shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span>{mode.icon}</span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Display */}
            {selectedPaymentMode === "UPI_QR" && (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-center space-y-2 animate-[fade-up_0.2s_ease]">
                <div className="w-36 h-36 bg-white rounded-xl mx-auto p-2 flex items-center justify-center border-2 border-amber-500/40 shadow-lg">
                  {/* Dynamic Inline QR Code Representation */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=nextgear.rentals@upi%26pn=NextGearRentals%26am=${grandTotalSettlement}%26cu=INR`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-white/90">Scan using GPay, PhonePe, Paytm, or BHIM</p>
                  <p className="text-[9px] font-mono text-amber-400">UPI VPA: nextgear.rentals@upi</p>
                </div>
              </div>
            )}

            {selectedPaymentMode === "ONLINE" && (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-center space-y-2 animate-[fade-up_0.2s_ease]">
                <span className="text-2xl block">💳</span>
                <p className="text-[11px] font-bold text-white">Online Payment Gateway Link</p>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Send Razorpay payment link to customer's mobile number ({booking?.customerPhone}) or process via Card Terminal.
                </p>
              </div>
            )}

            {selectedPaymentMode === "CASH" && (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-center space-y-2 animate-[fade-up_0.2s_ease]">
                <span className="text-2xl block">💵</span>
                <p className="text-[11px] font-bold text-white">Cash Received at Hub Counter</p>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Vendor confirms receiving cash payment of <strong className="text-amber-400 font-mono">₹{grandTotalSettlement.toLocaleString("en-IN")}</strong> in hand.
                </p>
              </div>
            )}

            {/* Confirm Collection Action Button */}
            <button
              type="button"
              onClick={() => {
                setPaymentProcessing(true);
                setTimeout(() => {
                  setPaymentProcessing(false);
                  setIsPaymentConfirmed(true);
                  setShowPaymentModal(false);
                  setSuccessMsg(`Payment of ₹${grandTotalSettlement.toLocaleString("en-IN")} collected & settled successfully!`);
                }, 800);
              }}
              disabled={paymentProcessing}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:brightness-110 active:scale-98 text-white font-black text-xs rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {paymentProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>✅</span>
                  <span>Confirm Payment & Mark Paid</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0c0c] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[var(--brand-red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm tracking-wide">Loading scanner context...</p>
        </div>
      </div>
    }>
      <ScanBookingContent />
    </Suspense>
  );
}
