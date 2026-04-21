import { SiteHeader } from "@/components/site-header";
import { getDeliveryJobs } from "@/lib/delivery-data";
import { getServerSessionUser } from "@/lib/server-session";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VendorDeliveriesPage() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "VENDOR") {
    redirect("/dashboard/customer");
  }

  const vendor = await resolveVendorContext(user);
  if (vendor?.status === "blacklisted") {
    redirect("/dashboard/customer?blocked=vendor");
  }

  const jobs = await getDeliveryJobs({ limit: 30 });

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" />
      <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-black/60">Vendor Ops</p>
              <h1 className="mt-1 text-2xl font-semibold">Delivery & Pickup Jobs</h1>
              <p className="mt-2 text-sm text-black/70">Track handoffs and driver ETAs for your bookings.</p>
            </div>
            <Link href="/dashboard/vendor" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
              Back to dashboard
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active jobs</h2>
            <p className="text-xs text-black/60">{jobs.length} jobs</p>
          </div>

          {jobs.length === 0 ? (
            <p className="mt-3 text-sm text-black/60">No delivery jobs assigned yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {/* @ts-ignore - any type for mock data */}
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm">
                  <p className="font-semibold">{job.type.toUpperCase()} · {job.status.toUpperCase()}</p>
                  <p className="mt-1">Booking: {job.bookingId}</p>
                  <p>Scheduled: {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : "Not set"}</p>
                  {job.lastLocationAt ? <p className="text-black/60">Last update: {new Date(job.lastLocationAt).toLocaleString()}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
