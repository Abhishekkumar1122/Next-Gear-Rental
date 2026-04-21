import { prisma } from "@/lib/prisma";
import { deliveryJobsStore, deliveryOtpStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const otpSchema = z.object({
  code: z.string().min(4),
});

type Props = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const { jobId } = await params;
  const payload = await request.json();
  const parsed = otpSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { code } = parsed.data;

  if (false && hasDatabase) {
    // Prisma code disabled - configure DATABASE_URL to enable
    const job = await (prisma as any).deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || !job.otpHash || !job.otpSalt) {
      return NextResponse.json({ error: "Job or OTP not found" }, { status: 404 });
    }

    const hash = crypto.createHash("sha256").update(`${code}|${job.otpSalt}`).digest("hex");
    if (hash !== job.otpHash) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    const updated = await (prisma as any).deliveryJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });

    await (prisma as any).deliveryEvent.create({
      data: {
        jobId,
        status: "COMPLETED",
        message: "OTP verified. Handoff completed.",
        createdBy: "system",
      },
    });

    return NextResponse.json({ verified: true, status: updated.status });
  }

  const job = deliveryJobsStore.find((item) => item.id === jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const expected = deliveryOtpStore[jobId];
  if (!expected || expected !== code) {
    return NextResponse.json({ verified: false }, { status: 401 });
  }

  job.status = "completed";
  job.updatedAt = new Date().toISOString();

  return NextResponse.json({ verified: true, status: job.status });
}
