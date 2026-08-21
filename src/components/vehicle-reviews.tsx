"use client";

import { Star, ShieldCheck, ThumbsUp, CheckCircle, UserCheck } from "lucide-react";

export type ReviewItem = {
  id: string;
  riderName: string;
  cityName: string;
  rating: number;
  date: string;
  comment: string;
  verifiedTrip: boolean;
};

const mockReviews: ReviewItem[] = [
  {
    id: "rev-1",
    riderName: "Aman V.",
    cityName: "Goa Airport T2",
    rating: 5,
    date: "2 days ago",
    comment: "Vehicle was delivered right at the airport arrival gate! Clean helmet, smooth engine, zero security deposit locking. Highly recommended!",
    verifiedTrip: true,
  },
  {
    id: "rev-2",
    riderName: "Priya S.",
    cityName: "Bengaluru, Karnataka",
    rating: 5,
    date: "5 days ago",
    comment: "Super fast OTP handover. The bike was fully serviced, clean tank, and digital pass on WhatsApp made the checkpost entry seamless.",
    verifiedTrip: true,
  },
  {
    id: "rev-3",
    riderName: "Vikram R.",
    cityName: "Delhi NCR, Delhi",
    rating: 5,
    date: "1 week ago",
    comment: "Rented for a 3-day trip. Vehicle quality is top-notch compared to local vendors. Instant WhatsApp receipt & e-pass!",
    verifiedTrip: true,
  },
];

export function VehicleReviews({ rating = 4.9, totalTrips = 142 }: { rating?: number; totalTrips?: number }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900/90 via-neutral-950 to-black p-6 sm:p-8 shadow-2xl shadow-red-600/10 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Verified Rider Feedback</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Rider Ratings & Experience
          </h3>
          <p className="text-xs text-white/60 mt-1">
            Based on {totalTrips}+ completed trips across India.
          </p>
        </div>

        {/* Overall Rating Badge */}
        <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 p-3.5 rounded-2xl shrink-0">
          <div className="text-3xl font-black text-white font-mono leading-none">{rating}</div>
          <div>
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-[10px] font-mono uppercase text-white/50 mt-1 font-bold">Top Rated Fleet</p>
          </div>
        </div>
      </div>

      {/* Feature Breakdown Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-white/50">Engine Health</p>
          <p className="text-base sm:text-lg font-black text-emerald-400 mt-1">4.9 ★</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-white/50">Cleanliness</p>
          <p className="text-base sm:text-lg font-black text-emerald-400 mt-1">4.9 ★</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-white/50">Handover Speed</p>
          <p className="text-base sm:text-lg font-black text-amber-400 mt-1">5.0 ★</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-white/50">Value for Money</p>
          <p className="text-base sm:text-lg font-black text-rose-400 mt-1">4.8 ★</p>
        </div>
      </div>

      {/* Verified Reviews Cards */}
      <div className="space-y-3 pt-2">
        <p className="text-xs uppercase font-bold text-white/50 tracking-wider">Recent Verified Rider Reviews</p>
        <div className="grid gap-3">
          {mockReviews.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-xs">
                    {rev.riderName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{rev.riderName}</span>
                      {rev.verifiedTrip && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-white/50">{rev.cityName} • {rev.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <span>{rev.rating}.0</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed pl-10">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
