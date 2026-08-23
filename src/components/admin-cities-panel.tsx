"use client";

import { useState, useEffect, useTransition } from "react";
import {
  MapPin,
  Plane,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Car,
  Trash2,
  RefreshCw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Layers,
} from "lucide-react";
import { IndiaStateCitySelector } from "@/components/india-state-city-selector";

type CityItem = {
  id: string;
  name: string;
  state?: string;
  displayName: string;
  airportName?: string;
  isActive: boolean;
  vehiclesCount: number;
  createdAt: string;
};

export function AdminCitiesPanel() {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "airport">("all");
  
  // Add City Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newStateName, setNewStateName] = useState("Maharashtra");
  const [newAirportName, setNewAirportName] = useState("");
  const [isSubmitting, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/cities", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities || []);
        setStates(data.states || []);
      }
    } catch (e) {
      showToast("Failed to fetch cities list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCities();
  }, []);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !newStateName.trim()) {
      showToast("Please provide both city name and state.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityName: newCityName.trim(),
            stateName: newStateName.trim(),
            airportName: newAirportName.trim() || undefined,
          }),
        });

        if (res.ok) {
          showToast(`✅ ${newCityName} added to location network!`);
          setNewCityName("");
          setNewAirportName("");
          setShowAddForm(false);
          await fetchCities();
        } else {
          const err = await res.json();
          showToast(err.error || "Failed to add city.", "error");
        }
      } catch (e) {
        showToast("Error creating city record.", "error");
      }
    });
  };

  const handleToggleCityStatus = async (cityId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/cities/${cityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        setCities((prev) =>
          prev.map((c) => (c.id === cityId ? { ...c, isActive: !currentActive } : c))
        );
        showToast(`City status updated: ${!currentActive ? "Active" : "Disabled"}`);
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch (e) {
      showToast("Network error updating city.", "error");
    }
  };

  const handleDeleteCity = async (city: CityItem) => {
    if (city.vehiclesCount > 0) {
      alert(`Cannot delete ${city.name} because ${city.vehiclesCount} vehicles are currently assigned to it. Please reassign or remove the fleet first.`);
      return;
    }

    if (!confirm(`Are you sure you want to remove ${city.displayName} from the network?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/cities/${city.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCities((prev) => prev.filter((c) => c.id !== city.id));
        showToast(`🗑️ ${city.name} removed successfully.`);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete city.", "error");
      }
    } catch (e) {
      showToast("Error deleting city.", "error");
    }
  };

  const filteredCities = cities.filter((c) => {
    const matchesSearch =
      c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.airportName && c.airportName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "active") return c.isActive;
    if (statusFilter === "inactive") return !c.isActive;
    if (statusFilter === "airport") return Boolean(c.airportName);
    return true;
  });

  const totalCities = cities.length;
  const activeCities = cities.filter((c) => c.isActive).length;
  const airportHubs = cities.filter((c) => Boolean(c.airportName)).length;
  const totalVehiclesMapped = cities.reduce((sum, c) => sum + (c.vehiclesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast alert banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border text-xs font-bold shadow-2xl flex items-center gap-2.5 transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/90 border-red-500/40 text-red-300"
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Stat Strip */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Cities</p>
            <p className="text-2xl font-black text-white mt-1">{totalCities}</p>
            <p className="text-[10px] text-white/50 mt-0.5">Network locations</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Active Hubs</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCities}</p>
            <p className="text-[10px] text-emerald-300/60 mt-0.5">Open for booking</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Airport Hubs</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{airportHubs}</p>
            <p className="text-[10px] text-cyan-300/60 mt-0.5">Terminal deliveries</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Plane className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Fleet Mapped</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{totalVehiclesMapped}</p>
            <p className="text-[10px] text-amber-300/60 mt-0.5">Assigned vehicles</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Car className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏙️</span>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Locations &amp; Cities Management
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Configure Pan-India operational territories, airport delivery terminals, and regional availability.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void fetchCities()}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5 font-bold"
              title="Refresh city list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? "Close Form" : "Add New City"}</span>
            </button>
          </div>
        </div>

        {/* Add City Expandable Drawer Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddCity}
            className="rounded-2xl border border-red-500/30 bg-red-950/15 p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
          >
            <div className="flex items-center gap-2 border-b border-red-500/20 pb-3">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Launch New Operational Territory (Pan-India)
              </h3>
            </div>

            {/* Dynamic State -> Dependent City Selector */}
            <IndiaStateCitySelector
              selectedState={newStateName}
              selectedCity={newCityName}
              onStateChange={(st) => setNewStateName(st)}
              onCityChange={(ct) => setNewCityName(ct)}
              onAirportSuggested={(ap) => setNewAirportName(ap)}
              showAirportHint={true}
            />

            {/* Airport Terminal Input */}
            <div className="text-xs space-y-1.5 pt-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/50">
                Airport Terminal Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Pune Int'l Airport (PNQ) or Dabolim Airport (GOI)"
                value={newAirportName}
                onChange={(e) => setNewAirportName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
              />
              <p className="text-[10px] text-white/40">
                ✈️ When set, customers will be able to book express Airport Terminal pickup &amp; return deliveries.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-red-500/10">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newCityName.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Confirm &amp; Register City</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by city, state, or airport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              All ({cities.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "active"
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Active ({activeCities})
            </button>
            <button
              onClick={() => setStatusFilter("airport")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "airport"
                  ? "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Airport Hubs ({airportHubs})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-amber-950/80 border border-amber-500/40 text-amber-300"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Disabled ({totalCities - activeCities})
            </button>
          </div>
        </div>

        {/* Cities Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40">
          <table className="w-full text-left text-xs text-white/80">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-white/40">
                <th className="py-3 px-4">Location &amp; State</th>
                <th className="py-3 px-4">Airport Delivery Hub</th>
                <th className="py-3 px-4 text-center">Fleet Mapped</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredCities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-white/40">
                    No locations match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCities.map((city) => (
                  <tr key={city.id} className="hover:bg-white/[0.015] transition-colors">
                    {/* Location Name & State */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                          <MapPin className="w-4 h-4 text-[var(--brand-red)]" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{city.name}</p>
                          {city.state && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                              {city.state}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Airport Hub */}
                    <td className="py-3.5 px-4">
                      {city.airportName ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold">
                          <Plane className="w-3.5 h-3.5" />
                          <span>{city.airportName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-white/30 italic">No airport linked</span>
                      )}
                    </td>

                    {/* Vehicles Mapped */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/5 border border-white/10 text-white">
                        <Car className="w-3 h-3 text-amber-400" />
                        <span>{city.vehiclesCount}</span>
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleCityStatus(city.id, city.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer border ${
                          city.isActive
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950"
                            : "bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-950"
                        }`}
                        title="Click to toggle availability"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${city.isActive ? "bg-emerald-400" : "bg-amber-400"}`} />
                        <span>{city.isActive ? "ACTIVE" : "DISABLED"}</span>
                      </button>
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCity(city)}
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/30 hover:bg-red-900/40 text-red-400 transition cursor-pointer"
                        title="Delete city"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
