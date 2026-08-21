"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Flame, 
  Sparkles, 
  Bike, 
  Car, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  MapPin, 
  ShieldCheck,
  ArrowRight,
  RotateCw
} from "lucide-react";

type ShowcaseItem = {
  id: string;
  title: string;
  category: "bike" | "car" | "scooty";
  categoryLabel: string;
  cityName: string;
  pricePerDay: number;
  rating: string;
  transmission: string;
  fuelType: string;
  badge: string;
  badgeColor: string;
  imageUrl: string;
};

const FEATURED_INVENTORY: ShowcaseItem[] = [
  {
    id: "inv-1",
    title: "Royal Enfield Hunter 350",
    category: "bike",
    categoryLabel: "Cruiser Bike",
    cityName: "Delhi Hub",
    pricePerDay: 799,
    rating: "4.9 (120+ trips)",
    transmission: "Manual",
    fuelType: "Petrol",
    badge: "Top Trending",
    badgeColor: "bg-red-600/90 text-white border-red-500",
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "inv-2",
    title: "Mahindra Thar 4x4 Hardtop",
    category: "car",
    categoryLabel: "4x4 SUV",
    cityName: "Goa Airport Hub",
    pricePerDay: 2899,
    rating: "4.95 (95+ trips)",
    transmission: "Automatic",
    fuelType: "Diesel",
    badge: "Luxury Favorite",
    badgeColor: "bg-amber-500/90 text-black border-amber-400 font-extrabold",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "inv-3",
    title: "Honda Activa 6G Premium",
    category: "scooty",
    categoryLabel: "Automatic Scooter",
    cityName: "Bengaluru Hub",
    pricePerDay: 399,
    rating: "4.8 (210+ trips)",
    transmission: "Automatic",
    fuelType: "Petrol",
    badge: "Instant Book",
    badgeColor: "bg-emerald-600/90 text-white border-emerald-400 font-bold",
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "inv-4",
    title: "KTM Duke 390 ABS",
    category: "bike",
    categoryLabel: "Sports Bike",
    cityName: "Mumbai Central",
    pricePerDay: 1299,
    rating: "4.9 (84 trips)",
    transmission: "Manual",
    fuelType: "Petrol",
    badge: "Performance",
    badgeColor: "bg-orange-600/90 text-white border-orange-400",
    imageUrl: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "inv-5",
    title: "Hyundai Creta SX Sunroof",
    category: "car",
    categoryLabel: "Premium SUV",
    cityName: "Hyderabad Airport",
    pricePerDay: 2199,
    rating: "4.92 (110 trips)",
    transmission: "Automatic",
    fuelType: "Petrol",
    badge: "Family Special",
    badgeColor: "bg-blue-600/90 text-white border-blue-400",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "inv-6",
    title: "TVS NTORQ 125 Race",
    category: "scooty",
    categoryLabel: "Sport Scooter",
    cityName: "Pune Station Hub",
    pricePerDay: 449,
    rating: "4.85 (140 trips)",
    transmission: "Automatic",
    fuelType: "Petrol",
    badge: "Eco Commute",
    badgeColor: "bg-purple-600/90 text-white border-purple-400",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop",
  },
];

export function HomeInventoryShowcase() {
  const [items, setItems] = useState<ShowcaseItem[]>(FEATURED_INVENTORY);
  const [activeCategory, setActiveCategory] = useState<"all" | "bike" | "car" | "scooty">("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch real-time vehicles uploaded/edited by Admin from /api/vehicles
  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await fetch("/api/vehicles");
        const data = await res.json();
        if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          const apiItems: ShowcaseItem[] = data.vehicles.map((v: any) => {
            const isCar = v.type?.toLowerCase().includes("car") || v.type?.toLowerCase().includes("suv");
            const isScooty = v.type?.toLowerCase().includes("scooter") || v.type?.toLowerCase().includes("scooty") || v.title?.toLowerCase().includes("activa");
            const category: "bike" | "car" | "scooty" = isCar ? "car" : isScooty ? "scooty" : "bike";

            return {
              id: v.id,
              title: v.title,
              category,
              categoryLabel: isCar ? "Luxury SUV" : isScooty ? "Automatic Scooter" : "Cruiser Bike",
              cityName: v.city ?? "India Hub",
              pricePerDay: v.pricePerDayINR ?? v.pricePerDay ?? 799,
              rating: "4.9 (Verified)",
              transmission: v.transmission ?? "Manual",
              fuelType: v.fuel ?? "Petrol",
              badge: v.isTrending ? v.trendingBadge || "Top Pick" : "Verified Fleet",
              badgeColor: v.isTrending ? "bg-red-600/90 text-white border-red-500" : "bg-emerald-600/90 text-white border-emerald-400 font-bold",
              imageUrl: v.imageUrl || v.image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
            };
          });

          // Merge Admin DB vehicles with fallback featured items
          setItems(apiItems);
        }
      } catch (err) {
        console.error("[Home Showcase Vehicle Fetch Failed]", err);
      }
    }
    loadVehicles();
  }, []);

  const filteredItems = items.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  // Auto 3D circular rotation timer
  useEffect(() => {
    if (isPaused || filteredItems.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, filteredItems.length]);

  // Handle Touch Swipe Gestures for 3D Deck Rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          // Swiped left -> Rotate to next card
          setActiveIndex((prev) => (prev + 1) % filteredItems.length);
        } else {
          // Swiped right -> Rotate to previous card
          setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        }
      }
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  const handleNavClick = (direction: "prev" | "next") => {
    if (direction === "next") {
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else {
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  // 3D Deck Style Calculation for circular rotation & perspective flip (Hardware Accelerated)
  const get3DCardStyle = (index: number) => {
    const total = filteredItems.length;
    let diff = index - activeIndex;

    // Normalize circular loop difference
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    if (diff === 0) {
      // Center Active Front Card
      return {
        transform: "translate3d(0, 0, 0) scale(1) rotateY(0deg)",
        zIndex: 30,
        opacity: 1,
        filter: "brightness(1)",
        pointerEvents: "auto" as const,
      };
    } else if (diff === 1) {
      // Right 3D Card
      return {
        transform: "translate3d(38%, 0, -60px) scale(0.88) rotateY(-10deg)",
        zIndex: 20,
        opacity: 0.7,
        filter: "brightness(0.7)",
        pointerEvents: "auto" as const,
      };
    } else if (diff === -1) {
      // Left 3D Card
      return {
        transform: "translate3d(-38%, 0, -60px) scale(0.88) rotateY(10deg)",
        zIndex: 20,
        opacity: 0.7,
        filter: "brightness(0.7)",
        pointerEvents: "auto" as const,
      };
    } else if (diff === 2) {
      return {
        transform: "translate3d(80%, 0, -160px) scale(0.72) rotateY(-18deg)",
        zIndex: 10,
        opacity: 0.3,
        filter: "brightness(0.5)",
        pointerEvents: "none" as const,
      };
    } else if (diff === -2) {
      return {
        transform: "translate3d(-80%, 0, -160px) scale(0.72) rotateY(18deg)",
        zIndex: 10,
        opacity: 0.3,
        filter: "brightness(0.5)",
        pointerEvents: "none" as const,
      };
    } else {
      return {
        transform: "translate3d(0, 0, -280px) scale(0.5)",
        zIndex: 0,
        opacity: 0,
        pointerEvents: "none" as const,
      };
    }
  };

  return (
    <div 
      className="relative w-full space-y-6 overflow-hidden"
    >
      {/* Header & Vector Category Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-white">
            Explore <span className="gradient-text">Bikes & Cars</span>
          </h2>
          <p className="text-xs text-white/60 max-w-xl">
            Pick your ride across 120+ Indian cities with instant confirmation & verified fleets.
          </p>
        </div>

        {/* Vector Icon Category Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {[
            { id: "all", label: "All Fleet", icon: Sparkles },
            { id: "bike", label: "Bikes", icon: Bike },
            { id: "car", label: "Cars", icon: Car },
            { id: "scooty", label: "Scooties", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id as any);
                  setActiveIndex(0);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--brand-red)] to-red-600 border-red-500 text-white shadow-lg shadow-red-500/25 scale-105"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-white/60"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-1 pl-2 border-l border-white/10">
            <button
              onClick={() => handleNavClick("prev")}
              className="p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white transition active:scale-95 cursor-pointer"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavClick("next")}
              className="p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white transition active:scale-95 cursor-pointer"
              aria-label="Next card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Coverflow Circular Rotating Card Stage */}
      <div 
        className="relative w-full h-[395px] sm:h-[415px] flex items-center justify-center perspective-[1000px] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {filteredItems.map((item, idx) => {
          const cardStyle = get3DCardStyle(idx);
          const isCenter = idx === activeIndex;

          return (
            <div
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              style={cardStyle}
              className={`absolute top-0 w-[320px] sm:w-[360px] max-w-[92vw] rounded-3xl border transition-all duration-300 ease-out overflow-hidden shadow-2xl cursor-pointer bg-[#0c0c0c] will-change-transform transform-gpu ${
                isCenter
                  ? "border-white/30 bg-[#0d0d0d]"
                  : "border-white/10 bg-[#0d0d0d]"
              }`}
            >
              {/* Visual Vehicle Image Banner */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop";
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/30 to-transparent" />

                {/* Badge & City Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-lg ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-bold text-white/90 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-red-400" />
                    <span>{item.cityName}</span>
                  </span>
                </div>

                {/* Bottom Image Overlay Specs */}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/90">
                  <span className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded border border-white/15">
                    {item.categoryLabel}
                  </span>
                  <span className="text-amber-300 font-bold bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded border border-white/15 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </span>
                </div>
              </div>

              {/* Vehicle Details & Action Footer */}
              <div className="p-4 sm:p-5 space-y-3 bg-[#0d0d0d]">
                <div>
                  <h3 className="font-black text-base text-white truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/50 mt-1 font-mono">
                    <span>{item.transmission}</span>
                    <span>•</span>
                    <span>{item.fuelType}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>

                {/* Price & Book Action Button */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/40 block">Daily Rate</span>
                    <span className="text-base sm:text-lg font-black font-mono text-white">
                      ₹{item.pricePerDay.toLocaleString("en-IN")}
                      <span className="text-[10px] font-normal text-white/60"> /day</span>
                    </span>
                  </div>

                  <Link
                    href={`/book-vehicle?vehicleId=${encodeURIComponent(item.id)}&city=${encodeURIComponent(item.cityName)}`}
                    className="py-2.5 px-4 bg-[var(--brand-red)] hover:bg-red-600 active:scale-95 text-white font-black text-xs rounded-xl transition shadow-lg shadow-red-500/40 flex items-center gap-1 uppercase tracking-wider"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated Circular Pagination Indicators & Dynamic Progress */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {filteredItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
              activeIndex === idx
                ? "w-8 bg-[var(--brand-red)] shadow-[0_0_15px_rgba(225,6,0,0.95)] scale-105"
                : "w-2.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Rotate to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
