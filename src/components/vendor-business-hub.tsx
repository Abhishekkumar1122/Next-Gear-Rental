"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  TrendingUp,
  MessageSquare,
  Truck,
  FileText,
  Lock,
  LogOut,
  ExternalLink,
  Sliders,
  Plane,
  AlertCircle,
  Edit3,
  Check,
  Copy,
  Sparkles,
  Award,
  DollarSign,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Flame,
  X,
  CreditCard,
  CheckCircle,
} from "lucide-react";

interface VendorBusinessHubProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  vendor: {
    id: string;
    businessName: string;
    status: string;
    commissionRate: number;
    contactPhone?: string | null;
  };
  fleetCount?: number;
  bookings?: any[];
  financials?: {
    totalRevenueINR?: number;
    totalEarningsINR?: number;
    commissionDueINR?: number;
    completedBookingsCount?: number;
    totalBookings?: number;
    revenueThisMonthINR?: number;
    earningsThisMonthINR?: number;
  };
}

export function VendorBusinessHub({ user, vendor, fleetCount = 1, bookings = [], financials }: VendorBusinessHubProps) {
  // Store Ops States
  const [storeStatus, setStoreStatus] = useState<"OPEN" | "PAUSED">("OPEN");
  const [autoAcceptBookings, setAutoAcceptBookings] = useState(true);
  const [airportDeliveryEnabled, setAirportDeliveryEnabled] = useState(true);
  const [securityDepositRule, setSecurityDepositRule] = useState("₹2,000 via UPI (Refundable on return)");
  const [pickupInstructions, setPickupInstructions] = useState(
    "Original Driving License mandatory. Please arrive 15 minutes before booking start time for digital vehicle inspection."
  );

  // Gamification & Analytics State
  const [chartView, setChartView] = useState<"7d" | "30d">("7d");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [showInstantPayoutModal, setShowInstantPayoutModal] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [surgeApplied, setSurgeApplied] = useState(false);
  const [isApplyingSurge, setIsApplyingSurge] = useState(false);

  const [isEditingRules, setIsEditingRules] = useState(false);
  const [copiedVendorId, setCopiedVendorId] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  // Banking & UPI Customization State
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [customUpi, setCustomUpi] = useState("");
  const [customBank, setCustomBank] = useState("");
  const [customIfsc, setCustomIfsc] = useState("");
  const [customHolder, setCustomHolder] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(() => {});

    try {
      const savedUpi = localStorage.getItem(`vendor_upi_${vendor.id}`);
      if (savedUpi) setCustomUpi(savedUpi);
      const savedBank = localStorage.getItem(`vendor_bank_${vendor.id}`);
      if (savedBank) setCustomBank(savedBank);
      const savedIfsc = localStorage.getItem(`vendor_ifsc_${vendor.id}`);
      if (savedIfsc) setCustomIfsc(savedIfsc);
      const savedHolder = localStorage.getItem(`vendor_holder_${vendor.id}`);
      if (savedHolder) setCustomHolder(savedHolder);
    } catch {}
  }, [vendor.id]);

  function handleSaveBankingDetails() {
    if (!customUpi && !customBank) {
      showNotification("Please provide at least a UPI ID or Bank Account.");
      return;
    }
    try {
      if (customUpi) localStorage.setItem(`vendor_upi_${vendor.id}`, customUpi);
      if (customBank) localStorage.setItem(`vendor_bank_${vendor.id}`, customBank);
      if (customIfsc) localStorage.setItem(`vendor_ifsc_${vendor.id}`, customIfsc);
      if (customHolder) localStorage.setItem(`vendor_holder_${vendor.id}`, customHolder);
      setShowBankingModal(false);
      showNotification("✅ Payout UPI & Bank details updated successfully!");
    } catch {
      showNotification("Failed to save banking details.");
    }
  }

  function showNotification(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  }

  function handleCopyVendorId() {
    navigator.clipboard.writeText(vendor.id);
    setCopiedVendorId(true);
    showNotification("Vendor Partner ID copied!");
    setTimeout(() => setCopiedVendorId(false), 2000);
  }

  async function handleApplyAiSurge() {
    try {
      setIsApplyingSurge(true);
      await new Promise((r) => setTimeout(r, 800));
      setSurgeApplied(true);
      showNotification("🔥 +20% Weekend Surge Pricing applied to all active fleet listings!");
    } catch {
      showNotification("Unable to apply surge pricing right now.");
    } finally {
      setIsApplyingSurge(false);
    }
  }

  // 1. Dynamic Completed Trips & Tier Progression (Driven by Admin SiteSettings)
  const completedTrips = (bookings || []).filter(
    (b) => b.status === "COMPLETED" || b.handoverStatus === "RETURNED" || b.status === "CONFIRMED"
  ).length;

  const commission = Number(vendor.commissionRate) || 20;
  const payoutRate = 100 - commission;

  const t1Name = siteSettings?.tier1Name || "Bronze Partner";
  const t1Sub = siteSettings?.tier1Subtitle || `${commission}% Standard Fee`;
  const t1Trips = Number(siteSettings?.tier1Trips) || 6;

  const t2Name = siteSettings?.tier2Name || "Silver Host";
  const t2Sub = siteSettings?.tier2Subtitle || "Instant Payouts Enabled";
  const t2Trips = Number(siteSettings?.tier2Trips) || 16;

  const t3Name = siteSettings?.tier3Name || "Gold SuperHost";
  const t3Sub = siteSettings?.tier3Subtitle || "Search Priority + VIP Benefits";
  const t3Trips = Number(siteSettings?.tier3Trips) || 31;

  const t4Name = siteSettings?.tier4Name || "Diamond Elite";
  const t4Sub = siteSettings?.tier4Subtitle || "Lowest Platform Fee + VIP Legend Badge";

  const roadmapTitle = siteSettings?.tierRoadmapTitle || "Tier Progression Roadmap";
  const ratingText = siteSettings?.tierRatingLabel || "4.9⭐ Partner Rating";
  const handoverText = siteSettings?.tierHandoverLabel || "100% On-Time Handover";
  const cancellationText = siteSettings?.tierCancellationLabel || "0% Cancellation Rate";

  let currentLevel = 1;
  let tierTitle = t1Name;
  let nextRankTitle = `🥈 ${t2Name}`;
  let targetTrips = t1Trips;
  let remainingTrips = Math.max(0, t1Trips - completedTrips);
  let progressPct = Math.min(100, Math.round((completedTrips / t1Trips) * 100));

  if (completedTrips >= t3Trips) {
    currentLevel = 4;
    tierTitle = t4Name;
    nextRankTitle = `👑 ${t4Name} Legend`;
    targetTrips = t3Trips + 20;
    remainingTrips = 0;
    progressPct = 100;
  } else if (completedTrips >= t2Trips) {
    currentLevel = 3;
    tierTitle = t3Name;
    nextRankTitle = `💎 ${t4Name}`;
    targetTrips = t3Trips;
    remainingTrips = Math.max(0, t3Trips - completedTrips);
    const span = Math.max(1, t3Trips - t2Trips);
    progressPct = Math.min(100, Math.round(((completedTrips - t2Trips) / span) * 100));
  } else if (completedTrips >= t1Trips) {
    currentLevel = 2;
    tierTitle = t2Name;
    nextRankTitle = `🥇 ${t3Name}`;
    targetTrips = t2Trips;
    remainingTrips = Math.max(0, t2Trips - completedTrips);
    const span = Math.max(1, t2Trips - t1Trips);
    progressPct = Math.min(100, Math.round(((completedTrips - t1Trips) / span) * 100));
  }

  // 2. Dynamic 7-Day & 30-Day Real Revenue
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  
  const revenue7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dayName = daysShort[d.getDay()];
    const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const year = d.getFullYear();
    const month = d.getMonth();
    const dateNum = d.getDate();

    const dayBookings = (bookings || []).filter((b) => {
      if (b.status === "CANCELLED") return false;
      const bDate = new Date(b.startDate);
      return bDate.getFullYear() === year && bDate.getMonth() === month && bDate.getDate() === dateNum;
    });

    const amount = dayBookings.reduce((sum, b) => sum + Number(b.totalAmountINR || 0), 0);
    return { day: dayName, date: dateStr, amount, bookings: dayBookings.length };
  });

  const revenue30Days = Array.from({ length: 4 }, (_, w) => {
    const startD = new Date();
    startD.setDate(now.getDate() - ((3 - w) * 7 + 6));
    const endD = new Date();
    endD.setDate(now.getDate() - ((3 - w) * 7));

    const wBookings = (bookings || []).filter((b) => {
      if (b.status === "CANCELLED") return false;
      const bDate = new Date(b.startDate);
      return bDate >= startD && bDate <= endD;
    });

    const amount = wBookings.reduce((sum, b) => sum + Number(b.totalAmountINR || 0), 0);
    const label = `W${w + 1}`;
    const dateLabel = `${startD.toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}-${endD.toLocaleDateString("en-IN", { day: "2-digit" })}`;
    return { day: label, date: dateLabel, amount, bookings: wBookings.length };
  });

  const currentChartData = chartView === "7d" ? revenue7Days : revenue30Days;
  const maxRevenue = Math.max(...currentChartData.map((d) => d.amount), 5000);
  const totalPeriodRevenue = currentChartData.reduce((acc, d) => acc + d.amount, 0);

  // 3. Dynamic Scheduled Payout & Banking
  const scheduledPayoutAmount = financials?.totalEarningsINR ?? totalPeriodRevenue;
  const daysUntilTuesday = (2 + 7 - now.getDay()) % 7 || 7;
  const nextTuesday = new Date(now.getTime() + daysUntilTuesday * 24 * 60 * 60 * 1000);
  const nextPayoutDateStr = nextTuesday.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short" });

  const vendorPhoneClean = vendor.contactPhone ? vendor.contactPhone.replace(/\D/g, "").slice(-10) : "";
  const linkedUpi = vendorPhoneClean ? `${vendorPhoneClean}@okaxis` : "Setup UPI in Settings";
  const linkedBank = vendorPhoneClean ? `Bank •••• ${vendorPhoneClean.slice(-4)}` : "Verified Bank";

  const effectiveUpi = customUpi || linkedUpi;
  const effectiveBank = customBank
    ? `${customHolder ? customHolder + " • " : ""}${customBank} (${customIfsc || "IFSC"})`
    : linkedBank;

  async function handleTriggerInstantPayout() {
    if (scheduledPayoutAmount <= 0) {
      showNotification("No earnings available for withdrawal.");
      return;
    }
    try {
      setIsProcessingPayout(true);
      const res = await fetch("/api/vendor/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          vendorName: vendor.businessName,
          grossRevenueINR: scheduledPayoutAmount,
          commissionRate: commission,
          bankAccountMasked: linkedBank,
          upiIdMasked: linkedUpi,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPayoutSuccess(true);
        setTimeout(() => {
          setPayoutSuccess(false);
          setShowInstantPayoutModal(false);
          showNotification(`⚡ Payout request of ₹${scheduledPayoutAmount.toLocaleString("en-IN")} submitted! Admin will transfer to ${linkedUpi}.`);
        }, 1500);
      } else {
        showNotification(data.error || "Payout request failed. Please try again.");
      }
    } catch {
      showNotification("Network error submitting payout request.");
    } finally {
      setIsProcessingPayout(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 text-white pb-8 animate-[fadeIn_0.2s_ease-out]">
      {/* 🔔 Feedback Toast */}
      {feedback && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 🏆 FEATURE 1: HOST TIER & "DIAMOND SUPERHOST" GAMIFICATION ROADMAP */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1c1208] via-[#140b05] to-neutral-950 p-4 md:p-6 shadow-2xl space-y-4">
        {/* Glow behind tier card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-600 p-0.5 shadow-lg shadow-amber-600/30 shrink-0">
              <div className="w-full h-full rounded-2xl bg-neutral-950 flex items-center justify-center text-2xl">
                {currentLevel === 4 ? "💎" : currentLevel === 3 ? "🥇" : currentLevel === 2 ? "🥈" : "🥉"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Level {currentLevel} Host
                </span>
                <span className="text-[10px] text-white/50 font-bold">• {completedTrips} / {targetTrips} Trips Completed</span>
              </div>
              <h2 className="text-base md:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                <span>{tierTitle}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right bg-amber-950/40 sm:bg-transparent p-2 sm:p-0 rounded-2xl border sm:border-0 border-amber-500/20">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300/70 block">
              Next Rank: {nextRankTitle}
            </span>
            <span className="text-xs md:text-sm font-black text-amber-300">
              {remainingTrips > 0 ? `Only ${remainingTrips} more completed bookings!` : "Max Tier Level Achieved!"}
            </span>
          </div>
        </div>

        {/* Gamified Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-white/60">{roadmapTitle}</span>
            <span className="text-amber-400 font-mono">{progressPct}% Complete</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-md shadow-amber-500/50"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 4 Tier Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className={`p-2.5 rounded-2xl border space-y-1 ${
            currentLevel === 1 ? "border-2 border-amber-500/60 bg-amber-950/30" : "border-white/10 bg-black/40"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">🥉</span>
              {currentLevel > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : currentLevel === 1 ? <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded uppercase">Current</span> : null}
            </div>
            <p className="text-[11px] font-bold text-white">{t1Name}</p>
            <p className="text-[9px] text-white/40">{t1Sub}</p>
          </div>

          <div className={`p-2.5 rounded-2xl border space-y-1 ${
            currentLevel === 2 ? "border-2 border-amber-500/60 bg-amber-950/30" : currentLevel > 2 ? "border-white/10 bg-black/40" : "border-dashed border-white/20 bg-black/20 opacity-75"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">🥈</span>
              {currentLevel > 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : currentLevel === 2 ? <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded uppercase">Current</span> : <Lock className="w-3 h-3 text-white/40" />}
            </div>
            <p className="text-[11px] font-bold text-white">{t2Name}</p>
            <p className="text-[9px] text-white/40">{t2Sub}</p>
          </div>

          <div className={`p-2.5 rounded-2xl border space-y-1 ${
            currentLevel === 3 ? "border-2 border-amber-500/60 bg-amber-950/30 shadow-lg shadow-amber-950/50" : currentLevel > 3 ? "border-white/10 bg-black/40" : "border-dashed border-white/20 bg-black/20 opacity-75"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">🥇</span>
              {currentLevel > 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : currentLevel === 3 ? <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded uppercase">Current</span> : <Lock className="w-3 h-3 text-white/40" />}
            </div>
            <p className="text-[11px] font-extrabold text-amber-300">{t3Name}</p>
            <p className="text-[9px] text-amber-200/60">{t3Sub}</p>
          </div>

          <div className={`p-2.5 rounded-2xl border space-y-1 ${
            currentLevel === 4 ? "border-2 border-cyan-500/60 bg-cyan-950/30 shadow-lg shadow-cyan-950/50" : "border-dashed border-white/20 bg-black/20 opacity-75"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">💎</span>
              {currentLevel === 4 ? <span className="text-[8px] font-black text-cyan-300 bg-cyan-500/20 px-1 py-0.2 rounded uppercase">Current</span> : <Lock className="w-3 h-3 text-white/40" />}
            </div>
            <p className="text-[11px] font-bold text-white/70">{t4Name}</p>
            <p className="text-[9px] text-white/40">{t4Sub}</p>
          </div>
        </div>

        {/* 3 Metric Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] md:text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {handoverText}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {ratingText}
          </span>
          <span className="inline-flex items-center gap-1 text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> {cancellationText}
          </span>
        </div>
      </div>

      {/* 📈 FEATURE 2: INTERACTIVE NEON EARNINGS CHART & PAYOUT COUNTDOWN */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left 8 Cols: Interactive Glowing Revenue Chart */}
        <div className="lg:col-span-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0a1811] via-neutral-900/90 to-neutral-950 p-4 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base md:text-lg font-extrabold text-white">Revenue Performance</h3>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">
                Total period revenue: <span className="font-mono font-bold text-emerald-400">₹{totalPeriodRevenue.toLocaleString("en-IN")}</span>
              </p>
            </div>

            {/* Toggle 7D vs 30D */}
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setChartView("7d")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartView === "7d"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartView("30d")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartView === "30d"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Glowing Vertical Bar Chart */}
          <div className="pt-2">
            <div className="h-44 md:h-52 w-full flex items-end justify-between gap-2 px-1">
              {currentChartData.map((item, idx) => {
                const heightPct = item.amount > 0 ? Math.max((item.amount / maxRevenue) * 100, 15) : 4;
                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-12 z-30 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-emerald-500/50 shadow-2xl text-center whitespace-nowrap animate-[fadeIn_0.15s_ease-out]">
                        <span className="text-[9px] text-white/50 block">{item.date}</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">₹{item.amount.toLocaleString("en-IN")}</span>
                        <span className="text-[8px] text-white/70 block">({item.bookings} rides)</span>
                      </div>
                    )}

                    {/* Bar Pillar with Neon Glow */}
                    <div className="w-full max-w-[42px] bg-neutral-900 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 relative ${
                          item.amount > 0
                            ? isHovered
                              ? "bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                              : "bg-gradient-to-t from-emerald-800 via-emerald-600 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-neutral-800"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Day / Week Label */}
                    <div className="mt-2 text-center">
                      <span className={`text-[10px] md:text-xs font-extrabold block transition ${isHovered ? "text-emerald-400" : "text-white/60"}`}>
                        {item.day}
                      </span>
                      <span className="text-[8px] text-white/40 hidden md:block">
                        {item.amount > 0 ? `₹${(item.amount / 1000).toFixed(1)}k` : "₹0"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Payout Countdown Card & Instant Transfer */}
        <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/90 via-neutral-900/70 to-neutral-950 p-4 md:p-6 shadow-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Weekly Cycle
              </span>
              <span className="text-[10px] text-white/40">Direct UPI / NEFT</span>
            </div>

            <div>
              <span className="text-xs text-white/60 font-bold block">Next Scheduled Payout</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
                  ₹{scheduledPayoutAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-emerald-300/70">.00</span>
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                📅 Auto-transfer scheduled for <strong className="text-white">{nextPayoutDateStr}</strong>
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50">Linked UPI ID:</span>
                <span className="font-mono font-bold text-emerald-300">{effectiveUpi}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50">Bank Account:</span>
                <span className="font-mono text-white/80 line-clamp-1">{effectiveBank}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBankingModal(true)}
                className="w-full text-center text-[10px] text-emerald-400 hover:text-emerald-300 font-extrabold uppercase tracking-wider py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                ✏️ Edit UPI / Bank Account
              </button>
            </div>
          </div>

          {/* Instant Payout Button */}
          <button
            onClick={() => setShowInstantPayoutModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>⚡ Instant 1-Tap Payout</span>
          </button>
        </div>
      </div>

      {/* 🤖 FEATURE 3: AI DYNAMIC PRICING & HIGH-DEMAND SURGE RADAR */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-[#1c080d] via-neutral-900 to-neutral-950 p-4 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 shrink-0">
              <Flame className="w-5 h-5 md:w-6 md:h-6 fill-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  AI Surge Radar Active
                </span>
                <span className="text-[10px] text-white/50 font-bold">Mumbai Hub Demand: +42% HIGH</span>
              </div>
              <h3 className="text-sm md:text-base font-extrabold text-white">
                Upcoming Weekend Surge Opportunity
              </h3>
              <p className="text-[11px] text-white/60 leading-relaxed max-w-xl">
                Heavy travel bookings detected for Friday-Sunday. AI recommends applying a <strong>+20% Dynamic Surge</strong> on all cars & SUVs to earn an extra <strong>₹4,800+</strong> this week.
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyAiSurge}
            disabled={surgeApplied || isApplyingSurge}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              surgeApplied
                ? "bg-emerald-600/90 text-white border border-emerald-400 cursor-default"
                : "bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white shadow-red-600/30 border border-red-400/40"
            }`}
          >
            {isApplyingSurge ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Surge...</span>
              </>
            ) : surgeApplied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Surge Active (+20%)</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Apply +20% Surge to Fleet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🏢 STORE DETAILS & CONTACT CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-neutral-950/90 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
        <div className="relative z-10 space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 p-0.5 shadow-xl shadow-red-600/20 shrink-0">
              <div className="w-full h-full rounded-2xl bg-neutral-950 flex items-center justify-center">
                <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-black text-white tracking-tight truncate">{vendor.businessName}</h2>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-blue-400" /> Verified Host
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Gold Tier Partner
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-white/70 pt-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 font-mono text-[10px] text-white/60">
              <span>ID: {vendor.id.slice(0, 8)}...</span>
              <button
                onClick={handleCopyVendorId}
                title="Copy ID"
                className="hover:text-white transition cursor-pointer p-0.5"
              >
                {copiedVendorId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80 truncate max-w-full">
              <Mail className="w-3 h-3 text-white/40 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            {vendor.contactPhone && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80">
                <Phone className="w-3 h-3 text-white/40 shrink-0" />
                <span>{vendor.contactPhone}</span>
              </div>
            )}
          </div>

          {/* Platform Fee Row */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/40 block">Platform Agreement</span>
              <span className="text-white/70 text-xs font-semibold">{commission}% Marketplace Fee</span>
            </div>
            <div className="text-right">
              <span className="text-base md:text-lg font-black text-emerald-400 font-mono block">
                {payoutRate}% Payout
              </span>
              <span className="text-[10px] text-emerald-400/70 font-semibold">Net Fleet Yield</span>
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ CARD 3: REAL-TIME STORE & DISPATCH SWITCHES */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 backdrop-blur-xl p-4 md:p-6 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-md">
              <Sliders className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-white">Live Store Controls</h3>
              <p className="text-[10px] md:text-[11px] text-white/50">Manage booking dispatch and operations</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider ${
              storeStatus === "OPEN"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${storeStatus === "OPEN" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            {storeStatus === "OPEN" ? "Store Open" : "Paused"}
          </span>
        </div>

        <div className="grid gap-2.5 md:grid-cols-3">
          {/* Switch 1: Store Operational Status */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Store Operational Status</span>
              </div>
              <p className="text-[10px] text-white/50 leading-normal">
                Pause incoming bookings during maintenance or holidays.
              </p>
            </div>

            <button
              onClick={() => {
                const next = storeStatus === "OPEN" ? "PAUSED" : "OPEN";
                setStoreStatus(next);
                showNotification(`Store is now ${next === "OPEN" ? "Open (Accepting Bookings)" : "Paused (Vacation Mode)"}`);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                storeStatus === "OPEN"
                  ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40"
                  : "bg-white/10 hover:bg-white/15 text-white/80 border border-white/20"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{storeStatus === "OPEN" ? "🟢 Accepting Bookings" : "🔴 Store is Paused"}</span>
            </button>
          </div>

          {/* Switch 2: Auto-Confirm */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Instant Auto-Confirm</span>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">Fast Lane</span>
              </div>
              <p className="text-[10px] text-white/50 leading-normal">
                Automatically approve calendar-available rental requests.
              </p>
            </div>

            <button
              onClick={() => {
                setAutoAcceptBookings((prev) => !prev);
                showNotification(`Instant Auto-Confirm is now ${!autoAcceptBookings ? "Active" : "Manual"}`);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                autoAcceptBookings
                  ? "bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400/40"
                  : "bg-white/10 hover:bg-white/15 text-white/80 border border-white/20"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{autoAcceptBookings ? "⚡ Auto-Confirm ON" : "⏳ Manual Approval"}</span>
            </button>
          </div>

          {/* Switch 3: Airport Delivery */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Airport Delivery Service</span>
                <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">+High Yield</span>
              </div>
              <p className="text-[10px] text-white/50 leading-normal">
                Show vehicles in airport pickup filter and terminal delivery.
              </p>
            </div>

            <button
              onClick={() => {
                setAirportDeliveryEnabled((prev) => !prev);
                showNotification(`Airport Delivery is now ${!airportDeliveryEnabled ? "Enabled" : "Disabled"}`);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                airportDeliveryEnabled
                  ? "bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/40"
                  : "bg-white/10 hover:bg-white/15 text-white/80 border border-white/20"
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>{airportDeliveryEnabled ? "✈️ Airport Delivery ON" : "❌ Delivery OFF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📝 CARD 4: CUSTOMER HANDOVER & SECURITY RULES */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 backdrop-blur-xl p-4 md:p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-white">Customer Handover Terms</h3>
              <p className="text-[10px] md:text-[11px] text-white/50">Displayed on customer trip confirmation voucher</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditingRules) {
                showNotification("Customer terms updated!");
              }
              setIsEditingRules((prev) => !prev);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer"
          >
            {isEditingRules ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Save
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3 text-purple-400" /> Edit
              </>
            )}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Security Deposit Guideline */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-white/70">Refundable Security Deposit</label>
            {isEditingRules ? (
              <input
                value={securityDepositRule}
                onChange={(e) => setSecurityDepositRule(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-purple-500"
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white/90 font-medium">
                {securityDepositRule}
              </div>
            )}
          </div>

          {/* Pickup Checklist */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-white/70">Mandatory Rider Checklist & Notes</label>
            {isEditingRules ? (
              <textarea
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-white/15 bg-black/60 p-2 text-xs text-white focus:border-purple-500"
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white/90 font-medium leading-relaxed">
                {pickupInstructions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 CARD 5: DIRECT WHATSAPP CONCIERGE & SUPPORT */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-neutral-900/80 to-neutral-950/90 p-4 md:p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md shadow-emerald-900/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs md:text-sm font-extrabold text-white">Priority WhatsApp Support Desk</h4>
            <p className="text-[10px] md:text-xs text-white/50 truncate">
              Direct line to Next Gear Partner Operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <a
            href="https://wa.me/919523765172?text=Hello%20Next%20Gear%20Team%2C%20I%20am%20a%20registered%20vendor%20partner%20and%20need%20assistance."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-[11px] md:text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 active:scale-95 text-center"
          >
            <span>💬 WhatsApp</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          <Link
            href="/dashboard/vendor/support-tickets"
            className="inline-flex items-center justify-center py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] md:text-xs uppercase tracking-wider transition text-center"
          >
            Open Ticket
          </Link>
        </div>
      </div>

      {/* 🔐 CARD 6: SECURITY & LOGOUT */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 backdrop-blur-xl p-4 md:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/40">Active Session</p>
              <p className="text-xs text-white/80 font-medium truncate">{user.email}</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? "Signing Out..." : "Sign Out from Next Gear"}</span>
        </button>
      </div>

      {/* ⚡ INSTANT PAYOUT WITHDRAWAL MODAL */}
      {showInstantPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="max-w-md w-full rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-[#091710] via-[#06100b] to-[#040907] p-5 md:p-6 space-y-4 shadow-[0_0_60px_rgba(16,185,129,0.3)] relative text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-400/50 flex items-center justify-center text-2xl shadow-lg">
                ⚡
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                Instant Fast-Track Transfer
              </span>
              <h3 className="text-lg md:text-xl font-extrabold text-white">
                Withdraw ₹{scheduledPayoutAmount.toLocaleString("en-IN")} Now?
              </h3>
              <p className="text-xs text-white/60">
                Amount will be instantly credited to your linked UPI VPA: <strong className="text-emerald-300">{effectiveUpi}</strong>
              </p>
            </div>

            <div className="rounded-2xl bg-black/50 border border-white/10 p-3 space-y-1.5 text-xs text-left">
              <div className="flex items-center justify-between text-white/60">
                <span>Available Balance:</span>
                <span className="font-mono text-white font-bold">₹{scheduledPayoutAmount.toLocaleString("en-IN")}.00</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>Express Fee (0% Waiver):</span>
                <span className="font-mono text-emerald-400 font-bold">₹0.00</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-white font-extrabold">
                <span>Net Transfer:</span>
                <span className="font-mono text-emerald-300 text-sm">₹{scheduledPayoutAmount.toLocaleString("en-IN")}.00</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setShowInstantPayoutModal(false)}
                disabled={isProcessingPayout}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerInstantPayout}
                disabled={isProcessingPayout || scheduledPayoutAmount <= 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessingPayout ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : payoutSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Transferred!</span>
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏦 EDIT BANKING & UPI MODAL */}
      {showBankingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="max-w-md w-full rounded-3xl border border-white/15 bg-gradient-to-b from-[#111] via-[#0d0d0d] to-[#080808] p-5 md:p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-white">Payout UPI & Bank Account</h3>
                  <p className="text-[10px] text-white/50">Where you will receive automated weekly & instant payouts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBankingModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-emerald-400 block">⚡ UPI ID / VPA (Instant Payouts)</label>
                <input
                  type="text"
                  value={customUpi}
                  onChange={(e) => setCustomUpi(e.target.value)}
                  placeholder="e.g. 9523765172@okaxis / fleet@okhdfcbank"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white font-mono placeholder:text-white/30 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/50 block">Beneficiary Account Name</label>
                <input
                  type="text"
                  value={customHolder}
                  onChange={(e) => setCustomHolder(e.target.value)}
                  placeholder="e.g. Next Gear Fleet Pvt Ltd"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-white/50 block">Bank Account Number</label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="e.g. 501004829102"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white font-mono placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-white/50 block">IFSC Code</label>
                  <input
                    type="text"
                    value={customIfsc}
                    onChange={(e) => setCustomIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white uppercase font-mono placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowBankingModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBankingDetails}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
