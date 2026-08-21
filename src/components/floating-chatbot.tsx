"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

type Role = "bot" | "user";

type WeatherInfo = {
  cityName: string;
  tempC: number;
  condition: string;
  icon: string;
  isSnowing: boolean;
  snowfallCm: number;
  aqiStatus: string;
  aqiValue: number;
  ridingAdvice: string;
  suitability: string;
};

type VehicleSummary = {
  id: string;
  title: string;
  type: string;
  city: string;
  pricePerDayINR: number;
  transmission: string;
  fuel: string;
  imageUrl?: string | null;
};

type Message = {
  id: string;
  role: Role;
  text: string;
  weather?: WeatherInfo | null;
  vehicles?: VehicleSummary[] | null;
};

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;

        // Bullet lines starting with • or -
        if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
          const contentWithoutBullet = line.trim().substring(1).trim();
          const bulletParts = contentWithoutBullet.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-extrabold text-white drop-shadow-sm">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5 text-xs text-white/90">
              <span className="text-[var(--brand-red)] font-black select-none text-sm leading-none">•</span>
              <div className="flex-1 leading-normal">{bulletParts}</div>
            </div>
          );
        }

        // Parse **bold** tags inside normal lines
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const parsedContent = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-bold text-white drop-shadow-sm">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        return (
          <div key={idx} className="text-xs text-white/95 leading-normal">
            {parsedContent}
          </div>
        );
      })}
    </div>
  );
}

export function FloatingChatbot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "⚡ Hi! I'm **NextGo AI**. Ask me anything like:\n• **Manali bike trip snowfall details?**\n• **Automatic cars in Goa under ₹2500**\n• **What is Next Gear cancellation policy?**",
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    setMounted(true);

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      setIsExpanded(true);
      return;
    }

    // Initial expansion 1s after load on desktop
    const initialTimer = setTimeout(() => setIsExpanded(true), 1000);

    // Continuous automatic loop on desktop only
    const loopInterval = setInterval(() => {
      setIsExpanded((prev) => !prev);
    }, 4500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(loopInterval);
    };
  }, []);

  async function processAiQuery(promptText: string) {
    if (!promptText.trim()) return;

    const userMessageId = `u-${Date.now()}`;
    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      text: promptText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          city: "Delhi",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to process AI query");
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: data.reply || "I found some matching details for your trip!",
        weather: data.weather || null,
        vehicles: data.vehicles || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          role: "bot",
          text: "I had trouble fetching live details. Try asking about bikes, cars, or weather in Goa, Delhi, or Manali!",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function createBooking(vehicle: VehicleSummary) {
    setBusy(true);

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          city: vehicle.city,
          startDate: tomorrow.toISOString().split("T")[0],
          endDate: dayAfter.toISOString().split("T")[0],
          customerName: "Next Gear Rider",
          customerEmail: "user@example.com",
          customerPhone: "+919876543210",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking creation failed");

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: `🎉 Booking created successfully! Booking ID: **${data.booking.id}**. Total: **₹${data.booking.totalAmountINR.toLocaleString("en-IN")}**.`,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create booking";
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          role: "bot",
          text: `Booking failed: ${message}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[365px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/15 px-4 py-3 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="relative hidden md:flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/40 bg-neutral-900 overflow-hidden shadow-md shadow-red-500/30">
                <img
                  src="/car-ai-robot.png?v=101"
                  alt="NextGo Car AI Robot"
                  className="h-full w-full object-cover rounded-xl"
                />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-white">NextGo AI</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Trip & Booking AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/20 px-2.5 py-1 text-xs hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-[400px] overflow-y-auto px-3.5 py-3 space-y-3 scrollbar-thin">
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.role === "bot"
                      ? "bg-white/10 text-white border border-white/10 shadow-sm"
                      : "ml-auto bg-gradient-to-r from-[var(--brand-red)] to-rose-600 text-white font-medium"
                  }`}
                >
                  <FormattedText text={m.text} />
                </div>

                {/* AI Weather Card Bubble */}
                {m.weather && (
                  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 p-3 text-xs shadow-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300 flex items-center gap-1">
                        {m.weather.icon} {m.weather.cityName} Weather
                      </span>
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200 font-bold">
                        {m.weather.tempC}°C
                      </span>
                    </div>

                    {m.weather.isSnowing && (
                      <div className="rounded-lg bg-cyan-950/60 border border-cyan-500/30 p-2 text-cyan-200 text-[11px] flex items-center gap-1.5 font-medium">
                        ❄️ Snowfall Alert: {m.weather.snowfallCm}cm recorded
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-white/70">
                      <span>Riding: <strong className="text-white">{m.weather.suitability}</strong></span>
                      <span>AQI: <strong className="text-emerald-400">{m.weather.aqiValue} ({m.weather.aqiStatus})</strong></span>
                    </div>
                  </div>
                )}

                {/* AI Vehicle Recommendation Cards Bubble */}
                {m.vehicles && m.vehicles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">⚡ AI Recommended Fleet</p>
                    <div className="grid gap-2">
                      {m.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs hover:border-[var(--brand-red)]/50 transition"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {v.imageUrl ? (
                              <Image src={v.imageUrl} alt={v.title} width={38} height={38} className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-base flex-shrink-0">
                                {v.type === "car" ? "🏎️" : v.type === "bike" ? "🏍️" : "🛵"}
                              </div>
                            )}
                            <div className="truncate">
                              <p className="font-bold text-white truncate text-xs">{v.title}</p>
                              <p className="text-[10px] text-white/60">{v.city} · {v.transmission} · ₹{v.pricePerDayINR}/day</p>
                            </div>
                          </div>
                          <button
                            onClick={() => void createBooking(v)}
                            disabled={busy}
                            className="flex-shrink-0 rounded-lg bg-[var(--brand-red)] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md hover:bg-red-600 transition disabled:opacity-50"
                          >
                            ⚡ Book
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick AI Prompts & Input */}
          <div className="border-t border-white/15 px-3.5 py-3 space-y-2.5 bg-neutral-900/60 rounded-b-2xl">
            {/* Quick AI Chips */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button onClick={() => void processAiQuery("Manali bike trip snowfall details")} className="rounded-full border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-[10px] text-cyan-200 font-medium hover:bg-cyan-900/60 transition">
                ❄️ Manali Snow
              </button>
              <button onClick={() => void processAiQuery("Automatic cars in Goa under 3000")} className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-[10px] text-amber-200 font-medium hover:bg-amber-900/60 transition">
                🏎️ Goa Cars
              </button>
              <button onClick={() => void processAiQuery("What is Next Gear cancellation policy?")} className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[10px] text-emerald-200 font-medium hover:bg-emerald-900/60 transition">
                📋 Policy & Rules
              </button>
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void processAiQuery(input);
                  }
                }}
                placeholder="Ask AI: e.g. Manali trip bike..."
                className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-red)]"
              />
              <button
                onClick={() => void processAiQuery(input)}
                disabled={busy || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Mobile Button: Matches live design badge/icon but slightly larger */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden relative flex items-center gap-2.5 rounded-full border border-white/20 bg-[var(--brand-red)] text-white shadow-lg h-11 px-4 hover:bg-red-600 transition-colors"
            aria-label="Open Next Go AI"
          >
            <MessageCircle className="h-[18px] w-[18px] fill-white text-white flex-shrink-0" />
            <span className="text-[12.5px] font-bold tracking-wide whitespace-nowrap">Next Go AI</span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white/90 whitespace-nowrap">
              Need help?
            </span>
          </button>

          {/* Desktop Button: Original layout with expand/collapse animation */}
          <button
            onClick={() => setOpen(true)}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`hidden md:flex relative items-center justify-start gap-2.5 rounded-full border border-white/30 bg-[var(--brand-red)] text-white shadow-2xl shadow-black/70 transition-all duration-500 ease-out overflow-hidden hover:bg-red-600 ${
              isExpanded 
                ? "h-12 px-3.5 max-w-[280px]" 
                : "h-12 w-12 p-1 max-w-[48px] justify-center"
            }`}
            aria-label="Open Next Go AI"
          >
            {/* Shimmer Light Streak */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-in-out" />

            {/* Authentic Car AI Robot Avatar Circle */}
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/50 bg-neutral-950 overflow-hidden shadow-lg shadow-black/60">
              <img
                src="/car-ai-robot.png?v=101"
                alt="NextGo Car AI Robot"
                className="h-full w-full object-cover scale-110 rounded-full"
              />
            </div>

            {/* Horizontal Expanding Text Container (Crisp White Typography) */}
            {isExpanded && (
              <div className="flex items-center gap-2.5 whitespace-nowrap overflow-hidden transition-all duration-500 ease-out animate-fadeIn">
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-black tracking-wider text-white drop-shadow-sm">Next Go AI</span>
                  <span className="text-[9px] font-semibold text-white/90">Live Assistant</span>
                </div>

                {/* Live Badge */}
                <span className="rounded-full bg-black/30 border border-white/20 px-2 py-0.5 text-[9px] font-extrabold text-white flex items-center gap-1 shadow-inner">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
