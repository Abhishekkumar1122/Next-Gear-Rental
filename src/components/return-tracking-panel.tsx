"use client";

import { useEffect, useState } from "react";

interface ReturnStatus {
  returnId: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  inspectionCompletedAt?: string;
  settledAt?: string;
  vehicleCondition?: {
    fuelLevel: number;
    odometerReading: number;
    conditions: string;
  };
  damageCount: number;
  estimatedCharges: number;
}

interface ReturnTrackingPanelProps {
  bookingId: string;
  customerName: string;
}

export function ReturnTrackingPanel({
  bookingId,
  customerName,
}: ReturnTrackingPanelProps) {
  const [returnStatus, setReturnStatus] = useState<ReturnStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReturnStatus();
  }, [bookingId]);

  async function fetchReturnStatus() {
    try {
      const response = await fetch(`/api/returns/${bookingId}/status`);
      if (!response.ok) throw new Error("Failed to fetch status");
      
      const data = await response.json();
      setReturnStatus(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load return status");
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "INITIATED":
        return "bg-blue-100 text-blue-700";
      case "APPROVED_BY_CUSTOMER":
        return "bg-green-100 text-green-700";
      case "PENDING_VENDOR_INSPECTION":
        return "bg-yellow-100 text-yellow-700";
      case "VENDOR_INSPECTED":
        return "bg-purple-100 text-purple-700";
      case "SETTLED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "INITIATED":
        return "Return Initiated";
      case "APPROVED_BY_CUSTOMER":
        return "Approved by You";
      case "PENDING_VENDOR_INSPECTION":
        return "Waiting for Inspection";
      case "VENDOR_INSPECTED":
        return "Inspection Complete";
      case "SETTLED":
        return "Settled & Refunded";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 text-center">
        <p className="text-sm text-black/60">Loading return status...</p>
      </div>
    );
  }

  if (!returnStatus) {
    return (
      <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 md:p-6">
        <p className="text-sm text-black/60 text-center">
          {error || "No active return found"}
        </p>
      </div>
    );
  }

  const stages = [
    { key: "INITIATED", label: "Return Initiated", completed: true },
    {
      key: "APPROVED_BY_CUSTOMER",
      label: "Your Approval",
      completed: ["APPROVED_BY_CUSTOMER", "PENDING_VENDOR_INSPECTION", "VENDOR_INSPECTED", "SETTLED"].includes(returnStatus.status),
    },
    {
      key: "PENDING_VENDOR_INSPECTION",
      label: "Vendor Inspection",
      completed: ["VENDOR_INSPECTED", "SETTLED"].includes(returnStatus.status),
    },
    {
      key: "VENDOR_INSPECTED",
      label: "Damage Assessment",
      completed: ["SETTLED"].includes(returnStatus.status),
    },
    {
      key: "SETTLED",
      label: "Refund Processed",
      completed: returnStatus.status === "SETTLED",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold mb-2">Return Status Tracker</h2>
        <p className="text-xs md:text-sm text-black/60 mb-4">
          Customer: <span className="font-semibold">{customerName}</span>
        </p>

        {/* Current Status Badge */}
        <div className="mb-6 p-4 rounded-lg bg-black/2 border border-black/10">
          <p className="text-xs text-black/60 mb-2">Current Status</p>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm md:text-base font-bold px-3 py-1 rounded-full inline-block ${getStatusColor(
                returnStatus.status
              )}`}>
                {getStatusLabel(returnStatus.status)}
              </p>
            </div>
            <p className="text-xs text-black/60">
              {new Date(returnStatus.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.key}>
              <div className="flex gap-4">
                {/* Timeline Dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      stage.completed
                        ? "bg-green-500"
                        : returnStatus.status === stage.key
                        ? "bg-blue-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  >
                    {stage.completed ? "✓" : index + 1}
                  </div>
                  {index < stages.length - 1 && (
                    <div
                      className={`w-1 h-12 md:h-16 mt-2 ${
                        stage.completed ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>

                {/* Stage Info */}
                <div className="pb-4">
                  <p
                    className={`text-sm md:text-base font-semibold ${
                      stage.completed
                        ? "text-green-600"
                        : returnStatus.status === stage.key
                        ? "text-blue-600"
                        : "text-black/50"
                    }`}
                  >
                    {stage.label}
                  </p>
                  {stage.completed && stage.key !== "INITIATED" && (
                    <p className="text-xs text-black/50 mt-1">Completed</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vehicle Condition */}
        {returnStatus.vehicleCondition && (
          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs md:text-sm font-bold text-blue-700 mb-3">
              Vehicle Condition Report
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
              <div>
                <p className="text-black/60">Fuel Level</p>
                <p className="font-semibold text-black">
                  {returnStatus.vehicleCondition.fuelLevel}%
                </p>
              </div>
              <div>
                <p className="text-black/60">Odometer</p>
                <p className="font-semibold text-black">
                  {returnStatus.vehicleCondition.odometerReading} km
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Damage Summary */}
        {returnStatus.damageCount > 0 && (
          <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-4">
            <p className="text-xs md:text-sm font-bold text-orange-700 mb-2">
              Damage Issues Detected
            </p>
            <p className="text-sm font-semibold text-orange-600">
              {returnStatus.damageCount} item{returnStatus.damageCount !== 1 ? "s" : ""} - Estimated charges: ₹
              {returnStatus.estimatedCharges}
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 rounded-lg bg-black/5 border border-black/10 p-3">
          <p className="text-xs text-black/70">
            📞 Need help? Contact our support team at support@nextgear.in
          </p>
        </div>
      </div>
    </div>
  );
}
