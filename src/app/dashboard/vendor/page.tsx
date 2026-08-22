import { getServerSessionUser } from "@/lib/server-session";
import { getVendorHistory } from "@/lib/dashboard-history";
import { getVendorFleet, resolveVendorContext } from "@/lib/vendor-fleet";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { VendorDashboardLayout } from "@/components/vendor-dashboard-layout";

export const revalidate = 120; // Cache dashboard for 2 minutes

// Cache vendor financials to avoid repeated expensive database queries
const getCachedVendorFinancials = unstable_cache(
  async (ownerUserId: string, commissionRate: number) => {
    if (!process.env.DATABASE_URL) {
      return {
        totalBookings: 0,
        revenueThisMonthINR: 0,
        totalRevenueINR: 0,
        earningsThisMonthINR: 0,
        totalEarningsINR: 0,
      };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalBookings, monthRevenueAgg, totalRevenueAgg] = await Promise.all([
      prisma.booking.count({
        where: {
          vehicle: {
            vendor: {
              ownerUserId,
            },
          },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amountINR: true },
        where: {
          status: "PAID",
          createdAt: {
            gte: monthStart,
          },
          booking: {
            vehicle: {
              vendor: {
                ownerUserId,
              },
            },
          },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amountINR: true },
        where: {
          status: "PAID",
          booking: {
            vehicle: {
              vendor: {
                ownerUserId,
              },
            },
          },
        },
      }),
    ]);

    const revenueThisMonthINR = monthRevenueAgg._sum.amountINR ?? 0;
    const totalRevenueINR = totalRevenueAgg._sum.amountINR ?? 0;
    const payoutMultiplier = Math.max(0, 1 - commissionRate / 100);

    return {
      totalBookings,
      revenueThisMonthINR,
      totalRevenueINR,
      earningsThisMonthINR: Math.round(revenueThisMonthINR * payoutMultiplier),
      totalEarningsINR: Math.round(totalRevenueINR * payoutMultiplier),
    };
  },
  ["vendor-financials", "ownerUserId", "commissionRate"],
  { revalidate: 90, tags: ["financials"] }
);

const getCachedVendorBookings = unstable_cache(
  async (vendorId: string) => {
    if (!process.env.DATABASE_URL) return [];
    const rawBookings = await prisma.booking.findMany({
      where: {
        vehicle: {
          vendorId,
        },
      },
      include: {
        vehicle: {
          include: {
            city: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return rawBookings.map((item) => ({
      ...item,
      vehicle: {
        ...item.vehicle,
        city: item.vehicle.city.name,
        type: item.vehicle.type as any,
        fuel: item.vehicle.fuel as any,
        transmission: item.vehicle.transmission as any,
        availableDates: [],
      },
    })) as any[];
  },
  ["vendor-bookings-cache", "vendorId"],
  { revalidate: 60, tags: ["bookings"] }
);

export default async function VendorDashboardPage() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.role !== "VENDOR") {
    redirect("/dashboard/customer");
  }

  const vendor = await resolveVendorContext(sessionUser);
  if (!vendor) {
    redirect("/dashboard/customer"); // Fallback if vendor account is not setup
  }

  const commissionRate = Number(vendor.commissionRate ?? 0);

  // Parallelize ALL database queries to execute concurrently and eliminate any sequential waterfalls
  const [dbUser, history, fleetResult, financials, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { name: true },
    }),
    getVendorHistory(sessionUser.id),
    getVendorFleet(sessionUser),
    getCachedVendorFinancials(sessionUser.id, commissionRate),
    getCachedVendorBookings(vendor.id),
  ]);

  const { vehicles: fleetVehicles } = fleetResult;

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const mobileDashboardUrl = `${protocol}://${host}/dashboard/mobile-hub`;

  return (
    <VendorDashboardLayout
      user={{
        id: sessionUser.id,
        email: sessionUser.email,
        name: dbUser?.name,
      }}
      vendor={{
        id: vendor.id,
        businessName: vendor.businessName,
        status: vendor.status,
        blacklistReason: vendor.blacklistReason,
        commissionRate,
        appealText: vendor.appealText,
        blockCount: vendor.blockCount,
      }}
      financials={financials}
      fleetVehicles={fleetVehicles}
      bookings={bookings}
      history={history}
      mobileDashboardUrl={mobileDashboardUrl}
    />
  );
}
