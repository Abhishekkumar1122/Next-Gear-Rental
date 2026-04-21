import axios from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

const captureSchema = z.object({
  paypalOrderId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = captureSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid capture request" }, { status: 400 });
  }

  const { paypalOrderId } = parsed.data;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalMode = process.env.PAYPAL_MODE || "sandbox";

  try {
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        captured: true,
        mode: "mock",
        message: "Mock PayPal capture",
        orderId: paypalOrderId,
      });
    }

    // Get access token
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

    // Capture the order
    const captureResponse = await axios.post(
      `https://api.${paypalMode === "production" ? "" : "sandbox."}paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = captureResponse.data;

    return NextResponse.json({
      captured: captureData.status === "COMPLETED",
      mode: "live",
      orderId: paypalOrderId,
      status: captureData.status,
      captureData,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: "Failed to capture PayPal order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
