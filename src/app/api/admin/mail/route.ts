import { NextRequest, NextResponse } from "next/server";
import { getEmailLogs, logEmailMessage, EmailLogCategory } from "@/lib/email-log-store";
import { dispatchHtmlEmail, dispatchAlert } from "@/lib/alert-dispatch";
import { wrapInMasterEmailTemplate } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as "outgoing" | "incoming" | null;
    const status = searchParams.get("status") as "sent" | "failed" | "received" | null;
    const search = searchParams.get("search") || undefined;

    const logs = getEmailLogs({
      type: type || undefined,
      status: status || undefined,
      search,
    });

    const totalSent = logs.filter((l) => l.type === "outgoing" && l.status === "sent").length;
    const totalReceived = logs.filter((l) => l.type === "incoming").length;
    const failedCount = logs.filter((l) => l.status === "failed").length;

    return NextResponse.json({
      ok: true,
      logs,
      stats: {
        totalSent,
        totalReceived,
        failedCount,
        total: logs.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "Failed to fetch email logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, useBrandedTemplate = true, category = "direct_compose" } = body;

    if (!to || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Recipient email, subject, and message are required" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    let emailHtml = "";

    if (useBrandedTemplate) {
      const formattedMessageHtml = message.replace(/\n/g, "<br/>");
      emailHtml = wrapInMasterEmailTemplate({
        title: subject,
        categoryText: "DIRECT MESSAGE",
        headerIconText: "✉️ Support Desk",
        userName: "Valued Customer",
        preheader: message.slice(0, 100),
        contentHtml: `<div style="font-size: 13px; color: #f4f4f5; line-height: 1.6; white-space: pre-wrap;">${formattedMessageHtml}</div>`,
        baseUrl: origin,
      });
    } else {
      emailHtml = `<div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.6; white-space: pre-wrap;">${message}</div>`;
    }

    const dispatchResult = await dispatchHtmlEmail({
      to,
      subject,
      html: emailHtml,
    });

    const logEntry = logEmailMessage({
      type: "outgoing",
      category: category as EmailLogCategory,
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@next-gear.app",
      to: to.trim(),
      subject: subject.trim(),
      html: emailHtml,
      message,
      status: dispatchResult.deliveryStatus === "sent" ? "sent" : "failed",
      error: dispatchResult.error,
    });

    return NextResponse.json({
      ok: true,
      message: `Email successfully sent to ${to}`,
      log: logEntry,
    });
  } catch (error: any) {
    console.error("[Admin Mail Compose Failed]", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to send email" }, { status: 500 });
  }
}
