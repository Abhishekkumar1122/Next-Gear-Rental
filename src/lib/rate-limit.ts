import { getRedisClient } from "@/lib/redis";
import { incrementMetric } from "@/lib/ops-metrics";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

export function getRateLimitKey(request: Request, scope: string) {
  const ip = getClientIp(request);
  return `${scope}:${ip}`;
}

async function checkRateLimitInMemory({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    incrementMetric("rate_limit.allowed");
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    incrementMetric("rate_limit.blocked");
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  incrementMetric("rate_limit.allowed");

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const redis = getRedisClient();
  if (!redis) {
    incrementMetric("rate_limit.backend.memory");
    return checkRateLimitInMemory({ key, limit, windowMs });
  }

  const namespacedKey = `rl:${key}`;

  try {
    if (redis.status !== "ready") {
      await redis.connect().catch(() => undefined);
    }

    const script = `
      local current = redis.call("INCR", KEYS[1])
      if tonumber(current) == 1 then
        redis.call("PEXPIRE", KEYS[1], ARGV[1])
      end
      local ttl = redis.call("PTTL", KEYS[1])
      return {current, ttl}
    `;

    const result = (await redis.eval(script, 1, namespacedKey, windowMs.toString())) as [number | string, number | string];
    const current = Number(result[0] ?? 0);
    const ttlMs = Math.max(0, Number(result[1] ?? 0));
    const now = Date.now();
    const resetAt = now + ttlMs;

    if (current > limit) {
      incrementMetric("rate_limit.blocked");
      incrementMetric("rate_limit.backend.redis");
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
      };
    }

    incrementMetric("rate_limit.allowed");
    incrementMetric("rate_limit.backend.redis");
    return {
      allowed: true,
      remaining: Math.max(0, limit - current),
      resetAt,
      retryAfterSeconds: 0,
    };
  } catch {
    incrementMetric("rate_limit.redis_errors");
    incrementMetric("rate_limit.backend.memory");
    return checkRateLimitInMemory({ key, limit, windowMs });
  }
}
