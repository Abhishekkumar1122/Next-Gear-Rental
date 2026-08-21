import { getServerSessionUser } from "@/lib/server-session";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { submitVendorModerationAppeal } from "@/lib/vendor-moderation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendor = await resolveVendorContext(user);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor account not configured" }, { status: 404 });
  }

  const { appealText } = await request.json().catch(() => ({}));
  if (!appealText || typeof appealText !== "string" || !appealText.trim()) {
    return NextResponse.json({ error: "Appeal text is required" }, { status: 400 });
  }

  await submitVendorModerationAppeal(vendor.id, appealText.trim());
  return NextResponse.json({ message: "Appeal submitted successfully." });
}
