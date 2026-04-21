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
      job: {
        id: job.id,
        bookingId: job.bookingId,
        type: job.type.toLowerCase(),
        status: normalizeStatus(job.status),
        scheduledAt: job.scheduledAt?.toISOString(),
        assignedDriverId: job.assignedDriverId ?? undefined,
        startLat: job.startLat ?? undefined,
        startLng: job.startLng ?? undefined,
        endLat: job.endLat ?? undefined,
        endLng: job.endLng ?? undefined,
        liveLat: job.liveLat ?? undefined,
        liveLng: job.liveLng ?? undefined,
        lastLocationAt: job.lastLocationAt?.toISOString(),
        notes: job.notes ?? undefined,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        otpHint: job.otpHash ? "**" : undefined,
      },
    });
  }

  const job = deliveryJobsStore.find((item) => item.id === jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
