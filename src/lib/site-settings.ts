import { prisma } from "@/lib/prisma";

export type SiteSettings = {
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
  // Homepage Copy & Structure
  heroTitle: string;
  heroSubtitle: string;
  sectionHeroActive: string;
  sectionFeaturedActive: string;
  sectionOffersActive: string;
  sectionTestimonialsActive: string;
  sectionFaqActive: string;
  sectionAboutActive: string;
  sectionWhyChooseActive: string;
  // SEO Copy
  seoTitle: string;
  seoDescription: string;
  // Testimonials
  testimonial1Name: string; testimonial1Text: string;
  testimonial2Name: string; testimonial2Text: string;
  testimonial3Name: string; testimonial3Text: string;
  // FAQs
  faq1Question: string; faq1Answer: string;
  faq2Question: string; faq2Answer: string;
  faq3Question: string; faq3Answer: string;
};

export const defaultSiteSettings: SiteSettings = {
  brandName: "NEXT GEAR",
  sinceText: "SINCE 2022",
  description: "Bike, car, and scooty rentals built for India-wide scale with verified fleets and instant booking.",
  supportEmail: "support@next-gear.app",
  businessEmail: "partners@next-gear.app",
  phone: "9523765172",
  whatsappUrl: "https://chat.whatsapp.com/F636yrEkcLB7v3zB2Y3Wjm?mode=gi_t",
  instagramUrl: "https://www.instagram.com/_nextgear_rentals?igsh=eDIwN25md2dpYWN1",
  logoUrl: "/next-gear-full-transparent-badge-v2.png",
  multiVehicleMinQty: "3",
  multiVehicleDiscountPercent: "10",
  durationDiscountMinDays: "4",
  durationDiscountFreeDays: "1",
  shuffleAvailableListings: "true",
  receiptFooterText: "Thank you for renting with Next Gear. Ride safe!",
  receiptTaxPercent: "18",
  receiptLogoUrl: "/next-gear-full-transparent-badge-v2.png",
  // Integrations & Verification
  payuActive: "true",
  paypalActive: "true",
  razorpayActive: "false",
  stripeActive: "false",
  cashfreeActive: "false",
  digilockerActive: "false",
  // Operational Controls
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
  // Homepage Defaults
  heroTitle: "Next Gear Rentals\nRide Anywhere in India",
  heroSubtitle: "Bike, car, and scooty rentals built for India-wide scale. Instant booking, verified fleets, and 24x7 support wherever you land.",
  sectionHeroActive: "true",
  sectionFeaturedActive: "true",
  sectionOffersActive: "true",
  sectionTestimonialsActive: "true",
  sectionFaqActive: "true",
  sectionAboutActive: "true",
  sectionWhyChooseActive: "true",
  seoTitle: "Next Gear Rentals - Premium Bike & Car Rentals",
  seoDescription: "Rent verified two-wheelers and cars at cheap rates. Dynamic discounts, zero security deposit options, and instant deliveries.",
  testimonial1Name: "Aarav, Bengaluru",
  testimonial1Text: "Picked up a clean car in 10 minutes. Support was quick and helpful.",
  testimonial2Name: "Neha, Dubai",
  testimonial2Text: "NRI process was smooth with passport + IDP. Highly recommended.",
  testimonial3Name: "Rahul, Delhi",
  testimonial3Text: "Amazing experience. The vehicle was perfectly maintained.",
  faq1Question: "What documents do I need?",
  faq1Answer: "Valid driving license + 2 photo ID proofs. For NRIs: passport + IDP.",
  faq2Question: "Is fuel included?",
  faq2Answer: "You get the vehicle with a full tank. Return with a full tank to avoid charges.",
  faq3Question: "Can I extend my booking?",
  faq3Answer: "Yes! Extend through the app anytime. Subject to vehicle availability.",
};

type SiteSettingRow = {
  key: string;
  value: string;
};

let ensuredTable = false;
let runtimeSiteSettings: SiteSettings = { ...defaultSiteSettings };
let cachedSettings: { data: SiteSettings; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds memory cache

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    ensuredTable = true;
  } catch (err) {
    console.warn("Prisma ensureTable SiteSetting fallback:", err);
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  // ⚡ Fast path: Return cached settings if available and fresh (<60s)
  if (cachedSettings && Date.now() - cachedSettings.timestamp < CACHE_TTL_MS) {
    return cachedSettings.data;
  }

  if (!process.env.DATABASE_URL) {
    return { ...runtimeSiteSettings };
  }

  try {
    // ⚡ Add 1.5s timeout race condition so DB pooler lag never blocks page rendering
    const dbPromise = (async () => {
      await ensureTable();
      const rows = await prisma.$queryRawUnsafe<SiteSettingRow[]>(
        `SELECT key, value FROM "SiteSetting"`
      );
      return rows;
    })();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB_TIMEOUT")), 1500)
    );

    const rows = await Promise.race([dbPromise, timeoutPromise]);
    const map = new Map((rows as SiteSettingRow[]).map((row) => [row.key, row.value]));

    const result: SiteSettings = {
      brandName: map.get("brandName") || defaultSiteSettings.brandName,
      sinceText: map.get("sinceText") || defaultSiteSettings.sinceText,
      description: map.get("description") || defaultSiteSettings.description,
      supportEmail: map.get("supportEmail") || defaultSiteSettings.supportEmail,
      businessEmail: map.get("businessEmail") || defaultSiteSettings.businessEmail,
      phone: map.get("phone") || defaultSiteSettings.phone,
      whatsappUrl: map.get("whatsappUrl") || defaultSiteSettings.whatsappUrl,
      instagramUrl: map.get("instagramUrl") || defaultSiteSettings.instagramUrl,
      logoUrl: map.get("logoUrl") || defaultSiteSettings.logoUrl,
      multiVehicleMinQty: map.get("multiVehicleMinQty") || defaultSiteSettings.multiVehicleMinQty,
      multiVehicleDiscountPercent: map.get("multiVehicleDiscountPercent") || defaultSiteSettings.multiVehicleDiscountPercent,
      durationDiscountMinDays: map.get("durationDiscountMinDays") || defaultSiteSettings.durationDiscountMinDays,
      durationDiscountFreeDays: map.get("durationDiscountFreeDays") || defaultSiteSettings.durationDiscountFreeDays,
      shuffleAvailableListings: map.get("shuffleAvailableListings") || defaultSiteSettings.shuffleAvailableListings,
      receiptFooterText: map.get("receiptFooterText") || defaultSiteSettings.receiptFooterText,
      receiptTaxPercent: map.get("receiptTaxPercent") || defaultSiteSettings.receiptTaxPercent,
      receiptLogoUrl: map.get("receiptLogoUrl") || defaultSiteSettings.receiptLogoUrl,
      payuActive: map.get("payuActive") || defaultSiteSettings.payuActive,
      paypalActive: map.get("paypalActive") || defaultSiteSettings.paypalActive,
      razorpayActive: map.get("razorpayActive") || defaultSiteSettings.razorpayActive,
      stripeActive: map.get("stripeActive") || defaultSiteSettings.stripeActive,
      cashfreeActive: map.get("cashfreeActive") || defaultSiteSettings.cashfreeActive,
      digilockerActive: map.get("digilockerActive") || defaultSiteSettings.digilockerActive,
      announcementActive: map.get("announcementActive") ?? defaultSiteSettings.announcementActive,
      announcementText: map.get("announcementText") || defaultSiteSettings.announcementText,
      announcementUrl: map.get("announcementUrl") ?? defaultSiteSettings.announcementUrl,
      announcementBgColor: map.get("announcementBgColor") || defaultSiteSettings.announcementBgColor,
      announcementTextColor: map.get("announcementTextColor") || defaultSiteSettings.announcementTextColor,
      maintenanceMode: map.get("maintenanceMode") ?? defaultSiteSettings.maintenanceMode,
      maintenanceMessage: map.get("maintenanceMessage") || defaultSiteSettings.maintenanceMessage,
      vendorRegistrationOpen: map.get("vendorRegistrationOpen") ?? defaultSiteSettings.vendorRegistrationOpen,
      securityDepositActive: map.get("securityDepositActive") ?? defaultSiteSettings.securityDepositActive,
      securityDepositAmount: map.get("securityDepositAmount") || defaultSiteSettings.securityDepositAmount,
      // Promotions & Popups
      promoPopupActive: map.get("promoPopupActive") ?? defaultSiteSettings.promoPopupActive,
      promo1Active: map.get("promo1Active") ?? defaultSiteSettings.promo1Active,
      promo1Title: map.get("promo1Title") ?? defaultSiteSettings.promo1Title,
      promo1Type: map.get("promo1Type") ?? defaultSiteSettings.promo1Type,
      promo1Value: map.get("promo1Value") ?? defaultSiteSettings.promo1Value,
      promo1Desc: map.get("promo1Desc") ?? defaultSiteSettings.promo1Desc,
      promo2Active: map.get("promo2Active") ?? defaultSiteSettings.promo2Active,
      promo2Title: map.get("promo2Title") ?? defaultSiteSettings.promo2Title,
      promo2Type: map.get("promo2Type") ?? defaultSiteSettings.promo2Type,
      promo2Value: map.get("promo2Value") ?? defaultSiteSettings.promo2Value,
      promo2Desc: map.get("promo2Desc") ?? defaultSiteSettings.promo2Desc,
      promo3Active: map.get("promo3Active") ?? defaultSiteSettings.promo3Active,
      promo3Title: map.get("promo3Title") ?? defaultSiteSettings.promo3Title,
      promo3Type: map.get("promo3Type") ?? defaultSiteSettings.promo3Type,
      promo3Value: map.get("promo3Value") ?? defaultSiteSettings.promo3Value,
      promo3Desc: map.get("promo3Desc") ?? defaultSiteSettings.promo3Desc,
      promo4Active: map.get("promo4Active") ?? defaultSiteSettings.promo4Active,
      promo4Title: map.get("promo4Title") ?? defaultSiteSettings.promo4Title,
      promo4Type: map.get("promo4Type") ?? defaultSiteSettings.promo4Type,
      promo4Value: map.get("promo4Value") ?? defaultSiteSettings.promo4Value,
      promo4Desc: map.get("promo4Desc") ?? defaultSiteSettings.promo4Desc,
      promo5Active: map.get("promo5Active") ?? defaultSiteSettings.promo5Active,
      promo5Title: map.get("promo5Title") ?? defaultSiteSettings.promo5Title,
      promo5Type: map.get("promo5Type") ?? defaultSiteSettings.promo5Type,
      promo5Value: map.get("promo5Value") ?? defaultSiteSettings.promo5Value,
      promo5Desc: map.get("promo5Desc") ?? defaultSiteSettings.promo5Desc,
      // Test Ride
      testRideActive: map.get("testRideActive") ?? defaultSiteSettings.testRideActive,
      testRideTitle: map.get("testRideTitle") || defaultSiteSettings.testRideTitle,
      testRideDescription: map.get("testRideDescription") || defaultSiteSettings.testRideDescription,
      testRideVehicleType: map.get("testRideVehicleType") || defaultSiteSettings.testRideVehicleType,
      testRideDurationMinutes: map.get("testRideDurationMinutes") || defaultSiteSettings.testRideDurationMinutes,
      testRideCity: map.get("testRideCity") || defaultSiteSettings.testRideCity,
      // Spin & Win Wheel
      spinWheelActive: map.get("spinWheelActive") ?? defaultSiteSettings.spinWheelActive,
      spinSegment1Title: map.get("spinSegment1Title") || defaultSiteSettings.spinSegment1Title,
      spinSegment1Value: map.get("spinSegment1Value") || defaultSiteSettings.spinSegment1Value,
      spinSegment2Title: map.get("spinSegment2Title") || defaultSiteSettings.spinSegment2Title,
      spinSegment2Value: map.get("spinSegment2Value") || defaultSiteSettings.spinSegment2Value,
      spinSegment3Title: map.get("spinSegment3Title") || defaultSiteSettings.spinSegment3Title,
      spinSegment3Value: map.get("spinSegment3Value") || defaultSiteSettings.spinSegment3Value,
      spinSegment4Title: map.get("spinSegment4Title") || defaultSiteSettings.spinSegment4Title,
      spinSegment4Value: map.get("spinSegment4Value") || defaultSiteSettings.spinSegment4Value,
      spinSegment5Title: map.get("spinSegment5Title") || defaultSiteSettings.spinSegment5Title,
      spinSegment5Value: map.get("spinSegment5Value") || defaultSiteSettings.spinSegment5Value,
      spinSegment6Title: map.get("spinSegment6Title") || defaultSiteSettings.spinSegment6Title,
      spinSegment6Value: map.get("spinSegment6Value") || defaultSiteSettings.spinSegment6Value,
      // GST & Accessories
      receiptGstin: map.get("receiptGstin") ?? defaultSiteSettings.receiptGstin,
      receiptCompanyAddress: map.get("receiptCompanyAddress") || defaultSiteSettings.receiptCompanyAddress,
      accessoryHelmetActive: map.get("accessoryHelmetActive") ?? defaultSiteSettings.accessoryHelmetActive,
      accessoryHelmetPrice: map.get("accessoryHelmetPrice") || defaultSiteSettings.accessoryHelmetPrice,
      accessoryGpsActive: map.get("accessoryGpsActive") ?? defaultSiteSettings.accessoryGpsActive,
      accessoryGpsPrice: map.get("accessoryGpsPrice") || defaultSiteSettings.accessoryGpsPrice,
      // Booking Add-on Toggles
      addonWaiverActive: map.get("addonWaiverActive") ?? defaultSiteSettings.addonWaiverActive,
      addonRsaActive: map.get("addonRsaActive") ?? defaultSiteSettings.addonRsaActive,
      addonHelmetActive: map.get("addonHelmetActive") ?? defaultSiteSettings.addonHelmetActive,
      // Homepage
      heroTitle: map.get("heroTitle") || defaultSiteSettings.heroTitle,
      heroSubtitle: map.get("heroSubtitle") || defaultSiteSettings.heroSubtitle,
      sectionHeroActive: map.get("sectionHeroActive") ?? defaultSiteSettings.sectionHeroActive,
      sectionFeaturedActive: map.get("sectionFeaturedActive") ?? defaultSiteSettings.sectionFeaturedActive,
      sectionOffersActive: map.get("sectionOffersActive") ?? defaultSiteSettings.sectionOffersActive,
      sectionTestimonialsActive: map.get("sectionTestimonialsActive") ?? defaultSiteSettings.sectionTestimonialsActive,
      sectionFaqActive: map.get("sectionFaqActive") ?? defaultSiteSettings.sectionFaqActive,
      sectionAboutActive: map.get("sectionAboutActive") ?? defaultSiteSettings.sectionAboutActive,
      sectionWhyChooseActive: map.get("sectionWhyChooseActive") ?? defaultSiteSettings.sectionWhyChooseActive,
      seoTitle: map.get("seoTitle") || defaultSiteSettings.seoTitle,
      seoDescription: map.get("seoDescription") || defaultSiteSettings.seoDescription,
      testimonial1Name: map.get("testimonial1Name") || defaultSiteSettings.testimonial1Name,
      testimonial1Text: map.get("testimonial1Text") || defaultSiteSettings.testimonial1Text,
      testimonial2Name: map.get("testimonial2Name") || defaultSiteSettings.testimonial2Name,
      testimonial2Text: map.get("testimonial2Text") || defaultSiteSettings.testimonial2Text,
      testimonial3Name: map.get("testimonial3Name") || defaultSiteSettings.testimonial3Name,
      testimonial3Text: map.get("testimonial3Text") || defaultSiteSettings.testimonial3Text,
      faq1Question: map.get("faq1Question") || defaultSiteSettings.faq1Question,
      faq1Answer: map.get("faq1Answer") || defaultSiteSettings.faq1Answer,
      faq2Question: map.get("faq2Question") || defaultSiteSettings.faq2Question,
      faq2Answer: map.get("faq2Answer") || defaultSiteSettings.faq2Answer,
      faq3Question: map.get("faq3Question") || defaultSiteSettings.faq3Question,
      faq3Answer: map.get("faq3Answer") || defaultSiteSettings.faq3Answer,
    };
    cachedSettings = { data: result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.warn("getSiteSettings fallback to runtime/cached settings:", err);
    if (cachedSettings) return cachedSettings.data;
    return { ...runtimeSiteSettings };
  }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  cachedSettings = null; // Invalidate memory cache so updates reflect immediately
  if (!process.env.DATABASE_URL) {
    runtimeSiteSettings = {
      ...runtimeSiteSettings,
      ...patch,
    };
    return { ...runtimeSiteSettings };
  }

  await ensureTable();

  const entries = Object.entries(patch).filter(([, value]) => typeof value === "string");
  for (const [key, value] of entries) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "SiteSetting" (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      key,
      value
    );
  }

  return getSiteSettings();
}
