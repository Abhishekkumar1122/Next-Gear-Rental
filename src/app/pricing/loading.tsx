export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 animate-pulse space-y-8">
      {/* Hero header skeleton */}
      <div className="mx-auto max-w-6xl pt-10 pb-16 space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
        <div className="h-12 w-3/4 bg-white/10 rounded-xl"></div>
        <div className="h-4 w-1/2 bg-white/5 rounded"></div>
      </div>

      {/* Pricing cards grid skeleton */}
      <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
        <div className="h-96 bg-neutral-900/80 rounded-3xl border border-white/10"></div>
        <div className="h-96 bg-neutral-900/80 rounded-3xl border border-white/10"></div>
        <div className="h-96 bg-neutral-900/80 rounded-3xl border border-white/10"></div>
      </div>
    </div>
  );
}
