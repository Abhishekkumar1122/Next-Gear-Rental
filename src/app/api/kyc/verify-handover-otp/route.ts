import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpStore } from "../send-handover-otp/route";

// In-memory verified customers fast-track store attached to globalThis
const globalForVerifiedKyc = globalThis as unknown as {
  verifiedCustomerKycStore?: Map<string, {
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
  }>;
};

export const verifiedCustomerKycStore = globalForVerifiedKyc.verifiedCustomerKycStore ?? new Map();
if (!globalForVerifiedKyc.verifiedCustomerKycStore) {
  globalForVerifiedKyc.verifiedCustomerKycStore = verifiedCustomerKycStore;
}

export async function POST(req: NextRequest) {
  try {
    const {
      bookingId,
      enteredOtp,
      isPhysicalVerified,
      customerPhone,
      customerName,
      customerEmail,
      documents,
    } = await req.json();

    if (!bookingId || (!enteredOtp && !isPhysicalVerified) || !customerPhone) {
      return NextResponse.json(
        { error: "Booking ID and Customer Phone are required." },
        { status: 400 }
      );
    }

    // 1. Verify OTP or Physical Match
    let isValid = Boolean(isPhysicalVerified || enteredOtp?.trim() === "PHYSICAL_VERIFIED");
    const globalForOtp = globalThis as unknown as {
      kycHandoverOtpStore?: Map<string, { otp: string; phone: string; expiresAt: number }>;
    };
    const activeOtpStore = globalForOtp.kycHandoverOtpStore ?? otpStore;
    const memoryRecord = activeOtpStore.get(bookingId);

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

    // 3. Update Database customer_kyc_profiles if available
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS customer_kyc_profiles (
          phone TEXT PRIMARY KEY,
          email TEXT,
          full_name TEXT,
          verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          documents_json TEXT
        )
      `);
      await prisma.$executeRawUnsafe(
        `INSERT INTO customer_kyc_profiles (phone, email, full_name, verified_at, expires_at, documents_json)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (phone)
         DO UPDATE SET verified_at = $4, expires_at = $5, documents_json = $6, email = COALESCE($2, customer_kyc_profiles.email)`,
        cleanPhone,
        customerEmail || null,
        customerName || null,
        verifiedAt,
        expiresAt,
        JSON.stringify(documents || {})
      );
    } catch (e) {
      console.warn("customer_kyc_profiles table/upsert note:", e);
    }

    // 4. Save UserDocument records for customer
    try {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true },
      });
      if (b?.userId) {
        if (documents?.dlUrl) {
          await prisma.userDocument.create({
            data: {
              userId: b.userId,
              type: "license",
              fileUrl: documents.dlUrl,
            },
          }).catch(() => {});
        }
        if (documents?.aadhaarFrontUrl) {
          await prisma.userDocument.create({
            data: {
              userId: b.userId,
              type: "aadhaar_front",
              fileUrl: documents.aadhaarFrontUrl,
            },
          }).catch(() => {});
        }
        if (documents?.aadhaarBackUrl) {
          await prisma.userDocument.create({
            data: {
              userId: b.userId,
              type: "aadhaar_back",
              fileUrl: documents.aadhaarBackUrl,
            },
          }).catch(() => {});
        }
      }
    } catch (bErr) {
      console.warn("UserDocument sync note:", bErr);
    }

    // 5. Also sync with KycAutomation so customer dashboard KYC tab displays Approved
    try {
      const { submitKycAutomation } = await import("@/lib/kyc-automation");
      const emailForKyc = customerEmail || `${cleanPhone}@guest.next-gear.app`;
      await submitKycAutomation({
        userEmail: emailForKyc,
        fullName: customerName || "Customer",
        documentType: "license",
        documentNumber: documents?.dlNo || "DL-VERIFIED",
        dob: "2000-01-01",
        expiryDate: expiresAt.slice(0, 10),
        overrideStatus: "approved",
      });
    } catch (kErr) {
      console.warn("KycAutomation sync note:", kErr);
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
