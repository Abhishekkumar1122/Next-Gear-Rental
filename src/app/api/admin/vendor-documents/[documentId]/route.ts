import { assertAdminSession } from "@/lib/admin-security";
import { getVendorKycDocumentById } from "@/lib/vendor-kyc-documents";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
}

function extractPublicId(fileUrl: string): string | null {
  const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1] : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await context.params;
  const doc = await getVendorKycDocumentById(documentId);

  if (!doc || !doc.fileUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    ensureCloudinaryConfig();
    const isPdf = doc.fileName.toLowerCase().endsWith(".pdf") || doc.mimeType === "application/pdf";
    let downloadUrl = doc.fileUrl;

    if (isPdf) {
      const publicId = extractPublicId(doc.fileUrl);
      if (publicId) {
        try {
          downloadUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
            resource_type: "raw",
            type: "upload",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          });
        } catch (e) {
          console.warn("[Cloudinary Private URL Sign Warning]:", e);
        }
      }
    }

    let upstream = await fetch(downloadUrl);
    if (!upstream.ok && downloadUrl !== doc.fileUrl) {
      upstream = await fetch(doc.fileUrl);
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch document from storage", status: upstream.status },
        { status: 502 }
      );
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = isPdf
      ? "application/pdf"
      : doc.mimeType || upstream.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("[Vendor Document Stream Error]:", error);
    return NextResponse.json({ error: "Failed to stream document" }, { status: 500 });
  }
}
