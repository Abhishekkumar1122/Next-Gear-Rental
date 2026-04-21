import { assertAdminMutationRequest, assertAdminSession } from "@/lib/admin-security";
import {
  getContactRequests,
  updateContactRequestStatus,
  type ContactRequestStatus,
} from "@/lib/contact-requests";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.enum(["new", "in-progress", "resolved"]);

const updateSchema = z.object({
  id: z.string().min(2),
  status: statusSchema,
});

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusParam = request.nextUrl.searchParams.get("status") ?? "all";
  const queryParam = request.nextUrl.searchParams.get("query") ?? "";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "100");

  const safeStatus: ContactRequestStatus | "all" =
    statusParam === "new" || statusParam === "in-progress" || statusParam === "resolved"
      ? statusParam
      : "all";

  const requests = await getContactRequests({
    status: safeStatus,
    query: queryParam,
    limit: Number.isFinite(limitParam) ? limitParam : 100,
  });

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateContactRequestStatus(parsed.data.id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ request: updated });
}
