import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <header className="hero-ambient relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <SiteHeader variant="dark" showBadges />

        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div className="mt-10">
            <div className="fade-up max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Our story</p>
              <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-5xl">
                <span className="gradient-text">About Us</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
                Next Gear Rentals connects riders to trusted vehicles across India.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[var(--brand-cream)] text-black">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Our mission</h2>
            <p className="mt-2 text-sm text-black/70">
              We make mobility effortless with verified vehicles, instant booking, and transparent pricing.
            </p>
          </section>
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Trusted fleets</p>
              <p className="text-sm text-black/70">Every vehicle is verified and safety checked.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Nationwide reach</p>
              <p className="text-sm text-black/70">Major city hubs with airport pickups.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Customer-first</p>
              <p className="text-sm text-black/70">24x7 support and fair policies.</p>
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
