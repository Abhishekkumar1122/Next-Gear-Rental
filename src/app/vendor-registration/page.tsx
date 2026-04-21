import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VendorRegistrationForm } from "@/components/vendor-registration-form";

export default function VendorRegistrationPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <header className="hero-ambient relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <SiteHeader variant="dark" showBadges />

        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div className="mt-10">
            <div className="fade-up max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Partnership program</p>
              <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-5xl">
                <span className="gradient-text">Vendor Registration</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
                Partner with Next Gear to list your fleet and earn steady revenue.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[var(--brand-cream)] text-black">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
          <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold">Why partner with us</h2>
              <div className="mt-3 space-y-2 text-sm text-black/70">
                <p>- Pan India demand with verified bookings.</p>
                <p>- Transparent commission and weekly payouts.</p>
                <p>- Dedicated vendor success manager.</p>
                <p>- Live dashboard for availability and pricing.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
              <VendorRegistrationForm />
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
