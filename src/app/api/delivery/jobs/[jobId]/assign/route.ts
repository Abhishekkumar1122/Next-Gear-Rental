import { prisma } from "@/lib/prisma";
import { deliveryJobsStore } from "@/lib/store";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const assignSchema = z.object({
  driverId: z.string().min(1),
});

type Props = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const { jobId } = await params;
  const payload = await request.json();
  const parsed = assignSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { driverId } = parsed.data;

  if (hasDatabase) {
    // Prisma code disabled - configure DATABASE_URL to enable
    const job = await (prisma as any).deliveryJob.update({
      where: { id: jobId },
      data: { assignedDriverId: driverId },
    });

    await (prisma as any).deliveryEvent.create({
      data: {
        jobId,
        status: job.status,
        message: `Assigned driver ${driverId}`,
        createdBy: "system",
      },
    });

    return NextResponse.json({ jobId: job.id, assignedDriverId: job.assignedDriverId });
  }

  const job = deliveryJobsStore.find((item) => item.id === jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  job.assignedDriverId = driverId;
  job.updatedAt = new Date().toISOString();

  // Trigger Doorstep Delivery Assignment Email
  if ((job as any).customerEmail) {
    const origin = request.nextUrl.origin;
    const customerEmail = (job as any).customerEmail;
    const customerName = (job as any).customerName || "Valued Rider";
    const vehicleTitle = (job as any).vehicleTitle || "Rental Vehicle";
    const deliveryOtp = (job as any).deliveryOtp || "3914";
    void (async () => {
      try {
        const { generateDeliveryAssignmentEmailHtml } = await import("@/lib/email-templates");
        const { dispatchHtmlEmail } = await import("@/lib/alert-dispatch");
        const html = generateDeliveryAssignmentEmailHtml({
          bookingId: (job as any).bookingId || jobId,
          customerName,
          vehicleTitle,
          driverName: driverId,
          deliveryOtp,
          baseUrl: origin,
        });
        await dispatchHtmlEmail({
          to: customerEmail,
          subject: "Your Next Gear Rental Vehicle is Out For Delivery! 🚚",
          html,
        });
      } catch (e) {
        console.error("[Delivery Assignment Email Failed]", e);
      }
    })();
  }

  return NextResponse.json({ jobId: job.id, assignedDriverId: job.assignedDriverId });
}
