import { prisma } from "@/lib/prisma";

export type SiteSettings = {
  brandName: string;
  sinceText: string;
  description: string;
  supportEmail: string;
  businessEmail: string;
  phone: string;
  whatsappUrl: string;
  instagramUrl: string;
  logoUrl: string;
};

export const defaultSiteSettings: SiteSettings = {
  brandName: "NEXT GEAR",
  sinceText: "SINCE 2022",
  description: "Bike, car, and scooty rentals built for India-wide scale with verified fleets and instant booking.",
  supportEmail: "support@nextgear.in",
  businessEmail: "partners@nextgear.in",
  phone: "9523765172",
  whatsappUrl: "https://chat.whatsapp.com/F636yrEkcLB7v3zB2Y3Wjm?mode=gi_t",
  instagramUrl: "https://www.instagram.com/_nextgear_rentals?igsh=eDIwN25md2dpYWN1",
  logoUrl: "/Logo1.png",
};

type SiteSettingRow = {
  key: string;
  value: string;
};

let ensuredTable = false;
let runtimeSiteSettings: SiteSettings = { ...defaultSiteSettings };

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteSetting" (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  ensuredTable = true;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!process.env.DATABASE_URL) {
    return { ...runtimeSiteSettings };
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<SiteSettingRow[]>(
    `SELECT key, value FROM "SiteSetting"`
  );

  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    brandName: map.get("brandName") || defaultSiteSettings.brandName,
    sinceText: map.get("sinceText") || defaultSiteSettings.sinceText,
    description: map.get("description") || defaultSiteSettings.description,
    supportEmail: map.get("supportEmail") || defaultSiteSettings.supportEmail,
    businessEmail: map.get("businessEmail") || defaultSiteSettings.businessEmail,
    phone: map.get("phone") || defaultSiteSettings.phone,
    whatsappUrl: map.get("whatsappUrl") || defaultSiteSettings.whatsappUrl,
    instagramUrl: map.get("instagramUrl") || defaultSiteSettings.instagramUrl,
    logoUrl: map.get("logoUrl") || defaultSiteSettings.logoUrl,
  };
}

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  if (!process.env.DATABASE_URL) {
    runtimeSiteSettings = {
      ...runtimeSiteSettings,
      ...patch,
    };
    return { ...runtimeSiteSettings };
  }

  await ensureTable();

  const entries = Object.entries(patch).filter(([, value]) => typeof value === "string");
  for (const [key, value] of entries) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "SiteSetting" (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      key,
      value
    );
  }

  return getSiteSettings();
}
