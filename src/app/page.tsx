import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BookVehicleButton } from "@/components/book-vehicle-button";
import { FloatingChatbot } from "@/components/floating-chatbot";
import { HomeInventoryShowcase } from "@/components/home-inventory-showcase";
import { AnimatedStepsSection } from "@/components/animated-steps-section";
import { AnimatedTrendingRides } from "@/components/animated-trending-rides";
import AnimatedCtaSection from "@/components/animated-cta-section";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { PromoPopup } from "@/components/promo-popup";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { getTrendingRideMap } from "@/lib/trending-rides";
import { getSiteSettings } from "@/lib/site-settings";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Search, ShieldCheck, KeyRound, Clock, HelpCircle, FileText, Fuel, Calendar, AlertCircle, Bike, Car, Zap, Flame, BadgePercent, Headphones, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return {
    title: settings.seoTitle || "Next Gear Rentals – Ride Anywhere in India",
    description: settings.seoDescription || "Next Gear Rentals - Pan India self-drive bike, car, and scooty rental service. Instant booking, verified fleets.",
  };
}

type HomeTrendingRide = {
  id: string;
  city: string;
  icon: string;
  image: string;
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

function getVehicleImage(title: string, type: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerType = type.toLowerCase();
  
  if (lowerTitle.includes("i20") || lowerTitle.includes("hyundai")) {
    return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";
  }
  if (lowerTitle.includes("hunter") || lowerTitle.includes("enfield") || lowerTitle.includes("bullet") || lowerTitle.includes("classic")) {
    return "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop";
  }
  if (lowerTitle.includes("thar") || lowerTitle.includes("suv") || lowerTitle.includes("fortuner") || lowerTitle.includes("creta")) {
    return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop";
  }
  if (lowerTitle.includes("activa") || lowerTitle.includes("scooty") || lowerTitle.includes("jupiter") || lowerTitle.includes("vespa")) {
    return "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop";
  }
  if (lowerType === "car") {
    return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";
  }
  if (lowerType === "scooty") {
    return "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop";
}

async function getHomeTrendingRidesUncached(): Promise<HomeTrendingRide[]> {
  const trendingMap = await getTrendingRideMap();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // Optimized: Single query to get all vehicles with their booking counts
  const vehiclesWithBookings = await prisma.vehicle.findMany({
    include: {
      city: true,
      _count: {
        select: {
          bookings: {
            where: {
              status: "CONFIRMED",
              createdAt: { gte: weekStart },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Get top 50, we'll filter to 3
  });

  // Build booking count map
  const bookingCountMap = new Map<string, number>();
  vehiclesWithBookings.forEach((vehicle) => {
    bookingCountMap.set(vehicle.id, vehicle._count.bookings);
  });

  const configured = Array.from(trendingMap.values()).sort((a, b) => a.rank - b.rank);
  const configuredIds = configured.map((item) => item.vehicleId);
  const selectedIds: string[] = [];

  // Add configured vehicles first
  for (const vehicleId of configuredIds) {
    if (!selectedIds.includes(vehicleId)) selectedIds.push(vehicleId);
    if (selectedIds.length === 3) break;
  }

  // Fill gaps with highest booked vehicles
  if (selectedIds.length < 3) {
    const rankedByBookings = vehiclesWithBookings.sort((a, b) => {
      const countA = bookingCountMap.get(a.id) ?? 0;
      const countB = bookingCountMap.get(b.id) ?? 0;
      if (countA !== countB) return countB - countA;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    for (const vehicle of rankedByBookings) {
      if (selectedIds.includes(vehicle.id)) continue;
      selectedIds.push(vehicle.id);
      if (selectedIds.length === 3) break;
    }
  }

  const vehicleMap = new Map(vehiclesWithBookings.map((vehicle) => [vehicle.id, vehicle]));

  return selectedIds
    .map((vehicleId, index) => {
      const vehicle = vehicleMap.get(vehicleId);
      if (!vehicle) return null;

      const weeklyBookings = bookingCountMap.get(vehicle.id) ?? 0;
      const effectivePrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
      const rating = (4.5 + Math.min(0.4, weeklyBookings * 0.03)).toFixed(1);
      const config = trendingMap.get(vehicle.id);

      return {
        id: vehicle.id,
        city: vehicle.city.name,
        icon: getIconByType(vehicle.type),
        image: getVehicleImage(vehicle.title, vehicle.type),
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

// Wrap with server-side caching to prevent repeated database calls
const getHomeTrendingRides = unstable_cache(
  async () => getHomeTrendingRidesUncached(),
  ["home-trending-rides"],
  { revalidate: 60, tags: ["trending-rides"] }
);

export default async function Home() {
  const [trendingRides, siteSettings] = await Promise.all([
    getHomeTrendingRides(),
    getSiteSettings(),
  ]);

  // Maintenance mode redirect
  if (siteSettings.maintenanceMode === "true") {
    redirect("/maintenance");
  }

  // Dynamic Content Collections
  const heroTitleText = siteSettings.heroTitle || "Next Gear Rentals\nRide Anywhere in India";
  const heroLines = heroTitleText.split("\n");

  const testimonials = [
    {
      name: siteSettings.testimonial1Name || "Aarav, Bengaluru",
      text: siteSettings.testimonial1Text || "Picked up a clean car in 10 minutes. Support was quick and helpful."
    },
    {
      name: siteSettings.testimonial2Name || "Neha, Dubai",
      text: siteSettings.testimonial2Text || "NRI process was smooth with passport + IDP. Highly recommended."
    },
    {
      name: siteSettings.testimonial3Name || "Rahul, Delhi",
      text: siteSettings.testimonial3Text || "Amazing experience. The vehicle was perfectly maintained."
    }
  ].filter(t => t.name && t.text);

  const faqs = [
    {
      q: siteSettings.faq1Question || "What documents do I need?",
      a: siteSettings.faq1Answer || "Valid driving license + 2 photo ID proofs. For NRIs: passport + IDP."
    },
    {
      q: siteSettings.faq2Question || "Is fuel included?",
      a: siteSettings.faq2Answer || "You get the vehicle with a full tank. Return with a full tank to avoid charges."
    },
    {
      q: siteSettings.faq3Question || "Can I extend my booking?",
      a: siteSettings.faq3Answer || "Yes! Extend through the app anytime. Subject to vehicle availability."
    }
  ].filter(f => f.q && f.a);

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <AnnouncementBanner />
      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      {siteSettings.sectionHeroActive !== "false" && (
        <header className="hero-ambient relative overflow-hidden -mt-12 pt-12">
          <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-[var(--brand-red)]/25 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
            <div className="mt-10 grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
              <div>
                <h1 className="font-display text-4xl uppercase tracking-wider md:text-5xl leading-[1.08]">
                  {heroLines.map((line, idx) => (
                    <span 
                      key={idx}
                      className="block opacity-0 animate-[fade-up_0.8s_ease_forwards]"
                      style={{ animationDelay: `${idx * 0.3}s` }}
                    >
                      {idx === 0 ? (
                        <span className="gradient-text">{line}</span>
                      ) : (
                        <span>
                          {line.toLowerCase().includes("anywhere") ? (
                            <>
                              {line.split(/anywhere/i)[0]}
                              <span className="text-glow">Anywhere</span>
                              {line.split(/anywhere/i)[1]}
                            </>
                          ) : (
                            line
                          )}
                        </span>
                      )}
                    </span>
                  ))}
                </h1>
                <p className="mt-4 max-w-xl text-sm text-white/75 md:text-base opacity-0 animate-[fade-up_0.8s_ease_0.5s_forwards]">
                  {siteSettings.heroSubtitle || "Bike, car, and scooty rentals built for India-wide scale. Instant booking, verified fleets, and 24x7 support wherever you land."}
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


            <div className="fade-up stagger-1 p-2 pt-4 md:pt-8 flex flex-col items-center justify-center">
              <Image
                src="/next-gear-full-transparent-badge-v2.png"
                alt="Next Gear Official Brand Logo"
                width={666}
                height={522}
                className="h-auto max-w-[290px] sm:max-w-[360px] md:max-w-[440px] w-full object-contain drop-shadow-[0_6px_16px_rgba(220,38,38,0.06)] transition-all duration-500 hover:scale-[1.03]"
                priority
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
      )}

      {/* Live Inventory Showcase Section - Clean Dark Black Background */}
      {siteSettings.sectionFeaturedActive !== "false" && (
        <section className="relative overflow-hidden border-t border-b border-white/10 py-10 md:py-14">
          <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
            <HomeInventoryShowcase />
          </div>
        </section>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
        {/* Sequential Step-by-Step Flow Animation Section */}
        <AnimatedStepsSection />

        {/* Fleet Built For Every Trip (Compact & Small on Mobile, Unchanged on Desktop) */}
        {siteSettings.sectionFeaturedActive !== "false" && (
          <>
            <section className="fade-up stagger-3 relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/15 bg-[#0d0d0d] p-3.5 sm:p-5 md:p-8 shadow-2xl shadow-red-500/15">
              <div className="relative z-10 space-y-2.5 md:space-y-4">
                <div>
                  <h2 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wider text-white">
                    Fleet built for <span className="gradient-text">every trip</span>
                  </h2>
                  <p className="mt-0.5 md:mt-1 text-[11px] sm:text-xs md:text-sm text-white/70">Choose from premium cars, city bikes, and scooty options.</p>
                </div>
                
                <div className="grid gap-2.5 sm:gap-3.5 md:gap-4 md:grid-cols-3">
                  <div className="group relative rounded-xl md:rounded-2xl border border-white/15 bg-white/[0.04] p-3 sm:p-4 md:p-5 transition-all duration-300 hover:border-red-500/50 hover:bg-gradient-to-b hover:from-red-950/40 hover:to-[#0d0d0d] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Bike className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-white uppercase tracking-wide">City Bikes</p>
                    <p className="text-[10px] sm:text-xs text-white/60 mt-1 md:mt-1.5 leading-normal md:leading-relaxed">Easy pickups, fuel-efficient, and quick support.</p>
                  </div>

                  <div className="group relative rounded-xl md:rounded-2xl border border-white/15 bg-white/[0.04] p-3 sm:p-4 md:p-5 transition-all duration-300 hover:border-red-500/50 hover:bg-gradient-to-b hover:from-red-950/40 hover:to-[#0d0d0d] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Car className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-white uppercase tracking-wide">Comfort Cars</p>
                    <p className="text-[10px] sm:text-xs text-white/60 mt-1 md:mt-1.5 leading-normal md:leading-relaxed">Air-conditioned, insured, and road-trip ready.</p>
                  </div>

                  <div className="group relative rounded-xl md:rounded-2xl border border-white/15 bg-white/[0.04] p-3 sm:p-4 md:p-5 transition-all duration-300 hover:border-red-500/50 hover:bg-gradient-to-b hover:from-red-950/40 hover:to-[#0d0d0d] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-white uppercase tracking-wide">Scooty</p>
                    <p className="text-[10px] sm:text-xs text-white/60 mt-1 md:mt-1.5 leading-normal md:leading-relaxed">Quick commutes with helmet and add-on coverage.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Animated Trending Rides Section */}
            <AnimatedTrendingRides rides={trendingRides} />
          </>
        )}

        {/* Why Riders Love Next Gear (Sleek List Row Layout on Mobile, Cards on Desktop) */}
        {siteSettings.sectionWhyChooseActive !== "false" && (
          <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/15 bg-gradient-to-br from-white/8 to-white/3 p-4 sm:p-6 md:p-10 shadow-lg shadow-red-500/10">
            <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
            <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 md:mb-4">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/50">Why choose us</p>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white md:font-semibold">
                Why riders love <span className="gradient-text">Next Gear</span>
              </h2>
              <p className="mt-1 md:mt-2 text-xs md:text-sm text-white/70">Transparent pricing, verified fleets, and reliable support.</p>
              
              {/* Mobile View: Sleek Inline Row List (No Card Boxes!) | Desktop View: 3-Column Cards */}
              <div className="mt-4 md:mt-6 flex flex-col md:grid md:grid-cols-3 gap-2.5 md:gap-4">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 p-2.5 md:p-5 border-b border-white/10 md:border-white/15 md:rounded-2xl md:bg-gradient-to-br md:from-white/[0.08] md:to-white/[0.02] transition-all duration-300 hover:border-red-500/50 hover:bg-white/10 cursor-pointer group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                    <BadgePercent className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-white md:font-semibold">Transparent pricing</p>
                    <p className="text-[11px] md:text-xs text-white/60 mt-0.5 md:mt-2 leading-normal">No hidden fees. Pay only for what you ride.</p>
                  </div>
                </div>
                
                {/* Feature 2 */}
                <div className="flex items-start gap-3 p-2.5 md:p-5 border-b border-white/10 md:border-white/15 md:rounded-2xl md:bg-gradient-to-br md:from-white/[0.08] md:to-white/[0.02] transition-all duration-300 hover:border-red-500/50 hover:bg-white/10 cursor-pointer group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-white md:font-semibold">Verified vehicles</p>
                    <p className="text-[11px] md:text-xs text-white/60 mt-0.5 md:mt-2 leading-normal">Every vehicle passes a safety & quality check.</p>
                  </div>
                </div>
                
                {/* Feature 3 */}
                <div className="flex items-start gap-3 p-2.5 md:p-5 md:border-white/15 md:rounded-2xl md:bg-gradient-to-br md:from-white/[0.08] md:to-white/[0.02] transition-all duration-300 hover:border-red-500/50 hover:bg-white/10 cursor-pointer group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                    <Headphones className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-white md:font-semibold">24x7 support</p>
                    <p className="text-[11px] md:text-xs text-white/60 mt-0.5 md:mt-2 leading-normal">Instant help across booking, pickup, and returns.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

          {/* Premium Animated CTA Section */}
          <AnimatedCtaSection />

          {/* Alternating Section with Gaps */}
          <div className="space-y-8">
            {/* Gap 1 */}
            <div />

            {/* Section 1 - Loved by Frequent Riders */}
            {siteSettings.sectionTestimonialsActive !== "false" && testimonials.length > 0 && (
              <section className="fade-up relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/15 bg-[#0d0d0d] p-3.5 sm:p-5 md:p-8 shadow-2xl shadow-red-500/15">
                <div className="grid gap-3.5 md:gap-6 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white">
                        Loved by <span className="gradient-text">frequent riders</span>
                      </h2>
                      <p className="mt-0.5 md:mt-1 text-[11px] sm:text-xs md:text-sm text-white/70">Reliable vehicles, quick support, and stress-free booking.</p>
                    </div>
                    <div className="grid gap-2.5 sm:gap-3">
                      {testimonials.map((t, index) => (
                        <DarkTestimonialCard
                          key={index}
                          quote={t.text}
                          name={t.name}
                          rating={5}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl md:rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 sm:p-5 transition-all duration-300 hover:border-red-500/30">
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-extrabold text-[var(--brand-red)]">Weekly snapshot</p>
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[9px] sm:text-[10px] text-emerald-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                      </span>
                    </div>
                    <div className="space-y-2 sm:space-y-2.5">
                      <DarkStatLine label="Bookings completed" value="4,820+" />
                      <DarkStatLine label="Avg. rating" value="4.8 ★" />
                      <DarkStatLine label="Repeat customers" value="62%" />
                      <DarkStatLine label="Avg. response time" value="2 min" />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Gap 2 */}
              {/* Section 2 - FAQ Preview (UNBOXED Section with Left-Side Ambient Red Glow) */}
            {siteSettings.sectionFaqActive !== "false" && faqs.length > 0 && (
              <section className="relative space-y-3.5 sm:space-y-4 md:space-y-6 py-2">
                {/* Ambient Red Background Glow emanating from LEFT SIDE */}
                <div className="absolute -left-36 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.14] blur-3xl pointer-events-none" aria-hidden="true" />

                <div className="relative z-10 space-y-3 sm:space-y-4 md:space-y-6">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <HelpCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-500 animate-pulse" />
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-extrabold text-[var(--brand-red)]">Quick answers</p>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-white">
                      Frequently <span className="gradient-text">Asked</span>
                    </h2>
                    <p className="mt-0.5 md:mt-1 text-[11px] sm:text-xs md:text-sm text-white/70">Get answers to common questions about our rental process, policies, and services.</p>
                  </div>
                  
                  <div className="grid gap-2.5 sm:gap-3 md:gap-4 md:grid-cols-2">
                    {faqs.map((faq, index) => {
                      const iconColor = index === 0 ? "text-red-400" : index === 1 ? "text-amber-400" : "text-emerald-400";
                      return (
                        <div key={index} className="group relative rounded-xl md:rounded-2xl border border-white/15 bg-[#0d0d0d] p-3 sm:p-4 md:p-6 transition-all duration-300 hover:border-red-500/50 hover:bg-gradient-to-br hover:from-red-950/30 hover:to-[#0d0d0d] hover:shadow-lg hover:shadow-red-500/10 cursor-pointer">
                          <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4 mb-2 md:mb-3">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center ${iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm md:text-base font-bold text-white uppercase tracking-wide">{faq.q}</p>
                              <p className="mt-0.5 md:mt-1.5 text-[10px] sm:text-xs md:text-sm text-white/60 leading-tight sm:leading-normal md:leading-relaxed">{faq.a}</p>
                            </div>
                          </div>
                          <div className="h-0.5 w-6 sm:w-8 md:w-10 rounded-full bg-[var(--brand-red)] group-hover:w-12 md:group-hover:w-16 transition-all duration-300" />
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl md:rounded-2xl border border-red-500/30 bg-[#0d0d0d] p-3 sm:px-5 sm:py-4 md:px-6 md:py-5 gap-2 sm:gap-3 hover:border-red-500/50 transition-all duration-300">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">Still have questions?</p>
                      <p className="text-[10px] sm:text-xs text-white/60 mt-0.5">Browse our complete FAQ section for detailed answers.</p>
                    </div>
                    <a href="/faq" className="shrink-0 rounded-full bg-[var(--brand-red)] px-3.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-[11px] sm:text-xs font-bold text-white transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-md shadow-red-600/30">
                      View All FAQs →
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <FloatingChatbot />
      </Suspense>
      <PromoPopup />
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
  image,
  title, 
  meta, 
  price, 
  rating, 
  booked, 
  badge 
}: { 
  icon: string;
  image?: string;
  title: string; 
  meta: string; 
  price: string;
  rating: string;
  booked: string;
  badge: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/20 bg-[#0d0d0d] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/20 hover:border-[var(--brand-red)]/50 overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-red)]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div>
        {/* Real Vehicle Image / Photo Banner */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black/40">
          {image ? (
            <img 
              src={image} 
              alt={title} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">{icon}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30 pointer-events-none" />
          
          {/* Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-block rounded-full bg-[var(--brand-red)] text-white text-xs font-extrabold px-3 py-1 shadow-md shadow-red-600/40">
              {badge}
            </span>
          </div>
        </div>
        
        {/* Content Details */}
        <div className="p-4 sm:p-5">
          <p className="text-base font-bold text-white uppercase tracking-wide">{title}</p>
          <p className="text-xs text-white/60 mt-1">{meta}</p>
          
          {/* Rating and Booking Info */}
          <div className="flex items-center gap-3 mt-3 py-2 border-t border-b border-white/10">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-xs text-white font-semibold">{rating}/5</span>
            </div>
            <div className="text-xs text-white/60">
              {booked}
            </div>
          </div>
          
          {/* Price and CTA */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--brand-red)]">{price}</p>
            <Link
              href="/vehicles"
              className="rounded-full bg-[var(--brand-red)] text-white text-xs font-semibold px-4 py-1.5 transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-lg shadow-red-500/30"
            >
              Book Now
            </Link>
          </div>
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
function DarkTestimonialCard({ quote, name, rating = 5 }: { quote: string; name: string; rating?: number }) {
  return (
    <div className="group rounded-xl md:rounded-2xl border border-white/15 bg-white/[0.04] p-3 sm:p-4.5 transition-all duration-300 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-950/30 hover:to-white/[0.06] hover:shadow-lg hover:shadow-red-500/10">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <span key={i} className="text-amber-400 text-[10px] sm:text-xs">★</span>
          ))}
        </div>
        <span className="text-[9px] uppercase tracking-[0.15em] font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Verified Rider
        </span>
      </div>
      <p className="text-xs sm:text-sm text-white/85 leading-snug sm:leading-relaxed italic">“{quote}”</p>
      <p className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/50">{name}</p>
    </div>
  );
}

function DarkStatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg md:rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 transition-all duration-300 hover:bg-white/[0.08] hover:border-red-500/30 hover:scale-[1.01]">
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/60 font-semibold">{label}</span>
      <span className="text-xs sm:text-sm font-black text-white">{value}</span>
    </div>
  );
}
