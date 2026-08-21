"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookVehicleButton } from "@/components/book-vehicle-button";
import { Zap, ShieldCheck, Globe2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function AnimatedCtaSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      id: 1,
      icon: Zap,
      title: "Instant Booking",
      subtitle: "Confirmation within seconds",
      highlight: "< 30s Speed",
      color: "from-red-500/20 to-orange-500/10",
      borderColor: "group-hover:border-red-500/50",
      glowColor: "shadow-red-500/20",
      iconBg: "bg-red-500/20 text-red-400",
    },
    {
      id: 2,
      icon: ShieldCheck,
      title: "Fully Insured",
      subtitle: "Comprehensive coverage included",
      highlight: "100% Protected",
      color: "from-blue-500/20 to-indigo-500/10",
      borderColor: "group-hover:border-blue-500/50",
      glowColor: "shadow-blue-500/20",
      iconBg: "bg-blue-500/20 text-blue-400",
    },
    {
      id: 3,
      icon: Globe2,
      title: "120+ Cities",
      subtitle: "Nationwide coverage available",
      highlight: "Pan India",
      color: "from-emerald-500/20 to-teal-500/10",
      borderColor: "group-hover:border-emerald-500/50",
      glowColor: "shadow-emerald-500/20",
      iconBg: "bg-emerald-500/20 text-emerald-400",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0b0b0b] p-6 sm:p-8 md:p-12 shadow-2xl shadow-red-600/20">
      {/* Dynamic Animated Ambient Background */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[var(--brand-red)]/25 blur-[100px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-600/15 blur-[90px] animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--brand-red)]/10 via-transparent to-transparent opacity-60" />

      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 grid gap-8 md:gap-12 md:grid-cols-[1.3fr_1fr] items-center">
        {/* Left Column: Heading & Call To Actions */}
        <div className="space-y-6">
          {/* Live Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              Live Fleet Active Nationwide
            </span>
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-red-soft)]">
              Your Next Adventure Awaits
            </p>
            <h2 className="mt-2 font-display text-4xl uppercase tracking-wider text-white sm:text-5xl md:text-6xl">
              Ready to <span className="gradient-text-red-white">Ride?</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm sm:text-base text-white/80 leading-relaxed">
              Join thousands of travelers who trust Next Gear for their premium bike & car rentals. Book in seconds, enjoy transparent pricing, and ride with complete confidence.
            </p>
          </div>

          {/* Quick Perks List */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-white/70">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero Security Deposit Options</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Free Cancellation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>24x7 Roadside Assistance</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <div className="relative group">
              {/* Button Pulse Aura */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 opacity-70 blur-md transition-all duration-300 group-hover:opacity-100 group-hover:blur-lg" />
              <BookVehicleButton className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95" />
            </div>

            <Link
              href="/cities"
              className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-95"
            >
              <span>Explore Cities</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right Column: Feature Highlight Cards with Rich Micro-Animations */}
        <div className="space-y-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const isHovered = hoveredCard === feature.id;

            return (
              <div
                key={feature.id}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.08] ${feature.borderColor} ${isHovered ? `shadow-2xl ${feature.glowColor}` : "shadow-lg"}`}
              >
                {/* Background Shimmer Highlight */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Animated Icon Box */}
                    <div className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${feature.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                      {/* Pulse Ring around icon */}
                      <span className="absolute inset-0 rounded-xl border border-current opacity-30 animate-ping" style={{ animationDuration: "3s" }} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white transition-colors duration-200 group-hover:text-red-400">
                        {feature.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-white/65">
                        {feature.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Feature Pill Badge */}
                  <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/10 group-hover:text-white">
                    <span>{feature.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
