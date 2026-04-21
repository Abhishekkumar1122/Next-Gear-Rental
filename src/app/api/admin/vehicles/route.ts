import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { splitCityAndState } from "@/lib/india-locations";
import { cityConfigs, vehicles, vendors } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { getVehicleAvailabilityOverrides } from "@/lib/vehicle-availability-db";
import { adminVehicleStatusStore, resolveVehicleAvailability } from "@/lib/vehicle-availability";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { getTrendingRideMap } from "@/lib/trending-rides";
import { getVehicleNumberMap, setVehicleNumberForVehicle } from "@/lib/vendor-fleet-vehicle-number";
import { getImageMapForVehicles, setImageUrlsForVehicle } from "@/lib/vendor-fleet-media";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createVehicleSchema = z.object({
  title: z.string().min(2).max(120),
  type: z.enum(["bike", "car", "scooty"]),
  fuel: z.enum(["petrol", "diesel", "electric"]),
  transmission: z.enum(["manual", "automatic"]),
  seats: z.number().int().min(1).max(12),
  pricePerDayINR: z.number().int().positive(),
  vehicleNumber: z.string().min(4).max(30),
  imageUrl: z.string().url(),
  airportPickup: z.boolean().default(false),
  cityId: z.string().optional(),
  cityName: z.string().optional(),
  vendorId: z.string().optional(),
});

export async function GET() {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.DATABASE_URL) {
    const dbVehicles = await prisma.vehicle.findMany({
      include: {
        city: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        endDate: { gte: now },
      },
      select: {
        vehicleId: true,
        endDate: true,
      },
    });

    const activeVehicleIds = new Set(activeBookings.map((item) => item.vehicleId));
    const bookedUntilMap = new Map<string, string>();
    for (const item of activeBookings) {
      const nextEnd = item.endDate.toISOString().slice(0, 10);
      const existing = bookedUntilMap.get(item.vehicleId);
      if (!existing || nextEnd > existing) bookedUntilMap.set(item.vehicleId, nextEnd);
    }

    const [overrides, trendingMap] = await Promise.all([
      getVehicleAvailabilityOverrides(),
      getTrendingRideMap(),
    ]);
    const vehicleNumberMap = await getVehicleNumberMap(dbVehicles.map((vehicle) => vehicle.id));
    const imageMap = await getImageMapForVehicles(dbVehicles.map((vehicle) => vehicle.id));

    return NextResponse.json({
      cities: (await prisma.city.findMany({
        select: { id: true, name: true, airportName: true },
        where: { isActive: true },
        orderBy: { name: "asc" },
      })).map((city) => {
        const parsed = splitCityAndState(city.name);
        return {
          id: city.id,
          name: parsed.city || city.name,
          state: parsed.state,
          displayName: parsed.state ? `${parsed.city}, ${parsed.state}` : city.name,
          airportName: city.airportName || undefined,
        };
      }),
      vendors: await prisma.vendor.findMany({
        select: { id: true, businessName: true },
        orderBy: { businessName: "asc" },
      }),
      vehicles: dbVehicles.map((vehicle) => {
        const hasActiveBooking = activeVehicleIds.has(vehicle.id);
        return {
          id: vehicle.id,
          title: vehicle.title,
          type: vehicle.type,
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
          seats: vehicle.seats,
          airportPickup: vehicle.airportPickup,
          cityId: vehicle.cityId,
          vendorId: vehicle.vendorId,
          vehicleNumber: vehicleNumberMap.get(vehicle.id),
          imageUrl: imageMap.get(vehicle.id)?.[0],
          city: vehicle.city.name,
          pricePerDayINR: getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR),
          status: resolveVehicleAvailability({
            vehicleId: vehicle.id,
            hasActiveBooking,
            override: overrides.get(vehicle.id),
          }),
          statusMessage: hasActiveBooking
            ? `Booked until ${bookedUntilMap.get(vehicle.id) ?? "upcoming date"}`
            : overrides.get(vehicle.id)?.note ?? "Ready for booking",
          bookedUntil: bookedUntilMap.get(vehicle.id),
          note: overrides.get(vehicle.id)?.note,
          hasActiveBooking,
          isTrending: trendingMap.has(vehicle.id),
          trendingBadge: trendingMap.get(vehicle.id)?.badge,
          trendingRank: trendingMap.get(vehicle.id)?.rank,
        };
      }),
    });
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const activeVehicleIds = new Set(
    bookingsStore
      .filter((entry) => entry.status === "confirmed" && entry.endDate >= todayIso)
      .map((entry) => entry.vehicleId),
  );
  const bookedUntilMap = new Map<string, string>();
  for (const entry of bookingsStore.filter((item) => item.status === "confirmed" && item.endDate >= todayIso)) {
    const existing = bookedUntilMap.get(entry.vehicleId);
    if (!existing || entry.endDate > existing) bookedUntilMap.set(entry.vehicleId, entry.endDate);
  }

  const trendingMap = await getTrendingRideMap();

  return NextResponse.json({
    cities: cityConfigs.map((item) => {
      const parsed = splitCityAndState(item.name);
      return {
        id: item.name,
        name: parsed.city || item.name,
        state: parsed.state,
        displayName: parsed.state ? `${parsed.city}, ${parsed.state}` : item.name,
        airportName: item.airport,
      };
    }),
    vendors: vendors.map((item) => ({ id: item.id, businessName: item.businessName })),
    vehicles: vehicles.map((vehicle) => {
      const hasActiveBooking = activeVehicleIds.has(vehicle.id);
      const override = adminVehicleStatusStore[vehicle.id];
      return {
        id: vehicle.id,
        title: vehicle.title,
        type: vehicle.type,
        fuel: vehicle.fuel,
        transmission: vehicle.transmission,
        seats: vehicle.seats,
        airportPickup: vehicle.airportPickup,
        cityId: vehicle.city,
        vendorId: vehicle.vendorId,
        vehicleNumber: vehicle.vehicleNumber,
        imageUrl: vehicle.imageUrls?.[0],
        city: vehicle.city,
        pricePerDayINR: getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR),
        status: resolveVehicleAvailability({ vehicleId: vehicle.id, hasActiveBooking, override }),
        statusMessage: hasActiveBooking
          ? `Booked until ${bookedUntilMap.get(vehicle.id) ?? "upcoming date"}`
          : override?.note ?? "Ready for booking",
        bookedUntil: bookedUntilMap.get(vehicle.id),
        note: override?.note,
        hasActiveBooking,
        isTrending: trendingMap.has(vehicle.id),
        trendingBadge: trendingMap.get(vehicle.id)?.badge,
        trendingRank: trendingMap.get(vehicle.id)?.rank,
      };
    }),
  });
}

export async function POST(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = createVehicleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vehicle payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (process.env.DATABASE_URL) {
    if (!payload.cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    const city = await prisma.city.findUnique({ where: { id: payload.cityId }, select: { id: true } });
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    if (payload.vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: payload.vendorId }, select: { id: true } });
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      }
    }

    const created = await prisma.vehicle.create({
      data: {
        title: payload.title.trim(),
        type: payload.type,
        fuel: payload.fuel,
        transmission: payload.transmission,
        seats: payload.seats,
        pricePerDayINR: payload.pricePerDayINR,
        airportPickup: payload.airportPickup,
        cityId: payload.cityId,
        vendorId: payload.vendorId || null,
      },
      select: {
        id: true,
        title: true,
      },
    });

    await setVehicleNumberForVehicle(created.id, payload.vehicleNumber);
    await setImageUrlsForVehicle(created.id, [payload.imageUrl]);

    return NextResponse.json(
      {
        message: "Vehicle created",
        vehicle: {
          ...created,
          vehicleNumber: payload.vehicleNumber.trim(),
          imageUrl: payload.imageUrl,
        },
      },
      { status: 201 }
    );
  }

  const city = payload.cityName?.trim();
  if (!city) {
    return NextResponse.json({ error: "cityName is required in mock mode" }, { status: 400 });
  }

  const id = `veh-${Date.now()}`;
  vehicles.unshift({
    id,
    title: payload.title.trim(),
    city,
    type: payload.type,
    fuel: payload.fuel,
    transmission: payload.transmission,
    seats: payload.seats,
    pricePerDayINR: payload.pricePerDayINR,
    vehicleNumber: payload.vehicleNumber.trim(),
    availableDates: [],
    vendorId: payload.vendorId || undefined,
    airportPickup: payload.airportPickup,
    imageUrls: [payload.imageUrl],
  });

  await setVehicleNumberForVehicle(id, payload.vehicleNumber);
  await setImageUrlsForVehicle(id, [payload.imageUrl]);

  return NextResponse.json(
    {
      message: "Vehicle created",
      vehicle: { id, title: payload.title, vehicleNumber: payload.vehicleNumber.trim(), imageUrl: payload.imageUrl },
    },
    { status: 201 }
  );
}
