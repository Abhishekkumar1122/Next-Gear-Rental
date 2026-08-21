import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "About Next Gear Rentals | Official Brand Story & AI Video Showcase",
  description: "Discover Next Gear Rentals' story, logo branding, and AI mobility network. Rent verified cars, bikes, and scooties starting @ ₹99/hr across India.",
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Next Gear Rentals",
    "url": "https://nextgear.co.in",
    "logo": "https://nextgear.co.in/Logo1.png",
    "foundingDate": "2022",
    "description": "Next Gear Rentals connects riders to verified self-drive cars, bikes, and scooties across India.",
    "founder": {
      "@type": "Person",
      "name": "Abhishek Kumar",
      "jobTitle": "Founder & Chief Executive Officer",
      "birthDate": "2002-10-20",
      "birthPlace": {
        "@type": "Place",
        "name": "Aurangabad, Bihar, India"
      },
      "alumniOf": {
        "@type": "EducationalOrganization",
        "name": "Lovely Professional University",
        "address": "Punjab, India"
      }
    }
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

      {/* Hero Ambient Header */}
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
                  <span className="text-xs uppercase tracking-[0.3em] text-red-400 font-extrabold block">Official Brand Story</span>
                  <span className="text-[10px] text-white/50">Next Gear Rentals India</span>
                </div>
              </div>

              <h1 className="text-3xl font-black sm:text-5xl text-white tracking-tight leading-tight">
                Redefining Self-Drive <br />
                <span className="gradient-text-brand drop-shadow-md">
                  Mobility Across India
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Next Gear Rentals was built to deliver transparent, deposit-free self-drive vehicle bookings across Delhi, Goa, Manali, Mumbai, and Bangalore with doorstep airport delivery.
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
            <div className="relative rounded-3xl border border-white/20 bg-neutral-950 overflow-hidden shadow-2xl backdrop-blur-2xl group hover:border-red-500/50 transition-all duration-500">
              <div className="relative h-72 sm:h-88 w-full bg-black overflow-hidden">
                <video
                  src="/using-logo-video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover scale-[1.22] translate-y-[-2%] pointer-events-none transition-transform duration-700 group-hover:scale-[1.25]"
                />

                {/* Solid Corner Cap Mask directly flush to bottom-0 right-0 */}
                <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-neutral-950 border-t border-l border-white/20 px-4 py-2.5 text-white text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 pointer-events-none">
                  <Image src="/Logo1.png" alt="Next Gear Logo" width={18} height={18} className="h-4 w-4 object-contain" />
                  <span className="text-red-400 font-extrabold">Next Gear Motion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Brand Logo & Tech Integration Section */}
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        {/* Next Gear Logo Showcase Section */}
        <section className="rounded-3xl border border-white/15 bg-white/5 p-8 sm:p-12 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-red-400 uppercase tracking-widest">
              🛡️ AUTHENTIC BRAND EMBLEM
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              The Next Gear Identity & Logo
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Our emblem represents speed, reliability, and precision engineering — empowering thousands of travelers to explore India on their own terms.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
            {/* Logo Card 1 */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center space-y-4 hover:border-red-500/50 transition">
              <div className="h-24 w-full flex items-center justify-center">
                <Image src="/Logo1.png" alt="Next Gear Main Logo" width={80} height={80} className="h-20 w-auto object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Next Gear Primary Mark</h3>
                <p className="text-[11px] text-white/60">Official vector icon used across mobile & desktop</p>
              </div>
            </div>

            {/* Logo Card 2 */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center space-y-4 hover:border-red-500/50 transition">
              <div className="h-24 w-full flex items-center justify-center">
                <Image src="/logo2.png" alt="Next Gear Secondary Logo" width={100} height={80} className="h-20 w-auto object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Next Gear Badge Logo</h3>
                <p className="text-[11px] text-white/60">Secondary emblem for mobile app & verification</p>
              </div>
            </div>

            {/* Logo Card 3 */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center space-y-4 hover:border-red-500/50 transition sm:col-span-2 lg:col-span-1">
              <div className="h-24 w-full flex items-center justify-center">
                <Image src="/next-gear-login-logo.png" alt="Next Gear Login Logo" width={120} height={80} className="h-20 w-auto object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Next Gear Login Emblem</h3>
                <p className="text-[11px] text-white/60">High-resolution banner used in auth portals</p>
              </div>
            </div>
          </div>
        </section>

        {/* Second AI Experience Video Banner */}
        <section className="relative rounded-3xl border border-red-500/30 bg-gradient-to-r from-neutral-950 via-red-950/40 to-neutral-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-red-500/20 border border-red-500/40 px-3.5 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
                ⚡ NEXTGO AI VIDEO EXPERIENCE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Seamless Digital Bookings & 24x7 Assistance
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Watch how Next Gear combines instant online verification with NextGo AI Concierge for doorstep vehicle handover in under 60 minutes.
              </p>
              <div className="pt-2">
                <Link
                  href="/vehicles"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-xs font-black hover:bg-neutral-200 transition shadow-lg"
                >
                  🏎️ Book Your Vehicle Now
                </Link>
              </div>
            </div>

            {/* Second Brand Video */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl h-60 sm:h-72 bg-black">
              <video
                src="/login-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover scale-[1.22] translate-y-[-2%] pointer-events-none"
              />
              {/* Solid Corner Cap Mask directly flush to bottom-0 right-0 */}
              <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-neutral-950 border-t border-l border-white/20 px-4 py-2.5 text-white text-[10px] font-bold flex items-center gap-2 shadow-2xl z-20 pointer-events-none">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-white font-extrabold">NextGo AI Live</span>
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
