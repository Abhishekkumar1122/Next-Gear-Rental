import { cityConfigs, vendors, vehicles } from "@/lib/mock-data";

const adminCapabilities = [
  "Manage users",
  "Manage vendors",
  "Manage vehicles",
  "Booking control",
  "Payment reports",
  "Commission settings",
  "City management",
];

export function AdminPanel() {
  return (
    <section className="fade-up space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Control Tower</p>
          <h2 className="text-xl font-semibold">Admin Panel</h2>
        </div>
        <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs">Ops + Finance</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard title="Active Cities" value={cityConfigs.length.toString()} />
        <StatCard title="Total Vehicles" value={vehicles.length.toString()} />
        <StatCard title="Registered Vendors" value={vendors.length.toString()} />
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        {adminCapabilities.map((item) => (
          <div key={item} className="rounded-xl border border-black/10 bg-black/[0.02] p-3">{item}</div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-black/60">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--brand-red)]">{value}</p>
    </div>
  );
}