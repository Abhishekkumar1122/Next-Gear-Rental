import { NextRequest, NextResponse } from "next/server";
import { getVendorPayouts, requestVendorPayout, generateGstTaxInvoiceHtml } from "@/lib/vendor-payout-service";

export async function GET(request: NextRequest) {
  const vendorId = request.nextUrl.searchParams.get("vendorId") || "v1";
  const format = request.nextUrl.searchParams.get("format");
  const payoutId = request.nextUrl.searchParams.get("payoutId");

  const records = getVendorPayouts(vendorId);

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
  try {
    const payload = await request.json();
    const { vendorId, vendorName, grossRevenueINR, commissionRate, bankAccountMasked, upiIdMasked } = payload;

    if (!vendorId || !grossRevenueINR) {
      return NextResponse.json({ error: "Missing vendorId or grossRevenueINR" }, { status: 400 });
    }

    const record = requestVendorPayout({
      vendorId,
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
