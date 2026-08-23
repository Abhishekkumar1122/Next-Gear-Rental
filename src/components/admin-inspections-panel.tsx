"use client";

import { useState, useEffect } from "react";
import { formatBookingId } from "@/lib/pricing-tiers";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Gauge,
  IndianRupee,
  Car,
  User,
  Search,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Eye,
  Sliders,
  Check,
} from "lucide-react";

type InspectionRecord = {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  vehicleTitle: string;
  city: string;
  pickupDate: string;
  returnDate: string;
  startOdometer: number;
  endOdometer: number;
  startFuel: string;
  endFuel: string;
  startPhotos: string[];
  damagePhotos: string[];
  damageReported: boolean;
  damageDescription?: string;
  estimatedDamageINR?: number;
  approvedDamageINR?: number;
  securityDepositINR: number;
  status: "PENDING" | "APPROVED" | "CLEARED" | "DISPUTED";
};

const MOCK_INSPECTIONS: InspectionRecord[] = [
  {
    bookingId: "bk-9421",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.s@gmail.com",
    vehicleTitle: "Royal Enfield Hunter 350",
    city: "Goa",
    pickupDate: "2026-08-20",
    returnDate: "2026-08-23",
    startOdometer: 14200,
    endOdometer: 14580,
    startFuel: "100%",
    endFuel: "85%",
    startPhotos: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=60",
    ],
    damagePhotos: [
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=60",
    ],
    damageReported: true,
    damageDescription: "Right rear-view mirror cracked and slight exhaust heat shield scratch during return.",
    estimatedDamageINR: 1500,
    approvedDamageINR: 1200,
    securityDepositINR: 3000,
    status: "PENDING",
  },
  {
    bookingId: "bk-8312",
    customerName: "Priya Patel",
    customerEmail: "priya.p@test.com",
    vehicleTitle: "KTM Duke 250",
    city: "Pune",
    pickupDate: "2026-08-21",
    returnDate: "2026-08-23",
    startOdometer: 8900,
    endOdometer: 9140,
    startFuel: "100%",
    endFuel: "95%",
    startPhotos: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=60",
    ],
    damagePhotos: [],
    damageReported: false,
    securityDepositINR: 3000,
    status: "CLEARED",
  },
  {
    bookingId: "bk-7104",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram.m@nri.com",
    vehicleTitle: "Mahindra Thar 4x4",
    city: "Manali",
    pickupDate: "2026-08-18",
    returnDate: "2026-08-22",
    startOdometer: 23100,
    endOdometer: 23640,
    startFuel: "100%",
    endFuel: "70%",
    startPhotos: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=60",
    ],
    damagePhotos: [
      "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=600&auto=format&fit=crop&q=60",
    ],
    damageReported: true,
    damageDescription: "Front bumper underbody scrape and missing spare wheel cover.",
    estimatedDamageINR: 4200,
    approvedDamageINR: 3500,
    securityDepositINR: 5000,
    status: "DISPUTED",
  },
];

export function AdminInspectionsPanel() {
  const [inspections, setInspections] = useState<InspectionRecord[]>(MOCK_INSPECTIONS);
  const [filter, setFilter] = useState<"all" | "pending" | "damage" | "cleared">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<InspectionRecord | null>(MOCK_INSPECTIONS[0]);
  const [approvedAmount, setApprovedAmount] = useState<number>(MOCK_INSPECTIONS[0].approvedDamageINR || 0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectCase = (item: InspectionRecord) => {
    setSelectedCase(item);
    setApprovedAmount(item.approvedDamageINR || item.estimatedDamageINR || 0);
  };

  const handleSettleDamage = (record: InspectionRecord) => {
    setInspections((prev) =>
      prev.map((it) =>
        it.bookingId === record.bookingId
          ? { ...it, approvedDamageINR: approvedAmount, status: "APPROVED" }
          : it
      )
    );
    showToast(`✅ Damage charge of ₹${approvedAmount} approved. Net refund ₹${record.securityDepositINR - approvedAmount} released to customer!`);
    if (selectedCase?.bookingId === record.bookingId) {
      setSelectedCase((prev) => (prev ? { ...prev, approvedDamageINR: approvedAmount, status: "APPROVED" } : null));
    }
  };

  const filtered = inspections.filter((item) => {
    if (filter === "pending" && item.status !== "PENDING") return false;
    if (filter === "damage" && !item.damageReported) return false;
    if (filter === "cleared" && item.status !== "CLEARED" && item.status !== "APPROVED") return false;

    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.bookingId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.vehicleTitle.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q)
    );
  });

  const totalDamageCount = inspections.filter((i) => i.damageReported).length;
  const pendingAudits = inspections.filter((i) => i.status === "PENDING" || i.status === "DISPUTED").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/95 text-emerald-300 text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      {/* Top Stat Strip */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Audits</p>
            <p className="text-2xl font-black text-white mt-1">{inspections.length}</p>
            <p className="text-[10px] text-white/50 mt-0.5">Return inspections</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Pending Review</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingAudits}</p>
            <p className="text-[10px] text-amber-300/60 mt-0.5">Requires settlement</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Damage Cases</p>
            <p className="text-2xl font-black text-red-400 mt-1">{totalDamageCount}</p>
            <p className="text-[10px] text-red-300/60 mt-0.5">Reported damage disputes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4.5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Damage Assessed</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">₹5,700</p>
            <p className="text-[10px] text-emerald-300/60 mt-0.5">Total deductions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left List + Right Detail Auditor */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Cases List */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#0c0c0c] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Inspection Cases
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-white/40">
              {filtered.length} Cases
            </span>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search by ID, customer, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/40"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === "pending" ? "bg-amber-600 text-black font-black" : "bg-white/5 text-amber-300"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("damage")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === "damage" ? "bg-red-600 text-white font-black" : "bg-white/5 text-red-400"
                }`}
              >
                Damages
              </button>
              <button
                onClick={() => setFilter("cleared")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === "cleared" ? "bg-emerald-600 text-white font-black" : "bg-white/5 text-emerald-400"
                }`}
              >
                Cleared
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto no-scrollbar">
            {filtered.map((item) => {
              const isSelected = selectedCase?.bookingId === item.bookingId;
              return (
                <div
                  key={item.bookingId}
                  onClick={() => handleSelectCase(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "border-red-500/50 bg-red-950/20 shadow-md shadow-red-950/30"
                      : "border-white/5 bg-white/[0.01] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[var(--brand-red-soft)]">
                      {formatBookingId(item.bookingId)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        item.damageReported
                          ? "bg-red-950/80 border-red-500/40 text-red-300"
                          : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                      }`}
                    >
                      {item.damageReported ? "💥 DAMAGE REPORTED" : "✅ CLEAN RETURN"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white">{item.vehicleTitle}</p>
                    <p className="text-[10px] text-white/50">{item.customerName} · 📍 {item.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Side-by-Side Audit Workspace */}
        {selectedCase ? (
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Audit Inspection #{formatBookingId(selectedCase.bookingId)}
                  </h3>
                  <span className="text-[10px] font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                    📍 {selectedCase.city}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Customer: <span className="text-white font-bold">{selectedCase.customerName}</span> ({selectedCase.customerEmail})
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  selectedCase.status === "APPROVED"
                    ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                    : selectedCase.damageReported
                    ? "bg-red-950/80 border-red-500/40 text-red-300"
                    : "bg-cyan-950/80 border-cyan-500/40 text-cyan-300"
                }`}
              >
                {selectedCase.status}
              </span>
            </div>

            {/* Side-by-Side Comparison: Handover vs Return Readings */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              {/* Pickup Handover */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 text-white/70 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pickup Handover State</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white/50">
                      <Gauge className="w-3 h-3 text-white/40" />
                      <span>Start Odometer:</span>
                    </span>
                    <span className="font-mono font-bold text-white">{selectedCase.startOdometer} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white/50">
                      <Fuel className="w-3 h-3 text-white/40" />
                      <span>Fuel Level:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{selectedCase.startFuel}</span>
                  </div>

                  {/* Start Photos */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1.5">Pickup Proof Photos</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedCase.startPhotos.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="relative w-24 h-16 rounded-xl overflow-hidden border border-white/10 group cursor-pointer shrink-0"
                        >
                          <img src={img} alt="Pickup proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold">
                            View ↗
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Check-in */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 text-white/70 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 pb-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Return Check-in State</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white/50">
                      <Gauge className="w-3 h-3 text-white/40" />
                      <span>Return Odometer:</span>
                    </span>
                    <span className="font-mono font-bold text-white">{selectedCase.endOdometer} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white/50">
                      <Fuel className="w-3 h-3 text-white/40" />
                      <span>Return Fuel:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">{selectedCase.endFuel}</span>
                  </div>

                  {/* Return / Damage Photos */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1.5">Return / Damage Photos</p>
                    {selectedCase.damagePhotos.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selectedCase.damagePhotos.map((img, idx) => (
                          <a
                            key={idx}
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            className="relative w-24 h-16 rounded-xl overflow-hidden border border-red-500/40 group cursor-pointer shrink-0"
                          >
                            <img src={img} alt="Damage proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-red-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold">
                              Inspect ↗
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-400 italic">No damage photos attached</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Travelled Calculation */}
            <div className="p-3.5 rounded-2xl border border-white/5 bg-black/40 flex items-center justify-between text-xs">
              <span className="text-white/60">Total Distance Driven:</span>
              <span className="font-mono font-black text-white text-sm">
                {selectedCase.endOdometer - selectedCase.startOdometer} Kilometers
              </span>
            </div>

            {/* Damage Assessment & Settlement Box */}
            {selectedCase.damageReported && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/15 p-5 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs tracking-wider border-b border-red-500/20 pb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Damage Settlement &amp; Deposit Adjustment</span>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  📝 {selectedCase.damageDescription}
                </p>

                <div className="grid gap-4 sm:grid-cols-3 text-xs pt-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                      Vendor Estimated Cost
                    </span>
                    <p className="text-lg font-mono font-bold text-red-300">
                      ₹{selectedCase.estimatedDamageINR?.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                      Admin Approved Deduction *
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-white/15 bg-black/60 pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block mb-1">
                      Net Deposit Refund to Rider
                    </span>
                    <p className="text-lg font-mono font-black text-emerald-400">
                      ₹{Math.max(0, selectedCase.securityDepositINR - approvedAmount).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSettleDamage(selectedCase)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Settle Deposit Deduction</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0c0c0c] p-10 text-center text-white/40">
            Select an inspection case from the left list to review proof photos and settle damage claims.
          </div>
        )}
      </div>
    </div>
  );
}
