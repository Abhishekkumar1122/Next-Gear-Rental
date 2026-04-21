"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { WaitlistButton } from "@/components/waitlist-button";
import { toCurrency } from "@/lib/mock-data";
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

        {vehicles.length === 0 ? (
          <p className="text-sm text-black/60">No vehicles found. Try different filters.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                {vehicle.imageUrls?.[0] ? (
                  <div className="mb-3 overflow-hidden rounded-xl border border-black/10">
                    <img
                      src={vehicle.imageUrls[0]}
                      alt={vehicle.title}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{vehicle.title}</p>
                    <p className="text-xs text-black/60">{vehicle.city} · {vehicle.type.toUpperCase()}</p>
                  </div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs">{vehicle.seats} seats</span>
                </div>

                <p className="mt-2 text-sm text-black/70">
                  {vehicle.fuel} · {vehicle.transmission} · {vehicle.airportPickup ? "Airport pickup" : "City pickup"}
                </p>
                {vehicle.vehicleNumber ? <p className="mt-1 text-xs text-black/60">Vehicle No: {vehicle.vehicleNumber}</p> : null}
                <p className="mt-1 text-xs font-medium text-black/70">
                  Status: {(vehicle.availabilityStatus ?? "available").toUpperCase()}
                  {vehicle.availabilityMessage ? ` · ${vehicle.availabilityMessage}` : ""}
                </p>
                {vehicle.rating ? (
                  <p className="mt-1 text-xs text-black/60">Rating: {vehicle.rating.toFixed(1)} / 5</p>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-[var(--brand-red)]">
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
