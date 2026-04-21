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
  provider: "mock" | "twilio";
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

  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS destination TEXT`);

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

  const dispatch = await dispatchAlert({
    channel: selectedChannel,
    to: destination,
    message: input.message,
  });

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
        delivery_error, message, dedupe_key, created_at
      )
      VALUES (
        ${record.id}, ${record.bookingId}, ${record.userEmail}, ${record.eventType}, ${record.channel}, ${record.destination ?? null},
        ${record.provider}, ${record.deliveryStatus}, ${record.deliveryError ?? null}, ${record.message},
        ${record.dedupeKey ?? null}, NOW()
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
        },
      },
    },
  });

  if (!payment?.booking?.user?.email) return;

  const userEmail = payment.booking.user.email;
  if (!userEmail) return;

  const booking = payment.booking;
  const message = `Payment successful for booking ${booking.id} in ${booking.cityName}. Pickup on ${booking.startDate.toISOString().slice(0, 10)}.`;
  await sendBookingAlert({
    bookingId: booking.id,
    userEmail,
    eventType: "payment_success",
    message,
    dedupeKey: `payment-success-${providerPaymentId}`,
  });
}

export type AlertLogListItem = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  channel: AlertChannel;
  destination?: string;
  provider: "mock" | "twilio";
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
    provider: row.provider === "twilio" ? "twilio" : "mock",
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
          delivery_error, message, dedupe_key, created_at
        )
        VALUES (
          ${retryRecord.id}, ${retryRecord.bookingId}, ${retryRecord.userEmail}, ${retryRecord.eventType},
          ${retryRecord.channel}, ${retryRecord.destination ?? null}, ${retryRecord.provider}, ${retryRecord.deliveryStatus},
          ${retryRecord.deliveryError ?? null}, ${retryRecord.message}, ${retryRecord.dedupeKey ?? null}, NOW()
        )
      `,
    );
  }

  return { ok: dispatch.deliveryStatus === "sent", deliveryStatus: dispatch.deliveryStatus, provider: dispatch.provider };
}
