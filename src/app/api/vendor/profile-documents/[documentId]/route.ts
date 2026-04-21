import { getServerSessionUser } from "@/lib/server-session";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { deleteVendorKycDocument } from "@/lib/vendor-kyc-documents";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ documentId: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendor = await resolveVendorContext(user);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor account not configured" }, { status: 404 });
  }
  if (vendor.status === "blacklisted") {
    return NextResponse.json({ error: `Vendor account is blacklisted: ${vendor.blacklistReason ?? "Violation of privacy policy"}` }, { status: 403 });
  }

  const { documentId } = await params;
  const deleted = await deleteVendorKycDocument(vendor.id, documentId);
  if (!deleted) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
