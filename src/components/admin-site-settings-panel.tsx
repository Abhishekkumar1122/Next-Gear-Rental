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
};

type FooterSettingsSection = "brand" | "description" | "contact" | "social" | "discounts" | "fairness" | "receipt" | "integrations" | "operational" | "promotions" | "homepage" | "seo";

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
};

export function AdminSiteSettingsPanel() {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<FooterSettingsSection>("brand");
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
    const next = encodeURIComponent("/dashboard/admin?section=footer");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 1250);
  }

  useEffect(() => {
    let mounted = true;

    const savedTheme = localStorage.getItem("ng_admin_theme") as any;
    if (savedTheme && ["red", "teal", "rose", "blue", "amber", "purple", "slate"].includes(savedTheme)) {
      setDashboardTheme(savedTheme);
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

  const themesList = [
    { id: "red", hex: "#dc2626", label: "Red Default" },
    { id: "teal", hex: "#0d9488", label: "Teal Emerald" },
    { id: "rose", hex: "#e11d48", label: "Rose Pink" },
    { id: "blue", hex: "#2563eb", label: "Royal Blue" },
    { id: "amber", hex: "#d97706", label: "Amber Orange" },
    { id: "purple", hex: "#7c3aed", label: "Violet Purple" },
    { id: "slate", hex: "#64748b", label: "Slate Silver" },
  ];

  function changeTheme(themeId: typeof dashboardTheme) {
    setDashboardTheme(themeId);
    localStorage.setItem("ng_admin_theme", themeId);
  }

  return (
    <div className="space-y-5 text-white select-none">
      <style>{`
        :root {
          --brand-red: ${
            dashboardTheme === "red" ? "#dc2626" :
            dashboardTheme === "teal" ? "#0d9488" :
            dashboardTheme === "rose" ? "#e11d48" :
            dashboardTheme === "blue" ? "#2563eb" :
            dashboardTheme === "amber" ? "#d97706" :
            dashboardTheme === "purple" ? "#7c3aed" :
            "#64748b"
          };
          --brand-red-soft: ${
            dashboardTheme === "red" ? "#fca5a5" :
            dashboardTheme === "teal" ? "#99f6e4" :
            dashboardTheme === "rose" ? "#fecdd3" :
            dashboardTheme === "blue" ? "#bfdbfe" :
            dashboardTheme === "amber" ? "#fde68a" :
            dashboardTheme === "purple" ? "#ddd6fe" :
            "#cbd5e1"
          };
        }
      `}</style>

      {/* Theme Picker Component Bar */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">🎨 Customize Panel Accent Theme</h4>
          <p className="text-[10px] text-white/40 mt-1 leading-snug">Personalize the dashboard panel style. Red is the default brand identity color.</p>
        </div>
        
        {/* Colorful Circles Picker */}
        <div className="flex items-center gap-3">
          {themesList.map((item) => {
            const isActive = dashboardTheme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => changeTheme(item.id as any)}
                title={item.label}
                className={`w-6 h-6 rounded-full transition-all duration-300 border-2 cursor-pointer ${
                  isActive ? "scale-110 border-white ring-4 ring-white/10" : "border-transparent hover:scale-105"
                }`}
                style={{
                  backgroundColor: item.hex,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Settings Selector */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
        <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Select Config Block</p>
        <div className="flex flex-wrap gap-2 text-xs uppercase font-black tracking-wider">
          {[
            { id: "brand", label: "Brand Details" },
            { id: "description", label: "Description" },
            { id: "contact", label: "Contact Info" },
            { id: "social", label: "Social Links" },
            { id: "discounts", label: "Discounts & Quantities" },
            { id: "fairness", label: "Listing Fairness" },
            { id: "receipt", label: "E-Receipt Editor" },
            { id: "integrations", label: "Integrations & Verification" },
            { id: "operational", label: "⚡ Operational Controls" },
            { id: "promotions", label: "🎁 Promotions & Popups" },
            { id: "homepage", label: "🏠 Homepage Layout" },
            { id: "seo", label: "🔍 SEO Metadata" },
          ].map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as FooterSettingsSection)}
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
