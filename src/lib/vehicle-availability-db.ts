import { prisma } from "@/lib/prisma";
import {
  normalizeAvailabilityStatus,
  type VehicleAvailabilityOverride,
  type VehicleAvailabilityStatus,
} from "@/lib/vehicle-availability";

let ensuredTable = false;

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VehicleAvailabilityOverride" (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      unavailable_until DATE,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "VehicleAvailabilityOverride" ADD COLUMN IF NOT EXISTS note TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "VehicleAvailabilityOverride" ADD COLUMN IF NOT EXISTS unavailable_until DATE`,
  );

  ensuredTable = true;
}

export async function getVehicleAvailabilityOverrides() {
  if (!process.env.DATABASE_URL) return new Map<string, VehicleAvailabilityOverride>();
  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<
    Array<{ vehicle_id: string; status: string; note: string | null; unavailable_until: Date | null }>
  >(
    `SELECT vehicle_id, status, note, unavailable_until FROM "VehicleAvailabilityOverride"`,
  );

  const map = new Map<string, VehicleAvailabilityOverride>();
  for (const row of rows) {
    map.set(row.vehicle_id, {
      status: normalizeAvailabilityStatus(row.status),
      note: row.note ?? undefined,
      unavailableUntil: row.unavailable_until
        ? row.unavailable_until.toISOString().slice(0, 10)
        : undefined,
    });
  }
  return map;
}

export async function setVehicleAvailabilityOverride(
  vehicleId: string,
  payload: VehicleAvailabilityOverride,
) {
  if (!process.env.DATABASE_URL) return;
  await ensureTable();

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "VehicleAvailabilityOverride" (id, vehicle_id, status, note, unavailable_until, updated_at)
      VALUES ($1, $2, $3, $4, $5::date, NOW())
      ON CONFLICT (vehicle_id)
      DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, unavailable_until = EXCLUDED.unavailable_until, updated_at = NOW()
    `,
    `vao_${vehicleId}`,
    vehicleId,
    payload.status,
    payload.note ?? null,
    payload.unavailableUntil ?? null,
  );
}

export async function getVehicleAvailabilityOverride(vehicleId: string) {
  if (!process.env.DATABASE_URL) return undefined;
  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<
    Array<{ status: string; note: string | null; unavailable_until: Date | null }>
  >(
    `SELECT status, note, unavailable_until FROM "VehicleAvailabilityOverride" WHERE vehicle_id = $1 LIMIT 1`,
    vehicleId,
  );

  if (!rows.length) return undefined;
  return {
    status: normalizeAvailabilityStatus(rows[0].status),
    note: rows[0].note ?? undefined,
    unavailableUntil: rows[0].unavailable_until
      ? rows[0].unavailable_until.toISOString().slice(0, 10)
      : undefined,
  };
}
