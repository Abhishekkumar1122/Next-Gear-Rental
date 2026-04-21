import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchAlert, type AlertChannel } from "@/lib/alert-dispatch";

export type WaitlistStatus = "pending" | "notified" | "cancelled";

export type WaitlistEntry = {
  id: string;
  vehicleId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  city: string;
  status: WaitlistStatus;
  source: string;
  createdAt: string;
  notifiedAt?: string;
};

export type WaitlistNotification = {
  id: string;
  waitlistId: string;
  vehicleId: string;
  userEmail: string;
  channel: AlertChannel;
  provider: "mock" | "twilio";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  createdAt: string;
};

const inMemoryWaitlist = new Map<string, WaitlistEntry>();
const inMemoryNotifications: WaitlistNotification[] = [];

let hasEnsuredTables = false;

type WaitlistRow = {
  id: string;
  vehicle_id: string;
  user_email: string;
  user_name: string | null;
  user_phone: string | null;
  city: string;
  status: string;
  source: string;
  created_at: Date;
  notified_at: Date | null;
};

type WaitlistNotificationRow = {
  id: string;
  waitlist_id: string;
  vehicle_id: string;
  user_email: string;
  channel: string;
  provider: string;
  delivery_status: string;
  delivery_error: string | null;
  message: string;
  created_at: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string) {
  if (!phone) return undefined;
  const normalized = phone.replace(/[^\d+]/g, "").trim();
  return normalized || undefined;
}

function normalizeStatus(status: string): WaitlistStatus {
  return status === "notified" || status === "cancelled" ? status : "pending";
}

function mapWaitlistRow(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    userEmail: row.user_email,
    userName: row.user_name ?? undefined,
    userPhone: row.user_phone ?? undefined,
    city: row.city,
    status: normalizeStatus(row.status),
    source: row.source || "web",
    createdAt: row.created_at.toISOString(),
    notifiedAt: row.notified_at?.toISOString(),
  };
}

function mapNotificationRow(row: WaitlistNotificationRow): WaitlistNotification {
  return {
    id: row.id,
    waitlistId: row.waitlist_id,
    vehicleId: row.vehicle_id,
    userEmail: row.user_email,
    channel: row.channel === "sms" ? "sms" : "email",
    provider: row.provider === "twilio" ? "twilio" : "mock",
    deliveryStatus: row.delivery_status === "failed" ? "failed" : "sent",
    deliveryError: row.delivery_error ?? undefined,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  };
}

async function ensureWaitlistTables() {
  if (!process.env.DATABASE_URL || hasEnsuredTables) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VehicleWaitlist" (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
      user_name TEXT,
      user_phone TEXT,
      city TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT NOT NULL DEFAULT 'web',
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notified_at TIMESTAMP(3),
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WaitlistNotification" (
      id TEXT PRIMARY KEY,
      waitlist_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'email',
      provider TEXT NOT NULL DEFAULT 'mock',
      delivery_status TEXT NOT NULL DEFAULT 'sent',
      delivery_error TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "VehicleWaitlist" ADD COLUMN IF NOT EXISTS user_phone TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "WaitlistNotification" ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "WaitlistNotification" ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'sent'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "WaitlistNotification" ADD COLUMN IF NOT EXISTS delivery_error TEXT`);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VehicleWaitlist_vehicle_status_idx"
    ON "VehicleWaitlist"(vehicle_id, status)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VehicleWaitlist_user_email_idx"
    ON "VehicleWaitlist"(user_email)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WaitlistNotification_user_email_idx"
    ON "WaitlistNotification"(user_email)
  `);

  hasEnsuredTables = true;
}

export async function joinVehicleWaitlist(input: {
  vehicleId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  city: string;
  source?: string;
}) {
  const vehicleId = input.vehicleId.trim();
  const userEmail = normalizeEmail(input.userEmail);
  const userName = input.userName?.trim() || undefined;
  const userPhone = normalizePhone(input.userPhone);
  const city = input.city.trim();
  const source = input.source?.trim() || "web";

  if (!vehicleId || !userEmail || !city) {
    throw new Error("Vehicle, email, and city are required");
  }

  if (!process.env.DATABASE_URL) {
    const existing = Array.from(inMemoryWaitlist.values()).find(
      (entry) => entry.vehicleId === vehicleId && entry.userEmail === userEmail && entry.status === "pending",
    );
    if (existing) {
      return { entry: existing, alreadyJoined: true };
    }

    const entry: WaitlistEntry = {
      id: randomUUID(),
      vehicleId,
      userEmail,
      userName,
      userPhone,
      city,
      status: "pending",
      source,
      createdAt: new Date().toISOString(),
    };
    inMemoryWaitlist.set(entry.id, entry);
    return { entry, alreadyJoined: false };
  }

  await ensureWaitlistTables();

  const existingRows = await prisma.$queryRaw<WaitlistRow[]>(Prisma.sql`
    SELECT id, vehicle_id, user_email, user_name, user_phone, city, status, source, created_at, notified_at
    FROM "VehicleWaitlist"
    WHERE vehicle_id = ${vehicleId}
      AND LOWER(user_email) = LOWER(${userEmail})
      AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (existingRows.length) {
    return { entry: mapWaitlistRow(existingRows[0]), alreadyJoined: true };
  }

  const id = randomUUID();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "VehicleWaitlist" (
        id, vehicle_id, user_email, user_name, user_phone, city, status, source, created_at, updated_at
      )
      VALUES (
        ${id}, ${vehicleId}, ${userEmail}, ${userName ?? null}, ${userPhone ?? null}, ${city}, 'pending', ${source}, NOW(), NOW()
      )
    `,
  );

  return {
    entry: {
      id,
      vehicleId,
      userEmail,
      userName,
      userPhone,
      city,
      status: "pending",
      source,
      createdAt: new Date().toISOString(),
    },
    alreadyJoined: false,
  };
}

export async function listWaitlistByEmail(userEmail: string) {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return Array.from(inMemoryWaitlist.values())
      .filter((entry) => entry.userEmail === normalizedEmail)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await ensureWaitlistTables();
  const rows = await prisma.$queryRaw<WaitlistRow[]>(Prisma.sql`
    SELECT id, vehicle_id, user_email, user_name, user_phone, city, status, source, created_at, notified_at
    FROM "VehicleWaitlist"
    WHERE LOWER(user_email) = LOWER(${normalizedEmail})
    ORDER BY created_at DESC
  `);

  return rows.map(mapWaitlistRow);
}

export async function listWaitlistNotificationsByEmail(userEmail: string) {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return inMemoryNotifications
      .filter((item) => item.userEmail === normalizedEmail)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await ensureWaitlistTables();
  const rows = await prisma.$queryRaw<WaitlistNotificationRow[]>(Prisma.sql`
    SELECT id, waitlist_id, vehicle_id, user_email, channel, provider, delivery_status, delivery_error, message, created_at
    FROM "WaitlistNotification"
    WHERE LOWER(user_email) = LOWER(${normalizedEmail})
    ORDER BY created_at DESC
  `);

  return rows.map(mapNotificationRow);
}

export async function processWaitlistForVehicleRelease(input: {
  vehicleId: string;
  vehicleTitle?: string;
  reason?: string;
}) {
  const vehicleId = input.vehicleId.trim();
  if (!vehicleId) {
    return { notifiedCount: 0 };
  }

  if (!process.env.DATABASE_URL) {
    const pendingEntries = Array.from(inMemoryWaitlist.values()).filter(
      (entry) => entry.vehicleId === vehicleId && entry.status === "pending",
    );

    for (const entry of pendingEntries) {
      const message = buildNotificationMessage({
        vehicleTitle: input.vehicleTitle,
        city: entry.city,
        reason: input.reason,
      });
      const channel: AlertChannel = entry.userPhone ? "sms" : "email";
      const dispatch = await dispatchAlert({
        channel,
        to: channel === "sms" ? entry.userPhone! : entry.userEmail,
        message,
      });

      inMemoryWaitlist.set(entry.id, {
        ...entry,
        status: "notified",
        notifiedAt: new Date().toISOString(),
      });
      inMemoryNotifications.push({
        id: randomUUID(),
        waitlistId: entry.id,
        vehicleId,
        userEmail: entry.userEmail,
        channel,
        provider: dispatch.provider,
        deliveryStatus: dispatch.deliveryStatus,
        deliveryError: dispatch.error,
        message,
        createdAt: new Date().toISOString(),
      });
    }

    return { notifiedCount: pendingEntries.length };
  }

  await ensureWaitlistTables();

  const pendingRows = await prisma.$queryRaw<WaitlistRow[]>(Prisma.sql`
    SELECT id, vehicle_id, user_email, user_name, user_phone, city, status, source, created_at, notified_at
    FROM "VehicleWaitlist"
    WHERE vehicle_id = ${vehicleId}
      AND status = 'pending'
    ORDER BY created_at ASC
  `);

  if (!pendingRows.length) {
    return { notifiedCount: 0 };
  }

  await prisma.$transaction(async (tx) => {
    for (const row of pendingRows) {
      const message = buildNotificationMessage({
        vehicleTitle: input.vehicleTitle,
        city: row.city,
        reason: input.reason,
      });
      const channel: AlertChannel = row.user_phone ? "sms" : "email";
      const destination = channel === "sms" ? row.user_phone! : row.user_email;
      const dispatch = await dispatchAlert({ channel, to: destination, message });

      await tx.$executeRaw(
        Prisma.sql`
          UPDATE "VehicleWaitlist"
          SET status = 'notified', notified_at = NOW(), updated_at = NOW()
          WHERE id = ${row.id}
        `,
      );

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "WaitlistNotification" (
            id, waitlist_id, vehicle_id, user_email, channel, provider, delivery_status, delivery_error, message, created_at
          )
          VALUES (
            ${randomUUID()}, ${row.id}, ${vehicleId}, ${row.user_email}, ${channel}, ${dispatch.provider}, ${dispatch.deliveryStatus}, ${dispatch.error ?? null}, ${message}, NOW()
          )
        `,
      );
    }
  });

  return { notifiedCount: pendingRows.length };
}

function buildNotificationMessage(input: { vehicleTitle?: string; city: string; reason?: string }) {
  const rideName = input.vehicleTitle?.trim() || "Your requested vehicle";
  const message = `${rideName} in ${input.city} is available again. Book now before it gets taken.`;
  if (!input.reason?.trim()) {
    return message;
  }

  return `${message} Note: ${input.reason.trim()}`;
}
