import { assertAdminSession } from "@/lib/admin-security";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { getWebhookAuditLogs } from "@/lib/webhook-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "admin:webhooks:logs"),
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database mode is required" }, { status: 400 });
  }

  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const provider = request.nextUrl.searchParams.get("provider") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "";
  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 20);

  const data = await getWebhookAuditLogs({ provider, status, page, pageSize });
  return NextResponse.json(data);
}
