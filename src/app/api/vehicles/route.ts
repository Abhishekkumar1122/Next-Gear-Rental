import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { getVehicleAvailabilityOverrides } from "@/lib/vehicle-availability-db";
import { adminVehicleStatusStore, resolveVehicleAvailability } from "@/lib/vehicle-availability";
import { getImageMapForVehicles } from "@/lib/vendor-fleet-media";
import { getVehicleNumberMap } from "@/lib/vendor-fleet-vehicle-number";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { Vehicle } from "@/lib/types";
import { vehicles } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function futureDates(days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function defaultHourlySlots() {
  return Array.from({ length: 12 }, (_, index) => {
    const hour = 8 + index;
    return `${String(hour).padStart(2, "0")}:00`;
  });
}

function buildHourlyRange(startTime: string, endTime: string) {
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);
  if (Number.isNaN(startHour) || Number.isNaN(endHour) || startHour >= endHour) {
    return [];
  }

  return Array.from({ length: endHour - startHour }, (_, index) => {
    const hour = startHour + index;
    return `${String(hour).padStart(2, "0")}:00`;
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city")?.trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const query = searchParams.get("q")?.trim();
  const type = searchParams.get("type");
  const fuel = searchParams.get("fuel");
  const transmission = searchParams.get("transmission");
  const maxPrice = Number(searchParams.get("maxPrice") ?? 0);

  if (process.env.DATABASE_URL) {
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
    const overrides = await getVehicleAvailabilityOverrides();

    const dbVehicles = await prisma.vehicle.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(fuel ? { fuel } : {}),
        ...(transmission ? { transmission } : {}),
        ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
        ...(city
          ? {
              city: {
                name: city,
              },
            }
          : {}),
      },
      include: {
        city: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const dbCities = await prisma.city.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const imageMap = await getImageMapForVehicles(dbVehicles.map((vehicle) => vehicle.id));
    const vehicleNumberMap = await getVehicleNumberMap(dbVehicles.map((vehicle) => vehicle.id));

    const mappedVehicles = dbVehicles
      .map((vehicle) => {
      const status = resolveVehicleAvailability({
        vehicleId: vehicle.id,
        hasActiveBooking: activeVehicleIds.has(vehicle.id),
        override: overrides.get(vehicle.id),
      });

      const dates = futureDates();
      const slots = defaultHourlySlots();
      const override = overrides.get(vehicle.id);
      const statusMessage =
        status === "booked"
          ? `Booked until ${bookedUntilMap.get(vehicle.id) ?? "upcoming date"}`
          : status === "maintenance"
          ? override?.note || "Under maintenance"
          : status === "crashed"
          ? override?.note || "Temporarily unavailable due to incident"
          : status === "unavailable"
          ? override?.note || "Currently unavailable"
          : "Available now";

      const effectivePrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
      if (maxPrice > 0 && effectivePrice > maxPrice) return null;

      return {
        id: vehicle.id,
        title: vehicle.title,
        city: vehicle.city.name,
        type: vehicle.type as Vehicle["type"],
        fuel: vehicle.fuel as Vehicle["fuel"],
        transmission: vehicle.transmission as Vehicle["transmission"],
        seats: vehicle.seats,
        pricePerDayINR: effectivePrice,
        availableDates: dates,
        availabilitySlots: dates.map((date) => ({ date, slots })),
        vendorId: vehicle.vendorId ?? undefined,
        airportPickup: vehicle.airportPickup,
        availabilityStatus: status,
        availabilityMessage: statusMessage,
        bookedUntil: bookedUntilMap.get(vehicle.id),
        adminNote: override?.note,
        imageUrls: imageMap.get(vehicle.id) ?? [],
        vehicleNumber: vehicleNumberMap.get(vehicle.id),
      };
    }).filter((item) => item !== null) as Vehicle[];

    const cityOptions = Array.from(
      new Set([
        ...dbCities.map((city) => city.name),
        ...dbVehicles.map((vehicle) => vehicle.city.name),
      ])
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json(
      { vehicles: mappedVehicles, cities: cityOptions },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const bookedUntilMap = new Map<string, string>();
  const todayIso = new Date().toISOString().slice(0, 10);
  for (const entry of bookingsStore.filter((item) => item.status === "confirmed" && item.endDate >= todayIso)) {
    const existing = bookedUntilMap.get(entry.vehicleId);
    if (!existing || entry.endDate > existing) bookedUntilMap.set(entry.vehicleId, entry.endDate);
  }

  const filtered = vehicles.filter((vehicle) => {
    const hasActiveBooking = bookingsStore.some(
      (entry) => entry.vehicleId === vehicle.id && entry.status === "confirmed" && entry.endDate >= todayIso,
    );
    const override = adminVehicleStatusStore[vehicle.id];
    const availability = resolveVehicleAvailability({
      vehicleId: vehicle.id,
      hasActiveBooking,
      override,
    });

    if (city && vehicle.city.toLowerCase() !== city.toLowerCase()) return false;
    if (type && vehicle.type !== type) return false;
    if (fuel && vehicle.fuel !== fuel) return false;
    if (transmission && vehicle.transmission !== transmission) return false;
    const effectivePrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
    if (maxPrice > 0 && effectivePrice > maxPrice) return false;
    if (query && !vehicle.title.toLowerCase().includes(query.toLowerCase())) return false;

    if (startDate && endDate) {
      const requested = [startDate, endDate];
      const hasAvailability = requested.every((d) => vehicle.availableDates.includes(d));
      if (!hasAvailability) return false;
    }

    if (startDate && startTime && endTime) {
      const requestedSlots = buildHourlyRange(startTime, endTime);
      if (requestedSlots.length === 0) return false;
      const dayAvailability = vehicle.availabilitySlots?.find((slot) => slot.date === startDate);
      if (!dayAvailability) return false;
      const hasSlots = requestedSlots.every((slot) => dayAvailability.slots.includes(slot));
      if (!hasSlots) return false;
    }

    return true;
  }).map((vehicle) => {
    const hasActiveBooking = bookingsStore.some(
      (entry) => entry.vehicleId === vehicle.id && entry.status === "confirmed" && entry.endDate >= todayIso,
    );
    const override = adminVehicleStatusStore[vehicle.id];
    const availability = resolveVehicleAvailability({
      vehicleId: vehicle.id,
      hasActiveBooking,
      override,
    });

    const availabilityMessage =
      availability === "booked"
        ? `Booked until ${bookedUntilMap.get(vehicle.id) ?? "upcoming date"}`
        : availability === "maintenance"
        ? override?.note || "Under maintenance"
        : availability === "crashed"
        ? override?.note || "Temporarily unavailable due to incident"
        : availability === "unavailable"
        ? override?.note || "Currently unavailable"
        : "Available now";

    return {
      ...vehicle,
      pricePerDayINR: getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR),
      availabilityStatus: availability,
      availabilityMessage,
      bookedUntil: bookedUntilMap.get(vehicle.id),
      adminNote: override?.note,
    };
  });

  const cityOptions = Array.from(
    new Set([
      ...vehicles.map((vehicle) => vehicle.city),
    ])
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json(
    { vehicles: filtered, cities: cityOptions },
    { headers: { "Cache-Control": "no-store" } },
  );
}