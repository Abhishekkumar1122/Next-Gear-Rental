"use client";

import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
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

  // 6-Month Fast-Track KYC & Document Handover States
  const [kycStatus, setKycStatus] = useState<string>("unverified");
  const [kycExpiresAt, setKycExpiresAt] = useState<string | null>(null);
  const [isHandoverOtpVerified, setIsHandoverOtpVerified] = useState<boolean>(false);
  const [dlNumber, setDlNumber] = useState<string>("");
  const [dlName, setDlName] = useState<string>("");
  const [dlPhoto, setDlPhoto] = useState<string | null>(null);
  const [aadhaarFrontPhoto, setAadhaarFrontPhoto] = useState<string | null>(null);
  const [aadhaarBackPhoto, setAadhaarBackPhoto] = useState<string | null>(null);
  const [matchedDocs, setMatchedDocs] = useState<Record<string, boolean>>({
    dl: false,
    aadhaarFront: false,
    aadhaarBack: false,
  });
  
  // WhatsApp OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [handoverOtpInput, setHandoverOtpInput] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [activePreviewDoc, setActivePreviewDoc] = useState<{ title: string; url: string; docType: string } | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<"dl" | "aadhaarFront" | "aadhaarBack" | "all">("all");
  const [showOtpDrawer, setShowOtpDrawer] = useState(false);

  const handleSendHandoverOtp = async () => {
    if (!bookingId || !booking?.customerPhone) return;
    setIsSendingOtp(true);
    setOtpMessage(null);
    try {
      const res = await fetch("/api/kyc/send-handover-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          customerPhone: booking.customerPhone,
          customerName: booking.customerName,
          vehicleTitle: booking.vehicleTitle,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        if (data.devOtp) {
          setOtpMessage(`📲 OTP sent to customer WhatsApp! (Test Code: ${data.devOtp})`);
        } else {
          setOtpMessage("📲 OTP sent to customer WhatsApp! Ask customer for 4-digit code.");
        }
      } else {
        alert(data.error || "Failed to send handover OTP.");
      }
    } catch {
      alert("Network error while sending OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyHandoverOtp = async () => {
    if (!bookingId || !handoverOtpInput.trim()) {
      alert("Please enter the 4-digit OTP shared by customer.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/kyc/verify-handover-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          enteredOtp: handoverOtpInput.trim(),
          customerPhone: booking?.customerPhone,
          customerName: booking?.customerName,
          customerEmail: booking?.customerEmail,
          documents: {
            dlUrl: dlPhoto || (booking as any)?.drivingLicenseUrl,
            dlNo: dlNumber || (booking as any)?.drivingLicenseNo,
            aadhaarFrontUrl: aadhaarFrontPhoto || (booking as any)?.aadhaarFrontUrl,
            aadhaarBackUrl: aadhaarBackPhoto || (booking as any)?.aadhaarBackUrl,
          }
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsHandoverOtpVerified(true);
        setKycStatus("approved");
        setKycExpiresAt(data.kycProfile?.expiresAt || null);
        setOtpMessage("🎉 Handover OTP Verified! Customer authorized for key release.");
        setPhotoSubmitToast("👑 Handover OTP Verified! Step 2 Unlocked.");
        setTimeout(() => setPhotoSubmitToast(null), 5000);
      } else {
        alert(data.error || "Invalid OTP entered.");
      }
    } catch {
      alert("Network error while verifying OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDirectPhysicalApprove = async () => {
    if (!bookingId) return;
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/kyc/verify-handover-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          isPhysicalVerified: true,
          enteredOtp: "PHYSICAL_VERIFIED",
          customerPhone: booking?.customerPhone,
          customerName: booking?.customerName,
          customerEmail: booking?.customerEmail,
          documents: {
            dlUrl: dlPhoto || (booking as any)?.drivingLicenseUrl,
            dlNo: dlNumber || (booking as any)?.drivingLicenseNo,
            aadhaarFrontUrl: aadhaarFrontPhoto || (booking as any)?.aadhaarFrontUrl,
            aadhaarBackUrl: aadhaarBackPhoto || (booking as any)?.aadhaarBackUrl,
          }
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsHandoverOtpVerified(true);
        setKycStatus("approved");
        setKycExpiresAt(data.kycProfile?.expiresAt || null);
        setMatchedDocs({ dl: true, aadhaarFront: true, aadhaarBack: true });
        setOtpMessage("🎉 Physical verification approved! Step 2 Unlocked.");
        setPhotoSubmitToast("👑 Handover Authorized! Step 2 Unlocked.");
        setTimeout(() => setPhotoSubmitToast(null), 5000);
      } else {
        alert(data.error || "Failed to approve physical verification.");
      }
    } catch {
      alert("Network error while approving verification.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSpotPhotoRecapture = (type: "dl" | "aadhaarFront" | "aadhaarBack", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultStr = reader.result as string;
      if (type === "dl") {
        setDlPhoto(resultStr);
        setMatchedDocs(prev => ({ ...prev, dl: true }));
      } else if (type === "aadhaarFront") {
        setAadhaarFrontPhoto(resultStr);
        setMatchedDocs(prev => ({ ...prev, aadhaarFront: true }));
      } else {
        setAadhaarBackPhoto(resultStr);
        setMatchedDocs(prev => ({ ...prev, aadhaarBack: true }));
      }

      const docLabel = type === "dl" ? "Driving License" : type === "aadhaarFront" ? "Aadhaar Front" : "Aadhaar Back";
      setPhotoSubmitToast(`📸 Fresh ${docLabel} captured! Uploading...`);
      setTimeout(() => setPhotoSubmitToast(null), 3000);

      try {
        const uploadRes = await fetch("/api/bookings/handover/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: resultStr }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.imageUrl) {
          if (type === "dl") setDlPhoto(uploadData.imageUrl);
          else if (type === "aadhaarFront") setAadhaarFrontPhoto(uploadData.imageUrl);
          else setAadhaarBackPhoto(uploadData.imageUrl);
          setPhotoSubmitToast(`✅ ${docLabel} updated & saved successfully!`);
          setTimeout(() => setPhotoSubmitToast(null), 3000);
        }
      } catch (err) {
        console.error("Cloudinary upload error", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return "";
    const clean = phone.trim();
    if (clean.length < 8) return clean;
    return clean.slice(0, 3) + "•••••" + clean.slice(-2);
  };
  
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
        "dlChecked",
        "aadhaarChecked",
        "vehicleCondition",
        "odoRecorded",
        "helmetProvided",
        "balanceCollected",
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
        setKycStatus(data.booking.kycStatus || "unverified");
        if (data.booking.customerName) {
          setDlName(data.booking.customerName);
        }
        if (data.booking.drivingLicenseUrl) {
          setDlPhoto(data.booking.drivingLicenseUrl);
        }
        if (data.booking.aadhaarFrontUrl) {
          setAadhaarFrontPhoto(data.booking.aadhaarFrontUrl);
        }
        if (data.booking.aadhaarBackUrl) {
          setAadhaarBackPhoto(data.booking.aadhaarBackUrl);
        }
        if (data.booking.drivingLicenseNo) {
          setDlNumber(data.booking.drivingLicenseNo);
        }

        // Cross-reference customer live 6-month KYC profile
        if (data.booking.customerPhone) {
          try {
            const kycRes = await fetch(`/api/kyc/customer-status?phone=${encodeURIComponent(data.booking.customerPhone)}`);
            if (kycRes.ok) {
              const kycData = await kycRes.json();
              if (kycData.isVerified) {
                setKycStatus("approved");
                setKycExpiresAt(kycData.expiresAt);
                setMatchedDocs({ dl: true, aadhaarFront: true, aadhaarBack: true });
                if (kycData.documents?.dlUrl) setDlPhoto(kycData.documents.dlUrl);
                if (kycData.documents?.aadhaarFrontUrl) setAadhaarFrontPhoto(kycData.documents.aadhaarFrontUrl);
                if (kycData.documents?.aadhaarBackUrl) setAadhaarBackPhoto(kycData.documents.aadhaarBackUrl);
                if (kycData.documents?.dlNo) setDlNumber(kycData.documents.dlNo);
              }
            }
          } catch {}
        }
        // Pre-fill fields if already populated
        if (data.booking.handoverStatus === "RELEASED" || data.booking.handoverStatus === "RETURNED") {
          setIsHandoverOtpVerified(true);
          setOdometer(data.booking.endOdometer ? String(data.booking.endOdometer) : "");
          setFuel(data.booking.endFuel ?? "Full");
          setUploadedPhotos(data.booking.endPhotos ?? []);
        } else {
          setIsHandoverOtpVerified(false);
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

  const getGPSCoordinates = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const generateGeoTaggedImage = async (imageSrc: string, slotName: string): Promise<string> => {
    const coordsObj = await getGPSCoordinates().catch(() => null);
    let coords = "28.5355° N, 77.3910° E"; // default fallback (Delhi/Noida)
    if (coordsObj) {
      const latStr = `${Math.abs(coordsObj.lat).toFixed(4)}° ${coordsObj.lat >= 0 ? "N" : "S"}`;
      const lngStr = `${Math.abs(coordsObj.lng).toFixed(4)}° ${coordsObj.lng >= 0 ? "E" : "W"}`;
      coords = `${latStr}, ${lngStr}`;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        // Scale down image to a max width of 1280px or max height of 960px to fit Vercel serverless request limits (keeps file size ~150KB)
        const maxW = 1280;
        const maxH = 960;
        let w = img.width || 600;
        let h = img.height || 450;

        if (w > maxW) {
          const ratio = maxW / w;
          w = maxW;
          h = Math.floor(h * ratio);
        }
        if (h > maxH) {
          const ratio = maxH / h;
          h = maxH;
          w = Math.floor(w * ratio);
        }

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

        // Export as compressed JPEG to reduce payload sizes drastically
        resolve(canvas.toDataURL("image/jpeg", 0.8));
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
  const [photoUploadStatuses, setPhotoUploadStatuses] = useState<Record<number, 'uploading' | 'done' | 'failed'>>({});

  const handleConfirmPhotoSubmit = () => {
    if (!pendingCapturedPhoto) return;
    const { slotIdx, slotName, geoTaggedUrl } = pendingCapturedPhoto;

    // 1. Temporarily store local geotagged data URL in uploadedPhotos array instantly
    setUploadedPhotos((prev) => {
      const next = [...prev];
      next[slotIdx] = geoTaggedUrl;
      return next;
    });

    // 2. Set status to uploading for this specific index
    setPhotoUploadStatuses((prev) => ({ ...prev, [slotIdx]: 'uploading' }));

    // 3. Instantly close the modal so vendor can take the next photo
    setPendingCapturedPhoto(null);
    setPhotoSubmitToast(`📸 Photo ${slotIdx + 1}/5 (${slotName}) queued for background upload...`);
    setTimeout(() => setPhotoSubmitToast(null), 3000);

    // 4. Trigger concurrent background upload to Cloudinary
    fetch("/api/bookings/handover/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: geoTaggedUrl })
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.imageUrl) {
        // Swap local data URL with secure Cloudinary URL
        setUploadedPhotos((prev) => {
          const next = [...prev];
          next[slotIdx] = data.imageUrl;
          return next;
        });
        setPhotoUploadStatuses((prev) => ({ ...prev, [slotIdx]: 'done' }));
        setPhotoSubmitToast(`✅ Photo ${slotIdx + 1}/5 (${slotName}) uploaded successfully!`);
        setTimeout(() => setPhotoSubmitToast(null), 3000);
      } else {
        // Fallback to local geotagged data URL so vendor is never blocked
        setPhotoUploadStatuses((prev) => ({ ...prev, [slotIdx]: 'done' }));
        setPhotoSubmitToast(`✅ Photo ${slotIdx + 1}/5 saved with Geo-Stamp!`);
        setTimeout(() => setPhotoSubmitToast(null), 3000);
      }
    })
    .catch(() => {
      // Fallback to local geotagged data URL so vendor is never blocked
      setPhotoUploadStatuses((prev) => ({ ...prev, [slotIdx]: 'done' }));
      setPhotoSubmitToast(`✅ Photo ${slotIdx + 1}/5 saved with Geo-Stamp!`);
      setTimeout(() => setPhotoSubmitToast(null), 3000);
    });
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
            router.push("/dashboard/vendor");
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
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-start pb-12 pt-2 px-3 sm:py-8 sm:px-6 select-none font-sans">
      <div className="w-full max-w-md space-y-3">
        
        {/* Sleek Native iOS App Header */}
        <header className="flex items-center justify-between py-1.5 px-0.5">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/vendor"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/80 transition active:scale-95"
              title="Back to Dashboard"
            >
              ←
            </Link>
            <div className="flex items-center gap-2">
              <img
                src="/Logo1.png"
                alt="Next Gear"
                className="h-6 w-auto object-contain"
              />
              <span className="font-extrabold text-xs tracking-wider uppercase text-white">
                Hub Handover
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-full text-white/70">
              {booking ? formatBookingId(booking.id, booking.cityName, booking.startDate) : ""}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              booking?.status === "COMPLETED"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : booking?.status === "CANCELLED"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {booking?.status || "CONFIRMED"}
            </span>
          </div>
        </header>

        {/* Photo Submit Success Toast */}
        {photoSubmitToast && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3 text-xs text-emerald-200 flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 animate-[fade-up_0.2s_ease]">
            <span className="text-base">📸</span>
            <span className="font-bold">{photoSubmitToast}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-emerald-300 flex items-start gap-2.5 animate-[fade-up_0.2s_ease]">
            <span className="text-base shrink-0">✅</span>
            <div>
              <p className="font-bold text-emerald-200 text-[11px] uppercase tracking-wider">Action Confirmed</p>
              <p className="mt-0.5 text-white/80 leading-relaxed text-[11px]">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-2xl p-3.5 text-xs text-red-300 flex items-start justify-between gap-2.5 animate-[fade-up_0.2s_ease]">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="text-base shrink-0">⚠️</span>
              <div className="min-w-0">
                <p className="font-bold text-red-200 text-[11px] uppercase tracking-wider">Handover Notice</p>
                <p className="mt-0.5 text-white/80 leading-relaxed text-[11px] break-words">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-white/40 hover:text-white text-base font-bold p-0.5 shrink-0 transition"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* Extra Charges Payment Panel (if applicable) */}
        {requiresPayment && paymentDetails && (
          <div className="bg-[#18120c] border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-[fade-up_0.2s_ease]">
            <div className="flex items-center gap-2 text-amber-400">
              <span>⚠️</span>
              <h4 className="text-xs font-black uppercase tracking-wider">Collect Outstanding Balance</h4>
            </div>
            <div className="bg-black/50 rounded-xl p-3 space-y-1.5 text-xs border border-white/10">
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
              <div className="border-t border-white/10 pt-1.5 flex justify-between font-black text-xs text-amber-400">
                <span>Total Due</span>
                <span className="font-mono">₹{paymentDetails.extraChargesAmount}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleHandoverAction("return", true)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>💸 Confirm Payment & Complete Return</>
                )}
              </button>
              <button
                onClick={() => setRequiresPayment(false)}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-white/10"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Rider & Vehicle Quick Card (Apple Wallet Minimalist Style) */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/15 flex items-center justify-center font-black text-xs text-white shrink-0">
                {booking?.customerName ? booking.customerName.slice(0, 2).toUpperCase() : "R"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white truncate">
                    {booking?.customerName || "Customer"}
                  </span>
                  {kycStatus === "approved" && (
                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase shrink-0">
                      👑 6M VIP
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  🏍️ {booking?.vehicleTitle || "Assigned Vehicle"} • {booking?.cityName}
                </p>
              </div>
            </div>

            {booking?.customerPhone && (
              <a
                href={`tel:${booking.customerPhone}`}
                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1 active:scale-95"
                title="Call Rider"
              >
                📞 Call
              </a>
            )}
          </div>
        </div>

        {/* iOS Native 3-Step Segmented Control */}
        <div className="grid grid-cols-3 gap-1 bg-[#121215] p-1 rounded-xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setWizardStep(1)}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              wizardStep === 1
                ? "bg-white text-black font-black shadow-sm"
                : isHandoverOtpVerified
                ? "text-emerald-400 hover:text-emerald-300"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>{isHandoverOtpVerified ? "✓" : "1."}</span>
            <span>KYC ID</span>
          </button>

          <button
            type="button"
            disabled={!isHandoverOtpVerified}
            onClick={() => {
              if (isHandoverOtpVerified) setWizardStep(2);
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              wizardStep === 2
                ? "bg-white text-black font-black shadow-sm"
                : !isHandoverOtpVerified
                ? "text-white/30 cursor-not-allowed opacity-50"
                : uploadedPhotos.length >= 5 && odometer
                ? "text-emerald-400 hover:text-emerald-300 cursor-pointer"
                : "text-white/70 hover:text-white cursor-pointer"
            }`}
          >
            <span>
              {!isHandoverOtpVerified
                ? "🔒"
                : uploadedPhotos.length >= 5 && odometer
                ? "✓"
                : "2."}
            </span>
            <span>Bike Check</span>
          </button>

          <button
            type="button"
            disabled={!isHandoverOtpVerified || !odometer || uploadedPhotos.length < 5}
            onClick={() => {
              if (isHandoverOtpVerified && odometer && uploadedPhotos.length >= 5) setWizardStep(3);
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              wizardStep === 3
                ? "bg-white text-black font-black shadow-sm"
                : booking?.handoverStatus === "RELEASED" || booking?.handoverStatus === "RETURNED" || justReleased
                ? "text-emerald-400 hover:text-emerald-300 cursor-pointer"
                : (!isHandoverOtpVerified || !odometer || uploadedPhotos.length < 5)
                ? "text-white/30 cursor-not-allowed opacity-50"
                : "text-white/70 hover:text-white cursor-pointer"
            }`}
          >
            <span>
              {booking?.handoverStatus === "RELEASED" || booking?.handoverStatus === "RETURNED" || justReleased
                ? "✓"
                : (!isHandoverOtpVerified || !odometer || uploadedPhotos.length < 5)
                ? "🔒"
                : "3."}
            </span>
            <span>Handover</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 STEP 1: PHYSICAL ID CROSS-CHECK & 6-MONTH FAST-TRACK KYC               */}
        {/* ========================================================================= */}
        {wizardStep === 1 && (
          <div className="space-y-3 animate-[fade-up_0.2s_ease]">
            {kycStatus === "approved" ? (
              /* ============================================================ */
              /* SCENARIO A: CUSTOMER IS ALREADY VERIFIED (CLEAN VIP CARD)    */
              /* ============================================================ */
              <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-5 text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-xl text-emerald-400">
                  ✓
                </div>
                
                <div className="space-y-1">
                  <span className="inline-block text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    👑 6-Month Fast-Track VIP Active
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white pt-1">
                    Customer Identity Cleared
                  </h4>
                  <p className="text-[11px] text-white/60 max-w-xs mx-auto leading-relaxed">
                    <strong className="text-white">{booking?.customerName}</strong> is verified for express key handover. Zero document uploads required.
                  </p>
                </div>

                {/* DL & Aadhaar Quick Summary Pills */}
                <div className="grid grid-cols-2 gap-2 text-left text-xs pt-1">
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/50">Driving License</span>
                      <span className="text-emerald-400 font-bold text-[10px]">✓ Matched</span>
                    </div>
                    <span className="font-mono font-bold text-white text-[11px] mt-0.5 block truncate">
                      {dlNumber || (booking as any)?.drivingLicenseNo || "Verified DL"}
                    </span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/50">Aadhaar Card</span>
                      <span className="text-emerald-400 font-bold text-[10px]">✓ Matched</span>
                    </div>
                    <span className="font-mono font-bold text-white text-[11px] mt-0.5 block">
                      Physical ID Matched
                    </span>
                  </div>
                </div>

                {/* Collapsible Document Photo Drawer & Recapture */}
                <div className="pt-1">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveDocTab(activeDocTab === "all" ? "dl" : "all")}
                      className="text-[11px] text-white/50 hover:text-white font-medium underline transition cursor-pointer flex items-center gap-1"
                    >
                      <span>{activeDocTab === "all" ? "Hide Uploaded Photos ▲" : "Preview / Recapture Stored Photos (3) ▼"}</span>
                    </button>
                    {activeDocTab === "all" && (
                      <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        📸 Tap to Recapture
                      </span>
                    )}
                  </div>

                  {activeDocTab === "all" && (
                    <div className="space-y-2 pt-2 animate-[fade-up_0.2s_ease]">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { title: "Driving License", shortTitle: "DL", type: "dl" as const, url: dlPhoto || (booking as any)?.drivingLicenseUrl },
                          { title: "Aadhaar Card (Front)", shortTitle: "Aadhaar (F)", type: "aadhaarFront" as const, url: aadhaarFrontPhoto || (booking as any)?.aadhaarFrontUrl },
                          { title: "Aadhaar Card (Back)", shortTitle: "Aadhaar (B)", type: "aadhaarBack" as const, url: aadhaarBackPhoto || (booking as any)?.aadhaarBackUrl },
                        ].map((doc, idx) => (
                          <div key={idx} className="bg-black/60 border border-white/15 rounded-xl p-1.5 flex flex-col justify-between space-y-1.5 shadow-sm">
                            <div
                              onClick={() => doc.url && setActivePreviewDoc({ title: doc.title, url: doc.url, docType: doc.type })}
                              className="aspect-[4/3] rounded-lg overflow-hidden bg-black border border-white/10 cursor-pointer relative group"
                              title="Tap to view full screen"
                            >
                              {doc.url ? (
                                <img src={doc.url} alt={doc.shortTitle} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-white/40">No photo</div>
                              )}
                              <span className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.2 rounded text-[7.5px] font-bold text-white/90">
                                {doc.shortTitle}
                              </span>
                              <span className="absolute top-1 right-1 bg-black/80 text-[8px] text-white/70 px-1 rounded">
                                🔍
                              </span>
                            </div>

                            {/* Direct Recapture Button */}
                            <label className="w-full py-1.5 px-1 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 rounded-lg text-[9.5px] font-bold text-white transition flex items-center justify-center gap-1 cursor-pointer select-none">
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handleSpotPhotoRecapture(doc.type, e)}
                              />
                              <span>📸</span>
                              <span>Recapture</span>
                            </label>
                          </div>
                        ))}
                      </div>

                      <p className="text-[9.5px] text-white/40 text-center">
                        Galat document hone pe <strong className="text-amber-300">Recapture</strong> dabayein ya photo pe tap karke zoom karein.
                      </p>
                    </div>
                  )}
                </div>

                {/* 🌟 Handover Security OTP Verification (Required before key release even for VIPs) */}
                {!isHandoverOtpVerified ? (
                  <div className="bg-black/60 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-md text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📲</span>
                        <div>
                          <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                            Handover Security OTP
                          </h4>
                          <p className="text-[10px] text-white/50">
                            Customer pickup code verify karke keys release karein
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    </div>

                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendHandoverOtp}
                        disabled={isSendingOtp}
                        className="w-full py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSendingOtp ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>📲</span>
                            <span>Send Handover OTP to ({maskPhone(booking?.customerPhone)})</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-2.5 animate-[fade-up_0.2s_ease]">
                        {otpMessage && (
                          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-medium flex items-center justify-between">
                            <span className="truncate mr-2">{otpMessage}</span>
                            <button
                              type="button"
                              onClick={handleSendHandoverOtp}
                              disabled={isSendingOtp}
                              className="text-[10px] text-emerald-400 underline font-bold cursor-pointer shrink-0"
                            >
                              Resend
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="4-digit OTP"
                            value={handoverOtpInput}
                            onChange={(e) => setHandoverOtpInput(e.target.value)}
                            className="w-32 bg-black border border-white/20 rounded-xl px-3 py-2.5 text-center text-base font-mono tracking-widest text-white focus:border-emerald-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyHandoverOtp}
                            disabled={isVerifyingOtp || !handoverOtpInput.trim()}
                            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-40 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                          >
                            {isVerifyingOtp ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>✓</span>
                                <span>Verify OTP</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Direct Physical Approve Offline Link */}
                    <div className="pt-0.5 text-center">
                      <button
                        type="button"
                        onClick={handleDirectPhysicalApprove}
                        disabled={isVerifyingOtp}
                        className="text-[10px] text-white/40 hover:text-white/70 transition underline cursor-pointer"
                      >
                        Customer offline / phone issue? Tap for physical ID approval
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-left flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>Handover Security OTP Verified</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">Authorized</span>
                      </div>
                      <p className="text-[10px] text-white/60">
                        Customer authorized for vehicle inspection & key release.
                      </p>
                    </div>
                  </div>
                )}

                {/* Direct Big Primary CTA Button - Gated by OTP */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={!isHandoverOtpVerified}
                    onClick={() => {
                      if (isHandoverOtpVerified) setWizardStep(2);
                    }}
                    className={`w-full py-3.5 text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 ${
                      isHandoverOtpVerified
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white font-black shadow-lg shadow-emerald-600/20 cursor-pointer"
                        : "bg-white/10 text-white/40 font-bold cursor-not-allowed"
                    }`}
                  >
                    <span>
                      {isHandoverOtpVerified
                        ? "Proceed to Step 2: Bike Inspection ➔"
                        : "🔒 Verify OTP to Proceed to Step 2"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* SCENARIO B: PENDING VERIFICATION (CLEAN 1-CARD AT A TIME)     */
              /* ============================================================ */
              <div className="space-y-3">
                {/* 3 Clean Document Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-[#121215] p-1 rounded-xl border border-white/[0.08]">
                  {[
                    { id: "dl", label: "🪪 DL", matched: matchedDocs.dl },
                    { id: "aadhaarFront", label: "💳 Front", matched: matchedDocs.aadhaarFront },
                    { id: "aadhaarBack", label: "📄 Back", matched: matchedDocs.aadhaarBack },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDocTab(tab.id as any)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        (activeDocTab === tab.id || (activeDocTab === "all" && tab.id === "dl"))
                          ? "bg-white text-black font-black shadow-sm"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.matched && <span className="text-emerald-400 text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>

                {/* Single Active Document Card Preview */}
                {(() => {
                  const activeKey = (activeDocTab === "all" ? "dl" : activeDocTab) as "dl" | "aadhaarFront" | "aadhaarBack";
                  const docInfo = {
                    dl: {
                      title: "Driving License",
                      url: dlPhoto || (booking as any)?.drivingLicenseUrl,
                      no: dlNumber || (booking as any)?.drivingLicenseNo || "DL-Verified",
                      matched: matchedDocs.dl,
                      toggle: () => setMatchedDocs((p) => ({ ...p, dl: !p.dl })),
                      recaptureType: "dl" as const,
                    },
                    aadhaarFront: {
                      title: "Aadhaar Card (Front)",
                      url: aadhaarFrontPhoto || (booking as any)?.aadhaarFrontUrl,
                      no: "XXXX-XXXX-Verified",
                      matched: matchedDocs.aadhaarFront,
                      toggle: () => setMatchedDocs((p) => ({ ...p, aadhaarFront: !p.aadhaarFront })),
                      recaptureType: "aadhaarFront" as const,
                    },
                    aadhaarBack: {
                      title: "Aadhaar Card (Back)",
                      url: aadhaarBackPhoto || (booking as any)?.aadhaarBackUrl,
                      no: "Address Verification",
                      matched: matchedDocs.aadhaarBack,
                      toggle: () => setMatchedDocs((p) => ({ ...p, aadhaarBack: !p.aadhaarBack })),
                      recaptureType: "aadhaarBack" as const,
                    },
                  }[activeKey];

                  return (
                    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{activeKey === "dl" ? "🪪" : activeKey === "aadhaarFront" ? "💳" : "📄"}</span>
                            <span>{docInfo.title}</span>
                          </h4>
                          <span className="text-[10px] text-white/50 font-mono mt-0.5 block">{docInfo.no}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          docInfo.matched
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 text-white/60"
                        }`}>
                          {docInfo.matched ? "✓ Matched" : "Unverified"}
                        </span>
                      </div>

                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => docInfo.url && setActivePreviewDoc({ title: docInfo.title, url: docInfo.url, docType: activeKey })}
                        className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 relative group cursor-pointer"
                      >
                        {docInfo.url ? (
                          <img src={docInfo.url} alt={docInfo.title} className="w-full h-full object-cover group-hover:scale-102 transition duration-200" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/40 text-xs">
                            <span>📷</span>
                            <span>No photo uploaded by rider</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] text-white/80 px-2 py-0.5 rounded-full border border-white/10">
                          🔍 Tap to Zoom
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={docInfo.toggle}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            docInfo.matched
                              ? "bg-emerald-500 text-black shadow-md font-black"
                              : "bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
                          }`}
                        >
                          <span>{docInfo.matched ? "✓" : "⚪"}</span>
                          <span>{docInfo.matched ? "Card Matched" : "Match Card"}</span>
                        </button>

                        <label className="py-2.5 px-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleSpotPhotoRecapture(docInfo.recaptureType, e)}
                          />
                          <span>📸</span>
                          <span>Recapture</span>
                        </label>
                      </div>
                    </div>
                  );
                })()}

                {/* 🌟 OTP Verification Card (Required for 6-Month KYC Activation) */}
                <div className="bg-[#121215] border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📲</span>
                      <div>
                        <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                          Customer OTP Verification
                        </h4>
                        <p className="text-[10px] text-white/50">
                          Verify OTP to activate 6-Month Fast-Track Pass
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Step 1 of 3
                    </span>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendHandoverOtp}
                      disabled={isSendingOtp}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSendingOtp ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>📲</span>
                          <span>Send 4-Digit OTP to ({maskPhone(booking?.customerPhone)})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 animate-[fade-up_0.2s_ease]">
                      {otpMessage && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-medium flex items-center justify-between">
                          <span>{otpMessage}</span>
                          <button
                            type="button"
                            onClick={handleSendHandoverOtp}
                            disabled={isSendingOtp}
                            className="text-[10px] text-emerald-400 underline font-bold cursor-pointer ml-2 shrink-0"
                          >
                            Resend
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="4-digit OTP"
                          value={handoverOtpInput}
                          onChange={(e) => setHandoverOtpInput(e.target.value)}
                          className="w-32 bg-black border border-white/20 rounded-xl px-3 py-2.5 text-center text-base font-mono tracking-widest text-white focus:border-emerald-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyHandoverOtp}
                          disabled={isVerifyingOtp || !handoverOtpInput.trim()}
                          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-40 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                        >
                          {isVerifyingOtp ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>✓</span>
                              <span>Verify & Activate KYC</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Direct Physical Approve Offline Link */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={handleDirectPhysicalApprove}
                      disabled={isVerifyingOtp}
                      className="text-[10px] text-white/40 hover:text-white/70 transition underline cursor-pointer"
                    >
                      Customer offline / no WhatsApp? Click for physical card approval
                    </button>
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={!isHandoverOtpVerified}
                    onClick={() => {
                      if (isHandoverOtpVerified) setWizardStep(2);
                    }}
                    className={`w-full py-3.5 text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 ${
                      isHandoverOtpVerified
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-[0.98]"
                        : "bg-white/10 text-white/40 font-bold cursor-not-allowed"
                    }`}
                  >
                    <span>
                      {isHandoverOtpVerified
                        ? "Proceed to Step 2: Bike Inspection ➔"
                        : "🔒 Verify Customer OTP to Unlock Step 2"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🌟 STEP 2: VEHICLE CONDITION, ODOMETER & 5 MANDATORY PHOTOS               */}
        {/* ========================================================================= */}
        {wizardStep === 2 && (
          <div className="space-y-3 animate-[fade-up_0.2s_ease]">
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>🏍️</span> {booking?.handoverStatus === "PENDING" ? "Vehicle Condition & Inspection" : "Return Vehicle Inspection"}
                </h3>
                <span className="text-[10px] text-white/50 font-mono">
                  Step 2 of 3
                </span>
              </div>

              {/* If Return Inspection: 2-Condition Selector */}
              {booking?.handoverStatus === "RELEASED" && (
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
                    Return Vehicle Condition:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReturnCondition("NO_DAMAGE")}
                      className={`py-2.5 px-2 rounded-xl border text-center font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                        returnCondition === "NO_DAMAGE"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                          : "border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      <span>🟢</span>
                      <span>No Damage</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReturnCondition("DAMAGE_DETECTED")}
                      className={`py-2.5 px-2 rounded-xl border text-center font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                        returnCondition === "DAMAGE_DETECTED"
                          ? "border-red-500 bg-red-500/20 text-red-300"
                          : "border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      <span>🚨</span>
                      <span>Damage Detected</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Odometer & Tactile Fuel Selector */}
              <div className="space-y-3">
                {/* Odometer Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-white/70 block font-bold text-xs">
                      Odometer Reading (KM)
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">Live Entry</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      placeholder="e.g. 12450"
                      className="w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white font-mono text-base font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 pointer-events-none">
                      KM
                    </span>
                  </div>
                </div>

                {/* Fuel Level Pills */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-white/70 block font-bold text-xs">
                      Fuel Level
                    </label>
                    <span className="text-[10px] font-bold text-white/60 font-mono">
                      {fuel}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "25%", label: "25%" },
                      { id: "50%", label: "50%" },
                      { id: "75%", label: "75%" },
                      { id: "Full", label: "Full 100%" },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setFuel(lvl.id)}
                        className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                          fuel === lvl.id
                            ? "bg-white text-black font-black shadow-sm"
                            : "bg-black/50 border border-white/10 text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5-Slot Inspection Camera Grid */}
              <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-white/80 font-bold block text-xs">
                    Inspection Photos (5 Angles)
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    uploadedPhotos.length >= 5
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/10 text-white/60"
                  }`}>
                    {uploadedPhotos.length}/5 Captured
                  </span>
                </div>

                {/* 5 Tile Camera Slots */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { slot: 0, label: "Front" },
                    { slot: 1, label: "Rear" },
                    { slot: 2, label: "Left" },
                    { slot: 3, label: "Right" },
                    { slot: 4, label: "Meter" },
                  ].map(({ slot, label }) => {
                    const isCaptured = !!uploadedPhotos[slot];
                    const isUploading = photoUploadStatuses[slot] === "uploading";
                    const isFailed = photoUploadStatuses[slot] === "failed";

                    return (
                      <label
                        key={slot}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition cursor-pointer select-none ${
                          isCaptured
                            ? "border-emerald-500/50 bg-black"
                            : "border-white/15 bg-black/40 hover:bg-white/5 hover:border-white/30"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const slotNames = ["Front View", "Rear View", "Left Side", "Right Side", "Meter Odometer"];
                              handlePhotoCaptureSlot(slot, slotNames[slot] || "Inspection", file);
                            }
                          }}
                        />

                        {isCaptured ? (
                          <>
                            <img
                              src={uploadedPhotos[slot]}
                              alt={label}
                              className="w-full h-full object-cover"
                            />
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {isFailed && (
                              <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center">
                                <span className="text-[10px]">⚠️</span>
                              </div>
                            )}
                            <span className="absolute bottom-0.5 right-0.5 bg-emerald-500 text-black text-[8px] font-black px-1 rounded-full">
                              ✓
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-base text-white/50">📷</span>
                            <span className="text-[8.5px] font-bold text-white/60 mt-0.5">
                              {label}
                            </span>
                          </>
                        )}
                      </label>
                    );
                  })}
                </div>

                <p className="text-[10px] text-white/40 text-center">
                  Tap any slot to launch camera directly • Auto-purged in 24-48 hrs
                </p>
              </div>
            </div>

            {/* Step 2 Bottom Navigation */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="py-3 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!odometer || uploadedPhotos.length < 5}
                onClick={() => {
                  if (odometer && uploadedPhotos.length >= 5) setWizardStep(3);
                }}
                className={`flex-1 py-3 text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
                  odometer && uploadedPhotos.length >= 5
                    ? "bg-white text-black font-black shadow-md transition active:scale-98 cursor-pointer"
                    : "bg-white/10 text-white/40 font-bold cursor-not-allowed"
                }`}
              >
                <span>
                  {!odometer
                    ? "🔒 Enter Odometer to Proceed"
                    : uploadedPhotos.length < 5
                    ? `🔒 Capture 5 Photos (${uploadedPhotos.length}/5) to Proceed`
                    : "Proceed to Step 3: Handover ➔"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🌟 STEP 3: INSPECTION CHECKLIST, SETTLEMENT & RELEASE VEHICLE            */}
        {/* ========================================================================= */}
        {wizardStep === 3 && (
          <div className="space-y-3 animate-[fade-up_0.2s_ease]">
            {/* 6-Point Inspection Checklist */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div>
                  <label className="text-white block font-bold text-xs">
                    Inspection Checklist
                  </label>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Confirm all items before releasing keys
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const items = booking?.handoverStatus === "PENDING" ? [
                      "dlChecked",
                      "aadhaarChecked",
                      "vehicleCondition",
                      "odoRecorded",
                      "helmetProvided",
                      "balanceCollected",
                    ] : ["helmet", "damage", "key", "cleanliness"];
                    
                    const nextChecklist: Record<string, boolean> = {};
                    items.forEach((it) => {
                      nextChecklist[it] = true;
                    });
                    setChecklist(nextChecklist);
                  }}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] rounded-lg transition active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-1"
                >
                  <span>⚡</span> Verify All
                </button>
              </div>

              <div className="space-y-1.5">
                {(booking?.handoverStatus === "PENDING" ? [
                  { id: "dlChecked", label: "Driving License Checked & Verified", icon: "🪪" },
                  { id: "aadhaarChecked", label: "Aadhaar Card Matched", icon: "💳" },
                  { id: "vehicleCondition", label: "Vehicle Condition & Body Documented", icon: "🔍" },
                  { id: "odoRecorded", label: "Fuel & Odometer Reading Recorded", icon: "⛽" },
                  { id: "helmetProvided", label: "Safety Helmet Provided", icon: "🪖" },
                  { id: "balanceCollected", label: "Deposit / Settlement Confirmed", icon: "💸" },
                ] : [
                  { id: "helmet", label: "Safety Helmet Received Back", icon: "🪖" },
                  { id: "damage", label: "Body Panels Checked (No New Damage)", icon: "🔍" },
                  { id: "key", label: "Physical Keys Received Back", icon: "🔑" },
                  { id: "cleanliness", label: "Vehicle Cleanliness Checked", icon: "🧼" },
                ]).map((item) => {
                  const isChecked = !!checklist[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setChecklist((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border-white/[0.06] bg-black/40 text-white/70 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className={`text-[11px] ${isChecked ? "font-bold text-white" : "text-white/70"}`}>
                          {item.label}
                        </span>
                      </div>

                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition shrink-0 ${
                        isChecked
                          ? "bg-emerald-500 text-black font-black text-[10px]"
                          : "border border-white/20 bg-black/40"
                      }`}>
                        {isChecked && "✓"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grand Total Settlement Card */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-3.5 space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-white/50 block text-[10px] uppercase font-bold">Rental Period</span>
                  <span className="font-bold text-white mt-0.5 block text-[11px]">🗓️ {booking?.startDate} → {booking?.endDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/50 block text-[10px] uppercase font-bold">Settlement Due</span>
                  <span className={`font-black text-sm font-mono ${grandTotalSettlement > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    ₹{grandTotalSettlement.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {grandTotalSettlement > 0 ? (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-white/70 font-mono">
                    <span>Pickup Balance: ₹{balanceDue.toLocaleString("en-IN")}</span>
                    {damageTotal > 0 && <span className="text-red-400 font-bold">Care Fee: ₹{damageTotal.toLocaleString("en-IN")}</span>}
                  </div>

                  {booking?.handoverStatus === "PENDING" && balanceDue > 0 && (
                    <label className={`flex items-start gap-2 p-2 rounded-xl border transition cursor-pointer select-none ${
                      deferPaymentToReturn
                        ? "border-amber-400 bg-amber-500/15 text-amber-200"
                        : "border-white/10 bg-black/40 text-white/70 hover:bg-white/5"
                    }`}>
                      <input
                        type="checkbox"
                        checked={deferPaymentToReturn}
                        onChange={(e) => setDeferPaymentToReturn(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-amber-400 bg-black text-amber-500 focus:ring-0 accent-amber-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-[11px] block text-amber-300">
                          ⏳ Defer Balance to Vehicle Return (Pay at Check-in)
                        </span>
                        <span className="text-[9px] text-white/60 block leading-tight mt-0.5">
                          Allow rider to start ride now. Full pending balance of ₹{balanceDue.toLocaleString("en-IN")} will be collected at return.
                        </span>
                      </div>
                    </label>
                  )}

                  {!deferPaymentToReturn && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <span>💳</span>
                      <span>Collect ₹{grandTotalSettlement.toLocaleString("en-IN")} Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-1 text-center text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <span>✅</span>
                  <span>All fees settled • Zero balance due</span>
                </div>
              )}
            </div>

            {/* Handover & Release Vehicle Action */}
            <div className="space-y-2 pt-1">
              {kycStatus !== "approved" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>⚠️</span>
                    <p className="text-[10px] text-white/80">Customer KYC verification required (Step 1).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="py-1 px-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                  >
                    Go to Step 1
                  </button>
                </div>
              )}

              {booking?.status === "CANCELLED" ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 text-center font-bold">
                  ❌ This booking is cancelled.
                </div>
              ) : booking?.handoverStatus === "PENDING" ? (
                <div className="space-y-2">
                  {grandTotalSettlement > 0 && !deferPaymentToReturn ? (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <span>💳</span>
                      <span>Collect Balance (₹{grandTotalSettlement.toLocaleString("en-IN")}) to Release</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleHandoverAction("release")}
                      disabled={
                        actionLoading ||
                        requiresPayment ||
                        !isHandoverOtpVerified ||
                        kycStatus !== "approved" ||
                        !isChecklistComplete ||
                        uploadedPhotos.length < 5 ||
                        Object.values(photoUploadStatuses).some((s) => s === "uploading" || s === "failed")
                      }
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-black text-xs sm:text-sm text-white transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      {actionLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : kycStatus !== "approved" ? (
                        <>🔒 Complete KYC in Step 1</>
                      ) : Object.values(photoUploadStatuses).some((s) => s === "uploading") ? (
                        <>⏳ Photos uploading...</>
                      ) : Object.values(photoUploadStatuses).some((s) => s === "failed") ? (
                        <>⚠️ Photo upload failed</>
                      ) : uploadedPhotos.length < 5 ? (
                        <>📷 Take All 5 Photos in Step 2 ({uploadedPhotos.length}/5)</>
                      ) : !isChecklistComplete ? (
                        <>🔒 Complete Checklist (Tap Verify All)</>
                      ) : (
                        <>🚀 Release Vehicle & Handover Keys</>
                      )}
                    </button>
                  )}
                </div>
              ) : booking?.handoverStatus === "RELEASED" && !requiresPayment ? (
                justReleased ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3 text-center space-y-1 animate-[fade-up_0.2s_ease]">
                    <p className="font-bold text-xs uppercase tracking-wider">🚀 Vehicle Released</p>
                    <p className="text-white/70 text-[10px]">The ride is active. Scan customer QR code again at return time.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleHandoverAction("return")}
                      disabled={
                        actionLoading ||
                        !isChecklistComplete ||
                        uploadedPhotos.length < 5 ||
                        Object.values(photoUploadStatuses).some((s) => s === "uploading" || s === "failed")
                      }
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-black text-xs text-white transition shadow-md cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      {actionLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>📥 Complete Return & Put Online</>
                      )}
                    </button>
                  </div>
                )
              ) : null}

              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/60 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                ← Back to Step 2 (Photos & Meter)
              </button>
            </div>
          </div>
        )}

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

      {/* Full-Screen Document Preview & Spot Recapture Modal */}
      {activePreviewDoc && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease]">
          <div className="max-w-sm w-full bg-[#121215] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-[scale-up_0.2s_ease] text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white">
                <span className="text-base">🪪</span>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">
                    {activePreviewDoc.title}
                  </h4>
                  <p className="text-[10px] text-white/50">Inspection & Physical Card Match</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewDoc(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* High-Resolution Document Photo */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black aspect-[16/10] flex items-center justify-center shadow-inner">
              <img
                src={
                  activePreviewDoc.docType === "dl"
                    ? (dlPhoto || activePreviewDoc.url)
                    : activePreviewDoc.docType === "aadhaarFront"
                    ? (aadhaarFrontPhoto || activePreviewDoc.url)
                    : (aadhaarBackPhoto || activePreviewDoc.url)
                }
                alt={activePreviewDoc.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 pt-1">
              {/* Recapture Action inside the modal */}
              <label className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-98 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 select-none">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const type = (activePreviewDoc.docType === "dl" || activePreviewDoc.docType === "aadhaarFront" || activePreviewDoc.docType === "aadhaarBack")
                      ? activePreviewDoc.docType
                      : "dl";
                    handleSpotPhotoRecapture(type as any, e);
                  }}
                />
                <span>📸</span>
                <span>Recapture & Replace This Document</span>
              </label>

              <button
                type="button"
                onClick={() => setActivePreviewDoc(null)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Document Full View Modal */}
      {activePreviewDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease]">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#121218] p-5 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">{activePreviewDoc.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewDoc(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[65vh] flex items-center justify-center bg-black/80 rounded-2xl overflow-hidden p-2 border border-white/10">
              <img src={activePreviewDoc.url} alt={activePreviewDoc.title} className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-white/50 font-mono">Original Document Snapshot</span>
              <button
                type="button"
                onClick={() => setActivePreviewDoc(null)}
                className="py-2 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
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
