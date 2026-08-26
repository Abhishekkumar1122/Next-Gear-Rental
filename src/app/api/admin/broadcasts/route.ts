import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server-session";
import { DEFAULT_BROADCAST_TEMPLATES, getBroadcastLogs, saveBroadcastLog } from "@/lib/broadcasts-store";
import { dispatchAlert } from "@/lib/alert-dispatch";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp-service";
import { getSiteSettings } from "@/lib/site-settings-server";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = getBroadcastLogs();
  const settings = await getSiteSettings();

  return NextResponse.json({
    templates: DEFAULT_BROADCAST_TEMPLATES,
    logs,
    whatsappChannelUrl: settings.whatsappUrl,
  });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, messageText, channelType, promoCode, testPhone } = body;

  if (!messageText || typeof messageText !== "string" || !messageText.trim()) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  // If user requested a test send on their phone
  if (testPhone && typeof testPhone === "string" && testPhone.trim()) {
    const formattedPhone = normalizeWhatsAppPhone(testPhone.trim());
    if (formattedPhone) {
      await dispatchAlert({
        channel: "whatsapp",
        to: formattedPhone,
        message: messageText.trim(),
        templateName: "admin_test_broadcast",
      });
    }
  }

  const newLog = saveBroadcastLog({
    title: title?.trim() || "Promotional Broadcast",
    channelType: channelType || "whatsapp_channel",
    promoCode: promoCode?.trim() || undefined,
    messageText: messageText.trim(),
    sentBy: user.email || "Admin",
    status: testPhone ? "sent" : "shared",
    reachEstimate: channelType === "whatsapp_channel" ? 1500 : 750,
  });

  return NextResponse.json({
    ok: true,
    log: newLog,
    message: "Broadcast action logged successfully!",
  });
}
