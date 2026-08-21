import { createSessionToken, hashPassword, authCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  password: z.string().min(8),
}).refine(
  (data) => data.email || data.phone,
  "Either email or phone number is required"
);

export async function POST(request: NextRequest) {
  const parseResult = registerSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  const { name, email, phone, password } = parseResult.data;
  const passwordHash = await hashPassword(password);

  const hasDatabase = Boolean(process.env.DATABASE_URL);
  let userId = "";

  if (hasDatabase) {
    const conditions = [];
    if (phone) conditions.push({ phone });
    if (email) conditions.push({ email });

    const existing = await prisma.user.findFirst({
      where: { OR: conditions },
      select: { email: true, phone: true },
    });

    if (existing) {
      if (phone && existing.phone === phone) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }
      return NextResponse.json({ error: "Email address already registered" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, ...(email && { email }), ...(phone && { phone }), passwordHash, role: "CUSTOMER" },
      select: { id: true, email: true },
    });
    userId = user.id;
  } else {
    const existing = runtimeUsers.find(
      (u) => (phone && u.phone === phone) || (email && u.email.toLowerCase() === email.toLowerCase())
    );
    if (existing) {
      if (phone && existing.phone === phone) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }
      return NextResponse.json({ error: "Email address already registered" }, { status: 409 });
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

  if (email) {
    const origin = request.nextUrl.origin;
    try {
      const { generateWelcomeEmailHtml } = await import("@/lib/email-templates");
      const { dispatchHtmlEmail } = await import("@/lib/alert-dispatch");
      const welcomeHtml = generateWelcomeEmailHtml({ userName: name, couponCode: "WELCOME10", baseUrl: origin });
      await dispatchHtmlEmail({ to: email, subject: "Welcome to Next Gear Rentals! Claim Your First Ride Offer 🎁", html: welcomeHtml });
    } catch (e) {
      console.error("[Welcome Email Error]", e);
    }
  }

  if (phone) {
    try {
      const { dispatchAlert } = await import("@/lib/alert-dispatch");
      const { normalizeWhatsAppPhone } = await import("@/lib/whatsapp-service");
      const waPhone = normalizeWhatsAppPhone(phone);
      if (waPhone) {
        await dispatchAlert({
          channel: "whatsapp",
          to: waPhone,
          message: `🎉 *WELCOME TO NEXT GEAR RENTALS!* 🛵🚗\n\nHello *${name}*,\nWelcome to India's premier self-drive bike and car rental platform!\n\n🎁 *Special Welcome Offer:*\nUse coupon code *WELCOME10* on checkout for instant 10% OFF on your first ride.\n\n🌐 Explore Fleet: https://next-gear.app/vehicles\n📞 Support: support@next-gear.app\n\nHave a safe & thrilling journey! 🚀`,
        });
      }
    } catch (err) {
      console.error("[Welcome WhatsApp Alert Error]", err);
    }
  }

  return response;
}
