import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type EmailLogCategory =
  | "welcome"
  | "otp"
  | "booking_confirmed"
  | "payment_success"
  | "trip_reminder"
  | "trip_feedback"
  | "festive_promo"
  | "discount_coupon"
  | "kyc_update"
  | "delivery_assigned"
  | "support_reply"
  | "contact_inquiry"
  | "direct_compose";

export type EmailLogEntry = {
  id: string;
  type: "outgoing" | "incoming";
  category: EmailLogCategory;
  from: string;
  to: string;
  subject: string;
  html?: string;
  message?: string;
  status: "sent" | "failed" | "received";
  error?: string;
  createdAt: string;
};

const inMemoryEmailLogs: EmailLogEntry[] = [
  {
    id: "eml-101",
    type: "outgoing",
    category: "welcome",
    from: "noreply@next-gear.app",
    to: "rahul.sharma@gmail.com",
    subject: "Welcome to Next Gear Rentals! Claim Your First Ride Offer 🎁",
    message: "Welcome to Next Gear Rentals! Use coupon code WELCOME10 for 10% OFF.",
    status: "sent",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "eml-102",
    type: "outgoing",
    category: "booking_confirmed",
    from: "noreply@next-gear.app",
    to: "priya.verma@yahoo.com",
    subject: "Booking Confirmed #NG849102 - Hyundai Creta",
    message: "Your rental booking for Hyundai Creta in Delhi has been confirmed. Pass: https://www.next-gear.app/api/bookings/NG849102/pass",
    status: "sent",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "eml-103",
    type: "incoming",
    category: "contact_inquiry",
    from: "amit.kumar@outlook.com",
    to: "support@next-gear.app",
    subject: "Inquiry about Leh Ladakh Expedition Bike Rental Rates",
    message: "Hi Next Gear Team, I want to rent a Himalayan 450 for 7 days in Leh from June 10. Do you provide luggage carriers and helmet accessories?",
    status: "received",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function logEmailMessage(entry: Omit<EmailLogEntry, "id" | "createdAt">): EmailLogEntry {
  const newEntry: EmailLogEntry = {
    id: `eml-${randomUUID().slice(0, 8)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  };

  inMemoryEmailLogs.unshift(newEntry);

  if (process.env.DATABASE_URL) {
    void (async () => {
      try {
        await (prisma as any).bookingAlertLog.create({
          data: {
            id: newEntry.id,
            bookingId: "system",
            userEmail: newEntry.to,
            eventType: newEntry.category,
            channel: "email",
            destination: newEntry.to,
            provider: "resend",
            deliveryStatus: newEntry.status,
            deliveryError: newEntry.error || null,
            message: `${newEntry.subject}\n\n${newEntry.message || ""}`,
          },
        });
      } catch (err) {
        console.error("[Email Log Database Save Failed]", err);
      }
    })();
  }

  return newEntry;
}

export function getEmailLogs(options?: {
  type?: "outgoing" | "incoming";
  status?: "sent" | "failed" | "received";
  search?: string;
}) {
  let logs = [...inMemoryEmailLogs];

  if (options?.type) {
    logs = logs.filter((l) => l.type === options.type);
  }

  if (options?.status) {
    logs = logs.filter((l) => l.status === options.status);
  }

  if (options?.search?.trim()) {
    const query = options.search.trim().toLowerCase();
    logs = logs.filter(
      (l) =>
        l.to.toLowerCase().includes(query) ||
        l.from.toLowerCase().includes(query) ||
        l.subject.toLowerCase().includes(query) ||
        (l.message && l.message.toLowerCase().includes(query))
    );
  }

  return logs;
}
