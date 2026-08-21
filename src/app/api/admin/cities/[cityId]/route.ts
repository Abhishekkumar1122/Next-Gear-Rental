import { assertAdminMutationRequest } from "@/lib/admin-security";
import { formatCityWithState, splitCityAndState } from "@/lib/india-locations";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateCitySchema = z.object({
  cityName: z.string().min(2).max(80),
  stateName: z.string().min(2).max(80),
  airportName: z.string().max(120).optional(),
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
  const cityDisplayName = formatCityWithState(payload.cityName, payload.stateName);

  const existing = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  const updated = await prisma.city.update({
    where: { id: cityId },
    data: {
      name: cityDisplayName,
      airportName: payload.airportName?.trim() || null,
      isActive: true,
    },
    select: { id: true, name: true, airportName: true },
  });

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
  return NextResponse.json({ message: "City deleted", cityId });
}
