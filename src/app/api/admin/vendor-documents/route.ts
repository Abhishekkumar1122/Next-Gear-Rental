import { assertAdminSession } from "@/lib/admin-security";
import { listVendorKycDocuments } from "@/lib/vendor-kyc-documents";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendorId = request.nextUrl.searchParams.get("vendorId")?.trim();
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  const documents = await listVendorKycDocuments(vendorId);
  return NextResponse.json({ documents });
}
