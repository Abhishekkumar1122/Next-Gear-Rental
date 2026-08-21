import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { NextResponse } from "next/server";
import { z } from "zod";

const siteSettingsSchema = z.object({
  brandName: z.string().min(2).max(80).optional(),
  sinceText: z.string().min(2).max(40).optional(),
  description: z.string().min(10).max(240).optional(),
  supportEmail: z.string().email().optional(),
  businessEmail: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  whatsappUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  logoUrl: z.string().min(1).max(300).optional(),
  multiVehicleMinQty: z.string().optional(),
  multiVehicleDiscountPercent: z.string().optional(),
  durationDiscountMinDays: z.string().optional(),
  durationDiscountFreeDays: z.string().optional(),
  shuffleAvailableListings: z.string().optional(),
  receiptFooterText: z.string().optional(),
  receiptTaxPercent: z.string().optional(),
  receiptLogoUrl: z.string().optional(),
  payuActive: z.string().optional(),
  paypalActive: z.string().optional(),
  razorpayActive: z.string().optional(),
  stripeActive: z.string().optional(),
  cashfreeActive: z.string().optional(),
  digilockerActive: z.string().optional(),
  // Operational Controls
  announcementActive: z.string().optional(),
  announcementText: z.string().max(200).optional(),
  announcementUrl: z.string().max(300).optional(),
  announcementBgColor: z.string().max(20).optional(),
  announcementTextColor: z.string().max(20).optional(),
  maintenanceMode: z.string().optional(),
  maintenanceMessage: z.string().max(300).optional(),
  vendorRegistrationOpen: z.string().optional(),
  securityDepositActive: z.string().optional(),
  securityDepositAmount: z.string().optional(),
  // Promotions & Popups
  promoPopupActive: z.string().optional(),
  promo1Active: z.string().optional(), promo1Title: z.string().max(60).optional(), promo1Type: z.string().optional(), promo1Value: z.string().max(60).optional(), promo1Desc: z.string().max(120).optional(),
  promo2Active: z.string().optional(), promo2Title: z.string().max(60).optional(), promo2Type: z.string().optional(), promo2Value: z.string().max(60).optional(), promo2Desc: z.string().max(120).optional(),
  promo3Active: z.string().optional(), promo3Title: z.string().max(60).optional(), promo3Type: z.string().optional(), promo3Value: z.string().max(60).optional(), promo3Desc: z.string().max(120).optional(),
  promo4Active: z.string().optional(), promo4Title: z.string().max(60).optional(), promo4Type: z.string().optional(), promo4Value: z.string().max(60).optional(), promo4Desc: z.string().max(120).optional(),
  promo5Active: z.string().optional(), promo5Title: z.string().max(60).optional(), promo5Type: z.string().optional(), promo5Value: z.string().max(60).optional(), promo5Desc: z.string().max(120).optional(),
  // Test Ride
  testRideActive: z.string().optional(),
  testRideTitle: z.string().max(80).optional(),
  testRideDescription: z.string().max(200).optional(),
  testRideVehicleType: z.string().optional(),
  testRideDurationMinutes: z.string().optional(),
  testRideCity: z.string().max(100).optional(),
  // Spin & Win Wheel
  spinWheelActive: z.string().optional(),
  spinSegment1Title: z.string().max(40).optional(), spinSegment1Value: z.string().max(60).optional(),
  spinSegment2Title: z.string().max(40).optional(), spinSegment2Value: z.string().max(60).optional(),
  spinSegment3Title: z.string().max(40).optional(), spinSegment3Value: z.string().max(60).optional(),
  spinSegment4Title: z.string().max(40).optional(), spinSegment4Value: z.string().max(60).optional(),
  spinSegment5Title: z.string().max(40).optional(), spinSegment5Value: z.string().max(60).optional(),
  spinSegment6Title: z.string().max(40).optional(), spinSegment6Value: z.string().max(60).optional(),
  // GST & Accessories
  receiptGstin: z.string().max(30).optional(),
  receiptCompanyAddress: z.string().max(200).optional(),
  accessoryHelmetActive: z.string().optional(),
  accessoryHelmetPrice: z.string().optional(),
  accessoryGpsActive: z.string().optional(),
  accessoryGpsPrice: z.string().optional(),
  // Homepage Copy & Sections
  heroTitle: z.string().max(150).optional(),
  heroSubtitle: z.string().max(300).optional(),
  sectionHeroActive: z.string().optional(),
  sectionFeaturedActive: z.string().optional(),
  sectionOffersActive: z.string().optional(),
  sectionTestimonialsActive: z.string().optional(),
  sectionFaqActive: z.string().optional(),
  sectionAboutActive: z.string().optional(),
  sectionWhyChooseActive: z.string().optional(),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  testimonial1Name: z.string().max(60).optional(), testimonial1Text: z.string().max(250).optional(),
  testimonial2Name: z.string().max(60).optional(), testimonial2Text: z.string().max(250).optional(),
  testimonial3Name: z.string().max(60).optional(), testimonial3Text: z.string().max(250).optional(),
  faq1Question: z.string().max(100).optional(), faq1Answer: z.string().max(300).optional(),
  faq2Question: z.string().max(100).optional(), faq2Answer: z.string().max(300).optional(),
  faq3Question: z.string().max(100).optional(), faq3Answer: z.string().max(300).optional(),
});

export async function GET() {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = siteSettingsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await updateSiteSettings(parsed.data);
  return NextResponse.json({ message: "Site settings updated", settings });
}
