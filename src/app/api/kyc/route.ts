import { getServerSessionUser } from "@/lib/server-session";
import { listKycAutomationByEmail, submitKycAutomation } from "@/lib/kyc-automation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const kycSchema = z.object({
  fullName: z.string().min(2).max(120),
  documentType: z.enum(["aadhaar", "pan", "license", "passport"]),
  documentNumber: z.string().min(6).max(30),
  dob: z.string().min(10),
  expiryDate: z.string().min(10).optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getServerSessionUser();
  const queryEmail = request.nextUrl.searchParams.get("email")?.trim();
  const email = user?.email?.trim() || queryEmail;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const entries = await listKycAutomationByEmail(email);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  const parsed = kycSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid KYC payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const email = user?.email?.trim() || payload.email?.trim();

  if (!email) {
    return NextResponse.json({ error: "Please log in or provide an email" }, { status: 401 });
  }

  const entry = await submitKycAutomation({
    userEmail: email,
    fullName: payload.fullName,
    documentType: payload.documentType,
    documentNumber: payload.documentNumber,
    dob: payload.dob,
    expiryDate: payload.expiryDate,
  });

  return NextResponse.json({ entry }, { status: 201 });
}
