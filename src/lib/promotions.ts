import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PromoEligibility = "all" | "first_ride" | "repeat";
export type DiscountType = "percent" | "flat";

export type CouponCampaign = {
  code: string;
  title: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minSubtotalINR?: number;
  maxDiscountINR?: number;
  city?: string;
  eligibility: PromoEligibility;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive: boolean;
};

export type PromotionBreakdown = {
  subtotalAmountINR: number;
  couponCode?: string;
  couponDiscountINR: number;
  referralCode?: string;
  referralDiscountINR: number;
  totalDiscountINR: number;
  payableAmountINR: number;
  messages: string[];
};

type ReferralProfile = {
  userEmail: string;
  referralCode: string;
  referredByCode?: string;
};

type BookingPromotionRecord = {
  bookingId: string;
  userEmail: string;
  subtotalAmountINR: number;
  couponCode?: string;
  couponDiscountINR: number;
  referralCode?: string;
  referralDiscountINR: number;
  totalAmountINR: number;
};

const DEFAULT_REFERRAL_DISCOUNT_INR = 150;
const DEFAULT_REFERRAL_MIN_SUBTOTAL_INR = 500;

const inMemoryCampaigns = new Map<string, CouponCampaign>([
  [
    "FIRSTRIDE15",
    {
      code: "FIRSTRIDE15",
      title: "First Ride Offer",
      description: "15% off for first-time customers",
      discountType: "percent",
      discountValue: 15,
      minSubtotalINR: 500,
      maxDiscountINR: 1000,
      eligibility: "first_ride",
      isActive: true,
    },
  ],
  [
    "REPEAT200",
    {
      code: "REPEAT200",
      title: "Repeat Rider Reward",
      description: "Flat ₹200 off for returning customers",
      discountType: "flat",
      discountValue: 200,
      minSubtotalINR: 1000,
      eligibility: "repeat",
      isActive: true,
    },
  ],
  [
    "DELHI10",
    {
      code: "DELHI10",
      title: "Delhi City Promo",
      description: "10% off for Delhi rentals",
      discountType: "percent",
      discountValue: 10,
      minSubtotalINR: 600,
      maxDiscountINR: 500,
      city: "Delhi",
      eligibility: "all",
      isActive: true,
    },
  ],
]);
const inMemoryRedemptions: { code: string; userEmail: string; bookingId: string; discountINR: number }[] = [];
const inMemoryReferralProfiles = new Map<string, ReferralProfile>();
const inMemoryReferralRewards: { referrerCode: string; refereeEmail: string; bookingId: string; discountINR: number }[] = [];
const inMemoryBookingPromotions = new Map<string, BookingPromotionRecord>();

let hasEnsuredTables = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function toIsoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalInt(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.round(parsed));
}

function sanitizeCampaign(input: CouponCampaign): CouponCampaign {
  return {
    code: normalizeCode(input.code),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    discountType: input.discountType,
    discountValue: Math.max(1, Math.round(input.discountValue)),
    minSubtotalINR: parseOptionalInt(input.minSubtotalINR),
    maxDiscountINR: parseOptionalInt(input.maxDiscountINR),
    city: input.city?.trim() || undefined,
    eligibility: input.eligibility,
    startsAt: toIsoDate(input.startsAt),
    endsAt: toIsoDate(input.endsAt),
    usageLimit: parseOptionalInt(input.usageLimit),
    perUserLimit: parseOptionalInt(input.perUserLimit),
    isActive: Boolean(input.isActive),
  };
}

type CampaignRow = {
  code: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_subtotal_inr: number | null;
  max_discount_inr: number | null;
  city: string | null;
  eligibility: string;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  is_active: boolean;
};

function mapCampaignRow(row: CampaignRow): CouponCampaign {
  return {
    code: row.code,
    title: row.title,
    description: row.description ?? undefined,
    discountType: row.discount_type === "flat" ? "flat" : "percent",
    discountValue: Number(row.discount_value) || 0,
    minSubtotalINR: row.min_subtotal_inr ?? undefined,
    maxDiscountINR: row.max_discount_inr ?? undefined,
    city: row.city ?? undefined,
    eligibility: row.eligibility === "first_ride" || row.eligibility === "repeat" ? row.eligibility : "all",
    startsAt: row.starts_at?.toISOString(),
    endsAt: row.ends_at?.toISOString(),
    usageLimit: row.usage_limit ?? undefined,
    perUserLimit: row.per_user_limit ?? undefined,
    isActive: row.is_active,
  };
}

async function ensurePromotionTables() {
  if (!process.env.DATABASE_URL || hasEnsuredTables) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CouponCampaign" (
      code TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_subtotal_inr INTEGER,
      max_discount_inr INTEGER,
      city TEXT,
      eligibility TEXT NOT NULL DEFAULT 'all',
      starts_at TIMESTAMP(3),
      ends_at TIMESTAMP(3),
      usage_limit INTEGER,
      per_user_limit INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CouponRedemption" (
      id BIGSERIAL PRIMARY KEY,
      code TEXT NOT NULL,
      user_email TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      discount_inr INTEGER NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReferralProfile" (
      user_email TEXT PRIMARY KEY,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by_code TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReferralReward" (
      id BIGSERIAL PRIMARY KEY,
      referrer_code TEXT NOT NULL,
      referee_email TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      discount_inr INTEGER NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingPromotion" (
      booking_id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      subtotal_amount_inr INTEGER NOT NULL,
      coupon_code TEXT,
      coupon_discount_inr INTEGER NOT NULL DEFAULT 0,
      referral_code TEXT,
      referral_discount_inr INTEGER NOT NULL DEFAULT 0,
      total_amount_inr INTEGER NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const current = await prisma.$queryRaw<CampaignRow[]>(Prisma.sql`SELECT * FROM "CouponCampaign" LIMIT 1`);
  if (!current.length) {
    for (const campaign of inMemoryCampaigns.values()) {
      const item = sanitizeCampaign(campaign);
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO "CouponCampaign" (
            code, title, description, discount_type, discount_value, min_subtotal_inr, max_discount_inr, city,
            eligibility, starts_at, ends_at, usage_limit, per_user_limit, is_active, updated_at
          )
          VALUES (
            ${item.code}, ${item.title}, ${item.description ?? null}, ${item.discountType}, ${item.discountValue},
            ${item.minSubtotalINR ?? null}, ${item.maxDiscountINR ?? null}, ${item.city ?? null}, ${item.eligibility},
            ${item.startsAt ? new Date(item.startsAt) : null}, ${item.endsAt ? new Date(item.endsAt) : null},
            ${item.usageLimit ?? null}, ${item.perUserLimit ?? null}, ${item.isActive}, NOW()
          )
          ON CONFLICT (code) DO NOTHING
        `,
      );
    }
  }

  hasEnsuredTables = true;
}

export async function listCouponCampaigns() {
  if (!process.env.DATABASE_URL) {
    return Array.from(inMemoryCampaigns.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  await ensurePromotionTables();

  const rows = await prisma.$queryRaw<CampaignRow[]>(Prisma.sql`
    SELECT code, title, description, discount_type, discount_value, min_subtotal_inr, max_discount_inr, city,
      eligibility, starts_at, ends_at, usage_limit, per_user_limit, is_active
    FROM "CouponCampaign"
    ORDER BY code ASC
  `);

  return rows.map(mapCampaignRow);
}

export async function upsertCouponCampaign(input: CouponCampaign) {
  const item = sanitizeCampaign(input);
  if (!item.code || !item.title) {
    throw new Error("Coupon code and title are required");
  }

  if (!process.env.DATABASE_URL) {
    inMemoryCampaigns.set(item.code, item);
    return item;
  }

  await ensurePromotionTables();

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "CouponCampaign" (
        code, title, description, discount_type, discount_value, min_subtotal_inr, max_discount_inr, city,
        eligibility, starts_at, ends_at, usage_limit, per_user_limit, is_active, updated_at
      )
      VALUES (
        ${item.code}, ${item.title}, ${item.description ?? null}, ${item.discountType}, ${item.discountValue},
        ${item.minSubtotalINR ?? null}, ${item.maxDiscountINR ?? null}, ${item.city ?? null}, ${item.eligibility},
        ${item.startsAt ? new Date(item.startsAt) : null}, ${item.endsAt ? new Date(item.endsAt) : null},
        ${item.usageLimit ?? null}, ${item.perUserLimit ?? null}, ${item.isActive}, NOW()
      )
      ON CONFLICT (code)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        discount_type = EXCLUDED.discount_type,
        discount_value = EXCLUDED.discount_value,
        min_subtotal_inr = EXCLUDED.min_subtotal_inr,
        max_discount_inr = EXCLUDED.max_discount_inr,
        city = EXCLUDED.city,
        eligibility = EXCLUDED.eligibility,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        usage_limit = EXCLUDED.usage_limit,
        per_user_limit = EXCLUDED.per_user_limit,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `,
  );

  return item;
}

async function getCouponRedemptionCount(code: string) {
  if (!process.env.DATABASE_URL) {
    return inMemoryRedemptions.filter((item) => item.code === code).length;
  }

  await ensurePromotionTables();
  const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count FROM "CouponRedemption" WHERE code = ${code}
  `);
  return Number(rows[0]?.count ?? 0);
}

async function getCouponRedemptionCountByUser(code: string, userEmail: string) {
  if (!process.env.DATABASE_URL) {
    const normalized = normalizeEmail(userEmail);
    return inMemoryRedemptions.filter((item) => item.code === code && item.userEmail === normalized).length;
  }

  await ensurePromotionTables();
  const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "CouponRedemption"
    WHERE code = ${code} AND lower(user_email) = ${normalizeEmail(userEmail)}
  `);
  return Number(rows[0]?.count ?? 0);
}

export async function validateCouponCampaign(params: {
  code?: string;
  userEmail: string;
  city: string;
  subtotalAmountINR: number;
  bookingCount: number;
}) {
  const normalizedCode = params.code ? normalizeCode(params.code) : "";
  if (!normalizedCode) {
    return { discountINR: 0, message: "", appliedCode: undefined as string | undefined };
  }

  const campaigns = await listCouponCampaigns();
  const campaign = campaigns.find((item) => item.code === normalizedCode);
  if (!campaign) {
    return { discountINR: 0, message: "Coupon not found.", appliedCode: undefined as string | undefined };
  }

  if (!campaign.isActive) {
    return { discountINR: 0, message: "Coupon is inactive.", appliedCode: undefined as string | undefined };
  }

  const now = new Date();
  const startsAt = toDate(campaign.startsAt);
  const endsAt = toDate(campaign.endsAt);
  if (startsAt && now < startsAt) {
    return { discountINR: 0, message: "Coupon is not active yet.", appliedCode: undefined as string | undefined };
  }
  if (endsAt && now > endsAt) {
    return { discountINR: 0, message: "Coupon has expired.", appliedCode: undefined as string | undefined };
  }

  if (campaign.city && campaign.city.toLowerCase() !== params.city.trim().toLowerCase()) {
    return { discountINR: 0, message: `Coupon is only valid for ${campaign.city}.`, appliedCode: undefined as string | undefined };
  }

  if (campaign.minSubtotalINR && params.subtotalAmountINR < campaign.minSubtotalINR) {
    return {
      discountINR: 0,
      message: `Minimum subtotal ₹${campaign.minSubtotalINR} required for this coupon.`,
      appliedCode: undefined as string | undefined,
    };
  }

  if (campaign.eligibility === "first_ride" && params.bookingCount > 0) {
    return { discountINR: 0, message: "Coupon is only valid on first ride.", appliedCode: undefined as string | undefined };
  }

  if (campaign.eligibility === "repeat" && params.bookingCount === 0) {
    return { discountINR: 0, message: "Coupon is valid for repeat rides only.", appliedCode: undefined as string | undefined };
  }

  if (campaign.usageLimit) {
    const used = await getCouponRedemptionCount(campaign.code);
    if (used >= campaign.usageLimit) {
      return { discountINR: 0, message: "Coupon usage limit reached.", appliedCode: undefined as string | undefined };
    }
  }

  if (campaign.perUserLimit) {
    const usedByUser = await getCouponRedemptionCountByUser(campaign.code, params.userEmail);
    if (usedByUser >= campaign.perUserLimit) {
      return { discountINR: 0, message: "You have already used this coupon the maximum number of times.", appliedCode: undefined as string | undefined };
    }
  }

  const rawDiscount = campaign.discountType === "percent"
    ? Math.floor((params.subtotalAmountINR * campaign.discountValue) / 100)
    : Math.floor(campaign.discountValue);
  const capped = campaign.maxDiscountINR ? Math.min(rawDiscount, campaign.maxDiscountINR) : rawDiscount;
  const discountINR = Math.max(0, Math.min(capped, params.subtotalAmountINR));

  if (discountINR <= 0) {
    return { discountINR: 0, message: "Coupon is not applicable for this booking.", appliedCode: undefined as string | undefined };
  }

  return {
    discountINR,
    appliedCode: campaign.code,
    message: `Coupon ${campaign.code} applied. You saved ₹${discountINR}.`,
  };
}

function buildCandidateReferralCode(email: string, iteration = 0) {
  const local = email.split("@")[0] || "NEXTGEAR";
  const base = local.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "NEXTGR";
  const suffix = Math.floor((Date.now() + iteration * 31) % 10000).toString().padStart(4, "0");
  return `${base}${suffix}`;
}

async function isReferralCodeTaken(referralCode: string) {
  if (!process.env.DATABASE_URL) {
    return Array.from(inMemoryReferralProfiles.values()).some((item) => item.referralCode === referralCode);
  }

  await ensurePromotionTables();
  const rows = await prisma.$queryRaw<{ exists: string }[]>(Prisma.sql`
    SELECT '1' as exists FROM "ReferralProfile" WHERE referral_code = ${referralCode} LIMIT 1
  `);
  return rows.length > 0;
}

export async function getReferralProfileByEmail(userEmail: string) {
  const normalized = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return inMemoryReferralProfiles.get(normalized) ?? null;
  }

  await ensurePromotionTables();
  const rows = await prisma.$queryRaw<{
    user_email: string;
    referral_code: string;
    referred_by_code: string | null;
  }[]>(Prisma.sql`
    SELECT user_email, referral_code, referred_by_code
    FROM "ReferralProfile"
    WHERE lower(user_email) = ${normalized}
    LIMIT 1
  `);

  if (!rows.length) return null;

  return {
    userEmail: rows[0].user_email,
    referralCode: rows[0].referral_code,
    referredByCode: rows[0].referred_by_code ?? undefined,
  } satisfies ReferralProfile;
}

async function getReferralProfileByCode(referralCode: string) {
  const normalizedCode = normalizeCode(referralCode);

  if (!process.env.DATABASE_URL) {
    return Array.from(inMemoryReferralProfiles.values()).find((item) => item.referralCode === normalizedCode) ?? null;
  }

  await ensurePromotionTables();
  const rows = await prisma.$queryRaw<{
    user_email: string;
    referral_code: string;
    referred_by_code: string | null;
  }[]>(Prisma.sql`
    SELECT user_email, referral_code, referred_by_code
    FROM "ReferralProfile"
    WHERE referral_code = ${normalizedCode}
    LIMIT 1
  `);

  if (!rows.length) return null;

  return {
    userEmail: rows[0].user_email,
    referralCode: rows[0].referral_code,
    referredByCode: rows[0].referred_by_code ?? undefined,
  } satisfies ReferralProfile;
}

export async function getOrCreateReferralCode(userEmail: string) {
  const normalized = normalizeEmail(userEmail);
  if (!normalized) {
    throw new Error("Email is required for referral code");
  }

  const existing = await getReferralProfileByEmail(normalized);
  if (existing) {
    return existing.referralCode;
  }

  let referralCode = "";
  for (let i = 0; i < 8; i += 1) {
    const candidate = buildCandidateReferralCode(normalized, i);
    const taken = await isReferralCodeTaken(candidate);
    if (!taken) {
      referralCode = candidate;
      break;
    }
  }

  if (!referralCode) {
    referralCode = `${buildCandidateReferralCode(normalized, 9)}${Math.floor(Math.random() * 9)}`;
  }

  if (!process.env.DATABASE_URL) {
    inMemoryReferralProfiles.set(normalized, { userEmail: normalized, referralCode });
    return referralCode;
  }

  await ensurePromotionTables();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "ReferralProfile" (user_email, referral_code, referred_by_code, updated_at)
      VALUES (${normalized}, ${referralCode}, NULL, NOW())
      ON CONFLICT (user_email)
      DO UPDATE SET updated_at = NOW()
    `,
  );

  return referralCode;
}

export async function validateReferralCode(params: {
  referralCode?: string;
  userEmail: string;
  subtotalAmountINR: number;
  bookingCount: number;
}) {
  const normalizedReferral = params.referralCode ? normalizeCode(params.referralCode) : "";
  if (!normalizedReferral) {
    return { discountINR: 0, message: "", appliedCode: undefined as string | undefined };
  }

  if (params.subtotalAmountINR < DEFAULT_REFERRAL_MIN_SUBTOTAL_INR) {
    return {
      discountINR: 0,
      message: `Referral requires minimum subtotal of ₹${DEFAULT_REFERRAL_MIN_SUBTOTAL_INR}.`,
      appliedCode: undefined as string | undefined,
    };
  }

  if (params.bookingCount > 0) {
    return { discountINR: 0, message: "Referral discount is available only on first booking.", appliedCode: undefined as string | undefined };
  }

  const ownCode = await getOrCreateReferralCode(params.userEmail);
  if (ownCode === normalizedReferral) {
    return { discountINR: 0, message: "You cannot use your own referral code.", appliedCode: undefined as string | undefined };
  }

  const referrerProfile = await getReferralProfileByCode(normalizedReferral);
  if (!referrerProfile) {
    return { discountINR: 0, message: "Referral code not found.", appliedCode: undefined as string | undefined };
  }

  if (normalizeEmail(referrerProfile.userEmail) === normalizeEmail(params.userEmail)) {
    return { discountINR: 0, message: "You cannot use your own referral code.", appliedCode: undefined as string | undefined };
  }

  const discountINR = Math.max(0, Math.min(DEFAULT_REFERRAL_DISCOUNT_INR, params.subtotalAmountINR));
  return {
    discountINR,
    appliedCode: normalizedReferral,
    message: `Referral applied. You saved ₹${discountINR}.`,
  };
}

export async function computePromotionBreakdown(params: {
  userEmail: string;
  city: string;
  subtotalAmountINR: number;
  bookingCount: number;
  couponCode?: string;
  referralCode?: string;
}) {
  const coupon = await validateCouponCampaign({
    code: params.couponCode,
    userEmail: params.userEmail,
    city: params.city,
    subtotalAmountINR: params.subtotalAmountINR,
    bookingCount: params.bookingCount,
  });

  const subtotalAfterCoupon = Math.max(0, params.subtotalAmountINR - coupon.discountINR);
  const referral = await validateReferralCode({
    referralCode: params.referralCode,
    userEmail: params.userEmail,
    subtotalAmountINR: subtotalAfterCoupon,
    bookingCount: params.bookingCount,
  });

  const totalDiscount = coupon.discountINR + referral.discountINR;
  const payableAmountINR = Math.max(0, params.subtotalAmountINR - totalDiscount);

  const messages = [coupon.message, referral.message].filter(Boolean);

  return {
    subtotalAmountINR: params.subtotalAmountINR,
    couponCode: coupon.appliedCode,
    couponDiscountINR: coupon.discountINR,
    referralCode: referral.appliedCode,
    referralDiscountINR: referral.discountINR,
    totalDiscountINR: totalDiscount,
    payableAmountINR,
    messages,
  } satisfies PromotionBreakdown;
}

export async function saveBookingPromotion(record: BookingPromotionRecord) {
  const item: BookingPromotionRecord = {
    ...record,
    userEmail: normalizeEmail(record.userEmail),
    couponCode: record.couponCode ? normalizeCode(record.couponCode) : undefined,
    referralCode: record.referralCode ? normalizeCode(record.referralCode) : undefined,
  };

  if (!process.env.DATABASE_URL) {
    inMemoryBookingPromotions.set(item.bookingId, item);
    if (item.couponCode && item.couponDiscountINR > 0) {
      inMemoryRedemptions.push({
        code: item.couponCode,
        userEmail: item.userEmail,
        bookingId: item.bookingId,
        discountINR: item.couponDiscountINR,
      });
    }

    if (item.referralCode && item.referralDiscountINR > 0) {
      const profile = inMemoryReferralProfiles.get(item.userEmail);
      if (profile) {
        profile.referredByCode = item.referralCode;
      } else {
        inMemoryReferralProfiles.set(item.userEmail, {
          userEmail: item.userEmail,
          referralCode: await getOrCreateReferralCode(item.userEmail),
          referredByCode: item.referralCode,
        });
      }

      inMemoryReferralRewards.push({
        referrerCode: item.referralCode,
        refereeEmail: item.userEmail,
        bookingId: item.bookingId,
        discountINR: item.referralDiscountINR,
      });
    }

    return;
  }

  await ensurePromotionTables();

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "BookingPromotion" (
        booking_id, user_email, subtotal_amount_inr, coupon_code, coupon_discount_inr,
        referral_code, referral_discount_inr, total_amount_inr, updated_at
      )
      VALUES (
        ${item.bookingId}, ${item.userEmail}, ${item.subtotalAmountINR}, ${item.couponCode ?? null}, ${item.couponDiscountINR},
        ${item.referralCode ?? null}, ${item.referralDiscountINR}, ${item.totalAmountINR}, NOW()
      )
      ON CONFLICT (booking_id)
      DO UPDATE SET
        user_email = EXCLUDED.user_email,
        subtotal_amount_inr = EXCLUDED.subtotal_amount_inr,
        coupon_code = EXCLUDED.coupon_code,
        coupon_discount_inr = EXCLUDED.coupon_discount_inr,
        referral_code = EXCLUDED.referral_code,
        referral_discount_inr = EXCLUDED.referral_discount_inr,
        total_amount_inr = EXCLUDED.total_amount_inr,
        updated_at = NOW()
    `,
  );

  if (item.couponCode && item.couponDiscountINR > 0) {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "CouponRedemption" (code, user_email, booking_id, discount_inr)
        VALUES (${item.couponCode}, ${item.userEmail}, ${item.bookingId}, ${item.couponDiscountINR})
      `,
    );
  }

  if (item.referralCode && item.referralDiscountINR > 0) {
    const existingProfile = await getReferralProfileByEmail(item.userEmail);
    if (!existingProfile) {
      const ownCode = await getOrCreateReferralCode(item.userEmail);
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "ReferralProfile"
          SET referred_by_code = ${item.referralCode}, updated_at = NOW()
          WHERE user_email = ${item.userEmail} AND referral_code = ${ownCode}
        `,
      );
    } else if (!existingProfile.referredByCode) {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "ReferralProfile"
          SET referred_by_code = ${item.referralCode}, updated_at = NOW()
          WHERE user_email = ${item.userEmail}
        `,
      );
    }

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "ReferralReward" (referrer_code, referee_email, booking_id, discount_inr)
        VALUES (${item.referralCode}, ${item.userEmail}, ${item.bookingId}, ${item.referralDiscountINR})
      `,
    );
  }
}

export async function getBookingPromotionsByBookingIds(bookingIds: string[]) {
  const map = new Map<string, BookingPromotionRecord>();
  if (!bookingIds.length) return map;

  if (!process.env.DATABASE_URL) {
    for (const bookingId of bookingIds) {
      const item = inMemoryBookingPromotions.get(bookingId);
      if (item) map.set(bookingId, item);
    }
    return map;
  }

  await ensurePromotionTables();

  const rows = await prisma.$queryRaw<{
    booking_id: string;
    user_email: string;
    subtotal_amount_inr: number;
    coupon_code: string | null;
    coupon_discount_inr: number;
    referral_code: string | null;
    referral_discount_inr: number;
    total_amount_inr: number;
  }[]>(Prisma.sql`
    SELECT booking_id, user_email, subtotal_amount_inr, coupon_code, coupon_discount_inr, referral_code, referral_discount_inr, total_amount_inr
    FROM "BookingPromotion"
    WHERE booking_id IN (${Prisma.join(bookingIds)})
  `);

  for (const row of rows) {
    map.set(row.booking_id, {
      bookingId: row.booking_id,
      userEmail: row.user_email,
      subtotalAmountINR: Number(row.subtotal_amount_inr) || 0,
      couponCode: row.coupon_code ?? undefined,
      couponDiscountINR: Number(row.coupon_discount_inr) || 0,
      referralCode: row.referral_code ?? undefined,
      referralDiscountINR: Number(row.referral_discount_inr) || 0,
      totalAmountINR: Number(row.total_amount_inr) || 0,
    });
  }

  return map;
}

export async function getReferralStats(userEmail: string) {
  const referralCode = await getOrCreateReferralCode(userEmail);

  if (!process.env.DATABASE_URL) {
    const rewards = inMemoryReferralRewards.filter((item) => item.referrerCode === referralCode);
    const successfulReferrals = rewards.length;
    const earnedAmountINR = rewards.reduce((sum, item) => sum + item.discountINR, 0);
    return {
      referralCode,
      successfulReferrals,
      earnedAmountINR,
    };
  }

  await ensurePromotionTables();

  const rows = await prisma.$queryRaw<{ count: bigint; total: bigint | null }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint as count, COALESCE(SUM(discount_inr), 0)::bigint as total
    FROM "ReferralReward"
    WHERE referrer_code = ${referralCode}
  `);

  return {
    referralCode,
    successfulReferrals: Number(rows[0]?.count ?? 0),
    earnedAmountINR: Number(rows[0]?.total ?? 0),
  };
}
