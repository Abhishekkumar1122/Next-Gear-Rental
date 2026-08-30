/**
 * Smart Distance-Based Doorstep Delivery Pricing Utility
 * 
 * Rules:
 * - 0 - 5 km: FREE Delivery (₹0)
 * - 5 - 10 km: Bikes/Scooters: ₹50 | Cars/SUVs: ₹80
 * - 10 - 20 km: Bikes/Scooters: ₹100 | Cars/SUVs: ₹150
 * - 20 - 35 km: Bikes/Scooters: ₹199 | Cars/SUVs: ₹299
 * - > 35 km: Out of doorstep radius (Hub Self-Pickup recommended)
 */

export interface DeliveryCalculation {
  distanceKm: number;
  feeINR: number;
  isFree: boolean;
  isOutOfRange: boolean;
  tierName: string;
  badgeText: string;
  badgeColor: string;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place e.g. 4.2 km
}

export function calculateDeliveryFee(
  distanceKm: number,
  vehicleType: string = "car"
): DeliveryCalculation {
  const isCar = vehicleType.toLowerCase().includes("car") || vehicleType.toLowerCase().includes("suv");

  // 1. Tier 1: 0 - 5 km (FREE)
  if (distanceKm <= 5.0) {
    return {
      distanceKm,
      feeINR: 0,
      isFree: true,
      isOutOfRange: false,
      tierName: "FREE Express Zone (0-5 km)",
      badgeText: "⚡ FREE Delivery (Within 5 km)",
      badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    };
  }

  // 2. Tier 2: 5 - 10 km
  if (distanceKm <= 10.0) {
    const fee = isCar ? 80 : 50;
    return {
      distanceKm,
      feeINR: fee,
      isFree: false,
      isOutOfRange: false,
      tierName: "City Zone (5-10 km)",
      badgeText: `Standard City Delivery (+₹${fee})`,
      badgeColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    };
  }

  // 3. Tier 3: 10 - 20 km
  if (distanceKm <= 20.0) {
    const fee = isCar ? 150 : 100;
    return {
      distanceKm,
      feeINR: fee,
      isFree: false,
      isOutOfRange: false,
      tierName: "Extended Zone (10-20 km)",
      badgeText: `Extended Zone Delivery (+₹${fee})`,
      badgeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    };
  }

  // 4. Tier 4: 20 - 35 km
  if (distanceKm <= 35.0) {
    const fee = isCar ? 299 : 199;
    return {
      distanceKm,
      feeINR: fee,
      isFree: false,
      isOutOfRange: false,
      tierName: "Outer City / Airport (20-35 km)",
      badgeText: `Outer City Drop (+₹${fee})`,
      badgeColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    };
  }

  // 5. Tier 5: > 35 km (Out of Range)
  return {
    distanceKm,
    feeINR: isCar ? 350 : 250,
    isFree: false,
    isOutOfRange: true,
    tierName: "Beyond Doorstep Radius (>35 km)",
    badgeText: "Hub Self-Pickup Recommended (>35 km)",
    badgeColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  };
}
