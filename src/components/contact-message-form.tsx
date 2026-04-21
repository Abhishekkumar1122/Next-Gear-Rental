"use client";

import { useState } from "react";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};

export function ContactMessageForm() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  async function submitMessage() {
    setSending(true);
    setNotice("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to send message right now");
      }

      setForm(initialForm);
      setNotice("Message sent successfully. Our team will contact you soon.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to send message right now");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-white">Send a message</h2>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submitMessage();
        }}
      >
        <input
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2.5 text-white placeholder-white/50 transition-all duration-300 focus:border-[var(--brand-red)]/60 focus:bg-white/[0.12] focus:outline-none"
          placeholder="Full name"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2.5 text-white placeholder-white/50 transition-all duration-300 focus:border-[var(--brand-red)]/60 focus:bg-white/[0.12] focus:outline-none"
          placeholder="Email address"
          required
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2.5 text-white placeholder-white/50 transition-all duration-300 focus:border-[var(--brand-red)]/60 focus:bg-white/[0.12] focus:outline-none"
          placeholder="Phone number"
          required
        />
        <textarea
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          className="min-h-[120px] rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2.5 text-white placeholder-white/50 transition-all duration-300 focus:border-[var(--brand-red)]/60 focus:bg-white/[0.12] focus:outline-none resize-none"
          placeholder="How can we help?"
          required
        />
        {notice && <p className="text-xs text-white/80">{notice}</p>}
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-red)]/80 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-0.5 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </>
  );
}
