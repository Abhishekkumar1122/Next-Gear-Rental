import { NextRequest, NextResponse } from "next/server";
import { trafficTracker, DeviceType } from "@/lib/traffic-tracker";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Tablet/i.test(userAgent);

    let device: DeviceType = "desktop";
    if (isTablet) device = "tablet";
    else if (isMobile) device = "mobile";

    const body = await request.json().catch(() => ({}));
    const path = body.path || "/";

    trafficTracker.recordVisit(device, path);

    return NextResponse.json({ success: true, device });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = searchParams.get("days") || "30";

  const stats = await trafficTracker.getStats(days);

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
