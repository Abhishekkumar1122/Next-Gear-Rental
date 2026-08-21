import {
  getCustomTemplates,
  saveCustomTemplate,
  resetCustomTemplate,
  CustomTemplateConfig,
} from "@/lib/custom-templates-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const templates = getCustomTemplates();
  return NextResponse.json({ ok: true, templates });
}

export async function PUT(request: NextRequest) {
  try {
    const body: CustomTemplateConfig = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ ok: false, error: "Invalid template payload" }, { status: 400 });
    }

    const updated = saveCustomTemplate(body);
    return NextResponse.json({ ok: true, template: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "Failed to update template" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing template ID" }, { status: 400 });
    }

    const reset = resetCustomTemplate(id);
    return NextResponse.json({ ok: true, template: reset });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "Failed to reset template" }, { status: 500 });
  }
}
