import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const revalidate = 3600; // Static ISR cache for 1 hour

export const metadata = {
  title: "Vehicle Rental Pricing | Next Gear Rentals - Rates @ ₹99/Hour",
  description: "Explore transparent hourly & daily pricing for self-drive cars, bikes, and scooties in India. Rent Activa @ ₹99/hr, Himalayan @ ₹249/hr, Thar @ ₹499/hr with ₹0 deposit options.",
};

const PRICING_TIERS = [
  {
    category: "Scooty & Scooter",
    icon: "🛵",
    hourlyRate: "INR 99",
    dailyRate: "INR 399",
    popularVehicles: "Honda Activa 6G, TVS Jupiter, Suzuki Access 125",
    idealFor: "Quick city errands, market visits & daily commuting",
    perks: [
      "2 ISI Safety Helmets Included",
      "₹0 Security Deposit Options",
      "Flexible Hourly Pay-As-You-Go",
      "Doorstep Pickup Available",
    ],
    highlight: false,
  },
  {
    category: "Commuter Motorcycle",
    icon: "🏍️",
    hourlyRate: "INR 149",
    dailyRate: "INR 599",
    popularVehicles: "Bajaj Pulsar N160, Yamaha FZ-S, TVS Apache RTR",
    idealFor: "Inter-city rides & comfortable daily transport",
    perks: [
      "2 ISI Safety Helmets Included",
      "Comprehensive Third-Party Insurance",
      "Unlimited Kilometers Option",
      "24x7 Roadside Assistance",
    ],
    highlight: false,
  },
  {
    category: "Adventure & Cruiser",
    icon: "🏔️",
    hourlyRate: "INR 249",
    dailyRate: "INR 999",
    popularVehicles: "Royal Enfield Himalayan 450, Hunter 350, Classic 350",
    idealFor: "Manali, Leh Ladakh, & long-distance mountain tours",
    perks: [
      "Luggage Carrier & Pannier Mounts",
      "Complimentary Riding Gear Options",
      "High Altitude Engine Tuning",
      "Dedicated Expedition Support",
    ],
    highlight: true,
    badge: "⭐ Bestseller for Mountain Expeditions",
  },
  {
    category: "Hatchback & Sedan",
    icon: "🚗",
    hourlyRate: "INR 299",
    dailyRate: "INR 1,499",
    popularVehicles: "Maruti Swift Dzire, Hyundai i20, Honda City",
    idealFor: "Family trips, business travels & highway driving",
    perks: [
      "Automatic & Manual Options",
      "Airport Terminal Handover",
      "Sanitized Clean Cabins",
      "Free Cancellation up to 24h",
    ],
    highlight: false,
  },
  {
    category: "4x4 SUV & Luxury",
    icon: "🏎️",
    hourlyRate: "INR 499",
    dailyRate: "INR 2,499",
    popularVehicles: "Mahindra Thar 4x4, Hyundai Creta, Mahindra XUV700",
    idealFor: "Off-road adventures, Goa beach rides & luxury events",
    perks: [
      "4x4 All-Terrain Capability",
      "Convertible / Hard-Top Options",
      "VIP Concierge Delivery",
      "Unlimited Mileage Allowance",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Next Gear Vehicle Rental Packages",
    "description": "Transparent hourly and daily self-drive rental packages starting at ₹99/hour across India.",
    "offers": PRICING_TIERS.map((tier) => ({
      "@type": "Offer",
      "name": tier.category,
      "price": tier.hourlyRate.replace("INR ", ""),
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": "https://nextgear.co.in/pricing"
    }))
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      {/* Hero Ambient Header - Matching About Us exact Hero */}
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-red-950/40 via-neutral-950 to-neutral-950 -mt-12 pt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-600/10 blur-[150px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Story Column */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/Logo1.png"
                  alt="Next Gear Official Logo"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                />
                <div>
                  <span className="text-xs uppercase tracking-[0.3em] text-red-400 font-extrabold block">Transparent Pricing Policy</span>
                  <span className="text-[10px] text-white/50">Rates Starting @ ₹99/Hour • Zero Deposit</span>
                </div>
              </div>

              <h1 className="text-3xl font-black sm:text-5xl text-white tracking-tight leading-tight">
                Vehicle Rental Pricing <br />
                <span className="gradient-text-brand drop-shadow-md">
                  No Hidden Charges, Pure Freedom
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Choose flexible hourly or daily packages for self-drive cars, Himalayan motorbikes, and automatic scooties across Delhi NCR, Goa, Manali, Mumbai, and Bangalore.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/vehicles"
                  className="rounded-full bg-[var(--brand-red)] px-6 py-3 text-xs font-black text-white hover:bg-red-600 transition shadow-xl shadow-red-600/30"
                >
                  Explore Fleet @ ₹99/Hr →
                </Link>
                <Link
                  href="/blogs"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Travel Guides & Handbooks
                </Link>
              </div>
            </div>

            {/* Widescreen AI Showcase Video Card */}
            <div className="relative rounded-3xl border border-white/20 bg-neutral-950 overflow-hidden shadow-2xl backdrop-blur-2xl group hover:border-yellow-400/50 transition-all duration-500">
              <div className="relative h-72 sm:h-88 w-full bg-black overflow-hidden">
                {/* 100% Visible HD AI Motion Video */}
                <video
                  src="/using-logo-video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover scale-[1.22] translate-y-[-2%] pointer-events-none transition-transform duration-700 group-hover:scale-[1.25]"
                />

                {/* Top Left AI HUD Badge */}
                <div className="absolute top-4 left-4 rounded-full bg-black/80 backdrop-blur-xl px-3.5 py-1.5 text-[10px] font-extrabold text-yellow-400 border border-yellow-400/30 flex items-center gap-2 shadow-2xl pointer-events-none z-10">
                  <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
                  ⚡ NEXTGO AI PRICING HUD
                </div>

                {/* Original Screenshot Overlay with ONLY '99' in Yellow */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 space-y-2.5">
                  {/* Item 1: Top Pill */}
                  <div className="bg-[#1e1e23]/90 border border-white/15 px-5 py-1.5 rounded-full backdrop-blur-md shadow-2xl">
                    <span className="text-[11px] font-bold text-white/90 uppercase tracking-[0.2em]">
                      BEST RATE GUARANTEE
                    </span>
                  </div>

                  {/* Item 2: Main Rate Text - Both '₹' and '99' are Yellow */}
                  <div className="flex items-baseline justify-center gap-1 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                    <span className="text-yellow-400 font-black text-6xl sm:text-7xl">₹</span>
                    <span className="text-yellow-400 font-black text-6xl sm:text-7xl">99</span>
                    <span className="text-white font-black text-3xl sm:text-4xl uppercase ml-1">/HOUR</span>
                  </div>

                  {/* Item 3: Bottom Pill */}
                  <div className="bg-[#0a281e]/90 border border-emerald-500/40 px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">✓ ₹0 Security Deposit Lockup</span>
                  </div>
                </div>

                {/* Solid Corner Cap Mask directly flush to bottom-0 right-0 */}
                <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-neutral-950 border-t border-l border-white/20 px-4 py-2.5 text-white text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 pointer-events-none">
                  <Image src="/Logo1.png" alt="Next Gear Logo" width={18} height={18} className="h-4 w-4 object-contain" />
                  <span className="text-yellow-400 font-extrabold">Next Gear Motion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Pricing Content Section - Matching About Us exact layout */}
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        {/* Transparent Pricing & Security Deposit Guarantee Video Section */}
        <section className="relative rounded-3xl border border-red-500/30 bg-gradient-to-r from-neutral-950 via-red-950/40 to-neutral-950 p-8 sm:p-12 overflow-hidden shadow-2xl space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-red-500/20 border border-red-500/40 px-3.5 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
                🛡️ 100% TRANSPARENT PRICING GUARANTEE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                No Hidden Fees. No Security Lockups.
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                At Next Gear, what you see is what you pay. Every booking includes 2 ISI safety helmets, comprehensive third-party insurance, and zero hidden charges.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl border border-white/10 bg-black/50 p-3 text-center">
                  <p className="text-lg font-black text-red-400">₹99/hr</p>
                  <p className="text-[10px] text-white/60">Starting Rate</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/50 p-3 text-center">
                  <p className="text-lg font-black text-emerald-400">₹0</p>
                  <p className="text-[10px] text-white/60">Security Deposit</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/50 p-3 text-center">
                  <p className="text-lg font-black text-amber-400">24x7</p>
                  <p className="text-[10px] text-white/60">Roadside Assist</p>
                </div>
              </div>
            </div>

            {/* Specialized Pricing Video Card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl h-64 sm:h-80 bg-black">
              <video
                src="/login-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover scale-[1.22] translate-y-[-2%] pointer-events-none"
              />
              {/* Solid Corner Cap Mask directly flush to bottom-0 right-0 */}
              <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-neutral-950 border-t border-l border-white/20 px-4 py-2.5 text-white text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 pointer-events-none">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-white font-extrabold">Next Gear Price Lock Reel</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Rate Cards Section */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-red-400 uppercase tracking-widest">
              🏷️ FLEET RATE CARDS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Choose Your Rental Package
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Transparent hourly & daily rates for two-wheelers, luxury sedans, and 4x4 off-road SUVs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.category}
                className={`relative rounded-3xl border p-6 flex flex-col justify-between space-y-6 backdrop-blur-xl transition duration-500 ${
                  tier.highlight
                    ? "border-red-500/60 bg-gradient-to-b from-red-950/40 via-neutral-900 to-neutral-900 shadow-[0_0_35px_rgba(239,68,68,0.25)]"
                    : "border-white/10 bg-neutral-900/80 hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-3.5 py-1 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-lg">
                    {tier.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{tier.icon}</span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-white/70">
                      {tier.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">{tier.category}</h3>
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{tier.popularVehicles}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Hourly Rate</p>
                      <p className="text-xl font-black text-red-500">{tier.hourlyRate}<span className="text-xs text-white/60 font-medium">/hr</span></p>
                    </div>
                    <div className="text-right border-l border-white/10 pl-3">
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Daily Rate</p>
                      <p className="text-sm font-bold text-white">{tier.dailyRate}<span className="text-[10px] text-white/50">/day</span></p>
                    </div>
                  </div>

                  <p className="text-xs text-white/75 italic leading-relaxed">"{tier.idealFor}"</p>

                  <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-white/80">
                    {tier.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/vehicles"
                    className={`block w-full text-center rounded-full py-3 text-xs font-black transition shadow-lg ${
                      tier.highlight
                        ? "bg-[var(--brand-red)] text-white hover:bg-red-600 shadow-red-600/40"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    Book {tier.category} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Second AI Experience Video Banner */}
        <section className="relative rounded-3xl border border-red-500/30 bg-gradient-to-r from-neutral-950 via-red-950/40 to-neutral-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-red-500/20 border border-red-500/40 px-3.5 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
                ⚡ NEXTGO AI PRICING ASSISTANT
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Need Custom Corporate or Long-Term Pricing?
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Ask NextGo AI for custom weekly, monthly, or corporate fleet packages with zero security deposit and free maintenance.
              </p>
              <div className="pt-2">
                <Link
                  href="/vehicles"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-xs font-black hover:bg-neutral-200 transition shadow-lg"
                >
                  🏎️ Chat with NextGo AI
                </Link>
              </div>
            </div>

            {/* 3D Car AI Robot Interactive Motion Card */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black shadow-2xl h-60 sm:h-72 p-6 flex flex-col items-center justify-center text-center space-y-3 group hover:border-emerald-500/60 transition-all duration-500">
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <Image
                  src="/car-ai-robot.png"
                  alt="NextGo Car AI Robot"
                  width={140}
                  height={140}
                  className="h-28 sm:h-32 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                />
              </div>

              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
                  🤖 NEXTGO CAR AI ROBOT
                </span>
                <span className="text-[11px] text-white/70">
                  Instant Custom Pricing & Corporate Quotes
                </span>
              </div>

              {/* Solid Corner Cap Mask directly flush to bottom-0 right-0 */}
              <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-neutral-950 border-t border-l border-white/20 px-4 py-2 text-white text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 pointer-events-none">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-extrabold">NextGo AI Online</span>
              </div>
            </div>
          </div>
        </section>

        {/* Company Core Pillars */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-2">
            <span className="text-3xl">🔍</span>
            <h3 className="text-lg font-bold text-white">100% Verified Fleets</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Every vehicle undergoes a 30-point safety inspection before handover to ensure maximum road safety.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-2">
            <span className="text-3xl">💰</span>
            <h3 className="text-lg font-bold text-white">Starting @ ₹99/Hour</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Pay only for what you ride with flexible hourly and daily packages, plus ₹0 security deposit options.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-2">
            <span className="text-3xl">✈️</span>
            <h3 className="text-lg font-bold text-white">Doorstep Airport Delivery</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Get your self-drive car or motorcycle delivered directly to your hotel or airport terminal in major cities.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
