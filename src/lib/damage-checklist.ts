import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DamageChecklistPhase = "pickup" | "dropoff";

export type DamageChecklistEntry = {
  id: string;
  bookingId: string;
  userEmail: string;
  phase: DamageChecklistPhase;
  checklist: {
    bodyPanelsOk: boolean;
    lightsOk: boolean;
    tyresOk: boolean;
    windshieldOk: boolean;
    mirrorsOk: boolean;
    interiorOk: boolean;
  };
  fuelLevel: string;
  odometerKm: number;
  notes?: string;
  photoUrls: string[];
  issueCount: number;
  createdAt: string;
};

type DamageRow = {
  id: string;
  booking_id: string;
  user_email: string;
  phase: string;
  checklist_json: string;
  fuel_level: string;
  odometer_km: number;
  notes: string | null;
  photo_urls_json: string;
  issue_count: number;
  created_at: Date;
};

const inMemoryDamageEntries: DamageChecklistEntry[] = [];
let ensured = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapRow(row: DamageRow): DamageChecklistEntry {
  return {
    id: row.id,
    bookingId: row.booking_id,
    userEmail: row.user_email,
    phase: row.phase === "dropoff" ? "dropoff" : "pickup",
    checklist: JSON.parse(row.checklist_json),
    fuelLevel: row.fuel_level,
    odometerKm: row.odometer_km,
    notes: row.notes ?? undefined,
    photoUrls: JSON.parse(row.photo_urls_json || "[]"),
    issueCount: row.issue_count,
    createdAt: row.created_at.toISOString(),
  };
}

async function ensureTable() {
  if (!process.env.DATABASE_URL || ensured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DamageChecklist" (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      phase TEXT NOT NULL,
      checklist_json TEXT NOT NULL,
      fuel_level TEXT NOT NULL,
      odometer_km INT NOT NULL,
      notes TEXT,
      photo_urls_json TEXT NOT NULL DEFAULT '[]',
      issue_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "DamageChecklist_booking_phase_idx"
    ON "DamageChecklist"(booking_id, phase)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "DamageChecklist_user_email_idx"
    ON "DamageChecklist"(user_email)
  `);

  ensured = true;
}

function countIssues(checklist: DamageChecklistEntry["checklist"]) {
  return Object.values(checklist).filter((item) => !item).length;
}

export async function submitDamageChecklist(input: {
  bookingId: string;
  userEmail: string;
  phase: DamageChecklistPhase;
  checklist: DamageChecklistEntry["checklist"];
  fuelLevel: string;
  odometerKm: number;
  notes?: string;
  photoUrls?: string[];
}) {
  const entry: DamageChecklistEntry = {
    id: randomUUID(),
    bookingId: input.bookingId.trim(),
    userEmail: normalizeEmail(input.userEmail),
    phase: input.phase,
    checklist: input.checklist,
    fuelLevel: input.fuelLevel.trim(),
    odometerKm: input.odometerKm,
    notes: input.notes?.trim() || undefined,
    photoUrls: (input.photoUrls ?? []).map((url) => url.trim()).filter(Boolean),
    issueCount: countIssues(input.checklist),
    createdAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    inMemoryDamageEntries.unshift(entry);
    return entry;
  }

  await ensureTable();

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "DamageChecklist" (
        id, booking_id, user_email, phase, checklist_json, fuel_level, odometer_km, notes, photo_urls_json, issue_count, created_at
      )
      VALUES (
        ${entry.id}, ${entry.bookingId}, ${entry.userEmail}, ${entry.phase}, ${JSON.stringify(entry.checklist)}, ${entry.fuelLevel},
        ${entry.odometerKm}, ${entry.notes ?? null}, ${JSON.stringify(entry.photoUrls)}, ${entry.issueCount}, NOW()
      )
    `,
  );

  return entry;
}

export async function listDamageChecklistsByEmail(userEmail: string) {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return inMemoryDamageEntries.filter((entry) => entry.userEmail === normalizedEmail);
  }

  await ensureTable();
  const rows = await prisma.$queryRaw<DamageRow[]>(Prisma.sql`
    SELECT id, booking_id, user_email, phase, checklist_json, fuel_level, odometer_km, notes, photo_urls_json, issue_count, created_at
    FROM "DamageChecklist"
    WHERE LOWER(user_email) = LOWER(${normalizedEmail})
    ORDER BY created_at DESC
    LIMIT 30
  `);

  return rows.map(mapRow);
}
