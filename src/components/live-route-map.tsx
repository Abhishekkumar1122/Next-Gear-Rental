"use client";

import { useEffect, useRef, useState } from "react";

type LiveRouteMapProps = {
  startLat: number;
  startLng: number;
  liveLat: number;
  liveLng: number;
  endLat: number;
  endLng: number;
  vehicleType?: string; // "bike" | "car" | "scooter"
  status?: string;
  driverName?: string;
  vehicleName?: string;
  etaMins?: number;
  distanceKm?: number;
};

export function LiveRouteMap({
  startLat,
  startLng,
  liveLat,
  liveLng,
  endLat,
  endLng,
  vehicleType = "bike",
  status = "en_route",
  driverName = "Rahul Verma",
  vehicleName = "Yamaha FZ-S V4",
  etaMins = 8,
  distanceKm = 4.8,
}: LiveRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  const [currentManeuver, setCurrentManeuver] = useState("In 350m • Turn right onto Main Ring Road");
  const isBike = vehicleType.toLowerCase().includes("bike") || vehicleType.toLowerCase().includes("scooter") || vehicleType.toLowerCase().includes("activa");
  const vehicleEmoji = isBike ? "🛵" : "🚗";

  const centerOnVehicle = () => {
    if (mapInstanceRef.current && (window as any).L) {
      mapInstanceRef.current.setView([liveLat, liveLng], 16, { animate: true });
    }
  };

  // Leaflet Uber-Style CartoDB Map Loader
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        await new Promise((resolve) => {
          if (document.getElementById("leaflet-js")) {
            resolve(true);
            return;
          }
          const script = document.createElement("script");
          script.id = "leaflet-js";
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve(true);
          document.head.appendChild(script);
        });
      }

      if (!isMounted || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [liveLat, liveLng],
          zoom: 15,
          zoomControl: false,
        });

        // Clean Uber-Style CartoDB Voyager Tile Layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        mapInstanceRef.current = map;

        // Hub Icon
        const hubIcon = L.divIcon({
          className: "uber-hub-marker",
          html: `<div style="background:#111827; width:30px; height:30px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 6px 16px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:14px; color:white; font-weight:bold;">🏪</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        // Customer Delivery Destination Pin (Uber Red Pin style)
        const dropIcon = L.divIcon({
          className: "uber-drop-marker",
          html: `<div style="position:relative; text-align:center;">
                  <div style="background:#000000; color:white; font-size:10px; font-weight:bold; padding:2px 8px; border-radius:12px; white-space:nowrap; margin-bottom:4px; box-shadow:0 4px 10px rgba(0,0,0,0.25);">Customer Spot</div>
                  <div style="background:#ef4444; width:34px; height:34px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 6px 18px rgba(239,68,68,0.5); display:flex; align-items:center; justify-content:center; font-size:16px; margin:0 auto;">📍</div>
                 </div>`,
          iconSize: [80, 50],
          iconAnchor: [40, 50],
        });

        L.marker([startLat, startLng], { icon: hubIcon }).addTo(map).bindPopup("Next Gear Vendor Hub 🏪");
        L.marker([endLat, endLng], { icon: dropIcon }).addTo(map).bindPopup("Delivery Location 📍");

        // Uber Circular Vehicle Puck Marker with direction arrow
        const vehicleIcon = L.divIcon({
          className: "uber-puck-marker",
          html: `<div style="background:#000000; width:44px; height:44px; border-radius:50%; border:3.5px solid #ffffff; box-shadow:0 8px 24px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; font-size:22px; transition: transform 0.3s ease-out; position:relative;">
                  <span>${vehicleEmoji}</span>
                  <div style="position:absolute; top:-6px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:8px solid #000000;"></div>
                 </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        markerRef.current = L.marker([liveLat, liveLng], { icon: vehicleIcon }).addTo(map).bindPopup(`Next Gear Driver (${vehicleEmoji})`);

        // Polyline Route (Uber Bold Black Route with Cyan glow)
        routeLineRef.current = L.polyline(
          [
            [startLat, startLng],
            [liveLat, liveLng],
            [endLat, endLng],
          ],
          { color: "#000000", weight: 6, opacity: 0.95 }
        ).addTo(map);

        const bounds = L.latLngBounds([
          [startLat, startLng],
          [liveLat, liveLng],
          [endLat, endLng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        if (markerRef.current) {
          markerRef.current.setLatLng([liveLat, liveLng]);
        }
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs([
            [startLat, startLng],
            [liveLat, liveLng],
            [endLat, endLng],
          ]);
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, [startLat, startLng, liveLat, liveLng, endLat, endLng, vehicleEmoji]);

  return (
    <div className="relative w-full h-[480px] rounded-3xl overflow-hidden border border-black/10 bg-slate-100 shadow-2xl font-sans">
      {/* 1. TOP UBER NAVIGATION BANNER */}
      <div className="absolute top-3 left-3 right-3 z-20 bg-[#0d0d12]/95 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl font-bold">
            ↪️
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Next Maneuver</div>
            <div className="text-sm font-black tracking-tight text-white">{currentManeuver}</div>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end border-l border-white/15 pl-3">
          <span className="text-[9px] font-bold text-white/50 uppercase">Speed Limit</span>
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">45 KM/H</span>
        </div>
      </div>

      {/* 2. MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 3. FLOATING ACTION BUTTONS */}
      <div className="absolute right-3 top-20 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={centerOnVehicle}
          className="w-10 h-10 rounded-full bg-white text-slate-900 border border-black/10 shadow-lg flex items-center justify-center text-base font-bold hover:bg-slate-50 transition cursor-pointer"
          title="Recenter Vehicle"
        >
          🎯
        </button>
        <div className="w-10 h-10 rounded-full bg-white text-emerald-600 border border-black/10 shadow-lg flex items-center justify-center text-base font-bold">
          🛡️
        </div>
      </div>

      {/* 4. BOTTOM UBER TRIP SHEET CARD */}
      <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{etaMins} min</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 text-lg font-bold">{distanceKm} km</span>
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Delivering {vehicleName} to your location</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:9523765172`}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
            >
              📞 Call Driver
            </a>
          </div>
        </div>

        {/* Driver Profile Bar */}
        <div className="pt-2.5 border-t border-black/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-950 text-red-300 border border-red-500/30 flex items-center justify-center font-bold text-xs">
              👨‍✈️
            </div>
            <div>
              <div className="font-bold text-slate-900">{driverName}</div>
              <div className="text-[11px] text-slate-500">Verified Executive • 4.9 ★</div>
            </div>
          </div>

          <div className="bg-slate-100 border border-black/10 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-800">
            {vehicleEmoji} Live Status: {status.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
