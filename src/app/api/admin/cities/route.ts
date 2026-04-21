import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { INDIA_STATES, formatCityWithState, splitCityAndState } from "@/lib/india-locations";
import { cityConfigs } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const cityPayloadSchema = z.object({
  cityName: z.string().min(2).max(80),
  stateName: z.string().min(2).max(80),
  airportName: z.string().max(120).optional(),
});

export async function GET() {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.DATABASE_URL) {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, airportName: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      states: INDIA_STATES,
      cities: cities.map((city) => {
        const parsed = splitCityAndState(city.name);
        return {
          id: city.id,
          name: parsed.city || city.name,
          state: parsed.state,
          displayName: parsed.state ? `${parsed.city}, ${parsed.state}` : city.name,
          airportName: city.airportName || undefined,
        };
      }),
    });
  }

  return NextResponse.json({
    states: INDIA_STATES,
    cities: cityConfigs.map((city) => {
      const parsed = splitCityAndState(city.name);
      return {
        id: city.name,
        name: parsed.city || city.name,
        state: parsed.state,
        displayName: parsed.state ? `${parsed.city}, ${parsed.state}` : city.name,
        airportName: city.airport,
      };
    }),
  });
}

export async function POST(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = cityPayloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid city payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const cityDisplayName = formatCityWithState(payload.cityName, payload.stateName);

  if (process.env.DATABASE_URL) {
    const saved = await prisma.city.upsert({
      where: { name: cityDisplayName },
      update: {
        airportName: payload.airportName?.trim() || null,
        isActive: true,
      },
      create: {
        name: cityDisplayName,
        airportName: payload.airportName?.trim() || null,
        isActive: true,
      },
      select: { id: true, name: true, airportName: true },
    });

    const normalized = splitCityAndState(saved.name);
    return NextResponse.json({
      message: "City saved",
      city: {
        id: saved.id,
        name: normalized.city || saved.name,
        state: normalized.state,
        displayName: normalized.state ? `${normalized.city}, ${normalized.state}` : saved.name,
        airportName: saved.airportName || undefined,
      },
    });
  }

  const exists = cityConfigs.some((entry) => entry.name.toLowerCase() === cityDisplayName.toLowerCase());
  if (!exists) {
    cityConfigs.push({
      name: cityDisplayName,
      airport: payload.airportName?.trim() || `${payload.cityName.trim()} Airport`,
    });
  }

  return NextResponse.json({
    message: exists ? "City already exists" : "City saved",
    city: {
      id: cityDisplayName,
      name: payload.cityName.trim(),
      state: payload.stateName.trim(),
      displayName: cityDisplayName,
      airportName: payload.airportName?.trim() || `${payload.cityName.trim()} Airport`,
    },
  });
}
