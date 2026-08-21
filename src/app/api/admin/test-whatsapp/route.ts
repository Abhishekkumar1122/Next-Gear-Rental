import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession, assertAdminMutationRequest } from "@/lib/admin-security";
import { dispatchAlert } from "@/lib/alert-dispatch";

export async function POST(request: NextRequest) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const { phone, customToken, customPhoneId } = payload;

    if (!phone) {
      return NextResponse.json({ error: "Missing test destination phone number" }, { status: 400 });
    }

    // Temporarily override env variables if custom ones provided
    if (customToken) process.env.WHATSAPP_CLOUD_API_TOKEN = customToken;
    if (customPhoneId) process.env.WHATSAPP_PHONE_NUMBER_ID = customPhoneId;

    const result = await dispatchAlert({
      channel: "whatsapp",
      to: phone,
      message: `🚀 *NEXT GEAR META WHATSAPP LIVE TEST*

Congratulations! Your Meta WhatsApp Cloud API credentials for *Next Gear Rentals* are working perfectly!

• Provider: ${process.env.WHATSAPP_CLOUD_API_TOKEN ? "Meta Cloud API (Live)" : "Mock Sandbox"}
• Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || "N/A"}
• Timestamp: ${new Date().toLocaleString()}

Automatic WhatsApp booking passes and vendor credentials will now be dispatched live!`,
    });

    if (result.deliveryStatus === "failed") {
      return NextResponse.json(
        {
          success: false,
          provider: result.provider,
          error: result.error || "Meta WhatsApp Cloud API request rejected",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      messageId: result.providerMessageId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "WhatsApp test failed" },
      { status: 500 }
    );
  }
}
