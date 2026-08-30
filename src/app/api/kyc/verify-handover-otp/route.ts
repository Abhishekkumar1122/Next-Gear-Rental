import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpStore } from "../send-handover-otp/route";

// In-memory verified customers fast-track store (Phone/Email -> Expiry)
export const verifiedCustomerKycStore = new Map<string, {
  phone: string;
  customerName: string;
  verifiedAt: string;
  expiresAt: string;
  documents?: {
    dlUrl?: string;
    dlNo?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    aadhaarNo?: string;
  };
}>();

export async function POST(req: NextRequest) {
  try {
    const {
      bookingId,
      enteredOtp,
      customerPhone,
      customerName,
      customerEmail,
      documents,
    } = await req.json();

    if (!bookingId || !enteredOtp || !customerPhone) {
      return NextResponse.json(
        { error: "Booking ID, Customer Phone, and OTP are required." },
        { status: 400 }
      );
    }

    // 1. Verify OTP from memory or DB
    const memoryRecord = otpStore.get(bookingId);
    let isValid = false;

    if (memoryRecord && memoryRecord.otp === enteredOtp.trim()) {
      if (Date.now() <= memoryRecord.expiresAt) {
        isValid = true;
      } else {
        return NextResponse.json(
          { error: "OTP has expired. Please request a new OTP." },
          { status: 400 }
        );
      }
    }

    // Check DB if memory didn't match or in case of worker restarts
    if (!isValid) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT otp, expires_at FROM kyc_handover_otps WHERE booking_id = $1 LIMIT 1`,
          bookingId
        );
        if (rows && rows.length > 0) {
          const dbRow = rows[0];
          if (dbRow.otp === enteredOtp.trim() && new Date(dbRow.expires_at).getTime() > Date.now()) {
            isValid = true;
          }
        }
      } catch (dbErr) {
        // Fallback to dev overrides
      }
    }

    // Allow Master Dev Override OTP in dev mode
    if (process.env.NODE_ENV !== "production" && enteredOtp.trim() === "9999") {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid OTP entered. Please check the code with customer." },
        { status: 400 }
      );
    }

    // 2. Compute 6-Month KYC Validity (180 Days)
    const now = new Date();
    const expiresAtDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const verifiedAt = now.toISOString();
    const expiresAt = expiresAtDate.toISOString();

    const cleanPhone = customerPhone.replace(/\D/g, "");

    // Save to Fast-Track Store
    const kycProfile = {
      phone: cleanPhone,
      customerName: customerName || "Customer",
      verifiedAt,
      expiresAt,
      documents: documents || {},
    };

    verifiedCustomerKycStore.set(cleanPhone, kycProfile);
    if (customerEmail) {
      verifiedCustomerKycStore.set(customerEmail.toLowerCase().trim(), kycProfile);
    }

    // Clear used OTP
    otpStore.delete(bookingId);

    // 3. Update Database if available
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO customer_kyc_profiles (phone, email, full_name, verified_at, expires_at, documents_json)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (phone)
         DO UPDATE SET verified_at = $4, expires_at = $5, documents_json = $6`,
        cleanPhone,
        customerEmail || null,
        customerName || null,
        verifiedAt,
        expiresAt,
        JSON.stringify(documents || {})
      );
    } catch (e) {
      // Memory store is already populated
    }

    return NextResponse.json({
      success: true,
      message: "KYC Verified successfully! Customer granted 6-Month VIP Fast-Track status.",
      kycProfile: {
        isVerified: true,
        verifiedAt,
        expiresAt,
        validityDays: 180,
      }
    });
  } catch (error: any) {
    console.error("Error verifying handover OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify handover OTP." },
      { status: 500 }
    );
  }
}
