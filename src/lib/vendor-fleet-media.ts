import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const inMemoryMedia = new Map<string, string[]>();
let hasEnsuredMediaTable = false;

async function ensureMediaTable() {
  if (!process.env.DATABASE_URL || hasEnsuredMediaTable) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorVehicleMedia" (
      vehicle_id TEXT NOT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VendorVehicleMedia_vehicle_idx"
    ON "VendorVehicleMedia"(vehicle_id, sort_order, created_at)
  `);

  hasEnsuredMediaTable = true;
}

type MediaRow = {
  vehicle_id: string;
  image_url: string;
};

export async function getImageMapForVehicles(vehicleIds: string[]) {
  const map = new Map<string, string[]>();
  for (const vehicleId of vehicleIds) {
    map.set(vehicleId, []);
  }

  if (vehicleIds.length === 0) {
    return map;
  }

  if (!process.env.DATABASE_URL) {
    for (const vehicleId of vehicleIds) {
      map.set(vehicleId, inMemoryMedia.get(vehicleId) ?? []);
    }
    return map;
  }

  await ensureMediaTable();
  const rows = await prisma.$queryRaw<MediaRow[]>(Prisma.sql`
    SELECT vehicle_id, image_url
    FROM "VendorVehicleMedia"
    WHERE vehicle_id IN (${Prisma.join(vehicleIds)})
    ORDER BY sort_order ASC, created_at ASC
  `);

  for (const row of rows) {
    const list = map.get(row.vehicle_id) ?? [];
    list.push(row.image_url);
    map.set(row.vehicle_id, list);
  }

  return map;
}

export async function setImageUrlsForVehicle(vehicleId: string, imageUrls: string[]) {
  const normalized = Array.from(
    new Set(
      imageUrls
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  if (!process.env.DATABASE_URL) {
    inMemoryMedia.set(vehicleId, normalized);
    return normalized;
  }

  await ensureMediaTable();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`DELETE FROM "VendorVehicleMedia" WHERE vehicle_id = ${vehicleId}`);
    if (normalized.length === 0) {
      return;
    }

    const rows = normalized.map((url, index) => Prisma.sql`(${vehicleId}, ${url}, ${index})`);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "VendorVehicleMedia" (vehicle_id, image_url, sort_order)
      VALUES ${Prisma.join(rows)}
    `);
  });

  return normalized;
}

export async function clearMediaForVehicle(vehicleId: string) {
  if (!process.env.DATABASE_URL) {
    inMemoryMedia.delete(vehicleId);
    return;
  }

  await ensureMediaTable();
  await prisma.$executeRaw(Prisma.sql`DELETE FROM "VendorVehicleMedia" WHERE vehicle_id = ${vehicleId}`);
}