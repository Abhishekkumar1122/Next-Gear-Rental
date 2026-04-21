import { hashOtp } from "@/lib/auth";
import { createPasswordResetCode, findUserByContact } from "@/lib/password-reset";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { z } from "zod";

const forgotPasswordRequestSchema = z.object({
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
  const parseResult = forgotPasswordRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { email, phone } = parseResult.data;
  const identifier = email || phone || "";

  const user = await findUserByContact({ email, phone });
  if (!user) {
    return NextResponse.json({
      message: `If an account exists, reset OTP has been sent to your ${email ? "email" : "phone"}.`,
    });
  }

  const otp = generateOtp();
  const codeHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await createPasswordResetCode({
    userId: user.id,
    identifier,
    codeHash,
    expiresAt,
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && email) {
    const resend = new Resend(apiKey);
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@nextgear.example",
        to: email,
        subject: "Next Gear password reset OTP",
        html: `<p>Your Next Gear password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });
    } catch {
      return NextResponse.json({ error: "Unable to send reset OTP email" }, { status: 500 });
    }
  } else if (phone) {
    console.log(`Password reset OTP sent to ${phone}: ${otp}`);
  }

  return NextResponse.json({
    message: `Reset OTP sent to your ${email ? "email" : "phone"}.`,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
}
