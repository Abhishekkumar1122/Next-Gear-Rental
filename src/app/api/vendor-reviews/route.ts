import { vendorReviews } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const vendorId = request.nextUrl.searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  const vReviews = vendorReviews.filter((review) => review.vendorId === vendorId);

  return NextResponse.json({
    reviews: vReviews,
    count: vReviews.length,
    averageRating:
      vReviews.length > 0
        ? (vReviews.reduce((sum, r) => sum + r.rating, 0) / vReviews.length).toFixed(1)
        : 0,
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { vendorId, userId, userName, rating, comment } = payload;

  if (!vendorId || !userId || !userName || !rating || !comment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const review = {
    id: `vr${vendorReviews.length + 1}`,
    vendorId,
    userId,
    userName,
    rating: Math.min(5, Math.max(1, rating)),
    comment,
    createdAt: new Date().toISOString(),
  };

  vendorReviews.unshift(review);

  return NextResponse.json({ review }, { status: 201 });
}
