import { getServerSessionUser } from "@/lib/server-session";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);

function resolveExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
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

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WEBP images are allowed" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 400 });
  }

  const extension = resolveExtension(file.type);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  const upload = await uploadBufferToCloudinary({
    buffer: bytes,
    folder: `nextgear/vendor/${vendor.id}/fleet`,
    resourceType: "image",
    publicId: safeName.replace(/\.[^.]+$/, ""),
    originalFilename: file.name,
  });

  return NextResponse.json({ imageUrl: upload.url }, { status: 201 });
}
