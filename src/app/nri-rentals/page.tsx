"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const steps = [
  { title: "Passport & IDP Verification", description: "Scan your international passport, visa & International Driving Permit." },
  { title: "Choose Self-Drive Vehicle", description: "Select from Thar 4x4, RE Himalayan 450, or automatic luxury sedans." },
  { title: "Global Multi-Currency Payment", description: "Pay securely in USD, AED, GBP, EUR via Stripe, PayPal, or Cards." },
  { title: "Terminal Gate Key Handover", description: "Meet your dedicated concierge representative at airport arrivals." },
];

const timezoneOptions = ["Asia/Dubai (GST)", "Europe/London (GMT)", "America/New_York (EST)", "Asia/Singapore (SGT)"];

export default function NriRentalsPage() {
  // Authentication status
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string; name?: string } | null>(null);

  // Verification process states
  const [docType, setDocType] = useState<"passport" | "license">("passport");
  const [fileName, setFileName] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "scanned" | "submitting" | "verified">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("");

  // Extracted OCR fields
  const [fullName, setFullName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [dob, setDob] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [emailInput, setEmailInput] = useState("");

  // Overall page error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setEmailInput(data.user.email || "");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }
    checkAuth();
  }, []);

  // Simulate file drops & laser sweep animation
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setScanStatus("scanning");
    setScanProgress(0);
    setErrorMessage("");

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);

      if (progress === 20) setScanMessage("Detecting international passport MRZ zone...");
      if (progress === 50) setScanMessage("Verifying security watermarks and holographic seals...");
      if (progress === 80) setScanMessage("Extracting full name and document expiry details...");

      if (progress >= 100) {
        clearInterval(interval);
        setScanStatus("scanned");
        if (docType === "passport") {
          setFullName(currentUser?.name || "Abhinav Sharma");
          setDocNumber("P" + Math.floor(1000000 + Math.random() * 9000000));
          setDob("1993-06-15");
          setExpiryDate("2035-12-30");
        } else {
          setFullName(currentUser?.name || "Abhinav Sharma");
          setDocNumber("IDP-" + Math.floor(10000 + Math.random() * 90000));
          setDob("1993-06-15");
          setExpiryDate("2029-05-18");
        }
      }
    }, 250);
  }

  // Submit parsed details to KYC and update user profile isNri state
  async function submitKyc() {
    if (!currentUser) {
      window.location.href = "/login?next=/nri-rentals";
      return;
    }
    setScanStatus("submitting");
    setErrorMessage("");

    try {
      const kycResponse = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          documentType: docType === "passport" ? "passport" : "license",
          documentNumber: docNumber,
          dob,
          expiryDate,
          email: emailInput,
        }),
      });

      const kycData = await kycResponse.json();
      if (!kycResponse.ok) {
        setErrorMessage(kycData.error ?? "Failed to save KYC documents.");
        setScanStatus("scanned");
        return;
      }

      const toggleResponse = await fetch("/api/auth/nri-toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!toggleResponse.ok) {
        const toggleData = await toggleResponse.json();
        setErrorMessage(toggleData.error ?? "Failed to mark profile as verified NRI.");
        setScanStatus("scanned");
        return;
      }

      setScanStatus("verified");
    } catch (err) {
      setErrorMessage("Network error verifying NRI compliance. Please try again.");
      setScanStatus("scanned");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white">
      <style>{`
        @keyframes scanSweep {
          0% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(220px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.8; }
        }
        .laser-sweep {
          animation: scanSweep 2s ease-in-out infinite;
        }
      `}</style>

      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      {/* Hero Ambient Header */}
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-red-950/40 via-neutral-950 to-neutral-950 -mt-12 pt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-600/10 blur-[150px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Story Column */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/Logo1.png"
                  alt="Next Gear Official Logo"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                />
                <div>
                  <span className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-extrabold block">Global NRI Mobility Hub</span>
                  <span className="text-[10px] text-white/50">Airport Delivery • USD / AED / GBP Gateways</span>
                </div>
              </div>

              <h1 className="text-3xl font-black sm:text-5xl text-white tracking-tight leading-tight">
                NRI Self-Drive Portal <br />
                <span className="gradient-text-brand drop-shadow-md">
                  Seamless Airport Mobility
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Rent verified Thar 4x4, Himalayan 450, and luxury cars across India. Enjoy instant passport OCR verification, zero local address proof requirements, and flight arrival gate key handover.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="#verify-section"
                  className="rounded-full bg-[var(--brand-red)] px-6 py-3 text-xs font-black text-white hover:bg-red-600 transition shadow-xl shadow-red-600/30"
                >
                  Verify Passport OCR Now →
                </a>
                <Link
                  href="/vehicles"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Browse Global Fleet
                </Link>
              </div>
            </div>

            {/* Non-Video Interactive NRI Passport & Flight Concierge Card */}
            <div className="relative rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl space-y-6 hover:border-cyan-500/80 transition-all duration-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  🌐 GLOBAL NRI CONCIERGE HUB
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
                  ✓ Verified Airport Delivery
                </span>
              </div>

              <div className="space-y-3 border-y border-white/10 py-5 text-xs text-white/80">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm flex-shrink-0">✈️</span>
                  <div>
                    <strong className="text-white block">Terminal Gate Handover</strong>
                    <span className="text-white/60">Delhi T3, Goa MOPA, Mumbai T2 & Bangalore</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm flex-shrink-0">💳</span>
                  <div>
                    <strong className="text-white block">International Multi-Currency</strong>
                    <span className="text-white/60">Pay in USD, AED, GBP, EUR via Stripe & PayPal</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm flex-shrink-0">🆔</span>
                  <div>
                    <strong className="text-white block">Zero Local Address Proof</strong>
                    <span className="text-white/60">International Passport & IDP 100% accepted</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[11px] text-white/70 font-semibold">
                  <Image src="/Logo1.png" alt="Next Gear Logo" width={20} height={20} className="h-5 w-5 object-contain" />
                  Next Gear International
                </div>
                <a
                  href="#verify-section"
                  className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-4 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/40 transition"
                >
                  Start Verification →
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-16" id="verify-section">
        
        {/* NRI Exclusive Benefits Section */}
        <section className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 space-y-3 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition duration-500">
            <div className="text-3xl">✈️</div>
            <h3 className="text-base font-bold text-white">Airport Terminal Delivery</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Meet our concierge driver directly at Delhi T3, Goa MOPA, Mumbai T2 & Bangalore arrival gates.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 space-y-3 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition duration-500">
            <div className="text-3xl">💳</div>
            <h3 className="text-base font-bold text-white">Multi-Currency Payments</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Pay via USD, AED, GBP, EUR with international Credit Cards, Stripe, or PayPal with ₹0 FX fee.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 space-y-3 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition duration-500">
            <div className="text-3xl">🆔</div>
            <h3 className="text-base font-bold text-white">No Local Aadhaar Required</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Exempt from local address proofs. Your International Passport & Driving Permit IDP is 100% sufficient.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 space-y-3 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition duration-500">
            <div className="text-3xl">🕒</div>
            <h3 className="text-base font-bold text-white">Flight-Track Delay Buffer</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              We track your flight live. Enjoy 3 hours of free buffer time in case of international flight delays.
            </p>
          </div>
        </section>

        {/* Interactive OCR Verification & KYC Console */}
        {scanStatus !== "verified" ? (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Step 1: Scanner Upload Area */}
            <div className="lg:col-span-6 space-y-6">
              <section className="rounded-3xl border border-white/15 bg-neutral-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                    STEP 1: CHOOSE DOCUMENT
                  </span>
                  <span className="text-[10px] text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    🔒 256-Bit Encrypted OCR
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setDocType("passport");
                      if (scanStatus !== "idle") setScanStatus("idle");
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      docType === "passport"
                        ? "border-cyan-400 bg-cyan-950/40 text-white ring-2 ring-cyan-500/30"
                        : "border-white/10 bg-black/40 text-white/70 hover:bg-black/60"
                    }`}
                  >
                    <span className="block text-2xl mb-1">📘</span>
                    <span className="font-bold text-sm text-white">International Passport</span>
                    <span className="block text-xs text-white/50 mt-0.5">Photo & Identity Page</span>
                  </button>
                  <button
                    onClick={() => {
                      setDocType("license");
                      if (scanStatus !== "idle") setScanStatus("idle");
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      docType === "license"
                        ? "border-cyan-400 bg-cyan-950/40 text-white ring-2 ring-cyan-500/30"
                        : "border-white/10 bg-black/40 text-white/70 hover:bg-black/60"
                    }`}
                  >
                    <span className="block text-2xl mb-1">🚗</span>
                    <span className="font-bold text-sm text-white">International IDP</span>
                    <span className="block text-xs text-white/50 mt-0.5">Driving Permit License</span>
                  </button>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block mb-3">
                    STEP 2: SCAN OCR DOCUMENT
                  </span>
                  
                  {scanStatus === "idle" && (
                    <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-500/30 bg-black/50 py-10 text-center transition hover:border-cyan-400 group">
                      <span className="text-4xl text-cyan-400 group-hover:scale-110 transition">📤</span>
                      <p className="mt-3 text-sm font-bold text-white">Upload Passport or IDP File</p>
                      <p className="text-xs text-white/50 mt-1">Drag and drop file here, or click to browse image / PDF</p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileSelect}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                  )}

                  {scanStatus === "scanning" && (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-400 bg-black/90 py-12 text-center text-white shadow-2xl">
                      {/* Laser sweep line */}
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] laser-sweep" />
                      
                      <span className="inline-block animate-pulse text-4xl mb-2">🔍</span>
                      <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Simulating High-Fidelity OCR Sweep</h4>
                      <p className="text-xs text-white/60 mt-1">{scanMessage}</p>
                      
                      <div className="mx-auto mt-6 max-w-[220px] rounded-full bg-white/10 h-2">
                        <div
                          className="h-2 rounded-full bg-cyan-400 transition-all duration-200"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <span className="block text-xs font-bold text-cyan-400 mt-2">{scanProgress}%</span>
                    </div>
                  )}

                  {scanStatus !== "idle" && scanStatus !== "scanning" && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-xs">✓</span>
                          <div>
                            <p className="text-sm font-bold text-emerald-300">Passport OCR Parsing Complete</p>
                            <p className="text-xs text-emerald-400/80 font-mono">{fileName || "passport_scanned.pdf"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setScanStatus("idle")}
                          className="text-xs font-bold text-white/60 hover:text-white underline"
                        >
                          Rescan File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Step 2: Extracted Form Data */}
            <div className="lg:col-span-6 space-y-6">
              <section className="rounded-3xl border border-white/15 bg-neutral-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">Extracted OCR Information</h2>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                    ✓ Verified Fields
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-white/50">Full Legal Name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Extracted Name"
                      disabled={scanStatus === "idle" || scanStatus === "scanning"}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-white/50">Document / Passport Number</label>
                    <input
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="Extracted Document Number"
                      disabled={scanStatus === "idle" || scanStatus === "scanning"}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-white/50">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        disabled={scanStatus === "idle" || scanStatus === "scanning"}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-white/50">Expiry Date</label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        disabled={scanStatus === "idle" || scanStatus === "scanning"}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-white/50">Contact Email</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your-email@domain.com"
                      disabled={scanStatus === "idle" || scanStatus === "scanning"}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-400">
                    {errorMessage}
                  </div>
                )}

                {!currentUser && (
                  <div className="rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-300 leading-relaxed">
                    <span className="font-bold">⚠️ Account Authentication:</span> Please log in to complete your verified NRI status registration.
                  </div>
                )}

                <button
                  onClick={submitKyc}
                  disabled={scanStatus !== "scanned"}
                  className="w-full rounded-full bg-[var(--brand-red)] py-3.5 text-xs font-black text-white shadow-xl hover:bg-red-600 transition disabled:bg-neutral-800 disabled:text-white/40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {scanStatus === "submitting" ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying NRI Passport Credentials...
                    </>
                  ) : !currentUser ? (
                    "🔑 Login & Register NRI Status"
                  ) : (
                    "✓ Verify & Register NRI Passport Status"
                  )}
                </button>
              </section>
            </div>

          </div>
        ) : (
          /* Approved NRI Success State Card */
          <div className="mx-auto max-w-2xl text-center">
            <section className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-neutral-900 via-emerald-950/30 to-neutral-900 p-8 sm:p-12 shadow-2xl space-y-6">
              <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-black text-4xl shadow-xl font-black">
                ✓
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">NRI Verification Approved!</h2>
              <p className="text-xs sm:text-sm text-emerald-300 max-w-md mx-auto leading-relaxed">
                Your passport credentials have been validated. Airport handover and multi-currency booking gateways are now unlocked.
              </p>

              <div className="rounded-2xl border border-white/10 bg-black/60 p-6 text-left space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">UNLOCKED NRI BENEFITS</h4>
                <ul className="space-y-2 text-xs text-white/80">
                  <li className="flex items-center gap-2">✓ <strong className="text-white">Delhi T3, Goa MOPA, Mumbai T2 & Bangalore Airport Gate Handover</strong></li>
                  <li className="flex items-center gap-2">✓ <strong className="text-white">Stripe & PayPal Multi-Currency Payment (USD, AED, GBP)</strong></li>
                  <li className="flex items-center gap-2">✓ <strong className="text-white">Zero Local Address Proof Required (Passport & IDP Approved)</strong></li>
                </ul>
              </div>

              <div className="space-y-3 pt-4">
                <p className="text-xs font-extrabold text-white/70 uppercase tracking-wider">Select Your Home Timezone to Book</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {timezoneOptions.map((tz) => (
                    <Link
                      key={tz}
                      href={`/vehicles?nri=1&tz=${encodeURIComponent(tz)}`}
                      className="rounded-full border border-cyan-400/40 bg-cyan-950/40 px-5 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition shadow-lg"
                    >
                      Book Vehicle ({tz})
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Second AI Experience Video Banner */}
        <section className="relative rounded-3xl border border-red-500/30 bg-gradient-to-r from-neutral-950 via-red-950/40 to-neutral-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-red-500/20 border border-red-500/40 px-3.5 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
                ⚡ NEXTGO AI INTERNATIONAL CONCIERGE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                24x7 Airport Representative Support
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Have flight delay questions or custom vehicle delivery requests? NextGo AI coordinates directly with our airport ground staff in real time.
              </p>
              <div className="pt-2">
                <Link
                  href="/vehicles"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-xs font-black hover:bg-neutral-200 transition shadow-lg"
                >
                  🏎️ Reserve Your Ride Now
                </Link>
              </div>
            </div>

            {/* 3D Car AI Robot International Concierge Motion Card */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black shadow-2xl h-60 sm:h-72 p-6 flex flex-col items-center justify-center text-center space-y-3 group hover:border-cyan-500/60 transition-all duration-500">
              <div className="relative">
                <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                <Image
                  src="/car-ai-robot.png"
                  alt="NextGo Car AI Robot"
                  width={140}
                  height={140}
                  className="h-28 sm:h-32 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                />
              </div>

              <div>
                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block">
                  🤖 NEXTGO INTERNATIONAL CONCIERGE
                </span>
                <span className="text-[11px] text-white/70">
                  24x7 Airport Arrival Gate Key Handover
                </span>
              </div>

              {/* Solid Corner Cap Mask directly flush to bottom-0 right-0 */}
              <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-neutral-950 border-t border-l border-white/20 px-4 py-2 text-white text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 pointer-events-none">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-cyan-400 font-extrabold">NextGo AI Live</span>
              </div>
            </div>
          </div>
        </section>

        {/* Checklist Steps Section */}
        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8 space-y-6">
          <h2 className="text-xl font-black text-white">NRI Verification Checklist</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((item, idx) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                </div>
                <p className="text-xs text-white/60 pl-7">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
