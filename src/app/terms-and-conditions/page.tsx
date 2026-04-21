import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        
        <SiteHeader variant="dark" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
        <section className="relative z-10">
          <h1 className="text-4xl font-semibold md:text-5xl mb-3 text-white">Terms and Conditions</h1>
          <p className="text-base text-white/75">These terms govern your use of Next Gear Rentals services, bookings, payments, and platform usage.</p>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15 md:p-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
          <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
          <div className="relative z-10 space-y-6">
          <div>
            <p className="text-sm text-white/80 leading-relaxed">
              By using this platform, you agree to our vehicle rental eligibility rules, booking obligations, liability clauses,
              payment terms, cancellation framework, and dispute process under applicable Indian laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Key Points</h2>
            <ul className="space-y-2 text-sm text-white/75">
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Customer eligibility, identity verification, and KYC checks</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Vehicle usage responsibilities, accident reporting, and penalties</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Pricing, GST invoicing, and payment gateway compliance</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Cancellation and refund timelines</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Data protection and grievance redressal mechanism</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-white/15">
            <p className="text-sm text-white/80">
              For the complete legal text, visit our full policy page:
              <Link href="/terms-privacy" className="ml-2 font-semibold text-[var(--brand-red)] hover:text-white transition-colors">
                Full Terms & Privacy
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
