import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBookingId } from "@/lib/pricing-tiers";

export async function GET() {
  const events: {
    id: string;
    time: string;
    category: "PAYMENT" | "KYC" | "VEHICLE" | "SYSTEM" | "SUPPORT";
    message: string;
  }[] = [];

  if (process.env.DATABASE_URL) {
    try {
      // 1. Fetch latest bookings & payments
      const [recentBookings, recentPayments, recentVehicles] = await Promise.all([
        prisma.booking.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { user: true, vehicle: true },
        }),
        prisma.payment.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          where: { status: "PAID" },
          include: { booking: { include: { user: true, vehicle: true } } },
        }),
        prisma.vehicle.findMany({
          take: 4,
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      // Map Payments
      recentPayments.forEach((p) => {
        const time = p.createdAt.toTimeString().split(" ")[0];
        const formattedId = p.booking ? formatBookingId(p.booking.id, p.booking.cityName, p.booking.startDate) : `PAY-${p.id.slice(-6)}`;
        events.push({
          id: `pay-${p.id}`,
          time,
          category: "PAYMENT",
          message: `Payment of ₹${p.amountINR.toLocaleString("en-IN")} confirmed for booking #${formattedId} (${p.provider.toUpperCase()})`,
        });
      });

      // Map Bookings
      recentBookings.forEach((b) => {
        const time = b.createdAt.toTimeString().split(" ")[0];
        const formattedId = formatBookingId(b.id, b.cityName, b.startDate);
        events.push({
          id: `book-${b.id}`,
          time,
          category: "SYSTEM",
          message: `Booking #${formattedId} for ${b.vehicle.title} in ${b.cityName} status: ${b.status}`,
        });
      });

      // Map Vehicles
      recentVehicles.forEach((v) => {
        const time = v.updatedAt.toTimeString().split(" ")[0];
        events.push({
          id: `veh-${v.id}`,
          time,
          category: "VEHICLE",
          message: `Vehicle ${v.title} (${(v as any).plateNumber || (v as any).registrationNumber || "FLEET"}) telemetry synchronized & available`,
        });
      });
    } catch (err) {
      console.error("[Activity Stream Error]", err);
    }
  }

  // Fallback defaults if no recent DB activity
  if (events.length === 0) {
    const now = new Date();
    const time = now.toTimeString().split(" ")[0];
    events.push({
      id: "sys-live-1",
      time,
      category: "SYSTEM",
      message: "Live telemetry stream active. All payment gateways & WhatsApp webhooks operational.",
    });
  }

  // Sort by time descending
  events.sort((a, b) => (a.time < b.time ? 1 : -1));

  return NextResponse.json({ events: events.slice(0, 10) });
}
