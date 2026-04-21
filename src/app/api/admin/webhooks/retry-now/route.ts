import { assertAdminMutationRequest } from "@/lib/admin-security";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { processWebhookRetryJobs } from "@/lib/webhook-retry";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "admin:webhooks:retry-now"),
    limit: 20,
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

  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const results = await processWebhookRetryJobs(30);

  return NextResponse.json({
    processed: results.length,
    completed: results.filter((item) => item.status === "COMPLETED").length,
    requeued: results.filter((item) => item.status === "REQUEUED").length,
    failed: results.filter((item) => item.status === "FAILED").length,
  });
}
