import { assertAdminMutationRequest } from "@/lib/admin-security";
import { enqueueWebhookRetry } from "@/lib/webhook-audit";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  logId: z.string().min(1),
});

function resolveTargetStatus(provider: "STRIPE" | "RAZORPAY", eventType: string) {
  if (provider === "STRIPE") {
    if (eventType === "payment_intent.succeeded") return "PAID" as const;
    if (eventType === "payment_intent.payment_failed") return "FAILED" as const;
    return null;
  }

  if (eventType === "payment.captured") return "PAID" as const;
  if (eventType === "payment.failed") return "FAILED" as const;
  return null;
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "admin:webhooks:requeue"),
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database mode is required" }, { status: 400 });
  }

  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const bodyPayload =
    contentType.includes("application/json")
      ? await request.json().catch(() => ({}))
      : contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")
        ? Object.fromEntries((await request.formData()).entries())
        : {};

  const parsed = schema.safeParse(bodyPayload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid requeue payload" }, { status: 400 });
  }

  const log = await prisma.webhookEventLog.findUnique({
    where: { id: parsed.data.logId },
    select: {
      id: true,
      provider: true,
      eventId: true,
      eventType: true,
      providerEntityId: true,
      rawPayload: true,
      status: true,
    },
  });

  if (!log) {
    return NextResponse.json({ error: "Webhook log not found" }, { status: 404 });
  }

  const provider = log.provider;
  const targetStatus = resolveTargetStatus(provider, log.eventType);

  if (!targetStatus || !log.providerEntityId) {
    return NextResponse.json({ error: "Webhook event is not requeue-compatible" }, { status: 400 });
  }

  const existingPending = await prisma.webhookRetryJob.findFirst({
    where: {
      provider,
      eventId: log.eventId,
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    select: { id: true },
  });

  if (existingPending) {
    return NextResponse.json({ message: "Retry job already queued", jobId: existingPending.id });
  }

  await enqueueWebhookRetry({
    provider,
    eventId: log.eventId,
    eventType: log.eventType,
    providerEntityId: log.providerEntityId,
    payloadJson: log.rawPayload,
    targetStatus,
    initialError: `Manual requeue from log ${log.id}`,
  });

  await prisma.webhookEventLog.update({
    where: { id: log.id },
    data: {
      status: "RECEIVED",
      errorMessage: null,
    },
  });

  return NextResponse.json({ message: "Webhook event queued for retry" });
}
