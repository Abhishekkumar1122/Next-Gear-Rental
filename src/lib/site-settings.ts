// Shared Client/Server site settings configuration schemas and defaults

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
  // Vehicle Card Theme
  vehicleCardStyle: "classic" | "glassmorphism" | "cyberpunk" | "platinum" | "boldsport" | "holographic";
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
  vehicleCardStyle: "classic",
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

// Server-side retrieval and update helpers decoupled to site-settings-server.ts
