"use client";

import { useState } from "react";
import Link from "next/link";

interface ReturnInitiationProps {
  bookingId: string;
  userEmail: string;
  bookingStatus: string;
  endDate: string;
}

export function ReturnInitiationPanel({
  bookingId,
  userEmail,
  bookingStatus,
  endDate,
}: ReturnInitiationProps) {
  const [loading, setLoading] = useState(false);
  const [initiated, setInitiated] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isReturnEligible = bookingStatus === "CONFIRMED";
  const endDateTime = new Date(endDate);
  const isOverdue = new Date() > endDateTime;

  async function handleInitiateReturn() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/returns/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to initiate return");
        return;
      }

      setSuccess("Return initiated successfully! Please proceed with damage checklist.");
      setInitiated(true);
    } catch (err) {
      setError("Error initiating return. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white/50 to-white p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold mb-2">Return Your Bike</h2>
        <p className="text-sm text-black/60 mb-4">
          Initiate the return process for your rental bike
        </p>

        {isOverdue && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm font-semibold text-orange-700">
              ⚠️ Return Overdue
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Late fees (₹500/day) will be applied until the bike is returned and verified.
            </p>
          </div>
        )}

        <div className="grid gap-3 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-black/60">Booking Status:</span>
            <span className="font-semibold text-black capitalize">
              {bookingStatus}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/60">Scheduled Return:</span>
            <span className="font-semibold text-black">
              {new Date(endDate).toLocaleDateString()}
            </span>
          </div>
          {isOverdue && (
            <div className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded">
              <span className="text-orange-700 text-xs font-semibold">
                Status: OVERDUE
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="text-xs text-green-700">{success}</p>
          </div>
        )}

        {initiated ? (
          <div className="space-y-3">
            <p className="text-sm text-black/70">
              ✅ Return initiated. Next steps:
            </p>
            <ol className="text-xs text-black/60 space-y-1 ml-4">
              <li>1. Be ready to show the bike in good condition</li>
              <li>2. Submit pickup/dropoff damage checklist</li>
              <li>3. Vendor will inspect the bike</li>
              <li>4. Final charges calculated and refund processed</li>
            </ol>
            <Link
              href={`/dashboard/customer/tracking`}
              className="block w-full rounded-lg bg-[var(--brand-red)] text-white text-center px-4 py-2 text-sm font-semibold transition hover:scale-105 mt-3"
            >
              View Return Status →
            </Link>
          </div>
        ) : (
          <button
            disabled={!isReturnEligible || loading}
            onClick={handleInitiateReturn}
            className="w-full rounded-lg bg-[var(--brand-red)] text-white px-4 py-2.5 text-sm font-semibold transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Initiating Return..." : "Initiate Return Now"}
          </button>
        )}

        <p className="text-xs text-black/50 mt-4">
          After initiating return, submit damage checklist in your dashboard to confirm bike condition.
        </p>
      </div>
    </div>
  );
}
