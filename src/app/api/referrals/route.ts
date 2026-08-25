import { getReferralStats } from "@/lib/promotions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let email = String(request.nextUrl.searchParams.get("email") ?? "").trim();
  const phone = String(request.nextUrl.searchParams.get("phone") ?? "").replace(/\D/g, "").slice(-10);

  if (!email && phone) {
    email = `${phone}@guest.next-gear.app`;
  }

  if (!email) {
    return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
  }

  const stats = await getReferralStats(email);
  return NextResponse.json({
    referral: stats,
  });
}
