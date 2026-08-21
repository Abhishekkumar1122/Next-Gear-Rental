"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAuthButton } from "@/components/header-auth-button";
import { useState, useEffect } from "react";
import { Home, Car, MapPin, Tag, Building2, Globe, Info, Phone, HelpCircle, LayoutDashboard, ChevronRight } from "lucide-react";

const IndiaCoverageModal = dynamic(
  () => import("@/components/india-coverage-modal").then((mod) => mod.IndiaCoverageModal),
  { ssr: false }
);

const baseNavItems = [
  { href: "/", label: "Home" },
  { href: "/vehicles", label: "Book Vehicle" },
  { href: "/cities", label: "Cities" },
  { href: "/pricing", label: "Pricing" },
  { href: "/vendor-registration", label: "Vendor Registration" },
  { href: "/nri-rentals", label: "NRI Rentals" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const dashboardItem = { href: "/dashboard", label: "Dashboard" };

type SiteHeaderProps = {
  variant?: "dark" | "light";
  showBrandName?: boolean;
  showBadges?: boolean;
  brandHref?: string;
};

function getMenuIcon(label: string) {
  switch (label) {
    case "Home": return Home;
    case "Dashboard": return LayoutDashboard;
    case "Book Vehicle": return Car;
    case "Cities": return MapPin;
    case "Pricing": return Tag;
    case "Vendor Registration": case "Vendor": return Building2;
    case "NRI Rentals": case "NRI": return Globe;
    case "About Us": case "About": return Info;
    case "Contact": return Phone;
    case "FAQ": return HelpCircle;
    default: return Car;
  }
}

export function SiteHeader({ variant = "dark", showBrandName = true, showBadges = true, brandHref = "/" }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const isDark = variant === "dark";
  const textColor = isDark ? "text-white" : "text-black";
  const borderColor = isDark ? "border-white/15" : "border-black/10";
  const chipBg = isDark ? "bg-white/10" : "bg-black/5";

  // Listen to scroll with hysteresis threshold to eliminate layout thrashing & flickering
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          setIsScrolled((prev) => {
            if (currentScroll > 80) return true;
            if (currentScroll < 20) return false;
            return prev; // Maintain current state in 20px - 80px hysteresis zone to prevent flickering
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch {
        // User not authenticated
      } finally {
        setIsLoading(false);
      }
    }

    void checkAuth();
  }, []);

  // Compute direct role-based dashboard href to eliminate server-side 302 redirect latency
  const dashboardHref = user
    ? user.role === "VENDOR"
      ? "/dashboard/vendor"
      : user.role === "ADMIN"
      ? "/dashboard/admin"
      : "/dashboard/customer"
    : "/dashboard";

  const userDashboardItem = { href: dashboardHref, label: "Dashboard" };

  // Build navigation items
  const navItems = user ? [
    { href: "/", label: "Home" },
    userDashboardItem,
    { href: "/vehicles", label: "Book Vehicle" },
    { href: "/cities", label: "Cities" },
    { href: "/pricing", label: "Pricing" },
    { href: "/vendor-registration", label: "Vendor Registration" },
    { href: "/nri-rentals", label: "NRI Rentals" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ] : baseNavItems;

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-500 ease-out">
      {/* Header Container: Scrolled mode displays strictly the sleek Floating Glassmorphic Pill */}
      <div className={`mx-auto w-full transition-all duration-500 ease-out ${
        isScrolled 
          ? "md:max-w-5xl md:px-4 md:pt-3 md:pb-1 max-w-full px-0 pt-0 pb-0" 
          : "max-w-full px-0 pt-0 pb-0"
      }`}>
        <div className={`transition-all duration-500 ${
          isScrolled
            ? "rounded-none md:rounded-full border-b md:border border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl shadow-black/60 md:ring-1 md:ring-white/20 px-3 md:px-4 py-2"
            : "bg-[#09090b] border-b border-white/10 px-3 sm:px-4 py-2.5 md:px-10 md:py-3"
        }`}>
          <div className={`w-full mx-auto flex items-center justify-between gap-4 relative ${
            isScrolled ? "px-1 md:px-2" : "max-w-6xl px-1 sm:px-2 md:px-10"
          }`}>
            {/* Brand Logo */}
            <Link href={brandHref} className="group flex items-center gap-3 flex-shrink-0 transition-all duration-300 hover:scale-105" aria-label="Next Gear Rentals">
              <Image
                src="/next-gear-full-transparent-badge-v2.png"
                alt="Next Gear Rentals Logo"
                title="Next Gear Rentals"
                width={40}
                height={40}
                className="h-10 w-10 object-contain transition-all duration-300 group-hover:scale-105"
                priority
              />
              <span className="hidden sm:flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">Since 2022</span>
                <span className="font-display text-sm uppercase tracking-[0.35em]">Next Gear</span>
              </span>
            </Link>

            {/* Mobile View: Centered Brand Name */}
            <Link
              href={brandHref}
              className="sm:hidden absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center leading-tight"
              aria-label="Next Gear Rentals"
            >
              <span className="text-[8.5px] uppercase tracking-[0.25em] text-white/70">Since 2022</span>
              <span className="font-display text-xs uppercase tracking-[0.3em] whitespace-nowrap">Next Gear</span>
            </Link>

            {/* When Scrolled: Inline Floating Nav Links */}
            {isScrolled ? (
              <nav className="hidden lg:flex items-center gap-1.5 lg:gap-2.5 overflow-x-auto no-scrollbar flex-1 justify-center">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : (
              /* Center Badges (When at top) */
              showBadges && (
                <div className="hidden lg:flex items-center gap-2.5 flex-1 justify-center">
                  <span className={`rounded-full border ${borderColor} ${chipBg} px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 cursor-pointer`}>
                    ✓ Verified fleet
                  </span>
                  <button
                    onClick={() => setCoverageModalOpen(true)}
                    className={`rounded-full border ${borderColor} ${chipBg} px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 cursor-pointer`}>
                    📍 Pan India
                  </button>
                  <span className={`rounded-full border ${borderColor} ${chipBg} px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 cursor-pointer`}>
                    🌍 NRI ready
                  </span>
                </div>
              )
            )}

            {/* Right Auth Action & Mobile Toggle */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden md:block">
                <HeaderAuthButton variant={variant} isScrolled={isScrolled} />
              </div>
              
              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden relative flex flex-col justify-center items-center gap-1.5 p-2.5 rounded-xl border ${
                  mobileMenuOpen 
                    ? "bg-gradient-to-br from-[var(--brand-red)]/20 to-[var(--brand-red)]/10 border-[var(--brand-red)]/50" 
                    : `${borderColor} bg-white/5 hover:bg-white/10`
                } transition-all duration-300`}
                aria-label="Toggle menu"
              >
                <span className={`w-5 h-[2.5px] rounded-full ${mobileMenuOpen ? "bg-[var(--brand-red)]" : "bg-white"} transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[6px]" : ""}`}></span>
                <span className={`w-5 h-[2.5px] rounded-full ${mobileMenuOpen ? "bg-[var(--brand-red)]" : "bg-white"} transition-all duration-300 ${mobileMenuOpen ? "opacity-0 scale-0" : ""}`}></span>
                <span className={`w-5 h-[2.5px] rounded-full ${mobileMenuOpen ? "bg-[var(--brand-red)]" : "bg-white"} transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`}></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Desktop Navigation Bar (Only visible when at top of page) */}
      {!isScrolled && (
        <nav className="border-b border-white/10 bg-transparent hidden md:block overflow-x-auto no-scrollbar transition-all duration-300"> 
          <div className="mx-auto flex w-full max-w-6xl items-center justify-start gap-2 md:gap-4 lg:gap-5 px-6 md:px-10 py-1.5 whitespace-nowrap">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`group relative rounded-md px-3 py-1.5 text-xs md:text-sm font-medium transition-all duration-300 ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5"} hover:-translate-y-0.5`}
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 h-[2px] w-0 bg-gradient-to-r from-black via-black/70 to-[var(--brand-red)] transition-all duration-300 group-hover:w-3/4 group-hover:left-[12.5%] rounded-full shadow-sm shadow-red-500/30"></span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/15 bg-gradient-to-b from-neutral-950 via-neutral-950/98 to-[#0d070b] backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-3 duration-300">
          <nav className="mx-auto w-full px-3.5 py-3 sm:px-5 sm:py-4 space-y-2.5">
            {/* Top Quick Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 animate-in fade-in slide-in-from-left-4 duration-300">
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-white/80 whitespace-nowrap transition-transform hover:scale-105">
                ✓ Verified fleet
              </span>
              <button
                onClick={() => {
                  setCoverageModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 whitespace-nowrap flex items-center gap-1 transition-all hover:scale-105 hover:bg-rose-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                📍 Pan India Coverage
              </button>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 whitespace-nowrap transition-transform hover:scale-105">
                🌍 NRI ready
              </span>
            </div>

            {/* Compact Boxed Cards Grid with Waterfall Staggered Animation */}
            <div className="grid gap-1.5">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                const IconComponent = getMenuIcon(item.label);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-3 fill-mode-both ${
                      isActive
                        ? "bg-gradient-to-r from-red-600/40 via-red-900/30 to-rose-950/40 border border-red-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.35)] scale-[1.01]"
                        : "bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-rose-950/15 border border-white/10 text-slate-200 hover:border-red-500/60 hover:bg-gradient-to-r hover:from-neutral-900 hover:to-red-950/40 hover:text-white hover:scale-[1.015] active:scale-[0.985]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-500/30"
                          : "bg-white/5 border border-white/10 text-rose-400 group-hover:bg-[var(--brand-red)] group-hover:text-white group-hover:rotate-6 group-hover:scale-110"
                      }`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="tracking-wide flex items-center gap-1.5">
                        {item.label}
                        {isActive && (
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <ChevronRight className={`w-3.5 h-3.5 transition-all duration-300 ${
                      isActive ? "text-red-400 translate-x-1" : "text-white/30 group-hover:text-red-400 group-hover:translate-x-1.5"
                    }`} />
                  </Link>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-white/10 animate-in fade-in duration-300">
              <HeaderAuthButton variant={variant} />
            </div>
          </nav>
        </div>
      )}
      
      <IndiaCoverageModal 
        isOpen={coverageModalOpen} 
        onClose={() => setCoverageModalOpen(false)} 
      />
    </header>
  );
}
