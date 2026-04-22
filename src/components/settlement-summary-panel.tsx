"use client";

import { useEffect, useState } from "react";

interface Settlement {
  id: string;
  bookingId: string;
  originalAmount: number;
  totalDamageCharges: number;
  lateFeeCharges: number;
  otherCharges: number;
  totalDeductions: number;
  refundAmount: number;
  settlementStatus: string;
  settlementNotes?: string;
  settledAt: string;
}

interface SettlementSummaryPanelProps {
  bookingId: string;
  onSettlementLoaded?: (settlement: Settlement) => void;
}

export function SettlementSummaryPanel({
  bookingId,
  onSettlementLoaded,
}: SettlementSummaryPanelProps) {
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettlement();
  }, [bookingId]);

  async function fetchSettlement() {
    try {
      const response = await fetch(`/api/returns/${bookingId}/settle`);
      if (!response.ok) throw new Error("Settlement not found");
      
      const data = await response.json();
      setSettlement(data);
      onSettlementLoaded?.(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load settlement details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 text-center">
        <p className="text-sm text-black/60">Loading settlement details...</p>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 md:p-6">
        <p className="text-sm text-black/60 text-center">
          {error || "No settlement data available"}
        </p>
      </div>
    );
  }

  const settledDate = new Date(settlement.settledAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">Settlement Summary</h2>
          <span className="text-xs md:text-sm px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
            ✓ {settlement.settlementStatus}
          </span>
        </div>

        <p className="text-xs md:text-sm text-black/60 mb-4">
          Settled on: <span className="font-semibold">{settledDate}</span>
        </p>

        {/* Breakdown */}
        <div className="space-y-2 border-t border-black/10 pt-4 mb-4">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-black/70">Rental Amount</span>
            <span className="font-semibold">₹{settlement.originalAmount}</span>
          </div>

          {settlement.lateFeeCharges > 0 && (
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-red-600">Late Fee Charges</span>
              <span className="font-semibold text-red-600">
                -₹{settlement.lateFeeCharges}
              </span>
            </div>
          )}

          {settlement.totalDamageCharges > 0 && (
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-orange-600">Damage Charges</span>
              <span className="font-semibold text-orange-600">
                -₹{settlement.totalDamageCharges}
              </span>
            </div>
          )}

          {settlement.otherCharges > 0 && (
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-black/70">Other Charges</span>
              <span className="font-semibold">-₹{settlement.otherCharges}</span>
            </div>
          )}

          {settlement.totalDeductions > 0 && (
            <div className="flex justify-between text-xs md:text-sm pt-2 border-t border-black/10">
              <span className="text-black/70">Total Deductions</span>
              <span className="font-semibold">-₹{settlement.totalDeductions}</span>
            </div>
          )}
        </div>

        {/* Refund Amount */}
        <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 mb-4">
          <p className="text-xs text-black/60 mb-1">Refundable Amount</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600">
            ₹{settlement.refundAmount}
          </p>
        </div>

        {/* Notes */}
        {settlement.settlementNotes && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Settlement Notes</p>
            <p className="text-xs text-blue-600 whitespace-pre-wrap">
              {settlement.settlementNotes}
            </p>
          </div>
        )}

        {/* Refund Status */}
        <div className="mt-4 p-3 rounded-lg bg-black/5 border border-black/10">
          <p className="text-xs md:text-sm text-black/70">
            💳 Refund will be credited to your original payment method within 5-7 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
