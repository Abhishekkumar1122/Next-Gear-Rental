import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchAlert, type AlertChannel } from "@/lib/alert-dispatch";

export type BookingAlertEvent = "booking_confirmed" | "payment_success" | "pickup_reminder" | "return_reminder";

type AlertProfile = {
  userEmail: string;
  phone?: string;
  preferredChannel: AlertChannel;
};

type AlertLog = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  channel: AlertChannel;
  destination?: string;
  provider: "mock" | "twilio" | "whatsapp_cloud";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  dedupeKey?: string;
  createdAt: string;
};

const inMemoryProfiles = new Map<string, AlertProfile>();
const inMemoryLogs: AlertLog[] = [];

let hasEnsuredTables = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string) {
  if (!phone) return undefined;
  const value = phone.replace(/[^\d+]/g, "").trim();
  return value || undefined;
}

async function ensureBookingAlertTables() {
  if (!process.env.DATABASE_URL || hasEnsuredTables) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingAlertProfile" (
      user_email TEXT PRIMARY KEY,
      phone TEXT,
      preferred_channel TEXT NOT NULL DEFAULT 'email',
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingAlertLog" (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      event_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      destination TEXT,
      provider TEXT NOT NULL,
      delivery_status TEXT NOT NULL,
      delivery_error TEXT,
      message TEXT NOT NULL,
      dedupe_key TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure snake_case columns exist on the database table in case it was created by Prisma via schema.prisma with camelCase columns
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS booking_id TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS user_email TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS event_type TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS channel TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS destination TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS provider TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS delivery_status TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS delivery_error TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS dedupe_key TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`);
  
  // Ensure camelCase columns exist in case it was created via raw script
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "bookingId" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "alertType" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3)`);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BookingAlertLog_booking_event_idx"
    ON "BookingAlertLog"(booking_id, event_type)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BookingAlertLog_user_email_idx"
    ON "BookingAlertLog"(user_email)
  `);

  hasEnsuredTables = true;
}

export async function upsertBookingAlertProfile(input: {
  userEmail: string;
  phone?: string;
  preferredChannel?: AlertChannel;
}) {
  const userEmail = normalizeEmail(input.userEmail);
  const phone = normalizePhone(input.phone);
  const preferredChannel: AlertChannel = input.preferredChannel ?? (phone ? "whatsapp" : "email");

  if (!userEmail) return;

  if (!process.env.DATABASE_URL) {
    inMemoryProfiles.set(userEmail, { userEmail, phone, preferredChannel });
    return;
  }

  await ensureBookingAlertTables();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "BookingAlertProfile" (user_email, phone, preferred_channel, updated_at)
      VALUES (${userEmail}, ${phone ?? null}, ${preferredChannel}, NOW())
      ON CONFLICT (user_email)
      DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, "BookingAlertProfile".phone),
        preferred_channel = EXCLUDED.preferred_channel,
        updated_at = NOW()
    `,
  );
}

async function getBookingAlertProfile(userEmail: string): Promise<AlertProfile | undefined> {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return inMemoryProfiles.get(normalizedEmail);
  }

  await ensureBookingAlertTables();
  const rows = await prisma.$queryRaw<
    { user_email: string; phone: string | null; preferred_channel: string }[]
  >(Prisma.sql`
    SELECT user_email, phone, preferred_channel
    FROM "BookingAlertProfile"
    WHERE LOWER(user_email) = LOWER(${normalizedEmail})
    LIMIT 1
  `);

  if (!rows.length) return undefined;
  return {
    userEmail: rows[0].user_email,
    phone: rows[0].phone ?? undefined,
    preferredChannel:
      rows[0].preferred_channel === "sms"
        ? "sms"
        : rows[0].preferred_channel === "whatsapp"
        ? "whatsapp"
        : "email",
  };
}

async function isDuplicateAlert(input: {
  bookingId: string;
  eventType: BookingAlertEvent;
  dedupeKey?: string;
}) {
  if (!input.dedupeKey) return false;

  if (!process.env.DATABASE_URL) {
    return inMemoryLogs.some(
      (item) =>
        item.bookingId === input.bookingId &&
        item.eventType === input.eventType &&
        item.dedupeKey === input.dedupeKey &&
        item.deliveryStatus === "sent",
    );
  }

  await ensureBookingAlertTables();
  const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "BookingAlertLog"
    WHERE booking_id = ${input.bookingId}
      AND event_type = ${input.eventType}
      AND dedupe_key = ${input.dedupeKey}
      AND delivery_status = 'sent'
  `);

  return Number(rows[0]?.count ?? 0) > 0;
}

export async function sendBookingAlert(input: {
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  message: string;
  phone?: string;
  forceChannel?: AlertChannel;
  dedupeKey?: string;
}) {
  const bookingId = input.bookingId.trim();
  const userEmail = normalizeEmail(input.userEmail);

  if (!bookingId || !userEmail || !input.message.trim()) {
    return { sent: false, reason: "invalid_payload" as const };
  }

  if (await isDuplicateAlert({ bookingId, eventType: input.eventType, dedupeKey: input.dedupeKey })) {
    return { sent: false, reason: "duplicate" as const };
  }

  const profile = await getBookingAlertProfile(userEmail);
  const phone = normalizePhone(input.phone) ?? profile?.phone;

  const selectedChannel: AlertChannel = input.forceChannel
    ? input.forceChannel
    : phone
    ? profile?.preferredChannel === "email"
      ? "sms"
      : profile?.preferredChannel ?? "whatsapp"
    : "email";

  const destination = selectedChannel === "email" ? userEmail : phone;
  if (!destination) {
    return { sent: false, reason: "missing_destination" as const };
  }

  // Dual simultaneous dispatch to BOTH Email and WhatsApp
  const dispatch = await dispatchAlert({
    channel: "email",
    to: userEmail,
    message: input.message,
  });

  if (phone) {
    await dispatchAlert({
      channel: "whatsapp",
      to: phone,
      message: input.message,
    });
  }

  const record: AlertLog = {
    id: randomUUID(),
    bookingId,
    userEmail,
    eventType: input.eventType,
    channel: selectedChannel,
    destination,
    provider: dispatch.provider,
    deliveryStatus: dispatch.deliveryStatus,
    deliveryError: dispatch.error,
    message: input.message,
    dedupeKey: input.dedupeKey,
    createdAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    inMemoryLogs.unshift(record);
    return { sent: dispatch.deliveryStatus === "sent", reason: "ok" as const };
  }

  await ensureBookingAlertTables();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "BookingAlertLog" (
        id, booking_id, user_email, event_type, channel, destination, provider, delivery_status,
        delivery_error, message, dedupe_key, created_at,
        "bookingId", "alertType", "sentAt", "createdAt"
      )
      VALUES (
        ${record.id}, ${record.bookingId}, ${record.userEmail}, ${record.eventType}, ${record.channel}, ${record.destination ?? null},
        ${record.provider}, ${record.deliveryStatus}, ${record.deliveryError ?? null}, ${record.message},
        ${record.dedupeKey ?? null}, NOW(),
        ${record.bookingId}, ${record.eventType}, NOW(), NOW()
      )
    `,
  );

  return { sent: dispatch.deliveryStatus === "sent", reason: "ok" as const };
}

export async function sendPaymentSuccessAlertByProviderPaymentId(providerPaymentId: string) {
  if (!process.env.DATABASE_URL || !providerPaymentId.trim()) return;

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId },
    include: {
      booking: {
        include: {
          user: true,
          vehicle: true,
        },
      },
    },
  });

  if (!payment?.booking?.user?.email) return;

  const userEmail = payment.booking.user.email;
  const booking = payment.booking;
  const userPhone = booking.user.phone || undefined;
  const vehicleTitle = booking.vehicle?.title || "Rental Vehicle";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
  const passLink = `${baseUrl.replace(/\/$/, "")}/api/bookings/${booking.id}/pass`;

  // Send rich HTML Booking Confirmation & QR Pass Email
  try {
    const { generateBookingConfirmationEmailHtml } = await import("@/lib/email-templates");
    const { dispatchHtmlEmail } = await import("@/lib/alert-dispatch");
    const html = generateBookingConfirmationEmailHtml({
      bookingId: booking.id,
      customerName: booking.user?.name || "Valued Customer",
      vehicleTitle,
      cityName: booking.cityName,
      startDate: new Date(booking.startDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      endDate: new Date(booking.endDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      totalAmountINR: booking.totalAmountINR,
      baseUrl,
    });
    void dispatchHtmlEmail({
      to: userEmail,
      subject: `Booking Confirmed #${booking.id} - ${vehicleTitle}`,
      html,
    });
  } catch (err) {
    console.error("[Booking Confirmation Email Failed]", err);
  }

  const message = `💳 *NEXT GEAR RENTALS - PAYMENT & BOOKING CONFIRMED* ✅\n\nHello *${booking.user?.name || "Rider"}*,\nYour payment & rental booking have been confirmed!\n\n📌 *Booking ID:* \`${booking.id}\`\n🚘 *Vehicle:* *${vehicleTitle}*\n📍 *City:* ${booking.cityName}\n🗓️ *Dates:* ${booking.startDate.toISOString().slice(0, 10)} to ${booking.endDate.toISOString().slice(0, 10)}\n💰 *Total Paid:* *₹${booking.totalAmountINR.toLocaleString("en-IN")}*\n\n🎟️ *Download Booking Pass & e-Receipt:*\n${passLink}\n\n📞 *24/7 Helpline:* +91-9523765172\nThank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

  await sendBookingAlert({
    bookingId: booking.id,
    userEmail,
    phone: userPhone,
    eventType: "payment_success",
    message,
    forceChannel: userPhone ? "whatsapp" : "email",
    dedupeKey: `payment-success-${providerPaymentId}`,
  });

  // Trigger Tri-Party Alerts (Customer, Vendor, Super Admin)
  void dispatchTriPartyBookingAlerts(booking.id);
}

export async function dispatchTriPartyBookingAlerts(bookingId: string) {
  if (!bookingId || !bookingId.trim()) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
  const passLink = `${baseUrl.replace(/\/$/, "")}/api/bookings/${bookingId}/pass`;

  let bookingData: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    vehicleTitle: string;
    cityName: string;
    startDate: string;
    endDate: string;
    totalAmountINR: number;
    vendorPhone?: string;
    vendorEmail?: string;
    vendorName?: string;
  } | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          vehicle: {
            include: {
              vendor: {
                include: {
                  ownerUser: true,
                },
              },
            },
          },
        },
      });

      if (b) {
        bookingData = {
          id: b.id,
          customerName: b.user.name || "Valued Customer",
          customerEmail: b.user.email || "",
          customerPhone: b.user.phone || undefined,
          vehicleTitle: b.vehicle.title,
          cityName: b.cityName,
          startDate: b.startDate.toISOString().slice(0, 10),
          endDate: b.endDate.toISOString().slice(0, 10),
          totalAmountINR: b.totalAmountINR,
          vendorPhone: b.vehicle.vendor?.ownerUser?.phone || b.vehicle.vendor?.contactPhone || undefined,
          vendorEmail: b.vehicle.vendor?.ownerUser?.email || undefined,
          vendorName: b.vehicle.vendor?.businessName || b.vehicle.vendor?.ownerUser?.name || "Hub Vendor",
        };
      }
    } catch (e) {
      console.error("[Prisma TriParty Fetch Failed]", e);
    }
  }

  // Fallback to memory store if database is empty or not configured
  if (!bookingData) {
    try {
      const { bookingsStore } = await import("@/lib/store");
      const b = bookingsStore.find((item) => item.id === bookingId);
      if (b) {
        bookingData = {
          id: b.id,
          customerName: b.userName || "Valued Customer",
          customerEmail: b.userEmail || "",
          customerPhone: (b as any).userPhone || (b as any).phone || "9523765172",
          vehicleTitle: (b as any).vehicleTitle || "Rental Vehicle",
          cityName: b.city,
          startDate: b.startDate,
          endDate: b.endDate,
          totalAmountINR: b.totalAmountINR,
          vendorPhone: "9523765172",
          vendorEmail: "vendor@next-gear.app",
          vendorName: "Next Gear Hub Vendor",
        };
      }
    } catch (err) {
      console.error("[Memory TriParty Fetch Failed]", err);
    }
  }

  if (!bookingData) return;

  const { dispatchHtmlEmail, dispatchAlert } = await import("@/lib/alert-dispatch");
  const { generateBookingConfirmationEmailHtml } = await import("@/lib/email-templates");

  // 1. CUSTOMER ALERTS (Email + WhatsApp + SMS)
  if (bookingData.customerEmail) {
    try {
      const html = generateBookingConfirmationEmailHtml({
        bookingId: bookingData.id,
        customerName: bookingData.customerName,
        vehicleTitle: bookingData.vehicleTitle,
        cityName: bookingData.cityName,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalAmountINR: bookingData.totalAmountINR,
        baseUrl,
      });
      void dispatchHtmlEmail({
        to: bookingData.customerEmail,
        subject: `Booking Confirmed #${bookingData.id} - ${bookingData.vehicleTitle}`,
        html,
      });
    } catch (err) {
      console.error("[Customer Email Alert Failed]", err);
    }
  }

  const customerWaMsg = `💳 *NEXT GEAR RENTALS - BOOKING CONFIRMED* ✅\n\nHello *${bookingData.customerName}*,\nYour rental booking has been successfully confirmed!\n\n📌 *Booking ID:* \`${bookingData.id}\`\n🚘 *Vehicle:* *${bookingData.vehicleTitle}*\n📍 *City:* ${bookingData.cityName}\n🗓️ *Dates:* ${bookingData.startDate} to ${bookingData.endDate}\n💰 *Total Paid:* *₹${bookingData.totalAmountINR.toLocaleString("en-IN")}*\n\n🎟️ *Download Booking Pass & e-Receipt:*\n${passLink}\n\n📞 *24/7 Helpline:* +91-9523765172\nThank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

  if (bookingData.customerPhone) {
    void dispatchAlert({ channel: "whatsapp", to: bookingData.customerPhone, message: customerWaMsg });
    void dispatchAlert({ channel: "sms", to: bookingData.customerPhone, message: customerWaMsg });
  }

  // 2. VENDOR ALERT (WhatsApp + SMS)
  if (bookingData.vendorPhone) {
    const vendorWaMsg = `🔔 *NEXT GEAR VENDOR ALERT - NEW BOOKING RECEIVED!* 🚘\n\nHello *${bookingData.vendorName}*,\nA new booking has been placed for your vehicle!\n\n📌 *Booking ID:* \`${bookingData.id}\`\n🚘 *Vehicle:* *${bookingData.vehicleTitle}*\n👤 *Customer:* *${bookingData.customerName}* (${bookingData.customerPhone || "Mobile"})\n📍 *City:* ${bookingData.cityName}\n🗓️ *Rental Dates:* ${bookingData.startDate} to ${bookingData.endDate}\n💰 *Booking Value:* ₹${bookingData.totalAmountINR.toLocaleString("en-IN")}\n\nPlease inspect and prepare the vehicle for handover. 🛵`;
    void dispatchAlert({ channel: "whatsapp", to: bookingData.vendorPhone, message: vendorWaMsg });
    void dispatchAlert({ channel: "sms", to: bookingData.vendorPhone, message: vendorWaMsg });
  }

  // 3. SUPER ADMIN ALERT (WhatsApp + SMS to 9523765172 & admin@next-gear.app)
  const adminPhone = process.env.ADMIN_ALERT_PHONE || "9523765172";
  const adminWaMsg = `⚡ *NEXT GEAR ADMIN ALERT - NEW PLATFORM BOOKING!* 🚀\n\n📌 *Booking ID:* \`${bookingData.id}\`\n🚘 *Vehicle:* *${bookingData.vehicleTitle}*\n📍 *City:* ${bookingData.cityName}\n👤 *Customer:* *${bookingData.customerName}* (${bookingData.customerEmail})\n🏢 *Vendor:* ${bookingData.vendorName}\n💰 *Revenue:* *₹${bookingData.totalAmountINR.toLocaleString("en-IN")}*\n🗓️ *Dates:* ${bookingData.startDate} to ${bookingData.endDate}`;

  void dispatchAlert({ channel: "whatsapp", to: adminPhone, message: adminWaMsg });
  void dispatchAlert({ channel: "sms", to: adminPhone, message: adminWaMsg });
}

export type AlertLogListItem = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  channel: AlertChannel;
  destination?: string;
  provider: "mock" | "twilio" | "whatsapp_cloud";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  createdAt: string;
};

export async function listBookingAlertLogs(options?: {
  status?: "sent" | "failed";
  eventType?: BookingAlertEvent;
  channel?: AlertChannel;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 20));

  if (!process.env.DATABASE_URL) {
    const filtered = inMemoryLogs.filter((item) => {
      if (options?.status && item.deliveryStatus !== options.status) return false;
      if (options?.eventType && item.eventType !== options.eventType) return false;
      if (options?.channel && item.channel !== options.channel) return false;
      return true;
    });
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }

  await ensureBookingAlertTables();
  const whereSql = Prisma.sql`
    WHERE 1=1
      ${options?.status ? Prisma.sql`AND delivery_status = ${options.status}` : Prisma.empty}
      ${options?.eventType ? Prisma.sql`AND event_type = ${options.eventType}` : Prisma.empty}
      ${options?.channel ? Prisma.sql`AND channel = ${options.channel}` : Prisma.empty}
  `;

  const countRows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "BookingAlertLog"
    ${whereSql}
  `);

  const rows = await prisma.$queryRaw<
    {
      id: string;
      booking_id: string;
      user_email: string;
      event_type: string;
      channel: string;
      destination: string | null;
      provider: string;
      delivery_status: string;
      delivery_error: string | null;
      message: string;
      created_at: Date;
    }[]
  >(Prisma.sql`
    SELECT id, booking_id, user_email, event_type, channel, destination, provider, delivery_status, delivery_error, message, created_at
    FROM "BookingAlertLog"
    ${whereSql}
    ORDER BY created_at DESC
    OFFSET ${(page - 1) * pageSize}
    LIMIT ${pageSize}
  `);

  const items: AlertLogListItem[] = rows.map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    userEmail: row.user_email,
    eventType: (row.event_type as BookingAlertEvent) || "booking_confirmed",
    channel: row.channel === "sms" ? "sms" : row.channel === "whatsapp" ? "whatsapp" : "email",
    destination: row.destination ?? undefined,
    provider: row.provider === "twilio" ? "twilio" : row.provider === "whatsapp_cloud" ? "whatsapp_cloud" : "mock",
    deliveryStatus: row.delivery_status === "failed" ? "failed" : "sent",
    deliveryError: row.delivery_error ?? undefined,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  }));

  const totalItems = Number(countRows[0]?.count ?? 0);
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

export async function retryBookingAlert(logId: string) {
  const targetId = logId.trim();
  if (!targetId) throw new Error("logId is required");

  let log: AlertLog | undefined;

  if (!process.env.DATABASE_URL) {
    log = inMemoryLogs.find((item) => item.id === targetId);
  } else {
    await ensureBookingAlertTables();
    const rows = await prisma.$queryRaw<
      {
        id: string;
        booking_id: string;
        user_email: string;
        event_type: string;
        channel: string;
        destination: string | null;
        message: string;
      }[]
    >(Prisma.sql`
      SELECT id, booking_id, user_email, event_type, channel, destination, message
      FROM "BookingAlertLog"
      WHERE id = ${targetId}
      LIMIT 1
    `);

    if (rows.length) {
      log = {
        id: rows[0].id,
        bookingId: rows[0].booking_id,
        userEmail: rows[0].user_email,
        eventType: rows[0].event_type as BookingAlertEvent,
        channel: rows[0].channel === "sms" ? "sms" : rows[0].channel === "whatsapp" ? "whatsapp" : "email",
        destination: rows[0].destination ?? undefined,
        provider: "mock",
        deliveryStatus: "failed",
        message: rows[0].message,
        createdAt: new Date().toISOString(),
      };
    }
  }

  if (!log) throw new Error("Alert log not found");

  const profile = await getBookingAlertProfile(log.userEmail);
  const destination = log.destination ?? (log.channel === "email" ? log.userEmail : profile?.phone);
  if (!destination) throw new Error("Missing destination for retry");

  const dispatch = await dispatchAlert({
    channel: log.channel,
    to: destination,
    message: log.message,
  });

  const retryRecord: AlertLog = {
    id: randomUUID(),
    bookingId: log.bookingId,
    userEmail: log.userEmail,
    eventType: log.eventType,
    channel: log.channel,
    destination,
    provider: dispatch.provider,
    deliveryStatus: dispatch.deliveryStatus,
    deliveryError: dispatch.error,
    message: log.message,
    dedupeKey: `retry-${targetId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    inMemoryLogs.unshift(retryRecord);
  } else {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "BookingAlertLog" (
          id, booking_id, user_email, event_type, channel, destination, provider, delivery_status,
          delivery_error, message, dedupe_key, created_at,
          "bookingId", "alertType", "sentAt", "createdAt"
        )
        VALUES (
          ${retryRecord.id}, ${retryRecord.bookingId}, ${retryRecord.userEmail}, ${retryRecord.eventType},
          ${retryRecord.channel}, ${retryRecord.destination ?? null}, ${retryRecord.provider}, ${retryRecord.deliveryStatus},
          ${retryRecord.deliveryError ?? null}, ${retryRecord.message}, ${retryRecord.dedupeKey ?? null}, NOW(),
          ${retryRecord.bookingId}, ${retryRecord.eventType}, NOW(), NOW()
        )
      `,
    );
  }

  return { ok: dispatch.deliveryStatus === "sent", deliveryStatus: dispatch.deliveryStatus, provider: dispatch.provider };
}
