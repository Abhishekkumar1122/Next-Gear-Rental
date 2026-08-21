"use client";

import { useState } from "react";

const initialForm = {
  businessName: "",
  contactName: "",
  phone: "",
  city: "",
  fleetSize: "",
};

export function VendorRegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

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
      setNotice(`Application submitted. Your Application ID is ${data.application?.id ?? "shown in admin records"}. Save it to check status and upload KYC documents.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit interest right now");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold tracking-tight text-white mb-6 uppercase tracking-wider text-[var(--brand-red-soft)]">
        Apply now
      </h2>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">Business Name</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. Next Gear Rentals Pvt Ltd"
            value={form.businessName}
            onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">Contact Person Name</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. Rahul Sharma"
            value={form.contactName}
            onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">Phone Number</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">City</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. Bangalore, Mumbai"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">Fleet Size</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="e.g. 5 cars, 10 bikes"
            value={form.fleetSize}
            onChange={(e) => setForm((prev) => ({ ...prev, fleetSize: e.target.value }))}
            required
          />
        </div>
        {notice && (
          <p className="rounded-xl border border-green-500/20 bg-green-950/30 px-4 py-3 text-xs text-green-400 leading-relaxed">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit interest"}
        </button>
      </form>
    </>
  );
}
