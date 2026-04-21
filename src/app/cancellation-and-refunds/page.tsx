import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function CancellationAndRefundsPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        
        <SiteHeader variant="dark" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
        <section className="relative z-10">
          <h1 className="text-4xl font-semibold md:text-5xl mb-3 text-white">Cancellation and Refunds</h1>
          <p className="text-base text-white/75">Policy for booking cancellation, rescheduling, and refund settlement timelines.</p>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15 md:p-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
          <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
          <div className="relative z-10 space-y-6">
          <h2 className="text-xl font-semibold text-white">Cancellation and Refund Policy</h2>
          
          <ul className="space-y-2 text-sm text-white/75">
            <li className="flex gap-3">
              <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
              <span>Free cancellation windows where applicable</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
              <span>Partial refund slabs based on time before trip start</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
              <span>No-show and late cancellation handling</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
              <span>Rescheduling options and fare difference treatment</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
              <span>Refund processing timelines to original payment source</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-white/15">
            <p className="text-sm text-white/80">
              For complete cancellation and refund details, visit:
              <Link href="/refund-policy" className="ml-2 font-semibold text-[var(--brand-red)] hover:text-white transition-colors">
                Detailed Refund Policy
              </Link>
            </p>
          </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
