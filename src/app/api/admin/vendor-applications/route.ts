import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import {
  generateVendorCredentials,
  getVendorApplications,
  updateVendorKycChecklist,
  updateVendorApplication,
  type VendorApplicationStatus,
} from "@/lib/vendor-applications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.enum([
  "new",
  "contacted",
  "kyc-in-progress",
  "kyc-complete",
  "credentials-generated",
  "rejected",
]);

const updateSchema = z.object({
  action: z.enum(["update", "update-kyc-checklist", "generate-credentials"]),
  id: z.string().min(2),
  status: statusSchema.optional(),
  adminNotes: z.string().max(500).optional(),
  checklist: z
    .object({
      identityVerified: z.boolean().optional(),
      businessProofVerified: z.boolean().optional(),
      bankVerified: z.boolean().optional(),
      agreementAccepted: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusParam = request.nextUrl.searchParams.get("status") ?? "all";
  const queryParam = request.nextUrl.searchParams.get("query") ?? "";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "100");

  const safeStatus: VendorApplicationStatus | "all" =
    statusParam === "new" ||
    statusParam === "contacted" ||
    statusParam === "kyc-in-progress" ||
    statusParam === "kyc-complete" ||
    statusParam === "credentials-generated" ||
    statusParam === "rejected"
      ? statusParam
      : "all";

  const applications = await getVendorApplications({
    status: safeStatus,
    query: queryParam,
    limit: Number.isFinite(limitParam) ? limitParam : 100,
  });

  return NextResponse.json({ applications });
}

export async function PATCH(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.action === "generate-credentials") {
    const updated = await generateVendorCredentials(parsed.data.id);
    if (!updated) {
      return NextResponse.json({ error: "Vendor application not found" }, { status: 404 });
    }

    return NextResponse.json({ application: updated });
  }

  if (parsed.data.action === "update-kyc-checklist") {
    if (!parsed.data.checklist) {
      return NextResponse.json({ error: "checklist payload is required" }, { status: 400 });
    }

    const updated = await updateVendorKycChecklist(parsed.data.id, parsed.data.checklist, parsed.data.adminNotes);
    if (!updated) {
      return NextResponse.json({ error: "Vendor application not found" }, { status: 404 });
    }

    return NextResponse.json({ application: updated });
  }

  if (!parsed.data.status && typeof parsed.data.adminNotes !== "string") {
    return NextResponse.json({ error: "status or adminNotes is required for update action" }, { status: 400 });
  }

  const updated = await updateVendorApplication(parsed.data.id, {
    status: parsed.data.status,
    adminNotes: parsed.data.adminNotes,
  });

  if (!updated) {
    return NextResponse.json({ error: "Vendor application not found" }, { status: 404 });
  }

  return NextResponse.json({ application: updated });
}
