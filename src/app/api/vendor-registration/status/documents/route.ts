import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { getVendorApplicationByIdAndPhone } from "@/lib/vendor-applications";
import { addVendorKycDocument, type VendorKycDocumentType } from "@/lib/vendor-kyc-documents";
import { NextResponse } from "next/server";

const ALLOWED_DOC_TYPES = new Set<VendorKycDocumentType>([
  "aadhaar",
  "pan",
  "business-proof",
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "").trim() as VendorKycDocumentType;
  const file = formData.get("file");

  if (!applicationId || !phone) {
    return NextResponse.json({ error: "Application ID and phone number are required" }, { status: 400 });
  }

  const application = await getVendorApplicationByIdAndPhone(applicationId, phone);
  if (!application) {
    return NextResponse.json({ error: "No vendor application found for those details" }, { status: 404 });
  }

  if (application.status === "rejected") {
    return NextResponse.json({ error: "This application is rejected. Contact support before uploading more documents." }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Document file is required" }, { status: 400 });
  }

  if (!ALLOWED_DOC_TYPES.has(documentType)) {
    return NextResponse.json({ error: "Valid document type is required" }, { status: 400 });
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
  const upload = await uploadBufferToCloudinary({
    buffer: Buffer.from(arrayBuffer),
    folder: `nextgear/vendor-applications/${application.id}/kyc`,
    resourceType: file.type === "application/pdf" ? "raw" : "image",
    publicId: safeName.replace(/\.[^.]+$/, ""),
    originalFilename: file.name,
  });

  const document = await addVendorKycDocument({
    vendorId: application.id,
    documentType,
    fileName: file.name || safeName,
    fileUrl: upload.url,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  return NextResponse.json({ document }, { status: 201 });
}
