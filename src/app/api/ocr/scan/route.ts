import { NextRequest, NextResponse } from "next/server";
import { performGeminiOcr } from "@/lib/gemini-ocr";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Maximum 30 seconds for AI vision scan

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Case 1: Multipart form data with uploaded File
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "image/jpeg";

      const ocrResult = await performGeminiOcr(buffer, mimeType);
      return NextResponse.json({
        success: true,
        ocr: ocrResult,
        fileName: file.name,
      });
    }

    // Case 2: JSON payload with Base64 data or Image URL
    const body = await request.json().catch(() => ({}));
    if (body.base64) {
      const cleanBase64 = body.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const mimeType = body.mimeType || "image/jpeg";

      const ocrResult = await performGeminiOcr(buffer, mimeType);
      return NextResponse.json({
        success: true,
        ocr: ocrResult,
      });
    }

    if (body.imageUrl) {
      const imageRes = await fetch(body.imageUrl);
      if (!imageRes.ok) {
        return NextResponse.json({ error: "Failed to download image from URL" }, { status: 400 });
      }
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

      const ocrResult = await performGeminiOcr(buffer, mimeType);
      return NextResponse.json({
        success: true,
        ocr: ocrResult,
      });
    }

    return NextResponse.json({ error: "Please provide a file, base64 data, or imageUrl" }, { status: 400 });
  } catch (error) {
    console.error("[OCR API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OCR scanning failed" },
      { status: 500 }
    );
  }
}
