import { getServerSessionUser } from "@/lib/server-session";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { submitKycAutomation } from "@/lib/kyc-automation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getServerSessionUser();
    if (!user || (user.role !== "VENDOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Vendor or Admin access required." }, { status: 401 });
    }

    const { bookingId, dlNumber, dlName, dlPhoto } = await request.json().catch(() => ({}));

    if (!bookingId || !dlNumber || !dlName || !dlPhoto) {
      return NextResponse.json({ error: "Missing required fields: bookingId, dlNumber, dlName, or dlPhoto" }, { status: 400 });
    }

    if (typeof dlPhoto !== "string" || !dlPhoto.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format. Must be base64 data URL." }, { status: 400 });
    }

    // 1. Fetch booking details to get customer email and userId
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Decode DL base64 photo
    const base64Data = dlPhoto.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "DL Photo size must be 6MB or smaller" }, { status: 400 });
    }

    // 3. Upload to Cloudinary under customer KYC directory
    const fileName = `dl-${booking.userId}-${Date.now()}`;
    const upload = await uploadBufferToCloudinary({
      buffer,
      folder: "nextgear/kyc",
      resourceType: "image",
      publicId: fileName,
    });

    // 4. Save UserDocument record
    await prisma.userDocument.create({
      data: {
        userId: booking.userId,
        type: "license",
        fileUrl: upload.url,
      },
    });

    // 5. Submit KYC Automation record with overridden APPROVED status
    await submitKycAutomation({
      userEmail: booking.user.email,
      fullName: dlName,
      documentType: "license",
      documentNumber: dlNumber,
      dob: "2000-01-01", // manual override fallback DOB
      overrideStatus: "approved",
    });

    return NextResponse.json({ success: true, message: "KYC approved successfully" }, { status: 201 });
  } catch (error) {
    console.error("KYC counter-verify API error:", error);
    return NextResponse.json(
      { error: "Failed to verify and approve KYC", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
