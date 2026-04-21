"use client";

import Link from "next/link";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { useEffect, useState } from "react";

const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/vendor-registration", label: "Vendor Registration" },
  { href: "/nri-rentals", label: "NRI Rentals" },
  { href: "/careers", label: "Careers" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms-and-conditions", label: "Terms and Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/cancellation-and-refunds", label: "Cancellation and Refunds" },
];

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
    <footer className="bg-[var(--brand-ink)] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={settings.logoUrl}
                alt="Next Gear Logo"
                className="h-10 w-10 object-contain"
              />
              <div>
                <p className="text-sm font-semibold text-white">{settings.brandName}</p>
                <p className="text-xs text-white/60">{settings.sinceText}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/75">
              {settings.description}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <div className="mt-3 grid gap-2 text-sm text-white/75">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white transition-colors duration-300">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <p>Support: {settings.supportEmail}</p>
              <p>Business: {settings.businessEmail}</p>
              <p>Phone: {settings.phone}</p>
              <div className="mt-2 flex items-center gap-3">
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Join our WhatsApp group"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors duration-300 hover:text-white hover:border-[var(--brand-red)]/60"
                >
                  <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M16 3C9.935 3 5 7.935 5 14c0 2.135.628 4.203 1.82 5.973L5 29l9.246-1.78A10.93 10.93 0 0 0 16 25c6.065 0 11-4.935 11-11S22.065 3 16 3zm0 20a8.95 8.95 0 0 1-1.55-.135l-.53-.095-5.49 1.055 1.07-5.36-.1-.55A8.95 8.95 0 1 1 16 23zm4.96-6.33c-.27-.135-1.59-.785-1.84-.875-.245-.09-.425-.135-.605.135-.18.27-.695.875-.85 1.055-.155.18-.31.2-.58.065-.27-.135-1.135-.42-2.165-1.33-.8-.715-1.34-1.6-1.5-1.87-.155-.27-.015-.415.12-.55.12-.12.27-.31.405-.465.135-.155.18-.27.27-.45.09-.18.045-.335-.02-.47-.065-.135-.605-1.46-.83-2-.22-.53-.445-.46-.605-.47-.155-.01-.335-.01-.515-.01-.18 0-.47.065-.715.335-.245.27-.935.915-.935 2.235 0 1.32.96 2.595 1.095 2.775.135.18 1.89 2.89 4.58 4.055.64.275 1.14.44 1.53.56.645.205 1.235.175 1.7.105.52-.08 1.59-.65 1.815-1.28.225-.63.225-1.17.155-1.28-.065-.11-.245-.18-.515-.315z" />
                  </svg>
                </a>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit our Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors duration-300 hover:text-white hover:border-[var(--brand-red)]/60"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M12 7.1A4.9 4.9 0 1 0 16.9 12 4.9 4.9 0 0 0 12 7.1zm0 8a3.1 3.1 0 1 1 3.1-3.1 3.1 3.1 0 0 1-3.1 3.1zm6.2-8.7a1.15 1.15 0 1 1-1.15-1.15A1.15 1.15 0 0 1 18.2 6.4z" />
                    <path d="M20.5 7.7a5.78 5.78 0 0 0-1.6-4.1A5.78 5.78 0 0 0 14.8 2H9.2a5.78 5.78 0 0 0-4.1 1.6A5.78 5.78 0 0 0 3.5 7.7v5.6a5.78 5.78 0 0 0 1.6 4.1A5.78 5.78 0 0 0 9.2 19h5.6a5.78 5.78 0 0 0 4.1-1.6 5.78 5.78 0 0 0 1.6-4.1zm-1.9 7.1a3.88 3.88 0 0 1-2.2 2.2 6.35 6.35 0 0 1-2.1.3H9.7a6.35 6.35 0 0 1-2.1-.3 3.88 3.88 0 0 1-2.2-2.2 6.35 6.35 0 0 1-.3-2.1V9.3a6.35 6.35 0 0 1 .3-2.1 3.88 3.88 0 0 1 2.2-2.2 6.35 6.35 0 0 1 2.1-.3h4.6a6.35 6.35 0 0 1 2.1.3 3.88 3.88 0 0 1 2.2 2.2 6.35 6.35 0 0 1 .3 2.1v3.4a6.35 6.35 0 0 1-.3 2.1z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/60">
          © 2026 Next Gear Rentals. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
