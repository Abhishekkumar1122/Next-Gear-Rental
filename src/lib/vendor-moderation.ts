import { Prisma } from "@prisma/client";
import { vendors } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

export type VendorModerationStatus = "pending" | "approved" | "rejected" | "blacklisted";

export type VendorModerationDetails = {
  status: VendorModerationStatus;
  reason?: string;
};

const DEFAULT_BLACKLIST_REASON = "Violation of privacy policy";

const inMemoryOverrides = new Map<string, VendorModerationStatus>();
const inMemoryReasons = new Map<string, string>();
let hasEnsuredTable = false;

async function ensureVendorModerationTable() {
  if (!process.env.DATABASE_URL || hasEnsuredTable) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorModerationStatus" (
      vendor_id TEXT PRIMARY KEY REFERENCES "Vendor"(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'approved',
      reason TEXT,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  hasEnsuredTable = true;
}

function normalizeStatus(value: unknown): VendorModerationStatus {
  if (value === "pending" || value === "approved" || value === "rejected" || value === "blacklisted") {
    return value;
  }
  return "approved";
}

type ModerationRow = {
  vendor_id: string;
  status: string;
  reason: string | null;
};

export async function getVendorModerationDetails(vendorId: string, fallback: VendorModerationStatus = "approved"): Promise<VendorModerationDetails> {
  if (!process.env.DATABASE_URL) {
    const override = inMemoryOverrides.get(vendorId);
    if (override) {
      return { status: override, reason: inMemoryReasons.get(vendorId) || undefined };
    }

    const vendor = vendors.find((item) => item.id === vendorId);
    const status = normalizeStatus(vendor?.status ?? fallback);
    return {
      status,
      reason: status === "blacklisted" ? inMemoryReasons.get(vendorId) || DEFAULT_BLACKLIST_REASON : undefined,
    };
  }

  await ensureVendorModerationTable();

  const rows = await prisma.$queryRaw<ModerationRow[]>(Prisma.sql`
    SELECT vendor_id, status, reason
    FROM "VendorModerationStatus"
    WHERE vendor_id = ${vendorId}
    LIMIT 1
  `);

  if (!rows.length) {
    return { status: fallback };
  }

  const status = normalizeStatus(rows[0].status);
  return {
    status,
    reason: status === "blacklisted" ? rows[0].reason ?? DEFAULT_BLACKLIST_REASON : undefined,
  };
}

export async function getVendorModerationStatus(vendorId: string, fallback: VendorModerationStatus = "approved") {
  const details = await getVendorModerationDetails(vendorId, fallback);
  return details.status;
}

export async function getVendorModerationMap(vendorIds: string[], fallback: VendorModerationStatus = "approved") {
  const map = new Map<string, VendorModerationStatus>();
  for (const vendorId of vendorIds) {
    map.set(vendorId, fallback);
  }

  if (vendorIds.length === 0) {
    return map;
  }

  if (!process.env.DATABASE_URL) {
    for (const vendorId of vendorIds) {
      const override = inMemoryOverrides.get(vendorId);
      if (override) {
        map.set(vendorId, override);
        continue;
      }

      const vendor = vendors.find((item) => item.id === vendorId);
      map.set(vendorId, normalizeStatus(vendor?.status ?? fallback));
    }

    return map;
  }

  await ensureVendorModerationTable();

  const rows = await prisma.$queryRaw<ModerationRow[]>(Prisma.sql`
    SELECT vendor_id, status, reason
    FROM "VendorModerationStatus"
    WHERE vendor_id IN (${Prisma.join(vendorIds)})
  `);

  for (const row of rows) {
    map.set(row.vendor_id, normalizeStatus(row.status));
  }

  return map;
}

export async function setVendorModerationStatus(vendorId: string, status: VendorModerationStatus, reason?: string) {
  const normalizedReason = status === "blacklisted" ? (reason?.trim() || DEFAULT_BLACKLIST_REASON) : undefined;

  if (!process.env.DATABASE_URL) {
    inMemoryOverrides.set(vendorId, status);
    if (normalizedReason) {
      inMemoryReasons.set(vendorId, normalizedReason);
    } else {
      inMemoryReasons.delete(vendorId);
    }
    const vendor = vendors.find((item) => item.id === vendorId);
    if (vendor) {
      vendor.status = status;
    }
    return status;
  }

  await ensureVendorModerationTable();

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "VendorModerationStatus" (vendor_id, status, reason, updated_at)
      VALUES (${vendorId}, ${status}, ${normalizedReason ?? null}, NOW())
      ON CONFLICT (vendor_id)
      DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason, updated_at = NOW()
    `
  );

  return status;
}