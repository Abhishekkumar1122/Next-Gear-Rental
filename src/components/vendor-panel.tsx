import { vendors, vehicles } from "@/lib/mock-data";

export function VendorPanel() {
  return (
    <section className="fade-up space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Marketplace Ops</p>
          <h2 className="text-xl font-semibold">Vendor Panel (Aggregator)</h2>
          <p className="text-sm text-black/70">Add vehicles, set pricing, upload RC/insurance, track bookings, and monitor earnings.</p>
        </div>
        <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs">Commission + Payouts</span>
      </div>

      <div className="overflow-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.04] text-xs uppercase tracking-[0.2em] text-black/60">
            <tr>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Commission</th>
              <th className="px-3 py-2">Vehicles Listed</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-t border-black/10">
                <td className="px-3 py-3 font-medium">{vendor.businessName}</td>
                <td className="px-3 py-3">{vendor.phone}</td>
                <td className="px-3 py-3 text-[var(--brand-red)]">{vendor.commissionRate}%</td>
                <td className="px-3 py-3">{vehicles.filter((v) => v.vendorId === vendor.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}