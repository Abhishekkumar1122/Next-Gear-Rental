import { NextRequest, NextResponse } from "next/server";
import {
  getCommunicationLogs,
  recordCommunicationLog,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationCategory,
  CommunicationStatus,
} from "@/lib/communication-store";
import { dispatchHtmlEmail } from "@/lib/alert-dispatch";
import { wrapInMasterEmailTemplate } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const direction = (searchParams.get("direction") || searchParams.get("type") || "all") as CommunicationDirection | "all";
    const channel = (searchParams.get("channel") || "all") as CommunicationChannel | "all";
    const category = (searchParams.get("category") || "all") as CommunicationCategory | "all";
    const status = (searchParams.get("status") || "all") as CommunicationStatus | "all";
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "60", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await getCommunicationLogs({
      direction,
      channel,
      category,
      status,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      ok: true,
      logs: result.logs,
      stats: result.stats,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    console.error("[Admin Mail GET Error]", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to fetch communication logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, useBrandedTemplate = true, category = "direct_compose" } = body;

    if (!to || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Recipient email, subject, and message are required" }, { status: 400 });
    }

    const origin = request.nextUrl.origin || "https://next-gear.app";
    let emailHtml = "";

    if (useBrandedTemplate) {
      const formattedMessageHtml = message.replace(/\n/g, "<br/>");
      emailHtml = wrapInMasterEmailTemplate({
        title: subject,
        categoryText: "DIRECT MESSAGE",
        headerIconText: "✉️ Support Desk",
        userName: "Valued Customer",
        preheader: message.slice(0, 100),
        contentHtml: `<div style="font-size: 14px; color: #f4f4f5; line-height: 1.6; white-space: pre-wrap;">${formattedMessageHtml}</div>`,
        baseUrl: origin,
      });
    } else {
      emailHtml = `<div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.6; white-space: pre-wrap;">${message}</div>`;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Next Gear <noreply@next-gear.app>";

    const dispatchResult = await dispatchHtmlEmail({
      to,
      subject,
      html: emailHtml,
    });

    const logId = recordCommunicationLog({
      channel: "email",
      direction: "outgoing",
      category: category as CommunicationCategory,
      recipient: to.trim(),
      sender: fromEmail,
      subject: subject.trim(),
      message: message.trim(),
      htmlContent: emailHtml,
      status: dispatchResult.deliveryStatus === "sent" ? "sent" : "failed",
      error: dispatchResult.error,
    });

    return NextResponse.json({
      ok: true,
      message: `Email successfully sent to ${to}`,
      logId,
      deliveryStatus: dispatchResult.deliveryStatus,
      error: dispatchResult.error,
    });
  } catch (error: any) {
    console.error("[Admin Mail Compose Failed]", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to send email" }, { status: 500 });
  }
}
