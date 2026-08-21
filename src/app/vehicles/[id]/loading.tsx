import React from "react";
import { PageShell } from "@/components/page-shell";

export default function VehicleDetailLoading() {
  return (
    <PageShell title="Loading Vehicle..." subtitle="Fetching fleet details" variant="dark">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full bg-white/10" />
            <div className="h-7 w-64 rounded-xl bg-white/20" />
            <div className="h-4 w-44 rounded-full bg-white/10" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-16 ml-auto rounded-full bg-white/10" />
            <div className="h-8 w-32 ml-auto rounded-2xl bg-white/20" />
          </div>
        </div>

        {/* Showcase Player Skeleton */}
        <div className="mt-6 aspect-video w-full rounded-3xl border border-white/10 bg-neutral-900/60 p-4 animate-pulse flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="h-6 w-32 rounded-full bg-white/10" />
            <div className="h-6 w-24 rounded-full bg-white/10" />
          </div>
          <div className="flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
              <div className="h-6 w-6 rounded-md bg-white/20" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-48 rounded-full bg-white/10" />
            <div className="h-2 w-full rounded-full bg-white/10" />
          </div>
        </div>

        {/* Detail Cards Skeleton Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="h-2.5 w-16 rounded-full bg-white/10" />
              <div className="h-4 w-24 rounded-lg bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
