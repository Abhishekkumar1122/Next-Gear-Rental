import { prisma } from "@/lib/prisma";

export type TrendingRideConfig = {
  vehicleId: string;
  badge: string;
  rank: number;
};

const runtimeTrendingStore = new Map<string, TrendingRideConfig>();
let ensuredTable = false;

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "HomeTrendingRide" (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT UNIQUE NOT NULL,
      badge TEXT NOT NULL DEFAULT 'Trending',
      rank INTEGER NOT NULL DEFAULT 99,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "HomeTrendingRide" ADD COLUMN IF NOT EXISTS badge TEXT NOT NULL DEFAULT 'Trending'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "HomeTrendingRide" ADD COLUMN IF NOT EXISTS rank INTEGER NOT NULL DEFAULT 99`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "HomeTrendingRide" ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`
  );

  ensuredTable = true;
}

export async function getTrendingRideMap() {
  const map = new Map<string, TrendingRideConfig>();

  if (!process.env.DATABASE_URL) {
    for (const [vehicleId, config] of runtimeTrendingStore.entries()) {
      map.set(vehicleId, config);
    }
    return map;
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<
    Array<{ vehicle_id: string; badge: string; rank: number; is_active: boolean }>
  >(
    `SELECT vehicle_id, badge, rank, is_active FROM "HomeTrendingRide" WHERE is_active = TRUE`
  );

  for (const row of rows) {
    map.set(row.vehicle_id, {
      vehicleId: row.vehicle_id,
      badge: row.badge,
      rank: row.rank,
    });
  }

  return map;
}

export async function setTrendingRide(payload: { vehicleId: string; badge?: string; rank?: number; isTrending: boolean }) {
  const badge = payload.badge?.trim() || "Trending";
  const rank = Number.isFinite(payload.rank) ? Number(payload.rank) : 99;

  if (!process.env.DATABASE_URL) {
    if (!payload.isTrending) {
      runtimeTrendingStore.delete(payload.vehicleId);
      return;
    }

    runtimeTrendingStore.set(payload.vehicleId, {
      vehicleId: payload.vehicleId,
      badge,
      rank,
    });
    return;
  }

  await ensureTable();

  if (!payload.isTrending) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "HomeTrendingRide" WHERE vehicle_id = $1`,
      payload.vehicleId,
    );
    return;
  }

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "HomeTrendingRide" (id, vehicle_id, badge, rank, is_active, updated_at)
      VALUES ($1, $2, $3, $4, TRUE, NOW())
      ON CONFLICT (vehicle_id)
      DO UPDATE SET badge = EXCLUDED.badge, rank = EXCLUDED.rank, is_active = TRUE, updated_at = NOW()
    `,
    `trend_${payload.vehicleId}`,
    payload.vehicleId,
    badge,
    rank,
  );
}
