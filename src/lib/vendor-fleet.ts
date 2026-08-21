import { vehicles, vendors } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { Vehicle } from "@/lib/types";
import { getAvailabilityMapForVehicles } from "@/lib/vendor-fleet-availability";
import { getImageMapForVehicles } from "@/lib/vendor-fleet-media";
import { getVehicleNumberMap } from "@/lib/vendor-fleet-vehicle-number";
import { getVendorModerationDetails, type VendorModerationStatus } from "@/lib/vendor-moderation";
import { unstable_cache } from "next/cache";

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
  blockCount: number;
  appealText?: string;
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
      // Auto-create clean vendor record for new vendor user
      try {
        const newVendor = await prisma.vendor.create({
          data: {
            businessName: `${user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").toUpperCase()} FLEET`,
            contactPhone: "+91-9000000000",
            commissionRate: 15,
            ownerUserId: user.id,
          },
        });
        return {
          id: newVendor.id,
          businessName: newVendor.businessName,
          commissionRate: Number(newVendor.commissionRate),
          status: "approved",
          blockCount: 0,
        };
      } catch (e) {
        console.error("[Auto-create vendor record failed]", e);
        return null;
      }
    }

    const moderation = await getVendorModerationDetails(byOwnerEmail.id, "approved");

    return {
      id: byOwnerEmail.id,
      businessName: byOwnerEmail.businessName,
      commissionRate: Number(byOwnerEmail.commissionRate),
      status: moderation.status,
      blacklistReason: moderation.reason,
      blockCount: moderation.blockCount,
      appealText: moderation.appealText,
    };
  }

  const foundByEmail = vendors.find((v) => v.adminEmail?.toLowerCase() === user.email.toLowerCase());
  if (foundByEmail) {
    const moderation = await getVendorModerationDetails(foundByEmail.id, foundByEmail.status);
    return {
      id: foundByEmail.id,
      businessName: foundByEmail.businessName,
      commissionRate: foundByEmail.commissionRate,
      status: moderation.status,
      blacklistReason: moderation.reason,
      blockCount: moderation.blockCount,
      appealText: moderation.appealText,
    };
  }

  // Fresh clean vendor context for new vendor users
  return {
    id: `vendor_${user.id.replace(/[^a-zA-Z0-9]/g, "")}`,
    businessName: `${user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").toUpperCase()} FLEET`,
    commissionRate: 15,
    status: "approved",
    blockCount: 0,
  };
}

const getCachedVendorFleet = unstable_cache(
  async (userId: string, userEmail: string, userRole: string) => {
    const user: SessionUser = { id: userId, email: userEmail, role: userRole };
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
          addonWaiverPrice: item.addonWaiverPrice,
          addonRsaPrice: item.addonRsaPrice,
          addonHelmetPrice: item.addonHelmetPrice,
          price1HrINR: item.price1HrINR,
          price3HrINR: item.price3HrINR,
          price6HrINR: item.price6HrINR,
          price12HrINR: item.price12HrINR,
          imageUrls: imageMap.get(item.id) ?? [],
        })),
      };
    }

    return {
      vendor,
      vehicles: vehicles.filter((item) => item.vendorId === vendor.id),
    };
  },
  ["vendor-fleet-cache"],
  { revalidate: 60, tags: ["fleet"] }
);

export async function getVendorFleet(user: SessionUser) {
  return getCachedVendorFleet(user.id, user.email, user.role);
}