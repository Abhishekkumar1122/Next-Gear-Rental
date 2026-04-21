import { BookingAddOn, CityConfig, Review, SupportTicket, TicketReply, User, Vendor, VendorReview, Vehicle } from "@/lib/types";

/** Generates ISO date strings starting from `offsetStart` days from today for `count` days */
function rollingDates(offsetStart = 1, count = 8): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetStart + i);
    return d.toISOString().slice(0, 10);
  });
}

function generateHourlySlots(startHour = 8, endHour = 20) {
  return Array.from({ length: endHour - startHour }, (_, index) => {
    const hour = startHour + index;
    return `${String(hour).padStart(2, "0")}:00`;
  });
}

function buildAvailabilitySlots(dates: string[], slots: string[]) {
  return dates.map((date) => ({ date, slots }));
}

export const cityConfigs: CityConfig[] = [
  { name: "Delhi", airport: "Indira Gandhi International Airport" },
  { name: "Mumbai", airport: "Chhatrapati Shivaji Maharaj Airport" },
  { name: "Bengaluru", airport: "Kempegowda International Airport" },
  { name: "Hyderabad", airport: "Rajiv Gandhi International Airport" },
  { name: "Pune", airport: "Pune International Airport" },
];

export const vendors: Vendor[] = [
  { id: "v1", businessName: "Metro Wheels", phone: "+91-9000011111", commissionRate: 20, status: "approved", adminEmail: "metro@example.com", createdAt: "2026-01-15T10:00:00Z" },
  { id: "v2", businessName: "Swift Rides", phone: "+91-9000022222", commissionRate: 18, status: "approved", adminEmail: "swift@example.com", createdAt: "2026-01-20T14:30:00Z" },
  { id: "v3", businessName: "EcoMove", phone: "+91-9000033333", commissionRate: 22, status: "pending", createdAt: "2026-02-20T11:00:00Z" },
];

export const users: User[] = [
  { id: "u1", name: "Aarav Sharma", email: "aarav@example.com", role: "CUSTOMER", kycStatus: "approved", createdAt: "2026-01-10T08:00:00Z" },
  { id: "u2", name: "Priya Patel", email: "priya@example.com", role: "CUSTOMER", kycStatus: "approved", createdAt: "2026-01-15T09:30:00Z" },
  { id: "u3", name: "Vendor1 Manager", email: "vendor1@example.com", role: "VENDOR", kycStatus: "pending", createdAt: "2026-02-21T10:00:00Z" },
];

export const reviews: Review[] = [
  { id: "r1", vehicleId: "veh-1", userId: "u1", userName: "Aarav Sharma", rating: 5, comment: "Excellent car, smooth ride and great customer service!", createdAt: "2026-02-15T16:25:00Z" },
  { id: "r2", vehicleId: "veh-1", userId: "u2", userName: "Priya Patel", rating: 4, comment: "Good condition, minor issue with AC. But overall satisfied.", createdAt: "2026-02-18T12:40:00Z" },
  { id: "r3", vehicleId: "veh-2", userId: "u1", userName: "Aarav Sharma", rating: 5, comment: "Bike is in perfect condition. Highly recommended!", createdAt: "2026-02-19T14:15:00Z" },
  { id: "r4", vehicleId: "veh-3", userId: "u2", userName: "Priya Patel", rating: 4, comment: "Good scooter for city rides. Smooth handling.", createdAt: "2026-02-20T10:50:00Z" },
];

export const vendorReviews: VendorReview[] = [
  { id: "vr1", vendorId: "v1", userId: "u1", userName: "Aarav Sharma", rating: 5, comment: "Metro Wheels provided excellent service. Very professional!", createdAt: "2026-02-16T15:00:00Z" },
  { id: "vr2", vendorId: "v1", userId: "u2", userName: "Priya Patel", rating: 4, comment: "Good fleet, responsive support team.", createdAt: "2026-02-19T11:30:00Z" },
  { id: "vr3", vendorId: "v2", userId: "u1", userName: "Aarav Sharma", rating: 4, comment: "Swift Rides is reliable. Fair pricing.", createdAt: "2026-02-20T09:45:00Z" },
]

export const bookingAddOns: BookingAddOn[] = [
  { id: "helmet", label: "Helmet", pricePerDayINR: 120, pricePerHourINR: 20 },
  { id: "child-seat", label: "Child seat", pricePerDayINR: 220, pricePerHourINR: 35 },
  { id: "insurance", label: "Damage protection", pricePerDayINR: 320, pricePerHourINR: 45 },
];

export const vehicles: Vehicle[] = [
  {
    id: "veh-1",
    title: "Hyundai i20",
    city: "Delhi",
    type: "car",
    fuel: "petrol",
    transmission: "automatic",
    seats: 5,
    pricePerDayINR: 2300,
    availableDates: rollingDates(1, 8),
    availabilitySlots: buildAvailabilitySlots(rollingDates(1, 8), generateHourlySlots(9, 20)),
    vendorId: "v1",
    airportPickup: true,
    imageUrls: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
    ],
    mileageKmpl: 18,
    engineCc: 1197,
    rating: 4.6,
  },
  {
    id: "veh-2",
    title: "Royal Enfield Classic 350",
    city: "Delhi",
    type: "bike",
    fuel: "petrol",
    transmission: "manual",
    seats: 2,
    pricePerDayINR: 1100,
    availableDates: rollingDates(1, 8),
    availabilitySlots: buildAvailabilitySlots(rollingDates(1, 8), generateHourlySlots(8, 18)),
    vendorId: "v2",
    airportPickup: false,
    imageUrls: [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
    ],
    mileageKmpl: 35,
    engineCc: 349,
    rating: 4.7,
  },
  {
    id: "veh-3",
    title: "Honda Activa 6G",
    city: "Mumbai",
    type: "scooty",
    fuel: "petrol",
    transmission: "automatic",
    seats: 2,
    pricePerDayINR: 700,
    availableDates: rollingDates(1, 8),
    availabilitySlots: buildAvailabilitySlots(rollingDates(1, 8), generateHourlySlots(10, 22)),
    airportPickup: true,
    imageUrls: [
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=800&auto=format&fit=crop",
    ],
    mileageKmpl: 50,
    engineCc: 109,
    rating: 4.4,
  },
  {
    id: "veh-4",
    title: "Tata Nexon EV",
    city: "Bengaluru",
    type: "car",
    fuel: "electric",
    transmission: "automatic",
    seats: 5,
    pricePerDayINR: 3200,
    availableDates: rollingDates(1, 8),
    availabilitySlots: buildAvailabilitySlots(rollingDates(1, 8), generateHourlySlots(9, 19)),
    vendorId: "v1",
    airportPickup: true,
    imageUrls: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=800&auto=format&fit=crop",
    ],
    rangeKm: 312,
    rating: 4.8,
  },
  {
    id: "veh-5",
    title: "TVS Raider",
    city: "Hyderabad",
    type: "bike",
    fuel: "petrol",
    transmission: "manual",
    seats: 2,
    pricePerDayINR: 900,
    availableDates: rollingDates(1, 8),
    availabilitySlots: buildAvailabilitySlots(rollingDates(1, 8), generateHourlySlots(7, 18)),
    airportPickup: false,
    imageUrls: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop",
    ],
    mileageKmpl: 45,
    engineCc: 124,
    rating: 4.5,
  },
  {
    id: "veh-6",
    title: "Maruti Baleno",
    city: "Pune",
    type: "car",
    fuel: "petrol",
    transmission: "manual",
    seats: 5,
    pricePerDayINR: 1900,
    availableDates: rollingDates(1, 8),
    availabilitySlots: buildAvailabilitySlots(rollingDates(1, 8), generateHourlySlots(9, 20)),
    airportPickup: true,
    imageUrls: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=800&auto=format&fit=crop",
    ],
    mileageKmpl: 20,
    engineCc: 1197,
    rating: 4.3,
  },
];

export const supportTickets: SupportTicket[] = [
  { id: "t1", userId: "u1", userName: "Aarav Sharma", userEmail: "aarav@example.com", bookingId: "bk-1", category: "booking", subject: "Booking confirmation not received", description: "I made a booking but didn't receive confirmation email.", priority: "high", status: "in-progress", createdAt: "2026-02-20T10:00:00Z", updatedAt: "2026-02-21T14:30:00Z" },
  { id: "t2", userId: "u2", userName: "Priya Patel", userEmail: "priya@example.com", bookingId: "bk-2", category: "payment", subject: "Payment failed", description: "Payment was declined, but amount was debited. Need refund.", priority: "critical", status: "open", createdAt: "2026-02-22T09:15:00Z", updatedAt: "2026-02-22T09:15:00Z" },
  { id: "t3", userId: "u3", userName: "Vendor1 Manager", userEmail: "vendor1@example.com", vendorId: "v1", category: "vehicle", subject: "Vehicle needs maintenance", description: "Hyundai i20 (veh-1) has AC issue, needs immediate service.", priority: "high", status: "open", createdAt: "2026-02-21T16:45:00Z", updatedAt: "2026-02-21T16:45:00Z" },
  { id: "t4", userId: "u1", userName: "Aarav Sharma", userEmail: "aarav@example.com", category: "account", subject: "Password reset issue", description: "Unable to reset password, recovery email not working.", priority: "medium", status: "resolved", createdAt: "2026-02-15T11:20:00Z", updatedAt: "2026-02-15T15:00:00Z", resolvedAt: "2026-02-15T15:00:00Z" },
];

export const ticketReplies: TicketReply[] = [
  { id: "tr1", ticketId: "t1", userId: "admin", userName: "Administrator", userRole: "admin", message: "We're looking into your booking. Will send confirmation within 2 hours.", createdAt: "2026-02-21T14:30:00Z" },
  { id: "tr2", ticketId: "t2", userId: "admin", userName: "Administrator", userRole: "admin", message: "Payment refund has been initiated. Please allow 3-5 business days.", createdAt: "2026-02-22T09:45:00Z" },
  { id: "tr3", ticketId: "t3", userId: "v1-admin", userName: "Vendor Support", userRole: "admin", message: "Vehicle service has been scheduled. Service center will contact you.", createdAt: "2026-02-21T17:20:00Z" },
];

export const exchangeRates = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
};

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

export function toCurrency(amountINR: number, currency: "INR" | "USD" | "AED") {
  const converted = amountINR * exchangeRates[currency];
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(converted);
}