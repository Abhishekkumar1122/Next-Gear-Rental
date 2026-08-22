import { getServerSessionUser } from "@/lib/server-session";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getServerSessionUser();
    if (!user || (user.role !== "VENDOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Vendor or Admin access required." }, { status: 401 });
    }

    const { image } = await request.json().catch(() => ({}));
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing base64 image data" }, { status: 400 });
    }

    if (!image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format. Must be base64 data URL." }, { status: 400 });
    }

    // Extract base64 payload
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Enforce 5MB limit
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be 5MB or smaller" }, { status: 400 });
    }

    const fileName = `handover-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const upload = await uploadBufferToCloudinary({
      buffer,
      folder: "nextgear/handovers",
      resourceType: "image",
      publicId: fileName,
    });

    return NextResponse.json({ imageUrl: upload.url }, { status: 201 });
  } catch (error) {
    console.error("Handover upload API error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo to storage", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
