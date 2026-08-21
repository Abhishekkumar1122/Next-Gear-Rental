"use client";

import { toCurrency, calculateHours, calculateHourlyBaseCost, calculateDailyVehicleCost } from "@/lib/pricing";
import { downloadOfflinePass } from "@/lib/booking-pass-downloader";
import { cityConfigs } from "@/lib/india-locations";
import { calculateBookingAmount, formatBookingId } from "@/lib/pricing-tiers";

import { Booking, Vehicle } from "@/lib/types";
import { bookingAddOns, vehicles as mockVehicles } from "@/lib/mock-data";
import { FormEvent, useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { MockRazorpayModal } from "@/components/mock-razorpay-modal";
import { MockDigiLockerModal } from "@/components/mock-digilocker-modal";
import { PayUInAppModal } from "@/components/payu-inapp-modal";
import { PaymentGatewaySelector, PaymentProvider } from "@/components/payment-gateway-selector";
import { DeliveryTrackingPanel } from "@/components/delivery-tracking-panel";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOrder = {
  id: string;
  amount?: number;
  currency?: string;
};

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function MiniCalendar({
  value,
  onChange,
  onClose,
  minDate,
}: {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  minDate?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isSelected = dateStr === value;
    
    let isDisabled = false;
    if (minDate) {
      isDisabled = dateStr < minDate;
    }

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => {
          onChange(dateStr);
          onClose();
        }}
        className={`w-8 h-8 text-xs font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isSelected
            ? "bg-[var(--brand-red)] text-white shadow-lg shadow-red-600/35"
            : isDisabled
            ? "text-white/20 cursor-not-allowed"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 p-4 rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl z-50 w-64 text-white"
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition cursor-pointer"
        >
          ←
        </button>
        <span className="text-xs font-bold tracking-wider font-display uppercase text-white/90">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition cursor-pointer"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-white/40 mb-2">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}

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

function MiniTimePicker({
  value,
  onChange,
  onClose,
  align = "left",
}: {
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [selectedHour, setSelectedHour] = useState(() => {
    if (!value) return "09";
    const parts = value.split(":");
    return parts[0] || "09";
  });
  
  const [selectedMinute, setSelectedMinute] = useState(() => {
    if (!value) return "00";
    const parts = value.split(":");
    return parts[1] || "00";
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const handleSelectHour = (hr: string) => {
    setSelectedHour(hr);
    onChange(`${hr}:${selectedMinute}`);
  };

  const handleSelectMinute = (min: string) => {
    setSelectedMinute(min);
    onChange(`${selectedHour}:${min}`);
  };

  return (
    <div
      ref={ref}
      className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-2 p-3 rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl z-50 w-52 text-white`}
    >
      <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold px-1 pb-1.5 border-b border-white/5 mb-2 flex justify-between">

        <span>Hour</span>
        <span>Minute</span>
      </div>
      <div className="grid grid-cols-2 gap-2 h-44">
        {/* Hour Column */}
        <div className="overflow-y-auto no-scrollbar flex flex-col gap-0.5 pr-1 border-r border-white/5">
          {hours.map((hr) => {
            const isSelected = hr === selectedHour;
            const hourNum = parseInt(hr, 10);
            const ampm = hourNum >= 12 ? "PM" : "AM";
            const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
            const label = `${displayHour} ${ampm}`;
            
            return (
              <button
                key={hr}
                type="button"
                onClick={() => handleSelectHour(hr)}
                className={`w-full text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-600/20"
                    : "text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Minute Column */}
        <div className="overflow-y-auto no-scrollbar flex flex-col gap-0.5 pl-1">
          {minutes.map((min) => {
            const isSelected = min === selectedMinute;
            return (
              <button
                key={min}
                type="button"
                onClick={() => handleSelectMinute(min)}
                className={`w-full text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-600/20"
                    : "text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                {min}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full mt-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold text-white transition cursor-pointer text-center"
      >
        Confirm
      </button>
    </div>
  );
}

function formatTimeDisplay(timeStr: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${ampm}`;
}

function PaymentRedirectingCard({ message }: { message: string }) {
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "🔒 Securing 256-Bit SSL Connection...",
    "⚡ Generating PayU Live Checkout Token...",
    "🚀 Opening Official PayU Gateway..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/70 via-black to-red-950/40 p-4 shadow-2xl shadow-red-500/20 text-white animate-[fade-in_0.3s_ease_forwards]">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-red-600/20 blur-xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/50 text-white shadow-lg shadow-red-600/30">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-red-500 opacity-60" />
              <span className="relative text-base font-black">⚡</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>PayU Gateway Redirect</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </p>
              <p className="text-[11px] text-emerald-400 font-mono mt-0.5 font-bold transition-all">
                {steps[stepIndex]}
              </p>
            </div>
          </div>
          
          {/* Live Countdown Timer Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-black text-emerald-400 shadow-inner">
            <span className="animate-spin text-sm">⏳</span>
            <span>{secondsLeft}s</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5 border border-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-emerald-400 animate-[progress_1.5s_ease-in-out_infinite]" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
          <span>🔒 256-Bit SSL Security Protocol</span>
          <span className="text-red-400/80 font-bold">Please do not refresh</span>
        </div>
      </div>
    </div>
  );
}

export function BookingExperience({ userEmail: initialEmail, userName: initialName, addonWaiverActive = true, addonRsaActive = true, addonHelmetActive = true }: { userEmail?: string; userName?: string; addonWaiverActive?: boolean; addonRsaActive?: boolean; addonHelmetActive?: boolean } = {}) {
  const searchParams = useSearchParams();
  const prefilledCity = searchParams.get("city") ?? "Delhi";
  const isNriMode = searchParams.get("nri") === "1";
  const prefilledTimezone = searchParams.get("tz") ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Kolkata";
  const [city, setCity] = useState(prefilledCity);
  const [startDate, setStartDate] = useState(() => offsetDate(1));
  const [endDate, setEndDate] = useState(() => offsetDate(3));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [type, setType] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "user@example.com");
  const [fullName, setFullName] = useState(initialName ?? "Riya Verma");
  const [phone, setPhone] = useState("9876543210");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>(isNriMode ? "stripe" : "payu");
  const [isDigiLockerActive, setIsDigiLockerActive] = useState(false);
  const [allowedGateways, setAllowedGateways] = useState<PaymentProvider[]>(["payu", "paypal"]);
  const [securityDepositActive, setSecurityDepositActive] = useState(false);
  const [securityDepositAmount, setSecurityDepositAmount] = useState("2000");
  // GSTIN & Accessory States
  const [receiptGstin, setReceiptGstin] = useState("");
  const [receiptCompanyAddress, setReceiptCompanyAddress] = useState("Saket, New Delhi, India");
  const [accessoryHelmetActive, setAccessoryHelmetActive] = useState(false);
  const [accessoryHelmetPrice, setAccessoryHelmetPrice] = useState(50);
  const [accessoryGpsActive, setAccessoryGpsActive] = useState(false);
  const [accessoryGpsPrice, setAccessoryGpsPrice] = useState(100);
  const [selectHelmet, setSelectHelmet] = useState(false);
  const [selectGps, setSelectGps] = useState(false);
  const [timezone, setTimezone] = useState(prefilledTimezone);
  const [nriChecklistAccepted, setNriChecklistAccepted] = useState(!isNriMode);
  const [promoCode, setPromoCode] = useState("");
  const [drivingLicenseNo, setDrivingLicenseNo] = useState("");
  const [governmentIdNo, setGovernmentIdNo] = useState("");
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");
  const [bookingVehicleId, setBookingVehicleId] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  const preVehicleId = searchParams.get("vehicleId");
  // Instant 0ms selected vehicle initialization from mock fallback so UI never flashes skeletons
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(() => {
    if (preVehicleId) {
      return mockVehicles.find((v) => v.id === preVehicleId) ?? null;
    }
    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [showTaxDetails, setShowTaxDetails] = useState(false);
  const [showDigiLocker, setShowDigiLocker] = useState(false);
  const [isDigiLockerVerified, setIsDigiLockerVerified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [verificationMode, setVerificationMode] = useState<"digilocker" | "manual">("digilocker");
  const [isUploadingDl, setIsUploadingDl] = useState(false);
  const [isUploadingGov, setIsUploadingGov] = useState(false);
  const [dlFileName, setDlFileName] = useState("");
  const [govFileName, setGovFileName] = useState("");
  const [dlUploadProgress, setDlUploadProgress] = useState(0);
  const [govUploadProgress, setGovUploadProgress] = useState(0);
  const [dlUploadMessage, setDlUploadMessage] = useState("");
  const [govUploadMessage, setGovUploadMessage] = useState("");
  const [governmentIdBackFile, setGovernmentIdBackFile] = useState<File | null>(null);
  const [govBackFileName, setGovBackFileName] = useState("");
  const [isUploadingGovBack, setIsUploadingGovBack] = useState(false);
  const [govBackUploadProgress, setGovBackUploadProgress] = useState(0);
  const [govBackUploadMessage, setGovBackUploadMessage] = useState("");
  const [isLoadingPrefilled, setIsLoadingPrefilled] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);
  const [paymentOption, setPaymentOption] = useState<"partial" | "full">("partial");
  const [isMobile, setIsMobile] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  // Pre-warm ref: fires booking API in background when user reaches payment step
  const preWarmRef = useRef<Promise<Response> | null>(null);
  const preWarmParamsRef = useRef<string | null>(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (successBookingId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [successBookingId]);

  // Handle PayU Payment Redirect Callback (payment=success / payment=failed)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const paramBookingId = searchParams.get("bookingId");
    if (paymentStatus === "success" && paramBookingId) {
      setSuccessBookingId(paramBookingId);
      setMessage(`✅ Payment successful! Booking ${formatBookingId(paramBookingId, city, startDate)} confirmed via PayU Live Gateway.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (paymentStatus === "failed") {
      const reason = searchParams.get("reason") || "Payment was cancelled or failed.";
      setMessage(`❌ Payment Failed: ${reason}`);
    }
  }, [searchParams]);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>(["Delhi", "Mumbai", "Bengaluru", "Goa"]);
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showAddGearModal, setShowAddGearModal] = useState(false);

  function toggleAddon(addon: string) {
    setAddons((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon]
    );
  }


  // Dynamic discount rules from site settings
  const [discountSettings, setDiscountSettings] = useState({
    multiVehicleMinQty: 3,
    multiVehicleDiscountPercent: 10,
    durationDiscountMinDays: 4,
    durationDiscountFreeDays: 1,
  });

  // Fetch dynamic discount settings and active cities on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/site-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setDiscountSettings({
              multiVehicleMinQty: Number(data.settings.multiVehicleMinQty ?? 3),
              multiVehicleDiscountPercent: Number(data.settings.multiVehicleDiscountPercent ?? 10),
              durationDiscountMinDays: Number(data.settings.durationDiscountMinDays ?? 4),
              durationDiscountFreeDays: Number(data.settings.durationDiscountFreeDays ?? 1),
            });
            const isDL = data.settings.digilockerActive === "true";
            setIsDigiLockerActive(isDL);
            if (!isDL) {
              setVerificationMode("manual");
            }

            const activeList: PaymentProvider[] = [];
            if (data.settings.payuActive === "true") activeList.push("payu");
            if (data.settings.paypalActive === "true") activeList.push("paypal");
            if (data.settings.razorpayActive === "true") activeList.push("razorpay");
            if (data.settings.stripeActive === "true") activeList.push("stripe");
            if (data.settings.cashfreeActive === "true") activeList.push("cashfree");
            
            if (activeList.length === 0) activeList.push("payu");
            setAllowedGateways(activeList);
            
            // Default select the first active provider
            const preferred = isNriMode ? "stripe" : "payu";
            if (activeList.includes(preferred as PaymentProvider)) {
              setPaymentProvider(preferred as PaymentProvider);
            } else {
              setPaymentProvider(activeList[0]);
            }

            // Security deposit settings
            setSecurityDepositActive(data.settings.securityDepositActive === "true");
            if (data.settings.securityDepositAmount) {
              setSecurityDepositAmount(data.settings.securityDepositAmount);
            }

            // GST & Accessory settings
            if (data.settings.receiptGstin) {
              setReceiptGstin(data.settings.receiptGstin);
            }
            if (data.settings.receiptCompanyAddress) {
              setReceiptCompanyAddress(data.settings.receiptCompanyAddress);
            }
            setAccessoryHelmetActive(data.settings.accessoryHelmetActive === "true");
            if (data.settings.accessoryHelmetPrice) {
              setAccessoryHelmetPrice(Number(data.settings.accessoryHelmetPrice));
            }
            setAccessoryGpsActive(data.settings.accessoryGpsActive === "true");
            if (data.settings.accessoryGpsPrice) {
              setAccessoryGpsPrice(Number(data.settings.accessoryGpsPrice));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load discount settings:", e);
      }
    }
    async function loadActiveCities() {
      try {
        const res = await fetch("/api/cities");
        if (res.ok) {
          const data = await res.json();
          if (data.cities) {
            setCityOptions(data.cities.map((c: any) => c.displayName || c.name));
          }
        }
      } catch (e) {
        console.error("Failed to load active cities:", e);
      }
    }
    loadSettings();
    loadActiveCities();
  }, []);

  // Auto-search and pre-select vehicle when vehicleId + city are passed via URL
  useEffect(() => {
    const preCity = searchParams.get("city");
    const preVehicleId = searchParams.get("vehicleId");
    if (preVehicleId || preCity) {
      setIsLoadingPrefilled(true);
      void (async () => {
        try {
          const params = new URLSearchParams();
          if (preCity) params.set("city", preCity);
          if (preVehicleId) params.set("vehicleId", preVehicleId);
          const res = await fetch(`/api/vehicles?${params.toString()}`);
          const data = await res.json();
          const list: Vehicle[] = data.vehicles ?? [];
          
          // If a specific vehicleId was requested, find and select it
          if (preVehicleId) {
            const sorted = [...list].sort((a, b) =>
              a.id === preVehicleId ? -1 : b.id === preVehicleId ? 1 : 0
            );
            setVehicles(sorted);
            const matched = list.find((v) => v.id === preVehicleId);
            if (matched) {
              setSelectedVehicle(matched);
              if (matched.city) setCity(matched.city);
              setMessage("");
            } else {
              setMessage(`Found ${list.length} vehicles.`);
            }
          } else {
            setVehicles(list);
            setMessage(`Found ${list.length} vehicles.`);
          }
        } catch (e) {
          console.error("Failed to load prefilled vehicle:", e);
        } finally {
          setIsLoadingPrefilled(false);
        }
      })();
    } else {
      setIsLoadingPrefilled(false);
    }
  }, [searchParams]);

  // Handle PayU / External Gateway redirect response on booking page
  useEffect(() => {
    const payment = searchParams.get("payment");
    const bId = searchParams.get("bookingId");
    if (payment === "success" && bId) {
      setSelectedVehicle(null);
      setSuccessBookingId(bId);
      setMessage(`✅ Payment successful! Booking ${formatBookingId(bId, city, startDate)} confirmed. Confirmation sent on email + WhatsApp.`);
      fetchHistory();
      setTimeout(() => {
        const el = document.getElementById("payu-confirmation-scroll");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          window.scrollTo({ top: 400, behavior: "smooth" });
        }
      }, 400);
    } else if (payment === "failed") {
      setSelectedVehicle(null);
      const reason = searchParams.get("reason") || "Payment was cancelled or could not be processed.";
      setMessage(`Payment cancelled: ${reason}`);
    }
  }, [searchParams, city, startDate]);

  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    bookingId: string;
    amountINR: number;
  } | null>(null);

  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, endDate]);

  const availableCount = useMemo(() => {
    if (!selectedVehicle) return 1;
    const matchingVehicles = vehicles.filter(
      (v) =>
        v.title.toLowerCase() === selectedVehicle.title.toLowerCase() &&
        v.vendorId === selectedVehicle.vendorId &&
        (v.availabilityStatus ?? "available") === "available"
    );
    return Math.max(1, matchingVehicles.length);
  }, [selectedVehicle, vehicles]);

  useEffect(() => {
    if (quantity > availableCount) {
      setQuantity(availableCount);
    }
  }, [availableCount, quantity]);

  const useHourly = useMemo(() => {
    return Boolean(startDate && endDate && startDate === endDate);
  }, [startDate, endDate]);

  const rentalHours = useMemo(() => {
    if (!useHourly) return 0;
    return calculateHours(startDate, endDate, startTime, endTime);
  }, [useHourly, startDate, endDate, startTime, endTime]);

  const hourlyRateLabel = useMemo(() => {
    if (!selectedVehicle) return "";
    const defaultHourly = Math.max(1, Math.round(selectedVehicle.pricePerDayINR / 24));
    const hours = rentalHours;
    if (hours <= 1) {
      const rate = selectedVehicle.price1HrINR ?? defaultHourly;
      return `${toCurrency(rate, "INR")} / hour`;
    }
    if (hours <= 3) {
      if (selectedVehicle.price3HrINR !== null && selectedVehicle.price3HrINR !== undefined) {
        return `${toCurrency(selectedVehicle.price3HrINR, "INR")} / 3 hours`;
      }
      const rate = selectedVehicle.price1HrINR ? selectedVehicle.price1HrINR * hours : hours * defaultHourly;
      return `${toCurrency(rate, "INR")} / ${hours} hours`;
    }
    if (hours <= 6) {
      if (selectedVehicle.price6HrINR !== null && selectedVehicle.price6HrINR !== undefined) {
        return `${toCurrency(selectedVehicle.price6HrINR, "INR")} / 6 hours`;
      }
      const rate = selectedVehicle.price3HrINR ? selectedVehicle.price3HrINR * Math.ceil(hours / 3) : hours * defaultHourly;
      return `${toCurrency(rate, "INR")} / ${hours} hours`;
    }
    if (hours <= 12) {
      if (selectedVehicle.price12HrINR !== null && selectedVehicle.price12HrINR !== undefined) {
        return `${toCurrency(selectedVehicle.price12HrINR, "INR")} / 12 hours`;
      }
      const rate = selectedVehicle.price6HrINR ? selectedVehicle.price6HrINR * Math.ceil(hours / 6) : hours * defaultHourly;
      return `${toCurrency(rate, "INR")} / ${hours} hours`;
    }
    return `${toCurrency(selectedVehicle.pricePerDayINR, "INR")} / day`;
  }, [selectedVehicle, rentalHours]);

  // Client side discount calculations
  const durationDiscount = useMemo(() => {
    if (!selectedVehicle || useHourly) return 0;
    if (rentalDays >= discountSettings.durationDiscountMinDays) {
      return discountSettings.durationDiscountFreeDays * selectedVehicle.pricePerDayINR;
    }
    return 0;
  }, [selectedVehicle, rentalDays, discountSettings, useHourly]);

  const totalBaseBeforeBulk = useMemo(() => {
    if (!selectedVehicle) return 0;
    if (useHourly) {
      const hourlyBaseCost = calculateHourlyBaseCost(selectedVehicle, rentalHours);
      return hourlyBaseCost * quantity;
    }
    const dailyBaseCost = calculateDailyVehicleCost(selectedVehicle, startDate, endDate);
    return (dailyBaseCost - durationDiscount) * quantity;
  }, [selectedVehicle, useHourly, rentalHours, startDate, endDate, durationDiscount, quantity]);

  const bulkDiscount = useMemo(() => {
    if (!selectedVehicle) return 0;
    if (quantity >= discountSettings.multiVehicleMinQty) {
      return Math.floor((totalBaseBeforeBulk * discountSettings.multiVehicleDiscountPercent) / 100);
    }
    return 0;
  }, [selectedVehicle, quantity, totalBaseBeforeBulk, discountSettings]);

  const addonsCost = useMemo(() => {
    const units = useHourly ? rentalHours : rentalDays;
    let cost = 0;
    addons.forEach((addonId) => {
      if (addonId === "waiver") {
        const dailyWaiver = selectedVehicle?.addonWaiverPrice ?? 99;
        const rate = useHourly ? Math.ceil(dailyWaiver / 10) : dailyWaiver;
        cost += rate * units * quantity;
      } else if (addonId === "rsa") {
        const dailyRsa = selectedVehicle?.addonRsaPrice ?? 49;
        const rate = useHourly ? Math.ceil(dailyRsa / 10) : dailyRsa;
        cost += rate * units * quantity;
      } else if (addonId === "helmet") {
        const rate = selectedVehicle?.addonHelmetPrice ?? 50;
        cost += rate * quantity;
      } else {
        const addOn = bookingAddOns.find((item) => item.id === addonId);
        if (addOn) {
          const rate = useHourly ? addOn.pricePerHourINR : addOn.pricePerDayINR;
          cost += rate * units * quantity;
        }
      }
    });
    return cost;
  }, [addons, useHourly, rentalHours, rentalDays, quantity, selectedVehicle]);

  const accessoriesCost = useMemo(() => {
    let cost = 0;
    const days = Math.max(1, rentalDays);
    const qty = Math.max(1, quantity);
    if (selectHelmet) {
      cost += accessoryHelmetPrice * days * qty;
    }
    if (selectGps) {
      cost += accessoryGpsPrice * days * qty;
    }
    return cost;
  }, [selectHelmet, selectGps, accessoryHelmetPrice, accessoryGpsPrice, rentalDays, quantity]);

  const finalEstimatedPrice = useMemo(() => {
    return totalBaseBeforeBulk - bulkDiscount + addonsCost + accessoriesCost;
  }, [totalBaseBeforeBulk, bulkDiscount, addonsCost, accessoriesCost]);

  async function startLiveRazorpayPayment(params: {
    bookingId: string;
    amountINR: number;
    order?: RazorpayOrder;
    keyId?: string;
  }) {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || params.keyId;
    if (!key) {
      setMessage("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID. Add it to environment and redeploy.");
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (!existing) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
        document.body.appendChild(script);
      });
    }

    const Razorpay = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
    if (!Razorpay) {
      setMessage("Razorpay SDK unavailable. Please refresh and try again.");
      return;
    }

    const logoUrl =
      process.env.NEXT_PUBLIC_RAZORPAY_LOGO_URL?.trim() ||
      `${window.location.origin}/Logo1.png?v=1`;

    let verifiedInHandler = false;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const verifyOrderStatus = async () => {
      if (!params.order?.id) return false;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const verifyResponse = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "razorpay",
            razorpayOrderId: params.order.id,
          }),
        });

        const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
          verified?: boolean;
          status?: string;
          error?: string;
        };

        if (verifyResponse.ok && verifyData.verified && verifyData.status === "PAID") {
          setMessage(`✅ Payment successful! Booking ${formatBookingId(params.bookingId, city, startDate)} confirmed. Confirmation sent on email + WhatsApp.`);
          setSuccessBookingId(params.bookingId);
          await fetchHistory();
          return true;
        }

        if (attempt < 4) {
          await wait(2000);
        }
      }
      return false;
    };

    const options: any = {
      key,
      amount: params.order?.amount ?? params.amountINR * 100,
      currency: params.order?.currency ?? "INR",
      name: "Next Gear Rentals",
      description: `Booking ${params.bookingId}`,
      image: logoUrl,
      prefill: {
        name: fullName,
        email,
        contact: phone,
      },
      theme: {
        color: "#10b981",
      },
      handler: async (response: RazorpayResponse) => {
        try {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "razorpay",
              orderId: `standard_rzp_${params.bookingId}`,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
            verified?: boolean;
            status?: string;
            error?: string;
          };
          if (!verifyResponse.ok || !verifyData.verified || verifyData.status !== "PAID") {
            setMessage(verifyData.error ?? "Payment verification failed. Please contact support.");
            return;
          }

          verifiedInHandler = true;
          setMessage(`✅ Payment successful! Booking ${formatBookingId(params.bookingId, city, startDate)} confirmed. Confirmation sent on email + WhatsApp.`);
          setSuccessBookingId(params.bookingId);
          await fetchHistory();
        } catch {
          setMessage("Verifying payment... please wait a few seconds.");
          const verified = await verifyOrderStatus();
          if (!verified) {
            setMessage("Payment status is pending. If amount is deducted, it will auto-confirm shortly.");
          }
        }
      },
      modal: {
        ondismiss: async () => {
          if (verifiedInHandler) return;
          setMessage("Checking payment status...");
          const verified = await verifyOrderStatus();
          if (!verified) {
            setMessage("Payment cancelled or pending. Your booking is reserved for 10 minutes.");
          }
        },
      },
    };

    if (params.order?.id) {
      options.order_id = params.order.id;
    }

    const checkout = new Razorpay(options);
    checkout.open();
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode using Nominatim
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await geoResponse.json();
          
          const addressCity = geoData.address?.city || geoData.address?.town || geoData.address?.village || "";
          const addressState = geoData.address?.state || "";
          const addressCounty = geoData.address?.county || "";
          const addressSuburb = geoData.address?.suburb || geoData.address?.neighbourhood || geoData.address?.city_district || "";
          
          const detectedAreaName = addressSuburb || addressCity || addressCounty || "Your Location";

          // Smart matching helper to map geographic location to supported fleet cities
          const findBestMatch = () => {
            const dc = addressCity.toLowerCase().trim();
            const ds = addressState.toLowerCase().trim();
            const dco = addressCounty.toLowerCase().trim();
            const dsub = addressSuburb.toLowerCase().trim();

            // 1. Direct or partial substring matching in available options
            for (const option of cityOptions) {
              const opt = option.toLowerCase();
              if (opt === dc || opt.includes(dc) || dc.includes(opt)) {
                return option;
              }
              if (dsub && (opt.includes(dsub) || dsub.includes(opt))) {
                return option;
              }
            }

            // 2. Specific state/suburb heuristics for Indian metro hubs
            if (
              ds.includes("delhi") || 
              dc.includes("delhi") || 
              dco.includes("delhi") || 
              dsub.includes("delhi") ||
              dc.includes("noida") || 
              dc.includes("gurugram") || 
              dc.includes("gurgaon") || 
              dc.includes("ghaziabad") || 
              dc.includes("faridabad")
            ) {
              const match = cityOptions.find(o => o.toLowerCase().includes("delhi"));
              if (match) return match;
            }

            if (
              ds.includes("maharashtra") || 
              dc.includes("mumbai") || 
              dco.includes("mumbai") || 
              dsub.includes("mumbai") ||
              dc.includes("thane") || 
              dc.includes("navi mumbai")
            ) {
              const match = cityOptions.find(o => o.toLowerCase().includes("mumbai"));
              if (match) return match;
            }

            if (
              ds.includes("karnataka") || 
              dc.includes("bengaluru") || 
              dc.includes("bangalore") || 
              dco.includes("bengaluru") || 
              dsub.includes("bengaluru")
            ) {
              const match = cityOptions.find(o => o.toLowerCase().includes("bengaluru") || o.toLowerCase().includes("bangalore"));
              if (match) return match;
            }

            if (
              ds.includes("goa") || 
              dc.includes("goa") || 
              dco.includes("goa") || 
              dsub.includes("goa") ||
              dc.includes("panaji") || 
              dc.includes("vasco")
            ) {
              const match = cityOptions.find(o => o.toLowerCase().includes("goa"));
              if (match) return match;
            }

            return null;
          };

          const matchedCity = findBestMatch();
          
          if (matchedCity) {
            setCity(matchedCity);
            setMessage(`📍 Detected location matched to supported service hub: ${matchedCity}`);
          } else if (addressCity) {
            const displayArea = detectedAreaName.split(",")[0].trim();
            setCity(displayArea);
            setMessage(`📍 Detected: ${displayArea} (We don't have vehicle fleets here yet)`);
          } else {
            setMessage("📍 Location detected but undetermined.");
          }
        } catch (error) {
          console.warn("Reverse geocoding error:", error);
          setMessage("Could not determine city from location. Please enter manually.");
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsDetectingLocation(false);
        alert("Unable to detect location. Please type manually.");
      }
    );
  };

  async function searchVehicles(event: FormEvent) {
    event.preventDefault();
    setMessage("Searching available vehicles...");

    const params = new URLSearchParams({ city, startDate, endDate });
    if (startTime) params.set("startTime", startTime);
    if (endTime) params.set("endTime", endTime);
    if (type) params.set("type", type);

    const response = await fetch(`/api/vehicles?${params.toString()}`);
    const data = await response.json();
    setVehicles(data.vehicles ?? []);
    setMessage(`Found ${data.vehicles?.length ?? 0} vehicles.`);
  }

  async function createBooking(vehicleId: string) {
    setBookingVehicleId(vehicleId);
    try {
      const errors: string[] = [];
      if (!fullName.trim()) errors.push("Full Name is required.");
      if (!email.trim() || !email.includes("@")) errors.push("A valid Email Address is required.");
      if (!phone.trim()) errors.push("Phone Number is required.");

      if (!isDigiLockerVerified) {
        if (verificationMode === "digilocker") {
          errors.push("DigiLocker verification is not completed (or select Manual Upload).");
        } else {
          if (!dlFileName) errors.push("Driving License Front page upload is missing.");
          else if (!drivingLicenseNo) errors.push("Driving License number verification is missing.");

          if (!govFileName) errors.push("Aadhaar Card Front page upload is missing.");
          else if (!governmentIdNo) errors.push("Aadhaar ID number verification is missing.");

          if (!govBackFileName) errors.push("Aadhaar Card Back page upload is missing.");
        }
      }

      if (isNriMode && !nriChecklistAccepted) {
        errors.push("NRI document acceptance checkbox is required.");
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setBookingVehicleId("");
        return;
      }

      setMessage("Confirming your booking...");

      const submissionAddons = [...addons];
      if (selectHelmet) submissionAddons.push("extra_helmet");
      if (selectGps) submissionAddons.push("anti_theft_gps");

      const currentBody = JSON.stringify({
        vehicleId,
        userName: fullName,
        userEmail: email,
        city,
        startDate,
        endDate,
        startTime,
        endTime,
        addons: submissionAddons,
        currency: "INR",
        timezone,
        couponCode: promoCode.trim() || undefined,
        referralCode: promoCode.trim() || undefined,
        isNri: isNriMode,
        internationalCardPreferred: isNriMode,
        quantity,
        paymentProvider,
        paymentOption,
        kyc: {
          phone,
          drivingLicenseNo,
          governmentIdNo,
          drivingLicenseFileName: drivingLicenseFile?.name || "dl_verified.pdf",
          governmentIdFileName: governmentIdFile?.name || "gov_verified.pdf",
          governmentIdBackFileName: governmentIdBackFile?.name || "gov_back_verified.pdf",
        },
      });

      // Use pre-warmed response if params match (user didn't change anything)
      let response: Response;
      if (preWarmRef.current && preWarmParamsRef.current === currentBody) {
        setMessage("Opening payment gateway...");
        response = await preWarmRef.current;
        // Clone so we can read the body (Response body can only be consumed once)
        response = response.clone();
        preWarmRef.current = null;
        preWarmParamsRef.current = null;
      } else {
        // Params changed (user switched provider/option after step 2) — fresh call
        preWarmRef.current = null;
        response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: currentBody,
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        setMessage(errData.error || "Booking creation failed. Please check details or choose another date.");
        setBookingVehicleId(null);
        return;
      }

      const data = await response.json();
      const bookingId = data.booking.id as string;
      const subtotalAmountINR = Number(data.booking.subtotalAmountINR ?? data.booking.totalAmountINR);
      const couponDiscountINR = Number(data.booking.couponDiscountINR ?? 0);
      const referralDiscountINR = Number(data.booking.referralDiscountINR ?? 0);
      const totalDiscountINR = couponDiscountINR + referralDiscountINR;

      const amountToPay = paymentOption === "full" ? data.booking.totalAmountINR : calculateBookingAmount(data.booking.totalAmountINR);

      // ⚡ Official PayU Live Gateway — Top-Level Direct Submission (No Iframe PNA Block)
      if (paymentProvider === "payu" && data.payuCheckout?.actionUrl && data.payuCheckout?.payuParams) {
        setMessage("⚡ Opening PayU Secure Gateway...");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.payuCheckout.actionUrl;
        form.target = "_self";
        form.style.display = "none";

        Object.entries(data.payuCheckout.payuParams).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(v);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // For other providers (stripe, paypal, cashfree) — call checkout endpoint
      if (paymentProvider === "stripe" || paymentProvider === "paypal" || paymentProvider === "cashfree") {
        const checkout = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: paymentProvider,
            amountINR: amountToPay,
            currency: "INR",
            bookingId,
          }),
        });

        if (!checkout.ok) {
          const checkoutErr = await checkout.json().catch(() => ({})) as { error?: string; details?: string };
          const errorMessage = checkoutErr.details
            ? `${checkoutErr.error ?? "Payment initialisation failed"}: ${checkoutErr.details}`
            : (checkoutErr.error ?? "Payment initialisation failed. Your booking was created but payment is incomplete.");
          setMessage(errorMessage);
          return;
        }

        const paymentData = await checkout.json();
        const paymentMode = paymentData.mode ? ` (${paymentData.mode})` : "";
        setMessage(
          `Booking confirmed: ${formatBookingId(bookingId, city, startDate)}. Payment provider: ${paymentProvider}${paymentMode}. ${totalDiscountINR > 0 ? `You saved ₹${totalDiscountINR} (subtotal ₹${subtotalAmountINR}, payable ₹${data.booking.totalAmountINR}). ` : ""}Confirmation shared on email + WhatsApp.`,
        );
        await fetchHistory();
      }
    } catch {
      setMessage("Something went wrong while starting booking. Please try again.");
    } finally {
      setBookingVehicleId(null);
    }
  }

  async function fetchHistory() {
    const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    setBookings(data.bookings ?? []);
  }

  function handleSelectVehicle(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setCity(vehicle.city);
    setMessage("");
    setTimeout(() => {
      document.getElementById("booking-details-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function handleConfirmSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    await createBooking(selectedVehicle.id);
  }

  const handleManualUpload = async (file: File, documentType: "aadhaar" | "aadhaar-back" | "license") => {
    const isDl = documentType === "license";
    const isGovBack = documentType === "aadhaar-back";
    
    const setUploading = isDl ? setIsUploadingDl : (isGovBack ? setIsUploadingGovBack : setIsUploadingGov);
    const setFileName = isDl ? setDlFileName : (isGovBack ? setGovBackFileName : setGovFileName);
    const setProgress = isDl ? setDlUploadProgress : (isGovBack ? setGovBackUploadProgress : setGovUploadProgress);
    const setMessageStr = isDl ? setDlUploadMessage : (isGovBack ? setGovBackUploadMessage : setGovUploadMessage);
    const setDocNo = isDl ? setDrivingLicenseNo : (isGovBack ? (() => {}) : setGovernmentIdNo);

    setUploading(true);
    setFileName(file.name);
    setProgress(0);
    setMessageStr("Uploading document securely...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress < 90) {
          setProgress(progress);
          if (progress === 20) setMessageStr("Establishing secure tunnel...");
          if (progress === 50) {
            setMessageStr(isGovBack ? "Uploading metadata payload..." : "Processing OCR character layout extraction...");
          }
          if (progress === 80) setMessageStr("Validating government checksums...");
        }
      }, 150);

      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setDocNo(data.extractedData.documentNumber);
      setMessageStr("Verification Complete!");
    } catch (err: any) {
      console.error(err);
      setMessageStr(err.message || "Extraction failed. Please type manually.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDLDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDrivingLicenseFile(file);
      handleManualUpload(file, "license");
    }
  };

  const handleGovDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setGovernmentIdFile(file);
      handleManualUpload(file, "aadhaar");
    }
  };

  const handleGovBackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setGovernmentIdBackFile(file);
      handleManualUpload(file, "aadhaar-back");
    }
  };

  if (isLoadingPrefilled) {
    return (
      <section className="fade-up space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white relative overflow-hidden animate-pulse">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 bg-white/20 rounded" />
          <div className="h-8 w-48 bg-white/20 rounded" />
          <div className="h-4 w-64 bg-white/20 rounded" />
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-32 bg-white/10 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </section>
    );
  }

  if (message && message.startsWith("✅") && successBookingId) {
    return (
      <div className="fade-up space-y-8 text-white max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-6 md:p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl animate-bounce">
            🎉
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-display uppercase">Booking Confirmed!</h2>
          <p className="text-sm text-emerald-400/90 font-medium leading-relaxed max-w-lg mx-auto">
            {message}
          </p>
        </div>

        {/* Main Columns: QR Code + Vehicle Details */}
        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Column 1: QR Code & Pickup Hub Address */}
          <div className="md:col-span-5 bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 text-center space-y-5 shadow-xl">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white/90">Your Handover QR Code</h3>
              <p className="text-[10px] text-white/50 mt-1">Show this QR to the vendor at the hub to pick up your bike.</p>
            </div>
            <div className="relative inline-block mx-auto bg-white p-4 rounded-2xl shadow-lg border-2 border-white/10">
              {/* The QR Code */}
              <img
                src={`https://quickchart.io/qr?text=${encodeURIComponent(
                  `${window.location.origin}/dashboard/scan-booking?id=${successBookingId}&source=qr`
                )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=180&ecLevel=Q`}
                alt="Booking Pickup QR Code"
                width={180}
                height={180}
                className="mx-auto"
              />
            </div>
            <p className="text-[10px] font-mono text-white/40">ID: {formatBookingId(successBookingId || "", city, startDate)}</p>
            <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={async () => {
                  try {
                    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
                      `${window.location.origin}/dashboard/scan-booking?id=${successBookingId}&source=qr`
                    )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=400&ecLevel=Q`;
                    
                    // Load QR Code Image
                    const qrImg = new Image();
                    qrImg.crossOrigin = "anonymous";
                    qrImg.src = qrUrl;
                    
                    await new Promise((resolve) => { qrImg.onload = resolve; });
                    
                    // Create Canvas
                    const canvas = document.createElement("canvas");
                    canvas.width = 400;
                    canvas.height = 400;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    
                    // Draw QR Code
                    ctx.drawImage(qrImg, 0, 0, 400, 400);
                    
                    // Download
                    const dataUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `nextgear-booking-${successBookingId}-qr.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (error) {
                    console.error("Failed to download QR Code:", error);
                    window.open(`https://quickchart.io/qr?text=${encodeURIComponent(
                      `${window.location.origin}/dashboard/scan-booking?id=${successBookingId}`
                    )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=400&ecLevel=Q`, "_blank");
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 shadow-md cursor-pointer flex-1"
              >
                <span>📥</span> Download QR
              </button>
              <button
                onClick={() => {
                  if (selectedVehicle && successBookingId) {
                    void downloadOfflinePass({
                      id: successBookingId,
                      customerName: fullName,
                      customerPhone: phone,
                      vehicleTitle: selectedVehicle.title,
                      cityName: city,
                      startDate: `${startDate} ${startTime}`,
                      endDate: `${endDate} ${endTime}`,
                      totalAmountINR: finalEstimatedPrice,
                      vehicleType: selectedVehicle.type,
                      vehicleImage: selectedVehicle.imageUrls?.[0] || "",
                      rentalDays: rentalDays,
                      useHourly: useHourly,
                      rentalHours: rentalHours,
                      airportPickup: selectedVehicle.airportPickup,
                    });
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--brand-red)] hover:bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 shadow-md cursor-pointer flex-1"
              >
                <span>🎫</span> Download Receipt
              </button>
            </div>
            
            {/* Hub Pickup Address */}
            <div className="border-t border-white/5 pt-4 text-left space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 block">📍 Pickup Hub Location</span>
              <p className="text-xs font-bold text-white/90">Next Gear Delhi Hub</p>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Terminal 1, Indira Gandhi International Airport (IGI Airport Metro Gate 2), New Delhi - 110037.
              </p>
              <p className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1">
                <span>🕒</span> Timings: 24/7 Operational
              </p>
            </div>
          </div>

          {/* Column 2: Assigned Vehicle & Bill Summary */}
          <div className="md:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white/90 border-b border-white/5 pb-2">Assigned Vehicle & Summary</h3>
            
            {selectedVehicle && (
              <div className="space-y-1">
                <p className="text-lg font-black text-white">🏍️ {selectedVehicle.title}</p>
                <p className="text-xs text-white/40 uppercase font-bold tracking-wider">{selectedVehicle.type} · {selectedVehicle.fuel} · {selectedVehicle.transmission}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
              <div>
                <span className="text-white/40">Pickup Date & Time</span>
                <p className="font-semibold text-white/90 mt-0.5">{startDate ? formatDateDisplay(startDate) : ""} at {startTime}</p>
              </div>
              <div>
                <span className="text-white/40">Return Date & Time</span>
                <p className="font-semibold text-white/90 mt-0.5">{endDate ? formatDateDisplay(endDate) : ""} at {endTime}</p>
              </div>
              <div>
                <span className="text-white/40">Rental Duration</span>
                <p className="font-semibold text-white/90 mt-0.5">
                  {useHourly ? `${rentalHours} hours` : `${rentalDays} day${rentalDays !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div>
                <span className="text-white/40">Quantity Booked</span>
                <p className="font-semibold text-white/90 mt-0.5">{quantity} vehicle(s)</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-white/40 block">Total Paid (INR)</span>
                <span className="text-2xl font-black text-emerald-400">
                  {selectedVehicle ? toCurrency(selectedVehicle.pricePerDayINR * (useHourly ? 1 : rentalDays) * quantity, "INR") : ""}
                </span>
              </div>
              <a
                href="/dashboard/customer"
                className="rounded-xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Live GPS Driver Handoff Tracking Panel */}
        <div className="mt-8 text-black">
          <DeliveryTrackingPanel bookingId={successBookingId} />
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="fade-up space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white relative overflow-hidden pb-28 sm:pb-6">
      
      {/* Dynamic Aesthetic Styles Tag */}
      <style>{`
        @keyframes glowingBorder {
          0% { border-color: rgba(127, 29, 29, 0.6); box-shadow: 0 0 8px rgba(239, 68, 68, 0.05); }
          50% { border-color: rgba(239, 68, 68, 0.35); box-shadow: 0 0 16px rgba(239, 68, 68, 0.15); }
          100% { border-color: rgba(127, 29, 29, 0.6); box-shadow: 0 0 8px rgba(239, 68, 68, 0.05); }
        }
        .glowing-selection-card {
          animation: glowingBorder 4s infinite ease-in-out;
        }
        .interactive-input {
          transition: all 0.3s ease;
        }
        .interactive-input:focus {
          border-color: #e10600 !important;
          box-shadow: 0 0 10px rgba(225, 6, 0, 0.3) !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        .price-custom-green {
          color: #008000 !important;
        }
        .price-glow {
          text-shadow: none !important;
        }
      `}</style>

      {showDigiLocker && (
        <MockDigiLockerModal
          defaultPhone={phone}
          defaultName={fullName}
          onDismiss={() => setShowDigiLocker(false)}
          onSuccess={(data) => {
            setShowDigiLocker(false);
            setIsDigiLockerVerified(true);
            setFullName(data.fullName);
            setDrivingLicenseNo(data.drivingLicenseNo);
            setGovernmentIdNo(data.governmentIdNo);
            setDrivingLicenseFile(new File([""], data.drivingLicenseFileName, { type: "application/pdf" }));
            setGovernmentIdFile(new File([""], data.governmentIdFileName, { type: "application/pdf" }));
          }}
        />
      )}

      {pendingPayment && (
        <MockRazorpayModal
          orderId={pendingPayment.orderId}
          amount={pendingPayment.amountINR}
          bookingId={pendingPayment.bookingId}
          onSuccess={async () => {
            const bookingId = pendingPayment.bookingId;
            setPendingPayment(null);
            setMessage(`✅ Payment successful! Booking ${formatBookingId(bookingId, city, startDate)} confirmed. Confirmation sent on email + WhatsApp.`);
            setSuccessBookingId(bookingId);
            await fetchHistory();
          }}
          onDismiss={() => {
            setPendingPayment(null);
            setMessage("Payment cancelled. Your booking is reserved for 10 minutes.");
          }}
        />
      )}

      {selectedVehicle ? (
        // Mode A: Vehicle Selected - Detailed Form Mode
        <div className="space-y-6">
          {/* Mobile Step Progress Indicator */}
          <div className="flex sm:hidden items-center justify-between px-1 py-1 mb-2">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-wider">Step {checkoutStep} of 3</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    stepNum === checkoutStep
                      ? "w-8 bg-[var(--brand-red)]"
                      : stepNum < checkoutStep
                      ? "w-3 bg-green-500"
                      : "w-3 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className={`rounded-3xl bg-transparent sm:bg-black p-0 sm:p-6 shadow-none sm:shadow-xl relative overflow-visible sm:overflow-hidden ${
            checkoutStep === 1 ? "block" : "hidden sm:block"
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-4 border-b border-white/5">
              {/* Left Column: Selected Vehicle details */}
              <div>
                <span className="inline-block rounded-full bg-red-950/60 px-3 py-1 text-xs font-bold text-red-400 border border-red-800/30">
                  SELECTED VEHICLE
                </span>
                <h3 className="mt-2 text-xl font-bold font-display uppercase tracking-wide text-white">{selectedVehicle.title}</h3>
                <p className="text-xs text-white/50 mt-1">
                  📍 {selectedVehicle.city} · ⛽ {selectedVehicle.fuel} · ⚙️ {selectedVehicle.transmission} · 👤 {selectedVehicle.seats} seats
                </p>
              </div>

              {/* Middle Column: Add-ons (Optional) */}
              <div>
                <p className="text-xs text-white/40 uppercase font-semibold">Add-ons (Optional)</p>
                 {/* Desktop View: Original simple checkbox list */}
                 <div className="hidden md:flex flex-col gap-1.5 text-xs text-white/80 mt-2">
                   {addonWaiverActive && (
                     <label className="flex items-center gap-2 cursor-pointer hover:text-white transition duration-200">
                       <input
                         type="checkbox"
                         checked={addons.includes("waiver")}
                         onChange={() => toggleAddon("waiver")}
                         className="rounded border-white/20 bg-white/5 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[var(--brand-red)]"
                       />
                       <span>Damage Waiver (₹{selectedVehicle?.addonWaiverPrice ?? 99}/day)</span>
                     </label>
                   )}
                   {addonRsaActive && (
                     <label className="flex items-center gap-2 cursor-pointer hover:text-white transition duration-200">
                       <input
                         type="checkbox"
                         checked={addons.includes("rsa")}
                         onChange={() => toggleAddon("rsa")}
                         className="rounded border-white/20 bg-white/5 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[var(--brand-red)]"
                       />
                       <span>Roadside Assist (₹{selectedVehicle?.addonRsaPrice ?? 49}/day)</span>
                     </label>
                   )}
                   {addonHelmetActive && (
                     <label className="flex items-center gap-2 cursor-pointer hover:text-white transition duration-200">
                       <input
                         type="checkbox"
                         checked={addons.includes("helmet")}
                         onChange={() => toggleAddon("helmet")}
                         className="rounded border-white/20 bg-white/5 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[var(--brand-red)]"
                       />
                       <span>Extra Helmet (₹{selectedVehicle?.addonHelmetPrice ?? 50} flat)</span>
                     </label>
                   )}
                   
                   <button
                     type="button"
                     onClick={() => setShowAddGearModal(true)}
                     className="mt-2 text-left text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors duration-200 cursor-pointer flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 w-fit"
                   >
                     <span>➕ Add More Gear</span>
                   </button>
                 </div>

                 {/* Mobile View: Premium Select Cards */}
                 <div className="flex md:hidden flex-col gap-2.5 mt-2">
                   {[
                     addonWaiverActive ? { id: "waiver", emoji: "🛡️", label: "Damage Waiver", price: `₹${selectedVehicle?.addonWaiverPrice ?? 99}/day` } : null,
                     addonRsaActive ? { id: "rsa", emoji: "🆘", label: "Roadside Assist", price: `₹${selectedVehicle?.addonRsaPrice ?? 49}/day` } : null,
                     addonHelmetActive ? { id: "helmet", emoji: "🪖", label: "Extra Helmet", price: `₹${selectedVehicle?.addonHelmetPrice ?? 50} flat` } : null,
                   ].filter(Boolean).map((item) => {
                     const active = addons.includes(item.id);
                     return (
                       <div
                         key={item.id}
                         onClick={() => toggleAddon(item.id)}
                         className={`rounded-xl border p-3 flex items-center justify-between cursor-pointer transition-all duration-300 active:scale-95 select-none ${
                           active
                             ? "bg-[var(--brand-red)]/10 border-[var(--brand-red)] shadow-[0_0_15px_rgba(225,29,72,0.15)] text-white"
                             : "bg-white/[0.02] border-white/10 text-white/70 hover:text-white"
                         }`}
                       >
                         <div className="flex items-center gap-2.5">
                           <span className="text-lg">{item.emoji}</span>
                           <div className="text-left">
                             <p className="text-xs font-bold text-white">{item.label}</p>
                             <p className="text-[10px] text-white/40 font-medium mt-0.5">{item.price}</p>
                           </div>
                         </div>
                         <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                           active ? "border-[var(--brand-red)] bg-[var(--brand-red)]" : "border-white/20 bg-transparent"
                         }`}>
                           {active && (
                             <span className="text-[10px] text-white font-bold">✓</span>
                           )}
                         </div>
                       </div>
                     );
                   })}

                   <button
                     type="button"
                     onClick={() => setShowAddGearModal(true)}
                     className="w-full justify-center text-center text-xs font-bold text-red-400 hover:text-red-300 transition-colors duration-200 cursor-pointer flex items-center gap-1.5 bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/10"
                   >
                     <span>➕ Add More Gear</span>
                   </button>
                 </div>

                  {/* Selected extra gears list */}
                  {addons.some(id => !["waiver", "rsa", "helmet"].includes(id)) && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Additional Gear Added:</p>
                      {addons.map((id) => {
                        if (["waiver", "rsa", "helmet"].includes(id)) return null;
                        const addOn = bookingAddOns.find(item => item.id === id);
                        if (!addOn) return null;
                        const isFlat = addOn.id === "mount" || addOn.id === "cam-mount";
                        return (
                          <div key={id} className="flex items-center justify-between text-[10px] text-white/80 bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl px-2.5 py-1.5 transition">
                            <span className="truncate pr-1">
                              {addOn.label} ({toCurrency(useHourly ? addOn.pricePerHourINR : addOn.pricePerDayINR, "INR")}{isFlat ? " flat" : useHourly ? "/hour" : "/day"})
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleAddon(id)}
                              className="text-red-400 hover:text-red-300 font-bold px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>

              {/* Right Column: Daily rate & change vehicle */}
              <div className="flex flex-col items-start md:items-end gap-1.5 text-left md:text-right">
                <span className="font-extrabold text-white text-lg">
                  {useHourly ? hourlyRateLabel : `${toCurrency(selectedVehicle.pricePerDayINR, "INR")} / day`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Change vehicle
                </button>
              </div>
            </div>


            <div className="mt-4 grid gap-6 grid-cols-1 md:grid-cols-2 text-sm">
              {/* Column 1: Dates & Location (Styled as a premium summary card on mobile) */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3.5 sm:border-0 sm:bg-transparent sm:p-0 sm:space-y-4">
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span>📅</span> DATES, TIMES & QUANTITY
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm font-semibold text-white/85 leading-relaxed">
                      {formatDateDisplay(startDate)} ({formatTimeDisplay(startTime)}) to {formatDateDisplay(endDate)} ({formatTimeDisplay(endTime)}) · <span className="text-[var(--brand-red-soft)] font-bold">{useHourly ? `${rentalHours} hrs` : `${rentalDays} days`}</span> · {quantity} {quantity === 1 ? "vehicle" : "vehicles"}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3.5 sm:border-0 sm:pt-0">
                    <p className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span>📍</span> BOOKING LOCATION
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm font-semibold text-white/90">
                      {city || selectedVehicle.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 2: Estimated Cost (Styled as a premium summary card on mobile) */}
              <div className="md:text-right">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:border-0 md:bg-transparent md:p-0">
                  <p className="text-xs text-white/40 uppercase font-bold tracking-wider text-left md:text-right flex items-center gap-1.5 justify-start md:justify-end">
                    <span>💰</span> ESTIMATED COST
                  </p>
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between md:justify-end gap-2 text-white/70">
                      <span>Base price:</span>
                      <span className="font-bold text-white">{toCurrency(useHourly ? calculateHourlyBaseCost(selectedVehicle, rentalHours) * quantity : selectedVehicle.pricePerDayINR * rentalDays * quantity, "INR")}</span>
                    </div>
                    <div className="flex justify-between md:justify-end gap-2 text-sm font-semibold text-white/80 border-t border-white/5 pt-2">
                      <span>Total:</span>
                      <span className="text-white font-bold">{toCurrency(finalEstimatedPrice, "INR")}</span>
                    </div>
                    <div className="mt-2.5 border-t border-white/5 pt-2.5 space-y-1.5 text-xs text-left md:text-right">
                      {paymentOption === "full" || finalEstimatedPrice < 400 ? (
                        <>
                          <div className="flex justify-between md:justify-end gap-2 text-green-400 font-bold">
                            <span>Pay Now (Full):</span>
                            <span className="text-green-400 font-black">{toCurrency(finalEstimatedPrice, "INR")}</span>
                          </div>
                          <div className="flex justify-between md:justify-end gap-2 text-white/40 font-semibold">
                            <span>Pay at Pickup:</span>
                            <span className="font-bold text-white/40">₹0.00</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between md:justify-end gap-2 text-green-400 font-bold">
                            <span>Pay Now (Fee):</span>
                            <span className="text-green-400 font-black">{toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}</span>
                          </div>
                          <div className="flex justify-between md:justify-end gap-2 text-amber-400 font-bold">
                            <span>Pay at Pickup:</span>
                            <span className="text-amber-400 font-black">{toCurrency(Math.max(0, finalEstimatedPrice - calculateBookingAmount(finalEstimatedPrice)), "INR")}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Tax & Details Toggles */}
                    <div className="pt-2 border-t border-white/5 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setShowTaxDetails(!showTaxDetails)}
                        className="text-[10px] font-semibold text-white/50 hover:text-white/70 flex items-center gap-1 cursor-pointer w-full md:w-auto justify-between md:justify-end"
                      >
                        <span>Taxes & Discounts details</span>
                        <span>{showTaxDetails ? "▲" : "▼"}</span>
                      </button>
                      {showTaxDetails && (
                        <div className="mt-2 space-y-1.5 text-left md:text-right text-[10px] text-white/60 animate-[fade-up_0.25s_ease_forwards] border-t border-white/5 pt-2">
                          {durationDiscount > 0 && (
                            <div className="flex justify-between md:justify-end gap-3">
                              <span>Duration Discount ({discountSettings.durationDiscountFreeDays} day free):</span>
                              <span className="font-bold text-white">-{toCurrency(durationDiscount * quantity, "INR")}</span>
                            </div>
                          )}
                          {bulkDiscount > 0 && (
                            <div className="flex justify-between md:justify-end gap-3">
                              <span>Multi-Vehicle Discount ({discountSettings.multiVehicleDiscountPercent}% off):</span>
                              <span className="font-bold text-white">-{toCurrency(bulkDiscount, "INR")}</span>
                            </div>
                          )}
                          {addons.includes("waiver") && (
                            <div className="flex justify-between md:justify-end gap-3">
                              <span>Damage Waiver:</span>
                              <span className="font-bold text-white">+{toCurrency((useHourly ? Math.ceil((selectedVehicle?.addonWaiverPrice ?? 99) / 10) * rentalHours : (selectedVehicle?.addonWaiverPrice ?? 99) * rentalDays) * quantity, "INR")}</span>
                            </div>
                          )}
                          {addons.includes("rsa") && (
                            <div className="flex justify-between md:justify-end gap-3">
                              <span>Roadside Assist:</span>
                              <span className="font-bold text-white">+{toCurrency((useHourly ? Math.ceil((selectedVehicle?.addonRsaPrice ?? 49) / 10) * rentalHours : (selectedVehicle?.addonRsaPrice ?? 49) * rentalDays) * quantity, "INR")}</span>
                            </div>
                          )}
                          {addons.includes("helmet") && (
                            <div className="flex justify-between md:justify-end gap-3">
                              <span>Extra Helmet (₹{selectedVehicle?.addonHelmetPrice ?? 50} flat):</span>
                              <span className="font-bold text-white">+{toCurrency((selectedVehicle?.addonHelmetPrice ?? 50) * quantity, "INR")}</span>
                            </div>
                          )}
                          {selectHelmet && (
                            <div className="flex justify-between md:justify-end gap-3 text-teal-400">
                              <span>Add-on Extra Helmet (₹{accessoryHelmetPrice}/day):</span>
                              <span className="font-bold">+{toCurrency(accessoryHelmetPrice * Math.max(1, rentalDays) * quantity, "INR")}</span>
                            </div>
                          )}
                          {selectGps && (
                            <div className="flex justify-between md:justify-end gap-3 text-teal-400">
                              <span>Add-on Anti-Theft GPS (₹{accessoryGpsPrice}/day):</span>
                              <span className="font-bold">+{toCurrency(accessoryGpsPrice * Math.max(1, rentalDays) * quantity, "INR")}</span>
                            </div>
                          )}
                          <div className="flex justify-between md:justify-end gap-3">
                            <span>CGST (9%):</span>
                            <span className="font-bold text-white">{toCurrency(Math.floor((finalEstimatedPrice / 1.18) * 0.09), "INR")}</span>
                          </div>
                          <div className="flex justify-between md:justify-end gap-3">
                            <span>SGST (9%):</span>
                            <span className="font-bold text-white">{toCurrency(Math.floor((finalEstimatedPrice / 1.18) * 0.09), "INR")}</span>
                          </div>
                          <p className="text-[9px] text-white/40 italic mt-1 text-center md:text-right">
                            (18% GST inclusive in total) {receiptGstin ? `| GSTIN: ${receiptGstin}` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <form id="booking-details-form" onSubmit={handleConfirmSubmit} className="grid gap-4 md:grid-cols-2 rounded-3xl bg-transparent sm:bg-black p-0 sm:p-6 shadow-none sm:shadow-xl">
            {/* Step 2: Customer Details & KYC Group */}
            <div className={`col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 ${
              checkoutStep === 2 ? "block" : "hidden sm:grid"
            }`}>
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-base font-extrabold font-display uppercase tracking-wider text-white/95 border-b border-white/5 pb-2">Customer Details & Document Upload</h3>
              </div>

            {/* DigiLocker Banner Section */}
            <div className="col-span-1 md:col-span-2">
              <style>{`
                @keyframes scanSweep {
                  0% { transform: translateY(0); opacity: 0.8; }
                  50% { transform: translateY(120px); opacity: 0.9; }
                  100% { transform: translateY(0); opacity: 0.8; }
                }
                .laser-sweep {
                  animation: scanSweep 2s ease-in-out infinite;
                }
              `}</style>
              
              {!isDigiLockerVerified && isDigiLockerActive && (
                <div className="relative flex border border-white/10 bg-white/[0.02] p-1 rounded-2xl mb-4 w-full justify-between items-center overflow-hidden">
                  {/* Sliding active background indicator pill */}
                  <span
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 shadow-md transition-all duration-300 ease-in-out ${
                      verificationMode === "manual" ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerificationMode("digilocker")}
                    className={`relative z-10 flex-1 py-2 text-center text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                      verificationMode === "digilocker" ? "text-white" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    DigiLocker Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationMode("manual")}
                    className={`relative z-10 flex-1 py-2 text-center text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                      verificationMode === "manual" ? "text-white" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    Manual Upload
                  </button>
                </div>
              )}

              {!isDigiLockerVerified ? (
                verificationMode === "digilocker" && isDigiLockerActive ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-white animate-[fade-up_0.3s_ease]">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚡</span>
                      <div>
                        <p className="text-xs font-bold text-sky-400">Fast-track KYC with DigiLocker</p>
                        <p className="text-[10px] text-white/60">Skip manual document uploads and typing. Instantly fetch from your government wallet.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDigiLocker(true)}
                      className="w-full sm:w-auto rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-sky-600/15 cursor-pointer flex-shrink-0 text-center"
                    >
                      Fetch via DigiLocker
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-[fade-up_0.3s_ease]">
                    {/* Driving License Upload Zone */}
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDLDrop}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center relative overflow-hidden min-h-[65px] sm:min-h-[140px] group"
                    >
                      {isUploadingDl ? (
                        <div className="py-1 sm:py-6 w-full text-center relative flex sm:block items-center justify-between gap-3">
                          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_red] laser-sweep" />
                          <div className="flex items-center gap-2 text-left sm:text-center sm:block">
                            <span className="inline-block animate-pulse text-lg sm:text-2xl">🔍</span>
                            <div>
                              <p className="text-[10px] sm:text-[11px] font-bold text-red-400">Scanning DL...</p>
                              <p className="text-[8px] sm:text-[9px] text-white/50">{dlUploadMessage}</p>
                            </div>
                          </div>
                          <div className="w-[80px] sm:w-auto sm:mx-auto sm:mt-3 rounded-full bg-white/5 h-1 sm:h-1.5 overflow-hidden flex-shrink-0">
                            <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${dlUploadProgress}%` }} />
                          </div>
                        </div>
                      ) : dlFileName ? (
                        <div className="w-full flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-lg sm:text-xl">🚗</span>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-emerald-400">DL Uploaded</p>
                              <p className="text-[8px] sm:text-[9px] text-white/40 font-mono truncate max-w-[120px] sm:max-w-[180px]">{dlFileName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setDlFileName(""); setDrivingLicenseNo(""); setDrivingLicenseFile(null); setDlUploadMessage(""); }}
                            className="text-[9px] text-white/50 hover:text-white underline border-none bg-transparent cursor-pointer flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between sm:justify-center relative cursor-pointer hover:bg-white/[0.01] transition rounded-xl">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-lg sm:text-2xl text-white/40">📤</span>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-white/80">Upload DL</p>
                              <p className="text-[8px] sm:text-[9px] text-white/40">Drag & drop or browse</p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setDrivingLicenseFile(file);
                                handleManualUpload(file, "license");
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Aadhaar Card Front Upload Zone */}
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleGovDrop}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center relative overflow-hidden min-h-[65px] sm:min-h-[140px] group"
                    >
                      {isUploadingGov ? (
                        <div className="py-1 sm:py-6 w-full text-center relative flex sm:block items-center justify-between gap-3">
                          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_red] laser-sweep" />
                          <div className="flex items-center gap-2 text-left sm:text-center sm:block">
                            <span className="inline-block animate-pulse text-lg sm:text-2xl">🔍</span>
                            <div>
                              <p className="text-[10px] sm:text-[11px] font-bold text-red-400">Scanning Aadhaar...</p>
                              <p className="text-[8px] sm:text-[9px] text-white/50">{govUploadMessage}</p>
                            </div>
                          </div>
                          <div className="w-[80px] sm:w-auto sm:mx-auto sm:mt-3 rounded-full bg-white/5 h-1 sm:h-1.5 overflow-hidden flex-shrink-0">
                            <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${govUploadProgress}%` }} />
                          </div>
                        </div>
                      ) : govFileName ? (
                        <div className="w-full flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-lg sm:text-xl">💳</span>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-emerald-400">Aadhaar Front</p>
                              <p className="text-[8px] sm:text-[9px] text-white/40 font-mono truncate max-w-[120px] sm:max-w-[180px]">{govFileName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setGovFileName(""); setGovernmentIdNo(""); setGovernmentIdFile(null); setGovUploadMessage(""); }}
                            className="text-[9px] text-white/50 hover:text-white underline border-none bg-transparent cursor-pointer flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between sm:justify-center relative cursor-pointer hover:bg-white/[0.01] transition rounded-xl">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-lg sm:text-2xl text-white/40">📤</span>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-white/80">Upload Aadhaar Front</p>
                              <p className="text-[8px] sm:text-[9px] text-white/40">Drag & drop or browse</p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setGovernmentIdFile(file);
                                handleManualUpload(file, "aadhaar");
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Aadhaar Card Back Upload Zone */}
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleGovBackDrop}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center relative overflow-hidden min-h-[65px] sm:min-h-[140px] group"
                    >
                      {isUploadingGovBack ? (
                        <div className="py-1 sm:py-6 w-full text-center relative flex sm:block items-center justify-between gap-3">
                          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_red] laser-sweep" />
                          <div className="flex items-center gap-2 text-left sm:text-center sm:block">
                            <span className="inline-block animate-pulse text-lg sm:text-2xl">🔍</span>
                            <div>
                              <p className="text-[10px] sm:text-[11px] font-bold text-red-400">Uploading...</p>
                              <p className="text-[8px] sm:text-[9px] text-white/50">{govBackUploadMessage}</p>
                            </div>
                          </div>
                          <div className="w-[80px] sm:w-auto sm:mx-auto sm:mt-3 rounded-full bg-white/5 h-1 sm:h-1.5 overflow-hidden flex-shrink-0">
                            <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${govBackUploadProgress}%` }} />
                          </div>
                        </div>
                      ) : govBackFileName ? (
                        <div className="w-full flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-lg sm:text-xl">💳</span>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-emerald-400">Aadhaar Back</p>
                              <p className="text-[8px] sm:text-[9px] text-white/40 font-mono truncate max-w-[120px] sm:max-w-[180px]">{govBackFileName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setGovBackFileName(""); setGovernmentIdBackFile(null); setGovBackUploadMessage(""); }}
                            className="text-[9px] text-white/50 hover:text-white underline border-none bg-transparent cursor-pointer flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between sm:justify-center relative cursor-pointer hover:bg-white/[0.01] transition rounded-xl">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-lg sm:text-2xl text-white/40">📤</span>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-white/80">Upload Aadhaar Back</p>
                              <p className="text-[8px] sm:text-[9px] text-white/40">Drag & drop or browse</p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setGovernmentIdBackFile(file);
                                handleManualUpload(file, "aadhaar-back");
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-white animate-[fade-up_0.3s_ease]">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">✅</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">KYC Verified via DigiLocker</p>
                      <p className="text-[10px] text-white/60">Driving License & Aadhaar retrieved. Ready to confirm booking.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDigiLockerVerified(false);
                      setDrivingLicenseNo("");
                      setGovernmentIdNo("");
                      setDrivingLicenseFile(null);
                      setGovernmentIdFile(null);
                      setDlFileName("");
                      setGovFileName("");
                      setDlUploadMessage("");
                      setGovUploadMessage("");
                    }}
                    className="text-[10px] font-bold text-white/50 hover:text-white underline cursor-pointer bg-transparent border-none text-left"
                  >
                    Reset Verification
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-white placeholder-white/30 interactive-input focus:outline-none"
                disabled={isDigiLockerVerified}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase">Phone Number</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-white placeholder-white/30 interactive-input focus:outline-none"
              />
            </div>

            {(isDigiLockerVerified || (verificationMode === "manual" && dlFileName)) && (
              <div className="animate-[fade-up_0.3s_ease]">
                <label className="block text-xs font-semibold text-white/60 uppercase">Driving License Number</label>
                <input
                  required
                  disabled={isDigiLockerVerified || (isMobile && verificationMode === "manual")}
                  value={drivingLicenseNo}
                  onChange={(e) => setDrivingLicenseNo(e.target.value)}
                  placeholder="Enter Driving License number"
                  className={`mt-1 w-full rounded-xl border border-white/10 px-3.5 py-2.5 text-white focus:outline-none ${
                    isDigiLockerVerified || (isMobile && verificationMode === "manual") ? "bg-white/[0.03] text-white/50 cursor-not-allowed" : "bg-white/[0.05] interactive-input"
                  }`}
                />
              </div>
            )}

            {(isDigiLockerVerified || (verificationMode === "manual" && govFileName)) && (
              <div className="animate-[fade-up_0.3s_ease]">
                <label className="block text-xs font-semibold text-white/60 uppercase">Government ID (Aadhaar)</label>
                <input
                  required
                  disabled={isDigiLockerVerified || (isMobile && verificationMode === "manual")}
                  value={governmentIdNo}
                  onChange={(e) => setGovernmentIdNo(e.target.value)}
                  placeholder="Enter Aadhaar ID number"
                  className={`mt-1 w-full rounded-xl border border-white/10 px-3.5 py-2.5 text-white focus:outline-none ${
                    isDigiLockerVerified || (isMobile && verificationMode === "manual") ? "bg-white/[0.03] text-white/50 cursor-not-allowed" : "bg-white/[0.05] interactive-input"
                  }`}
                />
              </div>
            )}
            </div>

            {/* Step 3: Dates Adjustment & Payment Info Group */}
            <div className={`col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 ${
              checkoutStep === 3 ? "block" : "hidden sm:grid"
            }`}>
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase">Rental Start Date & Time</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartCal(!showStartCal);
                      setShowEndCal(false);
                      setShowStartTimePicker(false);
                      setShowEndTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{startDate ? formatDateDisplay(startDate) : "Select Date"}</span>
                    <span className="text-white/40 text-[10px]">📅</span>
                  </button>
                  {showStartCal && (
                    <MiniCalendar
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      onClose={() => setShowStartCal(false)}
                      minDate={offsetDate(0)}
                    />
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartTimePicker(!showStartTimePicker);
                      setShowStartCal(false);
                      setShowEndCal(false);
                      setShowEndTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{startTime ? formatTimeDisplay(startTime) : "Select Time"}</span>
                    <span className="text-white/40 text-[10px]">🕒</span>
                  </button>
                  {showStartTimePicker && (
                    <MiniTimePicker
                      value={startTime}
                      onChange={(time) => setStartTime(time)}
                      onClose={() => setShowStartTimePicker(false)}
                      align="right"
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase">Rental End Date & Time</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndCal(!showEndCal);
                      setShowStartCal(false);
                      setShowStartTimePicker(false);
                      setShowEndTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{endDate ? formatDateDisplay(endDate) : "Select Date"}</span>
                    <span className="text-white/40 text-[10px]">📅</span>
                  </button>
                  {showEndCal && (
                    <MiniCalendar
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      onClose={() => setShowEndCal(false)}
                      minDate={startDate}
                    />
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndTimePicker(!showEndTimePicker);
                      setShowStartCal(false);
                      setShowEndCal(false);
                      setShowStartTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{endTime ? formatTimeDisplay(endTime) : "Select Time"}</span>
                    <span className="text-white/40 text-[10px]">🕒</span>
                  </button>
                  {showEndTimePicker && (
                    <MiniTimePicker
                      value={endTime}
                      onChange={(time) => setEndTime(time)}
                      onClose={() => setShowEndTimePicker(false)}
                      align="right"
                    />
                  )}
                </div>
              </div>
            </div>

            {availableCount > 1 && (
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase">Book Quantity</label>
                {/* Desktop layout: standard select */}
                <div className="hidden sm:block">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-white interactive-input focus:outline-none [&_option]:bg-[#121212]"
                  >
                    {Array.from({ length: availableCount }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Vehicle" : "Vehicles"}{num >= 3 ? " (Apply Bulk Offer!)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Mobile layout: premium interactive pills */}
                <div className="sm:hidden mt-2 flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(5, availableCount) }, (_, i) => i + 1).map((num) => {
                    const isSelected = quantity === num;
                    const showBulkTag = num >= 3;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        className={`flex-1 min-w-[55px] py-2 px-1 text-center rounded-xl border transition-all duration-300 flex flex-col justify-center items-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.08] text-white shadow-lg shadow-red-500/10"
                            : "border-white/15 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="text-xs font-extrabold">{num}</span>
                        {showBulkTag && (
                          <span className="text-[7px] text-[var(--brand-red-soft)] font-bold tracking-tight">BULK</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {availableCount > 1 && <div className="md:col-span-1" />}



            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-white/60 uppercase">Promo / Referral Code</label>
              <div className="relative mt-1 flex items-center">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Optional (Coupon / Referral)"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-3.5 pr-20 py-2.5 text-white placeholder-white/30 interactive-input focus:outline-none focus:border-[var(--brand-red)] focus:bg-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!promoCode.trim()) return;
                    alert(`Code "${promoCode}" applied! We will validate it during checkout.`);
                  }}
                  disabled={!promoCode.trim()}
                  className={`absolute right-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    promoCode.trim()
                      ? "bg-[var(--brand-red)] hover:bg-red-600 text-white shadow shadow-red-500/20"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Accessories Add-on Checklist Block */}
            {(accessoryHelmetActive || accessoryGpsActive) && (
              <div className="col-span-1 md:col-span-2 space-y-3 pt-3 border-t border-white/5 animate-[fade-up_0.3s_ease]">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 block">Select Accessories & Add-ons</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {accessoryHelmetActive && (
                    <div
                      onClick={() => setSelectHelmet(!selectHelmet)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                        selectHelmet
                          ? "border-teal-500 bg-teal-500/[0.02]"
                          : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={selectHelmet}
                          readOnly
                          className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          🪖 Extra Helmet
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                          Clean, sanitized helmet for pillion rider. Required by traffic law.
                        </p>
                        <p className="text-[10px] text-teal-400 font-extrabold mt-1.5">+₹{accessoryHelmetPrice} / Day</p>
                      </div>
                    </div>
                  )}

                  {accessoryGpsActive && (
                    <div
                      onClick={() => setSelectGps(!selectGps)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                        selectGps
                          ? "border-teal-500 bg-teal-500/[0.02]"
                          : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={selectGps}
                          readOnly
                          className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          🛰️ Anti-Theft GPS Tracker
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                          Real-time tracking anti-theft smart lock directly on your phone.
                        </p>
                        <p className="text-[10px] text-teal-400 font-extrabold mt-1.5">+₹{accessoryGpsPrice} / Day</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {finalEstimatedPrice >= 400 && (
              <div className="col-span-1 md:col-span-2 space-y-3 pt-3 border-t border-white/5 animate-[fade-up_0.3s_ease]">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 block">Payment Option</label>
                
                {/* Desktop layout: Side-by-side detailed cards */}
                <div className="hidden sm:grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentOption("partial")}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
                      paymentOption === "partial"
                        ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.03] shadow-lg text-white"
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-white/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">Option A: Pay Booking Fee Only</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${paymentOption === "partial" ? "border-[var(--brand-red)]" : "border-white/20"}`}>
                          {paymentOption === "partial" && <div className="h-2 w-2 rounded-full bg-[var(--brand-red)]" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                        Pay a small portion online now to secure booking. Pay remaining balance at vehicle pickup.
                      </p>
                    </div>
                    <div className="mt-3 border-t border-white/5 pt-2 flex justify-between items-baseline">
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Pay Now</span>
                      <span className="text-lg font-extrabold text-[var(--brand-red-soft)]">{toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentOption("full")}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
                      paymentOption === "full"
                        ? "border-green-500 bg-green-500/[0.02] shadow-lg text-white"
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-white/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">Option B: Pay Full Amount</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${paymentOption === "full" ? "border-green-500" : "border-white/20"}`}>
                          {paymentOption === "full" && <div className="h-2 w-2 rounded-full bg-green-500" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                        Pay the entire rental amount online now. Swift pickup with ₹0 balance due at the hub.
                      </p>
                    </div>
                    <div className="mt-3 border-t border-white/5 pt-2 flex justify-between items-baseline">
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Pay Now</span>
                      <span className="text-lg font-extrabold text-green-400">{toCurrency(finalEstimatedPrice, "INR")}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile layout: Compact button selectors with dynamic mini explanation */}
                <div className="sm:hidden space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOption("partial")}
                      className={`px-3 py-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer select-none flex flex-col justify-center items-center gap-0.5 ${
                        paymentOption === "partial"
                          ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.05] text-white"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-white/50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">Booking Fee</span>
                      <span className={`text-sm font-extrabold ${paymentOption === "partial" ? "text-[var(--brand-red-soft)]" : "text-white/70"}`}>
                        {toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentOption("full")}
                      className={`px-3 py-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer select-none flex flex-col justify-center items-center gap-0.5 ${
                        paymentOption === "full"
                          ? "border-green-500 bg-green-500/[0.04] text-white"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-white/50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">Full Amount</span>
                      <span className={`text-sm font-extrabold ${paymentOption === "full" ? "text-green-400" : "text-white/70"}`}>
                        {toCurrency(finalEstimatedPrice, "INR")}
                      </span>
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-white/40 leading-relaxed transition-all">
                    {paymentOption === "partial" ? (
                      <>💡 Pay <span className="text-white/70 font-semibold">{toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}</span> online now. Remaining <span className="text-white/70 font-semibold">{toCurrency(Math.max(0, finalEstimatedPrice - calculateBookingAmount(finalEstimatedPrice)), "INR")}</span> due at pickup.</>
                    ) : (
                      <>💡 Pay the entire <span className="text-white/70 font-semibold">{toCurrency(finalEstimatedPrice, "INR")}</span> online now. Enjoy <span className="text-green-400 font-semibold">₹0 balance due</span>.</>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="col-span-1 md:col-span-2 pt-3 border-t border-white/5">
              <PaymentGatewaySelector
                selectedProvider={paymentProvider}
                onSelect={(p) => {
                  setPaymentProvider(p);
                  // Invalidate pre-warm since provider changed
                  preWarmRef.current = null;
                  preWarmParamsRef.current = null;
                }}
                allowedProviders={allowedGateways}
              />
            </div>

            {isNriMode && (
              <div className="col-span-1 md:col-span-2">
                <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={nriChecklistAccepted}
                    onChange={(event) => setNriChecklistAccepted(event.target.checked)}
                    className="mt-0.5 cursor-pointer accent-[var(--brand-red)]"
                  />
                  <span>
                    I confirm I carry passport, visa, and International Driving Permit (or accepted local equivalent) and I prefer international-card-compatible payment methods.
                  </span>
                </label>
              </div>
            )}

            {/* Security Deposit Line Item */}
            {isDigiLockerActive !== undefined && securityDepositAmount !== undefined && securityDepositActive && (
              <div className="col-span-1 md:col-span-2 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs">
                <div>
                  <p className="font-bold text-emerald-400">💸 Refundable Security Deposit</p>
                  <p className="text-white/40 mt-0.5">Fully refunded after successful ride completion.</p>
                </div>
                <span className="text-white font-black text-sm">+₹{Number(securityDepositAmount).toLocaleString("en-IN")}</span>
              </div>
            )}

            {message && !message.startsWith("✅") && !message.startsWith("Payment cancelled") ? (
              message.includes("Confirming") || message.includes("PayU") || message.includes("Redirecting") || bookingVehicleId === selectedVehicle.id ? (
                <PaymentRedirectingCard message={message} />
              ) : (
                <div className="col-span-1 md:col-span-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 px-3.5 text-xs text-red-400">
                  {message}
                </div>
              )
            ) : null}
            </div>
          </form>

          {/* Desktop Confirm Button (Inline below the form) */}
          <div className="hidden sm:block sm:mt-6">
            <button
              type="submit"
              form="booking-details-form"
              disabled={bookingVehicleId === selectedVehicle.id}
              className="w-full rounded-2xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 px-4.5 py-3.5 flex items-center justify-between text-white shadow-xl shadow-red-500/20 active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {bookingVehicleId === selectedVehicle.id ? (
                <span className="w-full text-center font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-2 text-emerald-400">
                  <span className="animate-spin">⏳</span> Redirecting to Payment...
                </span>
              ) : (
                <>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs sm:text-sm font-black tracking-wide uppercase">Confirm & Pay</span>
                    <span className="text-[9px] sm:text-[10px] text-white/70 font-normal">
                      {paymentOption === "full" || finalEstimatedPrice < 400 ? "Full Amount Option" : "Booking Fee Option"}
                    </span>
                  </div>
                  <div className="flex flex-col text-right items-end leading-tight">
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {paymentOption === "full" || finalEstimatedPrice < 400 
                        ? toCurrency(finalEstimatedPrice, "INR") 
                        : toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/50 font-normal">
                      Total: {toCurrency(finalEstimatedPrice, "INR")}
                    </span>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Mode B: Search and Choose Mode
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-red)]/70">Customer Experience</p>
              <h2 className="text-xl font-black font-display uppercase tracking-wider gradient-text mt-1">User Booking</h2>
              <p className="text-sm text-white/60 mt-1">Search and choose a vehicle, fill details, and confirm booking.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">Instant confirmation</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">OTP login supported</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">KYC upload</span>
            </div>
          </div>

          <form onSubmit={searchVehicles} className="grid gap-3.5 grid-cols-1 md:grid-cols-12">
            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-white/50 uppercase font-bold">City</span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isDetectingLocation}
                  className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-0.5 disabled:opacity-50"
                >
                  {isDetectingLocation ? "Detecting..." : "📍 Auto-Detect"}
                </button>
              </div>
              <input
                required
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city manually..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white interactive-input focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-1 md:col-span-4">
              <span className="text-[10px] text-white/50 uppercase font-bold pl-1">Start Date & Time</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartCal(!showStartCal);
                      setShowEndCal(false);
                      setShowStartTimePicker(false);
                      setShowEndTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2 text-xs md:text-sm text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{startDate ? formatDateDisplay(startDate) : "Select Date"}</span>
                    <span className="text-white/40 text-[10px]">📅</span>
                  </button>
                  {showStartCal && (
                    <MiniCalendar
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      onClose={() => setShowStartCal(false)}
                      minDate={offsetDate(0)}
                    />
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartTimePicker(!showStartTimePicker);
                      setShowStartCal(false);
                      setShowEndCal(false);
                      setShowEndTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2 text-xs md:text-sm text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{startTime ? formatTimeDisplay(startTime) : "Select Time"}</span>
                    <span className="text-white/40 text-[10px]">🕒</span>
                  </button>
                  {showStartTimePicker && (
                    <MiniTimePicker
                      value={startTime}
                      onChange={(time) => setStartTime(time)}
                      onClose={() => setShowStartTimePicker(false)}
                      align="right"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 col-span-1 md:col-span-4">
              <span className="text-[10px] text-white/50 uppercase font-bold pl-1">End Date & Time</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndCal(!showEndCal);
                      setShowStartCal(false);
                      setShowStartTimePicker(false);
                      setShowEndTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2 text-xs md:text-sm text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{endDate ? formatDateDisplay(endDate) : "Select Date"}</span>
                    <span className="text-white/40 text-[10px]">📅</span>
                  </button>
                  {showEndCal && (
                    <MiniCalendar
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      onClose={() => setShowEndCal(false)}
                      minDate={startDate}
                    />
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndTimePicker(!showEndTimePicker);
                      setShowStartCal(false);
                      setShowEndCal(false);
                      setShowStartTimePicker(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2 text-xs md:text-sm text-white hover:bg-white/[0.08] transition focus:outline-none cursor-pointer flex items-center justify-between"
                  >
                    <span>{endTime ? formatTimeDisplay(endTime) : "Select Time"}</span>
                    <span className="text-white/40 text-[10px]">🕒</span>
                  </button>
                  {showEndTimePicker && (
                    <MiniTimePicker
                      value={endTime}
                      onChange={(time) => setEndTime(time)}
                      onClose={() => setShowEndTimePicker(false)}
                      align="right"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <span className="text-[10px] text-white/50 uppercase font-bold pl-1">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs md:text-sm text-white interactive-input focus:outline-none [&_option]:bg-[#121212] [&_option]:text-white">
                <option value="">All types</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="scooty">Scooty</option>
              </select>
            </div>
            <button type="submit" className="col-span-1 md:col-span-12 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 px-4 py-2.5 font-black text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer">Search Vehicles</button>
          </form>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <h3 className="font-extrabold text-base font-display uppercase tracking-wider text-white/95">Live Availability</h3>
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                <span className="pulse-dot" aria-hidden="true" />
                Live
              </span>
            </div>
            {message && !message.startsWith("✅") && !message.startsWith("Payment cancelled") ? (
              <p className="text-xs text-white/50 bg-white/[0.02] border border-white/5 rounded-lg py-2 px-3 inline-block">{message}</p>
            ) : null}
            {vehicles.length === 0 ? (
              <p className="text-sm text-white/50 bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-center">No vehicles loaded yet. Run a search above.</p>
            ) : (
              <div className="space-y-3.5">
                {[...vehicles].sort((a, b) => {
                  const statusA = (a.availabilityStatus ?? "available").toLowerCase();
                  const statusB = (b.availabilityStatus ?? "available").toLowerCase();
                  const isAvailA = statusA === "available";
                  const isAvailB = statusB === "available";
                  if (isAvailA && !isAvailB) return -1;
                  if (!isAvailA && isAvailB) return 1;
                  return 0;
                }).map((vehicle) => {
                  const matching = vehicles.filter(
                    (v) =>
                      v.title.toLowerCase() === vehicle.title.toLowerCase() &&
                      v.vendorId === vehicle.vendorId &&
                      (v.availabilityStatus ?? "available") === "available"
                  );
                  const itemAvailableCount = Math.max(1, matching.length);

                  return (
                    <div key={vehicle.id} className="group rounded-2xl border border-red-950/60 bg-gradient-to-br from-black via-black to-red-950/10 p-5 shadow-xl transition-all duration-300 hover:border-red-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden">
                      {/* Dynamic ambient glow gradient */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-red-500/60 to-transparent blur-xl opacity-100 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
                      
                      {/* Hover red sweep overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-red)]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                        <div>
                          <p className="font-bold text-lg text-white">{vehicle.title} · <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-800/30 uppercase">{vehicle.type}</span></p>
                          <p className="text-xs text-white/40 mt-0.5">{vehicle.city} · {vehicle.fuel} · {vehicle.transmission} · {vehicle.seats} seats</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectVehicle(vehicle)}
                          disabled={(vehicle.availabilityStatus ?? "available") !== "available"}
                          className="rounded-full bg-white/5 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 border border-white/15 px-5 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                          {(vehicle.availabilityStatus ?? "available") !== "available"
                            ? "Not Available"
                            : "Select & Book"}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs text-white/60 relative z-10">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          Status: <span className="font-bold text-emerald-400">{(vehicle.availabilityStatus ?? "available").toUpperCase()}</span>
                          {vehicle.availabilityMessage ? ` · ${vehicle.availabilityMessage}` : ""}
                          
                          {(vehicle.availabilityStatus ?? "available").toUpperCase() === "AVAILABLE" && (
                            itemAvailableCount === 1 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/50 px-2 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/20 animate-pulse">
                                🔥 Only 1 left!
                              </span>
                            ) : itemAvailableCount > 1 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-950/50 px-2 py-0.5 text-[9px] font-extrabold text-sky-400 border border-sky-500/20">
                                ⚡ {itemAvailableCount} Available
                              </span>
                            ) : null
                          )}
                        </div>
                        <span className="font-extrabold price-custom-green text-sm price-glow">
                          {toCurrency(vehicle.pricePerDayINR, "INR")} / day
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {message && (message.startsWith("✅") || message.startsWith("Payment cancelled")) && (
        <div id="payu-confirmation-scroll" className={`rounded-2xl border p-5 text-sm leading-relaxed ${
          message.startsWith("✅")
            ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-400"
            : "border-orange-500/20 bg-orange-950/20 text-orange-400"
        }`}>
          <p className="font-semibold">{message}</p>
          {message.startsWith("✅") && successBookingId && (
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-6 bg-white/[0.02] border border-white/5 rounded-3xl p-5">
              <div className="bg-white p-3 rounded-2xl shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `${window.location.origin}/dashboard/scan-booking?id=${successBookingId}`
                  )}`}
                  alt="Booking Pickup QR Code"
                  width={150}
                  height={150}
                  className="mx-auto"
                />
              </div>
              <div className="text-left space-y-2">
                <p className="font-bold text-white text-base">Your Handover QR Code is Ready! 📱</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  Show this QR code to the vendor at the hub when you go to pick up your bike. You can also view it anytime in your dashboard.
                </p>
                <div className="pt-1 flex gap-3">
                  <a
                    href="/dashboard/customer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5"
                  >
                    View in Dashboard →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AddGearModal
        isOpen={showAddGearModal}
        onClose={() => setShowAddGearModal(false)}
        vehicleType={selectedVehicle?.type ?? "bike"}
        selectedAddons={addons}
        onToggleAddon={toggleAddon}
      />
    </section>

    {/* Mobile Sticky Bottom Pay Bar (Rendered outside the transform-animated section to guarantee viewport sticky positioning) */}
    {selectedVehicle && (
      <div className="!fixed !bottom-0 !left-0 !right-0 !w-full p-3.5 bg-[#0d0d0d] shadow-[0_-8px_30px_rgba(0,0,0,0.9)] border-t border-white/10 z-[9999] sm:hidden flex flex-col">
        {/* View Breakup Link */}
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={() => setShowTaxDetails(!showTaxDetails)}
            className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
          >
            <span>{showTaxDetails ? "Hide Breakup ▾" : "View Breakup ▴"}</span>
          </button>
        </div>

        {/* Breakup details box */}
        {showTaxDetails && (
          <div className="mb-3 rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5 text-xs text-white/70 animate-[fade-up_0.25s_ease_forwards] max-h-40 overflow-y-auto no-scrollbar">
            <div className="flex justify-between font-semibold border-b border-white/5 pb-1">
              <span>Base price (Qty: {quantity})</span>
              <span>{toCurrency(useHourly ? calculateHourlyBaseCost(selectedVehicle, rentalHours) * quantity : selectedVehicle.pricePerDayINR * rentalDays * quantity, "INR")}</span>
            </div>
            {durationDiscount > 0 && (
              <div className="flex justify-between text-red-400 font-medium">
                <span>Duration Discount</span>
                <span>-{toCurrency(durationDiscount * quantity, "INR")}</span>
              </div>
            )}
            {bulkDiscount > 0 && (
              <div className="flex justify-between text-red-400 font-medium">
                <span>Multi-Vehicle Discount</span>
                <span>-{toCurrency(bulkDiscount, "INR")}</span>
              </div>
            )}
            {addons.includes("waiver") && (
              <div className="flex justify-between">
                <span>Damage Waiver</span>
                <span>+{toCurrency((useHourly ? Math.ceil((selectedVehicle?.addonWaiverPrice ?? 99) / 10) * rentalHours : (selectedVehicle?.addonWaiverPrice ?? 99) * rentalDays) * quantity, "INR")}</span>
              </div>
            )}
            {addons.includes("rsa") && (
              <div className="flex justify-between">
                <span>Roadside Assist</span>
                <span>+{toCurrency((useHourly ? Math.ceil((selectedVehicle?.addonRsaPrice ?? 49) / 10) * rentalHours : (selectedVehicle?.addonRsaPrice ?? 49) * rentalDays) * quantity, "INR")}</span>
              </div>
            )}
            {addons.includes("helmet") && (
              <div className="flex justify-between">
                <span>Extra Helmet</span>
                <span>+{toCurrency((selectedVehicle?.addonHelmetPrice ?? 50) * quantity, "INR")}</span>
              </div>
            )}
            {selectHelmet && (
              <div className="flex justify-between text-teal-400 font-medium">
                <span>Extra Helmet (🪖)</span>
                <span>+{toCurrency(accessoryHelmetPrice * Math.max(1, rentalDays) * quantity, "INR")}</span>
              </div>
            )}
            {selectGps && (
              <div className="flex justify-between text-teal-400 font-medium">
                <span>Anti-Theft GPS (🛰️)</span>
                <span>+{toCurrency(accessoryGpsPrice * Math.max(1, rentalDays) * quantity, "INR")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>CGST (9%)</span>
              <span>{toCurrency(Math.floor((finalEstimatedPrice / 1.18) * 0.09), "INR")}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (9%)</span>
              <span>{toCurrency(Math.floor((finalEstimatedPrice / 1.18) * 0.09), "INR")}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-white/5 pt-1 text-white">
              <span>Estimated Total</span>
              <span>{toCurrency(finalEstimatedPrice, "INR")}</span>
            </div>
            {paymentOption === "partial" && (
              <div className="flex justify-between text-green-400 font-semibold border-t border-white/5 pt-1">
                <span>Booking Fee Now</span>
                <span>{toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}</span>
              </div>
            )}
          </div>
        )}

        {checkoutStep === 1 && (
          <button
            type="button"
            onClick={() => {
              setCheckoutStep(2);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 px-4.5 py-3.5 flex items-center justify-between text-white shadow-xl shadow-red-500/20 active:scale-[0.99] transition-all duration-300 cursor-pointer"
          >
            <span className="w-full text-center font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-1">
              Next: Customer Details ➔
            </span>
          </button>
        )}

        {checkoutStep === 2 && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setCheckoutStep(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                const errors: string[] = [];
                if (!fullName.trim()) {
                  errors.push("Full Name is required.");
                }
                if (!phone.trim()) {
                  errors.push("Phone Number is required.");
                } else if (phone.trim().length < 10) {
                  errors.push("Phone Number must be at least 10 digits.");
                }
                if (!isDigiLockerVerified) {
                  if (verificationMode === "manual") {
                    if (!dlFileName) {
                      errors.push("Driving License upload is missing.");
                    }
                    if (!govFileName) {
                      errors.push("Aadhaar Card (Front) upload is missing.");
                    }
                  } else {
                    errors.push("DigiLocker Verification is incomplete. Please complete it or switch to manual upload.");
                  }
                }

                if (errors.length > 0) {
                  setValidationErrors(errors);
                  return;
                }

                setCheckoutStep(3);
                window.scrollTo({ top: 0, behavior: "smooth" });

                // 🚀 PRE-WARM: Start booking API call in background immediately
                // so when user clicks Pay Now, response is already ready
                const submissionAddonsPrewarm = [...addons];
                if (selectHelmet) submissionAddonsPrewarm.push("extra_helmet");
                if (selectGps) submissionAddonsPrewarm.push("anti_theft_gps");
                const preWarmBody = JSON.stringify({
                  vehicleId: selectedVehicle?.id,
                  userName: fullName,
                  userEmail: email,
                  city,
                  startDate,
                  endDate,
                  startTime,
                  endTime,
                  addons: submissionAddonsPrewarm,
                  currency: "INR",
                  timezone,
                  couponCode: promoCode.trim() || undefined,
                  referralCode: promoCode.trim() || undefined,
                  isNri: isNriMode,
                  internationalCardPreferred: isNriMode,
                  quantity,
                  paymentProvider,
                  paymentOption,
                  kyc: {
                    phone,
                    drivingLicenseNo,
                    governmentIdNo,
                    drivingLicenseFileName: drivingLicenseFile?.name || "dl_verified.pdf",
                    governmentIdFileName: governmentIdFile?.name || "gov_verified.pdf",
                    governmentIdBackFileName: governmentIdBackFile?.name || "gov_back_verified.pdf",
                  },
                });
                preWarmParamsRef.current = preWarmBody;
                preWarmRef.current = fetch("/api/bookings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: preWarmBody,
                });
              }}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 px-4.5 py-3.5 flex items-center justify-between text-white shadow-xl shadow-red-500/20 active:scale-[0.99] transition-all duration-300 cursor-pointer"
            >
              <span className="w-full text-center font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-1">
                Next: Payment Details ➔
              </span>
            </button>
          </div>
        )}

        {checkoutStep === 3 && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setCheckoutStep(2);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              form="booking-details-form"
              disabled={bookingVehicleId === selectedVehicle.id}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 px-4.5 py-3.5 flex items-center justify-between text-white shadow-xl shadow-red-500/20 active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {bookingVehicleId === selectedVehicle.id ? (
                <span className="w-full text-center font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-2 text-emerald-400">
                  <span className="animate-spin">⏳</span> Redirecting to Payment...
                </span>
              ) : (
                <>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs sm:text-sm font-black tracking-wide uppercase">Confirm & Pay</span>
                    <span className="text-[9px] sm:text-[10px] text-white/70 font-normal">
                      {paymentOption === "full" || finalEstimatedPrice < 400 ? "Full Amount Option" : "Booking Fee Option"}
                    </span>
                  </div>
                  <div className="flex flex-col text-right items-end leading-tight">
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {paymentOption === "full" || finalEstimatedPrice < 400 
                        ? toCurrency(finalEstimatedPrice, "INR") 
                        : toCurrency(calculateBookingAmount(finalEstimatedPrice), "INR")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/50 font-normal">
                      Total: {toCurrency(finalEstimatedPrice, "INR")}
                    </span>
                  </div>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    )}

    {/* Validation Errors Popup Modal */}
    {validationErrors.length > 0 && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl text-white space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-xl">⚠️</span>
            <h3 className="text-base font-black uppercase tracking-wider font-display">Missing Details</h3>
          </div>
          
          <p className="text-xs text-white/60 leading-relaxed">
            Please complete the following details before you proceed:
          </p>

          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {validationErrors.map((error, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-white/80 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setValidationErrors([])}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 py-2.5 text-xs font-bold text-white transition cursor-pointer uppercase tracking-wider"
          >
            Okay, Got it
          </button>
        </div>
      </div>
    )}
  </>
);
}

const GEAR_DETAILS = [
  { id: "jacket", label: "Riding Jacket", icon: "🧥", category: "bike", description: "All-weather protective riding jacket with CE certified armors." },
  { id: "gloves", label: "Riding Gloves", icon: "🧤", category: "bike", description: "Leather protective riding gloves with knuckle guards." },
  { id: "guards", label: "Knee & Elbow Guards", icon: "🛡️", category: "bike", description: "Impact resistant knee and elbow guards set." },
  { id: "mount", label: "GPS Phone Mount", icon: "📱", category: "bike", description: "Shockproof, waterproof handle-bar phone holder." },
  { id: "saddlebags", label: "Saddle Bags", icon: "🎒", category: "bike", description: "Heavy-duty waterproof dual saddle bags (50L capacity)." },
  { id: "cam-mount", label: "Action Camera Mount", icon: "🎥", category: "bike", description: "Action camera chin/helmet strap mount." },
  { id: "tent", label: "Camping Tent", icon: "⛺", category: "car", description: "Premium double-layer waterproof dome tent for 2-3 persons." },
  { id: "sleeping-bag", label: "Warm Sleeping Bag", icon: "🛌", category: "car", description: "Ultralight sub-zero rated sleeping bag with carry pouch." },
  { id: "camp-set", label: "Camping Table & Chairs", icon: "🪑", category: "car", description: "Foldable lightweight camping table and 2 folding chairs." },
  { id: "carrier", label: "Rooftop Luggage Carrier", icon: "🚗", category: "car", description: "Heavy luggage carrier basket with bungee cords." },
  { id: "cooler", label: "Portable Cooler Box", icon: "❄️", category: "car", description: "15L insulated cooler box to keep drinks and food fresh." },
  { id: "child-seat", label: "Child seat", icon: "👶", category: "car", description: "ISOFIX certified child safety seat with side impact protection." },
  { id: "insurance", label: "Damage protection", icon: "🛡️", category: "common", description: "Full bumper-to-bumper damage protection." }
];

function AddGearModal({
  isOpen,
  onClose,
  vehicleType,
  selectedAddons,
  onToggleAddon,
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicleType: string;
  selectedAddons: string[];
  onToggleAddon: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"recommended" | "all">("recommended");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const recommendedCategory = vehicleType === "car" ? "car" : "bike";
  const filteredGear = GEAR_DETAILS.filter((g) => {
    if (activeTab === "all") return true;
    return g.category === recommendedCategory || g.category === "common";
  });

  return createPortal(
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden text-white animate-[fade-up_0.3s_ease_forwards]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">Add Extra Gear & Accessories</h3>
            <p className="text-[10px] text-white/50">Tailor your ride with premium equipment.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 hover:bg-white/10 p-1.5 text-white/60 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.01] p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("recommended")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
              activeTab === "recommended" ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-600/15" : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Recommended for {vehicleType === "car" ? "Cars" : "Bikes"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
              activeTab === "all" ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-600/15" : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            All Gear
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar max-h-[50vh]">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {filteredGear.map((gear) => {
              const isSelected = selectedAddons.includes(gear.id);
              const addOn = bookingAddOns.find((a) => a.id === gear.id);
              if (!addOn) return null;
              const isFlat = gear.id === "mount" || gear.id === "cam-mount";
              const priceDisplay = `₹${addOn.pricePerDayINR}${isFlat ? " flat" : "/day"}`;

              return (
                <div
                  key={gear.id}
                  onClick={() => onToggleAddon(gear.id)}
                  className={`group rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer select-none ${
                    isSelected
                      ? "border-[var(--brand-red)] bg-red-950/10 shadow-[0_0_12px_rgba(225,6,0,0.12)]"
                      : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03] hover:scale-[1.01]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{gear.icon}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition ${
                        isSelected ? "bg-[var(--brand-red)] text-white" : "bg-white/5 text-white/40 group-hover:text-white/60"
                      }`}>
                        {isSelected ? "Selected" : "Add"}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs mt-2 text-white/95 group-hover:text-white transition truncate">{gear.label}</h4>
                    <p className="text-[9px] text-white/40 mt-0.5 leading-snug line-clamp-2">{gear.description}</p>
                  </div>
                  <div className="mt-3 border-t border-white/5 pt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-white/40 font-semibold uppercase tracking-wider text-[8px]">Price</span>
                    <span className="font-black text-emerald-400">{priceDisplay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="text-[10px] text-white/50">
            Selected: <span className="font-bold text-[var(--brand-red)]">{selectedAddons.filter(id => !["waiver", "rsa", "helmet"].includes(id)).length} extra item(s)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 px-4 py-1.5 text-xs font-bold text-white transition shadow-md shadow-red-500/15 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}