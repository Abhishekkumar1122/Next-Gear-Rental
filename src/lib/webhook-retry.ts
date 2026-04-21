import { prisma } from "@/lib/prisma";
import { incrementMetric } from "@/lib/ops-metrics";
import { PaymentStatus, WebhookProvider } from "@prisma/client";

function computeNextRun(attemptCount: number) {
  const delaySeconds = Math.min(300, 2 ** attemptCount * 15);
  return new Date(Date.now() + delaySeconds * 1000);
}

async function applyPaymentStatus(provider: WebhookProvider, providerEntityId: string, target: PaymentStatus) {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: provider.toLowerCase(),
      providerPaymentId: providerEntityId,
    },
    select: { id: true, bookingId: true },
  });

  if (!payment) {
    throw new Error("Payment record not found for retry job");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: target },
  });

  if (target === "PAID") {
    await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
  }

  if (target === "REFUNDED") {
    await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CANCELLED" } });
  }
}

export async function processWebhookRetryJobs(limit = 20) {
  const jobs = await prisma.webhookRetryJob.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      nextRunAt: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
  });

  const results: Array<{ id: string; status: string; message?: string }> = [];

  for (const job of jobs) {
    try {
      await prisma.webhookRetryJob.update({
        where: { id: job.id },
        data: { status: "PROCESSING" },
      });

      if (!job.providerEntityId || !job.targetStatus) {
        throw new Error("Retry job missing providerEntityId or targetStatus");
      }

      await applyPaymentStatus(job.provider, job.providerEntityId, job.targetStatus);

      await prisma.webhookRetryJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          attemptCount: { increment: 1 },
          lastError: null,
        },
      });

      results.push({ id: job.id, status: "COMPLETED" });
      incrementMetric("webhook.retry.completed");
    } catch (error) {
      const attemptCount = job.attemptCount + 1;
      const terminalFailure = attemptCount >= job.maxAttempts;

      await prisma.webhookRetryJob.update({
        where: { id: job.id },
        data: {
          status: terminalFailure ? "FAILED" : "PENDING",
          attemptCount,
          lastError: error instanceof Error ? error.message : "Unknown retry error",
          nextRunAt: terminalFailure ? job.nextRunAt : computeNextRun(attemptCount),
        },
      });

      results.push({
        id: job.id,
        status: terminalFailure ? "FAILED" : "REQUEUED",
        message: error instanceof Error ? error.message : "Unknown retry error",
      });

      incrementMetric(terminalFailure ? "webhook.retry.failed" : "webhook.retry.requeued");
    }
  }

  return results;
}
