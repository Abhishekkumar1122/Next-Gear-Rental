import { Booking, DeliveryJob, Driver } from "@/lib/types";

export const bookingsStore: Booking[] = [
  {
    id: "bk-1",
    vehicleId: "veh-1",
    userName: "Aarav Sharma",
    userEmail: "aarav@example.com",
    city: "Delhi",
    startDate: "2026-02-22",
    endDate: "2026-02-24",
    totalAmountINR: 4600,
    currency: "INR",
    status: "confirmed",
    createdAt: new Date().toISOString(),
    timezone: "Asia/Kolkata",
  },
];

export const driversStore: Driver[] = [
  {
    id: "drv-1",
    name: "Rahul Verma",
    phone: "+91-98980-11223",
    vehicleNumber: "DL-10-AX-4521",
    active: true,
    currentLat: 28.6139,
    currentLng: 77.209,
    lastActiveAt: new Date().toISOString(),
  },
];

export const deliveryJobsStore: DeliveryJob[] = [
  {
    id: "job-1",
    bookingId: "bk-1",
    type: "delivery",
    status: "en_route",
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    assignedDriverId: "drv-1",
    startLat: 28.5562,
    startLng: 77.1,
    endLat: 28.6139,
    endLng: 77.209,
    liveLat: 28.598,
    liveLng: 77.18,
    lastLocationAt: new Date().toISOString(),
    notes: "Airport pickup - terminal 2",
    otpHint: "**42",
    createdAt: new Date().toISOString(),
  },
];

export const deliveryOtpStore: Record<string, string> = {
  "job-1": "774542",
};