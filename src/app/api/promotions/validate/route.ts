import { computePromotionBreakdown } from "@/lib/promotions";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const userEmail = String(payload.userEmail ?? "").trim();
  const city = String(payload.city ?? "").trim();
  const couponCode = payload.couponCode ? String(payload.couponCode) : undefined;
  const referralCode = payload.referralCode ? String(payload.referralCode) : undefined;
  const subtotalAmountINR = Number(payload.subtotalAmountINR ?? 0);

  if (!userEmail || !city || !Number.isFinite(subtotalAmountINR) || subtotalAmountINR <= 0) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  let bookingCount = 0;
  if (process.env.DATABASE_URL) {
    bookingCount = await prisma.booking.count({
      where: {
        user: {
          email: userEmail,
        },
      },
    });
  } else {
    bookingCount = bookingsStore.filter((item) => item.userEmail.toLowerCase() === userEmail.toLowerCase()).length;
  }

  const breakdown = await computePromotionBreakdown({
    userEmail,
    city,
    subtotalAmountINR,
    bookingCount,
    couponCode,
    referralCode,
  });

  return NextResponse.json({
    breakdown,
  });
}
