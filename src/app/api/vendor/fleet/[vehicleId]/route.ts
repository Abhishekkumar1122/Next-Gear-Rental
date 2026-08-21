import { getServerSessionUser } from "@/lib/server-session";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { clearAvailabilityForVehicle, getAvailabilityMapForVehicles, setAvailabilityDatesForVehicle } from "@/lib/vendor-fleet-availability";
import { clearMediaForVehicle, getImageMapForVehicles, setImageUrlsForVehicle } from "@/lib/vendor-fleet-media";
import { clearVehicleNumberForVehicle, getVehicleNumberMap, setVehicleNumberForVehicle } from "@/lib/vendor-fleet-vehicle-number";
import { processWaitlistForVehicleRelease } from "@/lib/waitlist";
import { vehicles } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateVendorVehicleSchema = z
  .object({
    pricePerDayINR: z.number().int().positive().optional(),
    availableDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    vehicleNumber: z.union([z.string().min(4).max(30), z.literal("")]).optional(),
    imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
    addonWaiverPrice: z.number().int().nonnegative().nullable().optional(),
    addonRsaPrice: z.number().int().nonnegative().nullable().optional(),
    addonHelmetPrice: z.number().int().nonnegative().nullable().optional(),
    price1HrINR: z.number().int().nonnegative().nullable().optional(),
    price3HrINR: z.number().int().nonnegative().nullable().optional(),
    price6HrINR: z.number().int().nonnegative().nullable().optional(),
    price12HrINR: z.number().int().nonnegative().nullable().optional(),
    operationalStatus: z.enum(["AVAILABLE", "UNAVAILABLE", "MAINTENANCE"]).optional(),
    weekendSurgeActive: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.pricePerDayINR !== undefined ||
      payload.availableDates !== undefined ||
      payload.imageUrl !== undefined ||
      payload.vehicleNumber !== undefined ||
      payload.addonWaiverPrice !== undefined ||
      payload.addonRsaPrice !== undefined ||
      payload.addonHelmetPrice !== undefined ||
      payload.price1HrINR !== undefined ||
      payload.price3HrINR !== undefined ||
      payload.price6HrINR !== undefined ||
      payload.price12HrINR !== undefined ||
      payload.operationalStatus !== undefined ||
      payload.weekendSurgeActive !== undefined,
    {
      message: "At least one field is required",
    }
  );

type Props = {
  params: Promise<{ vehicleId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendor = await resolveVendorContext(user);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor account not configured" }, { status: 404 });
  }
  if (vendor.status === "blacklisted") {
    return NextResponse.json({ error: `Vendor account is blacklisted: ${vendor.blacklistReason ?? "Violation of privacy policy"}` }, { status: 403 });
  }

  const parsed = updateVendorVehicleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { vehicleId } = await params;
  const payload = parsed.data;
  let waitlistNotified = 0;

  if (process.env.DATABASE_URL) {
    const existing = await prisma.vehicle.findFirst({
      where: { id: vehicleId, vendorId: vendor.id },
      include: { city: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (payload.pricePerDayINR !== undefined) updateData.pricePerDayINR = payload.pricePerDayINR;
    if (payload.addonWaiverPrice !== undefined) updateData.addonWaiverPrice = payload.addonWaiverPrice;
    if (payload.addonRsaPrice !== undefined) updateData.addonRsaPrice = payload.addonRsaPrice;
    if (payload.addonHelmetPrice !== undefined) updateData.addonHelmetPrice = payload.addonHelmetPrice;
    if (payload.price1HrINR !== undefined) updateData.price1HrINR = payload.price1HrINR;
    if (payload.price3HrINR !== undefined) updateData.price3HrINR = payload.price3HrINR;
    if (payload.price6HrINR !== undefined) updateData.price6HrINR = payload.price6HrINR;
    if (payload.price12HrINR !== undefined) updateData.price12HrINR = payload.price12HrINR;
    if (payload.operationalStatus !== undefined) updateData.operationalStatus = payload.operationalStatus;
    if (payload.weekendSurgeActive !== undefined) updateData.weekendSurgeActive = payload.weekendSurgeActive;

    const updated = Object.keys(updateData).length > 0
      ? await prisma.vehicle.update({
          where: { id: vehicleId },
          data: updateData,
          include: { city: true },
        })
      : existing;

    if (payload.availableDates) {
      await setAvailabilityDatesForVehicle(vehicleId, payload.availableDates);
      if (payload.availableDates.length > 0) {
        const result = await processWaitlistForVehicleRelease({
          vehicleId,
          vehicleTitle: existing.title,
        });
        waitlistNotified = result.notifiedCount;
      }
    }

    if (payload.vehicleNumber !== undefined) {
      await setVehicleNumberForVehicle(vehicleId, payload.vehicleNumber);
    }

    if (payload.imageUrl !== undefined) {
      await setImageUrlsForVehicle(vehicleId, payload.imageUrl ? [payload.imageUrl] : []);
    }

    const map = await getAvailabilityMapForVehicles([vehicleId]);
    const imageMap = await getImageMapForVehicles([vehicleId]);
    const vehicleNumberMap = await getVehicleNumberMap([vehicleId]);
    return NextResponse.json({
      message: "Vehicle updated",
      waitlistNotified,
      vehicle: {
        id: updated.id,
        title: updated.title,
        city: updated.city.name,
        type: updated.type,
        fuel: updated.fuel,
        transmission: updated.transmission,
        seats: updated.seats,
        pricePerDayINR: updated.pricePerDayINR,
        availableDates: map.get(updated.id) ?? [],
        vendorId: updated.vendorId ?? undefined,
        vehicleNumber: vehicleNumberMap.get(updated.id),
        airportPickup: updated.airportPickup,
        addonWaiverPrice: updated.addonWaiverPrice,
        addonRsaPrice: updated.addonRsaPrice,
        addonHelmetPrice: updated.addonHelmetPrice,
        price1HrINR: updated.price1HrINR,
        price3HrINR: updated.price3HrINR,
        price6HrINR: updated.price6HrINR,
        price12HrINR: updated.price12HrINR,
        imageUrls: imageMap.get(updated.id) ?? [],
        operationalStatus: updated.operationalStatus,
        weekendSurgeActive: updated.weekendSurgeActive,
      },
    });
  }

  const index = vehicles.findIndex((item) => item.id === vehicleId && item.vendorId === vendor.id);
  if (index === -1) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  if (payload.pricePerDayINR !== undefined) {
    vehicles[index].pricePerDayINR = payload.pricePerDayINR;
  }
  if (payload.addonWaiverPrice !== undefined) {
    vehicles[index].addonWaiverPrice = payload.addonWaiverPrice;
  }
  if (payload.addonRsaPrice !== undefined) {
    vehicles[index].addonRsaPrice = payload.addonRsaPrice;
  }
  if (payload.addonHelmetPrice !== undefined) {
    vehicles[index].addonHelmetPrice = payload.addonHelmetPrice;
  }
  if (payload.price1HrINR !== undefined) {
    vehicles[index].price1HrINR = payload.price1HrINR;
  }
  if (payload.price3HrINR !== undefined) {
    vehicles[index].price3HrINR = payload.price3HrINR;
  }
  if (payload.price6HrINR !== undefined) {
    vehicles[index].price6HrINR = payload.price6HrINR;
  }
  if (payload.price12HrINR !== undefined) {
    vehicles[index].price12HrINR = payload.price12HrINR;
  }
  if (payload.operationalStatus !== undefined) {
    vehicles[index].operationalStatus = payload.operationalStatus;
  }
  if (payload.weekendSurgeActive !== undefined) {
    vehicles[index].weekendSurgeActive = payload.weekendSurgeActive;
  }

  if (payload.availableDates) {
    const normalized = await setAvailabilityDatesForVehicle(vehicleId, payload.availableDates);
    vehicles[index].availableDates = normalized;
    if (normalized.length > 0) {
      const result = await processWaitlistForVehicleRelease({
        vehicleId,
        vehicleTitle: vehicles[index].title,
      });
      waitlistNotified = result.notifiedCount;
    }
  }

  if (payload.vehicleNumber !== undefined) {
    await setVehicleNumberForVehicle(vehicleId, payload.vehicleNumber);
    vehicles[index].vehicleNumber = payload.vehicleNumber?.trim() || undefined;
  }

  if (payload.imageUrl !== undefined) {
    const media = await setImageUrlsForVehicle(vehicleId, payload.imageUrl ? [payload.imageUrl] : []);
    vehicles[index].imageUrls = media;
  }

  return NextResponse.json({ message: "Vehicle updated", waitlistNotified, vehicle: vehicles[index] });
}

export async function DELETE(_: Request, { params }: Props) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendor = await resolveVendorContext(user);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor account not configured" }, { status: 404 });
  }
  if (vendor.status === "blacklisted") {
    return NextResponse.json({ error: `Vendor account is blacklisted: ${vendor.blacklistReason ?? "Violation of privacy policy"}` }, { status: 403 });
  }

  const { vehicleId } = await params;

  if (process.env.DATABASE_URL) {
    const existing = await prisma.vehicle.findFirst({ where: { id: vehicleId, vendorId: vendor.id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const linkedBookings = await prisma.booking.count({ where: { vehicleId } });
    if (linkedBookings > 0) {
      return NextResponse.json({ error: "Cannot delete vehicle with existing bookings" }, { status: 409 });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });
    await clearAvailabilityForVehicle(vehicleId);
    await clearMediaForVehicle(vehicleId);
    await clearVehicleNumberForVehicle(vehicleId);
    return NextResponse.json({ message: "Vehicle deleted", vehicleId });
  }

  const hasActiveBooking = bookingsStore.some((item) => item.vehicleId === vehicleId && item.status === "confirmed");
  if (hasActiveBooking) {
    return NextResponse.json({ error: "Cannot delete vehicle with active booking" }, { status: 409 });
  }

  const index = vehicles.findIndex((item) => item.id === vehicleId && item.vendorId === vendor.id);
  if (index === -1) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  vehicles.splice(index, 1);
  await clearAvailabilityForVehicle(vehicleId);
  await clearMediaForVehicle(vehicleId);
  await clearVehicleNumberForVehicle(vehicleId);
  return NextResponse.json({ message: "Vehicle deleted", vehicleId });
}