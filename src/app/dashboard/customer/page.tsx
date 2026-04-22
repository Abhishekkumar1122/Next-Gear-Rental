import { SiteHeader } from "@/components/site-header";
import { getServerSessionUser } from "@/lib/server-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CustomerDashboardClient } from "@/components/customer-dashboard-client";
import { unstable_cache } from "next/cache";

export const revalidate = 120; // Cache dashboard for 2 minutes

// Fetch bookings server-side to avoid client-side loading states
const getCustomerBookings = unstable_cache(
  async (userId: string) => {
    if (!process.env.DATABASE_URL) {
      return [];
    }
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { user: true, vehicle: true },
      orderBy: { createdAt: "desc" },
    });
    return bookings.map(b => ({
      id: b.id,
      vehicleId: b.vehicleId,
      userName: b.user.name || b.user.email,
      userEmail: b.user.email,
      city: b.cityName,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      totalAmountINR: b.totalAmountINR,
      currency: b.currency,
      status: b.status.toLowerCase() as "confirmed" | "cancelled" | "completed",
      createdAt: b.createdAt.toISOString(),
    }));
  },
  ["customer-bookings"],
  { revalidate: 60, tags: ["bookings"] }
);

export default async function CustomerDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fcustomer");

  // Fetch initial data on server to avoid client-side loading states
  const bookings = await getCustomerBookings(user.id);

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" />
      <main className="mx-auto max-w-5xl p-6 md:p-10">
        <CustomerDashboardClient 
          email={user.email} 
          name={user.email.split("@")[0]} 
          initialBookings={bookings}
        />
      </main>
    </div>
  );
}
