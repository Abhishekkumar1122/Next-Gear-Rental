import { NextRequest, NextResponse } from "next/server";
import { Review } from "@/lib/types";

const reviews: Review[] = [
  { id: "r1", vehicleId: "seed-vehicle-1", userId: "u1", userName: "Aarav Sharma", rating: 5, comment: "Excellent car, smooth ride and great customer service!", createdAt: "2026-02-15T16:25:00Z" },
  { id: "r2", vehicleId: "seed-vehicle-1", userId: "u2", userName: "Priya Patel", rating: 4, comment: "Good condition, minor issue with AC. But overall satisfied.", createdAt: "2026-02-18T12:40:00Z" },
  { id: "r3", vehicleId: "veh-2", userId: "u1", userName: "Aarav Sharma", rating: 5, comment: "Bike is in perfect condition. Highly recommended!", createdAt: "2026-02-19T14:15:00Z" },
  { id: "r4", vehicleId: "veh-3", userId: "u2", userName: "Priya Patel", rating: 4, comment: "Good scooter for city rides. Smooth handling.", createdAt: "2026-02-20T10:50:00Z" },
];


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
