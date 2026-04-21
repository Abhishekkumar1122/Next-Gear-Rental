import { reviews } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");

  if (!vehicleId) {
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  }

  const vehicleReviews = reviews.filter((review) => review.vehicleId === vehicleId);

  return NextResponse.json({
    reviews: vehicleReviews,
    count: vehicleReviews.length,
    averageRating:
      vehicleReviews.length > 0
        ? (vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length).toFixed(1)
        : 0,
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { vehicleId, userId, userName, rating, comment } = payload;

  if (!vehicleId || !userId || !userName || !rating || !comment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const review = {
    id: `r${reviews.length + 1}`,
    vehicleId,
    userId,
    userName,
    rating: Math.min(5, Math.max(1, rating)),
    comment,
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(review);

  return NextResponse.json({ review }, { status: 201 });
}
