import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server-session";
import { prisma } from "@/lib/prisma";
import { getVendorPayouts, requestVendorPayout, generateGstTaxInvoiceHtml } from "@/lib/vendor-payout-service";

export async function GET(request: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const reqVendorId = request.nextUrl.searchParams.get("vendorId");
  const format = request.nextUrl.searchParams.get("format");
  const payoutId = request.nextUrl.searchParams.get("payoutId");

  let effectiveVendorId = reqVendorId || "all";

  // Data isolation: non-admins can ONLY access their own vendor payouts
  if (user.role !== "ADMIN") {
    if (process.env.DATABASE_URL) {
      const vendor = await prisma.vendor.findFirst({
        where: { ownerUserId: user.id },
        select: { id: true },
      });
      if (!vendor) {
        return NextResponse.json({ error: "Vendor profile not found for this account" }, { status: 403 });
      }
      effectiveVendorId = vendor.id;
    }
  }

  const records = await getVendorPayouts(effectiveVendorId);

  if (format === "html" && payoutId) {
    const record = records.find((r) => r.id === payoutId);
    if (!record) {
      return NextResponse.json({ error: "Payout invoice not found" }, { status: 404 });
    }
    const html = generateGstTaxInvoiceHtml(record);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({ payouts: records });
}

export async function POST(request: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { vendorId, vendorName, grossRevenueINR, commissionRate, bankAccountMasked, upiIdMasked } = payload;

    let targetVendorId = vendorId;
    if (user.role !== "ADMIN" && process.env.DATABASE_URL) {
      const vendor = await prisma.vendor.findFirst({
        where: { ownerUserId: user.id },
        select: { id: true, businessName: true },
      });
      if (!vendor) {
        return NextResponse.json({ error: "Unauthorized vendor account" }, { status: 403 });
      }
      targetVendorId = vendor.id;
    }

    if (!targetVendorId || !grossRevenueINR) {
      return NextResponse.json({ error: "Missing vendorId or grossRevenueINR" }, { status: 400 });
    }

    const record = await requestVendorPayout({
      vendorId: targetVendorId,
      vendorName: vendorName || "Vendor Partner",
      grossRevenueINR: Number(grossRevenueINR),
      commissionRate: Number(commissionRate || 15),
      bankAccountMasked,
      upiIdMasked,
    });

    return NextResponse.json({ success: true, payout: record });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 });
  }
}

