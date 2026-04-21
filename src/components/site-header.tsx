"use client";

import Image from "next/image";
import Link from "next/link";
import { HeaderAuthButton } from "@/components/header-auth-button";
import { IndiaCoverageModal } from "@/components/india-coverage-modal";
import { useState } from "react";

const navItems = [
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

type SiteHeaderProps = {
  variant?: "dark" | "light";
  showBrandName?: boolean;
  showBadges?: boolean;
  brandHref?: string;
};

export function SiteHeader({ variant = "dark", showBrandName = true, showBadges = true, brandHref = "/" }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const isDark = variant === "dark";
  const textColor = isDark ? "text-white" : "text-black";
  const borderColor = isDark ? "border-white/15" : "border-black/10";
  const chipBg = isDark ? "bg-white/10" : "bg-black/5";
  const bgColor = isDark ? "bg-[var(--brand-ink)]" : "bg-white";

  return (
    <header className={`w-full ${textColor}`}>
      {/* Top Bar */}
      <div className={`${bgColor} border-b ${borderColor}`}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 md:px-10 md:py-5">
          {/* Logo and Brand */}
          <Link href={brandHref} className="group flex items-center gap-3 flex-shrink-0 transition-all duration-300 hover:scale-105" aria-label="Next Gear Rentals">
            <Image
              src="/Logo1.png"
              alt="Next Gear logo"
              width={38}
              height={38}
              className="h-10 w-10 object-contain transition-all duration-300 group-hover:scale-105"
              priority
            />
            {showBrandName && (
              <span className="flex flex-col leading-tight hidden sm:flex">
                <span className={`text-[10px] uppercase tracking-[0.3em] ${isDark ? "text-white/70" : "text-black/50"}`}>
                  Since 2022
                </span>
                <span className="font-display text-sm uppercase tracking-[0.35em]">Next Gear</span>
              </span>
            )}
          </Link>

          {/* Center - Badges */}
          {showBadges && (
            <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
              <span className={`rounded-full border ${borderColor} ${chipBg} px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105 cursor-pointer`}>
                ✓ Verified fleet
              </span>
              <button
                onClick={() => setCoverageModalOpen(true)}
                className={`rounded-full border ${borderColor} ${chipBg} px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105 cursor-pointer`}>
                📍 Pan India
              </button>
              <span className={`rounded-full border ${borderColor} ${chipBg} px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105 cursor-pointer`}>
                🌍 NRI ready
              </span>
            </div>
          )}

          {/* Right - Auth Button and Hamburger */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:block">
              <HeaderAuthButton variant={variant} />
            </div>
            
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden relative flex flex-col justify-center items-center gap-1.5 p-3 rounded-xl border ${
                mobileMenuOpen 
                  ? "bg-gradient-to-br from-[var(--brand-red)]/20 to-[var(--brand-red)]/10 border-[var(--brand-red)]/50 shadow-lg shadow-red-500/20" 
                  : `${borderColor} ${isDark ? "bg-white/5 hover:bg-white/10 hover:border-[var(--brand-red)]/40" : "bg-black/5 hover:bg-black/10 hover:border-[var(--brand-red)]/40"}`
              } transition-all duration-300 hover:scale-105 active:scale-95`}
              aria-label="Toggle menu"
            >
              <span className={`w-6 h-[3px] rounded-full ${mobileMenuOpen ? "bg-[var(--brand-red)]" : isDark ? "bg-white" : "bg-black"} transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`}></span>
              <span className={`w-6 h-[3px] rounded-full ${mobileMenuOpen ? "bg-[var(--brand-red)]" : isDark ? "bg-white" : "bg-black"} transition-all duration-300 ${mobileMenuOpen ? "opacity-0 scale-0" : ""}`}></span>
              <span className={`w-6 h-[3px] rounded-full ${mobileMenuOpen ? "bg-[var(--brand-red)]" : isDark ? "bg-white" : "bg-black"} transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <nav className={`border-b ${borderColor} bg-transparent hidden md:block`}> 
        <div className="mx-auto flex w-full max-w-6xl items-center justify-start gap-1 px-6 py-3 px-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5"} hover:-translate-y-0.5`}
            >
              {item.label}
              <span className="absolute bottom-0 left-1/2 h-[2px] w-0 bg-gradient-to-r from-black via-black/70 to-[var(--brand-red)] transition-all duration-300 group-hover:w-3/4 group-hover:left-[12.5%] rounded-full shadow-sm shadow-red-500/30"></span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${isDark ? "bg-gradient-to-b from-[var(--brand-ink)] via-[var(--brand-ink)] to-black/95" : "bg-white"} border-b ${borderColor} shadow-2xl shadow-black/50 animate-in slide-in-from-top duration-300`}>
          <nav className="mx-auto w-full max-w-6xl px-6 py-6">
            <div className="flex flex-col gap-3">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group relative rounded-xl px-5 py-3.5 text-base font-medium transition-all duration-300 ${
                    isDark 
                      ? "bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-r hover:from-[var(--brand-red)]/10 hover:to-[var(--brand-red)]/5 hover:shadow-lg hover:shadow-red-500/20" 
                      : "bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-[var(--brand-red)]/40"
                  } hover:translate-x-1`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="flex items-center justify-between">
                    {item.label}
                    <span className={`text-[var(--brand-red)] opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>→</span>
                  </span>
                </Link>
              ))}
              <div className={`mt-3 pt-5 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <HeaderAuthButton variant={variant} />
              </div>
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
