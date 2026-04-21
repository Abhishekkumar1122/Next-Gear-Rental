import { getMetricsSnapshot } from "@/lib/ops-metrics";
import { prisma } from "@/lib/prisma";

export const allowedTrendHours = [6, 24, 72] as const;
export type TrendHours = (typeof allowedTrendHours)[number];

export function normalizeTrendHours(value: string | number | null | undefined): TrendHours {
  const parsed = typeof value === "number" ? value : Number(value);
  if (allowedTrendHours.includes(parsed as TrendHours)) {
    return parsed as TrendHours;
  }

  return 24;
}

export async function getOpsMetricsReport(options?: { trendHours?: string | number | null }) {
  const appMetrics = getMetricsSnapshot();
  const trendHours = normalizeTrendHours(options?.trendHours);

  if (!process.env.DATABASE_URL) {
    return { appMetrics, databaseMetrics: null, trends: null };
  }

  const since = new Date(Date.now() - trendHours * 60 * 60 * 1000);

  const [webhookLogs, retryJobs, webhookLogs24h, retryJobs24h] = await Promise.all([
    prisma.webhookEventLog.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.webhookRetryJob.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.webhookEventLog.groupBy({
      by: ["status"],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.webhookRetryJob.groupBy({
      by: ["status"],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalWebhookEvents24h = webhookLogs24h.reduce((sum, item) => sum + item._count._all, 0);
  const totalRetryJobs24h = retryJobs24h.reduce((sum, item) => sum + item._count._all, 0);

  return {
    appMetrics,
    databaseMetrics: {
      webhookLogs,
      retryJobs,
    },
    trends: {
      windowHours: trendHours,
      windowStart: since.toISOString(),
      webhookLogs: webhookLogs24h,
      retryJobs: retryJobs24h,
      totals: {
        webhookLogs: totalWebhookEvents24h,
        retryJobs: totalRetryJobs24h,
      },
    },
  };
}
