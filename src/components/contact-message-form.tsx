"use client";

import { useState } from "react";
import { User, Mail, Phone, MessageSquare, Send, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};

export function ContactMessageForm() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submitMessage() {
    setSending(true);
    setStatus(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setStatus({
        type: "error",
        message: "Please enter a valid email address ending with .com, .in, etc. (e.g. name@gmail.com)",
      });
      setSending(false);
      return;
    }

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
      setStatus({
        type: "success",
        message: "Message sent successfully! Our executive will reach out to you within 15 minutes.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to send message right now",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative">
      {/* Top Header Label */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-red-400 font-bold">
              Instant Dispatch
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Send Us a Message <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </h2>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submitMessage();
        }}
      >
        {/* Full Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-red-400" /> Full Name
          </label>
          <div className="relative group">
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-red-500 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>
        </div>

        {/* Email & Phone Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-400" /> Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-red-500 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              placeholder="name@gmail.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-red-400" /> Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-red-500 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              placeholder="+91 98765 43210"
              required
            />
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-red-400" /> How can we help you?
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            className="w-full min-h-[120px] rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-red-500 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)] resize-none"
            placeholder="Describe your inquiry, booking question, or partnership request..."
            required
          />
        </div>

        {/* Status Notification Banner */}
        {status && (
          <div
            className={`rounded-xl p-3.5 text-xs font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 ${
              status.type === "success"
                ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-rose-950/80 border border-rose-500/40 text-rose-300"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Submit Button with Dynamic Hover & Pulsing Glow */}
        <button
          type="submit"
          disabled={sending}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 p-px font-bold text-white shadow-xl shadow-red-600/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-red-600/50 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-red-600 via-red-500 to-rose-600 px-6 py-3.5 text-sm tracking-wide">
            {sending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
}
