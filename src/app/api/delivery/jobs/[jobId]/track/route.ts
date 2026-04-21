import { prisma } from "@/lib/prisma";
import { deliveryJobsStore } from "@/lib/store";
import { DeliveryJobStatus } from "@/lib/types";
import { NextResponse } from "next/server";

const hasDatabase = Boolean(process.env.DATABASE_URL);

function normalizeStatus(status: string): DeliveryJobStatus {
  switch (status.toUpperCase()) {
    case "EN_ROUTE":
      return "en_route";
    case "ARRIVED":
      return "arrived";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

type Props = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_: Request, { params }: Props) {
  const { jobId } = await params;

  if (false && hasDatabase) {
    // Prisma code disabled - configure DATABASE_URL to enable
    const job = await (prisma as any).deliveryJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: normalizeStatus(job.status),
      scheduledAt: job.scheduledAt?.toISOString(),
      liveLat: job.liveLat ?? undefined,
      liveLng: job.liveLng ?? undefined,
      lastLocationAt: job.lastLocationAt?.toISOString(),
      endLat: job.endLat ?? undefined,
      endLng: job.endLng ?? undefined,
    });
  }

  const job = deliveryJobsStore.find((item) => item.id === jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    scheduledAt: job.scheduledAt,
    liveLat: job.liveLat,
    liveLng: job.liveLng,
    lastLocationAt: job.lastLocationAt,
    endLat: job.endLat,
    endLng: job.endLng,
  });
}
