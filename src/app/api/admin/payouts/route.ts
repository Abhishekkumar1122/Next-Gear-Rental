import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession, assertAdminMutationRequest } from "@/lib/admin-security";
import { approveVendorPayout, getVendorPayouts } from "@/lib/vendor-payout-service";

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payouts = getVendorPayouts("all");
  return NextResponse.json({ payouts });
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await request.json();
  const { payoutId, txnRef, vendorEmail, vendorPhone } = payload;

  if (!payoutId) {
    return NextResponse.json({ error: "Missing payoutId" }, { status: 400 });
  }

  const approved = await approveVendorPayout(payoutId, txnRef, vendorEmail, vendorPhone);
  if (!approved) {
    return NextResponse.json({ error: "Payout record not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, payout: approved });
}
