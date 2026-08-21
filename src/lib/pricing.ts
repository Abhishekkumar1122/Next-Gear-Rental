export function getEffectiveDailyPrice(type: string, pricePerDayINR: number) {
  return pricePerDayINR;
}

export const exchangeRates = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
};

export function toCurrency(amountINR: number, currency: "INR" | "USD" | "AED") {
  const converted = amountINR * exchangeRates[currency];
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(converted);
}

export function calculateDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

export function calculateHours(startDate: string, endDate: string, startTime: string, endTime: string) {
  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);
  const diff = end.getTime() - start.getTime();
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  return Math.max(hours, 1);
}

export function getHourlyRate(pricePerDayINR: number) {
  return Math.max(1, Math.round(pricePerDayINR / 24));
}

export function calculateHourlyBaseCost(vehicle: {
  pricePerDayINR: number;
  price1HrINR?: number | null;
  price3HrINR?: number | null;
  price6HrINR?: number | null;
  price12HrINR?: number | null;
}, hours: number): number {
  const defaultHourly = Math.max(1, Math.round(vehicle.pricePerDayINR / 24));
  
  if (hours <= 1) {
    return vehicle.price1HrINR ?? defaultHourly;
  }
  if (hours <= 3) {
    return vehicle.price3HrINR ?? (vehicle.price1HrINR ? vehicle.price1HrINR * hours : hours * defaultHourly);
  }
  if (hours <= 6) {
    return vehicle.price6HrINR ?? (vehicle.price3HrINR ? vehicle.price3HrINR * Math.ceil(hours / 3) : hours * defaultHourly);
  }
  if (hours <= 12) {
    return vehicle.price12HrINR ?? (vehicle.price6HrINR ? vehicle.price6HrINR * Math.ceil(hours / 6) : hours * defaultHourly);
  }
  
  return vehicle.pricePerDayINR;
}

export function calculateDailyVehicleCost(
  vehicle: { pricePerDayINR: number; weekendSurgeActive?: boolean },
  startDate: string,
  endDate: string
): number {
  const days = calculateDays(startDate, endDate);
  const start = new Date(startDate);
  let totalCost = 0;

  for (let i = 0; i < days; i++) {
    const current = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayOfWeek = current.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    if (isWeekend && vehicle.weekendSurgeActive) {
      totalCost += Math.round(vehicle.pricePerDayINR * 1.15);
    } else {
      totalCost += vehicle.pricePerDayINR;
    }
  }

  return totalCost;
}

