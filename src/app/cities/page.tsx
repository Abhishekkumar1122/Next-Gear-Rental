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
    totalCities: 6,
    airportHubs: 3,
    vehiclesAvailable: 8,
    statesCovered: 4,
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
      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      <header className="hero-ambient relative overflow-hidden -mt-12 pt-12">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

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

      <div className="bg-[var(--brand-ink)] text-white">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
          {/* Live Indicator Section */}
          <section className="accent-border rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Live coverage</p>
                <h2 className="text-2xl font-semibold">We're everywhere you need us</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80">
                <span className="pulse-dot" aria-hidden="true" />
                Live inventory across {stats.totalCities} cities
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Priority city pages</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Top rental hubs</h2>
            <p className="mt-2 text-sm text-white/70">
              Quick access to our most important city landing pages for local searches.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link href="/cities/delhi-ncr" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 hover:border-white/30">
                Bike & car rental in Delhi NCR
              </Link>
              <Link href="/cities/noida" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 hover:border-white/30">
                Bike & car rental in Noida
              </Link>
              <Link href="/cities/phagwara" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 hover:border-white/30">
                Bike & car rental in Phagwara, Punjab
              </Link>
            </div>
          </section>

          {/* Search Section */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white transition-all duration-300">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold">Search your city</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type city name..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/30 transition-all focus:border-[var(--brand-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-white/60">
                Found {filteredCities.length} {filteredCities.length === 1 ? "city" : "cities"}
              </p>
            )}
          </section>

          {/* Popular Cities Section */}
          {!searchQuery && (
            <section className="fade-up md:border md:border-white/10 md:bg-white/[0.03] md:backdrop-blur-xl p-0 md:p-6 md:shadow-2xl text-white md:rounded-3xl">
              <div className="mb-3.5 sm:mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-extrabold text-[var(--brand-red)]">Top destinations</p>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">Popular cities</h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/70">
                    High-demand locations with largest fleet selection and fastest pickup.
                  </p>
                </div>
                <span className="md:hidden text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  👈 Swipe →
                </span>
              </div>

              {/* Mobile Circular City Story Avatars (< md:) */}
              <div className="md:hidden flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-3 pt-1 mb-2">
                {popularCities.map((city) => {
                  const img = getCityLandmarkImage(city.name);
                  return (
                    <a
                      key={city.displayName}
                      href={`/vehicles?city=${encodeURIComponent(city.displayName)}`}
                      className="flex flex-col items-center gap-1 shrink-0 group"
                    >
                      <div className="relative w-14 h-14 rounded-full border-2 border-red-500 bg-gradient-to-br from-red-600 to-amber-500 p-0.5 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-all duration-300">
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                          <img
                            src={img}
                            alt={`${city.name} Landmark`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white drop-shadow-md">{city.name.slice(0, 3).toUpperCase()}</span>
                          </div>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-neutral-950 flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                          {city.vehicleCount}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-white/90 group-hover:text-white transition-colors truncate max-w-[64px]">
                        {city.name}
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Responsive Cards: Horizontal Scroll Carousel (< md:), Grid on Desktop (md:) */}
              <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 pb-2 md:pb-0">
                {popularCities.map((city) => {
                  return (
                    <div key={city.displayName} className="min-w-[275px] sm:min-w-[310px] md:min-w-0 snap-center shrink-0 md:shrink">
                      <PopularCityCard
                        city={city}
                        vehicleTypes={city.vehicleTypes}
                        vehicleCount={city.vehicleCount}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Cities Grid */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                {searchQuery ? "Search results" : "All cities"}
              </h2>
              <p className="mt-2 text-sm text-white/70">
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
                <p className="text-sm text-white/60">No cities found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm font-semibold text-red-400 hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="glow-card rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-[10%] left-[5%] h-48 w-48 rounded-full bg-[var(--brand-red)]/10 blur-3xl pointer-events-none" />
            <div className="mx-auto max-w-2xl text-center relative z-10">
              <h2 className="text-2xl font-semibold">Can't find your city?</h2>
              <p className="mt-3 text-sm text-white/70">
                We're expanding fast. Request service in your area and we'll notify you when we launch.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/contact"
                  className="rounded-full bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 hover:bg-red-600 hover:shadow-red-600/40"
                >
                  Request your city
                </a>
                <a
                  href="/nri-rentals"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/5 hover:scale-105 hover:border-white/40"
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
  const [displayVal, setDisplayVal] = useState(0);
  const [hasNumber, setHasNumber] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");

  useEffect(() => {
    const match = value.match(/(\d+)/);
    if (!match) {
      setHasNumber(false);
      return;
    }
    setHasNumber(true);
    const target = parseInt(match[0], 10);
    const pre = value.substring(0, match.index);
    const suf = value.substring(match.index + match[0].length);
    setPrefix(pre);
    setSuffix(suf);

    const duration = 1200; // 1.2s count up duration
    const startTime = performance.now();
    let animFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Decelerating easeOutQuad progress curves
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(easeProgress * target);

      setDisplayVal(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayVal(target);
      }
    };

    animFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId);
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">
        {hasNumber ? `${prefix}${displayVal}${suffix}` : value}
      </p>
    </div>
  );
}

const CITY_IMAGE_MAP: Record<string, string> = {
  "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop&q=80",
  "delhi-ncr": "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop&q=80",
  "noida": "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80",
  "bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format&fit=crop&q=80",
  "bangalore": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format&fit=crop&q=80",
  "mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop&q=80",
  "hyderabad": "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=600&auto=format&fit=crop&q=80",
  "chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80",
  "jaipur": "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&auto=format&fit=crop&q=80",
  "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80",
  "pune": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&auto=format&fit=crop&q=80",
  "kochi": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80",
  "kerala": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80",
  "ahmedabad": "https://images.unsplash.com/photo-1609828913646-77894a8f3312?w=600&auto=format&fit=crop&q=80",
  "chandigarh": "https://images.unsplash.com/photo-1622308644420-b20142dc993c?w=600&auto=format&fit=crop&q=80",
  "phagwara": "https://images.unsplash.com/photo-1609946850022-790d96d2ff86?w=600&auto=format&fit=crop&q=80",
  "kolkata": "https://images.unsplash.com/photo-1558431382-27e303142255?w=600&auto=format&fit=crop&q=80",
  "lucknow": "https://images.unsplash.com/photo-1616847852358-1ec62e49c716?w=600&auto=format&fit=crop&q=80",
  "udaipur": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?w=600&auto=format&fit=crop&q=80",
  "visakhapatnam": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80",
};

export function getCityLandmarkImage(cityName: string): string {
  const key = cityName.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, url] of Object.entries(CITY_IMAGE_MAP)) {
    if (key.includes(k) || k.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80";
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
  const landmarkImg = getCityLandmarkImage(city.name);

  return (
    <div className="group relative rounded-2xl border border-white/15 bg-white/[0.04] overflow-hidden shadow-xl transition-all duration-300 hover:border-red-500/40 hover:shadow-red-500/15 hover:scale-[1.01]">
      {/* Top Landmark Image Banner */}
      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-neutral-900">
        <img
          src={landmarkImg}
          alt={`${city.displayName} Landmark`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/60 to-black/30" />
        
        {/* Popular Tag */}
        <span className="absolute top-2.5 right-2.5 rounded-full bg-red-950/80 border border-red-500/50 backdrop-blur-md px-2.5 py-0.5 text-[10px] sm:text-xs font-extrabold text-red-400 uppercase tracking-wider shadow-md">
          Popular
        </span>

        {/* Airport Hub Badge */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs">
          <p className="text-xs text-white/90 font-medium flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 truncate max-w-[210px] sm:max-w-none">
            <span>✈️</span> <span className="truncate">{city.airport}</span>
          </p>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-3.5 sm:p-5 pt-2">
        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-red-400 transition-colors">{city.displayName}</h3>

        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <p>{vehicleCount} vehicles available now</p>
        </div>

        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Vehicle Types</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {vehicleTypes.length === 0 ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/50">
                Coming soon
              </span>
            ) : (
              vehicleTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/90 capitalize transition-all group-hover:border-red-500/40 group-hover:bg-white/15"
                >
                  {type.toLowerCase() === 'bike' ? '🚲 Bike' : type.toLowerCase() === 'car' ? '🚗 Car' : type.toLowerCase() === 'scooty' ? '🛵 Scooty' : type}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <a
            href={`/vehicles?city=${encodeURIComponent(city.displayName)}`}
            className="block w-full rounded-xl bg-[var(--brand-red)] px-4 py-2 text-center text-xs sm:text-sm font-bold text-white transition-all hover:bg-red-600 shadow-md shadow-red-600/30 hover:scale-[1.01]"
          >
            Book in {city.name}
          </a>
          <a
            href={`/cities/${toCitySlug(city.name)}`}
            className="block w-full rounded-xl border border-white/20 hover:border-white/40 px-4 py-1.5 text-center text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            Bike rental in {city.name}
          </a>
        </div>
      </div>
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
  const landmarkImg = getCityLandmarkImage(city.name);

  return (
    <div className="group rounded-2xl border border-white/15 bg-white/[0.04] overflow-hidden shadow-xl transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.06]">
      {/* Top Mini Landmark Header */}
      <div className="relative h-20 w-full overflow-hidden bg-neutral-900">
        <img
          src={landmarkImg}
          alt={`${city.displayName} Landmark`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/50 to-transparent" />
        <div className="absolute bottom-1.5 left-3 right-3 flex items-center justify-between">
          <p className="text-xs font-bold text-white truncate drop-shadow-md">{city.displayName}</p>
          {isAvailable && (
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 sm:p-4 pt-2">
        <p className="text-xs text-white/60">✈️ {city.airport}</p>
        <p className="mt-2.5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Available Vehicles</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
          {vehicleTypes.length === 0 ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/50 text-[11px]">
              Coming soon
            </span>
          ) : (
            vehicleTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/90 capitalize transition-all group-hover:bg-white/15 group-hover:border-red-500/30"
              >
                {type.toLowerCase() === 'bike' ? '🚲 Bike' : type.toLowerCase() === 'car' ? '🚗 Car' : type.toLowerCase() === 'scooty' ? '🛵 Scooty' : type}
              </span>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <a
            href={`/cities/${toCitySlug(city.name)}`}
            className="flex-1 rounded-full border border-white/20 hover:border-white/40 px-3 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-white/10 truncate"
          >
            Bike rental
          </a>
          <a
            href={`/vehicles?city=${encodeURIComponent(city.displayName)}`}
            className="flex-1 rounded-full bg-[var(--brand-red)]/90 hover:bg-[var(--brand-red)] px-3 py-1.5 text-center text-xs font-bold text-white transition shadow-sm truncate"
          >
            Book Now
          </a>
        </div>
      </div>
    </div>
  );
}
