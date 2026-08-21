import { BookingExperience } from "@/components/booking-experience";
import { PageShell } from "@/components/page-shell";
import { getServerSessionUser } from "@/lib/server-session";
import { getSiteSettings } from "@/lib/site-settings";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function BookVehiclePage() {
  const user = await getServerSessionUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  const siteSettings = await getSiteSettings();
  const addonWaiverActive = siteSettings.addonWaiverActive !== "false";
  const addonRsaActive = siteSettings.addonRsaActive !== "false";
  const addonHelmetActive = siteSettings.addonHelmetActive !== "false";

  return (
    <PageShell
      title={
        <span className="inline-block font-display uppercase tracking-wider gradient-text animate-[fade-up_0.8s_ease_forwards]">
          Book Vehicle
        </span>
      }
      subtitle={
        <span className="inline-block mt-1 opacity-0 animate-[fade-up_0.8s_ease_0.3s_forwards] text-white/70">
          Search, compare, and confirm your ride in minutes with verified fleets.
        </span>
      }
      variant="dark"
      plainHeader={true}
      hideFooterOnMobile={true}
    >
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 space-y-6 shadow-2xl min-h-[400px]">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="h-6 bg-white/10 rounded w-48 animate-pulse" />
              <div className="h-6 bg-red-500/20 rounded w-24 animate-pulse" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        }
      >
        <BookingExperience
          userEmail={user.email}
          userName={user.email.split("@")[0]}
          addonWaiverActive={addonWaiverActive}
          addonRsaActive={addonRsaActive}
          addonHelmetActive={addonHelmetActive}
        />
      </Suspense>
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-6 md:p-8 shadow-2xl shadow-red-500/10 text-white">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[var(--brand-red)]/[0.05] blur-2xl pointer-events-none" aria-hidden="true" />
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💡</span>
          <h2 className="text-lg font-bold uppercase tracking-wider font-display text-white/90">Booking tips</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TipCard index={1} title="Verify documents" description="Upload a valid driving license. NRIs can use passport and IDP." />
          <TipCard index={2} title="Choose protection" description="Add insurance coverage and roadside assistance for longer trips." />
          <TipCard index={3} title="Plan pickups" description="Select airport pickup or city hub for faster check-ins." />
        </div>
      </section>
    </PageShell>
  );
}

function TipCard({ title, description, index }: { title: string; description: string; index: number }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-red-500/40 hover:shadow-red-500/5">
      <div className="absolute top-4 right-4 text-xs font-mono font-bold text-white/20 group-hover:text-red-500/30 transition-colors duration-300">
        {String(index).padStart(2, "0")}
      </div>
      <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors duration-300">{title}</p>
      <p className="mt-2 text-xs text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}
