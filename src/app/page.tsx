import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BookVehicleButton } from "@/components/book-vehicle-button";
import { FloatingChatbot } from "@/components/floating-chatbot";
import { prisma } from "@/lib/prisma";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { vehicles } from "@/lib/mock-data";
import { bookingsStore } from "@/lib/store";
import { getTrendingRideMap } from "@/lib/trending-rides";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type HomeTrendingRide = {
  icon: string;
  title: string;
  meta: string;
  price: string;
  rating: string;
  booked: string;
  badge: string;
};

function getIconByType(type: string) {
  if (type.toLowerCase() === "car") return "🏎️";
  if (type.toLowerCase() === "bike") return "🏍️";
  if (type.toLowerCase() === "scooty") return "🛵";
  return "⚡";
}

function getDefaultBadge(index: number) {
  const badges = ["Most Popular", "Best Value", "Eco-Friendly"];
  return badges[index] ?? "Trending";
}

async function getHomeTrendingRides(): Promise<HomeTrendingRide[]> {
  const trendingMap = await getTrendingRideMap();

  if (process.env.DATABASE_URL) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const bookingCounts = await prisma.booking.groupBy({
      by: ["vehicleId"],
      where: {
        status: "CONFIRMED",
        createdAt: { gte: weekStart },
      },
      _count: {
        _all: true,
      },
    });

    const bookingCountMap = new Map<string, number>(
      bookingCounts.map((item) => [item.vehicleId, item._count._all])
    );

    const configured = Array.from(trendingMap.values()).sort((a, b) => a.rank - b.rank);
    const configuredIds = configured.map((item) => item.vehicleId);
    const selectedIds: string[] = [];

    for (const vehicleId of configuredIds) {
      if (!selectedIds.includes(vehicleId)) selectedIds.push(vehicleId);
      if (selectedIds.length === 3) break;
    }

    if (selectedIds.length < 3) {
      const fallbackVehicles = await prisma.vehicle.findMany({
        include: { city: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      const rankedFallback = [...fallbackVehicles].sort((a, b) => {
        const countA = bookingCountMap.get(a.id) ?? 0;
        const countB = bookingCountMap.get(b.id) ?? 0;
        if (countA !== countB) return countB - countA;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      for (const vehicle of rankedFallback) {
        if (selectedIds.includes(vehicle.id)) continue;
        selectedIds.push(vehicle.id);
        if (selectedIds.length === 3) break;
      }
    }

    const selectedVehicles = await prisma.vehicle.findMany({
      where: { id: { in: selectedIds } },
      include: { city: true },
    });

    const vehicleMap = new Map(selectedVehicles.map((vehicle) => [vehicle.id, vehicle]));

    return selectedIds
      .map((vehicleId, index) => {
        const vehicle = vehicleMap.get(vehicleId);
        if (!vehicle) return null;

        const weeklyBookings = bookingCountMap.get(vehicle.id) ?? 0;
        const effectivePrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
        const rating = (4.5 + Math.min(0.4, weeklyBookings * 0.03)).toFixed(1);
        const config = trendingMap.get(vehicle.id);

        return {
          icon: getIconByType(vehicle.type),
          title: vehicle.title,
          meta: `${vehicle.city.name} · ${vehicle.transmission === "automatic" ? "Auto" : "Manual"} · ${vehicle.seats} seats`,
          price: `INR ${effectivePrice.toLocaleString("en-IN")}/day`,
          rating,
          booked: weeklyBookings > 0 ? `${weeklyBookings} booked this week` : "New this week",
          badge: config?.badge || getDefaultBadge(index),
        };
      })
      .filter((item): item is HomeTrendingRide => item !== null);
  }

  const weekStartIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const bookingCountMap = new Map<string, number>();
  for (const booking of bookingsStore) {
    if (booking.status !== "confirmed") continue;
    if (booking.createdAt < weekStartIso) continue;
    bookingCountMap.set(booking.vehicleId, (bookingCountMap.get(booking.vehicleId) ?? 0) + 1);
  }

  const configuredIds = Array.from(trendingMap.values())
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.vehicleId);

  const selected = vehicles
    .slice()
    .sort((a, b) => {
      const countA = bookingCountMap.get(a.id) ?? 0;
      const countB = bookingCountMap.get(b.id) ?? 0;
      return countB - countA;
    })
    .slice(0, 10);

  const selectedIds = [...configuredIds, ...selected.map((vehicle) => vehicle.id)]
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 3);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  return selectedIds
    .map((vehicleId, index) => {
      const vehicle = vehicleMap.get(vehicleId);
      if (!vehicle) return null;

      const weeklyBookings = bookingCountMap.get(vehicle.id) ?? 0;
      const effectivePrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
      const rating = (vehicle.rating ?? 4.6).toFixed(1);
      const config = trendingMap.get(vehicle.id);

      return {
        icon: getIconByType(vehicle.type),
        title: vehicle.title,
        meta: `${vehicle.city} · ${vehicle.transmission === "automatic" ? "Auto" : "Manual"} · ${vehicle.seats} seats`,
        price: `INR ${effectivePrice.toLocaleString("en-IN")}/day`,
        rating,
        booked: weeklyBookings > 0 ? `${weeklyBookings} booked this week` : "New this week",
        badge: config?.badge || getDefaultBadge(index),
      };
    })
    .filter((item): item is HomeTrendingRide => item !== null);
}

export default async function Home() {
  const trendingRides = await getHomeTrendingRides();
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <header className="hero-ambient relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <SiteHeader variant="dark" showBadges />

        <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="mt-10 grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="font-display text-4xl uppercase tracking-wider md:text-5xl">
                <span className="inline-block opacity-0 animate-[fade-up_0.8s_ease_forwards]">
                  <span className="gradient-text">Next Gear Rentals</span>
                </span>
                <br />
                <span className="inline-block opacity-0 animate-[fade-up_0.8s_ease_0.3s_forwards]">
                  Ride <span className="text-glow">Anywhere</span> in India
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm text-white/75 md:text-base opacity-0 animate-[fade-up_0.8s_ease_0.5s_forwards]">
                Bike, car, and scooty rentals built for India-wide scale. Instant booking, verified fleets, and 24x7
                support wherever you land.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 opacity-0 animate-[fade-up_0.8s_ease_0.7s_forwards]">
                <BookVehicleButton />
                <Link href="/cities" className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:scale-105">
                  View Cities
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3 opacity-0 animate-[fade-up_0.8s_ease_0.9s_forwards]">
                <StatCard label="Active Cities" value="120+" />
                <StatCard label="Avg. Booking Time" value="2 min" />
                <StatCard label="Payment Success" value="98.4%" />
              </div>
            </div>

            <div className="fade-up stagger-1 p-2 transition-all duration-500 hover:scale-105">
              <Image
                src="/Logo1.png"
                alt="Next Gear wordmark"
                width={440}
                height={280}
                className="h-auto w-full object-contain transition-transform duration-500"
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Customer Promise</p>
                  <p className="mt-2 text-sm text-white/85">Verified vehicles, clear pricing, and instant confirmation.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">NRI Ready</p>
                  <p className="mt-2 text-sm text-white/85">Passport and IDP friendly rentals with global payments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
        {/* Premium Steps Section */}
        <section className="fade-up stagger-2 relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15 md:p-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
          <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚀</span>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">getting started</p>
            </div>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Ride in 3 simple steps</h2>
            <p className="mt-3 text-base text-white/70">Search your city, pick a vehicle, and get instant confirmation in minutes.</p>
            
            {/* Steps Grid */}
            <div className="mt-8 grid gap-6 md:grid-cols-3 relative">
              {/* Step 1 */}
              <div className="group relative">
                <div className="absolute -top-6 -left-4 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-red)] to-[var(--brand-red)]/80 text-white font-bold text-lg shadow-lg shadow-red-500/30 border-4 border-white/20">
                  1
                </div>
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-2 cursor-pointer">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-white">Search</h3>
                  <p className="text-sm text-white/70 mt-2">Choose your city, pick your travel dates, and select your desired vehicle type.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-[var(--brand-red)]" />
                    <span className="text-xs text-white/60 font-semibold">~2 minutes</span>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="group relative">
                <div className="absolute -top-6 -left-4 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-red)] to-[var(--brand-red)]/80 text-white font-bold text-lg shadow-lg shadow-red-500/30 border-4 border-white/20">
                  2
                </div>
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-2 cursor-pointer">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-white">Verify</h3>
                  <p className="text-sm text-white/70 mt-2">Upload your valid driving license and government ID. NRI? Use passport + IDP.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-[var(--brand-red)]" />
                    <span className="text-xs text-white/60 font-semibold">~3 minutes</span>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="group relative">
                <div className="absolute -top-6 -left-4 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-red)] to-[var(--brand-red)]/80 text-white font-bold text-lg shadow-lg shadow-red-500/30 border-4 border-white/20">
                  3
                </div>
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-2 cursor-pointer">
                  <div className="text-5xl mb-4">🚗</div>
                  <h3 className="text-lg font-semibold text-white">Go</h3>
                  <p className="text-sm text-white/70 mt-2">Get instant confirmation, unlock your vehicle, and start your journey with confidence.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-[var(--brand-red)]" />
                    <span className="text-xs text-white/60 font-semibold">Ready now</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 rounded-xl border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/[0.08] p-4 flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-sm font-semibold text-white">Total time: ~5 minutes</p>
                <p className="text-xs text-white/70">From search to unlock. We make it fast and simple.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up stagger-3 rounded-2xl border border-white/15 bg-white/5 p-6 shadow-lg shadow-red-500/10">
          <h2 className="text-xl font-semibold text-white">Fleet built for every trip</h2>
          <p className="mt-2 text-sm text-white/70">Choose from premium cars, city bikes, and scooty options.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DarkFeatureCard icon="🏍️" title="City Bikes" description="Easy pickups, fuel-efficient, and quick support." />
            <DarkFeatureCard icon="🚙" title="Comfort Cars" description="Air-conditioned, insured, and road-trip ready." />
            <DarkFeatureCard icon="🛵" title="Scooty" description="Quick commutes with helmet and add-on coverage." />
          </div>
        </section>

        <section className="accent-border relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl shadow-red-500/15 md:p-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/5 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" aria-hidden="true" />
          
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-red)]">Live demand 🔥</p>
              <h2 className="text-2xl font-semibold text-white mt-2">Trending rides this week</h2>
              <p className="mt-2 text-sm text-white/70">High-demand picks across top cities, updated daily.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 px-4 py-2 text-xs text-white font-semibold">
              <span className="pulse-dot bg-[var(--brand-red)]" aria-hidden="true" />
              Live inventory
            </div>
          </div>
          
          <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-3">
            {trendingRides.map((ride) => (
              <PremiumRideCard
                key={`${ride.title}-${ride.badge}`}
                icon={ride.icon}
                title={ride.title}
                meta={ride.meta}
                price={ride.price}
                rating={ride.rating}
                booked={ride.booked}
                badge={ride.badge}
              />
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/8 to-white/3 p-8 shadow-lg shadow-red-500/10 md:p-10">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
          <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Why choose us</p>
            </div>
            <h2 className="text-2xl font-semibold text-white">Why riders love Next Gear</h2>
            <p className="mt-2 text-sm text-white/70">Transparent pricing, verified fleets, and reliable support.</p>
            
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="group rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 transition-all duration-300 hover:border-[var(--brand-red)]/50 hover:bg-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-red)]/20 text-lg mb-3">💰</div>
                <p className="text-sm font-semibold text-white">Transparent pricing</p>
                <p className="text-xs text-white/60 mt-2">No hidden fees. Pay only for what you ride.</p>
              </div>
              
              <div className="group rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 transition-all duration-300 hover:border-[var(--brand-red)]/50 hover:bg-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-red)]/20 text-lg mb-3">🔒</div>
                <p className="text-sm font-semibold text-white">Verified vehicles</p>
                <p className="text-xs text-white/60 mt-2">Every vehicle passes a safety and quality check.</p>
              </div>
              
              <div className="group rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 transition-all duration-300 hover:border-[var(--brand-red)]/50 hover:bg-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-red)]/20 text-lg mb-3">📞</div>
                <p className="text-sm font-semibold text-white">24x7 support</p>
                <p className="text-xs text-white/60 mt-2">Instant help across booking, pickup, and returns.</p>
              </div>
            </div>
          </div>
        </section>

          {/* Premium CTA Section */}
          <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[var(--brand-red)]/20 via-white/5 to-white/5 p-8 shadow-2xl shadow-red-500/20 md:p-12">
            <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[var(--brand-red)]/10 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" aria-hidden="true" />
            
            <div className="relative z-10 grid gap-6 md:gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-red)]">Your next adventure awaits</p>
                <h2 className="mt-3 font-display text-3xl uppercase tracking-wider md:text-4xl">
                  Ready to <span className="gradient-text">Ride?</span>
                </h2>
                <p className="mt-4 max-w-md text-base text-white/80">
                  Join thousands of travelers who trust Next Gear for their vehicle needs. Book in seconds,
                  ride with confidence.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <BookVehicleButton className="rounded-full bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl" />
                  <Link href="/cities" className="flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:scale-105">
                    Explore Cities
                  </Link>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="group rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-red-500/10">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-lg bg-[var(--brand-red)]/20 flex items-center justify-center text-[var(--brand-red)] font-bold text-lg">⚡</div>
                    <div>
                      <p className="text-sm font-semibold text-white">Instant Booking</p>
                      <p className="mt-1 text-xs text-white/60">Confirmation within seconds</p>
                    </div>
                  </div>
                </div>
                
                <div className="group rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-red-500/10">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-lg bg-[var(--brand-red)]/20 flex items-center justify-center text-[var(--brand-red)] font-bold text-lg">🛡️</div>
                    <div>
                      <p className="text-sm font-semibold text-white">Fully Insured</p>
                      <p className="mt-1 text-xs text-white/60">Comprehensive coverage included</p>
                    </div>
                  </div>
                </div>
                
                <div className="group rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-red-500/10">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-lg bg-[var(--brand-red)]/20 flex items-center justify-center text-[var(--brand-red)] font-bold text-lg">🌍</div>
                    <div>
                      <p className="text-sm font-semibold text-white">120+ Cities</p>
                      <p className="mt-1 text-xs text-white/60">Nationwide coverage available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Alternating Section with Gaps */}
          <div className="space-y-8">
            {/* Gap 1 */}
            <div />

            {/* Section 1 - Testimonials */}
            <section className="soft-grid rounded-3xl border border-white/15 bg-white/5 p-6 shadow-lg shadow-red-500/10">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Loved by frequent riders</h2>
                  <p className="mt-2 text-sm text-white/70">Reliable vehicles, quick support, and stress-free booking.</p>
                  <div className="mt-4 grid gap-3">
                    <DarkTestimonialCard
                      quote="Picked up a clean car in 10 minutes. Support was quick and helpful."
                      name="Aarav, Bengaluru"
                    />
                    <DarkTestimonialCard
                      quote="NRI process was smooth with passport + IDP. Highly recommended."
                      name="Neha, Dubai"
                    />
                  </div>
                </div>
                <div className="glow-card rounded-2xl border border-white/15 bg-white/5 p-5 shadow-lg shadow-red-500/10">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Weekly snapshot</p>
                  <div className="mt-3 space-y-3 text-sm">
                    <DarkStatLine label="Bookings completed" value="4,820" />
                    <DarkStatLine label="Avg. rating" value="4.8/5" />
                    <DarkStatLine label="Repeat customers" value="62%" />
                    <DarkStatLine label="Avg. response time" value="2 min" />
                  </div>
                </div>
              </div>
            </section>

            {/* Gap 2 */}
            <div />

            {/* Section 2 - FAQ Preview */}
            <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15 md:p-10">
              <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
              <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">❓</span>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Quick answers</p>
                </div>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-white md:text-4xl">Frequently Asked</h2>
                  <p className="mt-2 text-base text-white/70">Get answers to common questions about our rental process, policies, and services.</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* FAQ Card 1 */}
                  <div className="group relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-3xl">📋</div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-white">What documents do I need?</p>
                        <p className="mt-2 text-sm text-white/70">Valid driving license + 2 photo ID proofs. For NRIs: passport + IDP.</p>
                      </div>
                    </div>
                    <div className="h-0.5 w-10 rounded-full bg-[var(--brand-red)] group-hover:w-14 transition-all duration-300" />
                  </div>
                  
                  {/* FAQ Card 2 */}
                  <div className="group relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-3xl">⛽</div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-white">Is fuel included?</p>
                        <p className="mt-2 text-sm text-white/70">You get the vehicle with a full tank. Return with a full tank to avoid charges.</p>
                      </div>
                    </div>
                    <div className="h-0.5 w-10 rounded-full bg-[var(--brand-red)] group-hover:w-14 transition-all duration-300" />
                  </div>
                  
                  {/* FAQ Card 3 */}
                  <div className="group relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-3xl">📅</div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-white">Can I extend my booking?</p>
                        <p className="mt-2 text-sm text-white/70">Yes! Extend through the app anytime. Subject to vehicle availability.</p>
                      </div>
                    </div>
                    <div className="h-0.5 w-10 rounded-full bg-[var(--brand-red)] group-hover:w-14 transition-all duration-300" />
                  </div>
                  
                  {/* FAQ Card 4 */}
                  <div className="group relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-3xl">🚨</div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-white">What if I break down?</p>
                        <p className="mt-2 text-sm text-white/70">24x7 roadside assistance. We'll arrange a replacement or recovery.</p>
                      </div>
                    </div>
                    <div className="h-0.5 w-10 rounded-full bg-[var(--brand-red)] group-hover:w-14 transition-all duration-300" />
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-between rounded-xl border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/[0.08] px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Still have questions?</p>
                    <p className="text-xs text-white/70 mt-1">Browse our complete FAQ section for detailed answers.</p>
                  </div>
                  <a href="/faq" className="shrink-0 rounded-full border border-[var(--brand-red)]/50 bg-[var(--brand-red)]/20 px-6 py-2.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-[var(--brand-red)] hover:border-[var(--brand-red)] hover:shadow-lg hover:shadow-red-500/30">
                    View All FAQs →
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      <SiteFooter />
        <FloatingChatbot />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ModelCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="group rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-black/20">
      <div className="h-1 w-10 rounded-full bg-[var(--brand-red)] transition-all duration-300 group-hover:w-16" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-sm text-black/70">{description}</p>
    </div>
  );
}

function DarkModelCard({ icon, title, description }: { icon?: string; title: string; description: string }) {
  return (
    <div className="group rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-white/25 hover:bg-white/10">
      <div className="h-1 w-10 rounded-full bg-[var(--brand-red)] transition-all duration-300 group-hover:w-16" />
      {icon && <p className="mt-2 text-2xl">{icon}</p>}
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-white/70">{description}</p>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-black/[0.02] hover:border-black/20">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-black/70">{description}</p>
    </div>
  );
}

function DarkFeatureCard({ icon, title, description }: { icon?: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white/10 hover:border-white/25">
      {icon && <p className="text-2xl">{icon}</p>}
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-white/70">{description}</p>
    </div>
  );
}

function RideCard({ title, meta, price }: { title: string; meta: string; price: string }) {
  return (
    <div className="group rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-red-500/30 hover:bg-red-50/30">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-black/70">{meta}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--brand-red)]">{price}</p>
      <button className="mt-3 rounded-full border border-black/10 px-4 py-1 text-xs font-semibold transition-all duration-300 group-hover:bg-[var(--brand-red)] group-hover:text-white group-hover:border-[var(--brand-red)]">
        View availability
      </button>
    </div>
  );
}

function DarkRideCard({ title, meta, price }: { title: string; meta: string; price: string }) {
  return (
    <div className="group rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/30 hover:bg-white/10">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-white/70">{meta}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--brand-red)]">{price}</p>
      <button className="mt-3 rounded-full border border-white/15 px-4 py-1 text-xs font-semibold text-white transition-all duration-300 group-hover:bg-[var(--brand-red)] group-hover:border-[var(--brand-red)]">
        View availability
      </button>
    </div>
  );
}

function PremiumRideCard({ 
  icon, 
  title, 
  meta, 
  price, 
  rating, 
  booked, 
  badge 
}: { 
  icon: string;
  title: string; 
  meta: string; 
  price: string;
  rating: string;
  booked: string;
  badge: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/12 to-white/4 p-5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/20 hover:border-[var(--brand-red)]/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-red)]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-block rounded-full bg-[var(--brand-red)] text-white text-xs font-bold px-3 py-1">
          {badge}
        </span>
      </div>
      
      <div className="relative z-1">
        <div className="text-4xl mb-3">{icon}</div>
        
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="text-xs text-white/60 mt-1">{meta}</p>
        
        {/* Rating and Booking Info */}
        <div className="flex items-center gap-3 mt-3 py-2 border-t border-b border-white/10">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">⭐</span>
            <span className="text-xs text-white font-semibold">{rating}/5</span>
          </div>
          <div className="text-xs text-white/60">
            {booked}
          </div>
        </div>
        
        {/* Price and CTA */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--brand-red)]">{price}</p>
          <Link
            href="/book-vehicle"
            className="rounded-full bg-[var(--brand-red)] text-white text-xs font-semibold px-3 py-1.5 transition-all duration-300 hover:bg-[var(--brand-red)]/90 hover:scale-105 shadow-lg shadow-red-500/30"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name }: { quote: string; name: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-black/20 hover:bg-black/[0.02]">
      <p className="text-sm text-black/70">“{quote}”</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">{name}</p>
    </div>
  );
}
function DarkTestimonialCard({ quote, name }: { quote: string; name: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-white/25 hover:bg-white/10">
      <p className="text-sm text-white/70">\"{ quote }\"</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">{name}</p>
    </div>
  );
}
function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 transition-all duration-300 hover:bg-black/[0.05] hover:border-black/20 hover:scale-[1.02]">
      <span className="text-xs uppercase tracking-[0.2em] text-black/50">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function DarkStatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:scale-[1.02]">
      <span className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
