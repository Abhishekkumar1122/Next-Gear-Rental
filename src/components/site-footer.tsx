"use client";

import Link from "next/link";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { useEffect, useState } from "react";
import { 
  Flame, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Mail, 
  ChevronRight, 
  ArrowUpRight,
  Headphones,
  Award,
  Zap,
  Globe
} from "lucide-react";

export function SiteFooter() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const res = await fetch("/api/site-settings", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;

      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="relative bg-[#080808] text-white border-t border-white/10 overflow-hidden">
      {/* Top Ambient Glow Bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--brand-red)] to-transparent opacity-80" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[var(--brand-red)]/[0.04] blur-3xl pointer-events-none" />

      {/* Top Trust & Value Guarantee Bar */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-white/80">
              <Zap className="w-4 h-4 text-red-500 shrink-0" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Clean Fleet</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>120+ Indian City Hubs</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Award className="w-4 h-4 text-rose-400 shrink-0" />
              <span>4.9★ Rated Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer Content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: Brand & Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={settings.logoUrl || "/next-gear-full-transparent-badge-v2.png"}
                alt="Next Gear Rentals Official Brand Logo - Ride Anywhere in India"
                title="Next Gear Rentals Logo"
                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(225,6,0,0.6)]"
              />
              <div>
                <p className="text-base font-black tracking-wider text-white">
                  NEXT GEAR
                </p>
                <p className="text-[10px] font-mono text-red-400 tracking-widest uppercase">
                  Official Ride Hub
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              India's premier vehicle rental hub. Bike, car, and scooty rentals with instant booking across 120+ cities.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono bg-red-950/60 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3 animate-pulse" /> 24/7 Live Support
              </span>
            </div>

            {/* Social Media Pill Icons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 transition-all duration-300 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white hover:scale-110 shadow-md"
              >
                <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M16 3C9.935 3 5 7.935 5 14c0 2.135.628 4.203 1.82 5.973L5 29l9.246-1.78A10.93 10.93 0 0 0 16 25c6.065 0 11-4.935 11-11S22.065 3 16 3zm0 20a8.95 8.95 0 0 1-1.55-.135l-.53-.095-5.49 1.055 1.07-5.36-.1-.55A8.95 8.95 0 1 1 16 23zm4.96-6.33c-.27-.135-1.59-.785-1.84-.875-.245-.09-.425-.135-.605.135-.18.27-.695.875-.85 1.055-.155.18-.31.2-.58.065-.27-.135-1.135-.42-2.165-1.33-.8-.715-1.34-1.6-1.5-1.87-.155-.27-.015-.415.12-.55.12-.12.27-.31.405-.465.135-.155.18-.27.27-.45.09-.18.045-.335-.02-.47-.065-.135-.605-1.46-.83-2-.22-.53-.445-.46-.605-.47-.155-.01-.335-.01-.515-.01-.18 0-.47.065-.715.335-.245.27-.935.915-.935 2.235 0 1.32.96 2.595 1.095 2.775.135.18 1.89 2.89 4.58 4.055.64.275 1.14.44 1.53.56.645.205 1.235.175 1.7.105.52-.08 1.59-.65 1.815-1.28.225-.63.225-1.17.155-1.28-.065-.11-.245-.18-.515-.315z" />
                </svg>
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="me noopener noreferrer"
                title="Next Gear Rentals Official Instagram Account (@_nextgear_rentals)"
                aria-label="Next Gear Rentals Official Instagram Account @_nextgear_rentals"
                className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 transition-all duration-300 hover:bg-rose-600 hover:border-rose-500 hover:text-white hover:scale-110 shadow-md"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M12 7.1A4.9 4.9 0 1 0 16.9 12 4.9 4.9 0 0 0 12 7.1zm0 8a3.1 3.1 0 1 1 3.1-3.1 3.1 3.1 0 0 1-3.1 3.1zm6.2-8.7a1.15 1.15 0 1 1-1.15-1.15A1.15 1.15 0 0 1 18.2 6.4z" />
                  <path d="M20.5 7.7a5.78 5.78 0 0 0-1.6-4.1A5.78 5.78 0 0 0 14.8 2H9.2a5.78 5.78 0 0 0-4.1 1.6A5.78 5.78 0 0 0 3.5 7.7v5.6a5.78 5.78 0 0 0 1.6 4.1A5.78 5.78 0 0 0 9.2 19h5.6a5.78 5.78 0 0 0 4.1-1.6 5.78 5.78 0 0 0 1.6-4.1zm-1.9 7.1a3.88 3.88 0 0 1-2.2 2.2 6.35 6.35 0 0 1-2.1.3H9.7a6.35 6.35 0 0 1-2.1-.3 3.88 3.88 0 0 1-2.2-2.2 6.35 6.35 0 0 1-.3-2.1V9.3a6.35 6.35 0 0 1 .3-2.1 3.88 3.88 0 0 1 2.2-2.2 6.35 6.35 0 0 1 2.1-.3h4.6a6.35 6.35 0 0 1 2.1.3 3.88 3.88 0 0 1 2.2 2.2 6.35 6.35 0 0 1 .3 2.1v3.4a6.35 6.35 0 0 1-.3 2.1z" />
                </svg>
              </a>

              <a
                href={`tel:${settings.phone}`}
                aria-label="Call Support"
                className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 transition-all duration-300 hover:bg-red-600 hover:border-red-500 hover:text-white hover:scale-110 shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>

              <a
                href={`mailto:${settings.supportEmail}`}
                aria-label="Email Support"
                className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 transition-all duration-300 hover:bg-amber-600 hover:border-amber-500 hover:text-white hover:scale-110 shadow-md"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 2: Vehicle Categories */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-red)]" />
              Vehicle Fleet
            </h3>
            <ul className="space-y-2 text-xs text-white/70 font-medium">
              {[
                { href: "/vehicles?type=bike", label: "Cruiser & Sports Bikes" },
                { href: "/vehicles?type=car", label: "Self Drive SUV & Sedan Cars" },
                { href: "/vehicles?type=scooty", label: "Automatic Scooty Commutes" },
                { href: "/nri-rentals", label: "NRI Special Rentals Hub" },
                { href: "/pricing", label: "Daily & Hourly Pricing" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    href={link.href}
                    className="flex items-center gap-1.5 hover:text-red-400 hover:translate-x-1 transition-all duration-300 group"
                  >
                    <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-red-400" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company & Trust */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-red)]" />
              Company & Trust
            </h3>
            <ul className="space-y-2 text-xs text-white/70 font-medium">
              {[
                { href: "/about", label: "About Next Gear" },
                { href: "/blogs", label: "Travel Guides & Articles" },
                { href: "/vendor-registration", label: "Vendor Partner Hub" },
                { href: "/careers", label: "Careers & Hiring" },
                { href: "/faq", label: "Frequently Asked Questions" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    href={link.href}
                    className="flex items-center gap-1.5 hover:text-red-400 hover:translate-x-1 transition-all duration-300 group"
                  >
                    <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-red-400" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal & Contact */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-red)]" />
              Support & Policies
            </h3>
            <ul className="space-y-2 text-xs text-white/70 font-medium">
              {[
                { href: "/contact-us", label: "Contact 24/7 Helpline" },
                { href: "/terms-and-conditions", label: "Terms & Conditions" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/cancellation-and-refunds", label: "Cancellation & Refunds" },
                { href: "/shipping-policy", label: "Delivery & Pickup Policy" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    href={link.href}
                    className="flex items-center gap-1.5 hover:text-red-400 hover:translate-x-1 transition-all duration-300 group"
                  >
                    <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-red-400" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* SEO Keyword Footprint Links Section */}
        <div className="mt-10 border-t border-white/10 pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              Popular Destinations & Search Hubs:
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { href: "/blogs/budget-car-bike-rental-starting-99-per-hour", label: "⚡ Rentals @ ₹99/Hour", badge: true },
              { href: "/blogs/car-rental-near-me-delhi-goa-mumbai-guide", label: "Car Rental Near Me" },
              { href: "/blogs/bike-rental-near-me-manali-leh-ladakh-guide", label: "Bike Rental Near Me" },
              { href: "/vehicles?city=Delhi&type=car", label: "Car Rent in Delhi" },
              { href: "/vehicles?city=Manali&type=bike", label: "Bike Rent in Manali" },
              { href: "/blogs/complete-goa-self-drive-car-rental-guide", label: "Self Drive Car Goa" },
              { href: "/blogs/scooty-rental-delhi-ncr-budget-riding-guide", label: "Scooty Rental Delhi" },
              { href: "/cities?city=Pune", label: "Vehicle Rental Pune" },
              { href: "/cities?city=Bengaluru", label: "Self Drive Bangalore" },
            ].map((chip, idx) => (
              <Link
                key={idx}
                href={chip.href}
                className={`px-3 py-1 rounded-full border transition-all duration-300 text-[11px] font-semibold flex items-center gap-1 ${
                  chip.badge
                    ? "bg-red-950/60 border-red-500/40 text-red-400 hover:bg-red-900/60 shadow-md shadow-red-500/20"
                    : "bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:border-red-500/50 hover:bg-white/[0.08]"
                }`}
              >
                <span>{chip.label}</span>
                <ArrowUpRight className="w-2.5 h-2.5 text-white/40" />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Copyright & Guarantee Footer */}
        <div className="mt-8 border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>© 2026 Next Gear Rentals. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-white/40">
            <span>Verified 256-Bit SSL</span>
            <span>•</span>
            <span>{settings.sinceText || "SINCE 2022"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
