import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type KycAutomationStatus = "approved" | "review" | "rejected";

export type KycAutomationEntry = {
  id: string;
  userEmail: string;
  fullName: string;
  documentType: "aadhaar" | "pan" | "license" | "passport";
  documentNumber: string;
  dob: string;
  expiryDate?: string;
  score: number;
  status: KycAutomationStatus;
  flags: string[];
  createdAt: string;
};

type KycRow = {
  id: string;
  user_email: string;
  full_name: string;
  document_type: string;
  document_number: string;
  dob: Date;
  expiry_date: Date | null;
  score: number;
  status: string;
  flags_json: string;
  created_at: Date;
};

const inMemoryKycEntries: KycAutomationEntry[] = [];
let ensured = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeStatus(status: string): KycAutomationStatus {
  if (status === "approved" || status === "rejected") return status;
  return "review";
}

function mapRow(row: KycRow): KycAutomationEntry {
  return {
    id: row.id,
    userEmail: row.user_email,
    fullName: row.full_name,
    documentType: (row.document_type as KycAutomationEntry["documentType"]) || "aadhaar",
    documentNumber: row.document_number,
    dob: row.dob.toISOString().slice(0, 10),
    expiryDate: row.expiry_date?.toISOString().slice(0, 10),
    score: row.score,
    status: normalizeStatus(row.status),
    flags: JSON.parse(row.flags_json || "[]"),
    createdAt: row.created_at.toISOString(),
  };
}

async function ensureTable() {
  if (!process.env.DATABASE_URL || ensured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "KycAutomation" (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL,
      dob DATE NOT NULL,
      expiry_date DATE,
      score INT NOT NULL,
      status TEXT NOT NULL,
      flags_json TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "KycAutomation_user_email_idx"
    ON "KycAutomation"(user_email)
  `);

  ensured = true;
}

function evaluateKyc(input: {
  fullName: string;
  documentType: KycAutomationEntry["documentType"];
  documentNumber: string;
  dob: string;
  expiryDate?: string;
}) {
  let score = 100;
  const flags: string[] = [];

  const trimmedName = input.fullName.trim();
  if (trimmedName.length < 3) {
    score -= 15;
    flags.push("Name looks too short.");
  }

  const doc = input.documentNumber.trim().toUpperCase();
  const patterns: Record<KycAutomationEntry["documentType"], RegExp> = {
    aadhaar: /^\d{12}$/,
    pan: /^[A-Z]{5}\d{4}[A-Z]$/,
    license: /^[A-Z0-9-]{8,20}$/,
    passport: /^[A-PR-WY][1-9]\d{6}$/,
  };

  if (!patterns[input.documentType].test(doc)) {
    score -= 35;
    flags.push(`Invalid ${input.documentType.toUpperCase()} format.`);
  }

  const dob = new Date(`${input.dob}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) {
    score -= 30;
    flags.push("Invalid date of birth.");
  } else {
    const now = new Date();
    let age = now.getUTCFullYear() - dob.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;

    if (age < 18) {
      score -= 50;
      flags.push("User must be 18+ years old.");
    }
  }

  if (input.expiryDate) {
    const expiry = new Date(`${input.expiryDate}T00:00:00Z`);
    if (Number.isNaN(expiry.getTime())) {
      score -= 15;
      flags.push("Invalid document expiry date.");
    } else if (expiry < new Date()) {
      score -= 40;
      flags.push("Document has expired.");
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const status: KycAutomationStatus = finalScore >= 80 ? "approved" : finalScore >= 55 ? "review" : "rejected";
  return { score: finalScore, status, flags };
}

export async function submitKycAutomation(input: {
  userEmail: string;
  fullName: string;
  documentType: KycAutomationEntry["documentType"];
  documentNumber: string;
  dob: string;
  expiryDate?: string;
}) {
  const userEmail = normalizeEmail(input.userEmail);
  const result = evaluateKyc(input);

  const entry: KycAutomationEntry = {
    id: randomUUID(),
    userEmail,
    fullName: input.fullName.trim(),
    documentType: input.documentType,
    documentNumber: input.documentNumber.trim().toUpperCase(),
    dob: input.dob,
    expiryDate: input.expiryDate,
    score: result.score,
    status: result.status,
    flags: result.flags,
    createdAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    inMemoryKycEntries.unshift(entry);
    return entry;
  }

  await ensureTable();

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "KycAutomation" (
        id, user_email, full_name, document_type, document_number, dob, expiry_date, score, status, flags_json, created_at
      )
      VALUES (
        ${entry.id}, ${entry.userEmail}, ${entry.fullName}, ${entry.documentType}, ${entry.documentNumber},
        ${entry.dob}::date, ${entry.expiryDate ? Prisma.sql`${entry.expiryDate}::date` : Prisma.sql`NULL`},
        ${entry.score}, ${entry.status}, ${JSON.stringify(entry.flags)}, NOW()
      )
    `,
  );

  return entry;
}

export async function listKycAutomationByEmail(userEmail: string) {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return inMemoryKycEntries.filter((entry) => entry.userEmail === normalizedEmail);
  }

  await ensureTable();
  const rows = await prisma.$queryRaw<KycRow[]>(Prisma.sql`
    SELECT id, user_email, full_name, document_type, document_number, dob, expiry_date, score, status, flags_json, created_at
    FROM "KycAutomation"
    WHERE LOWER(user_email) = LOWER(${normalizedEmail})
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return rows.map(mapRow);
}
