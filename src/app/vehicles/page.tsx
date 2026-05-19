"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, Suspense, useRef, useCallback } from "react";
import { PageShell } from "@/components/page-shell";
import { WaitlistButton } from "@/components/waitlist-button";
import { toCurrency } from "@/lib/pricing";
import { Vehicle } from "@/lib/types";

function VehiclesCatalogContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [fuel, setFuel] = useState("");
  const [transmission, setTransmission] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const hasFilters = useMemo(
    () => Boolean(query || city || type || fuel || transmission || maxPrice),
    [query, city, type, fuel, transmission, maxPrice],
  );

  useEffect(() => {
    const cityParam = searchParams.get("city") ?? "";
    if (cityParam) {
      setCity(cityParam);
      void fetchVehiclesWith({ city: cityParam });
      return;
    }

    void fetchVehiclesWith();
  }, [searchParams]);

  // Debounce filter changes to reduce API calls
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      void fetchVehiclesWith();
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, city, type, fuel, transmission, maxPrice]);

  async function fetchVehiclesWith(overrides?: {
    query?: string;
    city?: string;
    type?: string;
    fuel?: string;
    transmission?: string;
    maxPrice?: string;
  }) {
    setIsLoading(true);
    setStatus("Loading vehicles...");

    const values = {
      query,
      city,
      type,
      fuel,
      transmission,
      maxPrice,
      ...overrides,
    };

    const params = new URLSearchParams();
    if (values.query) params.set("q", values.query);
    if (values.city) params.set("city", values.city);
    if (values.type) params.set("type", values.type);
    if (values.fuel) params.set("fuel", values.fuel);
    if (values.transmission) params.set("transmission", values.transmission);
    if (values.maxPrice) params.set("maxPrice", values.maxPrice);

    const response = await fetch(`/api/vehicles?${params.toString()}`);
    const data = await response.json();
    setVehicles(data.vehicles ?? []);
    setCityOptions(data.cities ?? []);
    setStatus(`Found ${data.vehicles?.length ?? 0} vehicles.`);
    setIsLoading(false);
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
    setMaxPrice("");
    void fetchVehiclesWith({
      query: "",
      city: "",
      type: "",
      fuel: "",
      transmission: "",
      maxPrice: "",
    });
  }

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
          // Reverse geocode using Nominatim (Open Street Map)
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await geoResponse.json();
          
          // Extract city name from address
          const addressCity = geoData.address?.city || geoData.address?.town || geoData.address?.village || "";
          
          if (addressCity) {
            // Find matching city from cityOptions
            const matchedCity = cityOptions.find(
              (option) => option.toLowerCase() === addressCity.toLowerCase()
            );
            
            if (matchedCity) {
              setCity(matchedCity);
              // Fetch vehicles for the detected city
              await fetchVehiclesWith({ city: matchedCity });
              setStatus(`Located in ${matchedCity}. Showing available vehicles...`);
            } else {
              // Show all cities if detected city doesn't match available options
              setStatus(`Located in ${addressCity}, but no vehicles available there. Showing all cities.`);
              await fetchVehiclesWith();
            }
          } else {
            setStatus("Could not determine city from location. Try selecting manually.");
            await fetchVehiclesWith();
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setStatus("Could not determine city. Try selecting manually.");
          await fetchVehiclesWith();
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus("Location access denied. Please select city manually.");
        setIsDetectingLocation(false);
        
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied. Please enable location access in your browser settings.");
        } else if (error.code === error.TIMEOUT) {
          alert("Location detection timed out. Please try again.");
        } else {
          alert("Unable to detect location. Please select city manually.");
        }
      }
    );
  }, [cityOptions]);

  return (
    <PageShell
      title="Vehicle Catalog"
      subtitle="Browse all available bikes, cars, and scooties. Book when you are ready."
    >
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Search & filter</p>
            <h2 className="text-xl font-semibold">Find your ride</h2>
            <p className="mt-2 text-sm text-black/70">Use filters to narrow results by city, type, fuel, and price.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDetectingLocation ? "Detecting..." : "📍 Current location"}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <form onSubmit={fetchVehicles} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by vehicle name"
            className="rounded-xl border border-black/10 px-3 py-2"
          />
          <select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
            <option value="">All cities</option>
            {cityOptions.map((cityName) => (
              <option key={cityName} value={cityName}>{cityName}</option>
            ))}
          </select>
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Max price/day (INR)"
            className="rounded-xl border border-black/10 px-3 py-2"
          />

          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
            <option value="">All types</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="scooty">Scooty</option>
          </select>
          <select value={fuel} onChange={(event) => setFuel(event.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
            <option value="">All fuels</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
          </select>
          <select value={transmission} onChange={(event) => setTransmission(event.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
            <option value="">All transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-[var(--brand-red)] px-4 py-2 font-semibold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-0.5"
          >
            {isLoading ? "Searching..." : "Search vehicles"}
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Results</h2>
          <p className="text-sm text-black/60">{status}</p>
        </div>

        {/* Show selected filters as tags */}
        {(city || type || fuel || transmission || maxPrice || query) && (
          <div className="flex flex-wrap gap-2">
            {city && (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-200">
                📍 {city}
                <button
                  onClick={() => setCity("")}
                  className="ml-1 hover:text-blue-900 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
            {type && (
              <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 border border-purple-200">
                🚗 {type}
                <button
                  onClick={() => setType("")}
                  className="ml-1 hover:text-purple-900 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
            {fuel && (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 border border-green-200">
                ⛽ {fuel}
                <button
                  onClick={() => setFuel("")}
                  className="ml-1 hover:text-green-900 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
            {transmission && (
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 border border-orange-200">
                ⚙️ {transmission}
                <button
                  onClick={() => setTransmission("")}
                  className="ml-1 hover:text-orange-900 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 border border-red-200">
                💰 ₹{maxPrice}/day
                <button
                  onClick={() => setMaxPrice("")}
                  className="ml-1 hover:text-red-900 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
            {query && (
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300">
                🔍 {query}
                <button
                  onClick={() => setQuery("")}
                  className="ml-1 hover:text-gray-900 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}

        {vehicles.length === 0 ? (
          <p className="text-sm text-black/60">No vehicles found. Try different filters.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition">
                {vehicle.imageUrls?.[0] ? (
                  <div className="mb-3 overflow-hidden rounded-xl border border-black/10">
                    <Image
                      src={vehicle.imageUrls[0]}
                      alt={vehicle.title}
                      width={400}
                      height={300}
                      className="h-40 w-full object-cover"
                      priority={false}
                    />
                  </div>
                ) : null}
                
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-black">{vehicle.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        📍 {vehicle.city}
                      </span>
                      <span className="inline-block rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                        {vehicle.type.toUpperCase() === "BIKE" ? "🏍️" : vehicle.type.toUpperCase() === "CAR" ? "🚗" : "🛵"} {vehicle.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium">{vehicle.seats} seats</span>
                </div>

                <p className="mt-3 text-sm text-black/70">
                  ⛽ {vehicle.fuel} · ⚙️ {vehicle.transmission} · {vehicle.airportPickup ? "✈️ Airport pickup" : "🏙️ City pickup"}
                </p>
                
                {vehicle.vehicleNumber ? <p className="mt-1 text-xs text-black/60">🔖 Vehicle: {vehicle.vehicleNumber}</p> : null}
                
                <div className="mt-2 flex items-center gap-2">
                  {(vehicle.availabilityStatus ?? "available").toUpperCase() === "AVAILABLE" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      ✅ AVAILABLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      ❌ BOOKED
                    </span>
                  )}
                  {vehicle.availabilityMessage && (
                    <span className="text-xs text-black/60">{vehicle.availabilityMessage}</span>
                  )}
                </div>
                
                {vehicle.rating ? (
                  <p className="mt-1 text-xs text-black/60">⭐ Rating: {vehicle.rating.toFixed(1)} / 5</p>
                ) : null}
                
                <p className="mt-3 text-lg font-bold text-[var(--brand-red)]">
                  {toCurrency(vehicle.pricePerDayINR, "INR")} / day
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {vehicle.availableDates.slice(0, 4).map((date) => (
                    <span key={date} className="rounded-full bg-black/5 px-3 py-1">{date}</span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/vehicles/${vehicle.id}`}
                    className="rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5"
                  >
                    View details
                  </Link>
                  {(vehicle.availabilityStatus ?? "available") === "available" ? (
                    <Link
                      href={`/book-vehicle?vehicleId=${encodeURIComponent(vehicle.id)}&city=${encodeURIComponent(vehicle.city)}`}
                      className="rounded-full bg-[var(--brand-red)] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-0.5"
                    >
                      Book now
                    </Link>
                  ) : (
                    <WaitlistButton vehicleId={vehicle.id} city={vehicle.city} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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
