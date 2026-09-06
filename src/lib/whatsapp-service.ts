import { dispatchAlert } from "@/lib/alert-dispatch";

export function normalizeWhatsAppPhone(phone: string): string {
  let digitsOnly = phone.replace(/[^\d+]/g, "").trim();
  if (!digitsOnly) return "";
  
  if (digitsOnly.startsWith("+")) {
    digitsOnly = digitsOnly.replace(/^\+/, "");
  }
  
  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1);
  }
  
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }
  
  return `+${digitsOnly}`;
}

export function resolveHubMapsUrl(
  cityName: string,
  pickupAddress?: string | null,
  lat?: number | null,
  lng?: number | null
): string {
  // 1. If precise GPS latitude and longitude exist, use exact coordinates pin
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    (lat !== 0 || lng !== 0)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  // 2. If vendor's specific address exists, search for that exact address
  if (pickupAddress && pickupAddress.trim() && !pickupAddress.includes("undefined") && pickupAddress.trim() !== "") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddress.trim())}`;
  }
  // 3. Fallback to city
  const cleanCity = cityName.trim() || "Delhi NCR";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Next Gear Rentals Station Hub, ${cleanCity}`)}`;
}

export async function sendWhatsAppAlert(phone: string, message: string) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  if (!cleanPhone) return { ok: false, error: "Invalid phone number" };
  return await dispatchAlert({
    channel: "whatsapp",
    to: cleanPhone,
    message,
  });
}

export async function sendWhatsAppOtp(input: {
  phone: string;
  otp: string;
  purpose: "login" | "password_reset";
  userName?: string;
}) {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Invalid phone number" };
  }

  const name = input.userName || "Valued Rider";
  const formattedOtp = input.otp.split("").join(" ");

  const message =
    input.purpose === "password_reset"
      ? `🔐 *NEXT GEAR RENTALS* 🔐\n*PASSWORD RESET AUTHORIZATION*\n\nHello *${name}*,\nUse the code below to reset your password:\n\n▶ *[ ${formattedOtp} ]*\n\n⏳ *Expires in 10 minutes*\n💡 _If you did not request a password reset, please ignore this message._\n\n🌐 _www.next-gear.app_`
      : `✨ *NEXT GEAR RENTALS* ✨\n🔑 *YOUR VERIFICATION CODE*\n\nHello *${name}*,\nUse the 6-digit verification code below to log in:\n\n▶ *[ ${formattedOtp} ]*\n\n⏱️ *Valid for 10 minutes only*\n🔒 *Security Alert:* Never share your OTP code with anyone.\n\n🌐 _www.next-gear.app_`;

  const result = await dispatchAlert({
    channel: "whatsapp",
    to: phone,
    message,
    templateName: input.purpose === "password_reset" ? "auth_password_reset" : "auth_otp_login",
    templateParams: [input.otp],
  });

  return {
    ok: result.deliveryStatus === "sent",
    provider: result.provider,
    providerMessageId: result.providerMessageId,
    error: result.error,
  };
}

export type WhatsAppBookingReceiptInput = {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  vehicleTitle: string;
  cityName: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  subtotalAmountINR?: number;
  discountINR?: number;
  passUrl?: string;
  pickupAddress?: string | null;
  pickupLandmark?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  mapsUrl?: string;
  currency?: string;
};

const sentWhatsAppReceiptDedupe = new Set<string>();
const sentVendorNotificationDedupe = new Set<string>();

export async function sendWhatsAppBookingReceipt(input: WhatsAppBookingReceiptInput) {
  const cleanBookingId = (input.bookingId || "").trim();
  const cleanKey = `${cleanBookingId}:${(input.endDate || "").trim()}`;
  if (cleanKey && sentWhatsAppReceiptDedupe.has(cleanKey)) {
    console.log(`[WhatsApp Dedupe Guard] Suppressing duplicate customer receipt for key ${cleanKey}`);
    return { ok: true, suppressed: true };
  }
  if (cleanKey) {
    sentWhatsAppReceiptDedupe.add(cleanKey);
    setTimeout(() => sentWhatsAppReceiptDedupe.delete(cleanKey), 60 * 60 * 1000);
  }

  const phone = normalizeWhatsAppPhone(input.customerPhone);
  if (!phone) {
    return { ok: false, error: "Invalid customer phone number" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
  const passLink = input.passUrl 
    ? (input.passUrl.startsWith("http") ? input.passUrl : `${baseUrl.replace(/\/$/, "")}${input.passUrl}`) 
    : `${baseUrl.replace(/\/$/, "")}/api/bookings/${input.bookingId}/pass`;

  const mapsLink =
    input.mapsUrl ||
    resolveHubMapsUrl(input.cityName, input.pickupAddress, input.pickupLat, input.pickupLng);

  const displayPickupStation = input.pickupAddress?.trim()
    ? `${input.pickupAddress.trim()}${input.pickupLandmark ? ` (Near ${input.pickupLandmark.trim()})` : ""}`
    : input.cityName;

  const formattedSubtotal = input.subtotalAmountINR ? `₹${input.subtotalAmountINR.toLocaleString("en-IN")}` : null;
  const formattedDiscount = input.discountINR && input.discountINR > 0 ? `₹${input.discountINR.toLocaleString("en-IN")}` : null;
  const formattedTotal = `₹${input.totalAmountINR.toLocaleString("en-IN")}`;

  let message = `🚗 *NEXT GEAR RENTALS - BOOKING CONFIRMED* 📄\n\n`;
  message += `Hello *${input.customerName}*,\nYour self-drive rental booking is confirmed! 🎉\n\n`;
  message += `📌 *Booking ID:* \`${input.bookingId}\`\n`;
  message += `🚘 *Vehicle:* *${input.vehicleTitle}*\n`;
  message += `📍 *Pickup Station:* ${displayPickupStation}\n`;
  message += `🗓️ *Dates:* ${input.startDate} to ${input.endDate}\n\n`;
  message += `🗺️ *Pickup Location (Google Maps Directions):*\n${mapsLink}\n\n`;
  message += `🧾 *PAYMENT SUMMARY*\n`;
  if (formattedSubtotal) message += `▫️ Subtotal: ${formattedSubtotal}\n`;
  if (formattedDiscount) message += `▫️ Discount: -${formattedDiscount}\n`;
  message += `▫️ *Total Paid:* *${formattedTotal}*\n\n`;
  message += `🎟️ *Download Booking Pass & e-Receipt:*\n${passLink}\n\n`;
  message += `📞 *Support:* support@next-gear.app\n`;
  message += `Thank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

  const metaStationName =
    displayPickupStation.length > 55
      ? displayPickupStation.slice(0, 52) + "..."
      : displayPickupStation;

  const result = await dispatchAlert({
    channel: "whatsapp",
    to: phone,
    message,
    templateName: "booking_confirmed_receipt",
    templateParams: [
      input.customerName,
      input.bookingId,
      input.vehicleTitle,
      metaStationName,
      input.startDate,
      input.endDate,
      formattedTotal.replace("₹", ""),
      mapsLink,
      passLink,
    ],
  });

  return {
    ok: result.deliveryStatus === "sent",
    provider: result.provider,
    providerMessageId: result.providerMessageId,
    error: result.error,
  };
}

export type VendorBookingNotificationInput = {
  vendorPhone?: string;
  vendorName?: string;
  bookingId: string;
  customerName: string;
  customerPhone?: string;
  vehicleTitle: string;
  cityName: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  payoutAmountINR?: number;
};

export async function sendVendorBookingNotification(input: VendorBookingNotificationInput) {
  const cleanBookingId = (input.bookingId || "").trim();
  const cleanKey = `${cleanBookingId}:${(input.endDate || "").trim()}`;
  if (cleanKey && sentVendorNotificationDedupe.has(cleanKey)) {
    console.log(`[WhatsApp Dedupe Guard] Suppressing duplicate vendor notification for key ${cleanKey}`);
    return { ok: true, suppressed: true };
  }
  if (cleanKey) {
    sentVendorNotificationDedupe.add(cleanKey);
    setTimeout(() => sentVendorNotificationDedupe.delete(cleanKey), 60 * 60 * 1000);
  }

  const targetPhone = input.vendorPhone || process.env.ADMIN_CONTACT_PHONE || "9523765172";
  const phone = normalizeWhatsAppPhone(targetPhone);
  if (!phone) {
    return { ok: false, error: "Invalid vendor phone number" };
  }

  const vName = input.vendorName || "Fleet Partner";
  const payoutStr = input.payoutAmountINR ? `₹${input.payoutAmountINR.toLocaleString("en-IN")}` : `₹${Math.round(input.totalAmountINR * 0.8).toLocaleString("en-IN")}`;

  let message = `🚗 *NEXT GEAR FLEET ALERT - NEW BOOKING!* 📢\n\n`;
  message += `Dear *${vName}*,\nYour vehicle has been booked by a customer! 🎉\n\n`;
  message += `📌 *Booking ID:* \`${input.bookingId}\`\n`;
  message += `🚘 *Vehicle:* *${input.vehicleTitle}*\n`;
  message += `👤 *Customer:* ${input.customerName}${input.customerPhone ? ` (${input.customerPhone})` : ""}\n`;
  message += `📍 *Hub Station:* ${input.cityName}\n`;
  message += `🗓️ *Pickup:* ${input.startDate}\n`;
  message += `🏁 *Drop-off:* ${input.endDate}\n`;
  message += `💰 *Booking Value:* ₹${input.totalAmountINR.toLocaleString("en-IN")} *(Partner Payout: ${payoutStr})*\n\n`;
  message += `⚠️ *Action Required:* Please ensure the vehicle is washed, fueled, and keys are prepped for express customer handover.\n\n`;
  message += `🌐 Next Gear Partner Portal: https://next-gear.app/dashboard/vendor`;

  const result = await dispatchAlert({
    channel: "whatsapp",
    to: phone,
    message,
    templateName: "vendor_new_booking_alert",
    templateParams: [
      vName,
      input.bookingId,
      input.vehicleTitle,
      input.customerName,
      input.customerPhone || "N/A",
      input.cityName,
      input.startDate,
      input.endDate,
      payoutStr.replace("₹", ""),
    ],
  });

  return {
    ok: result.deliveryStatus === "sent",
    provider: result.provider,
    providerMessageId: result.providerMessageId,
    error: result.error,
  };
}
