import { assertAdminSession } from "@/lib/admin-security";
import { getOpsMetricsReport } from "@/lib/ops-report";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const report = await getOpsMetricsReport({ trendHours: url.searchParams.get("hours") });
  return NextResponse.json(report);
}
