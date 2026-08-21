import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { z } from "zod";
import { getPayUConfig, generatePayUHash } from "@/lib/payu";

const checkoutSchema = z.object({
  provider: z.enum(["payu", "razorpay", "stripe", "paypal", "cashfree"]),
  amountINR: z.number().int().positive(),
  currency: z.enum(["INR", "USD", "AED"]).default("INR"),
  bookingId: z.string().min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  productInfo: z.string().optional(),
});

function getProviderErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const err = error as {
      description?: string;
      error?: {
        description?: string;
        reason?: string;
      };
      reason?: string;
      message?: string;
    };

    return (
      err.error?.description ??
      err.description ??
      err.error?.reason ??
      err.reason ??
      err.message ??
      "Unknown provider error"
    );
  }

  return "Unknown provider error";
}

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const { provider, amountINR, currency, bookingId } = parsed.data;
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (provider === "payu") {
    const { key, salt, mode, endpointUrl } = getPayUConfig();
    const txnid = `NG_PAYU_${bookingId.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;
    const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const reqProto = request.headers.get("x-forwarded-proto") || (reqHost?.includes("localhost") || reqHost?.includes("127.0.0.1") ? "http" : "https");
    const baseUrl = reqHost ? `${reqProto}://${reqHost}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    const surl = `${baseUrl}/api/payments/payu/response`;
    const furl = `${baseUrl}/api/payments/payu/response`;

    const firstname = (parsed.data.customerName || "Rider").replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Rider";
    const email = parsed.data.customerEmail || "customer@next-gear.app";
    const phone = (parsed.data.customerPhone || "9999999999").replace(/\D/g, "").slice(-10) || "9999999999";
    const productinfo = (parsed.data.productInfo || `Booking ${bookingId}`).slice(0, 100);

    if (hasDatabase) {
      void prisma.payment.create({
        data: {
          bookingId,
          provider,
          amountINR,
          currency,
          status: "CREATED",
          providerPaymentId: txnid,
          metadataJson: JSON.stringify({
            provider: "payu",
            mode,
            txnid,
            amountINR,
            surl,
            furl,
          }),
        },
      }).catch(console.error);
    }

    const hash = generatePayUHash({
      txnid,
      amount: amountINR,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      udf1: bookingId,
      udf2: "nextgear_web",
    });

    return NextResponse.json({
      provider: "payu",
      mode,
      actionUrl: endpointUrl,
      payuParams: {
        key,
        txnid,
        amount: Number(amountINR).toFixed(2),
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        udf1: bookingId,
        udf2: "nextgear_web",
        service_provider: "payu_paisa",
      },
    });
  }

  let paymentRecordId: string | null = null;

  if (hasDatabase) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        provider,
        amountINR,
        currency,
        status: "CREATED",
      },
      select: {
        id: true,
      },
    });

    paymentRecordId = payment.id;
  }

  if (provider === "razorpay") {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            providerPaymentId: `mock_rzp_${Date.now()}`,
            metadataJson: JSON.stringify({ provider, mode: "mock" }),
          },
        });
      }

      return NextResponse.json({
        provider,
        mode: "mock",
        orderId: `mock_rzp_${Date.now()}`,
        message: "Razorpay keys missing. Returned mock checkout order.",
      });
    }

    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: amountINR * 100,
        currency,
        receipt: bookingId,
      });

      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            providerPaymentId: order.id,
            metadataJson: JSON.stringify({ provider, mode: "live", order }),
          },
        });
      }

      return NextResponse.json({ provider, mode: "live", order });
    } catch (error) {
      const details = getProviderErrorDetails(error);

      // If it's a test environment key, fallback to standard checkout (no order ID required on frontend)
      if (process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")) {
        if (paymentRecordId) {
          await prisma.payment.update({
            where: { id: paymentRecordId || "" },
            data: {
              providerPaymentId: `standard_rzp_${bookingId}`,
              metadataJson: JSON.stringify({ provider, mode: "live-standard", details }),
            },
          });
        }
        return NextResponse.json({
          provider,
          mode: "live-standard",
          keyId: process.env.RAZORPAY_KEY_ID,
          message: "Razorpay order creation failed, falling back to standard checkout.",
        });
      }

      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            status: "FAILED",
            metadataJson: JSON.stringify({
              provider,
              mode: "error",
              details,
            }),
          },
        });
      }

      return NextResponse.json(
        {
          error: "Failed to create Razorpay order",
          details,
        },
        { status: 502 },
      );
    }
  }

  if (provider === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            providerPaymentId: `mock_pi_${Date.now()}`,
            metadataJson: JSON.stringify({ provider, mode: "mock" }),
          },
        });
      }

      return NextResponse.json({
        provider,
        mode: "mock",
        paymentIntentId: `mock_pi_${Date.now()}`,
        clientSecret: "mock_client_secret",
        message: "Stripe key missing. Returned mock payment intent.",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountINR * 100,
      currency: currency.toLowerCase(),
      metadata: { bookingId },
      automatic_payment_methods: { enabled: true },
    });

    if (paymentRecordId) {
      await prisma.payment.update({
        where: { id: paymentRecordId || "" },
        data: {
          providerPaymentId: paymentIntent.id,
          metadataJson: JSON.stringify({
            provider,
            mode: "live",
            paymentIntentId: paymentIntent.id,
          }),
        },
      });
    }

    return NextResponse.json({
      provider,
      mode: "live",
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    if (paymentRecordId) {
      await prisma.payment.update({
        where: { id: paymentRecordId || "" },
        data: {
          providerPaymentId: `mock_pp_${Date.now()}`,
          metadataJson: JSON.stringify({ provider, mode: "mock" }),
        },
      });
    }

    return NextResponse.json({
      provider,
      mode: "mock",
      orderId: `mock_pp_${Date.now()}`,
      message: "PayPal credentials missing. Returned mock order.",
    });
  }

  // Create PayPal order
  try {
    const axios = (await import("axios")).default;
    const paypalMode = process.env.PAYPAL_MODE || "sandbox";

    // Get access token
    const authResponse = await axios.post(
      `https://api.${paypalMode === "production" ? "" : "sandbox."}paypal.com/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID,
          password: process.env.PAYPAL_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = authResponse.data.access_token;

    // Create order
    const orderResponse = await axios.post(
      `https://api.${paypalMode === "production" ? "" : "sandbox."}paypal.com/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: bookingId,
            amount: {
              currency_code: currency,
              value: (amountINR / 100).toString(), // Convert paise to rupees/dollars
            },
          },
        ],
        application_context: {
          brand_name: "Next Gear Rentals",
          locale: "en-US",
          user_action: "PAY_NOW",
          return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/payment/success`,
          cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/payment/cancel`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (paymentRecordId) {
      await prisma.payment.update({
        where: { id: paymentRecordId || "" },
        data: {
          providerPaymentId: orderResponse.data.id,
          metadataJson: JSON.stringify({
            provider,
            mode: "live",
            orderId: orderResponse.data.id,
          }),
        },
      });
    }

    return NextResponse.json({
      provider,
      mode: "live",
      orderId: orderResponse.data.id,
      approvalUrl: orderResponse.data.links.find((link: any) => link.rel === "approve")?.href,
    });
  } catch (error) {
    console.error("PayPal order creation error:", error);
    if (paymentRecordId) {
      await prisma.payment.update({
        where: { id: paymentRecordId || "" },
        data: {
          status: "FAILED",
          metadataJson: JSON.stringify({
            provider,
            mode: "error",
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to create PayPal order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }

  if (provider === "cashfree") {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_APP_SECRET) {
      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            providerPaymentId: `mock_cf_${Date.now()}`,
            metadataJson: JSON.stringify({ provider, mode: "mock" }),
          },
        });
      }

      return NextResponse.json({
        provider,
        mode: "mock",
        orderId: `mock_cf_${Date.now()}`,
        message: "Cashfree credentials missing. Returned mock order.",
      });
    }

    try {
      const axios = (await import("axios")).default;
      const cashfreeMode = process.env.CASHFREE_MODE || "sandbox";
      const baseUrl = cashfreeMode === "production" 
        ? "https://api.cashfree.com" 
        : "https://sandbox.cashfree.com";

      // Create Cashfree order
      const orderId = `NG_${bookingId}_${Date.now()}`;
      const orderResponse = await axios.post(
        `${baseUrl}/pg/orders`,
        {
          order_id: orderId,
          order_amount: amountINR / 100, // Convert paise to currency units
          order_currency: currency,
          customer_details: {
            customer_id: bookingId,
            customer_email: "customer@nextgear.com",
            customer_phone: "9999999999",
          },
          order_meta: {
            return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/payment/success?provider=cashfree&orderId=${orderId}`,
            notify_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payments/webhooks/cashfree`,
          },
          settlements: {
            beneficiary_id: "default",
          },
        },
        {
          headers: {
            "X-Client-Id": process.env.CASHFREE_APP_ID,
            "X-Client-Secret": process.env.CASHFREE_APP_SECRET,
            "Content-Type": "application/json",
            "x-api-version": "2022-09-01",
          },
        }
      );

      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            providerPaymentId: orderResponse.data.order_id,
            metadataJson: JSON.stringify({
              provider,
              mode: "live",
              orderId: orderResponse.data.order_id,
              paymentSessionId: orderResponse.data.payment_session_id,
            }),
          },
        });
      }

      return NextResponse.json({
        provider,
        mode: "live",
        orderId: orderResponse.data.order_id,
        paymentSessionId: orderResponse.data.payment_session_id,
      });
    } catch (error: unknown) {
      console.error("Cashfree order creation error:", error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = (error as Error).message;
      }
      if (paymentRecordId) {
        await prisma.payment.update({
          where: { id: paymentRecordId || "" },
          data: {
            status: "FAILED",
            metadataJson: JSON.stringify({
              provider,
              mode: "error",
              error: errorMessage,
            }),
          },
        });
      }

      return NextResponse.json(
        { error: "Failed to create Cashfree order", details: errorMessage },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
}
