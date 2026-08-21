"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, Suspense, useRef, useCallback } from "react";
import { PageShell } from "@/components/page-shell";
import { WaitlistButton } from "@/components/waitlist-button";
import { toCurrency } from "@/lib/pricing";
import { Vehicle } from "@/lib/types";
import { vehicles as fallbackVehicles } from "@/lib/mock-data";
import { VehicleMap, HUBS_BY_CITY } from "@/components/vehicle-map";
import { MapPin, LocateFixed, Car, Fuel, Settings, Building2, Sparkles, Rocket, Bell, ArrowRight, RotateCcw, List, Layers, LayoutGrid, Search, SlidersHorizontal, Plane } from "lucide-react";
import { MAJOR_AIRPORT_HUBS } from "@/lib/india-locations";

function VehicleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-4 shadow-xl shimmer-bg relative overflow-hidden">
      <div className="h-40 w-full bg-white/5 rounded-xl" />
      <div className="space-y-2.5">
        <div className="h-5 bg-white/5 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
      </div>
      <div className="pt-3 border-t border-white/5 flex gap-2">
        <div className="h-8 bg-white/5 rounded-full w-24 animate-pulse" />
        <div className="h-8 bg-white/5 rounded-full w-24 animate-pulse" />
      </div>
    </div>
  );
}

function getVehicleTypeTheme(type: string) {
  const t = type.toLowerCase();
  const isCar = t.includes("car");
  const isBike = t.includes("bike");
  const isScoot = t.includes("scoot");

  let icon = "🚗";
  let label = "CAR";
  if (isBike) {
    icon = "🏍️";
    label = "BIKE";
  } else if (isScoot) {
    icon = "🛵";
    label = "SCOOTY";
  } else if (!isCar) {
    icon = "⚡";
    label = type.toUpperCase() || "VEHICLE";
  }

  // Unified premium red & black theme styles for all vehicle cards matching home page
  return {
    border: "border-red-950/60 hover:border-red-500/40",
    glowBg: "from-red-500/60 to-transparent",
    glowShadow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    badgeClass: "bg-red-950/40 text-red-400 border-red-800/30",
    priceText: "price-custom-green",
    btnBg: "bg-red-600 hover:bg-red-500 shadow-red-600/20 hover:shadow-red-600/40",
    icon,
    label,
    accentText: "text-red-400/80"
  };
}

// Subcomponent representing a vehicle listing card to support multi-photo slideshow animation
interface VehicleCatalogCardProps {
  vehicle: Vehicle;
  theme: ReturnType<typeof getVehicleTypeTheme>;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void;
  setHoveredVehicleId: (id: string | null) => void;
  availableCount?: number;
}

function VehicleCatalogCard({
  vehicle,
  theme,
  handleMouseMove,
  handleMouseLeave,
  setHoveredVehicleId,
  availableCount,
}: VehicleCatalogCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Parse all valid image URLs provided by Vendor or Admin
  const images = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(vehicle.imageUrls)) {
      vehicle.imageUrls.forEach((url: string) => {
        if (url && typeof url === "string" && url.trim()) list.push(url.trim());
      });
    }
    if ((vehicle as any).imageUrl && typeof (vehicle as any).imageUrl === "string" && (vehicle as any).imageUrl.trim()) {
      const single = (vehicle as any).imageUrl.trim();
      if (!list.includes(single)) list.push(single);
    }
    return list;
  }, [vehicle.imageUrls, (vehicle as any).imageUrl]);

  const defaultImage = vehicle.type.toLowerCase().includes("bike") || vehicle.type.toLowerCase().includes("scoot")
    ? "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80"
    : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80";

  // Continuous auto-slideshow animation for 3-4 images
  useEffect(() => {
    if (images.length <= 1) return;

    // Auto-cycle every 2.8s, speed up to 1.5s on hover
    const speed = isHovered ? 1500 : 2800;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, speed);

    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={(e) => {
        handleMouseLeave(e);
        setIsHovered(false);
      }}
      onMouseEnter={() => {
        setHoveredVehicleId(vehicle.id);
        setIsHovered(true);
      }}
      className={`group tilt-card rounded-2xl border ${theme.border} bg-gradient-to-br from-black via-black to-red-950/10 p-4 shadow-xl ${theme.glowShadow} transition-all duration-300 relative overflow-hidden flex flex-col justify-between`}
    >
      {/* Dynamic ambient glow gradient */}
      <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br ${theme.glowBg} blur-xl opacity-100 group-hover:opacity-100 transition-all duration-500 pointer-events-none`} />
      
      {/* Hover red sweep overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-red)]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="mb-3.5 overflow-hidden rounded-xl border border-white/10 aspect-video relative group-hover:border-white/20 transition-colors h-40 w-full bg-black">
          {images.length === 0 ? (
            <img
              src={defaultImage}
              alt={vehicle.title}
              className="absolute inset-0 h-full w-full object-cover opacity-100"
              loading="lazy"
            />
          ) : (
            images.map((src, idx) => (
              <img
                key={src}
                src={src}
                alt={vehicle.title}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out ${
                  idx === currentImageIndex ? "opacity-100 scale-105" : "opacity-0 scale-100 pointer-events-none"
                }`}
                loading="lazy"
              />
            ))
          )}

          {/* Photo Counter Badge for Multiple Images */}
          {images.length > 1 && (
            <div className="absolute top-2 left-2 z-20 bg-black/75 backdrop-blur-md border border-white/15 px-2.5 py-0.5 rounded-full text-[9px] font-black text-white/90 flex items-center gap-1.5 shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              <span>{currentImageIndex + 1}/{images.length} Photos</span>
            </div>
          )}

          {/* Interactive Dots overlay */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentImageIndex ? "bg-red-500 scale-125 shadow-[0_0_6px_#ef4444]" : "bg-white/40 hover:bg-white/80"
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Floating Rating Badge */}
          {vehicle.rating ? (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold text-amber-400 border border-white/10 shadow-lg">
              <span>⭐</span>
              <span>{vehicle.rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
        
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold gradient-text line-clamp-1">
              {vehicle.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider border uppercase ${theme.badgeClass}`}>
                <span>{theme.icon}</span>
                <span>{theme.label}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/50 border border-blue-800/30 px-2.5 py-0.5 text-[9px] font-semibold text-blue-300">
                📍 {vehicle.city.split(",")[0].trim()}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] font-semibold text-white/70">
                👤 {vehicle.seats} Seats
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 space-y-2">
          {/* Specs breakdown */}
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span className="flex items-center gap-1">⛽ {vehicle.fuel}</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1">⚙️ {vehicle.transmission}</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1">
              {vehicle.airportPickup ? "✈️ Airport" : "🏙️ Hub"}
            </span>
          </div>

          {/* Availability status line */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(vehicle.availabilityStatus ?? "available").toUpperCase() === "AVAILABLE" ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-950/50 px-2.5 py-0.5 text-[9px] font-extrabold text-green-400 border border-green-800/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    AVAILABLE
                  </span>
                  {availableCount !== undefined && availableCount === 1 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/50 px-2.5 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/20 animate-pulse">
                      🔥 Only 1 left!
                    </span>
                  ) : availableCount !== undefined && availableCount > 1 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-950/50 px-2.5 py-0.5 text-[9px] font-extrabold text-sky-400 border border-sky-500/20">
                      ⚡ {availableCount} Available
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/50 px-2.5 py-0.5 text-[9px] font-extrabold text-rose-400 border border-rose-800/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  BOOKED
                </span>
              )}
              {vehicle.availabilityMessage && !availableCount && (
                <span className="text-[10px] text-white/50 font-medium">{vehicle.availabilityMessage}</span>
              )}
            </div>
            
            {vehicle.vehicleNumber ? (
              <span className="text-[9px] text-white/30 font-mono tracking-wider">
                {vehicle.vehicleNumber}
              </span>
            ) : null}
          </div>
        </div>

        {/* Date badges if present */}
        {vehicle.availableDates && vehicle.availableDates.length > 0 && (
          <div className="mt-3.5 flex items-center gap-1.5 overflow-hidden">
            <span className="text-[9px] text-white/30 font-bold whitespace-nowrap">Dates:</span>
            <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
              {vehicle.availableDates.slice(0, 3).map((date) => (
                <span key={date} className="shrink-0 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[9px] text-white/50 font-mono">
                  {date}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {/* Daily Rate block */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Daily Rate</span>
          <div className="text-right">
            <span className={`text-lg font-black tracking-tight ${theme.priceText}`}>
              {toCurrency(vehicle.pricePerDayINR, "INR")}
            </span>
            <span className="text-xs text-white/45 font-medium font-normal"> / day</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3.5 flex gap-2">
          <Link
            href={`/vehicles/${vehicle.id}`}
            prefetch={true}
            className="flex-1 text-center rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 py-2 text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          >
            Details
          </Link>
          {(vehicle.availabilityStatus ?? "available") === "available" ? (
            <Link
              href={`/book-vehicle?vehicleId=${encodeURIComponent(vehicle.id)}&city=${encodeURIComponent(vehicle.city)}`}
              className={`flex-1 text-center rounded-xl ${theme.btnBg} py-2 text-xs font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0`}
            >
              Book Now
            </Link>
          ) : (
            <div className="flex-1">
              <WaitlistButton
                vehicleId={vehicle.id}
                city={vehicle.city}
                className="w-full text-center rounded-xl border border-white/10 hover:border-white/20 bg-white/5 py-2 text-xs font-bold text-white/90 hover:text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Global client-side memory cache for instant 0ms vehicle catalog rendering
let cachedVehiclesData: { vehicles: Vehicle[]; cities: string[]; timestamp: number } | null = null;
const CITY_COORDINATES: Record<string, { lat: number; lng: number; displayName: string }> = {
  "delhi": { lat: 28.6139, lng: 77.2090, displayName: "Delhi NCR" },
  "delhi-ncr": { lat: 28.6139, lng: 77.2090, displayName: "Delhi NCR" },
  "noida": { lat: 28.5355, lng: 77.3910, displayName: "Noida" },
  "mumbai": { lat: 19.0760, lng: 72.8777, displayName: "Mumbai" },
  "bengaluru": { lat: 12.9716, lng: 77.5946, displayName: "Bengaluru" },
  "bangalore": { lat: 12.9716, lng: 77.5946, displayName: "Bengaluru" },
  "goa": { lat: 15.2993, lng: 74.1240, displayName: "Goa" },
  "hyderabad": { lat: 17.3850, lng: 78.4867, displayName: "Hyderabad" },
  "jaipur": { lat: 26.9124, lng: 75.7873, displayName: "Jaipur" },
  "kochi": { lat: 9.9312, lng: 76.2673, displayName: "Kochi" },
  "chandigarh": { lat: 30.7333, lng: 76.7794, displayName: "Chandigarh" },
  "phagwara": { lat: 31.2240, lng: 75.7708, displayName: "Phagwara, Punjab" },
  "chennai": { lat: 13.0827, lng: 80.2707, displayName: "Chennai" },
  "kolkata": { lat: 22.5726, lng: 88.3639, displayName: "Kolkata" },
  "pune": { lat: 18.5204, lng: 73.8567, displayName: "Pune" },
  "ahmedabad": { lat: 23.0225, lng: 72.5714, displayName: "Ahmedabad" },
  "patna": { lat: 25.5941, lng: 85.1376, displayName: "Patna, Bihar" },
  "gaya": { lat: 24.7955, lng: 85.0002, displayName: "Gaya, Bihar" },
  "muzaffarpur": { lat: 26.1209, lng: 85.3647, displayName: "Muzaffarpur, Bihar" },
  "bhagalpur": { lat: 25.2425, lng: 86.9842, displayName: "Bhagalpur, Bihar" },
};

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function VehiclesCatalogContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [fuel, setFuel] = useState("");
  const [transmission, setTransmission] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => cachedVehiclesData?.vehicles ?? fallbackVehicles);
  const [cityOptions, setCityOptions] = useState<string[]>(() => cachedVehiclesData?.cities ?? []);
  const [status, setStatus] = useState<React.ReactNode>("");
  const [locationStatus, setLocationStatus] = useState<React.ReactNode | null>(null);
  const [detectedState, setDetectedState] = useState("");
  const [detectedLocationLabel, setDetectedLocationLabel] = useState("");
  const [outOfRangeInfo, setOutOfRangeInfo] = useState<{ areaName: string; distanceKm: number; nearestHub: string } | null>(null);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [isSubmittedWaitlist, setIsSubmittedWaitlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"list" | "map">("list");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [mobileLayoutMode, setMobileLayoutMode] = useState<"coverflow" | "grid">("coverflow");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isScrollingRef = useRef(false);
  const activeCardIndexRef = useRef(activeCardIndex);
  activeCardIndexRef.current = activeCardIndex;

  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    requestAnimationFrame(() => {
      isScrollingRef.current = false;
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      
      const children = container.children;
      let closestIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (!child.classList.contains("snap-center")) continue;
        
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const containerCenter = scrollLeft + width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      
      if (closestIndex !== activeCardIndexRef.current) {
        setActiveCardIndex(closestIndex);
      }
    });
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (city) count++;
    if (type) count++;
    if (fuel) count++;
    if (transmission) count++;
    return count;
  }, [city, type, fuel, transmission]);

  const hasActiveFilters = activeFiltersCount > 0;

  const hasFilters = useMemo(
    () => Boolean(query || city || type || fuel || transmission || selectedHub),
    [query, city, type, fuel, transmission, selectedHub],
  );

  // Clear hub when city filter changes
  useEffect(() => {
    setSelectedHub(null);
  }, [city]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;

    if (selectedHub) {
      const normalizedCity = city.toLowerCase();
      const cityKey = normalizedCity.includes("delhi")
        ? "delhi"
        : normalizedCity.includes("mumbai")
        ? "mumbai"
        : normalizedCity.includes("bengaluru") || normalizedCity.includes("bangalore")
        ? "bengaluru"
        : normalizedCity.includes("goa")
        ? "goa"
        : "";
      if (cityKey) {
        const cityHubs = HUBS_BY_CITY[cityKey] || [];
        if (cityHubs.length > 0) {
          const targetHub = cityHubs.find((h) => h.name === selectedHub);
          if (targetHub) {
            result = vehicles.filter((vehicle, index) => {
              if (vehicle.airportPickup) {
                const airportHub = cityHubs.find((h) => h.airport);
                return airportHub?.id === targetHub.id;
              }
              const nonAirportHubs = cityHubs.filter((h) => !h.airport);
              if (nonAirportHubs.length > 0) {
                const hubIndex = index % nonAirportHubs.length;
                return nonAirportHubs[hubIndex].id === targetHub.id;
              }
              return cityHubs[index % cityHubs.length].id === targetHub.id;
            });
          }
        }
      }
    }

    // Sort available vehicles first
    return [...result].sort((a, b) => {
      const statusA = (a.availabilityStatus ?? "available").toLowerCase();
      const statusB = (b.availabilityStatus ?? "available").toLowerCase();
      const isAvailA = statusA === "available";
      const isAvailB = statusB === "available";
      if (isAvailA && !isAvailB) return -1;
      if (!isAvailA && isAvailB) return 1;
      return 0;
    });
  }, [vehicles, selectedHub, city]);

  // Auto-center Coverflow carousel to middle vehicle card on initial load & filter changes
  useEffect(() => {
    if (filteredVehicles.length > 0) {
      const midIndex = Math.floor(filteredVehicles.length / 2);
      setActiveCardIndex(midIndex);
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          const container = scrollRef.current;
          const cardWidth = container.scrollWidth / filteredVehicles.length;
          container.scrollTo({
            left: midIndex * cardWidth,
            behavior: "instant" as ScrollBehavior,
          });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [filteredVehicles.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rx = ((yc - y) / yc) * 6; // max 6 deg
    const ry = ((x - xc) / xc) * 6;
    card.style.setProperty("--rx", `${rx}deg`);
    card.style.setProperty("--ry", `${ry}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    setHoveredVehicleId(null);
  };

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setStatus("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await geoResponse.json();
          
          const locality = geoData.address?.suburb || geoData.address?.neighbourhood || geoData.address?.road || geoData.address?.quarter || "";
          const district = geoData.address?.city_district || geoData.address?.subdistrict || geoData.address?.county || "";
          const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || "";
          const stateName = geoData.address?.state || "";

          const rawParts = [locality, district, cityName, stateName].map((p) => p.trim()).filter(Boolean);
          const addressParts: string[] = [];
          rawParts.forEach((part) => {
            if (!addressParts.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
              addressParts.push(part);
            }
          });

          const fullDetailedLocation = addressParts.length > 0 ? addressParts.join(", ") : (cityName || stateName || "Your Location");

          setDetectedState(stateName);
          setDetectedLocationLabel(fullDetailedLocation);

          // Inject fullDetailedLocation into cityOptions so the dropdown shows the exact full detailed string
          setCityOptions((prevOptions) => {
            if (!prevOptions.some((opt) => opt.toLowerCase() === fullDetailedLocation.toLowerCase())) {
              return [fullDetailedLocation, ...prevOptions];
            }
            return prevOptions;
          });

          // 150 KM Distance Radius Calculation using Haversine formula
          let nearestHubName = "";
          let minDistanceKm = Infinity;
          let matchedCityName = "";

          for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
            const dist = calculateHaversineDistance(latitude, longitude, coords.lat, coords.lng);
            if (dist < minDistanceKm) {
              minDistanceKm = dist;
              nearestHubName = coords.displayName;
              matchedCityName = coords.displayName;
            }
          }

          const isWithin150Km = minDistanceKm <= 150;

          if (isWithin150Km && matchedCityName) {
            setCity(fullDetailedLocation);
            await fetchVehiclesWith({ city: fullDetailedLocation });
            setOutOfRangeInfo(null);

            const displayMatched = matchedCityName.split(",")[0].trim();
            setLocationStatus(
              <span className="inline-flex items-center gap-1.5 font-sans font-bold text-xs tracking-wide text-emerald-400">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>{fullDetailedLocation}</span>
                <span className="text-white/60 font-medium">({minDistanceKm} km from {displayMatched} Hub - Serviced ✅)</span>
              </span>
            );
          } else {
            setCity(fullDetailedLocation);
            await fetchVehiclesWith({ city: fullDetailedLocation });
            setOutOfRangeInfo({
              areaName: fullDetailedLocation,
              nearestHub: matchedCityName || "Delhi NCR",
              distanceKm: Math.round(minDistanceKm),
            });
            setLocationStatus(
              <span className="inline-flex items-center gap-1.5 font-sans font-bold text-xs tracking-wide text-amber-400">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>{fullDetailedLocation}</span>
                <span className="text-white/60 font-medium">(Nearest Hub: {matchedCityName || "Delhi NCR"} ~{Math.round(minDistanceKm)} km)</span>
              </span>
            );
          }
        } catch (error) {
          console.warn("Reverse geocoding error:", error);
          setStatus("Could not determine city. Try selecting manually.");
          await fetchVehiclesWith();
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setStatus("Location access denied. Please select city manually.");
        setIsDetectingLocation(false);
        void fetchVehiclesWith();
      }
    );
  }, [cityOptions]);

  const handleWaitlistSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistName || !waitlistPhone) return;

    setIsSubmittingWaitlist(true);
    try {
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `City Launch Request: ${outOfRangeInfo?.areaName || "New City"}`,
          message: `Rider ${waitlistName} (${waitlistPhone}) requested fleet launch in ${outOfRangeInfo?.areaName} (${outOfRangeInfo?.distanceKm} km from nearest hub).`,
          category: "CITY_LAUNCH_REQUEST",
        }),
      }).catch(() => null);

      setIsSubmittedWaitlist(true);
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    const cityParam = searchParams.get("city") ?? "";
    if (cityParam) {
      setCity(cityParam);
      void fetchVehiclesWith({ city: cityParam });
      return;
    }

    void fetchVehiclesWith();
  }, [searchParams]);

  // Debounce filter changes to reduce API calls (skip on initial mount to avoid double fetch)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      void fetchVehiclesWith();
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, city, type, fuel, transmission]);

  async function fetchVehiclesWith(overrides?: {
    query?: string;
    city?: string;
    type?: string;
    fuel?: string;
    transmission?: string;
  }) {
    if (vehicles.length === 0) {
      setIsLoading(true);
    }
    setStatus("Loading vehicles...");

    const values = {
      query,
      city,
      type,
      fuel,
      transmission,
      ...overrides,
    };

    const params = new URLSearchParams();
    if (values.query) params.set("q", values.query);
    if (values.city) params.set("city", values.city);
    if (values.type) params.set("type", values.type);
    if (values.fuel) params.set("fuel", values.fuel);
    if (values.transmission) params.set("transmission", values.transmission);

    try {
      const response = await fetch(`/api/vehicles?${params.toString()}`);
      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const text = await response.text();
      if (!text || !text.trim()) {
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(text);
      const loadedVehicles = data.vehicles ?? [];
      const loadedCities = data.cities ?? [];

      // Save to global client memory cache for instant future loads
      cachedVehiclesData = {
        vehicles: loadedVehicles,
        cities: loadedCities,
        timestamp: Date.now(),
      };

      const currentCity = overrides?.city ?? city;
      const mergedCities = [...loadedCities];
      if (currentCity && !mergedCities.some((c) => c.toLowerCase() === currentCity.toLowerCase())) {
        mergedCities.unshift(currentCity);
      }

      setVehicles(loadedVehicles);
      setCityOptions(mergedCities);
      setStatus(`Found ${loadedVehicles.length} vehicles.`);
    } catch (err) {
      console.warn("Vehicles fetch warning:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchVehicles(event?: FormEvent) {
    event?.preventDefault();
    await fetchVehiclesWith();
  }

  function resetFilters() {
    setQuery("");
    setCity("");
    setType("");
    setFuel("");
    setTransmission("");
    setSelectedHub(null);
    setLocationStatus(null);
    setDetectedState("");
    setDetectedLocationLabel("");
    setOutOfRangeInfo(null);
    void fetchVehiclesWith({
      query: "",
      city: "",
      type: "",
      fuel: "",
      transmission: "",
    });
  }

  return (
    <PageShell
      title={
        <span className="inline-block font-display uppercase tracking-wider gradient-text animate-[fade-up_0.8s_ease_forwards]">
          Vehicle Catalog
        </span>
      }
      subtitle={
        <span className="inline-block mt-1 opacity-0 animate-[fade-up_0.8s_ease_0.3s_forwards] text-white/70">
          Browse all available bikes, cars, and scooties. Book when you are ready.
        </span>
      }
      variant="dark"
      plainHeader={true}
    >
      <section className="rounded-3xl border border-white/15 bg-gradient-to-br from-[var(--brand-red)]/20 via-white/5 to-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-red-500/20 text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[var(--brand-red)]/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="flex flex-wrap items-start justify-between gap-3 relative z-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Search & filter</p>
            <h2 className="text-xl font-semibold text-white">
              Find your <span className="gradient-text">ride</span>
            </h2>
            <p className="mt-2 text-sm text-white/70">Use filters to narrow results by city, type, fuel, and price.</p>
          </div>
          {/* Location details shown on desktop header */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-sm cursor-pointer ${
                detectedLocationLabel && city === detectedLocationLabel
                  ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-white/20 text-white hover:bg-white/10 hover:border-white/40"
              }`}
            >
              <MapPin className={`h-3.5 w-3.5 ${detectedLocationLabel && city === detectedLocationLabel ? "text-emerald-400" : "text-red-500"} animate-pulse`} />
              <span className="max-w-[180px] truncate sm:max-w-xs">
                {isDetectingLocation 
                  ? "Detecting location..." 
                  : (detectedLocationLabel && city === detectedLocationLabel ? detectedLocationLabel : "Current location")
                }
              </span>
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile Quick Search Bar (Only visible on Mobile viewports) */}
        <div className="flex md:hidden gap-2.5 w-full mt-4 relative z-10">
          <div className="flex-1 relative">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vehicle name..."
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-md pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/40 transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.1] focus:outline-none focus:ring-1 focus:ring-red-500/30"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-3.5 w-3.5" />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
              isMobileFiltersOpen || hasActiveFilters
                ? "bg-gradient-to-r from-red-600 to-red-500 border-red-500 text-white shadow-lg shadow-red-600/30"
                : "bg-white/[0.06] border-white/15 text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-md"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-white text-[var(--brand-red)] text-[9px] font-black leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Quick Actions (Location & Reset) - Always visible on mobile */}
        <div className="flex md:hidden gap-2.5 w-full mt-2.5 relative z-10">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetectingLocation}
            className={`flex-1 rounded-2xl border py-2.5 px-3.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 min-w-0 ${
              detectedLocationLabel && city === detectedLocationLabel
                ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] backdrop-blur-md"
                : "border-white/15 bg-white/[0.06] text-white hover:bg-white/10 backdrop-blur-md"
            }`}
          >
            <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${detectedLocationLabel && city === detectedLocationLabel ? "text-emerald-400" : "text-red-500"} animate-pulse`} />
            <span className="truncate">
              {isDetectingLocation 
                ? "Detecting location..." 
                : (detectedLocationLabel && city === detectedLocationLabel ? detectedLocationLabel : "Current Location")
              }
            </span>
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white/85 hover:text-white hover:bg-white/10 backdrop-blur-md transition active:scale-95 cursor-pointer flex-shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Airport & Major Pickup Hub Quick Chips */}
        <div className="mt-3 relative z-10 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1 shrink-0 bg-red-950/50 border border-red-500/30 px-2.5 py-1.5 rounded-xl shadow-md">
            <Plane className="w-3 h-3 text-red-400 animate-pulse" /> Airport Hubs:
          </span>
          {MAJOR_AIRPORT_HUBS.map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => {
                setCity(hub.cityName);
                setLocationStatus(null);
                setDetectedLocationLabel("");
                setOutOfRangeInfo(null);
              }}
              className={`shrink-0 rounded-full border px-3.5 py-1 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                city.toLowerCase().includes(hub.cityName.split(",")[0].toLowerCase())
                  ? "border-red-500 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 scale-105"
                  : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{hub.name.split("(")[0].trim()}</span>
              <span className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-red-300 font-bold">{hub.code}</span>
            </button>
          ))}
        </div>

        <form onSubmit={fetchVehicles} className="mt-3 relative z-10">
          <div className={`grid gap-3 transition-all duration-300 ${
            isMobileFiltersOpen 
              ? "grid-cols-1 opacity-100 max-h-[500px] mt-3" 
              : "hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          }`}>
            {/* Search Input - Desktop only (redundant on mobile) */}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by vehicle name"
              className="hidden md:block rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white placeholder-white/30 transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />

            <select 
              value={city} 
              onChange={(event) => {
                const selectedVal = event.target.value;
                setCity(selectedVal);
                setLocationStatus(null);
                if (!selectedVal || selectedVal !== detectedLocationLabel) {
                  setDetectedLocationLabel("");
                  setOutOfRangeInfo(null);
                }
              }} 
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 md:py-2 text-xs md:text-sm text-white transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500/20 [&_option]:bg-[#121212] [&_option]:text-white cursor-pointer"
            >
              <option value="">All Cities</option>
              {city && !cityOptions.some((opt) => opt.toLowerCase() === city.toLowerCase()) && (
                <option value={city}>{city}</option>
              )}
              {cityOptions.map((cityName) => (
                <option key={cityName} value={cityName}>{cityName}</option>
              ))}
            </select>

            <select 
              value={type} 
              onChange={(event) => setType(event.target.value)} 
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 md:py-2 text-xs md:text-sm text-white transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500/20 [&_option]:bg-[#121212] [&_option]:text-white cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="bike">Bike</option>
              <option value="car">Car</option>
              <option value="scooty">Scooty</option>
            </select>

            <select 
              value={fuel} 
              onChange={(event) => setFuel(event.target.value)} 
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 md:py-2 text-xs md:text-sm text-white transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500/20 [&_option]:bg-[#121212] [&_option]:text-white cursor-pointer"
            >
              <option value="">All Fuels</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
            </select>

            <select 
              value={transmission} 
              onChange={(event) => setTransmission(event.target.value)} 
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 md:py-2 text-xs md:text-sm text-white transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500/20 [&_option]:bg-[#121212] [&_option]:text-white cursor-pointer"
            >
              <option value="">All Transmissions</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-[var(--brand-red)] px-4 py-2.5 md:py-2 font-bold text-xs md:text-sm text-white shadow-lg shadow-red-600/30 transition hover:-translate-y-0.5 hover:bg-red-600 active:scale-95 cursor-pointer"
            >
              {isLoading ? "Searching..." : "Search vehicles"}
            </button>
          </div>
        </form>
      </section>

      {/* 150 KM Radius Coming Soon Banner & Request Form */}
      {outOfRangeInfo && (
        <div className="mt-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/70 via-neutral-900 to-black p-5 sm:p-6 shadow-2xl space-y-4 text-white relative overflow-hidden animate-[fade-up_0.5s_ease_forwards]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                🚀 Service Launch Request
              </span>
              <h3 className="text-lg sm:text-xl font-black mt-2 text-white">
                We are coming soon to <span className="text-amber-400">{outOfRangeInfo.areaName}</span>!
              </h3>
              <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl">
                Your detected location is <strong>{outOfRangeInfo.distanceKm} km</strong> away from our nearest active hub ({outOfRangeInfo.nearestHub}). 
                Our current active fleet delivery radius is <strong>150 km</strong>. Request Next Gear in your area below to be first in line when we launch!
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setOutOfRangeInfo(null)}
              className="text-white/40 hover:text-white text-base p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {isSubmittedWaitlist ? (
            <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-4 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
              <span className="text-lg">✅</span>
              <span>Thank you, {waitlistName || "Rider"}! Request received for <strong>{outOfRangeInfo.areaName}</strong>. We'll notify you via WhatsApp/SMS when Next Gear launches in your area!</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <input
                required
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
                placeholder="Your Full Name"
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
              />
              <input
                required
                value={waitlistPhone}
                onChange={(e) => setWaitlistPhone(e.target.value)}
                placeholder="Phone Number / WhatsApp"
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingWaitlist}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-black shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWaitlist ? "Submitting..." : `Request Launch in ${outOfRangeInfo.areaName.slice(0, 15)}`}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Mobile view Tab Bar */}
      <div className="flex lg:hidden rounded-2xl border border-white/10 bg-white/[0.03] p-1 mt-6">
        <button
          type="button"
          onClick={() => setActiveMobileTab("list")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileTab === "list" ? "bg-[var(--brand-red)] text-white shadow-lg shadow-red-600/30" : "text-white/60 hover:text-white"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          <span>Vehicle List ({filteredVehicles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab("map")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileTab === "map" ? "bg-[var(--brand-red)] text-white shadow-lg shadow-red-600/30" : "text-white/60 hover:text-white"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Pickup Hubs Map</span>
        </button>
      </div>

      {/* Grid container: Split map & list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
        
        {/* Left catalog panel */}
        <div className={`lg:col-span-7 space-y-6 ${activeMobileTab === "list" ? "block" : "hidden lg:block"}`}>
          <section className="space-y-4 rounded-3xl border-0 sm:border border-white/10 bg-transparent sm:bg-white/[0.03] backdrop-blur-none sm:backdrop-blur-xl p-0 sm:p-6 shadow-none sm:shadow-2xl text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-0">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <h2 className="text-lg font-bold text-white tracking-wide">Results</h2>

                {/* Mobile Layout Switcher - Top Right on Mobile */}
                <div className="flex sm:hidden items-center flex-shrink-0 bg-white/[0.06] border border-white/15 p-1 rounded-2xl backdrop-blur-md shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMobileLayoutMode("coverflow")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      mobileLayoutMode === "coverflow"
                        ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/30"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">3D View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileLayoutMode("grid")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      mobileLayoutMode === "grid"
                        ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/30"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">Grid</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-white/70 font-mono font-medium">{status}</span>
                  {detectedLocationLabel && city && city === detectedLocationLabel && (
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="truncate max-w-[200px] sm:max-w-none">{detectedLocationLabel}</span>
                    </span>
                  )}
                </div>

                {selectedHub && (
                  <p className="text-xs text-white/50 mt-1">
                    Filtered by Pick-up Hub: <span className="font-semibold text-[var(--brand-red-soft)]">{selectedHub}</span>
                  </p>
                )}
              </div>

              {locationStatus && city && city === detectedLocationLabel && (
                <div className="hidden sm:block text-xs font-bold text-emerald-400">
                  {locationStatus}
                </div>
              )}
            </div>

            {/* Show selected filters as tags */}
            {(city || type || fuel || transmission || query || selectedHub) && (
              <div className="flex flex-wrap gap-2 px-4 sm:px-0">
                {city && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/50 px-3 py-1.5 text-xs font-semibold text-blue-300 border border-blue-800/30 shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{city}</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setCity("");
                        setDetectedLocationLabel("");
                        setLocationStatus(null);
                        setOutOfRangeInfo(null);
                      }} 
                      className="ml-1 hover:text-white cursor-pointer transition-colors"
                      title="Clear City Filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedHub && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/50 px-3 py-1.5 text-xs font-semibold text-[var(--brand-red-soft)] border border-red-800/30 shadow-sm">
                    <Building2 className="h-3.5 w-3.5 text-red-400" />
                    <span>Hub: {selectedHub}</span>
                    <button type="button" onClick={() => setSelectedHub(null)} className="ml-1 hover:text-white cursor-pointer transition-colors">✕</button>
                  </span>
                )}
                {type && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-950/50 px-3 py-1.5 text-xs font-semibold text-purple-300 border border-purple-800/30 shadow-sm">
                    <Car className="h-3.5 w-3.5 text-purple-400" />
                    <span className="capitalize">{type}</span>
                    <button type="button" onClick={() => setType("")} className="ml-1 hover:text-white cursor-pointer transition-colors">✕</button>
                  </span>
                )}
                {fuel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-800/30 shadow-sm">
                    <Fuel className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="capitalize">{fuel}</span>
                    <button type="button" onClick={() => setFuel("")} className="ml-1 hover:text-white cursor-pointer transition-colors">✕</button>
                  </span>
                )}
                {transmission && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-950/50 px-3 py-1.5 text-xs font-semibold text-orange-300 border border-orange-800/30 shadow-sm">
                    <Settings className="h-3.5 w-3.5 text-orange-400" />
                    <span className="capitalize">{transmission}</span>
                    <button type="button" onClick={() => setTransmission("")} className="ml-1 hover:text-white cursor-pointer transition-colors">✕</button>
                  </span>
                )}

                {query && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 border border-white/10">
                    🔍 {query}
                    <button type="button" onClick={() => setQuery("")} className="ml-1 hover:text-white cursor-pointer">✕</button>
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <VehicleCardSkeleton />
                <VehicleCardSkeleton />
                <VehicleCardSkeleton />
                <VehicleCardSkeleton />
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-b from-[#18080a] via-[#0d070b] to-[#0a0a0a] p-6 sm:p-8 text-white shadow-2xl shadow-red-950/40">
                {/* Ambient Glows */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

                <div className="relative z-10 space-y-6">
                  {city ? (
                    <>
                      {/* Launch Badge */}
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 backdrop-blur-md">
                        <Rocket className="h-4 w-4 text-amber-400 animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                          Launching Soon in {city.split(",")[0].trim()}
                        </span>
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      </div>

                      <div>
                        <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white">
                          Next Gear is Coming to <span className="gradient-text-red-white">{city.split(",")[0].trim()}</span>!
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
                          We are actively deploying our 5-star verified fleet (bikes, luxury cars, and scooties) to <strong>{city}</strong>. High rider demand detected! Want early VIP access or request fleet priority?
                        </p>
                      </div>

                      {/* VIP Request Form */}
                      {isSubmittedWaitlist ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                          <span>VIP Launch Spot Secured! We will contact you on WhatsApp when Next Gear launches in {city.split(",")[0].trim()}.</span>
                        </div>
                      ) : (
                        <form onSubmit={handleWaitlistSubmit} className="space-y-3 pt-1">
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              required
                              value={waitlistName}
                              onChange={(e) => setWaitlistName(e.target.value)}
                              placeholder="Your Full Name"
                              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                            />
                            <input
                              required
                              value={waitlistPhone}
                              onChange={(e) => setWaitlistPhone(e.target.value)}
                              placeholder="WhatsApp / Mobile Number"
                              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                            />
                            <button
                              type="submit"
                              disabled={isSubmittingWaitlist}
                              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              <Bell className="h-3.5 w-3.5" />
                              <span>{isSubmittingWaitlist ? "Submitting..." : "Get VIP Access"}</span>
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Fallback Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>View All Available Cities & Rides</span>
                        </button>
                        <Link
                          href="/cities"
                          className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:scale-105 active:scale-95"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>See All 120+ Active Coverage Cities</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    /* General No Results Empty State */
                    <div className="py-8 text-center space-y-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/60">
                        <Car className="h-6 w-6 text-white/50" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">No Rides Match Your Filters</h4>
                        <p className="mt-1 text-xs text-white/60">Try clearing fuel or transmission parameters to see available vehicles.</p>
                      </div>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset All Filters</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View: 3D Coverflow Circular Carousel */}
                {mobileLayoutMode === "coverflow" && (
                  <>
                    <div 
                      ref={scrollRef}
                      onScroll={handleScroll}
                      className="flex sm:hidden overflow-x-auto snap-x snap-mandatory py-6 no-scrollbar scroll-smooth w-full px-[11vw] relative z-10 items-center"
                      style={{
                        scrollSnapType: 'x mandatory',
                        scrollPaddingLeft: '11vw',
                        scrollPaddingRight: '11vw',
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-x pan-y',
                        overscrollBehaviorX: 'contain',
                      }}
                    >
                      {filteredVehicles.map((vehicle, idx) => {
                        const theme = getVehicleTypeTheme(vehicle.type);
                        const matching = vehicles.filter(
                          (v) =>
                            v.title.toLowerCase() === vehicle.title.toLowerCase() &&
                            v.vendorId === vehicle.vendorId &&
                            (v.availabilityStatus ?? "available") === "available"
                        );
                        const availableCount = Math.max(1, matching.length);

                        const diff = idx - activeCardIndex;
                        const rotateY = diff * -12;
                        const scale = 1 - Math.min(0.2, Math.abs(diff) * 0.08);
                        const opacity = 1 - Math.min(0.6, Math.abs(diff) * 0.25);
                        const zIndex = 20 - Math.abs(diff);

                        return (
                          <div
                            key={vehicle.id}
                            className="snap-center shrink-0 w-[78vw] transition-all duration-300 relative flex justify-center"
                            style={{
                              transform: `perspective(800px) rotateY(${rotateY}deg) scale(${scale}) translateZ(0)`,
                              opacity: opacity,
                              zIndex: zIndex,
                              willChange: 'transform, opacity',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transition: 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.35s ease, z-index 0.35s ease',
                            }}
                          >
                            <div className="w-full">
                              <VehicleCatalogCard
                                vehicle={vehicle}
                                theme={theme}
                                handleMouseMove={handleMouseMove}
                                handleMouseLeave={handleMouseLeave}
                                setHoveredVehicleId={setHoveredVehicleId}
                                availableCount={availableCount}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Coverflow Dots Indicators */}
                    <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2">
                      {filteredVehicles.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (scrollRef.current) {
                              const container = scrollRef.current;
                              const cardWidth = container.scrollWidth / filteredVehicles.length;
                              container.scrollTo({
                                left: idx * cardWidth,
                                behavior: "smooth"
                              });
                            }
                          }}
                          className={`w-2 h-2 rounded-full transition-all duration-300 border-0 p-0 cursor-pointer ${
                            idx === activeCardIndex ? "bg-[var(--brand-red)] scale-125" : "bg-white/20"
                          }`}
                          aria-label={`Go to vehicle ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Mobile View: Flat Vertical List - Hidden on desktop */}
                {mobileLayoutMode === "grid" && (
                  <div className="flex sm:hidden flex-col gap-4 px-4">
                    {filteredVehicles.map((vehicle) => {
                      const theme = getVehicleTypeTheme(vehicle.type);
                      const matching = vehicles.filter(
                        (v) =>
                          v.title.toLowerCase() === vehicle.title.toLowerCase() &&
                          v.vendorId === vehicle.vendorId &&
                          (v.availabilityStatus ?? "available") === "available"
                      );
                      const availableCount = Math.max(1, matching.length);

                      return (
                        <VehicleCatalogCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          theme={theme}
                          handleMouseMove={handleMouseMove}
                          handleMouseLeave={handleMouseLeave}
                          setHoveredVehicleId={setHoveredVehicleId}
                          availableCount={availableCount}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Desktop/Tablet View: Standard 2-Column Grid */}
                <div className="hidden sm:grid gap-4 sm:grid-cols-2">
                  {filteredVehicles.map((vehicle) => {
                    const theme = getVehicleTypeTheme(vehicle.type);
                    const matching = vehicles.filter(
                      (v) =>
                        v.title.toLowerCase() === vehicle.title.toLowerCase() &&
                        v.vendorId === vehicle.vendorId &&
                        (v.availabilityStatus ?? "available") === "available"
                    );
                    const availableCount = Math.max(1, matching.length);

                    return (
                      <VehicleCatalogCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        theme={theme}
                        handleMouseMove={handleMouseMove}
                        handleMouseLeave={handleMouseLeave}
                        setHoveredVehicleId={setHoveredVehicleId}
                        availableCount={availableCount}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Right map panel */}
        <div className={`lg:col-span-5 sticky top-24 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-xl h-[560px] ${
          activeMobileTab === "map" ? "block" : "hidden lg:block"
        }`}>
          <VehicleMap
            city={city}
            vehicles={vehicles}
            activeCities={cityOptions}
            hoveredVehicleId={hoveredVehicleId}
            onSelectCity={(cityName) => {
              setCity(cityName);
              void fetchVehiclesWith({ city: cityName });
            }}
            onSelectHub={setSelectedHub}
            selectedHubName={selectedHub}
            detectedState={detectedState}
          />
        </div>
      </div>
    </PageShell>
  );
}

export default function VehiclesCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VehiclesCatalogContent />
    </Suspense>
  );
}
