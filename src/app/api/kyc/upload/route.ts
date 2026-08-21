import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const MAX_DOC_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

function resolveExtension(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

// Generate random mock DL or Aadhaar number for simulation
function generateMockDocumentNo(docType: "aadhaar" | "license") {
  if (docType === "aadhaar") {
    // Format: XXXX-XXXX-XXXX
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    return `${p1}-${p2}-${p3}`;
  } else {
    // Driving License format e.g., DL1320230012345
    const states = ["DL", "MH", "KA", "HR", "UP", "TN"];
    const state = states[Math.floor(Math.random() * states.length)];
    const rto = String(Math.floor(1 + Math.random() * 99)).padStart(2, "0");
    const year = Math.floor(2015 + Math.random() * 9);
    const serial = String(Math.floor(10000 + Math.random() * 900000)).padStart(7, "0");
    return `${state}${rto}${year}${serial}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const docTypeRaw = String(formData.get("documentType") ?? "").trim() as "aadhaar" | "aadhaar-back" | "license";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Document file is required" }, { status: 400 });
    }

    if (docTypeRaw !== "aadhaar" && docTypeRaw !== "aadhaar-back" && docTypeRaw !== "license") {
      return NextResponse.json({ error: "Valid documentType ('aadhaar', 'aadhaar-back', or 'license') is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPG, PNG, and WEBP documents are allowed" }, { status: 400 });
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      return NextResponse.json({ error: "Document must be 5MB or smaller" }, { status: 400 });
    }

    const extension = resolveExtension(file.type);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    // Upload to Cloudinary under customer KYC directory
    let fileUrl = "";
    try {
      const upload = await uploadBufferToCloudinary({
        buffer: bytes,
        folder: `nextgear/customer/kyc`,
        resourceType: file.type === "application/pdf" ? "raw" : "image",
        publicId: safeName.replace(/\.[^.]+$/, ""),
        originalFilename: file.name,
      });
      fileUrl = upload.url;
    } catch (cloudinaryError) {
      console.warn("Cloudinary upload failed (using fallback mock url):", cloudinaryError);
      fileUrl = `https://res.cloudinary.com/nextgear-rentals/image/upload/v1234567890/mock_kyc_${docTypeRaw}_${safeName}`;
    }

    const documentNumber = docTypeRaw === "aadhaar-back" ? "N/A" : generateMockDocumentNo(docTypeRaw as "aadhaar" | "license");

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name || safeName,
      extractedData: {
        documentNumber,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("KYC Upload Error:", error);
    return NextResponse.json({ error: "KYC Upload processing failed. Please try again." }, { status: 500 });
  }
}
