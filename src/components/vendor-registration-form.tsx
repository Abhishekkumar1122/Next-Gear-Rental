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
      setNotice("Application submitted. Our team will contact you for KYC and onboarding.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit interest right now");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold">Apply now</h2>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          className="rounded-xl border border-black/10 px-3 py-2 transition-all focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          placeholder="Business name"
          value={form.businessName}
          onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-black/10 px-3 py-2 transition-all focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          placeholder="Contact name"
          value={form.contactName}
          onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-black/10 px-3 py-2 transition-all focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-black/10 px-3 py-2 transition-all focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-black/10 px-3 py-2 transition-all focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          placeholder="Fleet size"
          value={form.fleetSize}
          onChange={(e) => setForm((prev) => ({ ...prev, fleetSize: e.target.value }))}
          required
        />
        {notice && <p className="text-xs text-black/70">{notice}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-red)]/90 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit interest"}
        </button>
      </form>
    </>
  );
}
