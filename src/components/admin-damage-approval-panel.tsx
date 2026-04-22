"use client";

import { useState, useEffect } from "react";

interface DamageCharge {
  id: string;
  bookingId: string;
  chargeType: string;
  description: string;
  severityLevel: string;
  estimatedAmount: number;
  approvedAmount: number | null;
  isApproved: boolean;
  createdAt: string;
}

interface AdminDamageApprovalPanelProps {
  bookingId: string;
  customerName: string;
}

export function AdminDamageApprovalPanel({
  bookingId,
  customerName,
}: AdminDamageApprovalPanelProps) {
  const [charges, setCharges] = useState<DamageCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCharges();
  }, [bookingId]);

  async function fetchCharges() {
    try {
      const response = await fetch(`/api/returns/${bookingId}/damages`);
      if (!response.ok) throw new Error("Failed to fetch charges");
      const data = await response.json();
      setCharges(data.charges || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load damage charges");
    } finally {
      setLoading(false);
    }
  }

  async function updateChargeStatus(
    chargeId: string,
    status: "APPROVED" | "REJECTED"
  ) {
    setUpdatingId(chargeId);
    try {
      const response = await fetch(`/api/admin/damage-charges/${chargeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status }),
      });

      if (!response.ok) throw new Error("Failed to update charge");
      
      setCharges((prev) =>
        prev.map((c) =>
          c.id === chargeId ? { ...c, isApproved: status === "APPROVED" } : c
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update charge status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 text-center">
        <p className="text-sm text-black/60">Loading damage charges...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold mb-2">Damage Charges Approval</h2>
        <p className="text-xs md:text-sm text-black/60 mb-4">
          Customer: <span className="font-semibold">{customerName}</span>
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {charges.length === 0 ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-700">No damage charges recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {charges.map((charge) => (
              <div
                key={charge.id}
                className="rounded-lg border border-black/10 p-3 bg-black/2"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-semibold text-black">
                      {charge.description}
                    </p>
                    <p className="text-xs text-black/60">
                      Type: <span className="capitalize">{charge.chargeType}</span> | Severity: <span className="capitalize">{charge.severityLevel}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-base font-bold text-[var(--brand-red)]">
                      ₹{charge.approvedAmount || charge.estimatedAmount}
                    </p>
                    <p className={`text-xs font-semibold ${
                      charge.isApproved
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}>
                      {charge.isApproved ? "APPROVED" : "PENDING"}
                    </p>
                  </div>
                </div>

                {!charge.isApproved && (
                  <div className="flex flex-col xs:flex-row gap-2 pt-3 border-t border-black/10">
                    <button
                      onClick={() => updateChargeStatus(charge.id, "APPROVED")}
                      disabled={updatingId === charge.id}
                      className="flex-1 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-xs md:text-sm font-semibold border border-green-200 hover:bg-green-100 transition disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => updateChargeStatus(charge.id, "REJECTED")}
                      disabled={updatingId === charge.id}
                      className="flex-1 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-xs md:text-sm font-semibold border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {charges.length > 0 && (
          <div className="mt-4 rounded-lg bg-black/5 border border-black/10 p-3">
            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
              <div>
                <p className="text-black/60">Total Charges</p>
                <p className="font-bold text-black">
                  ₹{charges.reduce((sum, c) => sum + (c.approvedAmount || c.estimatedAmount), 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-black/60">Approved</p>
                <p className="font-bold text-green-600">
                  {charges.filter((c) => c.isApproved).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
