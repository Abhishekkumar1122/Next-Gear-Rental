import {
  generateOtpEmailHtml,
  generateForgotPasswordEmailHtml,
  generateBookingConfirmationEmailHtml,
  generatePaymentSuccessEmailHtml,
  generateContactReceiptEmailHtml,
  generateContactAdminAlertHtml,
  generateBlogNotificationEmailHtml,
  generateWelcomeEmailHtml,
  generateFestiveEmailHtml,
  generateDiscountCouponEmailHtml,
  generateTripReminderEmailHtml,
  generateTripFeedbackEmailHtml,
} from "@/lib/email-templates";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") ?? "gallery";
  const origin = request.nextUrl.origin;

  if (template === "welcome") {
    const html = generateWelcomeEmailHtml({
      userName: "Abhishek Singh",
      couponCode: "WELCOME10",
      discountPercentage: 10,
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "festive") {
    const html = generateFestiveEmailHtml({
      userName: "Abhishek Singh",
      festivalName: "Diwali & Weekend Getaway",
      couponCode: "FESTIVE25",
      discountPercentage: 25,
      validUntil: "Valid for Next 48 Hours",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "discount_coupon") {
    const html = generateDiscountCouponEmailHtml({
      userName: "Abhishek Singh",
      couponCode: "RIDEGEAR20",
      discountTitle: "Flat ₹500 Instant Savings",
      discountDetails: "Valid on SUV, Sedan, and Sports Bike bookings across 24+ cities.",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "trip_reminder") {
    const html = generateTripReminderEmailHtml({
      bookingId: "NG12345678",
      customerName: "Abhishek Singh",
      vehicleTitle: "Hyundai Creta (Self-Drive)",
      cityName: "Delhi / Noida",
      pickupAddress: "Next Gear Hub, Sector 62, Noida, NCR",
      startDate: "22 May 2026, 10:00 AM",
      vendorPhone: "+91-9523765172",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "trip_feedback") {
    const html = generateTripFeedbackEmailHtml({
      bookingId: "NG12345678",
      customerName: "Abhishek Singh",
      vehicleTitle: "Hyundai Creta",
      referralCode: "FRIEND15",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "otp") {
    const html = generateOtpEmailHtml({
      otp: "582914",
      userName: "Abhishek Singh",
      purpose: "verification",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "password_reset") {
    const html = generateForgotPasswordEmailHtml({
      otp: "941083",
      userName: "Abhishek Singh",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "booking") {
    const html = generateBookingConfirmationEmailHtml({
      bookingId: "NG12345678",
      customerName: "Abhishek Singh",
      vehicleTitle: "Hyundai Creta",
      cityName: "Delhi / Noida",
      startDate: "22 May 2026, 10:00 AM",
      endDate: "24 May 2026, 10:00 AM",
      totalAmountINR: 4499,
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "payment_success") {
    const html = generatePaymentSuccessEmailHtml({
      transactionId: "TXN789456123",
      bookingId: "NG12345678",
      customerName: "Abhishek Singh",
      vehicleTitle: "Hyundai Creta",
      baseFareINR: 3999,
      taxesINR: 500,
      discountINR: 0,
      totalPaidINR: 4499,
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "contact_receipt") {
    const html = generateContactReceiptEmailHtml({
      fullName: "Abhishek Singh",
      email: "abhishek.singh@example.com",
      phone: "+91-9523765172",
      message: "Need assistance with booking a car for Delhi to Goa road trip.",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "contact_admin") {
    const html = generateContactAdminAlertHtml({
      fullName: "Abhishek Singh",
      email: "abhishek.singh@example.com",
      phone: "+91-9523765172",
      message: "Need assistance with booking a car for Delhi to Goa road trip.",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (template === "blog") {
    const html = generateBlogNotificationEmailHtml({
      blogTitle: "Top 10 Self-Drive Car Rental Road Trip Routes in India for 2026",
      blogSlug: "car-rental-near-me-delhi-goa-mumbai-guide",
      excerpt: "Planning an unforgettable road trip from Delhi to Leh, Goa, or Manali? Here is your complete 2026 self-drive vehicle guide with budget rates and verified hubs.",
      readTimeMinutes: 6,
      authorName: "Next Gear Editorial Team",
      userName: "Abhishek Singh",
      baseUrl: origin,
    });
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Realistic WhatsApp Phone Simulator for wa_otp & wa_booking
  if (template === "wa_otp" || template === "wa_booking") {
    const isOtp = template === "wa_otp";
    const title = isOtp ? "WhatsApp OTP Message" : "WhatsApp Booking Confirmation";
    const waText = isOtp
      ? `✨ *NEXT GEAR RENTALS* ✨\n🔑 *YOUR VERIFICATION CODE*\n\nHello *Abhishek Singh*,\nUse the 6-digit verification code below to log in:\n\n▶ *[ 5 8 2 9 1 4 ]*\n\n⏱️ *Valid for 10 minutes only*\n🔒 *Security Alert:* Never share your OTP code with anyone.\n\n🌐 _www.next-gear.app_`
      : `🚗 *NEXT GEAR RENTALS - BOOKING CONFIRMED* 📄\n\nHello *Abhishek Singh*,\nYour self-drive rental booking is confirmed! 🎉\n\n📌 *Booking ID:* \`NG12345678\`\n🚘 *Vehicle:* *Hyundai Creta*\n📍 *City:* Delhi / Noida\n🗓️ *Dates:* 22 May 2026 to 24 May 2026\n\n🧾 *PAYMENT SUMMARY*\n▫️ Subtotal: ₹3,999\n▫️ *Total Paid:* *₹4,499*\n\n🎟️ *Download Booking Pass & e-Receipt:*\n${origin}/api/bookings/NG12345678/pass\n\n📞 *24/7 Helpline:* +91-9523765172\nThank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

    const formattedWaHtml = waText
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br/>");

    const whatsappSimulatorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} | Next Gear Simulator</title>
  <style>
    body { margin: 0; padding: 20px; background: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
    .phone-mockup { width: 380px; background: #0b141a; border-radius: 36px; border: 8px solid #1f2c34; box-shadow: 0 25px 60px rgba(0,0,0,0.8); overflow: hidden; }
    .wa-header { background: #1f2c34; padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #111b21; }
    .wa-avatar { width: 40px; height: 40px; border-radius: 50%; background: #00a884; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
    .wa-title { color: #e9edef; font-weight: 700; font-size: 15px; }
    .wa-sub { color: #00a884; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .wa-body { padding: 20px; background: url('https://user-images.githubusercontent.com/15075759/28719144-86ed0f77-7396-11e7-8f51-419ed43f2143.png') repeat; background-color: #0b141a; min-height: 420px; display: flex; flex-direction: column; justify-content: flex-end; }
    .wa-bubble { background: #005c4b; color: #e9edef; border-radius: 12px 12px 0 12px; padding: 14px 16px; font-size: 13px; line-height: 1.6; max-width: 88%; align-self: flex-end; box-shadow: 0 2px 5px rgba(0,0,0,0.3); word-break: break-word; position: relative; }
    .wa-bubble code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #25d366; }
    .wa-time { font-size: 10px; color: #8696a0; text-align: right; margin-top: 6px; display: flex; justify-content: flex-end; align-items: center; gap: 4px; }
    .wa-time svg { fill: #53bdeb; width: 15px; height: 15px; }
  </style>
</head>
<body>
  <div class="phone-mockup">
    <div class="wa-header">
      <div class="wa-avatar">🚗</div>
      <div>
        <div class="wa-title">Next Gear Official <span style="color:#00a884;">✔</span></div>
        <div class="wa-sub">🟢 Verified Business Account</div>
      </div>
    </div>
    <div class="wa-body">
      <div class="wa-bubble">
        ${formattedWaHtml}
        <div class="wa-time">
          10:42 AM
          <svg viewBox="0 0 16 15"><path d="M15.01 3.316l-6.88 6.88-3.13-3.13-1.41 1.41 4.54 4.54 8.29-8.29-1.41-1.41z"/><path d="M11.01 3.316l-6.88 6.88-1.54-1.54-1.41 1.41 2.95 2.95 8.29-8.29-1.41-1.41z"/></svg>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new Response(whatsappSimulatorHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Interactive Gallery Studio with BOTH Email & WhatsApp Tabs
  const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next Gear - Email & WhatsApp Design Studio</title>
  <style>
    body { margin: 0; padding: 0; background: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fff; }
    .header { background: #0b0b0e; border-bottom: 1px solid #1f1f23; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .brand { font-weight: 900; font-size: 16px; color: #dc2626; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
    .brand img { height: 32px; }
    .nav { display: flex; gap: 6px; flex-wrap: wrap; }
    .nav a { background: #121216; border: 1px solid #27272a; color: #a1a1aa; text-decoration: none; padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; transition: all 0.2s; }
    .nav a:hover, .nav a.active { background: #dc2626; color: #fff; border-color: #dc2626; box-shadow: 0 0 15px rgba(220,38,38,0.5); }
    .nav a.wa-btn { background: #005c4b; color: #25d366; border-color: #00a884; }
    .nav a.wa-btn:hover { background: #25d366; color: #000; }
    .iframe-container { width: 100%; height: calc(100vh - 65px); border: none; background: #050505; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${origin}/next-gear-transparent-hero.png" alt="Logo" style="height: 38px; width: auto;" />
      <span>Next Gear Studio</span>
    </div>
    <div class="nav">
      <!-- Customer Lifecycle Email Templates -->
      <a href="${origin}/api/email-preview?template=welcome" target="preview-frame">👋 Welcome</a>
      <a href="${origin}/api/email-preview?template=festive" target="preview-frame">🎆 Festive Offer</a>
      <a href="${origin}/api/email-preview?template=discount_coupon" target="preview-frame">🎟️ Special Coupon</a>
      <a href="${origin}/api/email-preview?template=trip_reminder" target="preview-frame">⏰ Pre-Trip Reminder</a>
      <a href="${origin}/api/email-preview?template=trip_feedback" target="preview-frame">⭐ Post-Trip Review</a>
      <!-- Transactional Email Templates -->
      <a href="${origin}/api/email-preview?template=otp" target="preview-frame">🛡️ Email OTP</a>
      <a href="${origin}/api/email-preview?template=password_reset" target="preview-frame">🔒 Password Reset</a>
      <a href="${origin}/api/email-preview?template=booking" target="preview-frame">🔴 Booking Confirmed</a>
      <a href="${origin}/api/email-preview?template=payment_success" target="preview-frame">💳 Payment Success</a>
      <a href="${origin}/api/email-preview?template=contact_receipt" target="preview-frame">💬 Support Ticket</a>
      <a href="${origin}/api/email-preview?template=blog" target="preview-frame">📰 Blog Article</a>
      <!-- WhatsApp Message Previews -->
      <a href="${origin}/api/email-preview?template=wa_otp" target="preview-frame" class="wa-btn">💬 WhatsApp OTP</a>
      <a href="${origin}/api/email-preview?template=wa_booking" target="preview-frame" class="wa-btn">💬 WhatsApp Booking</a>
    </div>
  </div>
  <iframe name="preview-frame" class="iframe-container" src="${origin}/api/email-preview?template=welcome"></iframe>
</body>
</html>`;

  return new Response(galleryHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

