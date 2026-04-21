import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        
        <SiteHeader variant="dark" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
        <section className="relative z-10">
          <h1 className="text-4xl font-semibold md:text-5xl mb-3 text-white">Shipping Policy</h1>
          <p className="text-base text-white/75">Delivery and fulfillment policy for vehicle rental services on Next Gear Rentals.</p>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15 md:p-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
          <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
          <div className="relative z-10 space-y-6">
          <p className="text-sm text-white/80 leading-relaxed">
            Next Gear Rentals does not ship physical goods. Our service is digital booking and vehicle rental fulfillment.
            Where available, we provide pickup/drop delivery support for vehicles.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Service Fulfillment</h2>
            <ul className="space-y-2 text-sm text-white/75">
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Booking confirmation is sent digitally by email/SMS/WhatsApp</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Vehicle handover occurs at selected pickup location or approved delivery point</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Delivery timing depends on city operations, driver availability, and traffic conditions</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Customer must be present with valid ID and license at handover</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Delivery Charges</h2>
            <ul className="space-y-2 text-sm text-white/75">
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>Any doorstep delivery fee is disclosed before checkout</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>No hidden logistics charges are applied after booking confirmation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-red)] flex-shrink-0">•</span>
                <span>If we fail to fulfill delivery due to our operational issue, eligible refunds apply</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Non-Delivery / Delay</h2>
            <p className="text-sm text-white/80 leading-relaxed">
              In rare cases of delay, our support team will offer updated ETA, alternate vehicle, reschedule, or refund as per the
              cancellation and refund policy.
            </p>
          </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
