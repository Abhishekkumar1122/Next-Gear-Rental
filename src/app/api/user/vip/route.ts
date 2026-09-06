import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server-session";
import { getUserVipDetails, purchasePlatinumPass, VIP_TIER_CONFIGS, type VipTier } from "@/lib/user-vip-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vipDetails = await getUserVipDetails(user.id, user.email);
    return NextResponse.json({ vipDetails });
  } catch (error) {
    console.error("[GET /api/user/vip Error]", error);
    return NextResponse.json(
      {
        vipDetails: {
          userId: "unknown",
          tier: "BRONZE" as VipTier,
          source: "auto_rides",
          completedRides: 0,
          ridesUntilNextTier: 3,
          nextTier: "SILVER" as VipTier,
          expiresAt: null,
          config: VIP_TIER_CONFIGS.BRONZE,
          allConfigs: VIP_TIER_CONFIGS,
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body.plan === "yearly" ? 12 : 1; // 1 month or 12 months

    const result = await purchasePlatinumPass(user.id, plan);
    const updatedVip = await getUserVipDetails(user.id, user.email);

    return NextResponse.json({
      success: true,
      message: `🎉 Congratulations! Platinum VIP Pass activated until ${new Date(result.expiresAt).toLocaleDateString("en-IN")}!`,
      vipDetails: updatedVip,
    });
  } catch (error) {
    console.error("[POST /api/user/vip Error]", error);
    return NextResponse.json({ error: "Failed to activate VIP Pass" }, { status: 500 });
  }
}
