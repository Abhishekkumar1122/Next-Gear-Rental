import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VendorApplicationStatusPanel } from "@/components/vendor-application-status-panel";
import { VendorRegistrationForm } from "@/components/vendor-registration-form";
import { getSiteSettings } from "@/lib/site-settings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VendorRegistrationPage() {
  const settings = await getSiteSettings();
  const registrationOpen = settings.vendorRegistrationOpen !== "false";

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      <header className="hero-ambient relative overflow-hidden -mt-12 pt-12">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

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

      {!registrationOpen ? (
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-12 space-y-6">
            <div className="text-5xl">🔒</div>
            <h2 className="font-display text-2xl uppercase tracking-widest text-white">
              Registrations Currently Closed
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">
              We are not accepting new vendor applications at this time. Our partner slots are limited and currently at capacity. Please check back soon!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition">
                Back to Home
              </Link>
              <a href={settings.whatsappUrl || "#"} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--brand-red)] hover:bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-[var(--brand-ink)]">
          {/* Floating background blobs */}
          <div className="absolute top-[20%] left-[-10%] h-72 w-72 rounded-full bg-[var(--brand-red)]/5 blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[20%] right-[-10%] h-80 w-80 rounded-full bg-red-600/5 blur-[120px] pointer-events-none z-0" />

          <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 md:py-16 flex-grow relative z-10">
            <div className="grid gap-8 grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
              <div className="order-1 md:order-none md:col-start-2 md:row-start-1 animate-slide-right rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl sm:p-8 accent-border hover:border-white/20 transition-all duration-300">
                <VendorRegistrationForm />
              </div>
              <div className="order-2 md:order-none md:col-span-2 md:col-start-1 md:row-start-2 animate-slide-bottom">
                <VendorApplicationStatusPanel />
              </div>
              <div className="order-3 md:order-none md:col-start-1 md:row-start-1 animate-slide-left rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl sm:p-8 accent-border hover:border-white/20 transition-all duration-300">
                <h2 className="text-xl font-bold tracking-tight text-white mb-6 uppercase tracking-wider text-[var(--brand-red-soft)]">Why partner with us</h2>
                <div className="space-y-6">
                  {[
                    { n: "1", title: "Pan India Demand", desc: "Get instant access to verified customers and bookings across major cities in India." },
                    { n: "2", title: "Weekly Payouts", desc: "Enjoy transparent commissions, low platform fees, and guaranteed weekly bank payouts." },
                    { n: "3", title: "Dedicated Support", desc: "Get assigned a dedicated vendor success manager to help set up and scale your listings." },
                    { n: "4", title: "Live Vendor Dashboard", desc: "Monitor earnings, block vehicle availability, and control pricing from a single live portal." },
                  ].map((item) => (
                    <div key={item.n} className="flex gap-4 items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-[var(--brand-red-soft)] font-bold text-sm">{item.n}</div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-xs text-white/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
