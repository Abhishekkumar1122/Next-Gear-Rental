import { BookingExperience } from "@/components/booking-experience";
import { PageShell } from "@/components/page-shell";
import { getServerSessionUser } from "@/lib/server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function BookVehiclePage() {
  const user = await getServerSessionUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  return (
    <PageShell
      title="Book Vehicle"
      subtitle="Search, compare, and confirm your ride in minutes with verified fleets."
    >
      <Suspense
        fallback={
          <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70 shadow-sm">
            Loading booking experience...
          </section>
        }
      >
        <BookingExperience userEmail={user.email} userName={user.email.split("@")[0]} />
      </Suspense>
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Booking tips</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <TipCard title="Verify documents" description="Upload a valid driving license. NRIs can use passport and IDP." />
          <TipCard title="Choose protection" description="Add insurance coverage and roadside assistance for longer trips." />
          <TipCard title="Plan pickups" description="Select airport pickup or city hub for faster check-ins." />
        </div>
      </section>
    </PageShell>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-black/70">{description}</p>
    </div>
  );
}
