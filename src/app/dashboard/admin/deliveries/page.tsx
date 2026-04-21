import { DeliveryJobForm } from "@/components/delivery-job-form";
import { SiteHeader } from "@/components/site-header";
import { getDeliveryJobs, getDrivers } from "@/lib/delivery-data";
import { getServerSessionUser } from "@/lib/server-session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDeliveriesPage() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard/customer");
  }

  const jobs = await getDeliveryJobs({ limit: 50 });
  const drivers = await getDrivers();
  // @ts-ignore - any type for mock data
  const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" showBadges={false} brandHref="/dashboard/admin" />
      <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-black/60">Admin Console</p>
              <h1 className="mt-1 text-2xl font-semibold">Deliveries & Pickups</h1>
              <p className="mt-2 text-sm text-black/70">Live tracking, assignments, and handoff OTPs.</p>
            </div>
            <Link href="/dashboard/admin" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
              Back to admin
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Create job</h2>
          <DeliveryJobForm />
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live jobs</h2>
            <p className="text-xs text-black/60">{jobs.length} total</p>
          </div>

          {jobs.length === 0 ? (
            <p className="mt-3 text-sm text-black/60">No delivery jobs yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {/* @ts-ignore - any type for mock data */}
              {jobs.map((job) => {
                const driver = job.assignedDriverId ? driverMap.get(job.assignedDriverId) : null;
                return (
                  <div key={job.id} className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{job.type.toUpperCase()} · {job.status.toUpperCase()}</p>
                      <p className="text-xs text-black/60">Job ID: {job.id}</p>
                    </div>
                    <p className="mt-2">Booking: {job.bookingId}</p>
                    <p>Scheduled: {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : "Not set"}</p>
                    {/* @ts-expect-error - driver is mock data */}
                    <p>Driver: {driver ? `${driver.name} (${driver.id})` : "Unassigned"}</p>
                    {job.notes ? <p className="text-black/60">Notes: {job.notes}</p> : null}
                    {job.liveLat && job.liveLng ? (
                      <p className="mt-1 text-black/60">Live: {job.liveLat.toFixed(5)}, {job.liveLng.toFixed(5)}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
