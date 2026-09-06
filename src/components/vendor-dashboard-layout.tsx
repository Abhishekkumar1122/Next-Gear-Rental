"use client";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { VendorFleetManager } from "./vendor-fleet-manager";
import { VendorBusinessHub } from "./vendor-business-hub";
import { BookingHandoverVerifier } from "./booking-handover-verifier";
import { VendorMobileQrCard } from "./vendor-mobile-qr-card";
import { VendorDashboardAnalytics } from "./vendor-dashboard-analytics";
import { VendorMonthlyEarningsChart } from "./vendor-monthly-earnings-chart";
import { VendorPayoutLedgerPanel } from "./vendor-payout-ledger-panel";
import NotificationBell from "./notification-bell";
import Link from "next/link";
import { audioSynth } from "@/lib/audio-effects";
import type { Vehicle } from "@/lib/types";
import {
  LayoutDashboard,
  Bike,
  Wallet,
  UserCheck,
  AlertTriangle,
  LogOut,
  X,
  Plus,
  ShieldCheck,
  MapPin,
  Building2,
  CreditCard,
  ChevronRight,
  RefreshCw,
  Send,
  Edit2,
  QrCode,
  Zap,
  Camera,
  MessageSquare,
} from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  cityName: string;
  startDate: Date | string;
  endDate: Date | string;
  totalAmountINR: number;
  status: string;
  handoverStatus: string;
  user?: {
    name: string | null;
    email: string;
  } | null;
  vehicle?: Vehicle | null;
}

interface VendorDashboardLayoutProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  vendor: {
    id: string;
    businessName: string;
    status: string;
    blacklistReason: string | null;
    customMessage?: string | null;
    commissionRate: number;
    appealText?: string | null;
    blockCount?: number;
  };
  financials: {
    totalBookings: number;
    revenueThisMonthINR: number;
    totalRevenueINR: number;
    earningsThisMonthINR: number;
    totalEarningsINR: number;
  };
  fleetVehicles: Vehicle[];
  bookings: Booking[];
  history: any[];
  mobileDashboardUrl: string;
  mustChangePassword?: boolean;
}

export function VendorDashboardLayout({
  user,
  vendor,
  financials,
  fleetVehicles,
  bookings,
  history,
  mobileDashboardUrl,
  mustChangePassword = false,
}: VendorDashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "fleet" | "earnings" | "hub">("overview");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // First-login mandatory password change state
  const [showPasswordModal, setShowPasswordModal] = useState(Boolean(mustChangePassword));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match. Please re-enter.");
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await fetch("/api/vendor/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPassError(data.error || "Failed to update password");
      } else {
        setPassSuccess(true);
        audioSynth?.playSuccess?.();
        setTimeout(() => {
          setShowPasswordModal(false);
          router.refresh();
        }, 1200);
      }
    } catch {
      setPassError("Network connection error. Please try again.");
    } finally {
      setPassSubmitting(false);
    }
  };

  // Automatic real-time polling every 20 seconds to sync new customer bookings & earnings immediately
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 20000);
    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Custom Camera References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Appeal states
  const [appealText, setAppealText] = useState("");
  const [appealSubmitted, setAppealSubmitted] = useState(!!vendor.appealText);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const submitAppeal = async () => {
    if (!appealText.trim()) return;
    setSubmittingAppeal(true);
    try {
      const res = await fetch("/api/vendor/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appealText }),
      });
      if (res.ok) {
        setAppealSubmitted(true);
      }
    } catch (err) {
      console.error("Appeal submit error:", err);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // Wallet & Withdrawal States
  const [walletBalance, setWalletBalance] = useState(financials.earningsThisMonthINR || 12450);
  const [pendingClearance, setPendingClearance] = useState(Math.round(financials.totalEarningsINR * 0.25) || 8500);
  const [payoutCycle, setPayoutCycle] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [bankDetails, setBankDetails] = useState({
    bankName: "HDFC Bank",
    accountNumber: "******4829",
    ifscCode: "HDFC0001203",
    accountHolder: user.name || "Vendor Partner"
  });
  const [withdrawalsList, setWithdrawalsList] = useState([
    { id: "W-8932", amount: 4500, type: "Standard", status: "Completed", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN") },
    { id: "W-7482", amount: 8000, type: "Express", status: "Completed", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN") },
  ]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSpeed, setWithdrawSpeed] = useState<"standard" | "express">("standard");
  const [withdrawError, setWithdrawError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Temporary state for editing bank details
  const [tempBankName, setTempBankName] = useState(bankDetails.bankName);
  const [tempAccNum, setTempAccNum] = useState("1209384829");
  const [tempIfsc, setTempIfsc] = useState(bankDetails.ifscCode);
  const [tempHolder, setTempHolder] = useState(bankDetails.accountHolder);

  const isBlacklisted = vendor.status === "blacklisted";
  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid amount.");
      return;
    }
    if (amount > walletBalance) {
      setWithdrawError("Amount exceeds your withdrawable balance.");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError("");

    // Simulate API transfer delay
    setTimeout(() => {
      audioSynth.playCashRegister();
      setWalletBalance(prev => prev - amount);
      const newWithdrawal = {
        id: `W-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amount,
        type: withdrawSpeed === "express" ? "Express" : "Standard",
        status: "Completed",
        date: new Date().toLocaleDateString("en-IN")
      };
      setWithdrawalsList(prev => [newWithdrawal, ...prev]);
      setIsWithdrawing(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
    }, 1200);
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempBankName.trim() || !tempAccNum.trim() || !tempIfsc.trim() || !tempHolder.trim()) {
      return;
    }
    audioSynth.playAlert();
    setBankDetails({
      bankName: tempBankName.trim(),
      accountNumber: `******${tempAccNum.trim().slice(-4)}`,
      ifscCode: tempIfsc.trim().toUpperCase(),
      accountHolder: tempHolder.trim()
    });
    setIsBankModalOpen(false);
  };  
  
  // Layout Scanner Camera & Torch States
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [manualBookingInput, setManualBookingInput] = useState("");

  // Check if multiple cameras are available
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
        setCameras(videoDevices);
      } catch (e) {
        console.warn("Failed to list layout cameras:", e);
      }
    };
    void checkCameras();
  }, []);

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Set default facingMode based on device type when scan modal starts
  useEffect(() => {
    if (isScanModalOpen) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setFacingMode(isMobile ? "environment" : "user");
    }
  }, [isScanModalOpen]);

  const startLayoutScanningFlow = async () => {
    setScannerError("");
    setIsTorchOn(false);
    setTorchSupported(false);

    try {
      // 1. Request camera stream directly inside the user gesture handler
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const activeFacingMode = isMobile ? "environment" : "user";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: activeFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }).catch(async (firstErr) => {
        console.warn("Layout ideal constraints failed, trying simple constraints:", firstErr);
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: activeFacingMode },
            audio: false
          });
        } catch (secondErr) {
          console.warn("Layout facingMode constraints failed, falling back to raw video:true:", secondErr);
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      });

      streamRef.current = stream;

      // 2. Open scan modal
      setIsScanModalOpen(true);

      // 3. Bind stream to video element synchronously (no setTimeout!)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        videoRef.current.play().catch((playErr) => {
          console.error("Layout video play failed:", playErr);
        });
      }

      // Start scanning loop using jsQR
      const scanFrame = () => {
        if (!streamRef.current || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            audioSynth.playSuccess();
            stopScanner();

            const decodedText = code.data;
            let targetUrl = `/dashboard/scan-booking?id=${encodeURIComponent(decodedText)}&source=qr`;

            if (decodedText.includes("mobile-hub") || decodedText.includes("/dashboard/vendor") || decodedText.includes("FLEET") || decodedText.includes("INVENTORY")) {
              targetUrl = "/dashboard/mobile-hub";
            } else if (decodedText.includes("VEHICLE_") || decodedText.includes("/vehicles/")) {
              targetUrl = `/dashboard/mobile-hub?highlight=${encodeURIComponent(decodedText)}`;
            } else if (decodedText.includes("/dashboard/scan-booking")) {
              try {
                const url = new URL(decodedText);
                url.searchParams.set("source", "qr");
                targetUrl = url.pathname + url.search;
              } catch {
                targetUrl = decodedText.includes("?") ? `${decodedText}&source=qr` : `${decodedText}?source=qr`;
              }
            }
            window.location.href = targetUrl;
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      };

      animationFrameRef.current = requestAnimationFrame(scanFrame);

      // Check if torch/flashlight is supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const capabilities = videoTrack.getCapabilities() as any;
          if (capabilities && capabilities.torch) {
            setTorchSupported(true);
          }
        } catch (capErr) {
          console.warn("Could not read capabilities:", capErr);
        }
      }

    } catch (err: any) {
      console.error("Layout camera start error:", err);
      const errStr = String(err);
      const isInteractionError = errStr.includes("interact") || errStr.includes("interaction");
      const isPermissionDenied = (err?.name === "NotAllowedError" || errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) && !isInteractionError;

      if (isInteractionError) {
        setScannerError("INTERACTION_REQUIRED");
      } else if (isPermissionDenied) {
        setScannerError("PERMISSION_DENIED");
      } else {
        setScannerError("Camera could not start. Use 'Snap Photo' option or enter Booking ID manually.");
      }
    }
  };

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanModalOpen(false);
    setIsTorchOn(false);
    setTorchSupported(false);
  };

  const toggleLayoutTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const newTorchState = !isTorchOn;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newTorchState } as any]
        });
        setIsTorchOn(newTorchState);
      } catch (err) {
        console.error("Failed to toggle layout torch:", err);
      }
    }
  };

  const switchLayoutCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to switch layout camera:", err);
    }
  };

  const requestNativeCameraAndRetry = async () => {
    stopScanner();
    setTimeout(startLayoutScanningFlow, 200);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      alert("Please scan the QR code live using the active camera feed.");
    } catch (err) {
      alert("Could not detect a valid QR code in the captured photo. Please try again or enter Booking ID manually.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white pb-28 md:pb-10 selection:bg-[var(--brand-red)]/30 selection:text-white relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-[var(--brand-red)]/[0.08] blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" aria-hidden="true" />      {/* Premium Fixed Header */}
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
              {vendor.businessName}
            </span>
          </div>

          {/* Mobile Center Brand Name */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden pointer-events-none flex flex-col items-center leading-none">
            <span className="font-display text-[11px] uppercase tracking-[0.15em] font-black text-white text-center max-w-[150px] truncate">
              {vendor.businessName || user.name || "Vendor Partner"}
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em] mt-1 text-[var(--brand-red)] font-semibold">
              Vendor Partner
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} role="VENDOR" />
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-tight">{user.name || "Vendor Partner"}</p>
              <p className="text-[10px] text-white/50 font-medium leading-none mt-0.5">{user.email}</p>
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
        {/* Blacklist Alert */}
        {isBlacklisted && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 shadow-2xl flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <h2 className="text-sm font-bold text-red-400">Vendor Account Suspended / Blacklisted</h2>
                <p className="text-xs text-red-200/90 leading-relaxed font-semibold">
                  Reason:{" "}
                  <span className="text-white font-bold">{vendor.blacklistReason ?? "Violation of platform policies"}</span>
                </p>
                {vendor.customMessage && (
                  <div className="rounded-xl border border-red-500/20 bg-black/40 p-3 text-xs text-red-200/80 leading-relaxed italic">
                    "{vendor.customMessage}"
                  </div>
                )}
              </div>
            </div>

            {/* Appeal Form */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Dispute Blacklist & Submit Response</h3>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Submit an explanation or appeal response to administrators for checking.
              </p>
              {appealSubmitted ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-emerald-400 font-bold">
                  ✓ Appeal submitted successfully. Administrative review is in progress.
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="Provide your defense, documents explanation, or request unblocking..."
                    className="w-full min-h-[100px] rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--brand-red)] leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={submitAppeal}
                      disabled={submittingAppeal || !appealText.trim()}
                      className="rounded-full bg-[var(--brand-red)] hover:bg-red-600 disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-[10px] px-6 py-2.5 transition cursor-pointer"
                    >
                      {submittingAppeal ? "Submitting Appeal..." : "Submit Appeal"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isBlacklisted && (
          <>
            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "fleet", label: "My Fleet", icon: Bike },
                  { id: "earnings", label: "Earnings", icon: Wallet },
                  { id: "hub", label: "Business Hub", icon: Building2 },
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

              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  title="Sync latest bookings & earnings"
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[var(--brand-red)]" : ""}`} />
                  <span className="hidden sm:inline">Sync</span>
                </button>
                <Link
                  href="/dashboard/vendor/deliveries"
                  className="rounded-xl border border-white/10 bg-white/5 text-white/80 px-4 py-2 text-xs font-bold transition hover:bg-white/10"
                >
                  Deliveries
                </Link>
                <Link
                  href="/dashboard/vendor/support-tickets"
                  className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white px-4 py-2 text-xs font-bold transition hover:brightness-110 shadow-[0_4px_15px_rgba(225,29,72,0.2)]"
                >
                  Support
                </Link>
              </div>
            </div>

            {/* Render Tab Contents */}
            <div className="space-y-6">
              {activeTab === "overview" && (
                <>
                  {/* Interactive Stats Cards Grid (Clickable to switch tabs) */}
                  <div className="grid grid-cols-2 gap-2.5 md:gap-4 md:grid-cols-4">
                    <StatCard
                      label="Total Vehicles"
                      value={fleetVehicles.length.toString()}
                      sublabel="Manage Fleet"
                      icon={Bike}
                      colorTheme="red"
                      onClick={() => setActiveTab("fleet")}
                    />
                    <StatCard
                      label="Commission Rate"
                      value={`${vendor.commissionRate}%`}
                      sublabel={`${100 - (Number(vendor.commissionRate) || 20)}% Payout Tier`}
                      icon={Zap}
                      colorTheme="amber"
                      onClick={() => setActiveTab("hub")}
                    />
                    <StatCard
                      label="Total Earnings"
                      value={formatCurrency(financials.totalEarningsINR)}
                      sublabel="Payout Ledger"
                      icon={Wallet}
                      colorTheme="emerald"
                      onClick={() => setActiveTab("earnings")}
                    />
                    <StatCard
                      label="Partner Status"
                      value={vendor.status === "approved" ? "Verified" : vendor.status}
                      sublabel="Gold Host Tier"
                      icon={ShieldCheck}
                      colorTheme="blue"
                      onClick={() => setActiveTab("hub")}
                    />
                  </div>

                  {/* Analytics SVG charts and Handovers Checklist */}
                  <VendorDashboardAnalytics bookings={bookings} vehicles={fleetVehicles} />

                  {/* Verification Cards */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <VendorMobileQrCard mobileDashboardUrl={mobileDashboardUrl} />
                    <BookingHandoverVerifier />
                  </div>

                  {/* Mobile Support Action Card */}
                  <div className="md:hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.04] p-5 shadow-xl flex items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/20 flex items-center justify-center text-[var(--brand-red)] shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white leading-tight">Need Platform Assistance?</h4>
                        <p className="text-[10px] text-white/50 mt-1 leading-normal">Open a priority ticket with support desk admins.</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/vendor/support-tickets"
                      className="px-4 py-2.5 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition hover:brightness-110 shadow-[0_4px_10px_rgba(225,29,72,0.2)] whitespace-nowrap cursor-pointer"
                    >
                      Support Hub
                    </Link>
                  </div>
                </>
              )}

              {activeTab === "fleet" && (
                <VendorFleetManager initialFleetVehicles={fleetVehicles} vendorId={vendor.id} bookings={bookings} />
              )}

              {activeTab === "earnings" && (
                <div className="space-y-6">
                  {/* DESKTOP-ONLY MONTHLY SALES & EARNINGS LINE CHART */}
                  <VendorMonthlyEarningsChart bookings={bookings} totalEarningsINR={financials.totalEarningsINR} />

                  {/* VENDOR PAYOUT LEDGER & GST SETTLEMENT PANEL */}
                  <VendorPayoutLedgerPanel vendor={vendor} grossRevenueINR={financials.totalRevenueINR} totalEarningsINR={financials.totalEarningsINR} />
                </div>
              )}

              {activeTab === "hub" && (
                <VendorBusinessHub user={user} vendor={vendor} fleetCount={fleetVehicles.length} bookings={bookings} financials={financials} />
              )}
            </div>
          </>
        )}
      </main>

      {/* Built-in Webcam QR Scanner Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 ${isScanModalOpen ? "block" : "hidden"}`}>
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white">
          <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">Scan Customer QR</h3>
              <button onClick={stopScanner} className="text-slate-400 hover:text-white transition cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/15 bg-black aspect-square flex items-center justify-center relative group">
              {!scannerError && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover rounded-xl"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {/* Up & Down Animated Cyber Laser Scanline */}
              {!scannerError && (
                <>
                  <div className="pointer-events-none absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444,_0_0_25px_#ef4444] z-20 animate-scanline" />
                  
                  {/* Corner Target Reticles */}
                  <div className="pointer-events-none absolute inset-4 border border-dashed border-red-500/20 rounded-xl z-10">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-sm" />
                  </div>
                </>
              )}

              {scannerError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-3">
                  {scannerError === "INTERACTION_REQUIRED" ? (
                    <>
                      <div className="text-3xl">👆</div>
                      <p className="text-sm font-bold text-amber-400">Interaction Required</p>
                      <p className="text-xs text-slate-300 leading-relaxed px-4">
                        Please tap or click anywhere on the page to enable camera preview.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setScannerError("");
                          setIsScanModalOpen(false);
                          setTimeout(() => setIsScanModalOpen(true), 200);
                        }}
                        className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg active:scale-95 transition cursor-pointer"
                      >
                        Activate Camera Feed
                      </button>
                    </>
                  ) : scannerError === "PERMISSION_DENIED" ? (
                    <>
                      <div className="text-3xl">📵</div>
                      <p className="text-sm font-bold text-red-400">Camera Access Blocked</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Browser ne camera block kar diya hai. Enable karne ke liye:
                      </p>
                      <div className="text-left w-full bg-white/5 rounded-xl p-3 space-y-1.5">
                        <p className="text-[11px] text-white">🔒 <strong>Chrome/Android:</strong> URL bar ke left 🔒 icon tap karein → Camera → Allow</p>
                        <p className="text-[11px] text-white">🍎 <strong>Safari/iOS:</strong> Settings → Safari → Camera → Allow</p>
                      </div>
                      <button
                        type="button"
                        onClick={requestNativeCameraAndRetry}
                        className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" /> Allow karne ke baad Retry karein
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl">📷</div>
                      <p className="text-xs text-amber-300 font-medium leading-relaxed">{scannerError}</p>
                      <button
                        type="button"
                        onClick={requestNativeCameraAndRetry}
                        className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" /> Retry Camera
                      </button>
                    </>
                  )}

                  <div className="w-full space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-slate-800 border border-white/20 text-white shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 hover:bg-slate-700"
                    >
                      📸 Snap Photo with Phone Camera App
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleQrFileUpload}
                    />
                  </div>

                  <div className="w-full border-t border-white/10 my-1 pt-2 space-y-2">
                    <p className="text-[10px] text-slate-400">Ya Booking ID manually darj karein:</p>
                    <input
                      type="text"
                      placeholder="e.g. NG849102 or Booking ID"
                      value={manualBookingInput}
                      onChange={(e) => setManualBookingInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualBookingInput.trim()) return;
                        audioSynth.playSuccess();
                        stopScanner();
                        router.push(`/dashboard/scan-booking?id=${encodeURIComponent(manualBookingInput.trim())}&source=manual`);
                      }}
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg active:scale-95 transition cursor-pointer"
                    >
                      Verify Booking Pass ➔
                    </button>
                  </div>
                </div>
              )}
              {!scannerError && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-30">
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleLayoutTorch}
                      className={`p-2.5 rounded-full border border-white/20 text-white transition active:scale-95 cursor-pointer backdrop-blur-md ${
                        isTorchOn ? "bg-[var(--brand-red)]/85" : "bg-black/60 hover:bg-black/80"
                      }`}
                      title="Toggle Flashlight"
                    >
                      <Zap className="w-4 h-4" fill={isTorchOn ? "currentColor" : "none"} />
                    </button>
                  )}
                  {cameras.length > 1 && (
                    <button
                      type="button"
                      onClick={switchLayoutCamera}
                      className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition active:scale-95 cursor-pointer"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={stopScanner}
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              Cancel Scan
            </button>
          </div>
        </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider">Request Withdrawal</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-white/60 hover:text-white transition cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Withdrawable Balance</label>
                <p className="text-xl font-black gradient-text">{formatCurrency(walletBalance)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-white/50">Amount (INR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:outline-none"
                />
              </div>

              {/* Settlement Speed Choice */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-white/50">Transfer Speed</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawSpeed("standard")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      withdrawSpeed === "standard"
                        ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.03]"
                        : "border-white/5 bg-white/[0.01] hover:bg-white/5"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Standard</p>
                    <p className="text-[9px] text-white/50 mt-0.5">3-5 business days · Free</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawSpeed("express")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      withdrawSpeed === "express"
                        ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.03]"
                        : "border-white/5 bg-white/[0.01] hover:bg-white/5"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Express (1-Day)</p>
                    <p className="text-[9px] text-white/50 mt-0.5">Settled in 24h · 1.0% fee</p>
                  </button>
                </div>
              </div>

              {/* Bank Details Confirmation */}
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 text-xs space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Receiving Bank Account</p>
                <p className="font-bold text-white">{bankDetails.bankName} · {bankDetails.accountNumber}</p>
                <p className="text-[10px] text-white/50">IFSC: {bankDetails.ifscCode} | Name: {bankDetails.accountHolder}</p>
              </div>

              {withdrawError && (
                <p className="text-xs text-red-400 font-semibold">{withdrawError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isWithdrawing ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* First-Login Mandatory Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#0f0f12] p-6 md:p-8 shadow-2xl space-y-5 text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

            <div className="space-y-2 text-center relative z-10">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-[var(--brand-red)]" />
              </div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-950/60 border border-red-500/30 px-3 py-1 rounded-full">
                Security Protocol
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Set Your Permanent Password
              </h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                Welcome to Next Gear Fleet Network! Please create your own secure password to protect your partner account.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 relative z-10">
              {/* Locked User ID */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Permanent Partner Login ID (Fixed)
                </label>
                <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-emerald-400 font-mono font-bold flex items-center justify-between select-all">
                  <span>{user.email}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded">Fixed</span>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-[10px] text-white/40 hover:text-white transition cursor-pointer"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--brand-red)] focus:outline-none transition"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--brand-red)] focus:outline-none transition"
                />
              </div>

              {passError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Password updated successfully! Unlocking dashboard...</span>
                </div>
              )}

              <button
                type="submit"
                disabled={passSubmitting || passSuccess}
                className="w-full rounded-xl bg-[var(--brand-red)] hover:bg-red-700 disabled:opacity-50 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/50 transition duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {passSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Secure Password...</span>
                  </>
                ) : passSuccess ? (
                  <span>✓ Unlocked</span>
                ) : (
                  <span>Save Password & Unlock Dashboard →</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Details Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[var(--brand-ink)] p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider">Update Settlement Bank</h3>
              <button onClick={() => setIsBankModalOpen(false)} className="text-white/60 hover:text-white transition cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-white/50">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={tempHolder}
                  onChange={(e) => setTempHolder(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-white/50">Bank Name</label>
                <input
                  type="text"
                  required
                  value={tempBankName}
                  onChange={(e) => setTempBankName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-white/50">Account Number</label>
                  <input
                    type="text"
                    required
                    value={tempAccNum}
                    onChange={(e) => setTempAccNum(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-white/50">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={tempIfsc}
                    onChange={(e) => setTempIfsc(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile */}
      {!isBlacklisted && (
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

            {/* Tab 2: My Fleet */}
            <button
              onClick={() => setActiveTab("fleet")}
              className={`flex flex-col items-center justify-center w-14 h-12 transition ${
                activeTab === "fleet" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
              }`}
            >
              <Bike className="w-5 h-5 mb-0.5" />
              <span className="text-[9px]">My Fleet</span>
            </button>

            {/* Central Floating Scan Button */}
            <div className="relative -top-5 flex flex-col items-center">
              <button
                onClick={startLayoutScanningFlow}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white shadow-[0_4px_25px_rgba(225,29,72,0.45)] hover:brightness-110 transition active:scale-95 border-4 border-[var(--brand-ink)] cursor-pointer"
              >
                <QrCode className="w-6 h-6" />
              </button>
              <span className="text-[9px] text-[var(--brand-red)] font-black mt-1">Scan QR</span>
            </div>

            {/* Tab 3: Earnings */}
            <button
              onClick={() => setActiveTab("earnings")}
              className={`flex flex-col items-center justify-center w-14 h-12 transition ${
                activeTab === "earnings" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
              }`}
            >
              <Wallet className="w-5 h-5 mb-0.5" />
              <span className="text-[9px]">Earnings</span>
            </button>

            {/* Tab 4: Business Hub */}
            <button
              onClick={() => setActiveTab("hub")}
              className={`flex flex-col items-center justify-center w-14 h-12 transition ${
                activeTab === "hub" ? "text-[var(--brand-red)] font-black" : "text-white/60 font-semibold"
              }`}
            >
              <Building2 className="w-5 h-5 mb-0.5" />
              <span className="text-[9px]">Biz Hub</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  colorTheme = "red",
  onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  colorTheme?: "red" | "amber" | "emerald" | "blue";
  onClick?: () => void;
}) {
  const themeStyles = {
    red: "from-red-950/40 via-neutral-900/70 to-neutral-950/90 border-red-500/20 hover:border-red-500/50 shadow-red-950/20 text-red-400",
    amber: "from-amber-950/40 via-neutral-900/70 to-neutral-950/90 border-amber-500/20 hover:border-amber-500/50 shadow-amber-950/20 text-amber-400",
    emerald: "from-emerald-950/40 via-neutral-900/70 to-neutral-950/90 border-emerald-500/20 hover:border-emerald-500/50 shadow-emerald-950/20 text-emerald-400",
    blue: "from-blue-950/40 via-neutral-900/70 to-neutral-950/90 border-blue-500/20 hover:border-blue-500/50 shadow-blue-950/20 text-blue-400",
  }[colorTheme];

  const iconBg = {
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  }[colorTheme];

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl md:rounded-3xl border bg-gradient-to-br p-3.5 md:p-5 backdrop-blur-md shadow-xl transition-all duration-300 active:scale-95 cursor-pointer text-left w-full hover:shadow-2xl ${themeStyles}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-white/50 group-hover:text-white/80 transition-colors truncate">
          {label}
        </span>
        {Icon && (
          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${iconBg}`}>
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
        )}
      </div>

      <div className="mt-1.5 md:mt-2.5 flex items-baseline justify-between">
        <p className="text-xl md:text-3xl font-black tracking-tight text-white group-hover:scale-105 transition-transform origin-left font-mono truncate">
          {value}
        </p>
      </div>

      {sublabel && (
        <div className="mt-1.5 flex items-center justify-between text-[9px] md:text-[10px] font-semibold text-white/40 group-hover:text-white/80 transition-colors pt-0.5 border-t border-white/5">
          <span className="truncate">{sublabel}</span>
          <span className="text-white/40 group-hover:translate-x-1 transition-transform shrink-0 font-bold">→</span>
        </div>
      )}
    </button>
  );
}
