import { assertAdminMutationRequest } from "@/lib/admin-security";
import { setVehicleAvailabilityOverride } from "@/lib/vehicle-availability-db";
import { adminVehicleStatusStore, normalizeAvailabilityStatus } from "@/lib/vehicle-availability";
import { processWaitlistForVehicleRelease } from "@/lib/waitlist";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["available", "unavailable", "maintenance", "crashed"]),
  note: z.string().max(250).optional(),
  unavailableUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type Props = {
  params: Promise<{ vehicleId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { vehicleId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
  }

  const normalizedStatus = normalizeAvailabilityStatus(parsed.data.status);
  const payload = {
    status: normalizedStatus,
    note: parsed.data.note?.trim() || undefined,
    unavailableUntil: parsed.data.unavailableUntil,
  };

  if (process.env.DATABASE_URL) {
    await setVehicleAvailabilityOverride(vehicleId, payload);
  } else {
    adminVehicleStatusStore[vehicleId] = payload;
  }

  const waitlistResult =
    payload.status === "available"
      ? await processWaitlistForVehicleRelease({
          vehicleId,
          reason: payload.note,
        })
      : { notifiedCount: 0 };

  return NextResponse.json({
    message: "Vehicle availability status updated",
    vehicleId,
    status: payload.status,
    note: payload.note,
    unavailableUntil: payload.unavailableUntil,
    waitlistNotified: waitlistResult.notifiedCount,
  });
}
