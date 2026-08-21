"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShieldCheck, KeyRound, Clock, ArrowRight } from "lucide-react";

export function AnimatedStepsSection() {
  // stage: 0 (all hidden), 1 (Box 1), 2 (Box 1 & 2), 3 (All 3 revealed - STOP & HOLD)
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: Detects when section scrolls into view or away
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        } else {
          setIsIntersecting(false);
          setStage(0); // Reset to 0 when user scrolls away off screen
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Scroll Triggered Step Animation Sequence:
  // Starts from 1 -> 2 -> 3 when scrolled into view, then STOPS & HOLDS at 3!
  useEffect(() => {
    if (!isIntersecting) return;

    if (stage === 0) {
      setStage(1);
      return;
    }

    // Stop animation when all 3 steps are revealed (stage === 3)
    if (stage >= 3) return;

    const timer = setTimeout(() => {
      setStage((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 3));
    }, 1400);

    return () => clearTimeout(timer);
  }, [isIntersecting, stage]);

  // Calculate laser progress width (0%, 33%, 66%, 100%)
  const laserWidth = stage === 0 ? "0%" : stage === 1 ? "30%" : stage === 2 ? "65%" : "100%";

  return (
    <section 
      ref={sectionRef}
      className="fade-up stagger-2 relative space-y-6 pt-4 min-h-[380px]"
    >
      {/* Title & Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <p className="text-xs uppercase tracking-[0.3em] font-black text-[var(--brand-red)]">
              Interactive Guide
            </p>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-white">
            Ride in <span className="gradient-text">3 Simple Steps</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-xl">
            Search your city, pick a vehicle, and get instant confirmation in minutes.
          </p>
        </div>

        {/* Step Selector Manual Pills */}
        <div className="flex items-center gap-1.5 bg-white/[0.05] p-1.5 rounded-full border border-white/10">
          {[
            { id: 1, label: "1. Search" },
            { id: 2, label: "2. Verify" },
            { id: 3, label: "3. Go" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStage(item.id as any)}
              className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full transition-all duration-300 cursor-pointer ${
                stage === item.id || (stage === 3 && item.id === 3)
                  ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-500/40"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Container with Dynamic Laser Beam Connector */}
      <div className="mt-8 grid gap-6 md:grid-cols-3 relative py-2">
        {/* Desktop Laser Beam Connecting Track (Traffic Signal Colors: Red -> Yellow -> Green) */}
        <div className={`hidden md:block absolute top-1/2 left-16 right-16 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${
          stage === 3 ? "opacity-0" : "opacity-100"
        }`}>
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 shadow-[0_0_15px_rgba(225,6,0,0.9)] transition-all duration-1000 ease-out"
            style={{ width: laserWidth }}
          />
        </div>

        {/* Step 1 Box: Search (RED Signal 🔴) */}
        <div 
          onClick={() => setStage(1)}
          className={`group relative rounded-3xl border p-6 cursor-pointer overflow-hidden transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            stage >= 1
              ? "opacity-100 translate-y-0 scale-100 shadow-2xl z-10"
              : "opacity-0 translate-y-10 scale-90 blur-sm pointer-events-none z-0"
          } ${
            stage === 1 || stage === 3
              ? "border-red-500 bg-gradient-to-b from-red-950/50 via-white/[0.07] to-[#0c0c0c] shadow-[0_10px_35px_rgba(225,6,0,0.4)]"
              : "border-white/15 bg-[#0d0d0d]"
          }`}
        >
          {/* Top Holographic Micro Label */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-bold text-red-400/80 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-500/20">
              01. DISCOVER
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border transition-all duration-500 ${
              stage >= 1
                ? "bg-red-600 text-white border-white shadow-md shadow-red-500/50 scale-110"
                : "bg-white/10 text-white/40 border-white/10"
            }`}>
              1
            </div>
          </div>

          {/* Icon & Title */}
          <div className="space-y-3">
            <div className="relative inline-block">
              <Search className={`w-12 h-12 transition-all duration-500 ${
                stage >= 1 ? "text-red-500 scale-110 drop-shadow-[0_0_12px_rgba(225,6,0,0.8)]" : "text-white/60"
              }`} />
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-wide">
              Search
            </h3>
            
            <p className="text-xs text-white/70 leading-relaxed">
              Choose your city, pick your travel dates, and select your desired bike, car, or scooty.
            </p>
            
            <div className="pt-3 flex items-center justify-between border-t border-white/10">
              <span className="text-[10px] font-mono text-white/50">Est. Time</span>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">
                ~2 min
              </span>
            </div>
          </div>

          {/* Connecting Arrow for Desktop */}
          {stage >= 2 && (
            <div className={`hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-none items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white shadow-lg shadow-red-500/60 transition-opacity duration-700 ${
              stage === 3 ? "opacity-0" : "opacity-100"
            }`}>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Step 2 Box: Verify (YELLOW Signal 🟡) */}
        <div 
          onClick={() => setStage(2)}
          className={`group relative rounded-3xl border p-6 cursor-pointer overflow-hidden transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            stage >= 2
              ? "opacity-100 translate-y-0 scale-100 shadow-2xl z-10"
              : "opacity-0 translate-y-10 scale-90 blur-sm pointer-events-none z-0"
          } ${
            stage === 2 || stage === 3
              ? "border-amber-500 bg-gradient-to-b from-amber-950/50 via-white/[0.07] to-[#0c0c0c] shadow-[0_10px_35px_rgba(245,158,11,0.4)]"
              : "border-white/15 bg-[#0d0d0d]"
          }`}
        >
          {/* Top Holographic Micro Label */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-bold text-amber-400/80 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/20">
              02. VERIFY
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border transition-all duration-500 ${
              stage >= 2
                ? "bg-amber-500 text-black border-white shadow-md shadow-amber-500/50 scale-110"
                : "bg-white/10 text-white/40 border-white/10"
            }`}>
              2
            </div>
          </div>

          {/* Icon & Title */}
          <div className="space-y-3">
            <div className="relative inline-block">
              <ShieldCheck className={`w-12 h-12 transition-all duration-500 ${
                stage >= 2 ? "text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" : "text-white/60"
              }`} />
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-wide">
              Verify
            </h3>
            
            <p className="text-xs text-white/70 leading-relaxed">
              Upload your valid driving license and ID. NRIs use passport & international permit.
            </p>
            
            <div className="pt-3 flex items-center justify-between border-t border-white/10">
              <span className="text-[10px] font-mono text-white/50">Est. Time</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                ~3 min
              </span>
            </div>
          </div>

          {/* Connecting Arrow for Desktop */}
          {stage >= 3 && (
            <div className={`hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-none items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-black shadow-lg shadow-amber-500/60 transition-opacity duration-700 ${
              stage === 3 ? "opacity-0" : "opacity-100"
            }`}>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Step 3 Box: Go (Vibrant GREEN Signal 🟢) */}
        <div 
          onClick={() => setStage(3)}
          className={`group relative rounded-3xl border p-6 cursor-pointer overflow-hidden transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            stage >= 3
              ? "opacity-100 translate-y-0 scale-100 shadow-2xl z-10"
              : "opacity-0 translate-y-10 scale-90 blur-sm pointer-events-none z-0"
          } ${
            stage === 3
              ? "border-emerald-400 bg-gradient-to-b from-emerald-950/70 via-emerald-900/20 to-[#0c0c0c] shadow-[0_0_40px_rgba(16,185,129,0.5)]"
              : "border-white/15 bg-[#0d0d0d]"
          }`}
        >
          {/* Top Holographic Micro Label */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              03. UNLOCK & RIDE
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border transition-all duration-500 ${
              stage >= 3
                ? "bg-emerald-500 text-black border-white shadow-lg shadow-emerald-500/70 scale-110"
                : "bg-white/10 text-white/40 border-white/10"
            }`}>
              3
            </div>
          </div>

          {/* Icon & Title */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <KeyRound className={`w-12 h-12 transition-all duration-500 ${
                stage >= 3 ? "text-emerald-400 scale-110 drop-shadow-[0_0_18px_rgba(16,185,129,0.95)]" : "text-white/60"
              }`} />
              {stage === 3 && (
                <span className="text-[10px] uppercase tracking-wider font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                  Ready to Go 🚀
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-wide">
              Go
            </h3>
            
            <p className="text-xs text-white/70 leading-relaxed">
              Get instant confirmation, pickup your keys at checking point, and start riding!
            </p>
            
            <div className="pt-3 flex items-center justify-between border-t border-white/10">
              <span className="text-[10px] font-mono text-white/50">Status</span>
              <span className="text-xs font-mono font-extrabold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                Ready Now
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Timeline Footer */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c0c0c] p-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[var(--brand-red)] shrink-0 animate-pulse" />
          <div>
            <p className="text-xs sm:text-sm font-black text-white">Total Time: ~5 Minutes</p>
            <p className="text-[11px] text-white/60">From search to unlock. Fast, verified & hassle-free.</p>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-white/40">Journey Progress</span>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-700"
              style={{ width: laserWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
