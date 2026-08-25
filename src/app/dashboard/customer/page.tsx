import { SiteHeader } from "@/components/site-header";
import { getServerSessionUser } from "@/lib/server-session";
import { prisma } from "@/lib/prisma";
import { getUserModerationDetails } from "@/lib/user-moderation";
import { redirect } from "next/navigation";
import { CustomerDashboardClient } from "@/components/customer-dashboard-client";

export const dynamic = "force-dynamic";

async function fetchUserBookingsDirect(userId: string, email: string, phone?: string) {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  try {
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";
    const searchEmail = email && !email.endsWith("@guest.next-gear.app") ? email : null;

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(searchEmail ? [{ user: { email: { equals: searchEmail, mode: "insensitive" as const } } }] : []),
          ...(cleanPhone
            ? [
                { user: { phone: cleanPhone } },
                { user: { email: { equals: `${cleanPhone}@guest.next-gear.app`, mode: "insensitive" as const } } },
              ]
            : []),
        ],
      },
      include: {
        user: true,
        vehicle: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((b) => ({
      id: b.id,
      vehicleId: b.vehicleId,
      vehicleTitle: b.vehicle?.title || "Vehicle",
      vehicleFuel: b.vehicle?.fuel || "petrol",
      userName: b.user.name || b.user.email,
      userEmail: b.user.email,
      city: b.cityName,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      totalAmountINR: b.totalAmountINR,
      currency: b.currency,
      status: b.status.toLowerCase() as "confirmed" | "cancelled" | "completed",
      createdAt: b.createdAt.toISOString(),
      vendorName: b.vehicle?.vendor?.businessName || null,
      vendorPhone: b.vehicle?.vendor?.contactPhone || null,
    }));
  } catch {
    // Database momentarily unreachable, gracefully fallback to mock/empty bookings
    return [];
  }
}

export default async function CustomerDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fcustomer");

  let dbUser = null;
  try {
    if (process.env.DATABASE_URL) {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });
    }
  } catch {
    // Graceful fallback
  }

  const [bookings, moderation] = await Promise.all([
    fetchUserBookingsDirect(user.id, user.email, user.phone),
    getUserModerationDetails(user.id, "approved").catch(() => ({ status: "approved", reason: null, customMessage: null })),
  ]);

  return (
    <CustomerDashboardClient 
      userId={user.id}
      email={user.email}
      phone={user.phone}
      name={dbUser?.name || user.phone || user.email.split("@")[0]} 
      initialBookings={bookings}
      isBlocked={moderation.status === "blacklisted"}
      blockReason={moderation.reason}
      blockCustomMessage={moderation.customMessage}
    />
  );
}
