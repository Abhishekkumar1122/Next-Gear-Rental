import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";

export type VendorApplicationStatus =
  | "new"
  | "contacted"
  | "kyc-in-progress"
  | "kyc-complete"
  | "credentials-generated"
  | "rejected";

export type VendorKycChecklist = {
  identityVerified: boolean;
  businessProofVerified: boolean;
  bankVerified: boolean;
  agreementAccepted: boolean;
};

export type VendorApplication = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  city: string;
  fleetSize: string;
  status: VendorApplicationStatus;
  kycChecklist: VendorKycChecklist;
  adminNotes?: string;
  loginId?: string;
  tempPassword?: string;
  vendorUserId?: string;
  vendorId?: string;
  onboardingAutomatedAt?: string;
  kycApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type VendorApplicationCreateInput = {
  businessName: string;
  contactName: string;
  phone: string;
  city: string;
  fleetSize: string;
};

type VendorApplicationRow = {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  city: string;
  fleet_size: string;
  status: string;
  kyc_identity: boolean;
  kyc_business: boolean;
  kyc_bank: boolean;
  kyc_agreement: boolean;
  admin_notes: string | null;
  login_id: string | null;
  temp_password: string | null;
  vendor_user_id: string | null;
  vendor_id: string | null;
  onboarding_automated_at: Date | null;
  kyc_approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

let ensuredTable = false;
const runtimeVendorApplications: VendorApplication[] = [];

function toVendorApplication(row: VendorApplicationRow): VendorApplication {
  return {
    id: row.id,
    businessName: row.business_name,
    contactName: row.contact_name,
    phone: row.phone,
    city: row.city,
    fleetSize: row.fleet_size,
    status: (row.status as VendorApplicationStatus) || "new",
    kycChecklist: {
      identityVerified: Boolean(row.kyc_identity),
      businessProofVerified: Boolean(row.kyc_business),
      bankVerified: Boolean(row.kyc_bank),
      agreementAccepted: Boolean(row.kyc_agreement),
    },
    adminNotes: row.admin_notes || undefined,
    loginId: row.login_id || undefined,
    tempPassword: row.temp_password || undefined,
    vendorUserId: row.vendor_user_id || undefined,
    vendorId: row.vendor_id || undefined,
    onboardingAutomatedAt: row.onboarding_automated_at ? new Date(row.onboarding_automated_at).toISOString() : undefined,
    kycApprovedAt: row.kyc_approved_at ? new Date(row.kyc_approved_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorApplication" (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      fleet_size TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      kyc_identity BOOLEAN NOT NULL DEFAULT FALSE,
      kyc_business BOOLEAN NOT NULL DEFAULT FALSE,
      kyc_bank BOOLEAN NOT NULL DEFAULT FALSE,
      kyc_agreement BOOLEAN NOT NULL DEFAULT FALSE,
      admin_notes TEXT,
      login_id TEXT,
      temp_password TEXT,
      vendor_user_id TEXT,
      vendor_id TEXT,
      onboarding_automated_at TIMESTAMP,
      kyc_approved_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "VendorApplication" ADD COLUMN IF NOT EXISTS kyc_identity BOOLEAN NOT NULL DEFAULT FALSE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "VendorApplication" ADD COLUMN IF NOT EXISTS kyc_business BOOLEAN NOT NULL DEFAULT FALSE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "VendorApplication" ADD COLUMN IF NOT EXISTS kyc_bank BOOLEAN NOT NULL DEFAULT FALSE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "VendorApplication" ADD COLUMN IF NOT EXISTS kyc_agreement BOOLEAN NOT NULL DEFAULT FALSE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "VendorApplication" ADD COLUMN IF NOT EXISTS onboarding_automated_at TIMESTAMP`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "VendorApplication" ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMP`);

  ensuredTable = true;
}

function buildLoginId(input: { businessName: string; phone: string }) {
  const slug = input.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 18) || "vendor";

  const last4 = input.phone.slice(-4);
  return `${slug}-${last4}@vendors.nextgear.in`;
}

function buildTempPassword() {
  const random = Math.random().toString(36).slice(-5).toUpperCase();
  return `Vnd@${new Date().getFullYear()}${random}`;
}

function isChecklistComplete(checklist: VendorKycChecklist) {
  return (
    checklist.identityVerified &&
    checklist.businessProofVerified &&
    checklist.bankVerified &&
    checklist.agreementAccepted
  );
}

export async function createVendorApplication(input: VendorApplicationCreateInput): Promise<VendorApplication> {
  if (!process.env.DATABASE_URL) {
    const now = new Date().toISOString();
    const record: VendorApplication = {
      id: `va_${crypto.randomUUID()}`,
      businessName: input.businessName,
      contactName: input.contactName,
      phone: input.phone,
      city: input.city,
      fleetSize: input.fleetSize,
      status: "new",
      kycChecklist: {
        identityVerified: false,
        businessProofVerified: false,
        bankVerified: false,
        agreementAccepted: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    runtimeVendorApplications.unshift(record);
    return record;
  }

  await ensureTable();

  const id = `va_${crypto.randomUUID()}`;
  const rows = await prisma.$queryRawUnsafe<VendorApplicationRow[]>(
    `
      INSERT INTO "VendorApplication" (id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'new', FALSE, FALSE, FALSE, FALSE, NOW(), NOW())
      RETURNING id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, admin_notes, login_id, temp_password, vendor_user_id, vendor_id, onboarding_automated_at, kyc_approved_at, created_at, updated_at
    `,
    id,
    input.businessName,
    input.contactName,
    input.phone,
    input.city,
    input.fleetSize
  );

  return toVendorApplication(rows[0]);
}

export async function getVendorApplications(params?: {
  status?: VendorApplicationStatus | "all";
  query?: string;
  limit?: number;
}): Promise<VendorApplication[]> {
  const status = params?.status ?? "all";
  const query = params?.query?.trim().toLowerCase() ?? "";
  const limit = Math.max(1, Math.min(params?.limit ?? 100, 500));

  if (!process.env.DATABASE_URL) {
    return runtimeVendorApplications
      .filter((item) => (status === "all" ? true : item.status === status))
      .filter((item) => {
        if (!query) return true;
        return (
          item.businessName.toLowerCase().includes(query) ||
          item.contactName.toLowerCase().includes(query) ||
          item.phone.toLowerCase().includes(query) ||
          item.city.toLowerCase().includes(query)
        );
      })
      .slice(0, limit);
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<VendorApplicationRow[]>(
    `
      SELECT id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, admin_notes, login_id, temp_password, vendor_user_id, vendor_id, onboarding_automated_at, kyc_approved_at, created_at, updated_at
      FROM "VendorApplication"
      WHERE ($1 = 'all' OR status = $1)
      AND (
        $2 = ''
        OR LOWER(business_name) LIKE '%' || $2 || '%'
        OR LOWER(contact_name) LIKE '%' || $2 || '%'
        OR LOWER(phone) LIKE '%' || $2 || '%'
        OR LOWER(city) LIKE '%' || $2 || '%'
      )
      ORDER BY created_at DESC
      LIMIT $3
    `,
    status,
    query,
    limit
  );

  return rows.map(toVendorApplication);
}

export async function updateVendorApplication(
  id: string,
  patch: { status?: VendorApplicationStatus; adminNotes?: string }
): Promise<VendorApplication | null> {
  if (!process.env.DATABASE_URL) {
    const existing = runtimeVendorApplications.find((item) => item.id === id);
    if (!existing) return null;

    if (typeof patch.status !== "undefined") {
      existing.status = patch.status;
    }
    if (typeof patch.adminNotes === "string") {
      existing.adminNotes = patch.adminNotes;
    }
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<VendorApplicationRow[]>(
    `
      UPDATE "VendorApplication"
      SET
        status = COALESCE($2, status),
        admin_notes = COALESCE($3, admin_notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, admin_notes, login_id, temp_password, vendor_user_id, vendor_id, onboarding_automated_at, kyc_approved_at, created_at, updated_at
    `,
    id,
    patch.status ?? null,
    typeof patch.adminNotes === "string" ? patch.adminNotes : null
  );

  if (!rows.length) return null;
  return toVendorApplication(rows[0]);
}

export async function updateVendorKycChecklist(
  id: string,
  checklistPatch: Partial<VendorKycChecklist>,
  adminNotes?: string
): Promise<VendorApplication | null> {
  if (!process.env.DATABASE_URL) {
    const existing = runtimeVendorApplications.find((item) => item.id === id);
    if (!existing) return null;

    existing.kycChecklist = {
      identityVerified: checklistPatch.identityVerified ?? existing.kycChecklist.identityVerified,
      businessProofVerified: checklistPatch.businessProofVerified ?? existing.kycChecklist.businessProofVerified,
      bankVerified: checklistPatch.bankVerified ?? existing.kycChecklist.bankVerified,
      agreementAccepted: checklistPatch.agreementAccepted ?? existing.kycChecklist.agreementAccepted,
    };

    if (typeof adminNotes === "string") {
      existing.adminNotes = adminNotes;
    }

    if (existing.status !== "rejected") {
      existing.status = isChecklistComplete(existing.kycChecklist) ? "kyc-complete" : "kyc-in-progress";
    }

    existing.kycApprovedAt = isChecklistComplete(existing.kycChecklist) ? existing.kycApprovedAt ?? new Date().toISOString() : undefined;

    existing.updatedAt = new Date().toISOString();

    if (existing.status === "kyc-complete") {
      const automated = await generateVendorCredentials(id);
      return automated;
    }

    return existing;
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<VendorApplicationRow[]>(
    `
      UPDATE "VendorApplication"
      SET
        kyc_identity = COALESCE($2, kyc_identity),
        kyc_business = COALESCE($3, kyc_business),
        kyc_bank = COALESCE($4, kyc_bank),
        kyc_agreement = COALESCE($5, kyc_agreement),
        admin_notes = COALESCE($6, admin_notes),
        status = CASE
          WHEN status = 'rejected' THEN status
          WHEN COALESCE($2, kyc_identity) = TRUE
           AND COALESCE($3, kyc_business) = TRUE
           AND COALESCE($4, kyc_bank) = TRUE
           AND COALESCE($5, kyc_agreement) = TRUE
          THEN 'kyc-complete'
          ELSE 'kyc-in-progress'
        END,
        kyc_approved_at = CASE
          WHEN status = 'rejected' THEN kyc_approved_at
          WHEN COALESCE($2, kyc_identity) = TRUE
           AND COALESCE($3, kyc_business) = TRUE
           AND COALESCE($4, kyc_bank) = TRUE
           AND COALESCE($5, kyc_agreement) = TRUE
          THEN COALESCE(kyc_approved_at, NOW())
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, admin_notes, login_id, temp_password, vendor_user_id, vendor_id, onboarding_automated_at, kyc_approved_at, created_at, updated_at
    `,
    id,
    typeof checklistPatch.identityVerified === "boolean" ? checklistPatch.identityVerified : null,
    typeof checklistPatch.businessProofVerified === "boolean" ? checklistPatch.businessProofVerified : null,
    typeof checklistPatch.bankVerified === "boolean" ? checklistPatch.bankVerified : null,
    typeof checklistPatch.agreementAccepted === "boolean" ? checklistPatch.agreementAccepted : null,
    typeof adminNotes === "string" ? adminNotes : null
  );

  if (!rows.length) return null;

  const updated = toVendorApplication(rows[0]);
  if (updated.status === "kyc-complete") {
    return generateVendorCredentials(id);
  }

  return updated;
}

export async function generateVendorCredentials(applicationId: string): Promise<VendorApplication | null> {
  if (!process.env.DATABASE_URL) {
    const existing = runtimeVendorApplications.find((item) => item.id === applicationId);
    if (!existing) return null;

    if (existing.loginId && existing.tempPassword) {
      return existing;
    }

    const loginId = buildLoginId({ businessName: existing.businessName, phone: existing.phone });
    const tempPassword = buildTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const existingUser = runtimeUsers.find((u) => u.email.toLowerCase() === loginId.toLowerCase());
    if (!existingUser) {
      runtimeUsers.push({
        id: `usr-vendor-${runtimeUsers.length + 1}`,
        name: existing.contactName,
        email: loginId,
        phone: existing.phone,
        passwordHash,
        role: "VENDOR",
      });
    }

    existing.loginId = loginId;
    existing.tempPassword = tempPassword;
    existing.status = "credentials-generated";
    existing.onboardingAutomatedAt = new Date().toISOString();
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<VendorApplicationRow[]>(
    `
      SELECT id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, admin_notes, login_id, temp_password, vendor_user_id, vendor_id, onboarding_automated_at, kyc_approved_at, created_at, updated_at
      FROM "VendorApplication"
      WHERE id = $1
      LIMIT 1
    `,
    applicationId
  );

  if (!rows.length) return null;
  const application = rows[0];

  if (application.login_id && application.temp_password) {
    return toVendorApplication(application);
  }

  const loginId = buildLoginId({ businessName: application.business_name, phone: application.phone });
  const tempPassword = buildTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  let user = await prisma.user.findUnique({ where: { email: loginId }, select: { id: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: application.contact_name,
        email: loginId,
        phone: application.phone,
        passwordHash,
        role: "VENDOR",
      },
      select: { id: true },
    });
  }

  let vendor = await prisma.vendor.findFirst({
    where: { ownerUserId: user.id },
    select: { id: true },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        businessName: application.business_name,
        contactPhone: application.phone,
        commissionRate: 12,
        ownerUserId: user.id,
      },
      select: { id: true },
    });
  }

  const updatedRows = await prisma.$queryRawUnsafe<VendorApplicationRow[]>(
    `
      UPDATE "VendorApplication"
      SET
        status = 'credentials-generated',
        login_id = $2,
        temp_password = $3,
        vendor_user_id = $4,
        vendor_id = $5,
        onboarding_automated_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, business_name, contact_name, phone, city, fleet_size, status, kyc_identity, kyc_business, kyc_bank, kyc_agreement, admin_notes, login_id, temp_password, vendor_user_id, vendor_id, onboarding_automated_at, kyc_approved_at, created_at, updated_at
    `,
    applicationId,
    loginId,
    tempPassword,
    user.id,
    vendor.id
  );

  return toVendorApplication(updatedRows[0]);
}
