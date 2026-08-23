import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UserModerationStatus = "approved" | "blacklisted";

export type UserModerationDetails = {
  status: UserModerationStatus;
  reason?: string;
  customMessage?: string;
  blockCount: number;
  appealText?: string;
  blockedAt?: string;
};

const inMemoryUserOverrides = new Map<string, UserModerationStatus>();
const inMemoryUserReasons = new Map<string, string>();
const inMemoryUserMessages = new Map<string, string>();
const inMemoryUserBlockCounts = new Map<string, number>();
const inMemoryUserAppeals = new Map<string, string>();
const inMemoryUserBlockedAt = new Map<string, string>();

let hasEnsuredTable = false;

async function ensureUserModerationTable() {
  if (!process.env.DATABASE_URL || hasEnsuredTable) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserModerationStatus" (
        user_id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'approved',
        reason TEXT,
        custom_message TEXT,
        block_count INTEGER DEFAULT 0,
        appeal_text TEXT,
        blocked_at TIMESTAMP(3),
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserModerationStatus" ADD COLUMN IF NOT EXISTS custom_message TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserModerationStatus" ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP(3);
    `);
  } catch (err) {
    console.warn("User moderation table initialization warning:", err);
  }

  hasEnsuredTable = true;
}

type UserModerationRow = {
  user_id: string;
  status: string;
  reason: string | null;
  custom_message: string | null;
  block_count: number | null;
  appeal_text: string | null;
  blocked_at: Date | null;
};

export async function getUserModerationDetails(
  userId: string,
  fallback: UserModerationStatus = "approved"
): Promise<UserModerationDetails> {
  if (!process.env.DATABASE_URL) {
    const override = inMemoryUserOverrides.get(userId);
    if (override) {
      return {
        status: override,
        reason: inMemoryUserReasons.get(userId) || undefined,
        customMessage: inMemoryUserMessages.get(userId) || undefined,
        blockCount: inMemoryUserBlockCounts.get(userId) || 0,
        appealText: inMemoryUserAppeals.get(userId) || undefined,
        blockedAt: inMemoryUserBlockedAt.get(userId) || undefined,
      };
    }
    return { status: fallback, blockCount: 0 };
  }

  await ensureUserModerationTable();

  try {
    const rows = await prisma.$queryRaw<UserModerationRow[]>(Prisma.sql`
      SELECT user_id, status, reason, custom_message, block_count, appeal_text, blocked_at
      FROM "UserModerationStatus"
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    if (!rows.length) {
      return { status: fallback, blockCount: 0 };
    }

    const row = rows[0];
    const status = row.status === "blacklisted" ? "blacklisted" : "approved";

    return {
      status,
      reason: row.reason || undefined,
      customMessage: row.custom_message || undefined,
      blockCount: row.block_count ? Number(row.block_count) : 0,
      appealText: row.appeal_text || undefined,
      blockedAt: row.blocked_at ? new Date(row.blocked_at).toISOString() : undefined,
    };
  } catch (e) {
    console.warn("getUserModerationDetails error:", e);
    return { status: fallback, blockCount: 0 };
  }
}

export async function setUserModerationStatus(
  userId: string,
  status: UserModerationStatus,
  reason?: string,
  customMessage?: string
): Promise<UserModerationDetails> {
  if (!process.env.DATABASE_URL) {
    inMemoryUserOverrides.set(userId, status);
    if (status === "blacklisted") {
      if (reason) inMemoryUserReasons.set(userId, reason);
      if (customMessage) inMemoryUserMessages.set(userId, customMessage);
      const prevCount = inMemoryUserBlockCounts.get(userId) || 0;
      inMemoryUserBlockCounts.set(userId, prevCount + 1);
      inMemoryUserBlockedAt.set(userId, new Date().toISOString());
      inMemoryUserAppeals.delete(userId);
    }
    return {
      status,
      reason: inMemoryUserReasons.get(userId),
      customMessage: inMemoryUserMessages.get(userId),
      blockCount: inMemoryUserBlockCounts.get(userId) || 0,
      appealText: inMemoryUserAppeals.get(userId),
      blockedAt: inMemoryUserBlockedAt.get(userId),
    };
  }

  await ensureUserModerationTable();

  const isBlocked = status === "blacklisted";

  try {
    const existing = await getUserModerationDetails(userId);
    const newBlockCount = isBlocked ? existing.blockCount + 1 : existing.blockCount;

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "UserModerationStatus" (user_id, status, reason, custom_message, block_count, appeal_text, blocked_at, updated_at)
      VALUES (
        ${userId},
        ${status},
        ${isBlocked ? reason ?? null : null},
        ${isBlocked ? customMessage ?? null : null},
        ${newBlockCount},
        ${isBlocked ? null : existing.appealText ?? null},
        ${isBlocked ? new Date() : null},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        status = ${status},
        reason = ${isBlocked ? reason ?? Prisma.sql`"UserModerationStatus".reason` : null},
        custom_message = ${isBlocked ? customMessage ?? Prisma.sql`"UserModerationStatus".custom_message` : null},
        block_count = ${newBlockCount},
        appeal_text = ${isBlocked ? null : Prisma.sql`"UserModerationStatus".appeal_text`},
        blocked_at = ${isBlocked ? new Date() : null},
        updated_at = CURRENT_TIMESTAMP
    `);

    return getUserModerationDetails(userId);
  } catch (e) {
    console.error("setUserModerationStatus error:", e);
    return { status, blockCount: 0 };
  }
}
