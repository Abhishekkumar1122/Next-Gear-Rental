import { NextRequest, NextResponse } from "next/server";
import { VendorReview } from "@/lib/types";

const vendorReviews: VendorReview[] = [
  { id: "vr1", vendorId: "v1", userId: "u1", userName: "Aarav Sharma", rating: 5, comment: "Metro Wheels provided excellent service. Very professional!", createdAt: "2026-02-16T15:00:00Z" },
  { id: "vr2", vendorId: "v1", userId: "u2", userName: "Priya Patel", rating: 4, comment: "Good fleet, responsive support team.", createdAt: "2026-02-19T11:30:00Z" },
  { id: "vr3", vendorId: "v2", userId: "u1", userName: "Aarav Sharma", rating: 4, comment: "Swift Rides is reliable. Fair pricing.", createdAt: "2026-02-20T09:45:00Z" },
];


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
