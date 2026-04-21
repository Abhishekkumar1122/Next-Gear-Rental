import { createVendorApplication } from "@/lib/vendor-applications";
import { NextResponse } from "next/server";
import { z } from "zod";

const vendorRegistrationSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(24),
  city: z.string().trim().min(2).max(100),
  fleetSize: z.string().trim().min(1).max(30),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = vendorRegistrationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vendor registration payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const application = await createVendorApplication(parsed.data);
  return NextResponse.json(
    {
      message: "Vendor interest submitted. Our team will contact you for KYC.",
      application,
    },
    { status: 201 }
  );
}
