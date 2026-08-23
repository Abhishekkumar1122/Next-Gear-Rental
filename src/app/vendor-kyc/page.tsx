"use client";

import { useState, useEffect, useRef, useCallback, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { compressImageClient } from "@/lib/client-image-compressor";
import {
  ShieldCheck,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  FileText,
  Building2,
  User,
  Phone,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

type DocItem = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  required: boolean;
  isShopPhoto?: boolean;
};

const DOC_ITEMS: DocItem[] = [
  {
    id: "shop-photo",
    label: "Shop / Premises Photo",
    desc: "Front photo of your rental shop / parking garage with GPS location",
    icon: "🏪",
    required: true,
    isShopPhoto: true,
  },
  {
    id: "aadhaar",
    label: "Aadhaar Card / Owner ID",
    desc: "Front & back or clear photo of owner ID",
    icon: "🪪",
    required: true,
  },
  {
    id: "pan",
    label: "PAN Card",
    desc: "Business or individual PAN card",
    icon: "🗂️",
    required: true,
  },
  {
    id: "business-proof",
    label: "Business Proof",
    desc: "GST Certificate, Trade License, or Shop Act Registration",
    icon: "🏢",
    required: true,
  },
  {
    id: "bank-proof",
    label: "Bank Account Proof",
    desc: "Cancelled Cheque or Bank Passbook front page (for payout setups)",
    icon: "🏦",
    required: true,
  },
  {
    id: "vehicle-rc",
    label: "Sample Vehicle RC",
    desc: "Registration certificate of at least one fleet vehicle",
    icon: "🚗",
    required: false,
  },
  {
    id: "insurance",
    label: "Vehicle Insurance",
    desc: "Comprehensive / commercial vehicle insurance policy",
    icon: "🛡️",
    required: false,
  },
];

type ExistingDoc = {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewStatus: "pending" | "verified" | "rejected" | "needs-reupload";
  reviewNote?: string;
  geoLat?: number;
  geoLng?: number;
};

type AppDetails = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  fleetSize: string;
  status: string;
  kycApprovedAt?: string;
};

export default function VendorKycPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white/50 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-red-500 mr-2" /> Loading KYC Hub...
        </div>
      }
    >
      <VendorKycContent />
    </Suspense>
  );
}

function VendorKycContent() {
  const searchParams = useSearchParams();

  const [applicationId, setApplicationId] = useState("");
  const [phone, setPhone] = useState("");
  const [appDetails, setAppDetails] = useState<AppDetails | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<ExistingDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Upload state per document
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch status & documents
  const fetchStatus = useCallback(async (appId: string, phoneNum: string) => {
    if (!appId || !phoneNum) return;
    setLoading(true);
    setLookupError("");

    try {
      const res = await fetch("/api/vendor-registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: appId.trim(), phone: phoneNum.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Unable to find application. Please check your Application ID and Phone.");
      }

      setAppDetails(data.application);
      setUploadedDocs(data.documents || []);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Failed to load application details.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Read URL query params on mount
  useEffect(() => {
    const qId = searchParams.get("id") || searchParams.get("appId") || searchParams.get("upload") || "";
    const qPhone = searchParams.get("phone") || "";

    if (qId) setApplicationId(qId);
    if (qPhone) setPhone(qPhone);

    if (qId && qPhone) {
      void fetchStatus(qId, qPhone);
    }
  }, [searchParams, fetchStatus]);

  // Request GPS
  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("GPS is not supported on this device. Please use a smartphone or modern browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError("Location permission denied. Please allow GPS access in your browser settings.");
        } else {
          setGeoError("Could not detect location. Please turn on GPS/Location and retry.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Upload a single file
  const handleUpload = async (doc: DocItem, file: File) => {
    if (!appDetails) return;

    // Check GPS for shop photo
    let currentGeo = geoCoords;
    if (doc.isShopPhoto && !currentGeo) {
      setUploadErrors((prev) => ({
        ...prev,
        [doc.id]: "GPS location is required for Shop Photo. Please tap 'Capture GPS Location' first.",
      }));
      return;
    }

    setUploadingDocId(doc.id);
    setUploadErrors((prev) => ({ ...prev, [doc.id]: "" }));

    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        try {
          const compressed = await compressImageClient(file, 1600, 0.82);
          fileToUpload = compressed.file;
        } catch (compressErr) {
          console.warn("Client image compression fallback:", compressErr);
        }
      }

      const fd = new FormData();
      fd.set("applicationId", appDetails.id);
      fd.set("phone", appDetails.phone);
      fd.set("documentType", doc.id);
      fd.set("file", fileToUpload);
      if (currentGeo) {
        fd.set("geoLat", String(currentGeo.lat));
        fd.set("geoLng", String(currentGeo.lng));
      }

      const res = await fetch("/api/vendor-registration/status/documents", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed. Please try again.");
      }

      if (data.document) {
        setUploadedDocs((prev) => [data.document, ...prev.filter((d) => d.id !== data.document.id)]);
      }
    } catch (err) {
      setUploadErrors((prev) => ({
        ...prev,
        [doc.id]: err instanceof Error ? err.message : "Upload failed.",
      }));
    } finally {
      setUploadingDocId(null);
    }
  };

  // Compute status counts
  const uploadedTypeSet = new Set(uploadedDocs.map((d) => d.documentType));
  const totalRequired = DOC_ITEMS.filter((d) => d.required).length;
  const completedRequired = DOC_ITEMS.filter((d) => d.required && uploadedTypeSet.has(d.id)).length;
  const isAllComplete = completedRequired >= totalRequired;

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-red-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070709]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/vendor-registration"
            className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Partner Hub</span>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>256-bit Secure KYC</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Title & Introduction */}
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--brand-red)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast-Track Onboarding</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Vendor KYC Document Upload
          </h1>
          <p className="mt-1.5 text-xs text-white/60 leading-relaxed sm:text-sm">
            Upload your shop photo and business documents to activate your Next Gear vendor partner account.
          </p>
        </div>

        {/* Lookup Card if no application loaded */}
        {!appDetails ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Enter Application Details</h2>
                <p className="text-xs text-white/50">Found in your SMS / WhatsApp / Email</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fetchStatus(applicationId, phone);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Application ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHOP1234 or GOLD5678"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-mono text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Registered Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {lookupError && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-950/30 p-3.5 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading Application...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to KYC Upload</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Application Overview Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">{appDetails.businessName}</span>
                    <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-red-400">
                      {appDetails.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    {appDetails.contactName} · {appDetails.city}, {appDetails.state || ""} · Fleet: {appDetails.fleetSize}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/40">
                    ID: <strong className="text-white/80">{appDetails.id}</strong>
                  </p>
                </div>

                <button
                  onClick={() => void fetchStatus(appDetails.id, appDetails.phone)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    KYC Progress ({completedRequired}/{totalRequired} Required)
                  </span>
                  <span className={isAllComplete ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {isAllComplete ? "✓ All Required Docs Uploaded" : `${totalRequired - completedRequired} Remaining`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (completedRequired / totalRequired) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* GPS Location Prompt (for Shop Photo) */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">1. GPS Location for Shop Photo</h3>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                    Tap below to capture your real-time GPS coordinates while standing at your shop.
                  </p>

                  <div className="mt-3">
                    {geoCoords ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span className="font-mono font-bold">
                          GPS Locked: {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                        </span>
                        <button
                          onClick={requestGps}
                          className="ml-auto text-[11px] underline text-emerald-300 font-semibold hover:text-white"
                        >
                          Recapture
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={requestGps}
                        disabled={geoLoading}
                        className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition active:scale-[0.98] border border-white/10"
                      >
                        {geoLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                            <span>Detecting GPS Location...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            <span>Capture GPS Location Now</span>
                          </>
                        )}
                      </button>
                    )}

                    {geoError && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        {geoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Checklist & Uploaders */}
            <div className="space-y-3.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 px-1">
                2. Upload Required Documents
              </h2>

              {DOC_ITEMS.map((doc) => {
                const existingDoc = uploadedDocs.find((d) => d.documentType === doc.id);
                const isUploading = uploadingDocId === doc.id;
                const err = uploadErrors[doc.id];

                return (
                  <div
                    key={doc.id}
                    className={`rounded-3xl border p-4 sm:p-5 transition-all duration-300 ${
                      existingDoc
                        ? "border-emerald-500/20 bg-emerald-950/[0.07]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl flex-shrink-0 ${
                          existingDoc ? "bg-emerald-950/60 border border-emerald-500/30" : "bg-white/5 border border-white/10"
                        }`}
                      >
                        {existingDoc ? "✅" : doc.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{doc.label}</span>
                          {doc.required && !existingDoc && (
                            <span className="rounded-full border border-red-500/30 bg-red-950/40 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">
                              Required
                            </span>
                          )}
                          {!doc.required && !existingDoc && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/40 uppercase">
                              Optional
                            </span>
                          )}
                          {existingDoc && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400">
                              ✓ Uploaded
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-white/50 leading-relaxed">{doc.desc}</p>

                        {/* Existing Document Badge / Preview */}
                        {existingDoc && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-white/40 truncate max-w-[200px]">{existingDoc.fileName}</span>
                            {existingDoc.geoLat && (
                              <span className="text-emerald-400 font-mono text-[11px]">
                                📍 {existingDoc.geoLat.toFixed(4)}, {existingDoc.geoLng?.toFixed(4)}
                              </span>
                            )}
                            <a
                              href={existingDoc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-auto inline-flex items-center gap-1 font-semibold text-red-400 hover:text-red-300"
                            >
                              <span>View File</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {/* Upload Trigger Input */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                          <input
                            ref={(el) => {
                              fileInputRefs.current[doc.id] = el;
                            }}
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void handleUpload(doc, file);
                            }}
                          />

                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRefs.current[doc.id]?.click()}
                            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition active:scale-[0.98] ${
                              existingDoc
                                ? "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/20 hover:brightness-110"
                            }`}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : existingDoc ? (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                <span>Replace Document</span>
                              </>
                            ) : doc.isShopPhoto ? (
                              <>
                                <Camera className="h-3.5 w-3.5" />
                                <span>Capture / Upload Photo</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                <span>Choose File</span>
                              </>
                            )}
                          </button>
                        </div>

                        {err && (
                          <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                            {err}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Celebration / Next Steps Card */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">What Happens After Upload?</h3>
              <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                Our verification team reviews uploaded documents within <strong>24 hours</strong>. Upon approval, your
                login credentials & vendor portal access will be sent via Email and WhatsApp.
              </p>
              <div className="pt-2">
                <Link
                  href="/vendor-registration"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Vendor Partner Hub</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}