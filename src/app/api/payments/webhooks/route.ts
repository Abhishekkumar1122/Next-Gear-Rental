import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";

/**
 * Webhook handlers for all payment providers
 * POST /api/payments/webhooks/razorpay - Razorpay webhooks
 * POST /api/payments/webhooks/stripe - Stripe webhooks
 * POST /api/payments/webhooks/paypal - PayPal webhooks
 * POST /api/payments/webhooks/cashfree - Cashfree webhooks
 */

// RAZORPAY WEBHOOK
export async function POST(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    if (pathname.includes("razorpay")) {
      return handleRazorpayWebhook(request);
    }
    if (pathname.includes("stripe")) {
      return handleStripeWebhook(request);
    }
    if (pathname.includes("paypal")) {
      return handlePayPalWebhook(request);
    }
    if (pathname.includes("cashfree")) {
      return handleCashfreeWebhook(request);
    }

    return NextResponse.json({ error: "Unknown webhook provider" }, { status: 400 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleRazorpayWebhook(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ success: true, mode: "mock" });
  }

  // Verify signature
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (generated_signature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (event.event === "payment.authorized") {
    const payment = event.payload.payment.entity;
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: payment.order_id },
        data: {
          status: "PAID",
          metadataJson: JSON.stringify({
            provider: "razorpay",
            event: "payment.authorized",
            paymentId: payment.id,
            orderId: payment.order_id,
          }),
        },
      });
    }
  }

  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity;
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: payment.order_id },
        data: {
          status: "FAILED",
          metadataJson: JSON.stringify({
            provider: "razorpay",
            event: "payment.failed",
            reason: payment.error_description,
          }),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleStripeWebhook(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ success: true, mode: "mock" });
  }

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any;
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: paymentIntent.id },
        data: {
          status: "PAID",
          metadataJson: JSON.stringify({
            provider: "stripe",
            event: "payment_intent.succeeded",
            paymentIntentId: paymentIntent.id,
          }),
        },
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as any;
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: paymentIntent.id },
        data: {
          status: "FAILED",
          metadataJson: JSON.stringify({
            provider: "stripe",
            event: "payment_intent.payment_failed",
            lastError: paymentIntent.last_payment_error,
          }),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handlePayPalWebhook(request: Request) {
  const body = await request.json();
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  // PayPal sends event type in event_type
  if (body.event_type === "CHECKOUT.ORDER.APPROVED") {
    const orderId = body.resource.id;
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: orderId },
        data: {
          status: "PAID",
          metadataJson: JSON.stringify({
            provider: "paypal",
            event: "CHECKOUT.ORDER.APPROVED",
            orderId,
          }),
        },
      });
    }
  }

  if (body.event_type === "CHECKOUT.ORDER.COMPLETED") {
    const orderId = body.resource.id;
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: orderId },
        data: {
          status: "PAID",
          metadataJson: JSON.stringify({
            provider: "paypal",
            event: "CHECKOUT.ORDER.COMPLETED",
            orderId,
            payer: body.resource.payer?.name,
          }),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCashfreeWebhook(request: Request) {
  const body = await request.json();
  const signature = request.headers.get("x-webhook-signature");
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (!signature || !process.env.CASHFREE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, mode: "mock" });
  }

  // Verify Cashfree webhook signature
  const timestamp = request.headers.get("x-webhook-timestamp");
  if (!timestamp) {
    return NextResponse.json({ error: "Missing timestamp" }, { status: 401 });
  }

  const payload = `${timestamp}.${JSON.stringify(body)}`;
  const generated_signature = crypto
    .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET)
    .update(payload)
    .digest("base64");

  if (generated_signature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Cashfree webhooks include data.order object with order_status
  const data = body.data;
  if (!data || !data.order) {
    return NextResponse.json({ received: true });
  }

  const orderId = data.order.order_id;
  const orderStatus = data.order.order_status;

  if (orderStatus === "PAID") {
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: orderId },
        data: {
          status: "PAID",
          metadataJson: JSON.stringify({
            provider: "cashfree",
            event: "PAYMENT_SUCCESS",
            orderId,
            orderStatus,
          }),
        },
      });
    }
  } else if (orderStatus === "FAILED") {
    if (hasDatabase) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: orderId },
        data: {
          status: "FAILED",
          metadataJson: JSON.stringify({
            provider: "cashfree",
            event: "PAYMENT_FAILED",
            orderId,
            orderStatus,
          }),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
