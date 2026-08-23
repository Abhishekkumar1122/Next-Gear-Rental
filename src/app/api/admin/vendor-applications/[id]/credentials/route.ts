import { assertAdminSession } from "@/lib/admin-security";
import { generateVendorCredentials } from "@/lib/vendor-applications";
import { NextResponse } from "next/server";
import { z } from "zod";

const credentialsSchema = z.object({
  commissionRate: z.number().min(1).max(100).optional().default(15),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = credentialsSchema.safeParse(payload);
  const commissionRate = parsed.success ? parsed.data.commissionRate : 15;

  const application = await generateVendorCredentials(id, commissionRate);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "Vendor credentials generated and dispatched successfully via Email and WhatsApp.",
    application,
  });
}