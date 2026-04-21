import { hashOtp } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeOtps, runtimeUsers } from "@/lib/runtime-store";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { z } from "zod";

const otpRequestSchema = z.object({
  email: z.email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
}).refine(
  (data) => data.email || data.phone,
  "Either email or phone number is required"
);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const parseResult = otpRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { email, phone } = parseResult.data;
  const contactIdentifier = email || phone || "";
  const otp = generateOtp();
  const codeHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (hasDatabase) {
    let user = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
      : await prisma.user.findFirst({ where: { phone }, select: { id: true } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: email ? email.split("@")[0] : "Mobile User",
          ...(email && { email }),
          ...(phone && { phone }),
          role: "CUSTOMER",
        },
        select: { id: true },
      });
    }

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });
  } else {
    const identifier = email || phone || "";
    const existing = email
      ? runtimeUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
      : runtimeUsers.find((u) => u.phone === phone);
    
    if (!existing) {
      runtimeUsers.push({
        id: `usr-${runtimeUsers.length + 1}`,
        name: email ? email.split("@")[0] : "Phone User",
        email: email || "",
        phone: phone || "",
        passwordHash: "",
        role: "CUSTOMER",
      });
    }

    runtimeOtps.push({ email: identifier, codeHash, expiresAt, used: false });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && email) {
    const resend = new Resend(apiKey);
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@nextgear.example",
        to: email,
        subject: "Your Next Gear OTP",
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });
    } catch {
      return NextResponse.json({ error: "Unable to send OTP email" }, { status: 500 });
    }
  } else if (phone) {
    // For mobile, you would typically send SMS here
    console.log(`SMS OTP sent to ${phone}: ${otp}`);
  }

  return NextResponse.json({
    message: `OTP sent to your ${email ? "email" : "mobile"}`,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
}
