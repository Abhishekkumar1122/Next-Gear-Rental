"use client";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toCitySlug } from "@/lib/city-seo";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";

type CoverageCity = {
  name: string;
  state: string;
  displayName: string;
  airport: string;
  vehicleCount: number;
  vehicleTypes: string[];
};

type CoverageResponse = {
  stats: {
    totalCities: number;
    airportHubs: number;
    vehiclesAvailable: number;
    statesCovered: number;
  };
  cities: CoverageCity[];
};

export default function CitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cities, setCities] = useState<CoverageCity[]>([]);
  const [stats, setStats] = useState<CoverageResponse["stats"]>({
    totalCities: 0,
    airportHubs: 0,
    vehiclesAvailable: 0,
    statesCovered: 0,
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadCoverage() {
      const response = await fetch("/api/cities", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as Partial<CoverageResponse>;
      if (!isMounted) return;

      setCities(data.cities ?? []);
      setStats(
        data.stats ?? {
          totalCities: data.cities?.length ?? 0,
          airportHubs: (data.cities ?? []).filter((city) => city.airport && city.airport !== "Airport details coming soon").length,
          vehiclesAvailable: (data.cities ?? []).reduce((sum, city) => sum + (city.vehicleCount ?? 0), 0),
          statesCovered: new Set((data.cities ?? []).map((city) => city.state).filter(Boolean)).size,
        }
      );
    }

    void loadCoverage();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCities = useMemo(
    () =>
      cities.filter((city) => {
        const query = debouncedQuery.toLowerCase();
        return city.displayName.toLowerCase().includes(query) || city.state.toLowerCase().includes(query);
      }),
    [cities, debouncedQuery]
  );

  const popularCities = [...cities]
    .sort((a, b) => b.vehicleCount - a.vehicleCount)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <header className="hero-ambient relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <SiteHeader variant="dark" showBadges />

        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div className="mt-10">
            <div className="fade-up max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Pan India coverage</p>
              <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-5xl">
                <span className="gradient-text">Ride Everywhere</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
                Explore pickup hubs across India with airport and city center options. From metro hubs to tier-2 cities, 
                instant pickup from airports and city centers.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-4 fade-up stagger-1">
              <HeroStatCard label="Total Cities" value={stats.totalCities.toString()} />
              <HeroStatCard label="Airport Hubs" value={stats.airportHubs.toString()} />
              <HeroStatCard label="Vehicles Available" value={`${stats.vehiclesAvailable}+`} />
              <HeroStatCard label="Avg. Pickup Time" value="15 min" />
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[var(--brand-cream)] text-black">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
          {/* Live Indicator Section */}
          <section className="accent-border rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">Live coverage</p>
                <h2 className="text-2xl font-semibold">We're everywhere you need us</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-2 text-xs">
                <span className="pulse-dot" aria-hidden="true" />
                Live inventory across {stats.totalCities} cities
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Priority city pages</p>
            <h2 className="mt-2 text-xl font-semibold">Top rental hubs</h2>
            <p className="mt-2 text-sm text-black/70">
              Quick access to our most important city landing pages for local searches.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link href="/cities/delhi-ncr" className="rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold transition hover:bg-black/5">
                Bike & car rental in Delhi NCR
              </Link>
              <Link href="/cities/noida" className="rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold transition hover:bg-black/5">
                Bike & car rental in Noida
              </Link>
              <Link href="/cities/phagwara" className="rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold transition hover:bg-black/5">
                Bike & car rental in Phagwara, Punjab
              </Link>
            </div>
          </section>

          {/* Search Section */}
          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold">Search your city</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type city name..."
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm transition-all focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-black/60">
                Found {filteredCities.length} {filteredCities.length === 1 ? "city" : "cities"}
              </p>
            )}
          </section>

          {/* Popular Cities Section */}
          {!searchQuery && (
            <section className="soft-grid rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">Top destinations</p>
                <h2 className="text-xl font-semibold">Popular cities</h2>
                <p className="mt-2 text-sm text-black/70">
                  High-demand locations with largest fleet selection and fastest pickup.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {popularCities.map((city) => {
                  return (
                    <PopularCityCard
                      key={city.displayName}
                      city={city}
                      vehicleTypes={city.vehicleTypes}
                      vehicleCount={city.vehicleCount}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* All Cities Grid */}
          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                {searchQuery ? "Search results" : "All cities"}
              </h2>
              <p className="mt-2 text-sm text-black/70">
                {searchQuery
                  ? `Showing results for "${searchQuery}"`
                  : "Complete list of service locations with vehicle availability"}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredCities.map((city) => {
                return (
                  <CityCard
                    key={city.displayName}
                    city={city}
                    vehicleTypes={city.vehicleTypes}
                    vehicleCount={city.vehicleCount}
                  />
                );
              })}
            </div>
            {filteredCities.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-black/60">No cities found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm font-semibold text-[var(--brand-red)] hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="glow-card rounded-3xl border border-black/10 bg-gradient-to-br from-white to-red-50/30 p-8 shadow-sm">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold">Can't find your city?</h2>
              <p className="mt-3 text-sm text-black/70">
                We're expanding fast. Request service in your area and we'll notify you when we launch.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/contact"
                  className="rounded-full bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 hover:shadow-xl"
                >
                  Request your city
                </a>
                <a
                  href="/nri-rentals"
                  className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold transition-all hover:bg-black/5 hover:scale-105"
                >
                  NRI rental info
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
      
      <SiteFooter />
    </div>
  );
}

function HeroStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function PopularCityCard({
  city,
  vehicleTypes,
  vehicleCount,
}: {
  city: CoverageCity;
  vehicleTypes: string[];
  vehicleCount: number;
}) {
  return (
    <div className="group rounded-2xl border border-black/10 bg-gradient-to-br from-white to-red-50/20 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-red-500/30">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{city.displayName}</h3>
          <p className="text-xs text-black/60">✈️ {city.airport}</p>
        </div>
        <span className="rounded-full bg-[var(--brand-red)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-red)]">
          Popular
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        <p className="text-xs font-medium text-green-700">{vehicleCount} vehicles available now</p>
      </div>
      <div className="mt-3">
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Vehicle types</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {vehicleTypes.length === 0 ? (
            <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs">
              Coming soon
            </span>
          ) : (
            vehicleTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium transition-all group-hover:border-red-500/30 group-hover:bg-red-50"
              >
                {type}
              </span>
            ))
          )}
        </div>
      </div>
      <a
        href={`/vehicles?city=${encodeURIComponent(city.displayName)}`}
        className="mt-4 block rounded-xl bg-[var(--brand-red)] px-4 py-2 text-center text-sm font-semibold text-white transition-all hover:bg-red-700"
      >
        Book in {city.name}
      </a>
      <a
        href={`/cities/${toCitySlug(city.name)}`}
        className="mt-2 block rounded-xl border border-black/15 px-4 py-2 text-center text-sm font-semibold transition hover:bg-black/5"
      >
        Bike rental in {city.name}
      </a>
    </div>
  );
}

function CityCard({
  city,
  vehicleTypes,
  vehicleCount,
}: {
  city: CoverageCity;
  vehicleTypes: string[];
  vehicleCount: number;
}) {
  const isAvailable = vehicleCount > 0;

  return (
    <div className="group rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-black/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{city.displayName}</p>
          <p className="text-xs text-black/60">✈️ {city.airport}</p>
        </div>
        {isAvailable && (
          <div className="h-2 w-2 rounded-full bg-green-500" aria-label="Available" />
        )}
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-black/50">Available vehicles</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {vehicleTypes.length === 0 ? (
          <span className="rounded-full border border-black/10 bg-black/5 px-2 py-1">
            Coming soon
          </span>
        ) : (
          vehicleTypes.map((type) => (
            <span
              key={type}
              className="rounded-full border border-black/10 bg-black/5 px-2 py-1 transition-all group-hover:bg-red-50 group-hover:border-red-500/30"
            >
              {type}
            </span>
          ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`/cities/${toCitySlug(city.name)}`}
          className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold transition hover:bg-black/5"
        >
          Bike rental in {city.name}
        </a>
        <a
          href={`/vehicles?city=${encodeURIComponent(city.displayName)}`}
          className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold transition hover:bg-black/5"
        >
          View vehicles
        </a>
      </div>
    </div>
  );
}
