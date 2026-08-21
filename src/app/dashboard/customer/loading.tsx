export default function CustomerDashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white p-6 animate-pulse space-y-6">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="h-7 w-48 bg-white/10 rounded-lg"></div>
        <div className="h-9 w-28 bg-white/10 rounded-full"></div>
      </div>

      {/* Bookings cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
        <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
        <div className="h-44 bg-white/5 rounded-2xl border border-white/10"></div>
      </div>
    </div>
  );
}
