"use client";

import { useMemo } from "react";
import { INDIA_CITIES_BY_STATE, INDIA_STATES, MAJOR_AIRPORT_HUBS } from "@/lib/india-locations";
import { MapPin, Building, Plane } from "lucide-react";

interface IndiaStateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onAirportSuggested?: (airportName: string) => void;
  disabled?: boolean;
  stateLabel?: string;
  cityLabel?: string;
  showAirportHint?: boolean;
  className?: string;
}

export function IndiaStateCitySelector({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  onAirportSuggested,
  disabled = false,
  stateLabel = "Indian State / UT",
  cityLabel = "City / Operating Hub",
  showAirportHint = true,
  className = "",
}: IndiaStateCitySelectorProps) {
  const citiesForSelectedState = useMemo(() => {
    if (!selectedState) return [];
    return INDIA_CITIES_BY_STATE[selectedState] || [];
  }, [selectedState]);

  const handleStateSelect = (state: string) => {
    onStateChange(state);
    const availableCities = INDIA_CITIES_BY_STATE[state] || [];
    // If current city is not in the newly selected state, reset or pick the first prominent city
    if (availableCities.length > 0) {
      const defaultCity = availableCities[0];
      onCityChange(defaultCity);
      checkAirportSuggestion(defaultCity, state);
    } else {
      onCityChange("");
    }
  };

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    checkAirportSuggestion(city, selectedState);
  };

  const checkAirportSuggestion = (city: string, state: string) => {
    if (!onAirportSuggested) return;
    const searchKey = city.toLowerCase().trim();
    const matchedAirport = MAJOR_AIRPORT_HUBS.find(
      (hub) => hub.cityName.toLowerCase().includes(searchKey) || hub.name.toLowerCase().includes(searchKey)
    );

    if (matchedAirport) {
      onAirportSuggested(matchedAirport.name);
    } else if (["delhi", "mumbai", "pune", "goa", "jaipur", "bengaluru", "bangalore", "hyderabad", "chennai", "kolkata", "chandigarh", "ahmedabad", "varanasi", "lucknow", "kochi", "cochin"].includes(searchKey)) {
      onAirportSuggested(`${city} International Airport`);
    }
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      {/* State Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-white/50 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-red-400" />
          <span>{stateLabel} *</span>
        </label>
        <div className="relative">
          <select
            value={selectedState}
            disabled={disabled}
            onChange={(e) => handleStateSelect(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-red-500 focus:outline-none disabled:opacity-50 cursor-pointer"
          >
            <option value="" disabled className="bg-[#121216] text-white/40">
              -- Select State / UT --
            </option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state} className="bg-[#121216] text-white">
                {state}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* Dependent City Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-white/50 flex items-center gap-1.5">
          <Building className="w-3 h-3 text-cyan-400" />
          <span>{cityLabel} *</span>
          {citiesForSelectedState.length > 0 && (
            <span className="text-[9px] font-mono text-white/30 lowercase">
              ({citiesForSelectedState.length} cities)
            </span>
          )}
        </label>
        <div className="relative">
          {citiesForSelectedState.length > 0 ? (
            <>
              <select
                value={selectedCity}
                disabled={disabled || !selectedState}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-red-500 focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                <option value="" disabled className="bg-[#121216] text-white/40">
                  -- Select City in {selectedState} --
                </option>
                {citiesForSelectedState.map((city) => (
                  <option key={city} value={city} className="bg-[#121216] text-white">
                    {city}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[10px]">
                ▼
              </div>
            </>
          ) : (
            <input
              type="text"
              placeholder={selectedState ? "Enter city name..." : "Select state first"}
              value={selectedCity}
              disabled={disabled || !selectedState}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none disabled:opacity-50"
            />
          )}
        </div>
      </div>
    </div>
  );
}
