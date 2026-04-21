import { vehicles, vendors } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { Vehicle } from "@/lib/types";
import { getAvailabilityMapForVehicles } from "@/lib/vendor-fleet-availability";
import { getImageMapForVehicles } from "@/lib/vendor-fleet-media";
import { getVehicleNumberMap } from "@/lib/vendor-fleet-vehicle-number";
import { getVendorModerationDetails, type VendorModerationStatus } from "@/lib/vendor-moderation";

type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export type VendorContext = {
  id: string;
  businessName: string;
  commissionRate: number;
  status: VendorModerationStatus;
  blacklistReason?: string;
};

function buildDefaultDates(days = 8) {
  return Array.from({ length: days }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() + idx + 1);
    return date.toISOString().slice(0, 10);
  });
}

export async function resolveVendorContext(user: SessionUser): Promise<VendorContext | null> {
  if (process.env.DATABASE_URL) {
    const byOwnerId = await prisma.vendor.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, businessName: true, commissionRate: true },
    });

    const byOwnerEmail =
      byOwnerId ||
      (await prisma.vendor.findFirst({
        where: {
          ownerUser: {
            email: user.email,
          },
        },
        select: { id: true, businessName: true, commissionRate: true },
      }));

    if (!byOwnerEmail) {
      return null;
    }

    const moderation = await getVendorModerationDetails(byOwnerEmail.id, "approved");

    return {
      id: byOwnerEmail.id,
      businessName: byOwnerEmail.businessName,
      commissionRate: Number(byOwnerEmail.commissionRate),
      status: moderation.status,
      blacklistReason: moderation.reason,
    };
  }

  const fallback = vendors.find((vendor) => vendor.id === "v1") ?? vendors[0];
  if (!fallback) return null;

  const moderation = await getVendorModerationDetails(fallback.id, fallback.status);

  return {
    id: fallback.id,
    businessName: fallback.businessName,
    commissionRate: fallback.commissionRate,
    status: moderation.status,
    blacklistReason: moderation.reason,
  };
}

export async function getVendorFleet(user: SessionUser) {
  const vendor = await resolveVendorContext(user);
  if (!vendor) {
    return { vendor: null, vehicles: [] as Vehicle[] };
  }

  if (process.env.DATABASE_URL) {
    const dbVehicles = await prisma.vehicle.findMany({
      where: { vendorId: vendor.id },
      include: { city: true },
      orderBy: { createdAt: "desc" },
    });

    const availabilityMap = await getAvailabilityMapForVehicles(dbVehicles.map((item) => item.id));
    const imageMap = await getImageMapForVehicles(dbVehicles.map((item) => item.id));
    const vehicleNumberMap = await getVehicleNumberMap(dbVehicles.map((item) => item.id));

    return {
      vendor,
      vehicles: dbVehicles.map((item) => ({
        id: item.id,
        title: item.title,
        city: item.city.name,
        type: item.type as Vehicle["type"],
        fuel: item.fuel as Vehicle["fuel"],
        transmission: item.transmission as Vehicle["transmission"],
        seats: item.seats,
        pricePerDayINR: item.pricePerDayINR,
        availableDates: availabilityMap.get(item.id)?.length ? availabilityMap.get(item.id)! : buildDefaultDates(),
        vendorId: item.vendorId ?? undefined,
        vehicleNumber: vehicleNumberMap.get(item.id),
        airportPickup: item.airportPickup,
        imageUrls: imageMap.get(item.id) ?? [],
      })),
    };
  }

  return {
    vendor,
    vehicles: vehicles.filter((item) => item.vendorId === vendor.id),
  };
}