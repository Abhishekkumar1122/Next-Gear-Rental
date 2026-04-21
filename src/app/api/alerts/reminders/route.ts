import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { sendBookingAlert } from "@/lib/booking-alerts";

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type ReminderCandidate = {
  bookingId: string;
  userEmail: string;
  city: string;
  startDate: string;
  endDate: string;
};

export async function POST() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = toIsoDate(tomorrow);

  let candidates: ReminderCandidate[] = [];

  if (process.env.DATABASE_URL) {
    const rows = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        OR: [
          { startDate: { gte: new Date(`${targetDate}T00:00:00.000Z`), lt: new Date(`${targetDate}T23:59:59.999Z`) } },
          { endDate: { gte: new Date(`${targetDate}T00:00:00.000Z`), lt: new Date(`${targetDate}T23:59:59.999Z`) } },
        ],
      },
      include: { user: true },
    });

    candidates = rows
      .filter((row) => Boolean(row.user.email))
      .map((row) => ({
        bookingId: row.id,
        userEmail: row.user.email as string,
        city: row.cityName,
        startDate: row.startDate.toISOString().slice(0, 10),
        endDate: row.endDate.toISOString().slice(0, 10),
      }));
  } else {
    candidates = bookingsStore
      .filter((item) => item.status === "confirmed" && (item.startDate === targetDate || item.endDate === targetDate))
      .map((item) => ({
        bookingId: item.id,
        userEmail: item.userEmail,
        city: item.city,
        startDate: item.startDate,
        endDate: item.endDate,
      }));
  }

  let pickupSent = 0;
  let returnSent = 0;

  for (const booking of candidates) {
    if (booking.startDate === targetDate) {
      const result = await sendBookingAlert({
        bookingId: booking.bookingId,
        userEmail: booking.userEmail,
        eventType: "pickup_reminder",
        message: `Reminder: your pickup for booking ${booking.bookingId} in ${booking.city} is tomorrow (${targetDate}).`,
        dedupeKey: `pickup-${targetDate}`,
      });
      if (result.sent) pickupSent += 1;
    }

    if (booking.endDate === targetDate) {
      const result = await sendBookingAlert({
        bookingId: booking.bookingId,
        userEmail: booking.userEmail,
        eventType: "return_reminder",
        message: `Reminder: your return for booking ${booking.bookingId} in ${booking.city} is tomorrow (${targetDate}).`,
        dedupeKey: `return-${targetDate}`,
      });
      if (result.sent) returnSent += 1;
    }
  }

  return NextResponse.json({
    message: "Reminders processed",
    targetDate,
    candidates: candidates.length,
    pickupSent,
    returnSent,
  });
}
