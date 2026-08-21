"use client";
import { useEffect, useState } from "react";

type Promo = {
  title: string;
  type: string;
  value: string;
  desc: string;
};

type SpinSegment = {
  title: string;
  value: string;
  color: string;
};

type Settings = {
  promoPopupActive: string;
  testRideActive: string;
  testRideTitle: string;
  testRideDescription: string;
  testRideVehicleType: string;
  testRideDurationMinutes: string;
  testRideCity: string;
  phone: string;
  spinWheelActive: string;
  spinSegments: SpinSegment[];
  promos: Promo[];
};

const PROMO_TYPE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  coupon:  { label: "CODE",      color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" },
  flat:    { label: "FLAT OFF",  color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
  percent: { label: "% OFF",     color: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.2)" },
  freeday: { label: "FREE DAY",  color: "#fb7185", bg: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.2)" },
};

export function PromoPopup() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [visible, setVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showTestRide, setShowTestRide] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", city: "", vehicleType: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // Tab State: "offers" | "spin"
  const [activeTab, setActiveTab] = useState<"offers" | "spin">("offers");

  // Spin Wheel States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinSegment | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    // Check if spun recently
    const spunToday = localStorage.getItem("ng_wheel_spun_today");
    if (spunToday) {
      const ts = parseInt(spunToday, 10);
      if (Date.now() - ts < 24 * 60 * 60 * 1000) {
        setHasSpun(true);
        const savedPrize = localStorage.getItem("ng_won_prize");
        if (savedPrize) {
          try {
            setSpinResult(JSON.parse(savedPrize));
          } catch (e) {}
        }
      }
    }

    const dismissed = localStorage.getItem("ng_promo_dismissed");
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < 24 * 60 * 60 * 1000) return;
    }

    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings;
        if (!s) return;

        const promos: Promo[] = [];
        for (let i = 1; i <= 5; i++) {
          if (s[`promo${i}Active`] === "true" && s[`promo${i}Title`]) {
            promos.push({
              title: s[`promo${i}Title`] || "",
              type:  s[`promo${i}Type`]  || "coupon",
              value: s[`promo${i}Value`] || "",
              desc:  s[`promo${i}Desc`]  || "",
            });
          }
        }

        const spinSegments: SpinSegment[] = [
          { title: s.spinSegment1Title || "10% OFF", value: s.spinSegment1Value || "SPIN10", color: "#EF4444" },
          { title: s.spinSegment2Title || "15% OFF", value: s.spinSegment2Value || "SPIN15", color: "#F59E0B" },
          { title: s.spinSegment3Title || "20% OFF", value: s.spinSegment3Value || "SPIN20", color: "#10B981" },
          { title: s.spinSegment4Title || "Free Helmet", value: s.spinSegment4Value || "FREEHELMET", color: "#3B82F6" },
          { title: s.spinSegment5Title || "₹500 Coupon", value: s.spinSegment5Value || "SPIN500", color: "#8B5CF6" },
          { title: s.spinSegment6Title || "Try Again", value: s.spinSegment6Value || "TRYAGAIN", color: "#EC4899" },
        ];

        const hasContent =
          s.promoPopupActive === "true" || s.spinWheelActive === "true";

        if (!hasContent) return;

        setSettings({
          promoPopupActive: s.promoPopupActive,
          testRideActive: s.testRideActive,
          testRideTitle: s.testRideTitle || "₹1 Bike Test Ride",
          testRideDescription: s.testRideDescription || "Try before you rent!",
          testRideVehicleType: s.testRideVehicleType || "bike",
          testRideDurationMinutes: s.testRideDurationMinutes || "30",
          testRideCity: s.testRideCity || "All Cities",
          phone: s.phone || "",
          spinWheelActive: s.spinWheelActive,
          spinSegments,
          promos,
        });

        // Set default tab to spin if spinWheelActive is true
        if (s.spinWheelActive === "true") {
          setActiveTab("spin");
        }

        setTimeout(() => {
          setVisible(true);
          setTimeout(() => setShowPopup(true), 50);
        }, 1500);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setShowPopup(false);
    localStorage.setItem("ng_promo_dismissed", String(Date.now()));
    setTimeout(() => setVisible(false), 300);
  }

  function copyCode(code: string, idx: number | string) {
    navigator.clipboard.writeText(code).catch(() => {});
    if (typeof idx === "number") {
      setCopiedIdx(idx);
    } else {
      setCopiedIdx(999);
    }
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function spinTheWheel() {
    if (isSpinning || hasSpun || !settings) return;

    setIsSpinning(true);
    setSpinResult(null);

    const winningIdx = Math.floor(Math.random() * 6);
    const segment = settings.spinSegments[winningIdx];

    const targetSectorCenter = winningIdx * 60 + 30;
    const finalAngle = 360 * 5 + (360 - targetSectorCenter) + 90;

    setRotationDegrees(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinResult(segment);
      setHasSpun(true);
      localStorage.setItem("ng_wheel_spun_today", String(Date.now()));
      localStorage.setItem("ng_won_prize", JSON.stringify(segment));

      if (segment.value !== "TRYAGAIN") {
        const particles = [];
        for (let i = 0; i < 60; i++) {
          particles.push({
            id: i,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 150,
            color: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#FFF"][Math.floor(Math.random() * 7)],
            delay: Math.random() * 0.4,
          });
        }
        setConfettiParticles(particles);
      }
    }, 4500);
  }

  async function submitTestRide(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError("Please enter your name and phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/test-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          vehicleType: formData.vehicleType || settings?.testRideVehicleType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setFormError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!settings) return null;

  return (
    <>
      <style>{`
        @keyframes modalOverlayIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes modalOverlayOut {
          from { opacity: 1; backdrop-filter: blur(8px); }
          to   { opacity: 0; backdrop-filter: blur(0px); }
        }
        @keyframes modalContentIn {
          0%   { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes modalContentOut {
          0%   { opacity: 1; transform: scale(1)   translateY(0); }
          100% { opacity: 0; transform: scale(0.9) translateY(20px); }
        }
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.25), 0 0 30px rgba(220, 38, 38, 0.1); }
          50%      { box-shadow: 0 0 25px rgba(220, 38, 38, 0.5), 0 0 50px rgba(220, 38, 38, 0.25); }
        }
        @keyframes shimmerSweep {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes confettiBurst {
          0%   { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tw-x), var(--tw-y)) scale(0.4) rotate(360deg); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50%      { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
        }
        .modal-overlay-enter { animation: modalOverlayIn 0.3s ease-out forwards; }
        .modal-overlay-exit  { animation: modalOverlayOut 0.3s ease-in forwards; }
        .modal-content-enter { animation: modalContentIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .modal-content-exit  { animation: modalContentOut 0.3s ease-in forwards; }
      `}</style>

      {/* Floating Trigger Badge shown when modal is minimized/closed */}
      {!showPopup && (
        <button
          onClick={() => { setVisible(true); setShowPopup(true); }}
          className="fixed bottom-5 left-5 z-[999] flex items-center gap-2 rounded-full bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 border border-red-500/30 px-4.5 py-3 shadow-lg shadow-red-500/25 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer animate-[pulseGlow_3s_infinite]"
        >
          <span className="text-sm">🎰</span>
          <span>Spin & Win!</span>
        </button>
      )}

      {/* Screen Backdrop Overlay */}
      {visible && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 ${
            showPopup ? "modal-overlay-enter" : "modal-overlay-exit"
          }`}
          onClick={dismiss}
        >
          {/* Modal Window Container */}
          <div
            className={`w-full max-w-md rounded-3xl overflow-hidden relative ${
              showPopup ? "modal-content-enter" : "modal-content-exit"
            }`}
            style={{
              background: "linear-gradient(145deg, #111111 0%, #080808 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              animation: "neonPulse 3s infinite",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header section with brand theme banner */}
            <div
              className="relative px-5 py-4 overflow-hidden"
              style={{
                background: "linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <div
                className="absolute inset-y-0 w-32 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                  animation: "shimmerSweep 3s infinite",
                }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl animate-[bounce_2s_infinite]">🎰</span>
                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider leading-none">
                      Next Gear Lucky Club
                    </h3>
                    <p className="text-red-200/80 text-[10px] mt-1 font-medium tracking-wide">
                      {activeTab === "spin" ? "Spin the wheel to win premium discount codes!" : "Premium deals and coupon codes for your ride"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Dynamic Tab bar if both promotions & spin wheel are active */}
            {settings.spinWheelActive === "true" && settings.promos.length > 0 && (
              <div className="flex bg-neutral-900 border-b border-white/5 p-1">
                <button
                  onClick={() => { setActiveTab("spin"); setShowTestRide(false); }}
                  className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    activeTab === "spin" ? "bg-[var(--brand-red)] text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  🎰 Spin & Win
                </button>
                <button
                  onClick={() => { setActiveTab("offers"); setShowTestRide(false); }}
                  className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    activeTab === "offers" ? "bg-[var(--brand-red)] text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  🎟️ Active Coupons
                </button>
              </div>
            )}

            {/* Body Content area - COMPLETELY HIDES SCROLLBARS */}
            <div className="p-5 space-y-4 overflow-hidden relative">

              {/* TAB 1: SPIN AND WIN LUCKY WHEEL */}
              {activeTab === "spin" && settings.spinWheelActive === "true" && (
                <div className="flex flex-col items-center py-2 space-y-5 relative">
                  
                  {/* Outer Wheel Render: Hide it completely if won to keep dialog compact without scrollbar */}
                  {!spinResult ? (
                    <div className="flex flex-col items-center space-y-4 animate-[modalContentIn_0.3s_ease]">
                      {/* Pointer Indicator */}
                      <div className="text-xl leading-none select-none text-red-500 font-bold">
                        ▼
                      </div>

                      {/* Spinning Wheel Body */}
                      <div className="relative w-48 h-48 rounded-full flex items-center justify-center select-none shadow-[0_0_25px_rgba(220,38,38,0.12)] border-[3px] border-neutral-800 bg-neutral-900">
                        
                        <svg
                          viewBox="0 0 200 200"
                          className="w-full h-full rounded-full transition-transform"
                          style={{
                            transform: `rotate(${rotationDegrees}deg)`,
                            transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)" : "none",
                          }}
                        >
                          {settings.spinSegments.map((seg, idx) => {
                            const angle = 60;
                            const startAngle = idx * angle;
                            const endAngle = startAngle + angle;
                            
                            const rad = Math.PI / 180;
                            const x1 = 100 + 100 * Math.cos(startAngle * rad);
                            const y1 = 100 + 100 * Math.sin(startAngle * rad);
                            const x2 = 100 + 100 * Math.cos(endAngle * rad);
                            const y2 = 100 + 100 * Math.sin(endAngle * rad);
                            
                            // Alternate sector colors
                            const segmentColor = idx % 2 === 0 ? "#121212" : "#1f1414";
                            
                            return (
                              <g key={idx}>
                                <path
                                  d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                                  fill={segmentColor}
                                  stroke="rgba(255,255,255,0.05)"
                                  strokeWidth="1"
                                />
                                <text
                                  x="100"
                                  y="50"
                                  fill={idx % 2 === 0 ? "#f87171" : "#fca5a5"}
                                  fontSize="8"
                                  fontWeight="900"
                                  letterSpacing="0.05em"
                                  textAnchor="middle"
                                  transform={`rotate(${startAngle + 30} 100 100)`}
                                >
                                  {seg.title}
                                </text>
                              </g>
                            );
                          })}
                          <circle cx="100" cy="100" r="24" fill="#111111" stroke="rgba(220,38,38,0.25)" strokeWidth="2.5" />
                        </svg>

                        {/* Center Spin Trigger Button */}
                        <button
                          onClick={spinTheWheel}
                          disabled={isSpinning || hasSpun}
                          className="absolute z-10 w-12 h-12 rounded-full flex flex-col items-center justify-center bg-red-600 hover:bg-red-500 text-white border border-red-400 font-black text-[9px] tracking-wider uppercase transition shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        >
                          <span>SPIN</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display prize instantly in a compact clean layout
                    <div className="w-full text-center space-y-3 pt-2 animate-[modalContentIn_0.35s_ease]">
                      {spinResult.value === "TRYAGAIN" ? (
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                          <span className="text-3xl block mb-1">😢</span>
                          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Hard Luck!</h4>
                          <p className="text-white/50 text-[10px] mt-1 leading-snug">Don&apos;t worry, you can spin again tomorrow!</p>
                        </div>
                      ) : (
                        <div
                          className="p-5 rounded-2xl border border-emerald-500/20 text-center space-y-3 shadow-lg shadow-emerald-500/5"
                          style={{ background: "rgba(16,185,129,0.03)" }}
                        >
                          <span className="text-3xl block mb-0.5">🎉 YOU WON! 🎉</span>
                          <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Prize Sector Unlocked:</p>
                          <h4 className="text-emerald-400 font-black text-xl uppercase tracking-widest leading-none">
                            {spinResult.title}
                          </h4>
                          
                          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto pt-1">
                            <span
                              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-xs uppercase tracking-wider select-all"
                            >
                              {spinResult.value}
                            </span>
                            <button
                              onClick={() => copyCode(spinResult.value, "spin")}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg cursor-pointer transition"
                            >
                              {copiedIdx === 999 ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confetti particles */}
                  {confettiParticles.map((part) => (
                    <div
                      key={part.id}
                      className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                      style={{
                        background: part.color,
                        left: "50%",
                        top: "50%",
                        "--tw-x": `${part.x}px`,
                        "--tw-y": `${part.y}px`,
                        animation: `confettiBurst 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) ${part.delay}s forwards`,
                      } as React.CSSProperties}
                    />
                  ))}

                  {hasSpun && !spinResult && (
                    <p className="text-[10px] text-white/30 text-center leading-relaxed">
                      You have already spun the wheel today. Try again in 24 hours!
                    </p>
                  )}
                </div>
              )}

              {/* TAB 2: ACTIVE COUPONS & SPECIAL OFFERS */}
              {activeTab === "offers" && (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                  {settings.testRideActive === "true" && !showTestRide && !submitted && (
                    <div
                      className="relative rounded-xl overflow-hidden p-4 cursor-pointer group transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        background: "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(153,27,27,0.05) 100%)",
                        border: "1px solid rgba(220,38,38,0.3)",
                      }}
                      onClick={() => setShowTestRide(true)}
                    >
                      <div className="flex items-center justify-between gap-3 relative z-10">
                        <div className="flex gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                              background: "rgba(220,38,38,0.15)",
                              border: "1px solid rgba(220,38,38,0.3)",
                            }}
                          >
                            🏍️
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                              Special Offer
                            </span>
                            <h4 className="text-white font-extrabold text-xs mt-0.5 leading-tight">
                              {settings.testRideTitle}
                            </h4>
                            <p className="text-white/40 text-[9px] mt-0.5">
                              {settings.testRideDescription}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white font-black text-[9px] uppercase px-3 py-2 shadow transition-transform group-hover:translate-x-0.5">
                          Book
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ₹1 Test Ride form panel */}
                  {settings.testRideActive === "true" && showTestRide && !submitted && (
                    <div
                      className="rounded-xl overflow-hidden p-4 animate-[modalContentIn_0.3s_ease]"
                      style={{
                        background: "rgba(220,38,38,0.03)",
                        border: "1px solid rgba(220,38,38,0.2)",
                      }}
                    >
                      <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="flex items-center gap-1.5">
                          <span>🏍️</span>
                          <span className="text-white font-black text-xs uppercase tracking-wider">{settings.testRideTitle}</span>
                        </div>
                        <button
                          onClick={() => setShowTestRide(false)}
                          className="text-white/40 hover:text-white font-black text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Back
                        </button>
                      </div>

                      <form onSubmit={submitTestRide} className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-white/20 bg-white/[0.02] border border-white/5 outline-none"
                        />
                        <div className="grid gap-2 grid-cols-2">
                          <input
                            type="tel"
                            required
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-white/20 bg-white/[0.02] border border-white/5 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={formData.city}
                            onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-[11px] text-white placeholder:text-white/20 bg-white/[0.02] border border-white/5 outline-none"
                          />
                        </div>

                        {formError && <p className="text-red-400 text-[10px] font-bold">{formError}</p>}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full rounded-lg py-2 text-[10px] font-black uppercase tracking-wider text-white transition disabled:opacity-50 cursor-pointer"
                          style={{ background: "linear-gradient(90deg, #b91c1c, #dc2626)" }}
                        >
                          {submitting ? "Booking..." : "Submit Book →"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Test ride success panel */}
                  {settings.testRideActive === "true" && submitted && (
                    <div
                      className="rounded-xl p-4 text-center animate-[modalContentIn_0.3s_ease]"
                      style={{
                        background: "rgba(52,211,153,0.03)",
                        border: "1px solid rgba(52,211,153,0.2)",
                      }}
                    >
                      <span className="text-3xl block mb-1">🎉</span>
                      <h4 className="text-white font-extrabold text-xs">Test Ride Requested!</h4>
                      <p className="text-white/50 text-[9px] mt-1 leading-relaxed">
                        We will call you within 2 hours to confirm your ride schedule.
                      </p>
                    </div>
                  )}

                  {/* Coupons list */}
                  <div className="space-y-2">
                    {settings.promos.map((promo, idx) => {
                      const meta = PROMO_TYPE_LABELS[promo.type] || PROMO_TYPE_LABELS.coupon;
                      const isCoupon = promo.type === "coupon";
                      return (
                        <div
                          key={idx}
                          className="rounded-xl p-3 flex items-center justify-between gap-3"
                          style={{
                            background: "rgba(255,255,255,0.01)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-16 rounded-lg py-1.5 text-center flex flex-col justify-center flex-shrink-0"
                              style={{
                                background: meta.bg,
                                border: `1px solid ${meta.border}`,
                              }}
                            >
                              {isCoupon ? (
                                <span className="font-black text-[9px] tracking-wider break-all px-1" style={{ color: meta.color }}>
                                  {promo.value}
                                </span>
                              ) : (
                                <span className="font-black text-sm leading-none" style={{ color: meta.color }}>
                                  {promo.type === "percent" ? `${promo.value}%` : `₹${promo.value}`}
                                </span>
                              )}
                              <span className="text-[7px] font-black tracking-widest uppercase mt-0.5" style={{ color: `${meta.color}9f` }}>
                                {meta.label}
                              </span>
                            </div>

                            <div>
                              <p className="text-white font-bold text-xs leading-tight">
                                {promo.title}
                              </p>
                              <p className="text-white/40 text-[9px] mt-0.5">
                                {promo.desc}
                              </p>
                            </div>
                          </div>

                          {isCoupon && promo.value && (
                            <button
                              onClick={() => copyCode(promo.value, idx)}
                              className="flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition cursor-pointer"
                              style={{
                                background: copiedIdx === idx ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                                color: copiedIdx === idx ? "#34d399" : "rgba(255,255,255,0.6)",
                                border: `1px solid ${copiedIdx === idx ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.05)"}`,
                              }}
                            >
                              {copiedIdx === idx ? "✓ Copied" : "Copy"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer controls */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0, 0, 0, 0.2)",
              }}
            >
              <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">
                © Next Gear Rentals
              </span>
              <button
                onClick={dismiss}
                className="text-[9px] text-white/40 hover:text-white font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Continue to Site
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
