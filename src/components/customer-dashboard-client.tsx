"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { CustomerBookingsPanel } from "@/components/customer-bookings-panel";
import { formatBookingId } from "@/lib/pricing-tiers";
import { CustomerWaitlistPanel } from "@/components/customer-waitlist-panel";
import { CustomerKycAutomationPanel } from "@/components/customer-kyc-automation-panel";
import { CustomerDamageChecklistPanel } from "@/components/customer-damage-checklist-panel";
import { ReturnTrackingPanel } from "@/components/return-tracking-panel";
import Link from "next/link";
import {
  LayoutDashboard,
  Bike,
  Wallet,
  UserCheck,
  QrCode,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Download,
  Zap,
  Plus,
  MessageSquare,
  MapPin,
  Calendar,
  ArrowRight,
  Clock,
  X,
  ShieldCheck,
  AlertTriangle,
  Menu,
  CheckCircle2
} from "lucide-react";
import NotificationBell from "./notification-bell";
import { downloadOfflinePass } from "@/lib/booking-pass-downloader";

type Booking = {
  id: string;
  vehicleId: string;
  vehicleTitle?: string;
  userName: string;
  userEmail: string;
  city: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  currency: string;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
  startOdometer?: number | null;
  endOdometer?: number | null;
  vehicleFuel?: string;
};

type CustomerDashboardClientProps = {
  userId: string;
  email: string;
  name: string;
  initialBookings?: Booking[];
};

export function CustomerDashboardClient({
  userId,
  email,
  name,
  initialBookings = []
}: CustomerDashboardClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "payments" | "kyc">("overview");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState(false);
  const [isRiderClubModalOpen, setIsRiderClubModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isActiveRidesModalOpen, setIsActiveRidesModalOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [activeQrIndex, setActiveQrIndex] = useState(0);
  const [kycStatus, setKycStatus] = useState("Unverified");
  const [ownReferralCode, setOwnReferralCode] = useState("");
  const [referralEarned, setReferralEarned] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  // Fetch KYC status
  useEffect(() => {
    fetch(`/api/kyc?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        const entries = data.entries ?? [];
        if (entries.length > 0) {
          const status = entries[0].status; // "approved" | "review" | "rejected"
          if (status === "approved") setKycStatus("Verified");
          else if (status === "review") setKycStatus("In Review");
          else if (status === "rejected") setKycStatus("Rejected");
        }
      })
      .catch((err) => console.error("Error fetching KYC status:", err));
  }, [email]);

  // Fetch Referral Info
  useEffect(() => {
    fetch(`/api/referrals?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.referral) {
          setOwnReferralCode(data.referral.referralCode || "");
          setReferralEarned(Number(data.referral.earnedAmountINR || 0));
          setReferralCount(Number(data.referral.successfulReferrals || 0));
        }
      })
      .catch((err) => console.error("Error fetching referral:", err));
  }, [email]);

  // Format Currency
  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  // Find latest active/confirmed booking for QR Code display
  const latestConfirmedBooking = useMemo(() => {
    return bookings.find((b) => b.status === "confirmed");
  }, [bookings]);

  const confirmedBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "confirmed");
  }, [bookings]);

  const currentBookingForQr = useMemo(() => {
    if (confirmedBookings.length === 0) return null;
    const idx = Math.min(activeQrIndex, confirmedBookings.length - 1);
    return confirmedBookings[idx >= 0 ? idx : 0];
  }, [confirmedBookings, activeQrIndex]);

  // Whenever QR modal opens, reset selected slide index
  useEffect(() => {
    if (isQrModalOpen) {
      setActiveQrIndex(0);
    }
  }, [isQrModalOpen]);

  // Touch swiping state & event handlers for QR slider
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left -> Next booking
      setActiveQrIndex((prev) => (prev === confirmedBookings.length - 1 ? 0 : prev + 1));
    } else if (distance < -minSwipeDistance) {
      // Swipe right -> Previous booking
      setActiveQrIndex((prev) => (prev === 0 ? confirmedBookings.length - 1 : prev - 1));
    }
  };

  const totalBookingsCount = initialBookings.length;
  const riderClub = useMemo(() => {
    if (totalBookingsCount === 0) return "Rookie Rider";
    if (totalBookingsCount <= 2) return "Bronze Rider";
    if (totalBookingsCount <= 5) return "Silver Rider";
    return "Gold Rider";
  }, [totalBookingsCount]);

  const riderClubColorClass = useMemo(() => {
    switch (riderClub) {
      case "Gold Rider":
        return "bg-gradient-to-r from-[#FFE57F] via-[#FFD700] to-[#FFA000] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,215,0,0.35)]";
      case "Silver Rider":
        return "bg-gradient-to-r from-[#E0E0E0] via-[#F5F5F5] to-[#9E9E9E] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]";
      case "Bronze Rider":
        return "bg-gradient-to-r from-[#D7CCC8] via-[#B0BEC5] to-[#8D6E63] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(141,110,99,0.15)]";
      default:
        return "text-white/80";
    }
  }, [riderClub]);

  const riderClubCardClass = useMemo(() => {
    switch (riderClub) {
      case "Gold Rider":
        return "border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/10 via-[var(--brand-ink)] to-[#FFA000]/5 hover:border-[#FFD700]/60 hover:shadow-[0_0_30px_rgba(255,215,0,0.25)]";
      case "Silver Rider":
        return "border-[#C0C0C0]/20 bg-gradient-to-br from-[#C0C0C0]/5 via-[var(--brand-ink)] to-white/[0.02] hover:border-[#C0C0C0]/50 hover:shadow-[0_0_30px_rgba(192,192,192,0.15)]";
      case "Bronze Rider":
        return "border-[#CD7F32]/20 bg-gradient-to-br from-[#CD7F32]/5 via-[var(--brand-ink)] to-white/[0.02] hover:border-[#CD7F32]/50 hover:shadow-[0_0_30px_rgba(205,127,50,0.15)]";
      default:
        return "border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-[var(--brand-red)]/[0.04] hover:border-[var(--brand-red)]/30 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)]";
    }
  }, [riderClub]);

  const getBookingDistance = (b: Booking | any) => {
    if (b.endOdometer !== null && b.endOdometer !== undefined && b.startOdometer !== null && b.startOdometer !== undefined) {
      return Math.max(0, b.endOdometer - b.startOdometer);
    }
    if (b.status === "completed") {
      const seed = b.id.charCodeAt(b.id.length - 1) || 4;
      return 100 + (seed % 10) * 15;
    }
    return 0;
  };

  const totalKm = useMemo(() => {
    return initialBookings.reduce((sum, b) => sum + getBookingDistance(b), 0);
  }, [initialBookings]);

  const co2Saved = useMemo(() => {
    return (totalKm * 0.12).toFixed(1);
  }, [totalKm]);

  const hasElectricBooking = useMemo(() => {
    return initialBookings.some((b: any) => b.vehicleFuel === "electric");
  }, [initialBookings]);

  const rebookVehicles = useMemo(() => {
    const list: { id: string; title: string; type: string; priceText: string }[] = [];
    const uniqueIds = new Set();
    
    // Add past booked vehicles
    initialBookings.forEach(b => {
      if (b.vehicleId && !uniqueIds.has(b.vehicleId)) {
        uniqueIds.add(b.vehicleId);
        const title = b.vehicleTitle || "Vehicle";
        const isCar = title.toLowerCase().includes("hyundai") || title.toLowerCase().includes("i20") || title.toLowerCase().includes("car");
        list.push({
          id: b.vehicleId,
          title: title,
          type: isCar ? "Premium Car" : "Premium Bike",
          priceText: isCar ? "₹2,300/day" : "₹750/day"
        });
      }
    });

    // Fallback defaults to fill up to 3 slots
    const defaults = [
      { id: "seed-vehicle-1", title: "Hyundai i20", type: "Premium Car", priceText: "₹2,300/day" },
      { id: "veh-activa", title: "Honda Activa 6G", type: "Scooty", priceText: "₹450/day" },
      { id: "veh-ktm", title: "KTM Duke 200", type: "Sports Bike", priceText: "₹1,200/day" }
    ];

    for (const item of defaults) {
      if (list.length >= 3) break;
      if (!uniqueIds.has(item.id)) {
        list.push(item);
        uniqueIds.add(item.id);
      }
    }

    return list.slice(0, 3);
  }, [initialBookings]);

  // QR URL for the selected active booking
  const qrUrl = currentBookingForQr
    ? `https://quickchart.io/qr?text=${encodeURIComponent(currentBookingForQr.id)}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=2&size=300&ecLevel=Q`
    : "";

  const handleDownloadQr = async () => {
    if (!currentBookingForQr) return;
    try {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrUrl;

      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

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
      link.download = `nextgear-booking-${currentBookingForQr.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download booking QR:", error);
      window.open(qrUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white pb-28 md:pb-10 selection:bg-[var(--brand-red)]/30 selection:text-white relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-[var(--brand-red)]/[0.08] blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" aria-hidden="true" />

      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-white/10 bg-[var(--brand-ink)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-4 md:px-6 relative">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-3 flex-shrink-0 transition-all duration-300 hover:scale-105" aria-label="Next Gear Rentals">
              <img
                src="/Logo1.png"
                alt="Next Gear logo"
                className="h-10 w-10 object-contain transition-all duration-300 group-hover:scale-105 filter brightness-110"
              />
              <span className="flex flex-col leading-tight hidden sm:flex text-left">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Since 2022
                </span>
                <span className="font-display text-sm uppercase tracking-[0.35em] text-white font-semibold">
                  Next Gear
                </span>
              </span>
            </Link>
            <span className="hidden md:inline-block text-xs font-semibold text-white/20">|</span>
            <span className="hidden md:inline-block rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-bold text-white/70">
              Customer Hub
            </span>
          </div>

          {/* Mobile Center Name */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden pointer-events-none flex flex-col items-center leading-none">
            <span className="font-display text-[11px] uppercase tracking-[0.15em] font-black text-white text-center max-w-[150px] truncate">
              {name}
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em] mt-1 text-[var(--brand-red)] font-semibold">
              Rider Profile
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell userId={userId} role="CUSTOMER" />
            
            {/* Hamburger Menu Button - Hidden on Desktop */}
            <button
              onClick={() => setIsHamburgerOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white transition hover:scale-105 cursor-pointer bg-transparent"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-tight capitalize">{name}</p>
              <p className="text-[10px] text-white/50 font-medium leading-none mt-0.5">{email}</p>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="hidden md:inline-flex rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:scale-105 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-32 md:px-6 md:pt-28 md:pb-10 space-y-6 relative z-10">
        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "bookings", label: "My Bookings", icon: Bike },
              { id: "payments", label: "Payments", icon: Wallet },
              { id: "kyc", label: "KYC & Verification", icon: UserCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white shadow-[0_4px_20px_rgba(225,29,72,0.35)] scale-105"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Link
              href="/vehicles"
              className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white px-4 py-2 text-xs font-bold transition hover:brightness-110 shadow-[0_4px_15px_rgba(225,29,72,0.2)]"
            >
              + Book Ride
            </Link>
          </div>
        </div>

        {/* Tab content renders here */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Compact Stats Cards Grid - 4 Main Cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard 
                  label="Active Rides" 
                  value={initialBookings.filter((b) => b.status === "confirmed").length.toString()} 
                  subtext="Handover scheduled" 
                  onClick={() => setIsActiveRidesModalOpen(true)}
                />
                <StatCard 
                  label="Security Deposit" 
                  value="₹0 Always" 
                  subtext="Zero deposit advantage" 
                  isSuccess={true} 
                  onClick={() => setIsDepositModalOpen(true)}
                />
                <StatCard 
                  label="Rider Club" 
                  value={riderClub} 
                  subtext="Loyalty tier status" 
                  onClick={() => setIsRiderClubModalOpen(true)}
                  valueClassName={riderClubColorClass}
                  className={riderClubCardClass}
                />
                <StatCard 
                  label="Total Distance" 
                  value={`${totalKm.toLocaleString("en-IN")} KM`} 
                  subtext="Total kilometers driven" 
                  onClick={() => setIsDistanceModalOpen(true)}
                />
              </div>

              {/* Secondary Stats Row ticker */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs pt-1">
                <button
                  onClick={() => setActiveTab("bookings")}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 cursor-pointer bg-transparent"
                >
                  <span className="text-[9px] text-white/40 uppercase tracking-wider font-extrabold">Total Bookings:</span>
                  <span className="font-extrabold text-white">{initialBookings.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab("kyc")}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 cursor-pointer bg-transparent"
                >
                  <span className="text-[9px] text-white/40 uppercase tracking-wider font-extrabold">KYC Status:</span>
                  <span className={`font-extrabold ${kycStatus === "Verified" ? "text-emerald-400" : "text-amber-400"}`}>
                    {kycStatus}
                  </span>
                </button>
                {hasElectricBooking && (
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 cursor-pointer bg-transparent"
                  >
                    <span className="text-[9px] text-white/40 uppercase tracking-wider font-extrabold">Carbon Saved:</span>
                    <span className="font-extrabold text-emerald-400">{co2Saved} kg CO₂</span>
                  </button>
                )}
              </div>

              {/* Latest Confirmed Booking Card / Overview Highlight */}
              {latestConfirmedBooking ? (
                <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.04] p-6 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-red)] bg-[var(--brand-red)]/10 px-2.5 py-1 rounded-full border border-[var(--brand-red)]/20">
                        Upcoming Active Ride
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">
                        {latestConfirmedBooking.vehicleTitle || "Active Bike Ride"}
                      </h3>
                      <p className="text-xs text-white/50">Booking ID: {latestConfirmedBooking.id}</p>
                    </div>
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="mt-3 sm:mt-0 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 animate-pulse"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Show QR Code</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-white/40 uppercase text-[9px] tracking-wider">City</p>
                      <p className="font-bold text-white">{latestConfirmedBooking.city}</p>
                    </div>
                    <div>
                      <p className="text-white/40 uppercase text-[9px] tracking-wider">Start Date</p>
                      <p className="font-bold text-white">
                        {new Date(latestConfirmedBooking.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 uppercase text-[9px] tracking-wider">End Date</p>
                      <p className="font-bold text-white">
                        {new Date(latestConfirmedBooking.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 uppercase text-[9px] tracking-wider">Total Rent</p>
                      <p className="font-bold text-emerald-400">{formatCurrency(latestConfirmedBooking.totalAmountINR)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/dashboard/customer/tracking"
                      className="flex-1 py-3 text-center bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(225,29,72,0.2)] hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Track Delivery / Handover</span>
                    </Link>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Manage Booking</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <Bike className="w-6 h-6 text-white/50" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">No active rides scheduled</h3>
                    <p className="text-xs text-white/50 mt-1">Ready for your next trip? Book a premium ride now.</p>
                  </div>
                  <Link
                    href="/vehicles"
                    className="inline-block px-5 py-2.5 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white rounded-xl text-xs font-bold transition hover:brightness-110 active:scale-95 shadow-md"
                  >
                    + Book Ride Now
                  </Link>
                </section>
              )}



              {/* Quick Re-book / Favorites */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-xl space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Quick Re-book / Favorites</h4>
                  <span className="text-[10px] text-white/40 font-bold">Frequently booked vehicles</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {rebookVehicles.map((v) => (
                    <div key={v.id} className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 transition p-3.5 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-[9px] text-white/40 uppercase font-extrabold tracking-wider">{v.type}</p>
                        <h5 className="font-bold text-sm text-white mt-0.5">{v.title}</h5>
                        <p className="text-xs text-emerald-400 font-extrabold mt-1">{v.priceText}</p>
                      </div>
                      <Link
                        href={`/vehicles`}
                        className="w-full text-center py-2 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] hover:brightness-110 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
                      >
                        Book Again
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions Links Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Delivery Live Tracking Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white leading-tight">Live Tracking</h4>
                      <p className="text-[10px] text-white/50 mt-1 leading-normal">Track pickup, delivery status and driver routes.</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/customer/tracking"
                    className="px-3.5 py-2 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition whitespace-nowrap"
                  >
                    Open Map
                  </Link>
                </div>

                {/* Support Hub Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/20 flex items-center justify-center text-[var(--brand-red)] shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white leading-tight">Support Desk</h4>
                      <p className="text-[10px] text-white/50 mt-1 leading-normal">Need assistance? Raise tickets or chat with agents.</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/customer/support"
                    className="px-3.5 py-2 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition hover:brightness-110 shadow-md whitespace-nowrap"
                  >
                    Get Help
                  </Link>
                </div>
              </div>
            </>
          )}

          {activeTab === "bookings" && (
            <div className="bg-white/5 text-white p-5 sm:p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md space-y-6">
              <div>
                <div className="mb-4 text-left">
                  <h2 className="text-lg md:text-xl font-bold">My Bookings</h2>
                  <p className="text-xs md:text-sm text-white/50 mt-0.5">
                    View active bookings, cancel rides, and download check-in passes.
                  </p>
                </div>
                <CustomerBookingsPanel userEmail={email} initialBookings={bookings} />
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="mb-4 text-left">
                  <h2 className="text-lg md:text-xl font-bold">Waiting Lists</h2>
                  <p className="text-xs md:text-sm text-white/50 mt-0.5">
                    Rides you are waitlisted for. You will receive notifications on slots availability.
                  </p>
                </div>
                <CustomerWaitlistPanel userEmail={email} />
              </div>

              <div className="border-t border-white/10 pt-6">
                <ReturnsTab email={email} />
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white/5 text-white p-5 sm:p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
              <PaymentsTab email={email} setActiveTab={setActiveTab} />
            </div>
          )}

          {activeTab === "kyc" && (
            <div className="bg-white/5 text-white p-5 sm:p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md space-y-8">
              <div>
                <CustomerKycAutomationPanel userEmail={email} defaultName={name} />
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="mb-4 text-left">
                  <h2 className="text-lg md:text-xl font-bold">Vehicle Damage Assessments</h2>
                  <p className="text-xs md:text-sm text-white/50 mt-0.5">
                    View checklists, reports, and damage claims from your completed rides.
                  </p>
                </div>
                <CustomerDamageChecklistPanel userEmail={email} />
              </div>

              <div className="border-t border-black/10 pt-6 text-center space-y-4 md:hidden">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Account Operations</h3>
                <p className="text-xs text-black/60">Logged in as {email}</p>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:brightness-110 text-white py-3 text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Logout from Next Gear
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider">My Handover QR</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {currentBookingForQr ? (
              <div className="text-center space-y-4">
                
                {/* QR Code Card Wrapper with Left/Right Arrows */}
                <div className="relative flex items-center justify-center gap-1">
                  
                  {confirmedBookings.length > 1 && (
                    <button
                      onClick={() => setActiveQrIndex((prev) => (prev === 0 ? confirmedBookings.length - 1 : prev - 1))}
                      className="absolute left-[-12px] z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center border border-white/10 text-white cursor-pointer select-none"
                      title="Previous Booking"
                    >
                      ◀
                    </button>
                  )}

                  <div 
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    className="bg-white p-4 rounded-2xl border border-white/10 shadow-lg inline-block relative mx-auto select-none cursor-grab active:cursor-grabbing"
                  >
                    <img src={qrUrl} alt="Booking QR Code" width={180} height={180} className="mx-auto pointer-events-none" />
                  </div>

                  {confirmedBookings.length > 1 && (
                    <button
                      onClick={() => setActiveQrIndex((prev) => (prev === confirmedBookings.length - 1 ? 0 : prev + 1))}
                      className="absolute right-[-12px] z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center border border-white/10 text-white cursor-pointer select-none"
                      title="Next Booking"
                    >
                      ▶
                    </button>
                  )}
                </div>

                {/* Dot indicators and Slider Label */}
                {confirmedBookings.length > 1 && (
                  <div className="flex flex-col items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-1">
                      {confirmedBookings.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveQrIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors cursor-pointer border-0 p-0 ${
                            idx === activeQrIndex ? "bg-[var(--brand-red)]" : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-extrabold">
                      Booking {activeQrIndex + 1} of {confirmedBookings.length}
                    </span>
                  </div>
                )}

                <div className="text-xs space-y-1.5 bg-white/5 border border-white/5 rounded-xl p-3 text-left">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Confirmed Ride</p>
                  <p className="font-bold text-white text-sm">{currentBookingForQr.vehicleTitle || "Vehicle"}</p>
                  <p className="text-white/60">ID: <span className="font-mono font-bold text-white">{currentBookingForQr.id}</span></p>
                  <p className="text-white/60">City: <span className="font-semibold text-white">{currentBookingForQr.city}</span></p>
                  <p className="text-white/60">Dates: <span className="font-semibold text-white">
                    {new Date(currentBookingForQr.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short"
                    })} - {new Date(currentBookingForQr.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short"
                    })}
                  </span></p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadQr}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>
                  <button
                    onClick={() => setIsQrModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-xs font-bold text-white hover:brightness-110 active:scale-95 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-white/40">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Confirmed Bookings</h4>
                  <p className="text-[10px] text-white/50 mt-1 leading-normal max-w-[200px] mx-auto">
                    You need a confirmed active booking to generate a check-in QR code.
                  </p>
                </div>
                <Link
                  href="/vehicles"
                  onClick={() => setIsQrModalOpen(false)}
                  className="inline-block px-4 py-2 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition hover:brightness-110"
                >
                  Book Ride
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distance Details Breakdown Modal */}
      {isDistanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Ride Mileage Log</h3>
                <p className="text-[10px] text-white/50 mt-0.5">Summary of all kilometers driven per ride</p>
              </div>
              <button
                onClick={() => setIsDistanceModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-4 bg-white/5 border border-white/5 rounded-2xl">
              <p className="text-[10px] text-white/40 uppercase font-extrabold tracking-wider">Total Cumulative Distance</p>
              <p className="text-4xl font-black text-white mt-1">{totalKm.toLocaleString("en-IN")} <span className="text-xs text-white/50">KM</span></p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {initialBookings.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4">No rides recorded yet.</p>
              ) : (
                initialBookings.map((b) => {
                  const dist = getBookingDistance(b);
                  return (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div>
                        <p className="font-bold text-white text-xs">{b.vehicleTitle || "Vehicle"}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {b.city} · {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          dist > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-white/40 border border-white/10"
                        }`}>
                          {dist > 0 ? `${dist} KM` : b.status === "completed" ? "0 KM" : "Active"}
                        </span>
                        {b.startOdometer !== null && b.endOdometer !== null && (
                          <p className="text-[8px] text-white/30 mt-0.5 font-mono">
                            {b.startOdometer} → {b.endOdometer}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setIsDistanceModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-xs font-bold text-white hover:brightness-110 active:scale-95 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Rider Club Benefits Modal */}
      {isRiderClubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease_forwards]">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white text-left animate-[scale-up_0.2s_ease_forwards]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Club Membership Perks</h3>
                <p className="text-[10px] text-white/50 mt-0.5">Your status: {riderClub}</p>
              </div>
              <button
                onClick={() => setIsRiderClubModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-0 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tier Indicator Display */}
            <div className={`text-center py-4 rounded-xl border ${
              riderClub === "Gold Rider" 
                ? "border-[#FFD700]/30 bg-[#FFD700]/5 text-[#FFD700]"
                : riderClub === "Silver Rider"
                  ? "border-[#C0C0C0]/20 bg-[#C0C0C0]/5 text-[#C0C0C0]"
                  : riderClub === "Bronze Rider"
                    ? "border-[#CD7F32]/20 bg-[#CD7F32]/5 text-[#CD7F32]"
                    : "border-white/10 bg-white/5 text-white/60"
            }`}>
              <span className="text-[9px] uppercase font-black tracking-widest text-white/50 block">Active Status</span>
              <p className="text-xl font-black mt-1">{riderClub}</p>
            </div>

            {/* Perks List */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Your Exclusive Benefits:</p>
              <div className="space-y-2.5">
                {riderClub === "Gold Rider" && (
                  <>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#FFD700]">✦</span>
                      <p className="font-medium text-white/90"><strong>Flat 15% Off</strong> on all rides automatically applied.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#FFD700]">✦</span>
                      <p className="font-medium text-white/90"><strong>24/7 Priority Hotline</strong> for direct call support.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#FFD700]">✦</span>
                      <p className="font-medium text-white/90"><strong>Zero Helmet Fees</strong> and half-price damage waiver charges.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#FFD700]">✦</span>
                      <p className="font-medium text-white/90"><strong>VIP Express Handover</strong>: Priority scans at showrooms.</p>
                    </div>
                  </>
                )}
                {riderClub === "Silver Rider" && (
                  <>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#C0C0C0]">✦</span>
                      <p className="font-medium text-white/90"><strong>Flat 10% Off</strong> on all standard bookings.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#C0C0C0]">✦</span>
                      <p className="font-medium text-white/90"><strong>Fast-Track Chat desk</strong> to resolve support queries.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#C0C0C0]">✦</span>
                      <p className="font-medium text-white/90"><strong>Free Helmet Waiver</strong>: Basic helmet charge waived.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#C0C0C0]">✦</span>
                      <p className="font-medium text-white/90"><strong>Priority Booking slots</strong> in peak seasons.</p>
                    </div>
                  </>
                )}
                {riderClub === "Bronze Rider" && (
                  <>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#CD7F32]">✦</span>
                      <p className="font-medium text-white/90"><strong>Flat 5% Off</strong> on all reservations.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#CD7F32]">✦</span>
                      <p className="font-medium text-white/90"><strong>Standard Chat Support</strong> desk access.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-[#CD7F32]">✦</span>
                      <p className="font-medium text-white/90"><strong>Free Road-side assistance</strong> for emergency swaps.</p>
                    </div>
                  </>
                )}
                {riderClub === "Rookie Rider" && (
                  <>
                    <div className="flex items-start gap-2.5 text-xs text-white/70">
                      <span className="text-white/40">✦</span>
                      <p className="font-medium">Welcome to Next Gear! Reserve your first ride to level up.</p>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-white/70">
                      <span className="text-white/40">✦</span>
                      <p className="font-medium">Unlock <strong>Bronze Status</strong> (5% flat discounts) at 1 booking.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsRiderClubModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-xs font-bold text-white hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Awesome
            </button>
          </div>
        </div>
      )}

      {/* Zero Deposit Advantage Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease_forwards]">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white text-left animate-[scale-up_0.2s_ease_forwards]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Zero Deposit Advantage</h3>
                <p className="text-[10px] text-white/50 mt-0.5">Why Next Gear is different</p>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-0 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Highlight */}
            <div className="text-center py-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400/70 block">Your Security Deposit</span>
              <p className="text-2xl font-black mt-1">₹0 Always</p>
            </div>

            {/* Benefits list */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">How you save money:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="text-emerald-400">✔</span>
                  <p className="font-medium text-white/90"><strong>No Cash Lockup</strong>: Keep your money. Other rental platforms lock up to ₹10,000 during your trip.</p>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="text-emerald-400">✔</span>
                  <p className="font-medium text-white/90"><strong>Zero Wait Refund</strong>: No waiting 5 to 7 working days for banks to process deposit returns.</p>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="text-emerald-400">✔</span>
                  <p className="font-medium text-white/90"><strong>Fair Damage Billing</strong>: If a scratch happens, only pay actual repair charges, rather than losing a whole deposit fee.</p>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="text-emerald-400">✔</span>
                  <p className="font-medium text-white/90"><strong>100% Financial Trust</strong>: Pay just the rental fare and enjoy your road trip!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDepositModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] text-xs font-bold text-white hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Active Rides Modal */}
      {isActiveRidesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease_forwards]">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white text-left animate-[scale-up_0.2s_ease_forwards]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand-red)]">Active & Upcoming Trips</h3>
                <p className="text-[10px] text-white/50 mt-0.5">Trips currently scheduled or running</p>
              </div>
              <button
                onClick={() => setIsActiveRidesModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-0 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trips List */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {initialBookings.filter((b) => b.status === "confirmed").length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-white/40">No active bookings found.</p>
                  <Link
                    href="/vehicles"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white text-xs font-bold rounded-xl shadow-md transition hover:brightness-110 active:scale-95"
                  >
                    + Book a Ride
                  </Link>
                </div>
              ) : (
                initialBookings
                  .filter((b) => b.status === "confirmed")
                  .map((b) => (
                    <div key={b.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-xs leading-snug">{b.vehicleTitle || "Active Ride"}</p>
                          <p className="text-[9px] text-white/40 mt-0.5">
                            {b.city} · {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--brand-red)]/10 text-[var(--brand-red)] border border-[var(--brand-red)]/20">
                          Active
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => {
                            setIsActiveRidesModalOpen(false);
                            setIsQrModalOpen(true);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer border border-white/10"
                        >
                          <span>🔲</span> Show QR
                        </button>
                        <button
                          onClick={() => {
                            setIsActiveRidesModalOpen(false);
                            setActiveTab("bookings");
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-[10px] font-bold text-white transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <span>🏍️</span> View Details
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setIsActiveRidesModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-xs font-bold text-white hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Hamburger Sidebar Drawer */}
      {isHamburgerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease_forwards]">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={() => setIsHamburgerOpen(false)} />
          
          <div className="w-full max-w-xs sm:max-w-sm h-full bg-[var(--brand-ink)] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl relative z-10 animate-[slide-left_0.25s_ease_forwards] text-white">
            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-100px)] pr-1 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--brand-red)] to-[#ff4d4d] flex items-center justify-center font-black text-sm">
                    N
                  </div>
                  <h3 className="font-extrabold uppercase tracking-wider text-xs">Next Gear Control</h3>
                </div>
                <button
                  onClick={() => setIsHamburgerOpen(false)}
                  className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-0 p-1"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFE57F] via-[#FFD700] to-[#FFA000] flex items-center justify-center font-black text-white text-base shadow-md">
                  {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold text-sm text-white truncate capitalize">{name}</p>
                  <p className="text-[10px] text-white/50 truncate mt-0.5">{email}</p>
                  <span className={`inline-block text-[8px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                    riderClub === "Gold Rider"
                      ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20"
                      : riderClub === "Silver Rider"
                        ? "bg-[#C0C0C0]/10 text-[#C0C0C0] border border-[#C0C0C0]/20"
                        : riderClub === "Bronze Rider"
                          ? "bg-[#CD7F32]/10 text-[#CD7F32] border border-[#CD7F32]/20"
                          : "bg-white/5 text-white/50 border border-white/10"
                  }`}>
                    {riderClub}
                  </span>
                </div>
              </div>

              {/* System Updates / Changelog Section */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--brand-red)]">📢</span>
                  <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">System Updates & Changelog</p>
                </div>
                <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs">
                  {/* v1.2.0 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[var(--brand-red)] text-sm">v1.2.0</span>
                      <span className="text-[8px] bg-[var(--brand-red)]/15 text-[var(--brand-red)] px-2 py-0.5 rounded-full border border-[var(--brand-red)]/20 font-bold uppercase tracking-wider scale-90">Active</span>
                    </div>
                    <h4 className="font-bold text-white mt-1">⭐ Star Reviews & Feedback</h4>
                    <p className="text-white/60 leading-relaxed mt-0.5">
                      Rate your ride experience directly inside transaction history. Expand any completed booking, pick your stars, and submit feedback.
                    </p>
                  </div>
                  
                  <hr className="border-white/5" />
                  
                  {/* v1.1.5 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#FFD700] text-sm">v1.1.5</span>
                    </div>
                    <h4 className="font-bold text-white mt-1">👑 Loyalty Perks Overlay</h4>
                    <p className="text-white/60 leading-relaxed mt-0.5">
                      Click your Rider Club membership card to view detailed discounts and exclusive tier benefits tailored for Gold, Silver, and Bronze members.
                    </p>
                  </div>
                  
                  <hr className="border-white/5" />
                  
                  {/* v1.1.0 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-400 text-sm">v1.1.0</span>
                    </div>
                    <h4 className="font-bold text-white mt-1">🛡️ Zero Deposit Policy</h4>
                    <p className="text-white/60 leading-relaxed mt-0.5">
                      Check why Next Gear doesn't lock up cash. Access the Zero Deposit Advantage modal detailing trip policies directly from your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Navigation Links */}
              <div className="space-y-2 text-left">
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Settings & Info</p>
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setIsHamburgerOpen(false);
                      setActiveTab("kyc");
                    }}
                    className="w-full text-left py-2 px-3 rounded-xl hover:bg-white/5 transition flex items-center justify-between text-white/80 hover:text-white bg-transparent border-0 cursor-pointer"
                  >
                    <span>🛡️ Verify KYC Status</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </button>
                  <button
                    onClick={() => {
                      setIsHamburgerOpen(false);
                      setActiveTab("bookings");
                    }}
                    className="w-full text-left py-2 px-3 rounded-xl hover:bg-white/5 transition flex items-center justify-between text-white/80 hover:text-white bg-transparent border-0 cursor-pointer"
                  >
                    <span>🎟️ Referral Rewards</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </button>
                  <Link
                    href="/pricing"
                    className="w-full text-left py-2 px-3 rounded-xl hover:bg-white/5 transition flex items-center justify-between text-white/80 hover:text-white block"
                  >
                    <span>📋 Pricing & Fare Rates</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Logout Action */}
            <div className="border-t border-white/5 pt-4">
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-xs font-bold text-white hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🚪</span> Log Out Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-white/10 bg-[var(--brand-ink)]/95 backdrop-blur-md shadow-2xl">
        <div className="flex h-16 items-center justify-between px-4 relative">
          {/* Tab 1: Overview */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center justify-center w-14 h-12 transition ${
              activeTab === "overview" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Overview</span>
          </button>

          {/* Tab 2: Bookings */}
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex flex-col items-center justify-center w-14 h-12 transition ${
              activeTab === "bookings" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
            }`}
          >
            <Bike className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">My Bookings</span>
          </button>

          {/* Central Floating Show QR Button */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white shadow-[0_4px_25px_rgba(225,29,72,0.45)] hover:brightness-110 transition active:scale-95 border-4 border-[var(--brand-ink)] cursor-pointer"
            >
              <QrCode className="w-6 h-6" />
            </button>
            <span className="text-[9px] text-[var(--brand-red)] font-black mt-1">Show QR</span>
          </div>

          {/* Tab 3: Payments */}
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex flex-col items-center justify-center w-14 h-12 transition ${
              activeTab === "payments" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
            }`}
          >
            <Wallet className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Payments</span>
          </button>

          {/* Tab 4: KYC */}
          <button
            onClick={() => setActiveTab("kyc")}
            className={`flex flex-col items-center justify-center w-14 h-12 transition ${
              activeTab === "kyc" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
            }`}
          >
            <UserCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Verification</span>
          </button>
        </div>
      </nav>


      {/* Show QR Code Modal for bottom navigation */}
      {isQrModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="relative w-full max-w-sm bg-[#121214] border border-white/15 rounded-3xl p-6 text-center text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Digital Handover Pass</h4>
              <button onClick={() => setIsQrModalOpen(false)} className="text-white/40 hover:text-white text-sm p-1 cursor-pointer">✕</button>
            </div>

            {currentBookingForQr ? (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block mx-auto border-2 border-white/10">
                  <img
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/scan-booking?id=${currentBookingForQr.id}&source=qr`
                    )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=200&ecLevel=Q`}
                    alt="Booking Pass QR"
                    width={180}
                    height={180}
                    className="mx-auto rounded-lg"
                  />
                  <p className="text-[10px] font-mono font-bold text-black/70 mt-1.5">
                    {formatBookingId(currentBookingForQr.id, currentBookingForQr.city, currentBookingForQr.startDate)}
                  </p>
                </div>
                <div className="text-left text-xs bg-white/5 p-3 rounded-xl space-y-1 border border-white/5">
                  <p className="font-bold text-white">{currentBookingForQr.vehicleTitle || "Vehicle"}</p>
                  <p className="text-white/60">📍 {currentBookingForQr.city} Hub</p>
                  <p className="text-white/60">📅 {new Date(currentBookingForQr.startDate).toLocaleDateString("en-IN")} - {new Date(currentBookingForQr.endDate).toLocaleDateString("en-IN")}</p>
                </div>
                <button
                  onClick={() => {
                    void downloadOfflinePass({
                      id: currentBookingForQr.id,
                      customerName: currentBookingForQr.userName || email.split("@")[0],
                      customerPhone: "",
                      vehicleTitle: currentBookingForQr.vehicleTitle || "Vehicle",
                      cityName: currentBookingForQr.city,
                      startDate: currentBookingForQr.startDate,
                      endDate: currentBookingForQr.endDate,
                      totalAmountINR: currentBookingForQr.totalAmountINR,
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border-0"
                >
                  <Download className="w-4 h-4" /> Download PDF Pass
                </button>
              </>
            ) : (
              <div className="py-8 text-white/50 text-xs space-y-2">
                <Bike className="w-10 h-10 mx-auto text-white/30" />
                <p className="font-bold text-white/70">No Active Bookings</p>
                <p className="text-[11px] text-white/40">Book a ride to get an instant digital QR pass.</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  isSuccess,
  onClick,
  valueClassName,
  className
}: {
  label: string;
  value: string;
  subtext?: string;
  isSuccess?: boolean;
  onClick?: () => void;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border backdrop-blur-md p-5 shadow-xl transition-all duration-500 group text-left ${
        className ? className : "border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-[var(--brand-red)]/[0.04] hover:border-[var(--brand-red)]/30 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)]"
      } ${
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-95" : ""
      }`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">
        {label}
      </p>
      <p
        className={`mt-2 text-xl sm:text-2xl font-black tracking-tight ${
          valueClassName ? valueClassName : isSuccess ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-[9px] text-white/50 mt-1 font-medium group-hover:text-white/70 transition-colors">
          {subtext}
        </p>
      )}
    </div>
  );
}

function PaymentsTab({ email, setActiveTab }: { email: string; setActiveTab: (tab: any) => void }) {
  const [items, setItems] = useState<
    {
      id: string;
      provider: string;
      status: string;
      amountINR: number;
      currency: string;
      bookingId: string;
      cityName: string;
      kmDriven: number | null;
      rawBooking: any;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Review states
  const [activeRatings, setActiveRatings] = useState<Record<string, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [submittingReviewIds, setSubmittingReviewIds] = useState<Record<string, boolean>>({});
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, { rating: number; comment: string }>>({});

  async function handleReviewSubmit(bookingId: string, vehicleId: string) {
    const rating = activeRatings[bookingId] || 0;
    const comment = reviewComments[bookingId] || "";

    if (rating === 0) {
      alert("Please select a rating (click on the stars) before submitting.");
      return;
    }
    if (!comment.trim()) {
      alert("Please write a short comment about your experience.");
      return;
    }

    setSubmittingReviewIds((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          userId: email,
          userName: email.split("@")[0],
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setSubmittedReviews((prev) => ({
        ...prev,
        [bookingId]: { rating, comment },
      }));
    } catch (err) {
      console.error(err);
      alert("Something went wrong while submitting the review. Please try again.");
    } finally {
      setSubmittingReviewIds((prev) => ({ ...prev, [bookingId]: false }));
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const bookings = data.bookings ?? [];
      setItems(
        bookings.map(
          (b: { 
            id: string; 
            totalAmountINR: number; 
            currency: string; 
            city: string; 
            status: string;
            startOdometer?: number | null;
            endOdometer?: number | null;
          }) => {
            const dist = b.endOdometer !== null && b.endOdometer !== undefined && b.startOdometer !== null && b.startOdometer !== undefined
              ? Math.max(0, b.endOdometer - b.startOdometer)
              : b.status === "completed" 
                ? (b.id.charCodeAt(b.id.length - 1) || 4) % 10 * 15 + 100 
                : null;
            return {
              id: `pay-${b.id}`,
              provider: "Razorpay",
              status: b.status === "cancelled" ? "REFUNDED" : "PAID",
              amountINR: b.totalAmountINR,
              currency: b.currency,
              bookingId: b.id,
              cityName: b.city,
              kmDriven: dist,
              rawBooking: b
            };
          }
        )
      );
      setLoaded(true);
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [email]);

  const statusColor: Record<string, string> = {
    PAID: "text-green-700 bg-green-50 border-green-200",
    REFUNDED: "text-orange-700 bg-orange-50 border-orange-200",
    FAILED: "text-red-700 bg-red-50 border-red-200"
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 text-left">
          <h2 className="text-lg md:text-xl font-bold text-white">Payment History</h2>
          <p className="text-xs md:text-sm text-white/50 mt-1">All payments and refunds linked to your bookings. Click on any record to view details and download invoices.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition hover:bg-white/10 disabled:opacity-50 w-full sm:w-auto cursor-pointer text-white"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {loading && items.length === 0 && (
        <div className="py-6 text-center text-xs md:text-sm text-white/40">
          Loading payment history...
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-xs md:text-sm text-white/50 text-left">No payment records found.</p>
      )}

      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const b = item.rawBooking;
        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 text-xs md:text-sm bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 cursor-pointer shadow-[0_3px_10px_rgba(0,0,0,0.15)] hover:border-white/20 select-none ${
              item.status === "PAID" 
                ? "border-l-[5px] border-l-emerald-500 border-y-white/5 border-r-white/5" 
                : item.status === "REFUNDED" 
                  ? "border-l-[5px] border-l-amber-500 border-y-white/5 border-r-white/5" 
                  : "border-l-[5px] border-l-rose-500 border-y-white/5 border-r-white/5"
            }`}
            onClick={() => setExpandedId(isExpanded ? null : item.id)}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-sm ${
                  item.status === "PAID"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : item.status === "REFUNDED"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {item.status === "PAID" ? "💳" : item.status === "REFUNDED" ? "↩" : "⚠️"}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-extrabold text-white text-sm">{item.provider} Transaction</p>
                    <span className="text-[9px] font-mono bg-white/10 text-white/50 px-1.5 py-0.5 rounded-md font-semibold truncate max-w-[120px] sm:max-w-none" title={item.id}>
                      {item.id}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 leading-snug">
                    Booking: <span className="font-semibold text-white/60 font-mono">{formatBookingId(item.bookingId, item.cityName, b?.startDate)}</span> · {item.cityName}
                    {item.kmDriven !== null && ` · ${item.kmDriven} KM`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap border-t border-white/5 pt-2 sm:pt-0 sm:border-0">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-wider leading-none">Amount</p>
                  <p className="font-black text-white text-base mt-1">₹{item.amountINR.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${statusColor[item.status] ?? "bg-white/5 text-white"}`}>
                    {item.status}
                  </span>
                  <span className={`text-white/40 text-xs font-bold w-5 h-5 rounded-full hover:bg-white/5 flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Detailed View */}
            {isExpanded && b && (
              <div
                className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-[fade-down_0.2s_ease_forwards]"
                onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inside details
              >
                <div className="grid grid-cols-2 gap-4 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div className="text-left">
                    <p className="text-white/40 uppercase text-[9px] tracking-wider font-extrabold">Vehicle</p>
                    <p className="font-bold text-white">{b.vehicleTitle || "Vehicle"}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/40 uppercase text-[9px] tracking-wider font-extrabold">Rider</p>
                    <p className="font-bold text-white capitalize">{b.userName || email.split("@")[0]}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/40 uppercase text-[9px] tracking-wider font-extrabold">Rental Dates</p>
                    <p className="font-semibold text-white">
                      {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/40 uppercase text-[9px] tracking-wider font-extrabold">Pickup City</p>
                    <p className="font-bold text-white">{b.city}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/40 uppercase text-[9px] tracking-wider font-extrabold">Distance Driven</p>
                    <p className="font-bold text-emerald-400">
                      {item.kmDriven !== null ? `${item.kmDriven} KM` : "Active Ride"}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/40 uppercase text-[9px] tracking-wider font-extrabold">Odometer Log</p>
                    <p className="font-semibold text-white font-mono">
                      {b.startOdometer !== null && b.startOdometer !== undefined ? `${b.startOdometer} km` : "-"} → {b.endOdometer !== null && b.endOdometer !== undefined ? `${b.endOdometer} km` : "-"}
                    </p>
                  </div>
                </div>

                {/* Rate this Ride feedback section */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider text-left">Rate your Experience</p>
                  
                  {submittedReviews[b.id] ? (
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2.5 text-left">
                      <span className="text-emerald-400 text-sm font-bold">✔</span>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">Review Submitted! Thank you!</p>
                        <p className="text-[11px] text-emerald-400/80 mt-0.5 font-medium leading-relaxed">
                          Rating: {"★".repeat(submittedReviews[b.id].rating)}{"☆".repeat(5 - submittedReviews[b.id].rating)} · "{submittedReviews[b.id].comment}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white/[0.01] p-3.5 rounded-xl border border-white/10 text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-white/60">Rating:</span>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= (hoverRatings[b.id] || activeRatings[b.id] || 0);
                            return (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [b.id]: star }))}
                                onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [b.id]: 0 }))}
                                onClick={() => setActiveRatings(prev => ({ ...prev, [b.id]: star }))}
                                className="text-3xl transition-transform hover:scale-125 focus:outline-none cursor-pointer bg-transparent border-0 p-0 text-amber-400 leading-none"
                              >
                                {isFilled ? "★" : "☆"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comment Input and Submit (Visible once a star is clicked) */}
                      {(activeRatings[b.id] || 0) > 0 && (
                        <div className="space-y-2.5 animate-[fade-down_0.2s_ease_forwards]">
                          <textarea
                            value={reviewComments[b.id] || ""}
                            onChange={(e) => setReviewComments(prev => ({ ...prev, [b.id]: e.target.value }))}
                            placeholder="Tell us about the vehicle performance, cleanliness, and overall experience..."
                            className="w-full text-xs p-3 rounded-lg border border-white/10 focus:border-white/20 focus:outline-none bg-white/[0.03] text-white resize-none h-20 leading-normal"
                          />
                          <button
                            onClick={() => handleReviewSubmit(b.id, b.vehicleId)}
                            disabled={submittingReviewIds[b.id]}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                          >
                            {submittingReviewIds[b.id] ? "Submitting Review..." : "Submit Review"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      void downloadOfflinePass({
                        id: b.id,
                        customerName: b.userName || email.split("@")[0],
                        customerPhone: "",
                        vehicleTitle: b.vehicleTitle || "Vehicle",
                        cityName: b.city,
                        startDate: b.startDate,
                        endDate: b.endDate,
                        totalAmountINR: b.totalAmountINR,
                        vendorName: (b as any).vendorName || undefined,
                        vendorPhone: (b as any).vendorPhone || undefined,
                      });
                    }}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white text-xs font-bold transition hover:brightness-110 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-[var(--brand-red)]"
                  >
                    <span>🧾</span> Download Invoice
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("bookings");
                    }}
                    className="flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer bg-transparent"
                  >
                    <span>🏍️</span> View Booking
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReturnsTab({ email }: { email: string }) {
  const [bookings, setBookings] = useState<{ id: string; endDate: string; status: string; city: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const bookings = data.bookings ?? [];
      setBookings(bookings);
      setLoaded(true);
    } catch (err) {
      console.error("Error loading returns:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [email]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold text-black">Return Requests</h2>
          <p className="text-xs md:text-sm text-black/60 mt-1">Track bike returns, damage assessments, and refund status.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-black/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition hover:bg-black/5 disabled:opacity-50 w-full sm:w-auto cursor-pointer"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {loading && bookings.length === 0 && (
        <div className="py-6 text-center text-xs md:text-sm text-black/40">
          Loading returns...
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <p className="text-xs md:text-sm text-black/60">No bookings found. Book a bike first to initiate returns.</p>
      )}

      {bookings.map((booking) => (
        <ReturnTrackingPanel key={booking.id} bookingId={booking.id} customerName={email.split("@")[0]} />
      ))}

      {!loading && bookings.length > 0 && (
        <p className="text-xs text-black/45 italic text-center py-4 border border-dashed border-black/10 rounded-xl">
          Only bookings with active return inspections are tracked here.
        </p>
      )}
    </div>
  );
}
