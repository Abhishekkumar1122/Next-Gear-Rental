"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, RefreshCw, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";
import type { Vehicle } from "@/lib/types";

export default function MobileHubPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendorInfo, setVendorInfo] = useState<{ businessName?: string } | null>(null);
  
  // Add vehicle modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCity, setNewCity] = useState("Delhi");
  const [newType, setNewType] = useState<"car" | "bike" | "scooty">("car");
  const [newSeats, setNewSeats] = useState("5");
  const [newPrice, setNewPrice] = useState("1500");
  const [newRegNo, setNewRegNo] = useState("");
  const [newPhoto, setNewPhoto] = useState("");

  const fetchMobileHubData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/fleet");
      const data = await res.json();
      if (res.ok) {
        setVehicles(data.vehicles || []);
        if (data.vendor) {
          setVendorInfo(data.vendor);
        }
      } else {
        setError(data.error || "Failed to load mobile hub data.");
      }
    } catch {
      setError("Network error while loading mobile hub.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobileHubData();
  }, []);

  const setStatusDirect = async (vehicleId: string, targetStatus: string) => {
    const currentVehicle = vehicles.find((v) => v.id === vehicleId);
    const previousStatus = currentVehicle?.operationalStatus;

    // Optimistic UI update
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, operationalStatus: targetStatus as any } : v))
    );

    try {
      const res = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationalStatus: targetStatus }),
      });
      if (!res.ok) {
        // Rollback on failure
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? { ...v, operationalStatus: previousStatus as any } : v))
        );
      }
    } catch {
      // Rollback on network error
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, operationalStatus: previousStatus as any } : v))
      );
    }
  };

  const publishVehicle = async () => {
    if (!newTitle.trim() || !newPrice.trim()) {
      alert("Please enter vehicle title and daily price.");
      return;
    }
    setIsPublishing(true);
    try {
      const res = await fetch("/api/vendor/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          city: newCity.trim(),
          type: newType,
          seats: Number(newSeats) || 5,
          pricePerDayINR: Number(newPrice) || 1500,
          vehicleNumber: newRegNo.trim(),
          imageUrl: newPhoto.trim() || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        }),
      });
      const data = await res.json();
      if (res.ok && data.vehicle) {
        setVehicles((prev) => [data.vehicle, ...prev]);
        setShowAddModal(false);
        setNewTitle("");
        setNewRegNo("");
        setNewPhoto("");
      } else {
        alert(data.error || "Failed to add vehicle.");
      }
    } catch {
      alert("Error adding vehicle.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 pb-28 font-sans relative overflow-x-hidden">
      {/* Glow ambient bg */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[var(--brand-red)]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <div className="max-w-md mx-auto space-y-5 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/vendor"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[var(--brand-red)]" />
                <span>Mobile Fleet Control</span>
              </h1>
              <p className="text-[11px] text-white/50">{vendorInfo?.businessName || "Vendor Partner Hub"}</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-rose-600 border border-rose-400/40 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>



        {/* Error / Loading */}
        {loading && (
          <div className="text-center py-10 text-xs text-white/60 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--brand-red)]" />
            <span>Loading your mobile fleet...</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Glassmorphic Vehicle Cards List (Matching screenshot design) */}
        {!loading && vehicles.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3">
            <span className="text-3xl">🚗</span>
            <h3 className="text-sm font-bold text-white">No Vehicles Listed Yet</h3>
            <p className="text-xs text-white/50">Tap "+ Add" above to publish your first vehicle listing.</p>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-white/60">
                Your Fleet Vehicles ({vehicles.length})
              </span>
              <span className="text-[10px] text-white/40">Tap toggle to list/unlist</span>
            </div>

            {vehicles.map((v) => {
              const status = (v.operationalStatus as string) || "AVAILABLE";
              const isListed = status === "AVAILABLE";
              const isMaintenance = status === "MAINTENANCE";
              const typeIcon = (v.type || "").toLowerCase().includes("bike") ? "🏍️" : (v.type || "").toLowerCase().includes("scooter") ? "🛵" : "🚗";

              return (
                <div
                  key={v.id}
                  className="group rounded-xl border border-white/10 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0a0a0a] p-3 shadow-lg backdrop-blur-xl hover:border-red-500/30 transition-all duration-300 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left Icon + Vehicle Details */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-all">
                        {typeIcon}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white leading-tight flex items-center gap-1.5">
                          <span>{v.title}</span>
                        </h4>
                        <p className="text-[10px] text-white/50 mt-0.5 font-medium">
                          {v.city} · <span className="uppercase font-bold text-white/80">{v.type}</span> · ₹{v.pricePerDayINR}/day
                        </p>
                      </div>
                    </div>

                    {/* Right Chevron Arrow */}
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition" />
                  </div>

                  {/* 3-Way Status Control Row */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/40 text-[10px] shrink-0 font-medium">Status</span>
                    
                    <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[10px] font-extrabold shrink-0">
                      <button
                        onClick={() => setStatusDirect(v.id, "AVAILABLE")}
                        className={`px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer ${
                          isListed
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        🟢 Listed
                      </button>

                      <button
                        onClick={() => setStatusDirect(v.id, "MAINTENANCE")}
                        className={`px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer ${
                          isMaintenance
                            ? "bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        🛠️ Service
                      </button>

                      <button
                        onClick={() => setStatusDirect(v.id, "UNAVAILABLE")}
                        className={`px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer ${
                          !isListed && !isMaintenance
                            ? "bg-white/20 text-white border border-white/30"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        ⚪ Unlist
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD VEHICLE MODAL SHEET */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="max-w-md w-full rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-[#1c080d] via-[#140609] to-[#0d0305] p-6 space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.35)] relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>➕</span> Add Vehicle to Fleet
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-white/70 text-xs flex items-center justify-center hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1">Vehicle Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Royal Enfield Classic 350"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white placeholder-white/40 focus:border-[var(--brand-red)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white focus:border-[var(--brand-red)] focus:outline-none"
                  >
                    <option value="bike">Bike</option>
                    <option value="scooty">Scooty</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">City</label>
                  <input
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="1500"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Registration No</label>
                  <input
                    value={newRegNo}
                    onChange={(e) => setNewRegNo(e.target.value)}
                    placeholder="e.g. DL 01 AB 1234"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Photo URL (Optional)</label>
                <input
                  value={newPhoto}
                  onChange={(e) => setNewPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={publishVehicle}
                disabled={isPublishing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/30 hover:brightness-110 flex items-center justify-center gap-1.5"
              >
                {isPublishing ? "Publishing..." : "Save & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
