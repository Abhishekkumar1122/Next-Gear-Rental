"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactMessageForm } from "@/components/contact-message-form";
import { ContactReachUs } from "@/components/contact-reach-us";
import type { SiteSettings } from "@/lib/site-settings";
import { Headphones, ShieldCheck, MapPin, Zap, MessageSquare, Sparkles, Send, PhoneCall, ArrowRight, ArrowLeft } from "lucide-react";

export function ContactContainerInteractive({ settings }: { settings: SiteSettings }) {
  const [activeTab, setActiveTab] = useState<"form" | "reach">("form");

  return (
    <div className="space-y-8">
      {/* Top Interactive Mode Toggle Bar (Reel-style Interactive Switcher) */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-neutral-900/90 p-2 backdrop-blur-xl shadow-2xl max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all duration-500 cursor-pointer ${
            activeTab === "form"
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/40 scale-[1.02]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Send Message Form</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reach")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all duration-500 cursor-pointer ${
            activeTab === "reach"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/40 scale-[1.02]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Direct Contact & Socials</span>
        </button>
      </div>

      {/* Reel-Style Split Glassmorphic Card Shell with Sliding Transition */}
      <div className="relative min-h-[580px] overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900/95 via-black to-neutral-950 p-6 sm:p-10 shadow-2xl shadow-red-600/20 backdrop-blur-2xl">
        {/* Animated Laser Border Sweep at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-laser-sweep" />

        {/* Ambient Glowing Orbs inside Card */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-red-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/15 blur-[100px] pointer-events-none" />

        {/* Dynamic Interactive Sliding Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start relative z-10">
          {/* Left Panel: Contact Message Form */}
          <div
            className={`transition-all duration-700 ease-in-out ${
              activeTab === "form"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-40 lg:opacity-100 lg:translate-x-0"
            }`}
          >
            <ContactMessageForm />
          </div>

          {/* Right Panel: Direct Reach Us Info */}
          <div
            className={`transition-all duration-700 ease-in-out ${
              activeTab === "reach"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-40 lg:opacity-100 lg:translate-x-0"
            }`}
          >
            <ContactReachUs settings={settings} />
          </div>
        </div>

        {/* Mobile Floating Toggle Switch Indicator Banner */}
        <div className="mt-8 pt-6 border-t border-white/10 lg:hidden flex justify-center">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "form" ? "reach" : "form")}
            className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/60 px-5 py-2.5 text-xs font-bold text-red-300 shadow-lg shadow-red-600/30 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Switch to {activeTab === "form" ? "Direct Helplines & Socials" : "Message Form"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
