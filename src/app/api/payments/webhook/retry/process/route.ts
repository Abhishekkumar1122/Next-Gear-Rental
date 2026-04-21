import { processWebhookRetryJobs } from "@/lib/webhook-retry";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "webhook:retry:process"),
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
    return NextResponse.json({ error: "Database mode is required for retry processing" }, { status: 400 });
  }

  const adminSecret = process.env.WEBHOOK_RETRY_SECRET;
  const providedSecret = request.headers.get("x-retry-secret");

  if (adminSecret && providedSecret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized retry processor request" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid retry processor payload" }, { status: 400 });
  }

  const limit = parsed.data.limit ?? 20;
  const results = await processWebhookRetryJobs(limit);

  return NextResponse.json({ processed: results.length, results });
}
