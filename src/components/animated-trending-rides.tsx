"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Flame, Sparkles, Star, ArrowRight, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";

type Ride = {
  id?: string;
  city?: string;
  icon: string;
  image?: string;
  title: string;
  meta: string;
  price: string;
  rating: string;
  booked: string;
  badge: string;
};

interface AnimatedTrendingRidesProps {
  rides: Ride[];
}

export function AnimatedTrendingRides({ rides }: AnimatedTrendingRidesProps) {
  // State for active center card index in circular carousel
  const [centerIndex, setCenterIndex] = useState(1);
  const [isSpread, setIsSpread] = useState(false);
  const [hasTriggeredOnScroll, setHasTriggeredOnScroll] = useState(false);
  const [isAutoSwapping, setIsAutoSwapping] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  const total = rides.length > 0 ? rides.length : 3;

  // Trigger fan-out reveal animation when section scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTriggeredOnScroll) {
          setTimeout(() => {
            setIsSpread(true);
            setHasTriggeredOnScroll(true);
          }, 200);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasTriggeredOnScroll]);

  // Auto 3D Card Swap timer (rotates center card smoothly every 4.5 seconds)
  useEffect(() => {
    if (!isAutoSwapping || !isSpread || total <= 1) return;

    const interval = setInterval(() => {
      setCenterIndex((prev) => (prev + 1) % total);
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoSwapping, isSpread, total]);

  // Swap Left Card to Center
  const swapLeft = () => {
    setCenterIndex((prev) => (prev - 1 + total) % total);
  };

  // Swap Right Card to Center
  const swapRight = () => {
    setCenterIndex((prev) => (prev + 1) % total);
  };

  // Trigger fan-out replay
  const triggerReplay = () => {
    setIsSpread(false);
    setTimeout(() => {
      setIsSpread(true);
    }, 300);
  };

  // Compute indices for Left, Center, and Right positions around centerIndex
  const leftIdx = (centerIndex - 1 + total) % total;
  const rightIdx = (centerIndex + 1) % total;

  // Ordered list of items for 3-slot rendering
  const activeSlots = [
    { item: rides[leftIdx] || rides[0], position: "left", realIndex: leftIdx },
    { item: rides[centerIndex] || rides[1], position: "center", realIndex: centerIndex },
    { item: rides[rightIdx] || rides[2], position: "right", realIndex: rightIdx },
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative space-y-6 py-4 overflow-hidden"
      onMouseEnter={() => setIsAutoSwapping(false)}
      onMouseLeave={() => setIsAutoSwapping(true)}
    >
      {/* Ambient Red Background Glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[650px] rounded-full bg-[var(--brand-red)]/[0.2] blur-3xl pointer-events-none transition-all duration-700"
        style={{
          opacity: isSpread ? 1 : 0.4,
          transform: `translate(-50%, -50%) scale(${isSpread ? 1.15 : 0.8})`,
        }}
        aria-hidden="true" 
      />

      {/* Header Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Flame className="w-4 h-4 text-red-500 animate-bounce" />
            <p className="text-xs uppercase tracking-[0.3em] font-extrabold text-[var(--brand-red)]">Live Demand</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            Trending <span className="gradient-text">Rides This Week</span>
          </h2>
          <p className="mt-1 text-xs md:text-sm text-white/70">Click any card or arrows to swap it into the center position.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Swap Arrows */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 p-1">
            <button
              onClick={swapLeft}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Swap Previous to Center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={swapRight}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Swap Next to Center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Re-play Fan Out Animation Button */}
          <button
            onClick={triggerReplay}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80 font-semibold hover:bg-white/10 hover:border-white/40 transition-all duration-300 active:scale-95 cursor-pointer"
            title="Replay Fan-Out Animation"
          >
            <RotateCw className={`w-3.5 h-3.5 text-red-400 ${!isSpread ? "animate-spin" : ""}`} />
            <span>Fan Out</span>
          </button>

          {/* Live Inventory Status Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--brand-red)]/40 bg-red-950/40 px-3.5 py-1.5 text-xs text-white font-extrabold shadow-md shadow-red-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            Live Inventory
          </div>
        </div>
      </div>

      {/* Interactive 3D Card Swapper Container */}
      <div className="relative z-10 min-h-[460px] sm:min-h-[480px] w-full flex items-center justify-center py-2">
        <div className="relative w-full max-w-5xl h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
          {activeSlots.map((slot) => {
            const ride = slot.item;
            const isCenter = slot.position === "center";
            const isLeft = slot.position === "left";
            const isRight = slot.position === "right";

            // Inline styles for spring animation transition on swap
            let inlineStyle: React.CSSProperties = {};

            if (!isSpread) {
              // Collapsed state: all cards stacked in exact center
              inlineStyle = {
                transform: "translate3d(0, 0, 0) scale(0.88)",
                opacity: isCenter ? 1 : 0.15,
                zIndex: isCenter ? 30 : 10,
                transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              };
            } else {
              if (isLeft) {
                inlineStyle = {
                  transform: "translate3d(-2%, 0, 0) rotate(-2.5deg) scale(0.95)",
                  opacity: 0.9,
                  zIndex: 20,
                  transition: "all 0.7s cubic-bezier(0.34, 1.35, 0.64, 1)",
                };
              } else if (isRight) {
                inlineStyle = {
                  transform: "translate3d(2%, 0, 0) rotate(2.5deg) scale(0.95)",
                  opacity: 0.9,
                  zIndex: 20,
                  transition: "all 0.7s cubic-bezier(0.34, 1.35, 0.64, 1)",
                };
              } else {
                // Center main card
                inlineStyle = {
                  transform: "translate3d(0, -8px, 0) scale(1.05)",
                  opacity: 1,
                  zIndex: 30,
                  transition: "all 0.7s cubic-bezier(0.34, 1.35, 0.64, 1)",
                };
              }
            }

            return (
              <div
                key={ride.title}
                style={inlineStyle}
                onClick={() => {
                  if (isLeft) swapLeft();
                  if (isRight) swapRight();
                }}
                className={`w-full md:w-1/3 p-2 transition-all duration-500 ${
                  !isCenter ? "cursor-pointer group/card" : ""
                }`}
              >
                <div
                  className={`group relative rounded-2xl border bg-[#0d0d0d] shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                    isCenter
                      ? "border-red-500/90 shadow-2xl shadow-red-500/25 ring-2 ring-red-500/60"
                      : "border-white/20 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20"
                  }`}
                >
                  {/* Subtle hover gradient overflow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-red)]/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Click to Swap Badge on Side Cards */}
                  {!isCenter && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none">
                      <span className="rounded-full bg-red-600/90 text-white text-xs font-black px-3.5 py-1.5 shadow-lg border border-red-400/50 backdrop-blur-sm animate-pulse">
                        Click to Swap Center ⚡
                      </span>
                    </div>
                  )}

                  {/* Top Badge */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    {isCenter && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider shadow-md">
                        <Sparkles className="w-3 h-3 fill-black" /> Hottest Pick
                      </span>
                    )}
                    <span
                      className={`inline-block rounded-full text-xs font-extrabold px-3 py-1 shadow-md ${
                        ride.badge === "Eco-Friendly"
                          ? "bg-emerald-600 text-white shadow-emerald-600/40"
                          : "bg-red-600 text-white shadow-red-600/40"
                      }`}
                    >
                      {ride.badge}
                    </span>
                  </div>

                  <div>
                    {/* Vehicle Photo Banner */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-black/40">
                      {ride.image ? (
                        <img
                          src={ride.image}
                          alt={ride.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">{ride.icon}</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30 pointer-events-none" />
                    </div>

                    {/* Content Details */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <p className="text-base font-bold text-white uppercase tracking-wide group-hover:text-red-400 transition-colors">
                          {ride.title}
                        </p>
                        <p className="text-xs text-white/60 mt-1">{ride.meta}</p>
                      </div>

                      {/* Rating & Booking Count */}
                      <div className="flex items-center justify-between py-2 border-t border-b border-white/10 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-white font-bold">{ride.rating}/5</span>
                        </div>
                        <div className="text-white/60 font-medium">{ride.booked}</div>
                      </div>

                      {/* Price and CTA */}
                      <div className="pt-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Per Day</p>
                          <p className="text-sm font-black text-[var(--brand-red)]">{ride.price}</p>
                        </div>
                        <Link
                          href={
                            ride.id 
                              ? `/book-vehicle?vehicleId=${encodeURIComponent(ride.id)}&city=${encodeURIComponent(ride.city || "")}`
                              : `/vehicles?q=${encodeURIComponent(ride.title)}`
                          }
                          onClick={(e) => e.stopPropagation()}
                          className={`rounded-full text-xs font-bold px-4 py-2 flex items-center gap-1 transition-all duration-300 shadow-lg active:scale-95 ${
                            isCenter
                              ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/40 hover:from-red-500 hover:to-red-400 hover:scale-105"
                              : "bg-[var(--brand-red)] text-white shadow-red-500/30 hover:bg-red-600 hover:scale-105"
                          }`}
                        >
                          <span>Book Now</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
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
