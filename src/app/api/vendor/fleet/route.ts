import { getServerSessionUser } from "@/lib/server-session";
import { getVendorFleet, resolveVendorContext } from "@/lib/vendor-fleet";
import { setAvailabilityDatesForVehicle } from "@/lib/vendor-fleet-availability";
import { setImageUrlsForVehicle } from "@/lib/vendor-fleet-media";
import { setVehicleNumberForVehicle } from "@/lib/vendor-fleet-vehicle-number";
import { vehicles } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type { Vehicle } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createVendorVehicleSchema = z.object({
  title: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  type: z.enum(["bike", "car", "scooty"]),
  seats: z.number().int().min(1).max(12),
  pricePerDayINR: z.number().int().positive(),
  vehicleNumber: z.string().min(4).max(30).optional(),
  imageUrl: z.string().url(),
});

function defaultDates() {
  return Array.from({ length: 8 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() + idx + 1);
    return date.toISOString().slice(0, 10);
  });
}

export async function GET() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fleet = await getVendorFleet(user);
  if (fleet.vendor?.status === "blacklisted") {
    return NextResponse.json({ error: `Vendor account is blacklisted: ${fleet.vendor.blacklistReason ?? "Violation of privacy policy"}` }, { status: 403 });
  }
  return NextResponse.json(fleet);
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createVendorVehicleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const vendor = await resolveVendorContext(user);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor account not configured" }, { status: 404 });
  }
  if (vendor.status === "blacklisted") {
    return NextResponse.json({ error: `Vendor account is blacklisted: ${vendor.blacklistReason ?? "Violation of privacy policy"}` }, { status: 403 });
  }

  const payload = parsed.data;

  if (process.env.DATABASE_URL) {
    let city = await prisma.city.findFirst({
      where: { name: { equals: payload.city.trim(), mode: "insensitive" } },
      select: { id: true, name: true },
    });

    if (!city) {
      city = await prisma.city.create({
        data: { name: payload.city.trim(), isActive: true },
        select: { id: true, name: true },
      });
    }

    const created = await prisma.vehicle.create({
      data: {
        title: payload.title.trim(),
        type: payload.type,
        fuel: payload.type === "car" ? "petrol" : "petrol",
        transmission: payload.type === "car" ? "automatic" : "manual",
        seats: payload.seats,
        pricePerDayINR: payload.pricePerDayINR,
        airportPickup: true,
        vendorId: vendor.id,
        cityId: city.id,
      },
      include: { city: true },
    });

    const dates = defaultDates();
    const imageUrls = await setImageUrlsForVehicle(created.id, [payload.imageUrl]);
    await setVehicleNumberForVehicle(created.id, payload.vehicleNumber);
    await setAvailabilityDatesForVehicle(created.id, dates);

    return NextResponse.json(
      {
        message: "Vehicle created",
        vehicle: {
          id: created.id,
          title: created.title,
          city: created.city.name,
          type: created.type,
          fuel: created.fuel,
          transmission: created.transmission,
          seats: created.seats,
          pricePerDayINR: created.pricePerDayINR,
          availableDates: dates,
          vendorId: created.vendorId ?? undefined,
          vehicleNumber: payload.vehicleNumber?.trim() || undefined,
          airportPickup: created.airportPickup,
          imageUrls,
        },
      },
      { status: 201 }
    );
  }

  const vehicleId = `veh-local-${Date.now()}`;
  const dates = defaultDates();
  const created: Vehicle = {
    id: vehicleId,
    title: payload.title.trim(),
    city: payload.city.trim(),
    type: payload.type,
    fuel: payload.type === "car" ? "petrol" : "petrol",
    transmission: payload.type === "car" ? "automatic" : "manual",
    seats: payload.seats,
    pricePerDayINR: payload.pricePerDayINR,
    availableDates: dates,
    vendorId: vendor.id,
    vehicleNumber: payload.vehicleNumber?.trim() || undefined,
    airportPickup: true,
    imageUrls: [payload.imageUrl],
  };

  vehicles.unshift(created);
  await setImageUrlsForVehicle(created.id, [payload.imageUrl]);
  await setVehicleNumberForVehicle(created.id, payload.vehicleNumber);
  await setAvailabilityDatesForVehicle(created.id, dates);

  return NextResponse.json({ message: "Vehicle created", vehicle: created }, { status: 201 });
}