import { getServerSessionUser } from "@/lib/server-session";
import { listDamageChecklistsByEmail, submitDamageChecklist } from "@/lib/damage-checklist";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  bookingId: z.string().min(1),
  phase: z.enum(["pickup", "dropoff"]),
  checklist: z.object({
    bodyPanelsOk: z.boolean(),
    lightsOk: z.boolean(),
    tyresOk: z.boolean(),
    windshieldOk: z.boolean(),
    mirrorsOk: z.boolean(),
    interiorOk: z.boolean(),
  }),
  fuelLevel: z.string().min(1).max(32),
  odometerKm: z.number().int().min(0),
  notes: z.string().max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(8).optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getServerSessionUser();
  const queryEmail = request.nextUrl.searchParams.get("email")?.trim();
  const email = user?.email?.trim() || queryEmail;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const entries = await listDamageChecklistsByEmail(email);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid damage checklist payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const email = user?.email?.trim() || payload.email?.trim();

  if (!email) {
    return NextResponse.json({ error: "Please log in or provide an email" }, { status: 401 });
  }

  const entry = await submitDamageChecklist({
    bookingId: payload.bookingId,
    userEmail: email,
    phase: payload.phase,
    checklist: payload.checklist,
    fuelLevel: payload.fuelLevel,
    odometerKm: payload.odometerKm,
    notes: payload.notes,
    photoUrls: payload.photoUrls,
  });

  return NextResponse.json({ entry }, { status: 201 });
}
