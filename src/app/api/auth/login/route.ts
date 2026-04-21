import { authCookieName, createSessionToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  password: z.string().min(8),
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

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  let user: { id: string; email: string | null; role: string; passwordHash: string | null } | null = null;

  if (hasDatabase) {
    user = email
      ? await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, role: true, passwordHash: true },
        })
      : await prisma.user.findFirst({
          where: { phone },
          select: { id: true, email: true, role: true, passwordHash: true },
        });
  } else {
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
