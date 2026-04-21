import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const inMemoryAvailability = new Map<string, string[]>();

let hasEnsuredTable = false;

async function ensureAvailabilityTable() {
  if (!process.env.DATABASE_URL || hasEnsuredTable) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorVehicleAvailability" (
      vehicle_id TEXT NOT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (vehicle_id, date)
    )
  `);

  hasEnsuredTable = true;
}

type AvailabilityRow = {
  vehicle_id: string;
  date: Date;
};

export async function getAvailabilityMapForVehicles(vehicleIds: string[]) {
  const map = new Map<string, string[]>();
  for (const vehicleId of vehicleIds) {
    map.set(vehicleId, []);
  }

  if (vehicleIds.length === 0) {
    return map;
  }

  if (!process.env.DATABASE_URL) {
    for (const vehicleId of vehicleIds) {
      map.set(vehicleId, inMemoryAvailability.get(vehicleId) ?? []);
    }
    return map;
  }

  await ensureAvailabilityTable();

  const rows = await prisma.$queryRaw<AvailabilityRow[]>(Prisma.sql`
    SELECT vehicle_id, date
    FROM "VendorVehicleAvailability"
    WHERE vehicle_id IN (${Prisma.join(vehicleIds)})
    ORDER BY date ASC
  `);

  for (const row of rows) {
    const existing = map.get(row.vehicle_id) ?? [];
    existing.push(row.date.toISOString().slice(0, 10));
    map.set(row.vehicle_id, existing);
  }

  return map;
}

export async function setAvailabilityDatesForVehicle(vehicleId: string, dates: string[]) {
  const normalized = Array.from(new Set(dates.map((date) => date.trim()).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))).sort();

  if (!process.env.DATABASE_URL) {
    inMemoryAvailability.set(vehicleId, normalized);
    return normalized;
  }

  await ensureAvailabilityTable();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`DELETE FROM "VendorVehicleAvailability" WHERE vehicle_id = ${vehicleId}`);
    if (normalized.length === 0) {
      return;
    }

    const values = normalized.map((date) => Prisma.sql`(${vehicleId}, ${new Date(`${date}T00:00:00.000Z`)})`);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "VendorVehicleAvailability" (vehicle_id, date)
      VALUES ${Prisma.join(values)}
      ON CONFLICT (vehicle_id, date) DO NOTHING
    `);
  });

  return normalized;
}

export async function clearAvailabilityForVehicle(vehicleId: string) {
  if (!process.env.DATABASE_URL) {
    inMemoryAvailability.delete(vehicleId);
    return;
  }

  await ensureAvailabilityTable();
  await prisma.$executeRaw(Prisma.sql`DELETE FROM "VendorVehicleAvailability" WHERE vehicle_id = ${vehicleId}`);
}