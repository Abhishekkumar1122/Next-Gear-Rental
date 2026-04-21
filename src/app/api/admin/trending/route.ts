import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { setTrendingRide } from "@/lib/trending-rides";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const trendingPayloadSchema = z.object({
  vehicleId: z.string().min(2),
  isTrending: z.boolean(),
  badge: z.string().max(40).optional(),
  rank: z.number().int().min(1).max(999).optional(),
});

export async function PATCH(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = trendingPayloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (process.env.DATABASE_URL) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: payload.vehicleId }, select: { id: true } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
  }

  await setTrendingRide(payload);

  return NextResponse.json({
    message: payload.isTrending ? "Trending ride updated" : "Trending ride removed",
    vehicleId: payload.vehicleId,
    isTrending: payload.isTrending,
  });
}

export async function GET() {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
