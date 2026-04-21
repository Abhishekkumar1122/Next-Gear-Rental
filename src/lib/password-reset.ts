import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";

export type PasswordResetUser = {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash?: string | null;
};

type PasswordResetCodeRow = {
  id: string;
  user_id: string;
  identifier: string;
  code_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

type RuntimePasswordResetCode = {
  id: string;
  userId: string;
  identifier: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

let ensuredTable = false;
const runtimePasswordResetCodes: RuntimePasswordResetCode[] = [];

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      identifier TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PasswordResetCode_identifier_idx" ON "PasswordResetCode" (identifier)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PasswordResetCode_user_id_idx" ON "PasswordResetCode" (user_id)`);

  ensuredTable = true;
}

export async function findUserByContact(input: { email?: string; phone?: string }): Promise<PasswordResetUser | null> {
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (hasDatabase) {
    if (input.email) {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true, phone: true, passwordHash: true },
      });
      return user ?? null;
    }

    if (input.phone) {
      const user = await prisma.user.findFirst({
        where: { phone: input.phone },
        select: { id: true, email: true, phone: true, passwordHash: true },
      });
      return user ?? null;
    }

    return null;
  }

  if (input.email) {
    const user = runtimeUsers.find((entry) => entry.email.toLowerCase() === input.email!.toLowerCase());
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || null,
      phone: user.phone || null,
      passwordHash: user.passwordHash,
    };
  }

  if (input.phone) {
    const user = runtimeUsers.find((entry) => entry.phone === input.phone);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || null,
      phone: user.phone || null,
      passwordHash: user.passwordHash,
    };
  }

  return null;
}

export async function createPasswordResetCode(input: {
  userId: string;
  identifier: string;
  codeHash: string;
  expiresAt: Date;
}) {
  if (!process.env.DATABASE_URL) {
    runtimePasswordResetCodes.push({
      id: `prc_${crypto.randomUUID()}`,
      userId: input.userId,
      identifier: input.identifier,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
    return;
  }

  await ensureTable();

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "PasswordResetCode" (id, user_id, identifier, code_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
    `prc_${crypto.randomUUID()}`,
    input.userId,
    input.identifier,
    input.codeHash,
    input.expiresAt
  );
}

export async function getLatestActivePasswordResetCode(identifier: string) {
  if (!process.env.DATABASE_URL) {
    return [...runtimePasswordResetCodes]
      .reverse()
      .find((entry) => entry.identifier === identifier && !entry.usedAt) ?? null;
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<PasswordResetCodeRow[]>(
    `
      SELECT id, user_id, identifier, code_hash, expires_at, used_at, created_at
      FROM "PasswordResetCode"
      WHERE identifier = $1 AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    identifier
  );

  return rows[0] ?? null;
}

export async function markPasswordResetCodeUsed(id: string) {
  if (!process.env.DATABASE_URL) {
    const match = runtimePasswordResetCodes.find((entry) => entry.id === id);
    if (match) {
      match.usedAt = new Date();
    }
    return;
  }

  await ensureTable();

  await prisma.$executeRawUnsafe(
    `
      UPDATE "PasswordResetCode"
      SET used_at = NOW()
      WHERE id = $1
    `,
    id
  );
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  if (!process.env.DATABASE_URL) {
    const match = runtimeUsers.find((entry) => entry.id === userId);
    if (!match) return false;
    match.passwordHash = passwordHash;
    return true;
  }

  const updated = await prisma.user.updateMany({
    where: { id: userId },
    data: { passwordHash },
  });

  return updated.count > 0;
}
