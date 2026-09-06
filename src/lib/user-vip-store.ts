import { prisma } from "@/lib/prisma";

export type VipTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type VipSource = "auto_rides" | "admin_override" | "purchased_pass";

export interface VipTierConfig {
  tier: VipTier;
  label: string;
  badge: string;
  minRides: number;
  discountPercent: number;
  zeroDeposit: boolean;
  freeDelivery: boolean;
  freeExtraHelmet: boolean;
  freeRidingGear: boolean;
  prioritySupport: boolean;
  airportPerks: boolean;
  freeUpgrade: boolean;
  zeroCancellationFee: boolean;
  colorGradient: string;
  borderColor: string;
  textColor: string;
}

export const VIP_TIER_CONFIGS: Record<VipTier, VipTierConfig> = {
  BRONZE: {
    tier: "BRONZE",
    label: "🥉 Bronze Rider",
    badge: "BRONZE",
    minRides: 0,
    discountPercent: 0,
    zeroDeposit: false,
    freeDelivery: false,
    freeExtraHelmet: false,
    freeRidingGear: false,
    prioritySupport: false,
    airportPerks: false,
    freeUpgrade: false,
    zeroCancellationFee: false,
    colorGradient: "from-zinc-900 to-zinc-950",
    borderColor: "border-zinc-800",
    textColor: "text-zinc-400",
  },
  SILVER: {
    tier: "SILVER",
    label: "🥈 Silver Explorer",
    badge: "SILVER VIP",
    minRides: 3,
    discountPercent: 5,
    zeroDeposit: false,
    freeDelivery: false,
    freeExtraHelmet: true,
    freeRidingGear: false,
    prioritySupport: true,
    airportPerks: false,
    freeUpgrade: false,
    zeroCancellationFee: false,
    colorGradient: "from-slate-900 via-cyan-950/30 to-zinc-950",
    borderColor: "border-cyan-500/40",
    textColor: "text-cyan-300",
  },
  GOLD: {
    tier: "GOLD",
    label: "🥇 Gold Roadmaster",
    badge: "GOLD VIP",
    minRides: 8,
    discountPercent: 10,
    zeroDeposit: true,
    freeDelivery: true,
    freeExtraHelmet: true,
    freeRidingGear: true,
    prioritySupport: true,
    airportPerks: false,
    freeUpgrade: false,
    zeroCancellationFee: false,
    colorGradient: "from-amber-950/40 via-yellow-950/20 to-zinc-950",
    borderColor: "border-amber-500/50",
    textColor: "text-amber-300",
  },
  PLATINUM: {
    tier: "PLATINUM",
    label: "💎 Platinum Sovereign",
    badge: "PLATINUM VIP",
    minRides: 20,
    discountPercent: 15,
    zeroDeposit: true,
    freeDelivery: true,
    freeExtraHelmet: true,
    freeRidingGear: true,
    prioritySupport: true,
    airportPerks: true,
    freeUpgrade: true,
    zeroCancellationFee: true,
    colorGradient: "from-purple-950/50 via-pink-950/30 to-indigo-950/40",
    borderColor: "border-purple-500/60",
    textColor: "text-purple-300",
  },
};

export interface UserVipDetails {
  userId: string;
  tier: VipTier;
  source: VipSource;
  completedRides: number;
  ridesUntilNextTier: number;
  nextTier: VipTier | null;
  expiresAt: string | null;
  config: VipTierConfig;
  allConfigs: Record<VipTier, VipTierConfig>;
}

let hasEnsuredTable = false;

export async function ensureUserVipTable() {
  if (!process.env.DATABASE_URL || hasEnsuredTable) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserVipTier" (
        user_id TEXT PRIMARY KEY,
        tier TEXT NOT NULL DEFAULT 'BRONZE',
        source TEXT NOT NULL DEFAULT 'auto_rides',
        purchased_at TIMESTAMP(3),
        expires_at TIMESTAMP(3),
        completed_rides_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("[UserVipTier Table Init]", err);
  }

  hasEnsuredTable = true;
}

/**
 * Calculates user's completed rides count from Prisma database.
 */
async function getCompletedRidesCount(userId: string, email?: string): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const count = await prisma.booking.count({
      where: {
        OR: [
          { userId },
          ...(email ? [{ user: { email } }] : []),
        ],
        status: {
          in: ["COMPLETED", "CONFIRMED"], // Active confirmed or completed trips count towards loyalty
        },
      },
    });
    return count;
  } catch (e) {
    console.warn("[getCompletedRidesCount Error]", e);
    return 0;
  }
}

/**
 * Resolves full VIP tier details including completed rides, current perks, and next tier progression.
 */
export async function getUserVipDetails(userId: string, email?: string): Promise<UserVipDetails> {
  await ensureUserVipTable();

  let dbRecord: {
    tier: string;
    source: string;
    expires_at: Date | null;
  } | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT tier, source, expires_at FROM "UserVipTier" WHERE user_id = $1 LIMIT 1`,
        userId
      );
      if (Array.isArray(rows) && rows.length > 0) {
        dbRecord = rows[0];
      }
    } catch (e) {
      console.warn("[Fetch UserVipTier Record Error]", e);
    }
  }

  const completedRides = await getCompletedRidesCount(userId, email);

  // Check if active override or purchased pass exists
  let activeTier: VipTier = "BRONZE";
  let activeSource: VipSource = "auto_rides";
  let expiresAt: string | null = null;

  if (dbRecord) {
    const now = new Date();
    const isExpired = dbRecord.expires_at && new Date(dbRecord.expires_at) < now;

    if (!isExpired) {
      if (dbRecord.source === "admin_override") {
        activeTier = (dbRecord.tier as VipTier) || "BRONZE";
        activeSource = "admin_override";
      } else if (dbRecord.source === "purchased_pass") {
        activeTier = "PLATINUM";
        activeSource = "purchased_pass";
        expiresAt = dbRecord.expires_at ? new Date(dbRecord.expires_at).toISOString() : null;
      }
    }
  }

  // If no active override or purchased pass, calculate tier automatically from completed rides
  if (activeSource === "auto_rides") {
    if (completedRides >= VIP_TIER_CONFIGS.PLATINUM.minRides) {
      activeTier = "PLATINUM";
    } else if (completedRides >= VIP_TIER_CONFIGS.GOLD.minRides) {
      activeTier = "GOLD";
    } else if (completedRides >= VIP_TIER_CONFIGS.SILVER.minRides) {
      activeTier = "SILVER";
    } else {
      activeTier = "BRONZE";
    }
  }

  // Calculate next tier & distance
  let nextTier: VipTier | null = null;
  let ridesUntilNextTier = 0;

  if (activeTier === "BRONZE") {
    nextTier = "SILVER";
    ridesUntilNextTier = Math.max(0, VIP_TIER_CONFIGS.SILVER.minRides - completedRides);
  } else if (activeTier === "SILVER") {
    nextTier = "GOLD";
    ridesUntilNextTier = Math.max(0, VIP_TIER_CONFIGS.GOLD.minRides - completedRides);
  } else if (activeTier === "GOLD") {
    nextTier = "PLATINUM";
    ridesUntilNextTier = Math.max(0, VIP_TIER_CONFIGS.PLATINUM.minRides - completedRides);
  } else {
    nextTier = null;
    ridesUntilNextTier = 0;
  }

  return {
    userId,
    tier: activeTier,
    source: activeSource,
    completedRides,
    ridesUntilNextTier,
    nextTier,
    expiresAt,
    config: VIP_TIER_CONFIGS[activeTier],
    allConfigs: VIP_TIER_CONFIGS,
  };
}

/**
 * Admin direct override — sets any tier for a user permanently in the database.
 */
export async function setUserVipTierByAdmin(userId: string, tier: VipTier): Promise<void> {
  await ensureUserVipTable();
  if (!process.env.DATABASE_URL) return;

  try {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "UserVipTier" (user_id, tier, source, updated_at)
      VALUES ($1, $2, 'admin_override', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        tier = $2,
        source = 'admin_override',
        updated_at = CURRENT_TIMESTAMP
      `,
      userId,
      tier
    );
  } catch (e) {
    console.error("[setUserVipTierByAdmin Error]", e);
    throw e;
  }
}

/**
 * Customer pass activation — activates Platinum Pass with validity duration.
 */
export async function purchasePlatinumPass(
  userId: string,
  durationMonths: number = 1
): Promise<{ success: boolean; expiresAt: string }> {
  await ensureUserVipTable();
  if (!process.env.DATABASE_URL) return { success: false, expiresAt: "" };

  const expiresDate = new Date();
  expiresDate.setMonth(expiresDate.getMonth() + durationMonths);

  try {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "UserVipTier" (user_id, tier, source, purchased_at, expires_at, updated_at)
      VALUES ($1, 'PLATINUM', 'purchased_pass', CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        tier = 'PLATINUM',
        source = 'purchased_pass',
        purchased_at = CURRENT_TIMESTAMP,
        expires_at = $2,
        updated_at = CURRENT_TIMESTAMP
      `,
      userId,
      expiresDate
    );

    return {
      success: true,
      expiresAt: expiresDate.toISOString(),
    };
  } catch (e) {
    console.error("[purchasePlatinumPass Error]", e);
    throw e;
  }
}

/**
 * Get just the VIP tier string for a user
 */
export async function getUserVipTier(userId: string, email?: string): Promise<VipTier> {
  const details = await getUserVipDetails(userId, email);
  return details.tier;
}
