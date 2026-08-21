import { assertAdminSession } from "@/lib/admin-security";
import { listVendorKycDocuments, reviewVendorKycDocument, type VendorKycReviewStatus } from "@/lib/vendor-kyc-documents";
import { NextRequest, NextResponse } from "next/server";

const REVIEW_STATUSES = new Set<VendorKycReviewStatus>(["pending", "verified", "rejected", "needs-reupload"]);

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

export async function PATCH(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const vendorId = String(payload.vendorId ?? "").trim();
  const documentId = String(payload.documentId ?? "").trim();
  const reviewStatus = String(payload.reviewStatus ?? "").trim() as VendorKycReviewStatus;
  const reviewNote = String(payload.reviewNote ?? "").trim();

  if (!vendorId || !documentId || !REVIEW_STATUSES.has(reviewStatus)) {
    return NextResponse.json({ error: "vendorId, documentId, and valid reviewStatus are required" }, { status: 400 });
  }

  if ((reviewStatus === "rejected" || reviewStatus === "needs-reupload") && reviewNote.length < 3) {
    return NextResponse.json({ error: "Review note is required for rejected or needs-reupload documents" }, { status: 400 });
  }

  const document = await reviewVendorKycDocument({
    vendorId,
    documentId,
    reviewStatus,
    reviewNote,
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ document });
}
