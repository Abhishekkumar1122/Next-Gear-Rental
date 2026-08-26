import { NextRequest, NextResponse } from "next/server";
import { trafficTracker, DeviceType } from "@/lib/traffic-tracker";

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

export async function GET() {
  const stats = await trafficTracker.getStats();
  return NextResponse.json(stats);
}
