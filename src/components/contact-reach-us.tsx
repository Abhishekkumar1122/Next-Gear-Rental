"use client";

import { useState } from "react";
import { Mail, Phone, Clock, MessageCircle, Copy, Check, Sparkles, Building2, Zap, ArrowRight } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";

export function ContactReachUs({ settings }: { settings: SiteSettings }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Reach Us Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-red-400 font-bold bg-red-950/40 border border-red-500/30 px-3 py-1 rounded-full mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Direct Helpline & Support</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          Reach Us Directly <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
        </h2>
        <p className="text-xs sm:text-sm text-white/70 mt-1">
          Our dedicated team is ready to assist you round the clock.
        </p>
      </div>

      {/* Interactive Contact Cards Grid */}
      <div className="space-y-3.5">
        
        {/* Phone Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-4.5 transition-all duration-300 hover:border-red-500/60 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-md">
                <Phone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">24/7 Phone Helpline</p>
                <p className="text-sm sm:text-base font-black text-white tracking-wide truncate">{settings.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${settings.phone}`}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-red-600/40"
              >
                Call
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(settings.phone, "phone")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/15 transition hover:scale-105"
                title="Copy phone number"
              >
                {copiedKey === "phone" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Support Email Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-4.5 transition-all duration-300 hover:border-amber-500/60 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-md">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Rider Support Email</p>
                <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">{settings.supportEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(settings.supportEmail, "supportEmail")}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white/80 transition-all hover:bg-white/15 hover:text-white hover:scale-105"
            >
              {copiedKey === "supportEmail" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Partnership Email Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-4.5 transition-all duration-300 hover:border-purple-500/60 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Vendor & Partnerships</p>
                <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">{settings.businessEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(settings.businessEmail, "businessEmail")}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white/80 transition-all hover:bg-white/15 hover:text-white hover:scale-105"
            >
              {copiedKey === "businessEmail" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Operating Hours Card */}
        <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3.5 transition-all duration-300 hover:border-emerald-500/40">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:rotate-12 transition-transform shadow-md">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Working Hours</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>24x7 Operations (All 365 Days)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Social Channels Section - Spacious Cards Layout */}
      <div className="pt-2 space-y-3">
        <p className="text-xs uppercase font-bold tracking-wider text-white/50">Instant Social Channels</p>
        
        <div className="space-y-3">
          {/* WhatsApp Card */}
          <a
            href={settings.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative flex items-center justify-between p-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-emerald-900/30 to-black text-emerald-300 transition-all duration-300 hover:scale-[1.015] hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] shadow-lg"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 text-black flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-md">
                <MessageCircle className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white">WhatsApp Support</p>
                <p className="text-xs text-emerald-400/90 font-medium">Instant reply within 2 minutes</p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform pl-2">
              <span>Chat Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Instagram Card */}
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="me noopener noreferrer"
            title="Next Gear Rentals Official Instagram @_nextgear_rentals"
            className="group relative flex items-center justify-between p-4 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/80 via-rose-900/30 to-black text-rose-300 transition-all duration-300 hover:scale-[1.015] hover:border-rose-400 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] shadow-lg"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform shadow-md">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M12 7.1A4.9 4.9 0 1 0 16.9 12 4.9 4.9 0 0 0 12 7.1zm0 8a3.1 3.1 0 1 1 3.1-3.1 3.1 3.1 0 0 1-3.1 3.1zm6.2-8.7a1.15 1.15 0 1 1-1.15-1.15A1.15 1.15 0 0 1 18.2 6.4z" />
                  <path d="M20.5 7.7a5.78 5.78 0 0 0-1.6-4.1A5.78 5.78 0 0 0 14.8 2H9.2a5.78 5.78 0 0 0-4.1 1.6A5.78 5.78 0 0 0 3.5 7.7v5.6a5.78 5.78 0 0 0 1.6 4.1A5.78 5.78 0 0 0 9.2 19h5.6a5.78 5.78 0 0 0 4.1-1.6 5.78 5.78 0 0 0 1.6-4.1zm-1.9 7.1a3.88 3.88 0 0 1-2.2 2.2 6.35 6.35 0 0 1-2.1.3H9.7a6.35 6.35 0 0 1-2.1-.3 3.88 3.88 0 0 1-2.2-2.2 6.35 6.35 0 0 1-.3-2.1V9.3a6.35 6.35 0 0 1 .3-2.1 3.88 3.88 0 0 1 2.2-2.2 6.35 6.35 0 0 1 2.1-.3h4.6a6.35 6.35 0 0 1 2.1.3 3.88 3.88 0 0 1 2.2 2.2 6.35 6.35 0 0 1 .3 2.1v3.4a6.35 6.35 0 0 1-.3 2.1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white">Official Instagram Page</p>
                <p className="text-xs text-rose-400/90 font-medium truncate">@_nextgear_rentals</p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform pl-2">
              <span>Follow Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
