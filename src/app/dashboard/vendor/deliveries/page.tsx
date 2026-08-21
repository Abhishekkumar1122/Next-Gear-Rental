import { getDeliveryJobs, getDrivers } from "@/lib/delivery-data";
import { getServerSessionUser } from "@/lib/server-session";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VendorDeliveriesHub } from "@/components/vendor-deliveries-hub";
import NotificationBell from "@/components/notification-bell";

export default async function VendorDeliveriesPage() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    redirect("/dashboard/customer");
  }

  const vendor = await resolveVendorContext(user);
  if (!vendor || vendor.status === "blacklisted") {
    redirect("/dashboard/customer?blocked=vendor");
  }

  const jobs = await getDeliveryJobs({ limit: 30 });
  const drivers = await getDrivers();

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white pb-28 md:pb-10 selection:bg-[var(--brand-red)]/30 selection:text-white relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-[var(--brand-red)]/[0.08] blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" aria-hidden="true" />

      {/* Premium Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-white/10 bg-[var(--brand-ink)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-4 md:px-6 relative">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-3 flex-shrink-0 transition-all duration-300 hover:scale-105" aria-label="Next Gear Rentals">
              <img
                src="/Logo1.png"
                alt="Next Gear logo"
                className="h-10 w-10 object-contain transition-all duration-300 group-hover:scale-105 filter brightness-110"
              />
              <span className="flex flex-col leading-tight hidden sm:flex text-left">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Since 2022
                </span>
                <span className="font-display text-sm uppercase tracking-[0.35em] text-white font-semibold">
                  Next Gear
                </span>
              </span>
            </Link>
            <span className="hidden md:inline-block text-xs font-semibold text-white/20">|</span>
            <span className="hidden md:inline-block rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-bold text-white/70">
              {vendor.businessName}
            </span>
          </div>

          {/* Mobile Center Brand Name */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden pointer-events-none flex flex-col items-center leading-none">
            <span className="font-display text-[11px] uppercase tracking-[0.15em] font-black text-white text-center max-w-[150px] truncate">
              {vendor.businessName || user.email.split("@")[0] || "Vendor Partner"}
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em] mt-1 text-[var(--brand-red)] font-semibold">
              Vendor Partner
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} role="VENDOR" />
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-tight">{user.email.split("@")[0] || "Vendor Partner"}</p>
              <p className="text-[10px] text-white/50 font-medium leading-none mt-0.5">{user.email}</p>
            </div>
            <Link
              href="/dashboard/vendor"
              className="hidden md:inline-flex rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:scale-105 cursor-pointer"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-32 md:px-6 md:pt-28 md:pb-10 space-y-6 relative z-10">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] backdrop-blur-md p-6 shadow-2xl flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--brand-red)] font-bold">Logistics Division</p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-wide text-white">Delivery & Pickup Jobs</h1>
            <p className="mt-2 text-xs text-white/60">Monitor agent status, simulate route progress, and verify client handoffs.</p>
          </div>
          <Link href="/dashboard/vendor" className="rounded-xl border border-white/15 bg-white/5 text-white text-xs font-bold px-4 py-2.5 transition hover:bg-white/10">
            Back to Dashboard
          </Link>
        </section>

        {/* Live Interactive Logistics Hub */}
        <VendorDeliveriesHub initialJobs={jobs} drivers={drivers} />
      </main>
    </div>
  );
}
