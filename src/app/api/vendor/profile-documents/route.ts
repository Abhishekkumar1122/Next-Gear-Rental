import { getServerSessionUser } from "@/lib/server-session";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { addVendorKycDocument, listVendorKycDocuments, type VendorKycDocumentType } from "@/lib/vendor-kyc-documents";
import { NextResponse } from "next/server";

const ALLOWED_DOC_TYPES = new Set<VendorKycDocumentType>([
  "aadhaar",
  "pan",
  "driving-license",
  "vehicle-rc",
  "insurance",
  "bank-proof",
  "other",
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const MAX_DOC_SIZE_BYTES = 8 * 1024 * 1024;

function resolveExtension(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function GET() {
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

  const documents = await listVendorKycDocuments(vendor.id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
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

  const formData = await request.formData();
  const file = formData.get("file");
  const documentTypeRaw = String(formData.get("documentType") ?? "").trim() as VendorKycDocumentType;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Document file is required" }, { status: 400 });
  }

  if (!ALLOWED_DOC_TYPES.has(documentTypeRaw)) {
    return NextResponse.json({ error: "Valid documentType is required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPG, PNG, and WEBP documents are allowed" }, { status: 400 });
  }

  if (file.size > MAX_DOC_SIZE_BYTES) {
    return NextResponse.json({ error: "Document must be 8MB or smaller" }, { status: 400 });
  }

  const extension = resolveExtension(file.type);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  const upload = await uploadBufferToCloudinary({
    buffer: bytes,
    folder: `nextgear/vendor/${vendor.id}/kyc`,
    resourceType: file.type === "application/pdf" ? "raw" : "image",
    publicId: safeName.replace(/\.[^.]+$/, ""),
    originalFilename: file.name,
  });

  const fileUrl = upload.url;
  const document = await addVendorKycDocument({
    vendorId: vendor.id,
    documentType: documentTypeRaw,
    fileName: file.name || safeName,
    fileUrl,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  return NextResponse.json({ document }, { status: 201 });
}
