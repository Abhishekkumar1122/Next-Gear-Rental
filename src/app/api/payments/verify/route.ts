import { prisma } from "@/lib/prisma";
import { sendPaymentSuccessAlertByProviderPaymentId } from "@/lib/booking-alerts";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import Stripe from "stripe";
import axios from "axios";
import { z } from "zod";
import crypto from "crypto";

const verifySchema = z.object({
  provider: z.enum(["razorpay", "stripe", "paypal", "cashfree"]),
  orderId: z.string().optional(),
  paymentIntentId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  paypalOrderId: z.string().optional(),
  cashfreeOrderId: z.string().optional(),
});

function isSuccessfulRazorpayStatus(status: string | undefined) {
  return status === "captured" || status === "authorized";
}

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
  }

  const { provider, orderId, paymentIntentId, razorpayPaymentId, razorpayOrderId, razorpaySignature, paypalOrderId, cashfreeOrderId } = parsed.data;
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  try {
    if (provider === "razorpay") {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        // Mock verification
        return NextResponse.json({
          verified: true,
          mode: "mock",
          provider: "razorpay",
          status: "PAID",
          message: "Mock Razorpay verification passed",
        });
      }

      if (!process.env.RAZORPAY_KEY_ID) {
        return NextResponse.json({ error: "Razorpay key ID is not configured" }, { status: 500 });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: keySecret,
      });

      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        if (!razorpayOrderId && !orderId) {
          return NextResponse.json({ error: "Missing Razorpay verification params" }, { status: 400 });
        }

        const targetOrderId = razorpayOrderId ?? orderId;
        const orderPayments = await razorpay.orders.fetchPayments(targetOrderId as string) as {
          items?: Array<{ id: string; order_id: string; status?: string }>;
        };
        const paidPayment = (orderPayments.items ?? []).find((item) => isSuccessfulRazorpayStatus(item.status));

        if (!paidPayment) {
          return NextResponse.json({
            verified: false,
            mode: "live",
            provider: "razorpay",
            status: "PENDING",
            orderId: targetOrderId,
          });
        }

        if (hasDatabase) {
          await prisma.payment.updateMany({
            where: { providerPaymentId: paidPayment.order_id },
            data: {
              status: "PAID",
              metadataJson: JSON.stringify({
                provider: "razorpay",
                paymentId: paidPayment.id,
                orderId: paidPayment.order_id,
                status: paidPayment.status,
                verificationMode: "order-poll",
              }),
            },
          });
          await sendPaymentSuccessAlertByProviderPaymentId(paidPayment.order_id);
        }

        return NextResponse.json({
          verified: true,
          mode: "live",
          provider: "razorpay",
          status: "PAID",
          paymentId: paidPayment.id,
          orderId: paidPayment.order_id,
        });
      }

      // Real verification: create signature hash
      const generated_signature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const isValid = generated_signature === razorpaySignature;

      if (!isValid) {
        return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 401 });
      }

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      const isPaid = isSuccessfulRazorpayStatus(payment.status);

      if (hasDatabase && payment.order_id) {
        await prisma.payment.updateMany({
          where: { providerPaymentId: payment.order_id },
          data: {
            status: isPaid ? "PAID" : "FAILED",
            metadataJson: JSON.stringify({
              provider: "razorpay",
              paymentId: razorpayPaymentId,
              orderId: razorpayOrderId,
              status: payment.status,
            }),
          },
        });
        if (isPaid) {
          await sendPaymentSuccessAlertByProviderPaymentId(payment.order_id);
        }
      }

      return NextResponse.json({
        verified: isPaid,
        mode: "live",
        provider: "razorpay",
        status: isPaid ? "PAID" : "PENDING",
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
      });
    }

    if (provider === "stripe") {
      if (!paymentIntentId) {
        return NextResponse.json({ error: "Missing Stripe payment intent ID" }, { status: 400 });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        // Mock verification
        return NextResponse.json({
          verified: true,
          mode: "mock",
          provider: "stripe",
          status: "PAID",
          message: "Mock Stripe verification passed",
        });
      }

      const stripe = new Stripe(stripeKey);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (hasDatabase) {
        await prisma.payment.updateMany({
          where: { providerPaymentId: paymentIntentId },
          data: {
            status: paymentIntent.status === "succeeded" ? "PAID" : paymentIntent.status === "requires_payment_method" ? "CREATED" : "FAILED",
            metadataJson: JSON.stringify({
              provider: "stripe",
              paymentIntentId,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
            }),
          },
        });
        if (paymentIntent.status === "succeeded") {
          await sendPaymentSuccessAlertByProviderPaymentId(paymentIntentId);
        }
      }

      return NextResponse.json({
        verified: paymentIntent.status === "succeeded",
        mode: "live",
        provider: "stripe",
        status: paymentIntent.status === "succeeded" ? "PAID" : "PENDING",
        paymentIntentId,
        stripeStatus: paymentIntent.status,
      });
    }

    if (provider === "paypal") {
      if (!paypalOrderId) {
        return NextResponse.json({ error: "Missing PayPal order ID" }, { status: 400 });
      }

      const clientId = process.env.PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      const paypalMode = process.env.PAYPAL_MODE || "sandbox";

      if (!clientId || !clientSecret) {
        // Mock verification
        return NextResponse.json({
          verified: true,
          mode: "mock",
          provider: "paypal",
          status: "PAID",
          message: "Mock PayPal verification passed",
        });
      }

      // Get PayPal access token
      const authResponse = await axios.post(
        `https://api.${paypalMode === "production" ? "" : "sandbox."}paypal.com/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          auth: {
            username: clientId,
            password: clientSecret,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = authResponse.data.access_token;

      // Get order details from PayPal
      const orderResponse = await axios.get(
        `https://api.${paypalMode === "production" ? "" : "sandbox."}paypal.com/v2/checkout/orders/${paypalOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const orderData = orderResponse.data;
      const isApproved = orderData.status === "APPROVED" || orderData.status === "COMPLETED";

      if (hasDatabase) {
        await prisma.payment.updateMany({
          where: { providerPaymentId: paypalOrderId },
          data: {
            status: isApproved ? "PAID" : "FAILED",
            metadataJson: JSON.stringify({
              provider: "paypal",
              orderId: paypalOrderId,
              status: orderData.status,
              payer: orderData.payer?.name,
            }),
          },
        });
        if (isApproved) {
          await sendPaymentSuccessAlertByProviderPaymentId(paypalOrderId);
        }
      }

      return NextResponse.json({
        verified: isApproved,
        mode: "live",
        provider: "paypal",
        status: isApproved ? "PAID" : "PENDING",
        paypalOrderId,
        paypalStatus: orderData.status,
      });
    }

    if (provider === "cashfree") {
      if (!cashfreeOrderId && !orderId) {
        return NextResponse.json({ error: "Missing Cashfree order ID" }, { status: 400 });
      }

      const appId = process.env.CASHFREE_APP_ID;
      const appSecret = process.env.CASHFREE_APP_SECRET;
      const cashfreeMode = process.env.CASHFREE_MODE || "sandbox";

      if (!appId || !appSecret) {
        // Mock verification
        return NextResponse.json({
          verified: true,
          mode: "mock",
          provider: "cashfree",
          status: "PAID",
          message: "Mock Cashfree verification passed",
        });
      }

      const baseUrl = cashfreeMode === "production" 
        ? "https://api.cashfree.com" 
        : "https://sandbox.cashfree.com";

      const targetOrderId = cashfreeOrderId ?? orderId;

      try {
        // Get order details from Cashfree
        const orderResponse = await axios.get(
          `${baseUrl}/pg/orders/${targetOrderId}`,
          {
            headers: {
              "X-Client-Id": appId,
              "X-Client-Secret": appSecret,
              "Content-Type": "application/json",
              "x-api-version": "2022-09-01",
            },
          }
        );

        const orderData = orderResponse.data;
        const isPaid = orderData.order_status === "PAID";

        if (hasDatabase) {
          await prisma.payment.updateMany({
            where: { providerPaymentId: targetOrderId },
            data: {
              status: isPaid ? "PAID" : orderData.order_status === "FAILED" ? "FAILED" : "CREATED",
              metadataJson: JSON.stringify({
                provider: "cashfree",
                orderId: targetOrderId,
                status: orderData.order_status,
                paymentAmount: orderData.order_amount,
              }),
            },
          });
          if (isPaid) {
            await sendPaymentSuccessAlertByProviderPaymentId(targetOrderId);
          }
        }

        return NextResponse.json({
          verified: isPaid,
          mode: "live",
          provider: "cashfree",
          status: isPaid ? "PAID" : "PENDING",
          cashfreeOrderId: targetOrderId,
          cashfreeStatus: orderData.order_status,
        });
      } catch (error) {
        console.error("Cashfree verification error:", error);
        return NextResponse.json(
          { error: "Cashfree verification failed", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
