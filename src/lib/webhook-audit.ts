import { prisma } from "@/lib/prisma";
import { incrementMetric } from "@/lib/ops-metrics";
import { PaymentStatus, WebhookProvider } from "@prisma/client";

type RegisterWebhookInput = {
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  providerEntityId?: string;
  rawPayload: string;
  headers?: Record<string, string>;
};

export async function registerWebhookEvent(input: RegisterWebhookInput) {
  try {
    const existing = await prisma.webhookEventLog.findUnique({
      where: {
        provider_eventId: {
          provider: input.provider,
          eventId: input.eventId,
        },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      incrementMetric("webhook.duplicate");
      return { duplicate: true as const, logId: existing.id };
    }

    const created = await prisma.webhookEventLog.create({
      data: {
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
        providerEntityId: input.providerEntityId,
        rawPayload: input.rawPayload,
        headersJson: input.headers ? JSON.stringify(input.headers) : null,
        status: "RECEIVED",
      },
      select: { id: true },
    });

    return { duplicate: false as const, logId: created.id };
  } catch {
    incrementMetric("webhook.audit_errors");
    return { duplicate: false as const, logId: null };
  }
}

export async function markWebhookProcessed(logId: string | null) {
  if (!logId) return;
  incrementMetric("webhook.processed");
  await prisma.webhookEventLog.update({
    where: { id: logId },
    data: { status: "PROCESSED", processedAt: new Date() },
  });
}

export async function markWebhookIgnored(logId: string | null) {
  if (!logId) return;
  incrementMetric("webhook.ignored");
  await prisma.webhookEventLog.update({
    where: { id: logId },
    data: { status: "IGNORED", processedAt: new Date() },
  });
}

export async function markWebhookDuplicate(logId: string | null) {
  if (!logId) return;
  incrementMetric("webhook.duplicate");
  await prisma.webhookEventLog.update({
    where: { id: logId },
    data: { status: "DUPLICATE", processedAt: new Date() },
  });
}

export async function markWebhookFailed(logId: string | null, errorMessage: string) {
  if (!logId) return;
  incrementMetric("webhook.failed");
  await prisma.webhookEventLog.update({
    where: { id: logId },
    data: { status: "FAILED", errorMessage },
  });
}

type EnqueueRetryInput = {
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  providerEntityId?: string;
  payloadJson: string;
  targetStatus?: PaymentStatus;
  initialError?: string;
};

export async function enqueueWebhookRetry(input: EnqueueRetryInput) {
  incrementMetric("webhook.retry_enqueued");
  await prisma.webhookRetryJob.create({
    data: {
      provider: input.provider,
      eventId: input.eventId,
      eventType: input.eventType,
      providerEntityId: input.providerEntityId,
      payloadJson: input.payloadJson,
      targetStatus: input.targetStatus,
      status: "PENDING",
      lastError: input.initialError,
      nextRunAt: new Date(Date.now() + 30 * 1000),
    },
  });
}
