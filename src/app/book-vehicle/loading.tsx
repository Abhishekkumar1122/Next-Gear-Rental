import { PageShell } from "@/components/page-shell";

export default function BookVehicleLoading() {
  return (
    <PageShell
      title={
        <span className="inline-block font-display uppercase tracking-wider gradient-text animate-pulse">
          Book Vehicle
        </span>
      }
      subtitle={
        <span className="inline-block mt-1 text-white/40">
          Preparing your premium ride booking experience...
        </span>
      }
      variant="dark"
      plainHeader={true}
    >
      <section className="fade-up space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl text-white relative overflow-hidden animate-pulse">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 bg-white/20 rounded" />
          <div className="h-8 w-48 bg-white/20 rounded" />
          <div className="h-4 w-64 bg-white/20 rounded" />
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-32 bg-white/10 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </section>
    </PageShell>
  );
}
