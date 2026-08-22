import { processWebhookRetryJobs } from "@/lib/webhook-retry";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { cleanupExpiredPhotos } from "@/lib/handover-cleanup";

function isAuthorized(request: Request) {
  const expected = process.env.WEBHOOK_RETRY_CRON_SECRET ?? process.env.WEBHOOK_RETRY_SECRET;
  if (!expected) return true;
  const provided = request.headers.get("x-cron-secret");
  return provided === expected;
}

async function handle(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "webhook:retry:cron"),
    limit: 12,
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

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron runner request" }, { status: 401 });
  }

  const results = await processWebhookRetryJobs(50);
  
  // Run photo cleanup for privacy compliance (older than 48 hours)
  const cleanupResult = await cleanupExpiredPhotos().catch((err) => {
    console.error("Cron execution error during photo cleanup:", err);
    return { success: false, error: String(err) };
  });

  const summary = {
    completed: results.filter((item) => item.status === "COMPLETED").length,
    requeued: results.filter((item) => item.status === "REQUEUED").length,
    failed: results.filter((item) => item.status === "FAILED").length,
    photoCleanup: cleanupResult,
  };

  return NextResponse.json({ processed: results.length, summary, results });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
