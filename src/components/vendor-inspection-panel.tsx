"use client";

import { useState } from "react";

interface VendorInspectionPanelProps {
  bookingId: string;
  customerName: string;
}

export function VendorInspectionPanel({
  bookingId,
  customerName,
}: VendorInspectionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fuelLevel: 50,
    odometerReading: 0,
    bodyCondition: "good", // excellent, good, fair, damaged
    engineCondition: "good",
    tiresCondition: "good",
    interiorCondition: "good", // excellent, good, fair, damaged, soiled
    inspectorName: "",
    notes: "",
    damagePhotos: [] as string[],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/returns/${bookingId}/inspection`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit inspection");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError("Error submitting inspection. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold mb-2">Vehicle Inspection</h2>
        <p className="text-xs md:text-sm text-black/60 mb-4">
          Customer: <span className="font-semibold">{customerName}</span>
        </p>

        {submitted ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-semibold text-green-700">✅ Inspection Submitted</p>
            <p className="text-xs text-green-600 mt-2">
              The bike inspection has been recorded. Damage charges (if any) have been automatically created and are pending approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Fuel Level */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-black mb-2">
                Fuel Level: {formData.fuelLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.fuelLevel}
                onChange={(e) =>
                  setFormData({ ...formData, fuelLevel: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            {/* Odometer */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-black mb-2">
                Odometer Reading (km)
              </label>
              <input
                type="number"
                value={formData.odometerReading}
                onChange={(e) =>
                  setFormData({ ...formData, odometerReading: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>

            {/* Condition Checks */}
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { key: "bodyCondition", label: "Body Condition" },
                { key: "engineCondition", label: "Engine Condition" },
                { key: "tiresCondition", label: "Tires Condition" },
                { key: "interiorCondition", label: "Interior Condition" },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-xs md:text-sm font-semibold text-black mb-2">
                    {item.label}
                  </label>
                  <select
                    value={formData[item.key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-xs md:text-sm"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                    {item.key === "interiorCondition" && (
                      <option value="soiled">Soiled</option>
                    )}
                  </select>
                </div>
              ))}
            </div>

            {/* Inspector Name */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-black mb-2">
                Inspector Name
              </label>
              <input
                type="text"
                value={formData.inspectorName}
                onChange={(e) =>
                  setFormData({ ...formData, inspectorName: e.target.value })
                }
                placeholder="Your name..."
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-black mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Document any special observations..."
                maxLength={2000}
                rows={3}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
              <p className="text-xs text-black/50 mt-1">
                {formData.notes.length}/2000
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.inspectorName}
              className="w-full rounded-lg bg-[var(--brand-red)] text-white px-4 py-2.5 text-sm font-semibold transition hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Inspection"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
