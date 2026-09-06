import { NextRequest, NextResponse } from "next/server";
import { getCommunicationDetail } from "@/lib/communication-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing log ID" }, { status: 400 });
    }

    const log = await getCommunicationDetail(id);
    if (!log) {
      return NextResponse.json({ ok: false, error: "Communication record not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      log,
    });
  } catch (error: any) {
    console.error("[Admin Mail Detail GET Error]", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to fetch log details" }, { status: 500 });
  }
}
