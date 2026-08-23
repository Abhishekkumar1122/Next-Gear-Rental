import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-security";
import { fetchAttentionCenterData } from "@/lib/attention-center";

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await fetchAttentionCenterData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Attention center API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attention center data" },
      { status: 500 }
    );
  }
}
