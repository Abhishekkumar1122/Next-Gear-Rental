"use client";

import { useState } from "react";

export function DeliveryJobForm() {
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState<string | null>(null);
  const [form, setForm] = useState({
    bookingId: "",
    type: "delivery",
    scheduledAt: "",
    startLat: "",
    startLng: "",
    endLat: "",
    endLng: "",
    assignedDriverId: "",
    notes: "",
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Creating delivery job...");
    setOtp(null);

    const response = await fetch("/api/delivery/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: form.bookingId,
        type: form.type,
        scheduledAt: form.scheduledAt || undefined,
        startLat: form.startLat ? Number(form.startLat) : undefined,
        startLng: form.startLng ? Number(form.startLng) : undefined,
        endLat: form.endLat ? Number(form.endLat) : undefined,
        endLng: form.endLng ? Number(form.endLng) : undefined,
        assignedDriverId: form.assignedDriverId || undefined,
        notes: form.notes || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data?.error ?? "Failed to create job.");
      return;
    }

    setMessage(`Job created: ${data.job?.id ?? ""}`);
    setOtp(data.otp ?? null);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={form.bookingId}
          onChange={(event) => updateField("bookingId", event.target.value)}
          placeholder="Booking ID"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          required
        />
        <select
          value={form.type}
          onChange={(event) => updateField("type", event.target.value)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        >
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={form.scheduledAt}
          onChange={(event) => updateField("scheduledAt", event.target.value)}
          placeholder="Scheduled at (2026-02-23T14:00:00Z)"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
        <input
          value={form.assignedDriverId}
          onChange={(event) => updateField("assignedDriverId", event.target.value)}
          placeholder="Driver ID (optional)"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={form.startLat}
          onChange={(event) => updateField("startLat", event.target.value)}
          placeholder="Start lat"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
        <input
          value={form.startLng}
          onChange={(event) => updateField("startLng", event.target.value)}
          placeholder="Start lng"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={form.endLat}
          onChange={(event) => updateField("endLat", event.target.value)}
          placeholder="Destination lat"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
        <input
          value={form.endLng}
          onChange={(event) => updateField("endLng", event.target.value)}
          placeholder="Destination lng"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
      </div>

      <textarea
        value={form.notes}
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Notes"
        className="min-h-[90px] rounded-xl border border-black/10 px-3 py-2 text-sm"
      />

      <button type="submit" className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/25">
        Create delivery job
      </button>

      {message ? <p className="text-sm text-black/70">{message}</p> : null}
      {otp ? <p className="text-sm font-semibold">OTP: {otp}</p> : null}
    </form>
  );
}
