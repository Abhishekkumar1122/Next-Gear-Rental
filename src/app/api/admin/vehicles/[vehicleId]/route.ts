import { assertAdminMutationRequest } from "@/lib/admin-security";
import { vehicles } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { clearVehicleNumberForVehicle, setVehicleNumberForVehicle } from "@/lib/vendor-fleet-vehicle-number";
import { clearMediaForVehicle, setImageUrlsForVehicle } from "@/lib/vendor-fleet-media";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateVehicleSchema = z.object({
  title: z.string().min(2).max(120),
  type: z.enum(["bike", "car", "scooty"]),
  fuel: z.enum(["petrol", "diesel", "electric"]),
  transmission: z.enum(["manual", "automatic"]),
  seats: z.number().int().min(1).max(12),
  pricePerDayINR: z.number().int().positive(),
  vehicleNumber: z.string().min(4).max(30).optional(),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  airportPickup: z.boolean().default(false),
  cityId: z.string().optional(),
  cityName: z.string().optional(),
  vendorId: z.string().optional(),
});

type Props = {
  params: Promise<{ vehicleId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { vehicleId } = await params;
  const parsed = updateVehicleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vehicle payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (process.env.DATABASE_URL) {
    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

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

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
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
      select: { id: true, title: true },
    });

    await setVehicleNumberForVehicle(vehicleId, payload.vehicleNumber);
    if (payload.imageUrl !== undefined) {
      await setImageUrlsForVehicle(vehicleId, payload.imageUrl ? [payload.imageUrl] : []);
    }

    return NextResponse.json({
      message: "Vehicle updated",
      vehicle: {
        ...updated,
        vehicleNumber: payload.vehicleNumber?.trim() || undefined,
        imageUrl: payload.imageUrl || undefined,
      },
    });
  }

  const index = vehicles.findIndex((item) => item.id === vehicleId);
  if (index === -1) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const city = payload.cityName?.trim();
  if (!city) {
    return NextResponse.json({ error: "cityName is required in mock mode" }, { status: 400 });
  }

  vehicles[index] = {
    ...vehicles[index],
    title: payload.title.trim(),
    type: payload.type,
    fuel: payload.fuel,
    transmission: payload.transmission,
    seats: payload.seats,
    pricePerDayINR: payload.pricePerDayINR,
    vehicleNumber: payload.vehicleNumber?.trim() || undefined,
    airportPickup: payload.airportPickup,
    city,
    vendorId: payload.vendorId || undefined,
  };

  await setVehicleNumberForVehicle(vehicleId, payload.vehicleNumber);
  if (payload.imageUrl !== undefined) {
    const imageUrls = payload.imageUrl ? [payload.imageUrl] : [];
    await setImageUrlsForVehicle(vehicleId, imageUrls);
    vehicles[index].imageUrls = imageUrls;
  }

  return NextResponse.json({
    message: "Vehicle updated",
    vehicle: {
      id: vehicleId,
      title: payload.title.trim(),
      vehicleNumber: payload.vehicleNumber?.trim() || undefined,
      imageUrl: payload.imageUrl || undefined,
    },
  });
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { vehicleId } = await params;

  if (process.env.DATABASE_URL) {
    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const linkedBookings = await prisma.booking.count({ where: { vehicleId } });
    if (linkedBookings > 0) {
      return NextResponse.json({ error: "Cannot delete vehicle with existing bookings" }, { status: 409 });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });
    await clearVehicleNumberForVehicle(vehicleId);
    await clearMediaForVehicle(vehicleId);
    return NextResponse.json({ message: "Vehicle deleted", vehicleId });
  }

  const activeBooking = bookingsStore.some((item) => item.vehicleId === vehicleId && item.status === "confirmed");
  if (activeBooking) {
    return NextResponse.json({ error: "Cannot delete vehicle with active booking" }, { status: 409 });
  }

  const index = vehicles.findIndex((item) => item.id === vehicleId);
  if (index === -1) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  vehicles.splice(index, 1);
  await clearVehicleNumberForVehicle(vehicleId);
  await clearMediaForVehicle(vehicleId);
  return NextResponse.json({ message: "Vehicle deleted", vehicleId });
}
