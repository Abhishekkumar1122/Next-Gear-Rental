import { SiteHeader } from "@/components/site-header";
import { getServerSessionUser } from "@/lib/server-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CustomerDashboardClient } from "@/components/customer-dashboard-client";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

async function fetchUserBookingsDirect(userId: string, email: string) {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { userId: userId },
        { user: { email: { equals: email, mode: "insensitive" } } },
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
}

export default async function CustomerDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fcustomer");

  const [dbUser, bookings] = await Promise.all([
    process.env.DATABASE_URL
      ? prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true },
        })
      : Promise.resolve(null),
    fetchUserBookingsDirect(user.id, user.email),
  ]);

  return (
    <CustomerDashboardClient 
      userId={user.id}
      email={user.email} 
      name={dbUser?.name || user.email.split("@")[0]} 
      initialBookings={bookings}
    />
  );
}
