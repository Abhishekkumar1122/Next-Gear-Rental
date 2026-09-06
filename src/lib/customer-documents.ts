import { prisma } from "@/lib/prisma";

export type CustomerDocumentsData = {
  bookingId?: string;
  userId?: string;
  phone?: string;
  email?: string;
  dlUrl?: string | null;
  dlNo?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarFrontNo?: string | null;
  aadhaarBackUrl?: string | null;
  hasDocs: boolean;
};

let tableEnsured = false;

export async function ensureCustomerBookingDocsTable(): Promise<void> {
  if (tableEnsured || !process.env.DATABASE_URL) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomerBookingDocuments" (
        booking_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        dl_url TEXT,
        dl_no TEXT,
        aadhaar_front_url TEXT,
        aadhaar_front_no TEXT,
        aadhaar_back_url TEXT,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CustomerBookingDocuments_phone_idx"
      ON "CustomerBookingDocuments"(phone);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CustomerBookingDocuments_user_id_idx"
      ON "CustomerBookingDocuments"(user_id);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS customer_kyc_profiles (
        phone TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        verified_at TIMESTAMP(3),
        expires_at TIMESTAMP(3),
        documents_json TEXT
      );
    `);

    tableEnsured = true;
  } catch (err) {
    console.error("[CustomerBookingDocs] ensureTable error:", err);
  }
}

// In-memory fallback cache for development or serverless instances
const inMemoryCustomerDocs = new Map<string, CustomerDocumentsData>();

export async function saveCustomerBookingDocs(params: {
  bookingId: string;
  userId: string;
  phone?: string | null;
  email?: string | null;
  dlUrl?: string | null;
  dlNo?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarFrontNo?: string | null;
  aadhaarBackUrl?: string | null;
}): Promise<void> {
  const cleanPhone = params.phone ? params.phone.replace(/\D/g, "").slice(-10) : "";
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : "";

  const docRecord: CustomerDocumentsData = {
    bookingId: params.bookingId,
    userId: params.userId,
    phone: cleanPhone || undefined,
    email: cleanEmail || undefined,
    dlUrl: params.dlUrl || null,
    dlNo: params.dlNo || null,
    aadhaarFrontUrl: params.aadhaarFrontUrl || null,
    aadhaarFrontNo: params.aadhaarFrontNo || null,
    aadhaarBackUrl: params.aadhaarBackUrl || null,
    hasDocs: Boolean(params.dlUrl || params.aadhaarFrontUrl || params.aadhaarBackUrl),
  };

  // 1. In-memory cache
  inMemoryCustomerDocs.set(params.bookingId, docRecord);
  if (cleanPhone) inMemoryCustomerDocs.set(`phone:${cleanPhone}`, docRecord);
  if (cleanEmail) inMemoryCustomerDocs.set(`email:${cleanEmail}`, docRecord);

  if (!process.env.DATABASE_URL) return;

  await ensureCustomerBookingDocsTable();

  // 2. Persist to "CustomerBookingDocuments"
  try {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "CustomerBookingDocuments" (
        booking_id, user_id, phone, email, dl_url, dl_no, aadhaar_front_url, aadhaar_front_no, aadhaar_back_url, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (booking_id)
      DO UPDATE SET
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        dl_url = COALESCE(EXCLUDED.dl_url, "CustomerBookingDocuments".dl_url),
        dl_no = COALESCE(EXCLUDED.dl_no, "CustomerBookingDocuments".dl_no),
        aadhaar_front_url = COALESCE(EXCLUDED.aadhaar_front_url, "CustomerBookingDocuments".aadhaar_front_url),
        aadhaar_front_no = COALESCE(EXCLUDED.aadhaar_front_no, "CustomerBookingDocuments".aadhaar_front_no),
        aadhaar_back_url = COALESCE(EXCLUDED.aadhaar_back_url, "CustomerBookingDocuments".aadhaar_back_url),
        updated_at = CURRENT_TIMESTAMP;
      `,
      params.bookingId,
      params.userId,
      cleanPhone || null,
      cleanEmail || null,
      params.dlUrl || null,
      params.dlNo || null,
      params.aadhaarFrontUrl || null,
      params.aadhaarFrontNo || null,
      params.aadhaarBackUrl || null
    );
  } catch (dbErr) {
    console.warn("[CustomerBookingDocs] Failed to insert into CustomerBookingDocuments:", dbErr);
  }

  // 3. Persist to Prisma UserDocument table
  try {
    if (params.dlUrl) {
      await prisma.userDocument.create({
        data: {
          userId: params.userId,
          type: "license",
          fileUrl: params.dlUrl,
        },
      }).catch(() => {});
    }
    if (params.aadhaarFrontUrl) {
      await prisma.userDocument.create({
        data: {
          userId: params.userId,
          type: "aadhaar_front",
          fileUrl: params.aadhaarFrontUrl,
        },
      }).catch(() => {});
    }
    if (params.aadhaarBackUrl) {
      await prisma.userDocument.create({
        data: {
          userId: params.userId,
          type: "aadhaar_back",
          fileUrl: params.aadhaarBackUrl,
        },
      }).catch(() => {});
    }
  } catch (userDocErr) {
    console.warn("[CustomerBookingDocs] Failed to save UserDocument:", userDocErr);
  }

  // 4. Update customer_kyc_profiles for 6-month fast track
  if (cleanPhone) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      const docsPayload = JSON.stringify({
        dlUrl: params.dlUrl || null,
        dlNo: params.dlNo || null,
        aadhaarFrontUrl: params.aadhaarFrontUrl || null,
        aadhaarBackUrl: params.aadhaarBackUrl || null,
        aadhaarNo: params.aadhaarFrontNo || null,
      });

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO customer_kyc_profiles (phone, email, full_name, verified_at, expires_at, documents_json)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (phone)
        DO UPDATE SET
          email = COALESCE(EXCLUDED.email, customer_kyc_profiles.email),
          verified_at = EXCLUDED.verified_at,
          expires_at = EXCLUDED.expires_at,
          documents_json = EXCLUDED.documents_json;
        `,
        cleanPhone,
        cleanEmail || null,
        null,
        now,
        expiresAt,
        docsPayload
      );
    } catch (kycErr) {
      console.warn("[CustomerBookingDocs] Failed to update customer_kyc_profiles:", kycErr);
    }
  }
}

export async function getCustomerBookingDocs(params: {
  bookingId?: string | null;
  userId?: string | null;
  phone?: string | null;
  email?: string | null;
}): Promise<CustomerDocumentsData> {
  const cleanPhone = params.phone ? params.phone.replace(/\D/g, "").slice(-10) : "";
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : "";

  // 1. Check in-memory store
  if (params.bookingId && inMemoryCustomerDocs.has(params.bookingId)) {
    return inMemoryCustomerDocs.get(params.bookingId)!;
  }
  if (cleanPhone && inMemoryCustomerDocs.has(`phone:${cleanPhone}`)) {
    return inMemoryCustomerDocs.get(`phone:${cleanPhone}`)!;
  }
  if (cleanEmail && inMemoryCustomerDocs.has(`email:${cleanEmail}`)) {
    return inMemoryCustomerDocs.get(`email:${cleanEmail}`)!;
  }

  if (!process.env.DATABASE_URL) {
    return { hasDocs: false };
  }

  await ensureCustomerBookingDocsTable();

  // 2. Query CustomerBookingDocuments table
  try {
    let rows: any[] = [];
    if (params.bookingId) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT * FROM "CustomerBookingDocuments" WHERE booking_id = $1 LIMIT 1`,
        params.bookingId
      );
    }

    if ((!rows || rows.length === 0) && (cleanPhone || cleanEmail || params.userId)) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT * FROM "CustomerBookingDocuments" 
         WHERE (phone IS NOT NULL AND phone = $1) 
            OR (email IS NOT NULL AND email = $2) 
            OR (user_id IS NOT NULL AND user_id = $3)
         ORDER BY updated_at DESC LIMIT 1`,
        cleanPhone || "___",
        cleanEmail || "___",
        params.userId || "___"
      );
    }

    if (rows && rows.length > 0) {
      const r = rows[0];
      const result: CustomerDocumentsData = {
        bookingId: r.booking_id,
        userId: r.user_id,
        phone: r.phone,
        email: r.email,
        dlUrl: r.dl_url || null,
        dlNo: r.dl_no || null,
        aadhaarFrontUrl: r.aadhaar_front_url || null,
        aadhaarFrontNo: r.aadhaar_front_no || null,
        aadhaarBackUrl: r.aadhaar_back_url || null,
        hasDocs: Boolean(r.dl_url || r.aadhaar_front_url || r.aadhaar_back_url),
      };
      if (params.bookingId) inMemoryCustomerDocs.set(params.bookingId, result);
      return result;
    }
  } catch (err) {
    console.warn("[CustomerBookingDocs] Query error on CustomerBookingDocuments:", err);
  }

  // 3. Fallback to customer_kyc_profiles
  if (cleanPhone || cleanEmail) {
    try {
      const kycRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT documents_json FROM customer_kyc_profiles 
         WHERE phone = $1 OR email = $2 LIMIT 1`,
        cleanPhone || "___",
        cleanEmail || "___"
      );
      if (kycRows && kycRows.length > 0 && kycRows[0].documents_json) {
        const parsed = typeof kycRows[0].documents_json === "string" 
          ? JSON.parse(kycRows[0].documents_json) 
          : kycRows[0].documents_json;
        return {
          dlUrl: parsed.dlUrl || null,
          dlNo: parsed.dlNo || null,
          aadhaarFrontUrl: parsed.aadhaarFrontUrl || null,
          aadhaarFrontNo: parsed.aadhaarNo || null,
          aadhaarBackUrl: parsed.aadhaarBackUrl || null,
          hasDocs: Boolean(parsed.dlUrl || parsed.aadhaarFrontUrl || parsed.aadhaarBackUrl),
        };
      }
    } catch {}
  }

  // 4. Fallback to UserDocument table
  if (params.userId) {
    try {
      const userDocs = await prisma.userDocument.findMany({
        where: { userId: params.userId },
        orderBy: { createdAt: "desc" },
      });

      if (userDocs.length > 0) {
        const dl = userDocs.find((d) => d.type === "license")?.fileUrl || null;
        const front = userDocs.find((d) => d.type === "aadhaar_front" || d.type === "aadhaar")?.fileUrl || null;
        const back = userDocs.find((d) => d.type === "aadhaar_back")?.fileUrl || null;

        return {
          userId: params.userId,
          dlUrl: dl,
          aadhaarFrontUrl: front,
          aadhaarBackUrl: back,
          hasDocs: Boolean(dl || front || back),
        };
      }
    } catch {}
  }

  return { hasDocs: false };
}
