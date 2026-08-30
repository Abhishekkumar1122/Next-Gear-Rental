"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SiteSettingsForm = {
  brandName: string;
  sinceText: string;
  description: string;
  supportEmail: string;
  businessEmail: string;
  phone: string;
  whatsappUrl: string;
  instagramUrl: string;
  logoUrl: string;
  multiVehicleMinQty: string;
  multiVehicleDiscountPercent: string;
  durationDiscountMinDays: string;
  durationDiscountFreeDays: string;
  shuffleAvailableListings: string;
  receiptFooterText: string;
  receiptTaxPercent: string;
  receiptLogoUrl: string;
  // Integrations & Verification
  payuActive: string;
  paypalActive: string;
  razorpayActive: string;
  stripeActive: string;
  cashfreeActive: string;
  digilockerActive: string;
  // Operational Controls
  announcementActive: string;
  announcementText: string;
  announcementUrl: string;
  announcementBgColor: string;
  announcementTextColor: string;
  maintenanceMode: string;
  maintenanceMessage: string;
  vendorRegistrationOpen: string;
  securityDepositActive: string;
  securityDepositAmount: string;
  // Promotions & Popups
  promoPopupActive: string;
  promo1Active: string; promo1Title: string; promo1Type: string; promo1Value: string; promo1Desc: string;
  promo2Active: string; promo2Title: string; promo2Type: string; promo2Value: string; promo2Desc: string;
  promo3Active: string; promo3Title: string; promo3Type: string; promo3Value: string; promo3Desc: string;
  promo4Active: string; promo4Title: string; promo4Type: string; promo4Value: string; promo4Desc: string;
  promo5Active: string; promo5Title: string; promo5Type: string; promo5Value: string; promo5Desc: string;
  // Test Ride
  testRideActive: string;
  testRideTitle: string;
  testRideDescription: string;
  testRideVehicleType: string;
  testRideDurationMinutes: string;
  testRideCity: string;
  // Spin & Win Wheel
  spinWheelActive: string;
  spinSegment1Title: string; spinSegment1Value: string;
  spinSegment2Title: string; spinSegment2Value: string;
  spinSegment3Title: string; spinSegment3Value: string;
  spinSegment4Title: string; spinSegment4Value: string;
  spinSegment5Title: string; spinSegment5Value: string;
  spinSegment6Title: string; spinSegment6Value: string;
  // GST & Accessories
  receiptGstin: string;
  receiptCompanyAddress: string;
  accessoryHelmetActive: string;
  accessoryHelmetPrice: string;
  accessoryGpsActive: string;
  accessoryGpsPrice: string;
  // Booking Add-on Toggles
  addonWaiverActive: string;
  addonRsaActive: string;
  addonHelmetActive: string;
  // Homepage Copy & Sections
  heroTitle: string;
  heroSubtitle: string;
  sectionHeroActive: string;
  sectionFeaturedActive: string;
  sectionOffersActive: string;
  sectionTestimonialsActive: string;
  sectionFaqActive: string;
  sectionAboutActive: string;
  sectionWhyChooseActive: string;
  seoTitle: string;
  seoDescription: string;
  testimonial1Name: string; testimonial1Text: string;
  testimonial2Name: string; testimonial2Text: string;
  testimonial3Name: string; testimonial3Text: string;
  faq1Question: string; faq1Answer: string;
  faq2Question: string; faq2Answer: string;
  faq3Question: string; faq3Answer: string;
  vehicleCardStyle: string;
  // Vendor Business Hub & Tier Customizations
  tier1Name?: string;
  tier1Subtitle?: string;
  tier1Trips?: string;
  tier2Name?: string;
  tier2Subtitle?: string;
  tier2Trips?: string;
  tier3Name?: string;
  tier3Subtitle?: string;
  tier3Trips?: string;
  tier4Name?: string;
  tier4Subtitle?: string;
  tierRoadmapTitle?: string;
  tierRatingLabel?: string;
  tierHandoverLabel?: string;
  tierCancellationLabel?: string;
};

type SiteSettingsSection = "cardTheme" | "brand" | "description" | "contact" | "social" | "discounts" | "fairness" | "receipt" | "integrations" | "operational" | "promotions" | "homepage" | "seo" | "vendorHub";

const themesList = [
  { id: "red", hex: "#dc2626", label: "Ferrari Red", soft: "#fca5a5", glow: "rgba(220, 38, 38, 0.15)" },
  { id: "teal", hex: "#0d9488", label: "Teal Emerald", soft: "#99f6e4", glow: "rgba(13, 148, 136, 0.15)" },
  { id: "rose", hex: "#e11d48", label: "Rose Crimson", soft: "#fecdd3", glow: "rgba(225, 29, 72, 0.15)" },
  { id: "blue", hex: "#2563eb", label: "Royal Blue", soft: "#bfdbfe", glow: "rgba(37, 99, 235, 0.15)" },
  { id: "amber", hex: "#d97706", label: "Amber Gold", soft: "#fde68a", glow: "rgba(217, 119, 6, 0.15)" },
  { id: "purple", hex: "#7c3aed", label: "Neon Violet", soft: "#ddd6fe", glow: "rgba(124, 58, 237, 0.15)" },
  { id: "slate", hex: "#64748b", label: "Slate Titanium", soft: "#cbd5e1", glow: "rgba(100, 116, 139, 0.15)" },
];

const initialForm: SiteSettingsForm = {
  brandName: "",
  sinceText: "",
  description: "",
  supportEmail: "",
  businessEmail: "",
  phone: "",
  whatsappUrl: "",
  instagramUrl: "",
  logoUrl: "",
  multiVehicleMinQty: "3",
  multiVehicleDiscountPercent: "10",
  durationDiscountMinDays: "4",
  durationDiscountFreeDays: "1",
  shuffleAvailableListings: "true",
  vehicleCardStyle: "classic",
  receiptFooterText: "Thank you for renting with Next Gear. Ride safe!",
  receiptTaxPercent: "18",
  receiptLogoUrl: "/Logo1.png",
  payuActive: "true",
  paypalActive: "true",
  razorpayActive: "false",
  stripeActive: "false",
  cashfreeActive: "false",
  digilockerActive: "false",
  announcementActive: "false",
  announcementText: "🎉 Get 10% off your first ride! Use code NEXTFIRST at checkout.",
  announcementUrl: "",
  announcementBgColor: "#dc2626",
  announcementTextColor: "#ffffff",
  maintenanceMode: "false",
  maintenanceMessage: "We're upgrading your ride experience. Back in a few minutes!",
  vendorRegistrationOpen: "true",
  securityDepositActive: "false",
  securityDepositAmount: "2000",
  // Promotions & Popups
  promoPopupActive: "false",
  promo1Active: "true",  promo1Title: "Welcome Offer",    promo1Type: "coupon",   promo1Value: "NEXTFIRST", promo1Desc: "10% off your first ride",
  promo2Active: "true",  promo2Title: "Weekend Special",  promo2Type: "flat",     promo2Value: "500",       promo2Desc: "₹500 off on weekend rentals",
  promo3Active: "false", promo3Title: "",                 promo3Type: "percent",  promo3Value: "",          promo3Desc: "",
  promo4Active: "false", promo4Title: "",                 promo4Type: "coupon",   promo4Value: "",          promo4Desc: "",
  promo5Active: "false", promo5Title: "",                 promo5Type: "coupon",   promo5Value: "",          promo5Desc: "",
  // Test Ride
  testRideActive: "false",
  testRideTitle: "₹1 Bike Test Ride",
  testRideDescription: "Try before you rent! 30-min demo ride at just ₹1. No commitment needed.",
  testRideVehicleType: "bike",
  testRideDurationMinutes: "30",
  testRideCity: "All Cities",
  // Spin & Win Wheel
  spinWheelActive: "false",
  spinSegment1Title: "10% OFF",      spinSegment1Value: "SPIN10",
  spinSegment2Title: "15% OFF",      spinSegment2Value: "SPIN15",
  spinSegment3Title: "20% OFF",      spinSegment3Value: "SPIN20",
  spinSegment4Title: "Free Helmet",  spinSegment4Value: "FREEHELMET",
  spinSegment5Title: "₹500 Coupon",  spinSegment5Value: "SPIN500",
  spinSegment6Title: "Try Again",    spinSegment6Value: "TRYAGAIN",
  // GST & Accessories
  receiptGstin: "",
  receiptCompanyAddress: "Saket, New Delhi, India",
  accessoryHelmetActive: "true",
  accessoryHelmetPrice: "50",
  accessoryGpsActive: "false",
  accessoryGpsPrice: "100",
  // Booking Add-on Toggles
  addonWaiverActive: "true",
  addonRsaActive: "true",
  addonHelmetActive: "true",
  // Homepage Copy Defaults
  heroTitle: "",
  heroSubtitle: "",
  sectionHeroActive: "true",
  sectionFeaturedActive: "true",
  sectionOffersActive: "true",
  sectionTestimonialsActive: "true",
  sectionFaqActive: "true",
  sectionAboutActive: "true",
  sectionWhyChooseActive: "true",
  seoTitle: "",
  seoDescription: "",
  testimonial1Name: "", testimonial1Text: "",
  testimonial2Name: "", testimonial2Text: "",
  testimonial3Name: "", testimonial3Text: "",
  faq1Question: "", faq1Answer: "",
  faq2Question: "", faq2Answer: "",
  faq3Question: "", faq3Answer: "",
  tier1Name: "Bronze Partner",
  tier1Subtitle: "Standard Partner Fleet",
  tier1Trips: "6",
  tier2Name: "Silver Host",
  tier2Subtitle: "Instant Payouts Enabled",
  tier2Trips: "16",
  tier3Name: "Gold SuperHost",
  tier3Subtitle: "Search Priority + VIP Benefits",
  tier3Trips: "31",
  tier4Name: "Diamond Elite",
  tier4Subtitle: "Lowest Platform Fee + VIP Legend Badge",
  tierRoadmapTitle: "Tier Progression Roadmap",
  tierRatingLabel: "4.9 Partner Rating",
  tierHandoverLabel: "100% On-Time Handover",
  tierCancellationLabel: "0% Cancellation Rate",
};

export function AdminSiteSettingsPanel() {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<SiteSettingsSection>("cardTheme");
  const [dashboardTheme, setDashboardTheme] = useState<"red" | "teal" | "rose" | "blue" | "amber" | "purple" | "slate">("red");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({ show: false, message: "", type: "info" });

  function showToast(msg: string, type: "success" | "error" | "info") {
    setToast({ show: true, message: msg, type });
    if (type !== "info") {
      setTimeout(() => {
        setToast((prev) => (prev.message === msg ? { ...prev, show: false } : prev));
      }, 5000);
    }
  }

  function handleUnauthorized() {
    setAuthRequired(true);
    showToast("Admin session required. Redirecting to login...", "error");
    const next = encodeURIComponent("/dashboard/admin?section=settings");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 1250);
  }

  useEffect(() => {
    let mounted = true;

    const savedTheme = (localStorage.getItem("admin-dashboard-theme") || localStorage.getItem("ng_admin_theme")) as any;
    if (savedTheme && ["red", "teal", "rose", "blue", "amber", "purple", "slate"].includes(savedTheme)) {
      setDashboardTheme(savedTheme);
      const found = themesList.find((t) => t.id === savedTheme);
      if (found && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--brand-red", found.hex);
        document.documentElement.style.setProperty("--brand-red-soft", found.soft);
        document.documentElement.style.setProperty("--brand-red-glow", found.glow);
      }
    }

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      const res = await fetch("/api/admin/site-settings", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;

      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setMessage(data.error ?? "Failed to load site settings");
        setLoading(false);
        return;
      }

      setForm({
        ...initialForm,
        ...(data.settings ?? {})
      });
      setLoading(false);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    showToast("Saving site settings...", "info");

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        setSaving(false);
        return;
      }
      if (!res.ok) {
        let errMessage = data.error ?? "Failed to save site settings";
        if (data.details && data.details.fieldErrors) {
          const fields = Object.keys(data.details.fieldErrors).join(", ");
          errMessage += ` (Invalid fields: ${fields})`;
        }
        showToast(errMessage, "error");
        setSaving(false);
        return;
      }

      setForm({
        ...form,
        ...(data.settings ?? {})
      });
      showToast("Settings saved and now live successfully! ✓", "success");
    } catch (e: any) {
      showToast(`Network error: ${e.message || "Failed to reach backend database"}`, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-20 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
    );
  }

  if (authRequired) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-center text-xs text-red-400">
        Admin authorization required.
      </div>
    );
  }

  // Live calculation for dynamic preview total billing
  const sampleRate = 1500;
  const taxRate = parseFloat(form.receiptTaxPercent) || 0;
  const taxAmount = (sampleRate * taxRate) / 100;
  const totalBill = sampleRate + taxAmount;

  function changeTheme(themeId: typeof dashboardTheme) {
    setDashboardTheme(themeId);
    localStorage.setItem("admin-dashboard-theme", themeId);
    localStorage.setItem("ng_admin_theme", themeId);

    const found = themesList.find((t) => t.id === themeId) || themesList[0];
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--brand-red", found.hex);
      document.documentElement.style.setProperty("--brand-red-soft", found.soft);
      document.documentElement.style.setProperty("--brand-red-glow", found.glow);
    }
    showToast(`✨ Admin Theme Accent switched to ${found.label}!`, "success");
  }

  return (
    <div className="space-y-5 text-white select-none">
      {/* Theme Picker Component Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">🎨 Admin Console UI Accent Theme</h4>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80">
              Active: {themesList.find(t => t.id === dashboardTheme)?.label || "Ferrari Red"}
            </span>
          </div>
          <p className="text-[11px] text-white/50 mt-1 leading-snug">
            Click any color dot to instantly transform the entire Admin Dashboard buttons, highlights, badges, and glows.
          </p>
        </div>
        
        {/* Colorful Circles Picker with Labels */}
        <div className="flex items-center gap-2.5 bg-black/50 p-2 rounded-2xl border border-white/10">
          {themesList.map((item) => {
            const isActive = dashboardTheme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => changeTheme(item.id as any)}
                title={item.label}
                className={`w-7 h-7 rounded-full transition-all duration-300 border-2 cursor-pointer flex items-center justify-center ${
                  isActive ? "scale-125 border-white ring-4 ring-white/20 shadow-lg" : "border-transparent opacity-70 hover:opacity-100 hover:scale-110"
                }`}
                style={{
                  backgroundColor: item.hex,
                }}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Selector */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
        <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Select Config Block</p>
        <div className="flex flex-wrap gap-2 text-xs uppercase font-black tracking-wider">
          {[
            { id: "cardTheme", label: "🎨 6-Card Theme Studio" },
            { id: "brand", label: "Brand Details" },
            { id: "description", label: "Description" },
            { id: "contact", label: "Contact Info" },
            { id: "social", label: "Social Links" },
            { id: "discounts", label: "Discounts & Quantities" },
            { id: "fairness", label: "Listing Fairness" },
            { id: "receipt", label: "E-Receipt Editor" },
            { id: "integrations", label: "Integrations & Verification" },
            { id: "operational", label: "⚡ Operational Controls" },
            { id: "vendorHub", label: "🏆 Vendor Hub & Tiers" },
            { id: "promotions", label: "🎁 Promotions & Popups" },
            { id: "homepage", label: "🏠 Homepage Layout" },
            { id: "seo", label: "🔍 SEO Metadata" },
          ].map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as SiteSettingsSection)}
                className={`rounded-xl px-4 py-2.5 transition border cursor-pointer ${
                  isActive
                    ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)]/20 shadow-lg shadow-[var(--brand-red)]/15"
                    : "border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs block */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        {activeSection === "cardTheme" && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>🎨</span> Vehicle Card Theme Studio (6 Distinct Styles)
              </h4>
              <p className="text-xs text-white/50 mt-1">
                Select the live vehicle card design across Explore & Booking pages. Changes apply site-wide with 0ms zero lag.
              </p>
            </div>

            {/* 6 Theme Grid Selection with Mini Visual Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  id: "classic",
                  title: "1. Classic Dark Minimal",
                  badge: "⭐ Original Default",
                  accentColor: "border-red-600/40 text-red-400",
                  desc: "Crisp, uncluttered dark layout with high-contrast typography, clean badges, and smooth micro-tilt.",
                  preview: (
                    <div className="rounded-xl border border-red-600/30 bg-gradient-to-br from-black to-red-950/20 p-3 shadow-lg relative overflow-hidden text-[10px]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-xl pointer-events-none" />
                      <div className="h-20 w-full rounded-lg overflow-hidden relative bg-neutral-900 mb-2">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" alt="Preview" className="h-full w-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-red-950/80 border border-red-600/40 text-[8px] font-bold text-red-400">🚗 CAR</span>
                      </div>
                      <p className="font-bold text-white text-xs gradient-text line-clamp-1">Tata Nexon EV</p>
                      <div className="flex gap-1 mt-1 text-[8px] text-white/60">
                        <span className="bg-blue-950/50 px-1.5 py-0.5 rounded text-blue-300">📍 Delhi</span>
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-white/70">👤 5 Seats</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="font-bold text-green-400 text-xs">₹2,300/day</span>
                        <span className="bg-red-600 px-2 py-0.5 rounded text-white text-[8px] font-bold">Book Now</span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "glassmorphism",
                  title: "2. Ultra Glassmorphism Luxury",
                  badge: "💎 Deep Frosted",
                  accentColor: "border-rose-500/40 text-rose-400",
                  desc: "Deep frosted glass (#0d0d14), crimson ambient neon glow, 3-pill spec boxes, and light shimmer sweep.",
                  preview: (
                    <div className="rounded-xl border border-white/15 bg-[#0d0d14]/90 backdrop-blur-xl p-3 shadow-lg relative overflow-hidden text-[10px]">
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-600/20 blur-xl pointer-events-none" />
                      <div className="h-20 w-full rounded-lg overflow-hidden relative bg-black mb-2">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" alt="Preview" className="h-full w-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[8px] font-bold text-rose-400">💎 LUXURY</span>
                      </div>
                      <p className="font-bold text-white text-xs line-clamp-1">Tata Nexon EV</p>
                      <div className="grid grid-cols-3 gap-1 mt-1 text-center text-[7px] text-white/70">
                        <span className="bg-white/5 p-1 rounded">⛽ Petrol</span>
                        <span className="bg-white/5 p-1 rounded">⚙️ Auto</span>
                        <span className="bg-white/5 p-1 rounded">✈️ Airport</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="font-black text-emerald-400 text-xs">₹2,300/day</span>
                        <span className="bg-gradient-to-r from-red-600 to-rose-600 px-2 py-0.5 rounded-lg text-white text-[8px] font-bold shadow-md shadow-rose-600/30">Book ⚡</span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "cyberpunk",
                  title: "3. Cyberpunk Neon Racing",
                  badge: "⚡ Neon Speed",
                  accentColor: "border-cyan-500/40 text-cyan-400",
                  desc: "Futuristic cyan & crimson neon borders, high-tech angular chips, and carbon texture backdrop.",
                  preview: (
                    <div className="rounded-xl border border-cyan-500/40 bg-[#080b12] p-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden font-mono text-[10px]">
                      <div className="h-20 w-full rounded-lg overflow-hidden relative bg-black mb-2 border border-cyan-500/20">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" alt="Preview" className="h-full w-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-[7px] font-black text-cyan-300">⚡ RACE TECH</span>
                      </div>
                      <p className="font-black text-cyan-300 text-xs line-clamp-1">TATA NEXON EV</p>
                      <div className="flex gap-1 mt-1 text-[8px] text-cyan-400/80">
                        <span className="bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">⛽ PETROL</span>
                        <span className="bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">⚙️ AUTO</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                        <span className="font-black text-cyan-300 text-xs">₹2,300/D</span>
                        <span className="bg-cyan-500 px-2 py-0.5 rounded text-black text-[8px] font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]">BOOK // NOW</span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "platinum",
                  title: "4. Platinum Luxury Minimalist",
                  badge: "👑 Prestige Gold",
                  accentColor: "border-amber-400/40 text-amber-300",
                  desc: "Refined gold/platinum border accents, champagne price text, and understated matte luxury styling.",
                  preview: (
                    <div className="rounded-xl border border-amber-400/30 bg-gradient-to-b from-[#121110] to-[#0a0a09] p-3 shadow-lg relative overflow-hidden text-[10px]">
                      <div className="h-20 w-full rounded-lg overflow-hidden relative bg-black mb-2 border border-amber-400/20">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" alt="Preview" className="h-full w-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400/30 text-[7px] font-bold text-amber-300">👑 PRESTIGE</span>
                      </div>
                      <p className="font-bold text-amber-200 text-xs line-clamp-1">Tata Nexon EV</p>
                      <p className="text-[8px] text-white/40 mt-0.5">📍 Delhi · 5 Seats · Luxury Spec</p>
                      <div className="mt-2 pt-2 border-t border-amber-400/15 flex items-center justify-between">
                        <span className="font-black text-amber-300 text-xs">₹2,300/day</span>
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-0.5 rounded-lg text-black text-[8px] font-bold">Reserve</span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "boldsport",
                  title: "5. Bold Sport Dynamic Grid",
                  badge: "🏎️ High Performance",
                  accentColor: "border-orange-500/40 text-orange-400",
                  desc: "High-energy sport badges, prominent floating daily price capsule ribbon, and vibrant CTA button.",
                  preview: (
                    <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-[#14080a] to-[#0a0a0a] p-3 shadow-lg relative overflow-hidden text-[10px]">
                      <div className="h-20 w-full rounded-lg overflow-hidden relative bg-black mb-2 border border-orange-500/20">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" alt="Preview" className="h-full w-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-orange-600 text-white text-[7px] font-black">🏎️ SPORT</span>
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-orange-400 text-[8px] font-black border border-orange-500/30">₹2,300/day</span>
                      </div>
                      <p className="font-black text-white text-xs line-clamp-1">Tata Nexon EV</p>
                      <p className="text-[8px] text-white/50 mt-0.5">📍 Delhi • ⛽ Petrol • ⚙️ Auto</p>
                      <div className="mt-2 pt-2 border-t border-orange-500/20 flex items-center justify-end">
                        <span className="bg-gradient-to-r from-orange-600 to-red-600 px-3 py-1 rounded-lg text-white text-[8px] font-black shadow-md shadow-orange-600/30">Book Ride ⚡</span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "holographic",
                  title: "6. 3D Holographic Floating",
                  badge: "✨ Multi-Color Glow",
                  accentColor: "border-purple-500/40 text-purple-400",
                  desc: "Multi-color holographic gradient borders, subtle floating elevation, and 3D perspective tilt.",
                  preview: (
                    <div className="rounded-xl p-[1px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-xl text-[10px]">
                      <div className="rounded-xl bg-[#0b0b14]/95 p-3">
                        <div className="h-20 w-full rounded-lg overflow-hidden relative bg-black mb-2">
                          <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" alt="Preview" className="h-full w-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-purple-950/90 border border-purple-400/30 text-[7px] font-bold text-purple-300">✨ HOLOGRAPHIC</span>
                        </div>
                        <p className="font-bold text-white text-xs line-clamp-1">Tata Nexon EV</p>
                        <div className="flex gap-1 mt-1 text-[8px] text-purple-300">
                          <span className="bg-purple-950/40 px-1 py-0.5 rounded">📍 Delhi</span>
                          <span className="bg-indigo-950/40 px-1 py-0.5 rounded">⛽ Petrol</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 text-xs">₹2,300/day</span>
                          <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-2 py-0.5 rounded-lg text-white text-[8px] font-bold">Book ✨</span>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ].map((th) => {
                const isSelected = (form.vehicleCardStyle || "classic") === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setForm((prev) => ({ ...prev, vehicleCardStyle: th.id }))}
                    className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                      isSelected
                        ? `bg-white/[0.06] ${th.accentColor} shadow-[0_0_30px_rgba(239,68,68,0.25)] scale-[1.02] ring-2 ring-red-500/50`
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/90">
                          {th.badge}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Visual Live Preview Box */}
                      <div className="my-2">
                        {th.preview}
                      </div>

                      <div>
                        <h5 className="text-sm font-black text-white">{th.title}</h5>
                        <p className="text-[11px] text-white/60 leading-relaxed mt-1">{th.desc}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-white/40">Theme: {th.id}</span>
                      <button
                        type="button"
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                          isSelected
                            ? "bg-[var(--brand-red)] text-white shadow-md shadow-red-600/30"
                            : "bg-white/10 text-white/70 hover:text-white"
                        }`}
                      >
                        {isSelected ? "Selected ✓" : "Select Theme"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === "brand" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">Brand Parameters</h4>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Brand Name</label>
                <input
                  value={form.brandName}
                  onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))}
                  placeholder="e.g. Next Gear Rentals"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Since Text</label>
                <input
                  value={form.sinceText}
                  onChange={(e) => setForm((prev) => ({ ...prev, sinceText: e.target.value }))}
                  placeholder="e.g. Est. 2026"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Logo URL</label>
                <input
                  value={form.logoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="e.g. /images/logo.png"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "description" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">Footer Summary Description</h4>
            <div className="space-y-1.5 text-xs">
              <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Brand Description text</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your rental fleet brand to users..."
                className="w-full min-h-[100px] rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] leading-relaxed"
              />
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">Support & Business Contacts</h4>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Customer Support Email</label>
                <input
                  value={form.supportEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
                  placeholder="e.g. support@next-gear.app"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Business Partnerships Email</label>
                <input
                  value={form.businessEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessEmail: e.target.value }))}
                  placeholder="e.g. partners@next-gear.app"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Office Helpline Telephone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 99999 88888"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "social" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">Social Channels Connect</h4>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">WhatsApp API Link</label>
                <input
                  value={form.whatsappUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, whatsappUrl: e.target.value }))}
                  placeholder="https://wa.me/..."
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Instagram URL Link</label>
                <input
                  value={form.instagramUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "discounts" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">Bulk & Duration Discount Rules</h4>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Min Qty for Multi-Vehicle Discount</label>
                <input
                  value={form.multiVehicleMinQty}
                  onChange={(e) => setForm((prev) => ({ ...prev, multiVehicleMinQty: e.target.value }))}
                  placeholder="e.g. 3"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Multi-Vehicle Discount %</label>
                <input
                  value={form.multiVehicleDiscountPercent}
                  onChange={(e) => setForm((prev) => ({ ...prev, multiVehicleDiscountPercent: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Min Days for Long-Term Discount</label>
                <input
                  value={form.durationDiscountMinDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationDiscountMinDays: e.target.value }))}
                  placeholder="e.g. 4"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Free Days Awarded on Long-Term</label>
                <input
                  value={form.durationDiscountFreeDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationDiscountFreeDays: e.target.value }))}
                  placeholder="e.g. 1"
                  className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "fairness" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">Listing Fairness & Optimization</h4>
            <div className="space-y-1.5 text-xs">
              <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Shuffle Catalog Vehicles</label>
              <select
                value={form.shuffleAvailableListings}
                onChange={(e) => setForm((prev) => ({ ...prev, shuffleAvailableListings: e.target.value }))}
                className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
              >
                <option value="true">Enable Random Catalog Shuffling</option>
                <option value="false">Disable Shuffling (Order by ID)</option>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic E-Receipt Customizer Template Editor */}
        {activeSection === "receipt" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">
              E-Receipt Layout Customizer
            </h4>
            
            <div className="grid gap-6 md:grid-cols-12 items-stretch">
              
              {/* Form entries - Left Column */}
              <div className="md:col-span-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Receipt Logo Image URL</label>
                  <input
                    value={form.receiptLogoUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, receiptLogoUrl: e.target.value }))}
                    placeholder="e.g. /Logo1.png"
                    className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Default Tax % (GST/VAT)</label>
                  <input
                    value={form.receiptTaxPercent}
                    onChange={(e) => setForm((prev) => ({ ...prev, receiptTaxPercent: e.target.value }))}
                    placeholder="e.g. 18"
                    className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Invoice Footer Signature Note</label>
                  <textarea
                    value={form.receiptFooterText}
                    onChange={(e) => setForm((prev) => ({ ...prev, receiptFooterText: e.target.value }))}
                    placeholder="Enter customer greeting note..."
                    className="w-full min-h-[90px] rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Business GSTIN (15-character ID)</label>
                  <input
                    value={form.receiptGstin || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, receiptGstin: e.target.value }))}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Company Office Address</label>
                  <input
                    value={form.receiptCompanyAddress || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, receiptCompanyAddress: e.target.value }))}
                    placeholder="e.g. Saket, New Delhi, India"
                    className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                </div>
              </div>

              {/* Dynamic Live Invoice Mock - Right Column */}
              <div className="md:col-span-6 flex flex-col justify-between">
                <p className="text-[9px] uppercase font-black tracking-wider text-white/40 mb-2">Live Receipt Preview</p>
                <div className="flex-1 rounded-2xl bg-white text-black p-5 shadow-2xl relative flex flex-col justify-between font-sans min-h-[220px]">
                  
                  {/* Receipt Header */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <div>
                      <h5 className="font-extrabold text-sm uppercase tracking-wide">{form.brandName || "NEXT GEAR"}</h5>
                      <p className="text-[9px] text-gray-400 mt-0.5">Booking Invoice</p>
                    </div>
                    {form.receiptLogoUrl && (
                      <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold uppercase select-none">Logo</span>
                    )}
                  </div>

                  {/* Summary details */}
                  <div className="py-3 text-[10px] text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Invoice ID:</span>
                      <span className="font-mono font-bold text-black">TXN-BG8420183</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vehicle Selected:</span>
                      <span className="font-bold text-black">KTM Duke 390</span>
                    </div>
                  </div>

                  {/* Ledger Breakdown */}
                  <div className="border-t border-b border-gray-100 py-3 text-[10px] space-y-1">
                    <div className="flex justify-between text-gray-500">
                      <span>1 Day Base Rental:</span>
                      <span className="font-bold text-black">₹{sampleRate.toLocaleString("en-IN")}.00</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>GST ({form.receiptTaxPercent}%):</span>
                      <span className="font-bold text-black">₹{taxAmount.toLocaleString("en-IN")}.00</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-black pt-1">
                      <span>Total Amount:</span>
                      <span>₹{totalBill.toLocaleString("en-IN")}.00</span>
                    </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="pt-3 text-[9px] text-gray-400 text-center leading-relaxed">
                    {form.receiptFooterText || "Thank you for riding with us!"}
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {activeSection === "integrations" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">
              Payment & Verification Integrations
            </h4>
            
            <div className="grid gap-5 md:grid-cols-2">
              
              {/* Payment Gateways Config card */}
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-500">
                  💳 Payment Gateway Switches
                </h5>
                
                <div className="space-y-3.5 text-xs">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="font-bold text-white group-hover:text-rose-400 transition-colors">PayU India</p>
                      <p className="text-[10px] text-white/50">Fastest checkout. UPI, Cards, NetBanking.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.payuActive === "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, payuActive: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="font-bold text-white group-hover:text-rose-400 transition-colors">PayPal</p>
                      <p className="text-[10px] text-white/50">Global checkout. Multi-currency support.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.paypalActive === "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, paypalActive: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="font-bold text-white group-hover:text-rose-400 transition-colors">Razorpay</p>
                      <p className="text-[10px] text-white/50">Best local checkout for India UPI and Cards.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.razorpayActive === "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, razorpayActive: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="font-bold text-white group-hover:text-rose-400 transition-colors">Stripe</p>
                      <p className="text-[10px] text-white/50">International credit cards & Apple Pay.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.stripeActive === "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, stripeActive: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="font-bold text-white group-hover:text-rose-400 transition-colors">Cashfree</p>
                      <p className="text-[10px] text-white/50">Popular Indian checkout with wallet splits.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.cashfreeActive === "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, cashfreeActive: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* KYC Verification Options card */}
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-500">
                  🔐 User KYC Verification Channels
                </h5>

                <div className="space-y-3.5 text-xs">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="font-bold text-white group-hover:text-rose-400 transition-colors">DigiLocker Verification</p>
                      <p className="text-[10px] text-white/50">Fetch verified DL/Gov ID automatically from government database.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.digilockerActive === "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, digilockerActive: e.target.checked ? "true" : "false" }))}
                      className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] text-white/40 leading-relaxed">
                    💡 <strong>Note:</strong> If DigiLocker is disabled, customers will only be allowed to do Manual Document Uploads on checkout.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSection === "operational" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">
              ⚡ Operational Controls
            </h4>

            {/* 1. Announcement Banner */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-400">📢 Announcement Banner</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Glowing bar above header. Use for offers, notices, events.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-white/50">{form.announcementActive === "true" ? "ON" : "OFF"}</span>
                  <input
                    type="checkbox"
                    checked={form.announcementActive === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, announcementActive: e.target.checked ? "true" : "false" }))}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Banner Message</label>
                <input
                  type="text"
                  value={form.announcementText}
                  maxLength={200}
                  onChange={(e) => setForm((prev) => ({ ...prev, announcementText: e.target.value }))}
                  placeholder="🎉 Special offer message..."
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Optional Link URL (leave blank if none)</label>
                <input
                  type="text"
                  value={form.announcementUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, announcementUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Banner Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.announcementBgColor || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, announcementBgColor: e.target.value }))}
                      className="w-10 h-9 rounded-lg border border-white/10 bg-transparent p-0.5 cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={form.announcementBgColor || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, announcementBgColor: e.target.value }))}
                      placeholder="#dc2626"
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Banner Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.announcementTextColor || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, announcementTextColor: e.target.value }))}
                      className="w-10 h-9 rounded-lg border border-white/10 bg-transparent p-0.5 cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={form.announcementTextColor || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, announcementTextColor: e.target.value }))}
                      placeholder="#ffffff"
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Maintenance Mode */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-400">⚠️ Maintenance Mode</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Freeze site for all customers. Admins/vendors can still login.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-xs font-black ${form.maintenanceMode === "true" ? "text-rose-400" : "text-white/50"}`}>
                    {form.maintenanceMode === "true" ? "ACTIVE" : "OFF"}
                  </span>
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, maintenanceMode: e.target.checked ? "true" : "false" }))}
                    className="w-4 h-4 accent-rose-500 cursor-pointer"
                  />
                </label>
              </div>
              {form.maintenanceMode === "true" && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[10px] text-rose-300">
                  ⚠️ <strong>Warning:</strong> Turning this ON will show a maintenance screen to ALL customers immediately!
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Maintenance Message</label>
                <input
                  type="text"
                  value={form.maintenanceMessage}
                  maxLength={300}
                  onChange={(e) => setForm((prev) => ({ ...prev, maintenanceMessage: e.target.value }))}
                  placeholder="We'll be back soon..."
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>
            </div>

            {/* 3. Vendor Registration */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-sky-400">💼 Vendor Registration</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Allow new partners to apply and register on the platform.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-xs font-black ${form.vendorRegistrationOpen === "true" ? "text-green-400" : "text-white/50"}`}>
                    {form.vendorRegistrationOpen === "true" ? "OPEN" : "CLOSED"}
                  </span>
                  <input
                    type="checkbox"
                    checked={form.vendorRegistrationOpen === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, vendorRegistrationOpen: e.target.checked ? "true" : "false" }))}
                    className="w-4 h-4 accent-sky-500 cursor-pointer"
                  />
                </label>
              </div>
              <p className="text-[10px] text-white/30">
                If closed, the vendor registration form will be hidden and replaced with a &quot;Registration closed&quot; notice.
              </p>
            </div>

            {/* 4. Security Deposit */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-400">💸 Refundable Security Deposit</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Charge an upfront refundable security deposit at checkout.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-white/50">{form.securityDepositActive === "true" ? "ON" : "OFF"}</span>
                  <input
                    type="checkbox"
                    checked={form.securityDepositActive === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, securityDepositActive: e.target.checked ? "true" : "false" }))}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Deposit Amount (₹)</label>
                <input
                  type="number"
                  value={form.securityDepositAmount}
                  min={0}
                  max={50000}
                  onChange={(e) => setForm((prev) => ({ ...prev, securityDepositAmount: e.target.value }))}
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                />
                <p className="text-[10px] text-white/30">Fully refundable after successful ride completion. Shown as a line item in checkout summary.</p>
              </div>
            </div>

            {/* 5. Accessories & Add-ons Pricing */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-teal-400">🪖 Accessories & Add-on Pricing</h5>
              <p className="text-[10px] text-white/40">Toggle optional accessories that customers can add during booking checkout.</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Helmet Option */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Extra Helmet</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-white/40">{form.accessoryHelmetActive === "true" ? "ENABLED" : "DISABLED"}</span>
                      <input
                        type="checkbox"
                        checked={form.accessoryHelmetActive === "true"}
                        onChange={(e) => setForm((prev) => ({ ...prev, accessoryHelmetActive: e.target.checked ? "true" : "false" }))}
                        className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Daily Rental Price (₹)</label>
                    <input
                      type="number"
                      value={form.accessoryHelmetPrice || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, accessoryHelmetPrice: e.target.value }))}
                      className="w-full rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/10"
                    />
                  </div>
                </div>

                {/* GPS Tracker Option */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Anti-Theft GPS Tracker</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-white/40">{form.accessoryGpsActive === "true" ? "ENABLED" : "DISABLED"}</span>
                      <input
                        type="checkbox"
                        checked={form.accessoryGpsActive === "true"}
                        onChange={(e) => setForm((prev) => ({ ...prev, accessoryGpsActive: e.target.checked ? "true" : "false" }))}
                        className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Daily Rental Price (₹)</label>
                    <input
                      type="number"
                      value={form.accessoryGpsPrice || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, accessoryGpsPrice: e.target.value }))}
                      className="w-full rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "vendorHub" && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>🏆</span> Vendor Business Hub, Tiers & Badges Customizer
                </h4>
                <p className="text-xs text-white/50 mt-1">
                  Customize the gamified tier ranks, booking milestones, subtitles, and performance badge texts shown on every vendor's dashboard.
                </p>
              </div>
            </div>

            {/* 4 Gamified Tiers Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Level 1 Tier */}
              <div className="rounded-2xl border border-amber-500/20 bg-black/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-lg">🥉</span>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">Level 1 Tier Rank</h5>
                    <p className="text-[10px] text-white/40">Starting tier for new vendor partners</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Tier Name / Title</label>
                    <input
                      type="text"
                      value={form.tier1Name || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier1Name: e.target.value }))}
                      placeholder="Bronze Partner"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Benefit / Subtitle Note</label>
                    <input
                      type="text"
                      value={form.tier1Subtitle || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier1Subtitle: e.target.value }))}
                      placeholder="Standard Partner Fleet"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Target Completed Trips Required</label>
                    <input
                      type="number"
                      value={form.tier1Trips || "6"}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier1Trips: e.target.value }))}
                      placeholder="6"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Level 2 Tier */}
              <div className="rounded-2xl border border-slate-400/20 bg-black/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-lg">🥈</span>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-300">Level 2 Tier Rank</h5>
                    <p className="text-[10px] text-white/40">Intermediate tier with instant payouts</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Tier Name / Title</label>
                    <input
                      type="text"
                      value={form.tier2Name || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier2Name: e.target.value }))}
                      placeholder="Silver Host"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-slate-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Benefit / Subtitle Note</label>
                    <input
                      type="text"
                      value={form.tier2Subtitle || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier2Subtitle: e.target.value }))}
                      placeholder="Instant Payouts Enabled"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-slate-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Target Completed Trips Required</label>
                    <input
                      type="number"
                      value={form.tier2Trips || "16"}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier2Trips: e.target.value }))}
                      placeholder="16"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-slate-400/40"
                    />
                  </div>
                </div>
              </div>

              {/* Level 3 Tier */}
              <div className="rounded-2xl border border-yellow-500/20 bg-black/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-lg">🥇</span>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-yellow-400">Level 3 Tier Rank</h5>
                    <p className="text-[10px] text-white/40">SuperHost tier with top search priority</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Tier Name / Title</label>
                    <input
                      type="text"
                      value={form.tier3Name || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier3Name: e.target.value }))}
                      placeholder="Gold SuperHost"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-yellow-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Benefit / Subtitle Note</label>
                    <input
                      type="text"
                      value={form.tier3Subtitle || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier3Subtitle: e.target.value }))}
                      placeholder="Search Priority + VIP Benefits"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-yellow-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Target Completed Trips Required</label>
                    <input
                      type="number"
                      value={form.tier3Trips || "31"}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier3Trips: e.target.value }))}
                      placeholder="31"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-yellow-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Level 4 Tier */}
              <div className="rounded-2xl border border-teal-500/20 bg-black/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-lg">💎</span>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-teal-400">Level 4 Tier Rank</h5>
                    <p className="text-[10px] text-white/40">Elite pinnacle tier with VIP Legend Badge</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Tier Name / Title</label>
                    <input
                      type="text"
                      value={form.tier4Name || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier4Name: e.target.value }))}
                      placeholder="Diamond Elite"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-teal-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Benefit / Subtitle Note</label>
                    <input
                      type="text"
                      value={form.tier4Subtitle || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, tier4Subtitle: e.target.value }))}
                      placeholder="Lowest Platform Fee + VIP Legend Badge"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-teal-500/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Indicators & Roadmap Headers */}
            <div className="rounded-2xl border border-white/5 bg-black/30 p-5 space-y-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">
                📈 Roadmap Title & Performance Badges
              </h5>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Progress Bar Title</label>
                  <input
                    type="text"
                    value={form.tierRoadmapTitle || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, tierRoadmapTitle: e.target.value }))}
                    placeholder="Tier Progression Roadmap"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Partner Rating Badge Text</label>
                  <input
                    type="text"
                    value={form.tierRatingLabel || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, tierRatingLabel: e.target.value }))}
                    placeholder="4.9 Partner Rating"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">On-Time Handover Badge Text</label>
                  <input
                    type="text"
                    value={form.tierHandoverLabel || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, tierHandoverLabel: e.target.value }))}
                    placeholder="100% On-Time Handover"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-1">Cancellation Rate Badge Text</label>
                  <input
                    type="text"
                    value={form.tierCancellationLabel || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, tierCancellationLabel: e.target.value }))}
                    placeholder="0% Cancellation Rate"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "promotions" && (
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">
              🎁 Promotions, Popups & ₹1 Test Rides
            </h4>

            {/* Global Popup Enable */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-500">🎯 Offer Popup Controller</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Toggle the floating discount popup visibility on the website.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-white/50">{form.promoPopupActive === "true" ? "ON" : "OFF"}</span>
                  <input
                    type="checkbox"
                    checked={form.promoPopupActive === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, promoPopupActive: e.target.checked ? "true" : "false" }))}
                    className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* ₹1 Test Ride Settings */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-400">🏍️ ₹1 Test Ride / Test Drive Settings</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Configure special test ride lead capture offer card in the popup.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-white/50">{form.testRideActive === "true" ? "ON" : "OFF"}</span>
                  <input
                    type="checkbox"
                    checked={form.testRideActive === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, testRideActive: e.target.checked ? "true" : "false" }))}
                    className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Promo Title</label>
                  <input
                    type="text"
                    value={form.testRideTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, testRideTitle: e.target.value }))}
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={form.testRideDurationMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, testRideDurationMinutes: e.target.value }))}
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Vehicle Category</label>
                  <select
                    value={form.testRideVehicleType}
                    onChange={(e) => setForm((prev) => ({ ...prev, testRideVehicleType: e.target.value }))}
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  >
                    <option value="bike" className="bg-neutral-900">City Bike</option>
                    <option value="scooty" className="bg-neutral-900">Scooty</option>
                    <option value="car" className="bg-neutral-900">Comfort Car</option>
                    <option value="all" className="bg-neutral-900">All Vehicles</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">City Availability</label>
                  <input
                    type="text"
                    value={form.testRideCity}
                    onChange={(e) => setForm((prev) => ({ ...prev, testRideCity: e.target.value }))}
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-white/40">Description Text</label>
                  <input
                    type="text"
                    value={form.testRideDescription}
                    onChange={(e) => setForm((prev) => ({ ...prev, testRideDescription: e.target.value }))}
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Individual Promo Slots */}
            <div className="space-y-4">
              <h5 className="text-[10px] uppercase font-black tracking-widest text-white/40">Active Promo Lists (Up to 5)</h5>

              {[1, 2, 3, 4, 5].map((idx) => {
                const isActive = form[`promo${idx}Active` as keyof SiteSettingsForm] === "true";
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4 transition-all duration-300 hover:border-white/10"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-black text-white/80">Slot #{idx} — {form[`promo${idx}Title` as keyof SiteSettingsForm] || "Empty Promo"}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] text-white/40">{isActive ? "ACTIVE" : "DISABLED"}</span>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              [`promo${idx}Active`]: e.target.checked ? "true" : "false",
                            }))
                          }
                          className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Promo Title</label>
                        <input
                          type="text"
                          value={form[`promo${idx}Title` as keyof SiteSettingsForm] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [`promo${idx}Title`]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Type</label>
                        <select
                          value={form[`promo${idx}Type` as keyof SiteSettingsForm] || "coupon"}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [`promo${idx}Type`]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                        >
                          <option value="coupon" className="bg-neutral-900">Coupon Code</option>
                          <option value="flat" className="bg-neutral-900">Flat Amount Off (₹)</option>
                          <option value="percent" className="bg-neutral-900">Percentage Off (%)</option>
                          <option value="freeday" className="bg-neutral-900">Free Rental Day</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Promo Code or Value</label>
                        <input
                          type="text"
                          value={form[`promo${idx}Value` as keyof SiteSettingsForm] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [`promo${idx}Value`]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-3 space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Description text</label>
                        <input
                          type="text"
                          value={form[`promo${idx}Desc` as keyof SiteSettingsForm] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [`promo${idx}Desc`]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spin & Win Wheel Settings */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-500">🎰 Gamified Spin & Win Lucky Wheel</h5>
                  <p className="text-[10px] text-white/40 mt-0.5">Toggle the interactive Spin Wheel popups and configure the segments.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-white/50">{form.spinWheelActive === "true" ? "ON" : "OFF"}</span>
                  <input
                    type="checkbox"
                    checked={form.spinWheelActive === "true"}
                    onChange={(e) => setForm((prev) => ({ ...prev, spinWheelActive: e.target.checked ? "true" : "false" }))}
                    className="w-4.5 h-4.5 accent-rose-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {form.spinWheelActive === "true" && (
                <div className="space-y-4">
                  <p className="text-[10px] text-white/35">Define title/coupon for each of the 6 sectors. Landing is randomized on spin.</p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <div key={num} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                        <span className="text-[10px] font-black text-rose-400">Sector #{num}</span>
                        <div className="grid gap-2.5 grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Display Title</label>
                            <input
                              type="text"
                              value={form[`spinSegment${num}Title` as keyof SiteSettingsForm] || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, [`spinSegment${num}Title`]: e.target.value }))}
                              className="w-full rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/10"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black tracking-wider text-white/40">Coupon / Value</label>
                            <input
                              type="text"
                              value={form[`spinSegment${num}Value` as keyof SiteSettingsForm] || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, [`spinSegment${num}Value`]: e.target.value }))}
                              className="w-full rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "homepage" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">🏠 Homepage Layout & Copy Settings</h4>
            
            {/* Hero Copy Settings */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-sky-400">✨ Homepage Hero Headline & Subtitle</h5>
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Hero Headline (Use \n for line breaks)</label>
                  <textarea
                    value={form.heroTitle || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, heroTitle: e.target.value }))}
                    placeholder="e.g. Next Gear Rentals\nRide Anywhere in India"
                    className="w-full min-h-[70px] rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Hero Subtitle Paragraph</label>
                  <textarea
                    value={form.heroSubtitle || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
                    placeholder="Enter hero subtitle paragraph copy..."
                    className="w-full min-h-[90px] rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Homepage Section Visibility Toggles */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-400">☑ Section Visibility Switchboard</h5>
              <p className="text-[10px] text-white/40 mt-0.5">Toggle active homepage content blocks instantly without code changes.</p>
              
              <div className="grid gap-4 md:grid-cols-2 text-xs">
                {[
                  { key: "sectionHeroActive", label: "Homepage Hero Section" },
                  { key: "sectionFeaturedActive", label: "Featured Bikes & Cars inventory showcase" },
                  { key: "sectionOffersActive", label: "Dynamic Offers & Promo code banners" },
                  { key: "sectionTestimonialsActive", label: "Testimonials (Loved by frequent riders)" },
                  { key: "sectionFaqActive", label: "Frequently Asked Questions block" },
                  { key: "sectionAboutActive", label: "Company About Description stats section" },
                  { key: "sectionWhyChooseActive", label: "Why Choose Us details block" },
                ].map((sec) => {
                  const stateVal = form[sec.key as keyof SiteSettingsForm] === "true";
                  return (
                    <label key={sec.key} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-[#121212] cursor-pointer">
                      <span className="font-semibold text-white/70">{sec.label}</span>
                      <input
                        type="checkbox"
                        checked={stateVal}
                        onChange={(e) => setForm((prev) => ({ ...prev, [sec.key]: e.target.checked ? "true" : "false" }))}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Booking Add-ons Control */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-cyan-400">🛡️ Booking Add-ons Visibility</h5>
              <p className="text-[10px] text-white/40 mt-0.5">Control which optional add-ons are shown to customers during the booking flow.</p>
              
              <div className="grid gap-3 md:grid-cols-3 text-xs">
                {[
                  { key: "addonWaiverActive", label: "🛡️ Damage Waiver", desc: "Protection against accidental damage" },
                  { key: "addonRsaActive", label: "🆘 Roadside Assist", desc: "24x7 emergency roadside help" },
                  { key: "addonHelmetActive", label: "🪖 Extra Helmet", desc: "Additional helmet for pillion rider" },
                ].map((addon) => {
                  const isOn = form[addon.key as keyof SiteSettingsForm] === "true";
                  return (
                    <label key={addon.key} className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isOn ? "border-cyan-500/40 bg-cyan-950/20" : "border-white/5 bg-[#121212]"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white/80">{addon.label}</span>
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={(e) => setForm((prev) => ({ ...prev, [addon.key]: e.target.checked ? "true" : "false" }))}
                          className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-white/35 leading-relaxed">{addon.desc}</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${isOn ? "text-cyan-400" : "text-white/25"}`}>
                        {isOn ? "● VISIBLE TO CUSTOMERS" : "○ HIDDEN FROM BOOKING"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Testimonials Editor */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-400">💬 Customer Testimonials</h5>
              <p className="text-[10px] text-white/40 mt-0.5">Configure 3 customer reviews shown dynamically in the testimonials section.</p>
              
              <div className="space-y-4">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] grid gap-3 text-xs md:grid-cols-[1fr_2fr]">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-white/45 tracking-wider">Reviewer Name & City (Review #{idx})</label>
                      <input
                        type="text"
                        value={form[`testimonial${idx}Name` as keyof SiteSettingsForm] || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [`testimonial${idx}Name`]: e.target.value }))}
                        placeholder="e.g. Amit Kumar, Mumbai"
                        className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-white/45 tracking-wider">Review Quote / Feedback</label>
                      <input
                        type="text"
                        value={form[`testimonial${idx}Text` as keyof SiteSettingsForm] || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [`testimonial${idx}Text`]: e.target.value }))}
                        placeholder="e.g. Extremely transparent rental pricing and smooth vehicle pick up."
                        className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs Editor */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-violet-400">❓ Frequently Asked Questions (FAQs)</h5>
              <p className="text-[10px] text-white/40 mt-0.5">Configure 3 questions and answers shown in the homepage FAQ section.</p>
              
              <div className="space-y-4">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-white/45 tracking-wider">Question #{idx}</label>
                      <input
                        type="text"
                        value={form[`faq${idx}Question` as keyof SiteSettingsForm] || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [`faq${idx}Question`]: e.target.value }))}
                        placeholder="e.g. Is security deposit refundable?"
                        className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-white/45 tracking-wider">Answer #{idx}</label>
                      <textarea
                        value={form[`faq${idx}Answer` as keyof SiteSettingsForm] || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [`faq${idx}Answer`]: e.target.value }))}
                        placeholder="e.g. Yes, security deposit is fully refunded within 24 hours of vehicle return."
                        className="w-full min-h-[60px] rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)] leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "seo" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-2">🔍 SEO Metadata Parameters</h4>
            
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-400">🌐 Page Meta Header Customizer</h5>
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">SEO Title Tag (Page browser title)</label>
                  <input
                    type="text"
                    value={form.seoTitle || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="e.g. Next Gear Rentals - Premium Bike & Car Rentals"
                    className="w-full rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-white/40 tracking-wider">SEO Description Meta tag (For Google search snippets)</label>
                  <textarea
                    value={form.seoDescription || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Enter SEO meta description copy..."
                    className="w-full min-h-[90px] rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-white/5 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-[var(--brand-red)] hover:brightness-110 text-white font-extrabold uppercase tracking-wider text-xs px-6 py-3 transition cursor-pointer"
          >
            {saving ? "Saving Config..." : "Save Site Configuration"}
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          className="fixed bottom-5 right-5 z-[9999] max-w-sm rounded-2xl p-4 border shadow-2xl backdrop-blur-md transition-all duration-300 animate-[fade-up_0.35s_ease-out] flex gap-3 items-start"
          style={{
            background: toast.type === "success"
              ? "rgba(16,185,129,0.12)"
              : toast.type === "error"
              ? "rgba(239,68,68,0.12)"
              : "rgba(245,158,11,0.12)",
            borderColor: toast.type === "success"
              ? "rgba(16,185,129,0.3)"
              : toast.type === "error"
              ? "rgba(239,68,68,0.3)"
              : "rgba(245,158,11,0.3)",
          }}
        >
          <span className="text-lg leading-none">
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "⏳"}
          </span>
          <div className="text-left flex-1 space-y-1">
            <h5
              className="text-[10px] font-black uppercase tracking-wider leading-none"
              style={{
                color: toast.type === "success"
                  ? "#34d399"
                  : toast.type === "error"
                  ? "#f87171"
                  : "#fbbf24",
              }}
            >
              {toast.type === "success" ? "Success" : toast.type === "error" ? "Error Failed" : "Processing"}
            </h5>
            <p className="text-white text-xs font-medium leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-white/40 hover:text-white text-xs leading-none font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
