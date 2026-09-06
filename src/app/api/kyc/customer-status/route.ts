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

    // 1. Check memory store first
    let record = (cleanPhone && verifiedCustomerKycStore.get(cleanPhone)) ||
                 (cleanEmail && verifiedCustomerKycStore.get(cleanEmail)) || null;

    // 2. If not in memory, check customer_kyc_profiles table
    if (!record && (cleanPhone || cleanEmail)) {
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
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT phone, email, full_name, verified_at, expires_at, documents_json 
           FROM customer_kyc_profiles 
           WHERE (phone = $1 AND $1 != '') OR (email = $2 AND $2 != '') LIMIT 1`,
          cleanPhone || "", cleanEmail || ""
        );
        if (rows && rows.length > 0) {
          const row = rows[0];
          record = {
            phone: row.phone,
            customerName: row.full_name,
            verifiedAt: new Date(row.verified_at).toISOString(),
            expiresAt: new Date(row.expires_at).toISOString(),
            documents: typeof row.documents_json === "string" ? JSON.parse(row.documents_json) : (row.documents_json || {}),
          };
          // Cache in memory
          if (cleanPhone) verifiedCustomerKycStore.set(cleanPhone, record);
          if (cleanEmail) verifiedCustomerKycStore.set(cleanEmail, record);
        }
      } catch (dbErr) {
        // Fallback to other checks
      }
    }

    // 3. If still not found, check KycAutomation table
    if (!record && (cleanEmail || cleanPhone)) {
      try {
        const emailSearch = cleanEmail || `${cleanPhone}@guest.next-gear.app`;
        const kycRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT full_name, created_at, expiry_date 
           FROM "KycAutomation" 
           WHERE status = 'approved' AND (user_email = $1 OR user_email = $2)
           ORDER BY created_at DESC LIMIT 1`,
          emailSearch,
          cleanPhone ? `${cleanPhone}@guest.next-gear.app` : ""
        );
        if (kycRows && kycRows.length > 0) {
          const kRow = kycRows[0];
          const verifiedDate = new Date(kRow.created_at);
          const expiryDate = kRow.expiry_date ? new Date(kRow.expiry_date) : new Date(verifiedDate.getTime() + 180 * 24 * 60 * 60 * 1000);
          record = {
            phone: cleanPhone || "",
            customerName: kRow.full_name,
            verifiedAt: verifiedDate.toISOString(),
            expiresAt: expiryDate.toISOString(),
            documents: {},
          };
          if (cleanPhone) verifiedCustomerKycStore.set(cleanPhone, record);
          if (cleanEmail) verifiedCustomerKycStore.set(cleanEmail, record);
        }
      } catch {}
    }

    // 4. Fallback check: user documents for previously approved KYC
    if (!record && cleanPhone) {
      try {
        const last10 = cleanPhone.slice(-10);
        const u = await prisma.user.findFirst({
          where: {
            phone: { contains: last10 },
          },
          include: {
            documents: true,
          },
        });
        if (u && u.documents.length > 0) {
          const verifiedDate = new Date(u.updatedAt);
          const expiryDate = new Date(verifiedDate.getTime() + 180 * 24 * 60 * 60 * 1000);
          const dlDoc = u.documents.find((d) => d.type === "license");
          const aadhaarFrontDoc = u.documents.find((d) => d.type === "aadhaar" || d.type === "aadhaar_front");
          const aadhaarBackDoc = u.documents.find((d) => d.type === "aadhaar_back");

          record = {
            phone: cleanPhone,
            customerName: u.name,
            verifiedAt: verifiedDate.toISOString(),
            expiresAt: expiryDate.toISOString(),
            documents: {
              dlUrl: dlDoc?.fileUrl,
              aadhaarFrontUrl: aadhaarFrontDoc?.fileUrl,
              aadhaarBackUrl: aadhaarBackDoc?.fileUrl,
            },
          };
          verifiedCustomerKycStore.set(cleanPhone, record);
        }
      } catch {}
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
