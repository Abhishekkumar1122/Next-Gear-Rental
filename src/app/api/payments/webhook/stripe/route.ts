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
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "webhook:stripe"),
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature" }, { status: 400 });
  }

  const log = await registerWebhookEvent({
    provider: "STRIPE",
    eventId: event.id,
    eventType: event.type,
    providerEntityId:
      "id" in event.data.object && typeof event.data.object.id === "string"
        ? event.data.object.id
        : undefined,
    rawPayload: rawBody,
    headers: Object.fromEntries(request.headers.entries()),
  });

  if (log.duplicate) {
    await markWebhookDuplicate(log.logId);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const payment = await prisma.payment.findFirst({
        where: {
          provider: "stripe",
          providerPaymentId: paymentIntent.id,
        },
        select: { id: true, bookingId: true, metadataJson: true, status: true },
      });

      if (payment) {
        if (isDuplicateWebhookEvent(payment.metadataJson, event.id)) {
          await markWebhookDuplicate(log.logId);
          return NextResponse.json({ received: true, duplicate: true });
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            metadataJson: buildWebhookMetadata(payment.metadataJson, event.id, event.type),
          },
        });

        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: "CONFIRMED" },
        });
        await sendPaymentSuccessAlertByProviderPaymentId(paymentIntent.id);
      } else {
        await markWebhookIgnored(log.logId);
        return NextResponse.json({ received: true, ignored: true });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const payment = await prisma.payment.findFirst({
        where: {
          provider: "stripe",
          providerPaymentId: paymentIntent.id,
        },
        select: { id: true, metadataJson: true },
      });

      if (payment) {
        if (isDuplicateWebhookEvent(payment.metadataJson, event.id)) {
          await markWebhookDuplicate(log.logId);
          return NextResponse.json({ received: true, duplicate: true });
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            metadataJson: buildWebhookMetadata(payment.metadataJson, event.id, event.type),
          },
        });
      } else {
        await markWebhookIgnored(log.logId);
        return NextResponse.json({ received: true, ignored: true });
      }
    }

    await markWebhookProcessed(log.logId);
  } catch (error) {
    await markWebhookFailed(log.logId, error instanceof Error ? error.message : "Stripe webhook processing failed");
    await enqueueWebhookRetry({
      provider: "STRIPE",
      eventId: event.id,
      eventType: event.type,
      providerEntityId:
        "id" in event.data.object && typeof event.data.object.id === "string"
          ? event.data.object.id
          : undefined,
      payloadJson: rawBody,
      targetStatus:
        event.type === "payment_intent.succeeded"
          ? "PAID"
          : event.type === "payment_intent.payment_failed"
            ? "FAILED"
            : undefined,
      initialError: error instanceof Error ? error.message : "Stripe webhook processing failed",
    });

    return NextResponse.json({ received: true, queuedForRetry: true }, { status: 202 });
  }

  return NextResponse.json({ received: true });
}
