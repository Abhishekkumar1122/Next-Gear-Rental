export interface CustomTemplateConfig {
  id: string;
  name: string;
  type: "email" | "whatsapp";
  categoryText: string;
  headerIconText: string;
  subject: string;
  headline: string;
  bodyContent: string;
  buttonText: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
  supportEmail?: string;
  websiteUrl?: string;
  updatedAt: string;
}

const DEFAULT_LINKS = {
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  twitterUrl: "https://twitter.com",
  linkedinUrl: "https://linkedin.com",
  googlePlayUrl: "https://play.google.com",
  appStoreUrl: "https://apps.apple.com",
  supportEmail: "support@next-gear.app",
  websiteUrl: "https://www.next-gear.app",
};

export const DEFAULT_TEMPLATE_CONFIGS: Record<string, CustomTemplateConfig> = {
  otp: {
    id: "otp",
    name: "🛡️ OTP Verification Email",
    type: "email",
    categoryText: "OTP VERIFICATION",
    headerIconText: "🔒 Secure Login Verification",
    subject: "Your Next Gear Verification Code",
    headline: "Your OTP Code",
    bodyContent: "Use the OTP below to verify your account.\nThis code is valid for 10 minutes only.",
    buttonText: "Verify Account Now",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  password_reset: {
    id: "password_reset",
    name: "🔒 Password Reset Email",
    type: "email",
    categoryText: "PASSWORD RESET",
    headerIconText: "🔒 Account Security",
    subject: "Reset Your Next Gear Password",
    headline: "Reset Your Password",
    bodyContent: "We received a request to reset your password.\nClick the button below to create a new password.",
    buttonText: "Reset Password",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  booking: {
    id: "booking",
    name: "🔴 Booking Confirmed Email",
    type: "email",
    categoryText: "BOOKING CONFIRMATION",
    headerIconText: "🎧 Need Help? support@next-gear.app",
    subject: "Booking Confirmed - {{bookingId}} for {{vehicleTitle}}",
    headline: "Booking Confirmed!",
    bodyContent: "Your booking has been confirmed successfully.\nGet ready for a smooth and safe ride with Next Gear.",
    buttonText: "🎟️ Download Booking Pass & E-Receipt",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  payment_success: {
    id: "payment_success",
    name: "💳 Payment Success Email",
    type: "email",
    categoryText: "PAYMENT RECEIPT",
    headerIconText: "🛡️ 100% Secure Payment",
    subject: "Payment Successful for Booking {{bookingId}}",
    headline: "Payment Successful!",
    bodyContent: "Your payment has been processed successfully.\nThank you for choosing Next Gear.",
    buttonText: "View Transaction Receipt",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  contact_receipt: {
    id: "contact_receipt",
    name: "💬 Support Ticket Email",
    type: "email",
    categoryText: "SUPPORT TICKET RECEIVED",
    headerIconText: "🎧 We're Here To Help",
    subject: "We've Received Your Support Request",
    headline: "We've Received Your Request!",
    bodyContent: "Your support ticket has been created successfully.\nOur team will review your request and get back to you as soon as possible.",
    buttonText: "View Ticket Status",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  blog: {
    id: "blog",
    name: "📰 Blog Announcement Email",
    type: "email",
    categoryText: "NEW BLOG PUBLISHED",
    headerIconText: "📚 Next Gear Journal & Guides",
    subject: "New Guide Published: {{blogTitle}}",
    headline: "New Guide Published on Next Gear Journal",
    bodyContent: "We just published a brand new guide on Next Gear Journal!\nCheck out the latest article to level up your travel & rental experience.",
    buttonText: "Read Full Article 📖",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  welcome: {
    id: "welcome",
    name: "👋 Welcome & First Login Email",
    type: "email",
    categoryText: "WELCOME TO NEXT GEAR",
    headerIconText: "🏎️ Pan-India Self-Drive Rentals",
    subject: "Welcome to Next Gear Rentals! Claim Your First Ride Offer 🎁",
    headline: "Welcome to Next Gear Family!",
    bodyContent: "Thank you for joining Next Gear Rentals!\nGet ready for seamless self-drive car and bike rentals across 24+ Indian cities.",
    buttonText: "Book Your First Ride 🏎️",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  festive: {
    id: "festive",
    name: "🎆 Festive & Seasonal Special Email",
    type: "email",
    categoryText: "FESTIVE SPECIAL OFFER",
    headerIconText: "🎁 Festive Limited-Time Deal",
    subject: "Festive Special Offer: Flat 25% OFF on Next Gear Rentals! 🎆",
    headline: "Celebrate with Next Gear!",
    bodyContent: "Special festive discount for your upcoming road trips!\nEnjoy Flat 25% OFF on self-drive cars, bikes, and scooties.",
    buttonText: "Claim Festive Discount 🎁",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  discount_coupon: {
    id: "discount_coupon",
    name: "🎟️ Exclusive Discount Coupon Email",
    type: "email",
    categoryText: "SPECIAL PROMO CODE",
    headerIconText: "🎟️ Exclusive Rental Voucher",
    subject: "Exclusive Offer: Save Big on Your Next Ride! 🚗",
    headline: "Special Discount Coupon Just For You!",
    bodyContent: "Unlock exclusive savings on your next vehicle booking with Next Gear.\nUse your special promo code at checkout.",
    buttonText: "Apply Coupon & Rent Now 🚗",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  trip_reminder: {
    id: "trip_reminder",
    name: "⏰ Pre-Trip Pickup Reminder Email",
    type: "email",
    categoryText: "TRIP REMINDER",
    headerIconText: "📍 Hub Pickup Ready",
    subject: "Reminder: Your Next Gear Ride Starts Tomorrow! ⏰",
    headline: "Your Ride is Ready!",
    bodyContent: "Your vehicle pickup is scheduled for tomorrow.\nPlease ensure your driving license is ready for instant verification.",
    buttonText: "View Booking Pass 🎟️",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  trip_feedback: {
    id: "trip_feedback",
    name: "⭐ Post-Ride Feedback & Rating Email",
    type: "email",
    categoryText: "TRIP FEEDBACK",
    headerIconText: "⭐ We Value Your Feedback",
    subject: "How Was Your Ride with Next Gear? Rate Your Trip ⭐",
    headline: "How Was Your Trip?",
    bodyContent: "Thank you for riding with Next Gear!\nWe hope you had a great trip. Please take 30 seconds to share your experience.",
    buttonText: "Rate Your Experience ⭐",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  wa_otp: {
    id: "wa_otp",
    name: "📱 WhatsApp OTP Message",
    type: "whatsapp",
    categoryText: "WHATSAPP OTP",
    headerIconText: "WhatsApp Cloud API",
    subject: "WhatsApp Verification",
    headline: "Verification Code",
    bodyContent: "✨ *NEXT GEAR RENTALS* ✨\n🔑 *YOUR VERIFICATION CODE*\n\nHello *{{userName}}*,\nUse the 6-digit verification code below to log in:\n\n▶ *[ {{otp}} ]*\n\n⏱️ *Valid for 10 minutes only*\n🔒 *Security Alert:* Never share your OTP code with anyone.\n\n🌐 _www.next-gear.app_",
    buttonText: "Copy Code",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
  wa_booking: {
    id: "wa_booking",
    name: "📱 WhatsApp Booking Receipt",
    type: "whatsapp",
    categoryText: "WHATSAPP RECEIPT",
    headerIconText: "WhatsApp Cloud API",
    subject: "WhatsApp Booking Receipt",
    headline: "Booking Confirmed",
    bodyContent: "🚗 *NEXT GEAR RENTALS - BOOKING CONFIRMED* 📄\n\nHello *{{userName}}*,\nYour self-drive rental booking is confirmed! 🎉\n\n📌 *Booking ID:* `{{bookingId}}`\n🚘 *Vehicle:* *{{vehicleTitle}}*\n📍 *City:* {{cityName}}\n🗓️ *Dates:* {{startDate}} to {{endDate}}\n\n🧾 *PAYMENT SUMMARY*\n▫️ *Total Paid:* *₹{{totalAmount}}*\n\n🎟️ *Download Booking Pass & e-Receipt:*\n{{passUrl}}\n\n📞 *24/7 Helpline:* +91-9523765172\nThank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨",
    buttonText: "Open WhatsApp Link",
    ...DEFAULT_LINKS,
    updatedAt: new Date().toISOString(),
  },
};

// In-memory store for custom admin overrides
const inMemoryCustomTemplates: Record<string, CustomTemplateConfig> = { ...DEFAULT_TEMPLATE_CONFIGS };

export function getCustomTemplates(): Record<string, CustomTemplateConfig> {
  return inMemoryCustomTemplates;
}

export function getCustomTemplateById(id: string): CustomTemplateConfig {
  return inMemoryCustomTemplates[id] || DEFAULT_TEMPLATE_CONFIGS[id];
}

export function saveCustomTemplate(config: CustomTemplateConfig): CustomTemplateConfig {
  inMemoryCustomTemplates[config.id] = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  return inMemoryCustomTemplates[config.id];
}

export function resetCustomTemplate(id: string): CustomTemplateConfig {
  if (DEFAULT_TEMPLATE_CONFIGS[id]) {
    inMemoryCustomTemplates[id] = { ...DEFAULT_TEMPLATE_CONFIGS[id] };
  }
  return inMemoryCustomTemplates[id];
}
