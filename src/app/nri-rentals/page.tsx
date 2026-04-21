import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

const steps = [
  { title: "Verify identity", description: "Upload passport, visa, and International Driving Permit." },
  { title: "Choose vehicle", description: "Pick from premium cars or city bikes with insurance." },
  { title: "Pay globally", description: "Use international cards, Stripe, or PayPal." },
  { title: "Collect keys", description: "Meet our staff at the airport or city hub." },
];

const timezoneOptions = ["Asia/Dubai", "Europe/London", "America/New_York", "Asia/Singapore"];

export default function NriRentalsPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <header className="hero-ambient relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <SiteHeader variant="dark" showBadges />

        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:pb-20 md:pt-14">
          <div className="mt-10">
            <div className="fade-up max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Global access</p>
              <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-5xl">
                <span className="gradient-text">NRI Rentals</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
                Trusted rentals for NRIs with passport and IDP verification.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[var(--brand-cream)] text-black">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">NRI checklist</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {steps.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-black/70">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">NRI booking flow</h2>
            <p className="mt-2 text-sm text-black/70">
              Timezone-aware confirmations, international card support, and pre-flight document checks are enabled in NRI mode.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {timezoneOptions.map((tz) => (
                <Link
                  key={tz}
                  href={`/book-vehicle?nri=1&tz=${encodeURIComponent(tz)}`}
                  className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium transition hover:bg-black/5"
                >
                  Start booking in {tz}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Support for NRIs</h2>
            <p className="mt-2 text-sm text-black/70">
              Dedicated helpline and airport pickups in major cities, plus flexible rental extensions.
            </p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
