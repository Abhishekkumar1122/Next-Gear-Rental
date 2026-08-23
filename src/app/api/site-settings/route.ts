import { getSiteSettings } from "@/lib/site-settings-server";
import { NextResponse } from "next/server";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}
