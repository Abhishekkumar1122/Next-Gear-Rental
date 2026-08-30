"use client";

import { useState, useRef } from "react";
import {
  MapPin,
  Search,
  Crosshair,
  Building2,
  Navigation,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Layers,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

export type LocationSelection = {
  address: string;
  landmark: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
};

type InteractiveLocationPickerProps = {
  initialLocation?: Partial<LocationSelection>;
  onChange: (location: LocationSelection) => void;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
};

export function InteractiveLocationPicker({
  initialLocation,
  onChange,
  title = "Garage / Pickup Pinpoint Location",
  subtitle = "Drag the pin or search your shop address so customers can navigate accurately.",
  hideHeader = false,
}: InteractiveLocationPickerProps) {
  const [lat, setLat] = useState<number>(initialLocation?.lat ?? 28.5355);
  const [lng, setLng] = useState<number>(initialLocation?.lng ?? 77.3910);
  const [address, setAddress] = useState(initialLocation?.address ?? "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark ?? "");
  const [city, setCity] = useState(initialLocation?.city ?? "Noida");
  const [state, setState] = useState(initialLocation?.state ?? "Uttar Pradesh");

  // Google Maps View Controls
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [zoomLevel, setZoomLevel] = useState<number>(16);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const notifyChange = (newLat: number, newLng: number, newAddr: string, newLandmark: string, newCity: string, newState: string) => {
    onChangeRef.current?.({
      lat: newLat,
      lng: newLng,
      address: newAddr,
      landmark: newLandmark,
      city: newCity,
      state: newState,
    });
  };

  // Reverse geocode when coordinates change
  const reverseGeocode = async (latitude: number, longitude: number, isFromGps = false) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.street || "";
        const neighbourhood = data.address.neighbourhood || data.address.suburb || data.address.residential || "";
        const district = data.address.city_district || data.address.county || data.address.city || data.address.town || "";
        const detectedCity = data.address.city || data.address.town || data.address.county || data.address.state_district || "Unknown City";
        const detectedState = data.address.state || "India";

        const formattedAddress = [road, neighbourhood, district, detectedCity, detectedState].filter(Boolean).join(", ") || data.display_name;
        
        let newLandmark = landmark;
        // If from GPS and previous landmark was default mock or empty, intelligently set local landmark
        if (isFromGps) {
          newLandmark = neighbourhood || road || "";
          setLandmark(newLandmark);
        }

        setAddress(formattedAddress);
        if (detectedCity) setCity(detectedCity);
        if (detectedState) setState(detectedState);
        notifyChange(latitude, longitude, formattedAddress, newLandmark, detectedCity || city, detectedState || state);
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search autocomplete
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query + ", India"
          )}&limit=5&countrycodes=in`
        );
        const data = await res.json();
        setSearchResults(data || []);
      } catch (err) {
        console.warn("Location search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const selectSearchResult = (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setLat(newLat);
    setLng(newLng);
    setZoomLevel(17);
    setAddress(item.display_name);
    setSearchResults([]);
    setSearchQuery("");
    // Clear old city mock landmark when user picks a different city
    const cleanLandmark = "";
    setLandmark(cleanLandmark);
    notifyChange(newLat, newLng, item.display_name, cleanLandmark, city, state);
  };

  // 1-Tap GPS Detection
  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setZoomLevel(17); // Zoom in close to vendor's actual building/shop
        await reverseGeocode(latitude, longitude, true);
        setIsDetectingGps(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        alert("Could not access GPS. Please search or pick your address manually.");
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Map interactive click offset calculation
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Small proportional delta
    const deltaLat = ((rect.height / 2 - y) / rect.height) * (0.02 / (zoomLevel / 12));
    const deltaLng = ((x - rect.width / 2) / rect.width) * (0.02 / (zoomLevel / 12));

    const newLat = Math.round((lat + deltaLat) * 100000) / 100000;
    const newLng = Math.round((lng + deltaLng) * 100000) / 100000;

    setLat(newLat);
    setLng(newLng);
    void reverseGeocode(newLat, newLng);
  };

  // Google Maps Authentic Embed URL
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType === "satellite" ? "k" : "m"}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#141416] to-[#0c0c0e] p-3.5 sm:p-5 text-white shadow-2xl space-y-3.5">
      {/* Header (conditionally rendered) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span>{title}</span>
            </h4>
            <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
          </div>

          {/* 1-Tap GPS Button */}
          <button
            type="button"
            onClick={handleGpsDetect}
            disabled={isDetectingGps}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isDetectingGps ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Pinpointing GPS...</span>
              </>
            ) : (
              <>
                <Crosshair className="h-3.5 w-3.5 text-emerald-300" />
                <span>📍 Use My Current Location</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Google-Style Floating Search Autocomplete Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
            <Search className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search area, landmark, metro station, airport on Google Maps..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none"
            />
            {isSearching && <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-white/20 bg-[#1a1a1c] p-1.5 shadow-2xl backdrop-blur-xl">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left p-2.5 rounded-lg text-xs text-white/90 hover:bg-blue-600/20 hover:text-white transition flex items-start gap-2.5 cursor-pointer border-b border-white/5 last:border-0"
                >
                  <MapPin className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {hideHeader && (
          <button
            type="button"
            onClick={handleGpsDetect}
            disabled={isDetectingGps}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isDetectingGps ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Pinpointing...</span>
              </>
            ) : (
              <>
                <Crosshair className="h-3.5 w-3.5 text-emerald-300" />
                <span>📍 Use GPS</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 🗺️ AUTHENTIC GOOGLE MAPS VIEWPORT */}
      <div className="relative rounded-2xl border border-white/20 bg-neutral-950 overflow-hidden shadow-2xl">
        {/* Google Map Type Switcher (Roadmap vs Satellite) */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center bg-black/85 backdrop-blur-md rounded-xl p-1 border border-white/20 shadow-lg">
          <button
            type="button"
            onClick={() => setMapType("roadmap")}
            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mapType === "roadmap"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>🗺️ Map</span>
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mapType === "satellite"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>🛰️ Satellite</span>
          </button>
        </div>

        {/* Google Zoom Controls (+ / -) */}
        <div className="absolute bottom-3 right-2.5 z-20 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 1, 20))}
            className="h-7 w-7 rounded-lg bg-black/85 hover:bg-black text-white border border-white/20 flex items-center justify-center text-xs font-black shadow-lg transition active:scale-90 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 1, 8))}
            className="h-7 w-7 rounded-lg bg-black/85 hover:bg-black text-white border border-white/20 flex items-center justify-center text-xs font-black shadow-lg transition active:scale-90 cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Google Maps Embed iframe */}
        <div
          onClick={handleMapClick}
          className="w-full h-52 sm:h-60 relative cursor-crosshair"
          title="Click anywhere to adjust pinpoint marker"
        >
          <iframe
            key={`${lat}-${lng}-${mapType}-${zoomLevel}`}
            src={googleMapsEmbedUrl}
            className="w-full h-full border-0 pointer-events-none opacity-90"
            loading="lazy"
          />

          {/* Authentic Google Maps Red Teardrop Pin */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex flex-col items-center -translate-y-5 animate-bounce">
              {/* Google Pin SVG */}
              <svg width="34" height="46" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.25 12 32 12 32C12 32 24 20.25 24 12C24 5.37258 18.6274 0 12 0Z" fill="#EA4335" />
                <circle cx="12" cy="11" r="4.5" fill="#FFFFFF" />
                <circle cx="12" cy="11" r="2.5" fill="#B31412" />
              </svg>
              {/* Pin Base Pulsing Ring */}
              <div className="h-2 w-4 rounded-full bg-red-600/80 animate-ping -mt-1 blur-[0.5px]" />
            </div>
          </div>

          {/* Google Watermark Badge & Coordinates */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
            <span className="text-[10px] font-bold bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-white/90 shadow-md">
              Google Maps Pin
            </span>
            <span className="text-[10px] font-mono font-bold bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-emerald-400 shadow-md">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Address & Landmark Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Full Address */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1 flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-blue-400" />
            <span>Pickup Address / Area</span>
            {isReverseGeocoding && <span className="text-[9px] text-amber-400 font-normal animate-pulse">(resolving...)</span>}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              const val = e.target.value;
              setAddress(val);
              notifyChange(lat, lng, val, landmark, city, state);
            }}
            placeholder="e.g. Sector 62, Near Metro Station, Noida"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Specific Landmark / Gate / Shop Name */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1 flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-emerald-400" />
            <span>Landmark / Gate / Shop Name (Optional)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => {
              const val = e.target.value;
              setLandmark(val);
              notifyChange(lat, lng, address, val, city, state);
            }}
            placeholder="e.g. Shop No. 4, Opposite Pillar 124, Near HP Pump"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Google Maps Live Direction Test & Customer Preview */}
      <div className="flex items-center justify-between rounded-xl bg-blue-950/20 border border-blue-500/30 px-3.5 py-2.5 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px]">Customers will get 1-tap Google Maps directions to this exact point</span>
        </div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
        >
          <span>Open Google Maps</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
