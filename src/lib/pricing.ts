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
