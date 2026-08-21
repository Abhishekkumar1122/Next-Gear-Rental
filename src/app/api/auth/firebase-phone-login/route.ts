import { authCookieName, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const firebasePhoneLoginSchema = z.object({
  phone: z.string().min(10),
  uid: z.string().optional(),
  idToken: z.string().optional(),
  name: z.string().optional(),
});

function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export async function POST(request: Request) {
  const parseResult = firebasePhoneLoginSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid payload for Firebase phone login" }, { status: 400 });
  }

  const { phone: rawPhone, name } = parseResult.data;
  const phone = cleanPhoneNumber(rawPhone);

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "Invalid 10-digit phone number" }, { status: 400 });
  }

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  let user: { id: string; email: string | null; phone: string | null; role: string; name: string } | null = null;

  if (hasDatabase) {
    try {
      const existing = await prisma.user.findFirst({
        where: { phone },
        select: { id: true, email: true, phone: true, role: true, name: true },
      });

      if (existing) {
        user = existing;
      } else {
        const created = await prisma.user.create({
          data: {
            name: name || `Rider ${phone.slice(-4)}`,
            phone,
            role: "CUSTOMER",
          },
          select: { id: true, email: true, phone: true, role: true, name: true },
        });
        user = created;
      }
    } catch (dbErr) {
      console.warn("DB query error in firebase-phone-login, falling back to runtimeUsers:", dbErr);
    }
  }

  if (!user) {
    let existing = runtimeUsers.find((u) => u.phone === phone);
    if (!existing) {
      existing = {
        id: `usr-${runtimeUsers.length + 1}`,
        name: name || `Phone Rider ${phone.slice(-4)}`,
        email: "",
        phone,
        passwordHash: "",
        role: "CUSTOMER",
      };
      runtimeUsers.push(existing);
    }
    user = {
      id: existing.id,
      email: existing.email || null,
      phone: existing.phone || null,
      role: existing.role,
      name: existing.name,
    };
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email || `${phone}@nextgear.mobile`,
    role: user.role,
  });

  const response = NextResponse.json({
    message: "Firebase Phone Authentication successful",
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
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
