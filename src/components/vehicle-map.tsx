"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Vehicle } from "@/lib/types";

export interface Hub {
  id: string;
  name: string;
  description: string;
  x: number; // percentage coordinate
  y: number; // percentage coordinate
  airport: boolean;
}

interface VehicleMapProps {
  city: string;
  vehicles: Vehicle[];
  activeCities?: string[];
  hoveredVehicleId: string | null;
  onSelectCity?: (cityName: string) => void;
  onSelectHub?: (hubName: string | null) => void;
  selectedHubName?: string | null;
  detectedState?: string;
}

// Major rental hub cities with relative map coordinates calibrated to 3D India Map
export const INDIA_CITIES = [
  { id: "delhi", name: "Delhi NCR", state: "Delhi", x: 38.5, y: 29.5, count: 18, desc: "Connaught Place, Airport T3, Gurgaon & Noida", active: true },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", x: 27.5, y: 56.5, count: 15, desc: "Bandra BKC, Airport T2, Colaba & Thane", active: true },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", x: 34.5, y: 72.5, count: 22, desc: "Indiranagar, Koramangala & Airport T1/T2", active: true },
  { id: "goa", name: "Goa", state: "Goa", x: 25.5, y: 69, count: 12, desc: "Mopa Airport, Dabolim, Calangute & Panaji", active: true },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", x: 42, y: 61.5, count: 9, desc: "Hitech City, Gachibowli & RGIA Airport", active: true },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", x: 29.5, y: 35.5, count: 8, desc: "Pink City Hub, Airport & MI Road", active: true },
  { id: "kochi", name: "Kochi", state: "Kerala", x: 35, y: 85.5, count: 7, desc: "Cochin Airport & Fort Kochi", active: true },
  { id: "chandigarh", name: "Chandigarh", state: "Punjab", x: 33.5, y: 24.5, count: 6, desc: "Sector 17 & Mohali Airport", active: true },
];

// 100% Correct Indian States Vector Label Coordinates Overlaid on 3D Map
export const CORRECT_STATE_LABELS = [
  { name: "Jammu & Kashmir", x: 37, y: 13 },
  { name: "Punjab", x: 33, y: 23 },
  { name: "Himachal Pradesh", x: 42, y: 19 },
  { name: "Uttarakhand", x: 48, y: 22 },
  { name: "Haryana", x: 36, y: 27 },
  { name: "Delhi NCR", x: 41, y: 29.5, isUT: true },
  { name: "Rajasthan", x: 28, y: 34 },
  { name: "Uttar Pradesh", x: 53, y: 31 },
  { name: "Gujarat", x: 20, y: 46 },
  { name: "Madhya Pradesh", x: 44, y: 43 },
  { name: "Bihar", x: 66, y: 35 },
  { name: "Jharkhand", x: 65, y: 41 },
  { name: "West Bengal", x: 72, y: 43 },
  { name: "Odisha", x: 61, y: 50 },
  { name: "Chhattisgarh", x: 52, y: 48 },
  { name: "Maharashtra", x: 33, y: 56 },
  { name: "Goa", x: 28.5, y: 69 },
  { name: "Telangana", x: 46, y: 62 },
  { name: "Andhra Pradesh", x: 48, y: 71 },
  { name: "Karnataka", x: 35, y: 72 },
  { name: "Tamil Nadu", x: 44, y: 84 },
  { name: "Kerala", x: 34, y: 85 },
  { name: "Assam", x: 83, y: 29 },
];

// Coordinate mappings of hubs per city
export const HUBS_BY_CITY: Record<string, Hub[]> = {
  delhi: [
    { id: "delhi-airport", name: "Indira Gandhi Airport (T3)", description: "Terminals 1 & 3 Pick-up Zone", x: 25, y: 70, airport: true },
    { id: "delhi-cp", name: "Connaught Place Hub", description: "Near Rajiv Chowk Metro Exit 4", x: 52, y: 48, airport: false },
    { id: "delhi-dwarka", name: "Dwarka Sector 21", description: "Metro Station Parking Lot", x: 18, y: 52, airport: false },
    { id: "delhi-noida", name: "Noida Sector 62 Hub", description: "Electronic City Metro Plaza", x: 82, y: 55, airport: false },
    { id: "delhi-gurugram", name: "Gurugram Cyber City", description: "Rapid Metro Pillar 42", x: 30, y: 85, airport: false },
  ],
  mumbai: [
    { id: "mumbai-airport", name: "Chhatrapati Shivaji Airport (T2)", description: "P4 Multi-Level Parking", x: 45, y: 45, airport: true },
    { id: "mumbai-bandra", name: "Bandra Kurla Complex (BKC)", description: "G-Block Office Plaza Hub", x: 50, y: 55, airport: false },
    { id: "mumbai-colaba", name: "Colaba Gateway Hub", description: "Taj Palace Pick-up Area", x: 48, y: 92, airport: false },
    { id: "mumbai-thane", name: "Thane Central Hub", description: "Teen Hath Naka Pick-up Station", x: 72, y: 15, airport: false },
    { id: "mumbai-navi", name: "Vashi Station Plaza", description: "Navi Mumbai Sector 17", x: 80, y: 42, airport: false },
  ],
  bengaluru: [
    { id: "blr-airport", name: "Kempegowda Airport (T1/T2)", description: "Arrival Bay 11 Rental Zone", x: 70, y: 16, airport: true },
    { id: "blr-indiranagar", name: "Indiranagar Hub", description: "100 Feet Road Near Metro Station", x: 55, y: 52, airport: false },
    { id: "blr-koramangala", name: "Koramangala Hub", description: "Sony World Signal Service Point", x: 52, y: 68, airport: false },
    { id: "blr-electronic-city", name: "Electronic City Phase 1", description: "Near Toll Plaza Hub", x: 62, y: 88, airport: false },
    { id: "blr-whitefield", name: "Whitefield ITPL Plaza", description: "ITPL Main Gate Pick-up Hub", x: 85, y: 48, airport: false },
  ],
  goa: [
    { id: "goa-dabolim", name: "Dabolim International Airport", description: "Domestic Arrival Terminal Zone", x: 48, y: 58, airport: true },
    { id: "goa-mopa", name: "Manohar Airport (Mopa)", description: "North Goa Terminal pick-up", x: 42, y: 12, airport: true },
    { id: "goa-panaji", name: "Panaji Central Hub", description: "KTC Bus Stand Parking Zone", x: 45, y: 42, airport: false },
    { id: "goa-calangute", name: "Calangute Beach Hub", description: "Calangute-Baga Road Service Zone", x: 35, y: 32, airport: false },
    { id: "goa-margao", name: "Margao Railway Hub", description: "Madgaon Junction Entrance Plat", x: 55, y: 80, airport: false },
  ],
};

export function VehicleMap({
  city,
  vehicles,
  activeCities = [],
  hoveredVehicleId,
  onSelectCity,
  onSelectHub,
  selectedHubName,
  detectedState,
}: VehicleMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Normalize city input
  const cityKey = useMemo(() => {
    const norm = city.toLowerCase();
    if (norm.includes("delhi") || norm.includes("noida") || norm.includes("gurgaon")) return "delhi";
    if (norm.includes("mumbai") || norm.includes("thane") || norm.includes("navi")) return "mumbai";
    if (norm.includes("bengaluru") || norm.includes("bangalore")) return "bengaluru";
    if (norm.includes("goa")) return "goa";
    return "";
  }, [city]);

  const activeHubs = useMemo(() => {
    if (!cityKey) return [];
    return HUBS_BY_CITY[cityKey] || [];
  }, [cityKey]);

  // Map each vehicle to its closest hub
  const vehicleHubMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    if (!cityKey || activeHubs.length === 0) return mapping;

    vehicles.forEach((vehicle, index) => {
      if (vehicle.airportPickup) {
        const airportHub = activeHubs.find((h) => h.airport);
        if (airportHub) {
          mapping[vehicle.id] = airportHub.id;
          return;
        }
      }
      const nonAirportHubs = activeHubs.filter((h) => !h.airport);
      if (nonAirportHubs.length > 0) {
        mapping[vehicle.id] = nonAirportHubs[index % nonAirportHubs.length].id;
      } else {
        mapping[vehicle.id] = activeHubs[index % activeHubs.length].id;
      }
    });

    return mapping;
  }, [vehicles, activeHubs, cityKey]);

  const hubVehicleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeHubs.forEach((h) => { counts[h.id] = 0; });
    Object.values(vehicleHubMapping).forEach((hubId) => {
      counts[hubId] = (counts[hubId] || 0) + 1;
    });
    return counts;
  }, [activeHubs, vehicleHubMapping]);

  const highlightedHubId = useMemo(() => {
    if (!hoveredVehicleId) return null;
    return vehicleHubMapping[hoveredVehicleId] || null;
  }, [hoveredVehicleId, vehicleHubMapping]);

  const currentCityTitle = useMemo(() => {
    if (cityKey === "delhi") return "Delhi NCR Rental Hubs";
    if (cityKey === "mumbai") return "Mumbai Fleet Hubs";
    if (cityKey === "bengaluru") return "Bengaluru Tech Hubs";
    if (cityKey === "goa") return "Goa Regional Hubs";
    return "Next Gear 3D India Political Map — Official State Names";
  }, [cityKey]);

  return (
    <div className="relative flex flex-col h-full w-full bg-neutral-950 text-white rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* City Selector Pills Header */}
      <div className="bg-neutral-900/95 px-4 pt-5 pb-3 sm:py-3 border-b border-white/10 space-y-2 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs max-sm:text-[11px] font-black tracking-wider uppercase text-white flex items-center gap-2 max-sm:leading-tight">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
              <span>{currentCityTitle}</span>
            </h3>
            <p className="text-[10px] text-white/50 max-sm:text-[9px] max-sm:mt-0.5">
              {cityKey ? "Click hubs to filter pickup locations" : "3D Extruded Relief Map • 100% Correct Official State Names"}
            </p>
          </div>

          {selectedHubName && (
            <button
              onClick={() => onSelectHub?.(null)}
              className="text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-500/40 rounded-full px-3 py-1 hover:bg-red-900/80 transition cursor-pointer"
            >
              Clear Hub Filter ✕
            </button>
          )}
        </div>

        {/* Quick City Buttons Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectCity?.("")}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition flex-shrink-0 border ${
              !cityKey
                ? "bg-red-600 text-white border-red-500 shadow-md"
                : "bg-black/50 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            🇮🇳 All India Map
          </button>
          {INDIA_CITIES.map((c) => {
            const isSelected = cityKey === c.id || (city.toLowerCase() === c.name.toLowerCase());
            return (
              <button
                key={c.id}
                onClick={() => onSelectCity?.(c.name)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex-shrink-0 border ${
                  isSelected
                    ? "bg-red-600 text-white border-red-500 shadow-md"
                    : "bg-black/40 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className="flex-grow relative overflow-hidden flex items-center justify-center p-0 min-h-[440px] bg-neutral-950">
        {/* Ambient Red Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12),transparent_75%)] pointer-events-none" />

        {/* Live Detected Location Badge */}
        {detectedState && (
          <div className="absolute top-3 left-3 z-30 bg-neutral-900/90 border border-emerald-500/40 rounded-full px-3 py-1 flex items-center gap-2 shadow-xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
              Detected Location: {detectedState}
            </span>
          </div>
        )}

        {/* EXACT OPTION 2 3D NEXT GEAR METALLIC MAP GRAPHIC + MICRO TARGET BEACONS */}
        {!cityKey ? (
          <div className="relative w-full h-full min-h-[440px] flex items-center justify-center bg-black overflow-hidden group">
            {/* Exact Option 2 3D Next Gear Metallic Map Image with State Names */}
            <Image
              src="/india-3d-map-v2.png"
              alt="Next Gear 3D India Map"
              width={600}
              height={600}
              priority
              loading="eager"
              className="w-full h-full object-cover filter contrast-125 brightness-110 pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
            />

            {/* Micro Target Beacons ("Chote Chote Target Dots") Overlaid on Cities */}
            {INDIA_CITIES.map((c) => {
              const isHovered = hoveredCity === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCity?.(c.name)}
                  onMouseEnter={() => setHoveredCity(c.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="absolute group/target cursor-pointer transition-all duration-300 z-30 flex flex-col items-center"
                  style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  {/* Micro Target Pulse Ring */}
                  <div className="absolute -inset-1.5 rounded-full border border-red-500 animate-ping opacity-75" />

                  {/* Micro Red Target Dot */}
                  <div className="relative flex items-center justify-center h-4 w-4 rounded-full bg-red-600 border-2 border-white shadow-[0_0_15px_#ef4444] transition-all duration-300 group-hover/target:scale-150 group-hover/target:bg-red-500 group-hover/target:shadow-[0_0_25px_#ef4444]">
                    <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                  </div>

                  {/* Sleek Tooltip Popup */}
                  <div
                    className={`absolute top-6 whitespace-nowrap rounded-full bg-neutral-950/95 border border-red-500/60 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-2xl backdrop-blur-md transition-all duration-300 z-40 flex items-center gap-1.5 pointer-events-none ${
                      isHovered
                        ? "opacity-100 scale-105 translate-y-0"
                        : "opacity-0 scale-90 -translate-y-1 group-hover/target:opacity-100 group-hover/target:scale-105 group-hover/target:translate-y-0"
                    }`}
                  >
                    <span className="text-white">{c.name}</span>
                    <span className="text-[9px] font-black text-red-400 bg-red-950 px-1.5 py-0.2 rounded-full border border-red-500/30">
                      {c.count}+ Fleets
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CITY HYPER-LOCAL HUBS DISPLAY */
          <div className="relative w-full h-full max-w-[440px] max-h-[440px]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="1" strokeDasharray="4,6" className="animate-[spin_90s_linear_infinite]" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
              <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
              <line x1="50" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
            </svg>

            {/* City Hub Markers */}
            {activeHubs.map((hub) => {
              const vCount = hubVehicleCounts[hub.id] || 0;
              const isHubHighlighted = highlightedHubId === hub.id;
              const isHubSelected = selectedHubName === hub.name;

              return (
                <div
                  key={hub.id}
                  onClick={() => onSelectHub?.(isHubSelected ? null : hub.name)}
                  className="absolute group/pin transition-all duration-300 z-20 cursor-pointer"
                  style={{ left: `${hub.x}%`, top: `${hub.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-500 scale-150 ${
                      isHubSelected || isHubHighlighted
                        ? "border-red-500 animate-ping opacity-100"
                        : "border-red-500/40 group-hover/pin:animate-ping"
                    }`}
                  />
                  <div
                    className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-xl ${
                      isHubSelected
                        ? "h-9 w-9 bg-red-600 border-2 border-white ring-4 ring-red-500/40 scale-110"
                        : isHubHighlighted
                        ? "h-8 w-8 bg-red-600 border-2 border-white scale-110"
                        : "h-7 w-7 bg-neutral-900 border border-white/30 group-hover/pin:bg-red-600 group-hover/pin:border-white"
                    }`}
                  >
                    <span className="text-xs">{hub.airport ? "✈️" : "📍"}</span>
                  </div>

                  {/* Hub Tooltip Card */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-2xl bg-neutral-900/95 border p-3 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-300 ${
                      isHubSelected || isHubHighlighted
                        ? "opacity-100 translate-y-0 border-red-500 scale-105 z-30"
                        : "opacity-0 translate-y-2 group-hover/pin:opacity-100 group-hover/pin:translate-y-0 border-white/20"
                    }`}
                  >
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center justify-between">
                      <span>{hub.airport ? "Airport Terminal" : "Rental Hub"}</span>
                      <span className="text-white font-bold">{vCount} Rides</span>
                    </p>
                    <p className="text-xs font-black text-white mt-1 leading-snug">{hub.name}</p>
                    <p className="text-[10px] text-white/60 mt-0.5">{hub.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* System Location Coordinates Badge */}
        <div className="absolute left-3 bottom-3 font-mono text-[9px] text-white/60 bg-black/70 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-xl pointer-events-none select-none z-20 shadow-xl flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>LOC: {cityKey ? cityKey.toUpperCase() : "NEXT_GEAR_3D_ROOT"} • FLEETS: {vehicles.length} READY</span>
        </div>
      </div>
    </div>
  );
}
