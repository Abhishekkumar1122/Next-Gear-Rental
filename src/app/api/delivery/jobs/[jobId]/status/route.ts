import { prisma } from "@/lib/prisma";
import { deliveryJobsStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const statusSchema = z.object({
  status: z.enum(["scheduled", "en_route", "arrived", "completed", "cancelled"]),
  message: z.string().optional(),
  createdBy: z.string().optional(),
});

type Props = {
  params: Promise<{ jobId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  const { jobId } = await params;
  const payload = await request.json();
  const parsed = statusSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { status, message, createdBy } = parsed.data;
  const statusEnum = status.toUpperCase() as "SCHEDULED" | "EN_ROUTE" | "ARRIVED" | "COMPLETED" | "CANCELLED";

  if (false && hasDatabase) {
    // Prisma code disabled - configure DATABASE_URL to enable
    const job = await (prisma as any).deliveryJob.update({
      where: { id: jobId },
      data: { status: statusEnum },
    });

    await (prisma as any).deliveryEvent.create({
      data: {
        jobId,
        status: statusEnum,
        message: message ?? undefined,
        createdBy: createdBy ?? "system",
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
    });
  }

  const job = deliveryJobsStore.find((item) => item.id === jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  job.status = status;
  job.updatedAt = new Date().toISOString();

  return NextResponse.json({ jobId: job.id, status: job.status });
}
