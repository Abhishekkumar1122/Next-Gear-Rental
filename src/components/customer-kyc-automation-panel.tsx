"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type KycEntry = {
  id: string;
  fullName: string;
  documentType: "aadhaar" | "pan" | "license" | "passport";
  documentNumber: string;
  dob: string;
  expiryDate?: string;
  score: number;
  status: "approved" | "review" | "rejected";
  flags: string[];
  createdAt: string;
};

const docTypeLabels: Record<KycEntry["documentType"], string> = {
  aadhaar: "Aadhaar",
  pan: "PAN",
  license: "Driving License",
  passport: "Passport",
};

export function CustomerKycAutomationPanel({
  userEmail,
  userPhone,
  defaultName,
}: {
  userEmail: string;
  userPhone?: string;
  defaultName: string;
}) {
  const [entries, setEntries] = useState<KycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 6-Month Fast-Track VIP Status State
  const [kycStatusData, setKycStatusData] = useState<{
    isVerified: boolean;
    customerName?: string;
    expiresAt?: string;
    daysRemaining?: number;
    documents?: {
      dlNo?: string;
      aadhaarNo?: string;
      dlUrl?: string;
      aadhaarFrontUrl?: string;
    };
  } | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const [fullName, setFullName] = useState(defaultName);
  const [documentType, setDocumentType] = useState<KycEntry["documentType"]>("aadhaar");
  const [documentNumber, setDocumentNumber] = useState("");
  const [dob, setDob] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const latest = useMemo(() => entries[0], [entries]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cleanPhone = userPhone ? userPhone.replace(/\D/g, "") : "";
      const cleanEmail = userEmail && !userEmail.endsWith("@guest.next-gear.app") ? userEmail : "";

      // 1. Check 6-Month Fast-Track KYC Status first
      const statusUrl = cleanPhone
        ? `/api/kyc/customer-status?phone=${encodeURIComponent(cleanPhone)}&email=${encodeURIComponent(cleanEmail)}`
        : `/api/kyc/customer-status?email=${encodeURIComponent(cleanEmail)}`;

      const statusRes = await fetch(statusUrl);
      const statusData = await statusRes.json().catch(() => ({}));
      if (statusRes.ok && statusData.isVerified) {
        setKycStatusData(statusData);
      }

      // 2. Check legacy entries
      const emailForEntries = cleanEmail || (cleanPhone ? `${cleanPhone}@guest.next-gear.app` : "");
      if (emailForEntries) {
        const res = await fetch(`/api/kyc?email=${encodeURIComponent(emailForEntries)}`);
        const data = await res.json().catch(() => ({}));
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userEmail, userPhone]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          documentType,
          documentNumber,
          dob,
          expiryDate: expiryDate || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Unable to process KYC right now.");
        return;
      }

      setMessage("KYC auto-check completed. Scroll down to review score and flags.");
      setDocumentNumber("");
      setExpiryDate("");
      await load();
    } catch {
      setMessage("Unable to process KYC right now.");
    } finally {
      setSubmitting(false);
    }
  }

  const isVerified = kycStatusData?.isVerified || latest?.status === "approved";
  const daysRemaining = kycStatusData?.daysRemaining ?? 180;
  const expiryDisplay = kycStatusData?.expiresAt
    ? new Date(kycStatusData.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 text-white max-w-2xl mx-auto">
      {/* 👑 6-MONTH FAST-TRACK VIP CELEBRATION CARD */}
      {isVerified ? (
        <div className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-[#0c1811] via-[#09110c] to-[#081b12] p-6 sm:p-7 text-left space-y-5 shadow-[0_0_50px_rgba(16,185,129,0.25)] relative overflow-hidden animate-[fade-up_0.3s_ease]">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-2xl shadow-lg shadow-emerald-600/30">
                👑
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  APPROVED & VALID UP TO 6 MONTHS
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Next Gear Fast-Track VIP Pass Active
                </h3>
              </div>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-right">
              <span className="text-[9px] uppercase font-bold text-white/50 block">KYC Validity</span>
              <span className="font-mono text-xs font-black text-emerald-300">
                ⏳ {daysRemaining} Days Left (Till {expiryDisplay})
              </span>
            </div>
          </div>

          <div className="bg-black/50 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
            <p className="text-xs sm:text-sm text-emerald-100 font-semibold leading-relaxed">
              🎉 <strong className="text-white font-extrabold">Congratulations!</strong> Your KYC is 100% verified & approved up to 6 months. Enjoy your unlimited drive till 6 months without uploading any documents!
            </p>
            <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed">
              Your profile is pre-cleared across all Next Gear hubs & cities. Just pick your favorite ride, complete checkout with 1 click, and start your journey!
            </p>

            {/* Checkpoints Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <span>✅</span>
                <span>Driving License Verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <span>✅</span>
                <span>Aadhaar Card Verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <span>✅</span>
                <span>Express Hub Pickup</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-1">
            <span>Customer: <strong className="text-white">{kycStatusData?.customerName || defaultName}</strong></span>
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer bg-transparent border-none"
            >
              {showManualForm ? "Hide Document Update Form ▲" : "Need to update documents? Click here ▼"}
            </button>
          </div>
        </div>
      ) : (
        /* Regular Premium Header Card */
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-5 sm:p-6 text-left space-y-1.5 shadow-[0_4px_25px_rgba(0,0,0,0.2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-red)]/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-white flex items-center gap-2">
            <span>🛡️</span> KYC Automation Flow
          </h2>
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
            Submit your identity document details for instant formatting validation, age verification, and 6-month VIP clearance.
          </p>
        </div>
      )}

      {/* Inputs Form (Only shown if NOT verified or user clicked to expand) */}
      {(!isVerified || showManualForm) && (
        <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-5 rounded-3xl border border-white/10 p-5 sm:p-6 bg-white/[0.01] sm:grid-cols-2 text-left shadow-[0_4px_25px_rgba(0,0,0,0.2)] animate-[fade-up_0.25s_ease]">
          <label className="space-y-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-white/50 flex flex-col">
            <span>Full Name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="As on document"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] transition-all duration-200"
              required
            />
          </label>

          <label className="space-y-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-white/50 flex flex-col">
            <span>Document Type</span>
            <div className="relative">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as KycEntry["documentType"])}
                className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="license">Driving License</option>
                <option value="passport">Passport</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-white/40">
                <span className="text-xs">▼</span>
              </div>
            </div>
          </label>

          <label className="space-y-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-white/50 flex flex-col">
            <span>Document Number</span>
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter unique ID number"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] transition-all duration-200"
              required
            />
          </label>

          <label className="space-y-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-white/50 flex flex-col">
            <span>Date of Birth</span>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] transition-all duration-200 color-scheme-dark"
              required
            />
          </label>

          <label className="space-y-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-white/50 sm:col-span-2 flex flex-col">
            <span>Document Expiry (optional)</span>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:outline-none focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] transition-all duration-200 color-scheme-dark"
            />
          </label>

          <div className="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 active:scale-95 disabled:opacity-60 transition-all duration-150 cursor-pointer border-0 shadow-[0_4px_15px_rgba(225,29,72,0.2)]"
            >
              {submitting ? "⌛ Verification in progress..." : "⚡ Run KYC Auto-Check"}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
            >
              ↻ Refresh Records
            </button>
          </div>
        </form>
      )}

      {message && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left text-sm text-white/85">
          {message}
        </div>
      )}

      {loading ? (
        <div className="h-28 animate-pulse rounded-3xl bg-white/[0.02] border border-white/10" />
      ) : latest ? (
        <div className="rounded-3xl border border-white/10 p-5 bg-white/[0.02] shadow-[0_4px_25px_rgba(0,0,0,0.2)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Verification Log</p>
              <h4 className="text-base font-extrabold text-white mt-1">
                {docTypeLabels[latest.documentType]} · <span className="font-mono text-sm text-white/80">{latest.documentNumber}</span>
              </h4>
              <p className="text-xs text-white/40 mt-1">Checked on {new Date(latest.createdAt).toLocaleString("en-IN")}</p>
            </div>
            
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
              <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d]">
                {latest.score}/100 Score
              </span>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  latest.status === "approved"
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : latest.status === "review"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  latest.status === "approved" ? "bg-green-400" : latest.status === "review" ? "bg-amber-400" : "bg-red-400"
                }`} />
                {latest.status}
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Security Flags & Checkpoints</p>
            {latest.flags.length === 0 ? (
              <p className="mt-1.5 text-xs text-green-400 font-bold flex items-center gap-1">
                <span>✓</span> Safe: All automated verification checklists completed with no safety flags.
              </p>
            ) : (
              <ul className="mt-2 text-xs text-white/70 space-y-1.5 pl-1.5">
                {latest.flags.map((flag) => (
                  <li key={flag} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0">⚠</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : !isVerified ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center bg-white/[0.01]">
          <div className="text-3xl mb-2">👤</div>
          <p className="font-bold text-white/70 text-sm">Identity check required</p>
          <p className="mt-1 text-xs text-white/40">Complete the auto-check form above to activate booking eligibility.</p>
        </div>
      ) : null}
    </div>
  );
}
