"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, FileText, ArrowRight, MapPin } from "lucide-react";
import { INDIA_CITIES_BY_STATE, INDIA_STATES } from "@/lib/india-locations";

const initialForm = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  state: "",
  city: "",
  fleetSize: "",
};

export function VendorRegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [createdApp, setCreatedApp] = useState<{ id: string; phone: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const availableCities = useMemo(() => {
    if (!form.state) return [];
    return INDIA_CITIES_BY_STATE[form.state] || [];
  }, [form.state]);

  async function submit() {
    setSubmitting(true);
    setNotice("");

    try {
      const res = await fetch("/api/vendor-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to submit interest right now");
      }

      setForm(initialForm);
      if (data.application?.id) {
        setCreatedApp({ id: data.application.id, phone: data.application.phone });
      } else {
        setNotice("Application submitted successfully. Save your details.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit interest right now");
    } finally {
      setSubmitting(false);
    }
  }

  const copyAppId = () => {
    if (!createdApp) return;
    void navigator.clipboard.writeText(createdApp.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success screen
  if (createdApp) {
    return (
      <div className="text-center py-6 px-4">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2 uppercase tracking-wide">Application Submitted!</h3>
        <p className="text-xs text-white/60 mb-6 max-w-sm mx-auto leading-relaxed">
          Your interest has been logged. Our partner team will verify details and reach out within 24 hours.
        </p>

        {/* Application ID Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 max-w-sm mx-auto mb-8">
          <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Your Application ID</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-black text-red-500 tracking-wider">{createdApp.id}</span>
            <button
              onClick={copyAppId}
              className="p-1.5 rounded-lg border border-white/15 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
              title="Copy ID"
            >
              {copied ? <span className="text-[10px] text-emerald-400 font-bold">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-white/40 mt-3 leading-relaxed">
            We have sent this ID via email &amp; WhatsApp. Save it to track status.
          </p>
        </div>

        <div className="space-y-3 max-w-sm mx-auto">
          <Link
            href="/vendor-kyc"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <span>Upload KYC Documents</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[10px] text-white/40">
            You can also upload KYC documents later using your Application ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3.5 sm:mb-6">
        <span className="inline-block rounded-full bg-red-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[var(--brand-red-soft)] border border-red-500/20 mb-1.5 sm:mb-2">
          Fleet Partner Application
        </span>
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-white">Apply Now</h2>
        <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-white/60">Fill in your business details to request partner onboarding</p>
      </div>

      <form
        className="space-y-2.5 sm:space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">Business Name</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. Next Gear Rentals Pvt Ltd"
            value={form.businessName}
            onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">Contact Person Name</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. Rahul Sharma"
            value={form.contactName}
            onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">Email Address</label>
          <input
            type="email"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. rahul@example.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">Phone Number</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">State</label>
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-[#161616] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
              value={form.state}
              onChange={(e) => {
                const selectedState = e.target.value;
                const citiesInState = INDIA_CITIES_BY_STATE[selectedState] || [];
                setForm((prev) => ({
                  ...prev,
                  state: selectedState,
                  city: citiesInState.length > 0 ? citiesInState[0] : "",
                }));
              }}
              required
            >
              <option value="" disabled className="bg-[#161616] text-white/40">Select State</option>
              {INDIA_STATES.map((st) => (
                <option key={st} value={st} className="bg-[#161616] text-white">{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">City</label>
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-[#161616] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer disabled:opacity-50"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              required
              disabled={!form.state || availableCities.length === 0}
            >
              <option value="" disabled className="bg-[#161616] text-white/40">
                {form.state ? "Select City" : "Select State First"}
              </option>
              {availableCities.map((ct) => (
                <option key={ct} value={ct} className="bg-[#161616] text-white">{ct}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 sm:mb-2 block text-[11px] sm:text-xs font-semibold text-white/70">Fleet Size</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. 5 cars, 10 bikes"
            value={form.fleetSize}
            onChange={(e) => setForm((prev) => ({ ...prev, fleetSize: e.target.value }))}
            required
          />
        </div>
        {notice && (
          <p className="rounded-xl border border-red-500/20 bg-red-950/30 px-3.5 py-2 text-xs text-red-400 leading-relaxed">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Submitting..." : "Submit interest"}
        </button>
      </form>
    </>
  );
}
