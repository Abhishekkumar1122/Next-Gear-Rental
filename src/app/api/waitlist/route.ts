import { getServerSessionUser } from "@/lib/server-session";
import {
  joinVehicleWaitlist,
  listWaitlistByEmail,
  listWaitlistNotificationsByEmail,
} from "@/lib/waitlist";
import { vehicles } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type AlternativeVehicle = {
  id: string;
  title: string;
  city: string;
  type: string;
  seats: number;
  pricePerDayINR: number;
};

const joinSchema = z.object({
  vehicleId: z.string().min(1),
  city: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  name: z.string().min(2).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getServerSessionUser();
  const queryEmail = request.nextUrl.searchParams.get("email")?.trim();
  const email = user?.email?.trim() || queryEmail;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const [entries, notifications] = await Promise.all([
    listWaitlistByEmail(email),
    listWaitlistNotificationsByEmail(email),
  ]);

  const vehicleIds = Array.from(new Set(entries.map((entry) => entry.vehicleId)));
  let titleMap = new Map<string, string>();

  if (vehicleIds.length) {
    if (process.env.DATABASE_URL) {
      const dbVehicles = await prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { id: true, title: true },
      });
      titleMap = new Map(dbVehicles.map((item) => [item.id, item.title]));
    } else {
      titleMap = new Map(
        vehicles
          .filter((item) => vehicleIds.includes(item.id))
          .map((item) => [item.id, item.title]),
      );
    }
  }

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    vehicleTitle: titleMap.get(entry.vehicleId),
  }));
  const enrichedNotifications = notifications.map((item) => ({
    ...item,
    vehicleTitle: titleMap.get(item.vehicleId),
  }));

  return NextResponse.json({ entries: enrichedEntries, notifications: enrichedNotifications });
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  const parsed = joinSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const email = user?.email?.trim() || payload.email?.trim();
  const phone = payload.phone?.trim();
  const name = payload.name?.trim();

  if (!email) {
    return NextResponse.json({ error: "Please log in or provide an email address" }, { status: 401 });
  }

  let resolvedCity = payload.city.trim();
  let vehicleTitle: string | undefined;
  let vehicleType: string | undefined;
  let alternatives: AlternativeVehicle[] = [];

  if (process.env.DATABASE_URL) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: payload.vehicleId },
      select: { id: true, title: true, type: true, city: { select: { name: true } } },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    resolvedCity = vehicle.city.name;
    vehicleTitle = vehicle.title;
    vehicleType = vehicle.type;

    const dbAlternatives = await prisma.vehicle.findMany({
      where: {
        city: { is: { name: resolvedCity } },
        id: { not: payload.vehicleId },
        operationalStatus: "AVAILABLE",
      },
      select: {
        id: true,
        title: true,
        type: true,
        seats: true,
        pricePerDayINR: true,
        city: { select: { name: true } },
      },
      take: 12,
    });

    const sortedAlternatives = dbAlternatives
      .sort((a, b) => {
        if (a.type === vehicleType && b.type !== vehicleType) return -1;
        if (a.type !== vehicleType && b.type === vehicleType) return 1;
        return a.pricePerDayINR - b.pricePerDayINR;
      })
      .slice(0, 3);

    alternatives = sortedAlternatives.map((item) => ({
      id: item.id,
      title: item.title,
      city: item.city.name,
      type: item.type,
      seats: item.seats,
      pricePerDayINR: item.pricePerDayINR,
    }));
  } else {
    const vehicle = vehicles.find((item) => item.id === payload.vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    resolvedCity = vehicle.city;
    vehicleTitle = vehicle.title;
    vehicleType = vehicle.type;

    alternatives = vehicles
      .filter((item) => item.id !== payload.vehicleId && item.city === resolvedCity)
      .sort((a, b) => {
        if (a.type === vehicleType && b.type !== vehicleType) return -1;
        if (a.type !== vehicleType && b.type === vehicleType) return 1;
        return a.pricePerDayINR - b.pricePerDayINR;
      })
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        city: item.city,
        type: item.type,
        seats: item.seats,
        pricePerDayINR: item.pricePerDayINR,
      }));
  }

  const { entry, alreadyJoined } = await joinVehicleWaitlist({
    vehicleId: payload.vehicleId,
    userEmail: email,
    userName: name,
    userPhone: phone,
    city: resolvedCity,
    source: "web",
  });

  return NextResponse.json({
    message: alreadyJoined
      ? "You are already in the waitlist for this vehicle"
      : "You have been added to the waitlist",
    alreadyJoined,
    entry,
    vehicleTitle,
    alternatives,
  });
}
