import { NextRequest, NextResponse } from "next/server";
import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import { listBookingAlertLogs, retryBookingAlert, type BookingAlertEvent } from "@/lib/booking-alerts";
import type { AlertChannel } from "@/lib/alert-dispatch";

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") ?? "20") || 20);
  const statusRaw = request.nextUrl.searchParams.get("status");
  const eventTypeRaw = request.nextUrl.searchParams.get("eventType");
  const channelRaw = request.nextUrl.searchParams.get("channel");

  const status = statusRaw === "sent" || statusRaw === "failed" ? statusRaw : undefined;
  const eventType =
    eventTypeRaw === "booking_confirmed" ||
    eventTypeRaw === "payment_success" ||
    eventTypeRaw === "pickup_reminder" ||
    eventTypeRaw === "return_reminder"
      ? (eventTypeRaw as BookingAlertEvent)
      : undefined;
  const channel = channelRaw === "email" || channelRaw === "sms" || channelRaw === "whatsapp"
    ? (channelRaw as AlertChannel)
    : undefined;

  const data = await listBookingAlertLogs({ page, pageSize, status, eventType, channel });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as { logId?: string };
  if (!body.logId?.trim()) {
    return NextResponse.json({ error: "logId is required" }, { status: 400 });
  }

  try {
    const result = await retryBookingAlert(body.logId);
    return NextResponse.json({ message: "Alert retry processed", result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Retry failed" },
      { status: 400 },
    );
  }
}
