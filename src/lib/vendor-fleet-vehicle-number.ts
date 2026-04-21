import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const inMemoryVehicleNumbers = new Map<string, string>();
let hasEnsuredTable = false;

async function ensureVehicleNumberTable() {
  if (!process.env.DATABASE_URL || hasEnsuredTable) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorVehicleNumber" (
      vehicle_id TEXT PRIMARY KEY REFERENCES "Vehicle"(id) ON DELETE CASCADE,
      vehicle_number TEXT NOT NULL,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  hasEnsuredTable = true;
}

type NumberRow = {
  vehicle_id: string;
  vehicle_number: string;
};

export async function getVehicleNumberMap(vehicleIds: string[]) {
  const map = new Map<string, string>();
  for (const vehicleId of vehicleIds) {
    const number = inMemoryVehicleNumbers.get(vehicleId);
    if (number) {
      map.set(vehicleId, number);
    }
  }

  if (vehicleIds.length === 0 || !process.env.DATABASE_URL) {
    return map;
  }

  await ensureVehicleNumberTable();
  const rows = await prisma.$queryRaw<NumberRow[]>(Prisma.sql`
    SELECT vehicle_id, vehicle_number
    FROM "VendorVehicleNumber"
    WHERE vehicle_id IN (${Prisma.join(vehicleIds)})
  `);

  for (const row of rows) {
    map.set(row.vehicle_id, row.vehicle_number);
  }

  return map;
}

export async function setVehicleNumberForVehicle(vehicleId: string, vehicleNumber?: string) {
  const normalized = vehicleNumber?.trim();

  if (!normalized) {
    if (!process.env.DATABASE_URL) {
      inMemoryVehicleNumbers.delete(vehicleId);
      return;
    }

    await ensureVehicleNumberTable();
    await prisma.$executeRaw(Prisma.sql`DELETE FROM "VendorVehicleNumber" WHERE vehicle_id = ${vehicleId}`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    inMemoryVehicleNumbers.set(vehicleId, normalized);
    return;
  }

  await ensureVehicleNumberTable();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "VendorVehicleNumber" (vehicle_id, vehicle_number, updated_at)
      VALUES (${vehicleId}, ${normalized}, NOW())
      ON CONFLICT (vehicle_id)
      DO UPDATE SET vehicle_number = EXCLUDED.vehicle_number, updated_at = NOW()
    `
  );
}

export async function clearVehicleNumberForVehicle(vehicleId: string) {
  await setVehicleNumberForVehicle(vehicleId, undefined);
}