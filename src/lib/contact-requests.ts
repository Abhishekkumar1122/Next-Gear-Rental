import { prisma } from "@/lib/prisma";

export type ContactRequestStatus = "new" | "in-progress" | "resolved";

export type ContactRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
};

type ContactRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

type ContactRequestRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: Date;
  updated_at: Date;
};

let ensuredTable = false;
const runtimeContactRequests: ContactRequest[] = [];

function toContactRequest(row: ContactRequestRow): ContactRequest {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: (row.status as ContactRequestStatus) || "new",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ContactRequest" (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  ensuredTable = true;
}

export async function createContactRequest(input: ContactRequestInput): Promise<ContactRequest> {
  if (!process.env.DATABASE_URL) {
    const now = new Date().toISOString();
    const request: ContactRequest = {
      id: `cr_${crypto.randomUUID()}`,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      message: input.message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    runtimeContactRequests.unshift(request);
    return request;
  }

  await ensureTable();

  const id = `cr_${crypto.randomUUID()}`;
  const rows = await prisma.$queryRawUnsafe<ContactRequestRow[]>(
    `
      INSERT INTO "ContactRequest" (id, full_name, email, phone, message, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'new', NOW(), NOW())
      RETURNING id, full_name, email, phone, message, status, created_at, updated_at
    `,
    id,
    input.fullName,
    input.email,
    input.phone,
    input.message
  );

  return toContactRequest(rows[0]);
}

export async function getContactRequests(params?: {
  status?: ContactRequestStatus | "all";
  query?: string;
  limit?: number;
}): Promise<ContactRequest[]> {
  const status = params?.status ?? "all";
  const query = params?.query?.trim().toLowerCase() ?? "";
  const limit = Math.max(1, Math.min(params?.limit ?? 100, 500));

  if (!process.env.DATABASE_URL) {
    return runtimeContactRequests
      .filter((item) => (status === "all" ? true : item.status === status))
      .filter((item) => {
        if (!query) return true;
        return (
          item.fullName.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.phone.toLowerCase().includes(query) ||
          item.message.toLowerCase().includes(query)
        );
      })
      .slice(0, limit);
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<ContactRequestRow[]>(
    `
      SELECT id, full_name, email, phone, message, status, created_at, updated_at
      FROM "ContactRequest"
      WHERE ($1 = 'all' OR status = $1)
      AND (
        $2 = ''
        OR LOWER(full_name) LIKE '%' || $2 || '%'
        OR LOWER(email) LIKE '%' || $2 || '%'
        OR LOWER(phone) LIKE '%' || $2 || '%'
        OR LOWER(message) LIKE '%' || $2 || '%'
      )
      ORDER BY created_at DESC
      LIMIT $3
    `,
    status,
    query,
    limit
  );

  return rows.map(toContactRequest);
}

export async function updateContactRequestStatus(id: string, status: ContactRequestStatus): Promise<ContactRequest | null> {
  if (!process.env.DATABASE_URL) {
    const existing = runtimeContactRequests.find((item) => item.id === id);
    if (!existing) return null;

    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<ContactRequestRow[]>(
    `
      UPDATE "ContactRequest"
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, phone, message, status, created_at, updated_at
    `,
    id,
    status
  );

  if (!rows.length) return null;
  return toContactRequest(rows[0]);
}
