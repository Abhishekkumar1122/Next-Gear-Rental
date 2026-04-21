import { createSessionToken, hashPassword, authCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  password: z.string().min(8),
}).refine(
  (data) => data.email || data.phone,
  "Either email or phone number is required"
);

export async function POST(request: Request) {
  const parseResult = registerSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  const { name, email, phone, password } = parseResult.data;
  const passwordHash = await hashPassword(password);

  const hasDatabase = Boolean(process.env.DATABASE_URL);
  let userId = "";

  if (hasDatabase) {
    const existing = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findFirst({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: email ? "Email already registered" : "Phone already registered" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, ...(email && { email }), ...(phone && { phone }), passwordHash, role: "CUSTOMER" },
      select: { id: true, email: true },
    });
    userId = user.id;
  } else {
    const existing = email
      ? runtimeUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
      : runtimeUsers.find((u) => u.phone === phone);
    if (existing) {
      return NextResponse.json({ error: email ? "Email already registered" : "Phone already registered" }, { status: 409 });
    }

    userId = `usr-${runtimeUsers.length + 1}`;
    runtimeUsers.push({ id: userId, name, email: email || "", phone, passwordHash, role: "CUSTOMER" });
  }

  const token = await createSessionToken({ sub: userId, email: email || "mobile-user", role: "CUSTOMER" });
  const response = NextResponse.json({ message: "Registration successful" }, { status: 201 });
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
