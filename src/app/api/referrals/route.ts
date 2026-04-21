import { getReferralStats } from "@/lib/promotions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const email = String(request.nextUrl.searchParams.get("email") ?? "").trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const stats = await getReferralStats(email);
  return NextResponse.json({
    referral: stats,
  });
}
