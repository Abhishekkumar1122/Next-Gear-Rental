import { getServerSessionUser } from "@/lib/server-session";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export async function POST(request: Request) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized. Vendor session required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = changePasswordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid password" },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  // 1. Update User password hash
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: newHash },
  });

  // 2. Clear temp_password in VendorApplication so vendor is never prompted again
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "VendorApplication" SET temp_password = NULL, updated_at = NOW() WHERE vendor_user_id = $1`,
      sessionUser.id
    );
  } catch (err) {
    console.warn("[Vendor Change Password] Warning updating VendorApplication:", err);
  }

  return NextResponse.json({
    success: true,
    message: "Password updated successfully. Your new password is now active.",
  });
}
