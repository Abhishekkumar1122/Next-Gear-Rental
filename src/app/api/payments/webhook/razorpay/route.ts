import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import {
  enqueueWebhookRetry,
  markWebhookDuplicate,
  markWebhookFailed,
  markWebhookIgnored,
  markWebhookProcessed,
  registerWebhookEvent,
} from "@/lib/webhook-audit";
import { buildWebhookMetadata, isDuplicateWebhookEvent } from "@/lib/webhook-idempotency";
import { sendPaymentSuccessAlertByProviderPaymentId } from "@/lib/booking-alerts";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "webhook:razorpay"),
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Razorpay webhook secret is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  const headerEventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (!signature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValid = verifyRazorpaySignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid Razorpay webhook signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          order_id?: string;
        };
      };
    };
  };

  const providerPaymentId = payload.payload?.payment?.entity?.order_id;
  const eventId = headerEventId || `${payload.event}:${providerPaymentId ?? "unknown"}`;

  const log = await registerWebhookEvent({
    provider: "RAZORPAY",
    eventId,
    eventType: payload.event,
    providerEntityId: providerPaymentId,
    rawPayload: rawBody,
    headers: Object.fromEntries(request.headers.entries()),
  });

  if (log.duplicate) {
    await markWebhookDuplicate(log.logId);
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!providerPaymentId) {
    await markWebhookIgnored(log.logId);
    return NextResponse.json({ received: true, ignored: true });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: "razorpay",
      providerPaymentId,
    },
    select: { id: true, bookingId: true, metadataJson: true },
  });

  if (!payment) {
    await markWebhookIgnored(log.logId);
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    if (payload.event === "payment.captured") {
      if (isDuplicateWebhookEvent(payment.metadataJson, eventId)) {
        await markWebhookDuplicate(log.logId);
        return NextResponse.json({ received: true, duplicate: true });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          metadataJson: buildWebhookMetadata(payment.metadataJson, eventId, payload.event),
        },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });
      await sendPaymentSuccessAlertByProviderPaymentId(providerPaymentId);
    }

    if (payload.event === "payment.failed") {
      if (isDuplicateWebhookEvent(payment.metadataJson, eventId)) {
        await markWebhookDuplicate(log.logId);
        return NextResponse.json({ received: true, duplicate: true });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadataJson: buildWebhookMetadata(payment.metadataJson, eventId, payload.event),
        },
      });
    }

    await markWebhookProcessed(log.logId);
  } catch (error) {
    await markWebhookFailed(log.logId, error instanceof Error ? error.message : "Razorpay webhook processing failed");
    await enqueueWebhookRetry({
      provider: "RAZORPAY",
      eventId,
      eventType: payload.event,
      providerEntityId: providerPaymentId,
      payloadJson: rawBody,
      targetStatus: payload.event === "payment.captured" ? "PAID" : payload.event === "payment.failed" ? "FAILED" : undefined,
      initialError: error instanceof Error ? error.message : "Razorpay webhook processing failed",
    });

    return NextResponse.json({ received: true, queuedForRetry: true }, { status: 202 });
  }

  return NextResponse.json({ received: true });
}
