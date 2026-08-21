import { getVendorApplicationByIdAndPhone } from "@/lib/vendor-applications";
import { listVendorKycDocuments } from "@/lib/vendor-kyc-documents";
import { NextResponse } from "next/server";
import { z } from "zod";

const statusLookupSchema = z.object({
  applicationId: z.string().trim().min(8).max(80),
  phone: z.string().trim().min(7).max(24),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = statusLookupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Application ID and registered phone number are required" },
      { status: 400 }
    );
  }

  const application = await getVendorApplicationByIdAndPhone(
    parsed.data.applicationId,
    parsed.data.phone
  );

  if (!application) {
    return NextResponse.json(
      { error: "No vendor application found for those details" },
      { status: 404 }
    );
  }

  const documents = await listVendorKycDocuments(application.id);

  return NextResponse.json({
    application: {
      id: application.id,
      businessName: application.businessName,
      contactName: application.contactName,
      phone: application.phone,
      city: application.city,
      fleetSize: application.fleetSize,
      status: application.status,
      kycChecklist: application.kycChecklist,
      adminNotes: application.adminNotes,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      kycApprovedAt: application.kycApprovedAt,
      onboardingAutomatedAt: application.onboardingAutomatedAt,
      hasVendorAccount: Boolean(application.vendorId),
    },
    documents,
  });
}
