export type VehicleAvailabilityStatus =
  | "available"
  | "booked"
  | "unavailable"
  | "maintenance"
  | "crashed";

export type VehicleAvailabilityOverride = {
  status: VehicleAvailabilityStatus;
  note?: string;
  unavailableUntil?: string;
};

export const adminVehicleStatusStore: Record<string, VehicleAvailabilityOverride> = {};

export function normalizeAvailabilityStatus(value: string | undefined | null): VehicleAvailabilityStatus {
  if (value === "maintenance") return "maintenance";
  if (value === "crashed") return "crashed";
  if (value === "unavailable") return "unavailable";
  return "available";
}

export function resolveVehicleAvailability(params: {
  vehicleId: string;
  hasActiveBooking: boolean;
  override?: VehicleAvailabilityOverride;
}): VehicleAvailabilityStatus {
  const manual = params.override ?? adminVehicleStatusStore[params.vehicleId];
  const normalizedManual = normalizeAvailabilityStatus(manual?.status);

  if (normalizedManual === "crashed") return "crashed";
  if (normalizedManual === "maintenance") return "maintenance";

  if (normalizedManual === "unavailable") return "unavailable";
  if (params.hasActiveBooking) return "booked";
  return "available";
}
