import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifiedCustomerKycStore } from "../verify-handover-otp/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!phone && !email) {
      return NextResponse.json({ isVerified: false });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : null;
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Check memory store
    let record = (cleanPhone && verifiedCustomerKycStore.get(cleanPhone)) ||
                 (cleanEmail && verifiedCustomerKycStore.get(cleanEmail)) || null;

    // If not found in memory, check Database
    if (!record && cleanPhone) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT full_name, verified_at, expires_at, documents_json 
           FROM customer_kyc_profiles 
           WHERE phone = $1 OR email = $2 LIMIT 1`,
          cleanPhone, cleanEmail || ""
        );
        if (rows && rows.length > 0) {
          const row = rows[0];
          record = {
            phone: cleanPhone,
            customerName: row.full_name,
            verifiedAt: new Date(row.verified_at).toISOString(),
            expiresAt: new Date(row.expires_at).toISOString(),
            documents: typeof row.documents_json === "string" ? JSON.parse(row.documents_json) : row.documents_json,
          };
        }
      } catch (dbErr) {
        // Table may not exist yet in dev runtime
      }
    }

    if (!record) {
      return NextResponse.json({ isVerified: false });
    }

    // Check if still within validity period
    const now = Date.now();
    const expiryTime = new Date(record.expiresAt).getTime();

    if (now > expiryTime) {
      return NextResponse.json({
        isVerified: false,
        isExpired: true,
        message: "KYC validity expired after 6 months. Fresh document verification required.",
      });
    }

    const daysRemaining = Math.max(1, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      isVerified: true,
      customerName: record.customerName,
      verifiedAt: record.verifiedAt,
      expiresAt: record.expiresAt,
      daysRemaining,
      documents: record.documents || {},
    });
  } catch (error: any) {
    console.error("Error checking customer KYC status:", error);
    return NextResponse.json({ isVerified: false }, { status: 200 });
  }
}
