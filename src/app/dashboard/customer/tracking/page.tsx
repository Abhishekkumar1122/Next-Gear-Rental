import { DeliveryTrackingPanel } from "@/components/delivery-tracking-panel";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

export default function CustomerTrackingPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" />
      <main className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/customer" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
            Back to dashboard
          </Link>
        </div>
        <DeliveryTrackingPanel />
      </main>
    </div>
  );
}
