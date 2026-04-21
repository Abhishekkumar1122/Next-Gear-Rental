import Redis from "ioredis";

const globalRedis = globalThis as unknown as { redis?: Redis | null };

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  return new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableAutoPipelining: true,
    lazyConnect: true,
  });
}

export function getRedisClient() {
  if (typeof globalRedis.redis !== "undefined") {
    return globalRedis.redis;
  }

  globalRedis.redis = createRedisClient();
  return globalRedis.redis;
}
