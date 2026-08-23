import { assertAdminMutationRequest } from "@/lib/admin-security";
import { formatCityWithState, splitCityAndState } from "@/lib/india-locations";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";

const updateCitySchema = z.object({
  cityName: z.string().min(2).max(80).optional(),
  stateName: z.string().min(2).max(80).optional(),
  airportName: z.string().max(120).optional(),
  isActive: z.boolean().optional(),
});

type Props = {
  params: Promise<{ cityId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { cityId } = await params;
  const parsed = updateCitySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid city payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const existing = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true, name: true } });
  if (!existing) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  const updateData: { name?: string; airportName?: string | null; isActive?: boolean } = {};
  if (payload.cityName && payload.stateName) {
    updateData.name = formatCityWithState(payload.cityName, payload.stateName);
  }
  if (payload.airportName !== undefined) {
    updateData.airportName = payload.airportName.trim() || null;
  }
  if (payload.isActive !== undefined) {
    updateData.isActive = payload.isActive;
  }

  const updated = await prisma.city.update({
    where: { id: cityId },
    data: updateData,
    select: { id: true, name: true, airportName: true, isActive: true },
  });

  try {
    revalidateTag("cities-list", "default");
  } catch (e) {
    // catch outside of Next.js serverless execution container
  }

  const normalized = splitCityAndState(updated.name);
  return NextResponse.json({
    message: "City updated",
    city: {
      id: updated.id,
      name: normalized.city || updated.name,
      state: normalized.state,
      displayName: normalized.state ? `${normalized.city}, ${normalized.state}` : updated.name,
      airportName: updated.airportName || undefined,
    },
  });
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { cityId } = await params;

  const existing = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  const linkedVehicles = await prisma.vehicle.count({ where: { cityId } });
  if (linkedVehicles > 0) {
    return NextResponse.json({ error: "Cannot delete city linked to vehicles" }, { status: 409 });
  }

  await prisma.city.delete({ where: { id: cityId } });
  try {
    revalidateTag("cities-list", "default");
  } catch (e) {
    // catch outside of Next.js serverless execution container
  }
  return NextResponse.json({ message: "City deleted", cityId });
}
