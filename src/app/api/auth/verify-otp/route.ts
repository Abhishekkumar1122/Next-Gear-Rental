import { authCookieName, createSessionToken, verifyOtp } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeOtps, runtimeUsers } from "@/lib/runtime-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  email: z.email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  otp: z.string().length(6),
}).refine(
  (data) => data.email || data.phone,
  "Either email or phone number is required"
);

export async function POST(request: Request) {
  const parseResult = verifySchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
  }

  const { email, phone, otp } = parseResult.data;
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const contactIdentifier = email || phone || "";

  let userId = "";
  let userEmail = "";
  let role = "CUSTOMER";
  let matched = false;

  if (hasDatabase) {
    const user = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } })
      : await prisma.user.findFirst({ where: { phone }, select: { id: true, email: true, role: true } });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    userId = user.id;
    userEmail = user.email || email || "";
    role = user.role;

    const latestCode = await prisma.otpCode.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!latestCode || latestCode.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    matched = await verifyOtp(otp, latestCode.codeHash);
    if (matched) {
      await prisma.otpCode.update({
        where: { id: latestCode.id },
        data: { usedAt: new Date() },
      });
    }
  } else {
    const user = email
      ? runtimeUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
      : runtimeUsers.find((entry) => entry.phone === phone);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    userId = user.id;
    userEmail = user.email || email || "";
    role = user.role;

    const latestCode = [...runtimeOtps]
      .reverse()
      .find((entry) => entry.email === contactIdentifier && !entry.used);

    if (!latestCode || latestCode.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    matched = await verifyOtp(otp, latestCode.codeHash);
    if (matched) {
      latestCode.used = true;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }

  const token = await createSessionToken({ sub: userId, email: userEmail, role });
  const response = NextResponse.json({ message: "OTP verified" });
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
