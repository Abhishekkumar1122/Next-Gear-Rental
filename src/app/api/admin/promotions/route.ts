import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { listCouponCampaigns, upsertCouponCampaign, type CouponCampaign } from "@/lib/promotions";
import { NextRequest, NextResponse } from "next/server";

function parseCampaign(input: any): CouponCampaign {
  return {
    code: String(input.code ?? ""),
    title: String(input.title ?? ""),
    description: input.description ? String(input.description) : undefined,
    discountType: input.discountType === "flat" ? "flat" : "percent",
    discountValue: Number(input.discountValue ?? 0),
    minSubtotalINR: input.minSubtotalINR === "" || input.minSubtotalINR === undefined ? undefined : Number(input.minSubtotalINR),
    maxDiscountINR: input.maxDiscountINR === "" || input.maxDiscountINR === undefined ? undefined : Number(input.maxDiscountINR),
    city: input.city ? String(input.city) : undefined,
    eligibility: input.eligibility === "first_ride" || input.eligibility === "repeat" ? input.eligibility : "all",
    startsAt: input.startsAt ? String(input.startsAt) : undefined,
    endsAt: input.endsAt ? String(input.endsAt) : undefined,
    usageLimit: input.usageLimit === "" || input.usageLimit === undefined ? undefined : Number(input.usageLimit),
    perUserLimit: input.perUserLimit === "" || input.perUserLimit === undefined ? undefined : Number(input.perUserLimit),
    isActive: Boolean(input.isActive),
  };
}

export async function GET() {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const campaigns = await listCouponCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const guard = await assertAdminMutationRequest(request);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const payload = await request.json().catch(() => ({}));
  const campaign = parseCampaign(payload);
  if (!campaign.code || !campaign.title || !Number.isFinite(campaign.discountValue) || campaign.discountValue <= 0) {
    return NextResponse.json({ error: "Invalid campaign payload" }, { status: 400 });
  }

  const saved = await upsertCouponCampaign(campaign);
  return NextResponse.json({ campaign: saved });
}
