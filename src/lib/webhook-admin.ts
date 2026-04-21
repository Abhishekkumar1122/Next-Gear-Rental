import { prisma } from "@/lib/prisma";
import { WebhookLogStatus, WebhookProvider } from "@prisma/client";

export type AdminWebhookLogItem = {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  providerEntityId?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

type Filters = {
  provider?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function getWebhookAuditLogs(filters?: Filters) {
  if (!process.env.DATABASE_URL) {
    return {
      items: [] as AdminWebhookLogItem[],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    };
  }

  const provider = filters?.provider?.toUpperCase().trim();
  const status = filters?.status?.toUpperCase().trim();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, filters?.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const providerSet = new Set<WebhookProvider>(["STRIPE", "RAZORPAY"]);
  const statusSet = new Set<WebhookLogStatus>(["RECEIVED", "PROCESSED", "FAILED", "DUPLICATE", "IGNORED"]);

  const providerFilter = provider && providerSet.has(provider as WebhookProvider) ? (provider as WebhookProvider) : undefined;
  const statusFilter = status && statusSet.has(status as WebhookLogStatus) ? (status as WebhookLogStatus) : undefined;

  const where = {
    ...(providerFilter ? { provider: providerFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [totalItems, logs] = await Promise.all([
    prisma.webhookEventLog.count({ where }),
    prisma.webhookEventLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize,
      skip,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const items = logs.map((log): AdminWebhookLogItem => ({
    id: log.id,
    provider: log.provider,
    eventId: log.eventId,
    eventType: log.eventType,
    providerEntityId: log.providerEntityId ?? undefined,
    status: log.status,
    errorMessage: log.errorMessage ?? undefined,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
