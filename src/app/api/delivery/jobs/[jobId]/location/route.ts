import { prisma } from "@/lib/prisma";
import { deliveryJobsStore, driversStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  recordedAt: z.string().optional(),
  driverId: z.string().optional(),
});

type Props = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const { jobId } = await params;
  const payload = await request.json();
  const parsed = locationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { lat, lng, recordedAt, driverId } = parsed.data;
  const stamp = recordedAt ? new Date(recordedAt) : new Date();

  if (false && hasDatabase) {
    // Prisma code disabled - configure DATABASE_URL to enable
    const job = await (prisma as any).deliveryJob.update({
      where: { id: jobId },
      data: { liveLat: lat, liveLng: lng, lastLocationAt: stamp },
    });

    if (driverId) {
      await (prisma as any).driver.update({
        where: { id: driverId },
        data: { currentLat: lat, currentLng: lng, lastActiveAt: stamp },
      });
    }

    return NextResponse.json({ jobId: job.id, liveLat: job.liveLat, liveLng: job.liveLng });
  }

  const job = deliveryJobsStore.find((item) => item.id === jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  job.liveLat = lat;
  job.liveLng = lng;
  job.lastLocationAt = stamp.toISOString();
  job.updatedAt = new Date().toISOString();

  if (driverId) {
    const driver = driversStore.find((item) => item.id === driverId);
    if (driver) {
      driver.currentLat = lat;
      driver.currentLng = lng;
      driver.lastActiveAt = stamp.toISOString();
    }
  }

  return NextResponse.json({ jobId: job.id, liveLat: job.liveLat, liveLng: job.liveLng });
}
