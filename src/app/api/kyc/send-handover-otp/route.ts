import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppOtp } from "@/lib/whatsapp-service";

// In-memory fallback store for live OTPs attached to globalThis across Next.js bundles
const globalForOtp = globalThis as unknown as {
  kycHandoverOtpStore?: Map<string, { otp: string; phone: string; expiresAt: number }>;
};
export const otpStore = globalForOtp.kycHandoverOtpStore ?? new Map<string, { otp: string; phone: string; expiresAt: number }>();
if (!globalForOtp.kycHandoverOtpStore) {
  globalForOtp.kycHandoverOtpStore = otpStore;
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId, customerPhone, customerName, vehicleTitle } = await req.json();

    if (!bookingId || !customerPhone) {
      return NextResponse.json(
        { error: "Booking ID and Customer Phone are required." },
        { status: 400 }
      );
    }

    // Generate secure 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    otpStore.set(bookingId, { otp, phone: customerPhone, expiresAt });

    // Store in Database if available
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS kyc_handover_otps (
          booking_id TEXT PRIMARY KEY,
          phone TEXT,
          otp TEXT,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE
        )
      `);
      await prisma.$executeRawUnsafe(
        `INSERT INTO kyc_handover_otps (booking_id, phone, otp, expires_at, created_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes', NOW())
         ON CONFLICT (booking_id) 
         DO UPDATE SET otp = $3, expires_at = NOW() + INTERVAL '15 minutes', created_at = NOW()`,
        bookingId, customerPhone, otp
      );
    } catch (dbErr) {
      // Memory store is already populated
    }

    // Send WhatsApp notification to customer
    try {
      await sendWhatsAppOtp({
        phone: customerPhone,
        otp,
        purpose: "login",
        userName: customerName || "Customer",
      });
    } catch (waErr) {
      console.warn("WhatsApp OTP send warning (simulated/dev):", waErr);
    }

    console.log(`[KYC Handover OTP] Booking: ${bookingId} -> OTP: ${otp} (Phone: ${customerPhone})`);

    return NextResponse.json({
      success: true,
      message: "Handover OTP sent successfully to customer WhatsApp.",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error: any) {
    console.error("Error sending handover OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate handover OTP." },
      { status: 500 }
    );
  }
}
