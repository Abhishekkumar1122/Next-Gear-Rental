import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { NextResponse } from "next/server";
import { z } from "zod";

const siteSettingsSchema = z.object({
  brandName: z.string().min(2).max(80).optional(),
  sinceText: z.string().min(2).max(40).optional(),
  description: z.string().min(10).max(240).optional(),
  supportEmail: z.string().email().optional(),
  businessEmail: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  whatsappUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  logoUrl: z.string().min(1).max(300).optional(),
});

export async function GET() {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = siteSettingsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await updateSiteSettings(parsed.data);
  return NextResponse.json({ message: "Site settings updated", settings });
}
