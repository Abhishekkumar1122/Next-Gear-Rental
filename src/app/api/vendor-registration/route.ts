import { createVendorApplication } from "@/lib/vendor-applications";
import {
  sendVendorApplicationReceivedNotification,
  sendAdminVendorApplicationAlert,
} from "@/lib/vendor-email-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const vendorRegistrationSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(24),
  state: z.string().trim().min(2).max(60),
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

  // 1. Fire application received email + WhatsApp notification to Vendor (non-blocking)
  void sendVendorApplicationReceivedNotification({
    businessName: application.businessName,
    contactName: application.contactName,
    email: application.email,
    phone: application.phone,
    cityName: application.city,
    applicationId: application.id,
  });

  // 2. Fire Instant Dual-Alert (Email + WhatsApp) to Admin (non-blocking)
  void sendAdminVendorApplicationAlert({
    applicationId: application.id,
    businessName: application.businessName,
    contactName: application.contactName,
    email: application.email,
    phone: application.phone,
    city: application.city,
    state: application.state,
    fleetSize: application.fleetSize,
  });

  return NextResponse.json(
    {
      message: "Vendor interest submitted. Our team will contact you for KYC.",
      application,
    },
    { status: 201 }
  );
}
