import { hashPassword, verifyOtp } from "@/lib/auth";
import {
  findUserByContact,
  getLatestActivePasswordResetCode,
  markPasswordResetCodeUsed,
  updateUserPassword,
} from "@/lib/password-reset";
import { NextResponse } from "next/server";
import { z } from "zod";

const forgotPasswordResetSchema = z.object({
  email: z.email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
}).refine(
  (data) => data.email || data.phone,
  "Either email or phone number is required"
);

export async function POST(request: Request) {
  const parseResult = forgotPasswordResetSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid reset payload" }, { status: 400 });
  }

  const { email, phone, otp, newPassword } = parseResult.data;
  const identifier = email || phone || "";

  const user = await findUserByContact({ email, phone });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const latestCode = await getLatestActivePasswordResetCode(identifier);
  if (!latestCode) {
    return NextResponse.json({ error: "Reset OTP not found" }, { status: 404 });
  }

  const expiresAt = "expiresAt" in latestCode ? latestCode.expiresAt : latestCode.expires_at;
  if (new Date(expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Reset OTP expired" }, { status: 400 });
  }

  const codeHash = "codeHash" in latestCode ? latestCode.codeHash : latestCode.code_hash;
  const isValidOtp = await verifyOtp(otp, codeHash);
  if (!isValidOtp) {
    return NextResponse.json({ error: "Invalid reset OTP" }, { status: 401 });
  }

  const hashed = await hashPassword(newPassword);
  const passwordUpdated = await updateUserPassword(user.id, hashed);
  if (!passwordUpdated) {
    return NextResponse.json({ error: "Unable to update password" }, { status: 500 });
  }

  const resetCodeId = "id" in latestCode ? latestCode.id : "";
  if (resetCodeId) {
    await markPasswordResetCodeUsed(resetCodeId);
  }

  return NextResponse.json({ message: "Password reset successful. Please login with your new password." });
}
