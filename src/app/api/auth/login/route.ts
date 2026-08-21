import { authCookieName, createSessionToken, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  password: z.string().min(6),
}).refine(
  (data) => data.email || data.phone,
  "Either email or phone number is required"
);

export async function POST(request: Request) {
  const parseResult = loginSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
  }

  const { email, phone, password } = parseResult.data;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@next-gear.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@NextGear2026";

  // Master Admin Authentication Check
  if (email && email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    const token = await createSessionToken({ sub: "usr-admin-master", email: adminEmail, role: "ADMIN" });
    const response = NextResponse.json({
      message: "Admin login successful",
      user: {
        id: "usr-admin-master",
        email: adminEmail,
        role: "ADMIN",
      },
    });
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  let user: { id: string; email: string | null; role: string; passwordHash: string | null } | null = null;

  if (hasDatabase) {
    try {
      user = email
        ? await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, role: true, passwordHash: true },
          })
        : await prisma.user.findFirst({
            where: { phone },
            select: { id: true, email: true, role: true, passwordHash: true },
          });
    } catch (e) {
      console.warn("Prisma user query fallback:", e);
    }
  }

  if (!user) {
    const found = email
      ? runtimeUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
      : runtimeUsers.find((entry) => entry.phone === phone);
    if (found) {
      user = {
        id: found.id,
        email: found.email,
        role: found.role,
        passwordHash: found.passwordHash,
      };
    }
  }

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({ sub: user.id, email: user.email || "mobile-user", role: user.role });
  const response = NextResponse.json({
    message: "Login successful",
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
