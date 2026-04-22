import { SiteHeader } from "@/components/site-header";
import { getVendorHistory } from "@/lib/dashboard-history";
import { getServerSessionUser } from "@/lib/server-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VendorFleetManager } from "@/components/vendor-fleet-manager";
import { VendorProfileDocumentsPanel } from "@/components/vendor-profile-documents-panel";
import { getVendorFleet } from "@/lib/vendor-fleet";

async function getVendorFinancials(ownerUserId: string, commissionRate: number) {
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
}

export default async function VendorDashboardPage() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    redirect("/dashboard/customer");
  }
  const history = user ? await getVendorHistory(user.id) : [];
  const { vendor, vehicles: fleetVehicles } = await getVendorFleet(user);
  const vendorId = vendor?.id ?? "";
  const isBlacklisted = vendor?.status === "blacklisted";
  const commissionRate = Number(vendor?.commissionRate ?? 0);
  const financials = await getVendorFinancials(user.id, commissionRate);

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" showDashboardLink={true} dashboardHref="/dashboard/vendor" />
      <main className="mx-auto max-w-5xl p-6 md:p-10 space-y-6">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-black/60">Vendor Dashboard</p>
              <h1 className="mt-1 text-2xl font-semibold">Vendor Operations</h1>
              <p className="mt-2 text-sm text-black/70">Signed in as {user?.email} · {vendor?.businessName}</p>
              {isBlacklisted ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  You are blacklisted due to this reason: {vendor?.blacklistReason ?? "Violation of privacy policy"}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/vendor/deliveries" className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isBlacklisted ? "pointer-events-none border-black/10 text-black/40" : "border-black/15 hover:bg-black/[0.02]"}`}>
                Deliveries
              </Link>
              <Link href="/dashboard/vendor/support-tickets" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isBlacklisted ? "pointer-events-none border border-black/10 bg-black/5 text-black/40" : "bg-[var(--brand-red)] text-white hover:-translate-y-0.5"}`}>
                Support Tickets
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatCard label="Total Vehicles" value={fleetVehicles.length.toString()} />
            <StatCard label="Commission Rate" value={`${commissionRate}%`} />
            <StatCard label="Total Earnings" value={formatCurrency(financials.totalEarningsINR)} />
            <StatCard label="Status" value={isBlacklisted ? "Blacklisted" : vendor?.status === "approved" ? "Verified & Active" : (vendor?.status ?? "Unknown")} />
          </div>
        </section>

        {isBlacklisted ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-800">Vendor Features Disabled</h2>
            <p className="mt-2 text-sm text-red-700">
              Your account is blacklisted due to this reason: {vendor?.blacklistReason ?? "Violation of privacy policy"}. Contact platform admin for reactivation.
            </p>
          </section>
        ) : (
          <>
            <VendorProfileDocumentsPanel />
            <VendorFleetManager initialFleetVehicles={fleetVehicles} vendorId={vendorId} />
          </>
        )}

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Earnings & Payouts</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-black/10 bg-black/[0.03] p-4">
              <p className="text-xs text-black/60">Total Bookings</p>
              <p className="mt-2 text-2xl font-bold">{financials.totalBookings}</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-black/[0.03] p-4">
              <p className="text-xs text-black/60">Revenue (This Month)</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(financials.revenueThisMonthINR)}</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-black/[0.03] p-4">
              <p className="text-xs text-black/60">Your Earnings</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(financials.earningsThisMonthINR)}</p>
              <p className="mt-1 text-xs text-black/60">After {commissionRate}% commission</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Vendor Payment Timeline</h2>
          {history.length === 0 ? (
            <p className="text-sm text-black/60">No vendor-side payment events yet.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-lg border border-black/10 p-3 text-sm">
                <p className="font-medium">{item.provider.toUpperCase()} · {item.status}</p>
                <p>Booking: {item.bookingId} · City: {item.cityName}</p>
                <p>Amount: ₹{item.amountINR} {item.currency}</p>
                {item.customerEmail && <p>Customer: {item.customerEmail}</p>}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.03] p-4">
      <p className="text-xs text-black/60">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
