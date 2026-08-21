export default function VendorDashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white p-6 animate-pulse space-y-6">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="h-7 w-56 bg-white/10 rounded-lg mb-1"></div>
          <div className="h-4 w-36 bg-white/5 rounded"></div>
        </div>
        <div className="h-9 w-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Analytics KPI Row skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-28 bg-white/5 rounded-2xl border border-white/10"></div>
        <div className="h-28 bg-white/5 rounded-2xl border border-white/10"></div>
        <div className="h-28 bg-white/5 rounded-2xl border border-white/10"></div>
        <div className="h-28 bg-white/5 rounded-2xl border border-white/10"></div>
      </div>

      {/* Main layout card skeleton */}
      <div className="h-96 bg-white/5 rounded-2xl border border-white/10"></div>
    </div>
  );
}
