import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export type DashboardPaymentItem = {
  id: string;
  provider: string;
  status: string;
  amountINR: number;
  currency: string;
  bookingId: string;
  cityName: string;
  customerEmail?: string | null;
  createdAt: string;
};

type AdminHistoryFilters = {
  provider?: string;
  status?: string;
};

function mapPayment(payment: {
  id: string;
  provider: string;
  status: string;
  amountINR: number;
  currency: string;
  bookingId: string;
  createdAt: Date;
  booking: { cityName: string; user?: { email: string | null } };
}): DashboardPaymentItem {
  return {
    id: payment.id,
    provider: payment.provider,
    status: payment.status,
    amountINR: payment.amountINR,
    currency: payment.currency,
    bookingId: payment.bookingId,
    cityName: payment.booking.cityName,
    customerEmail: payment.booking.user?.email,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function getCustomerHistory(userId: string) {
  if (!process.env.DATABASE_URL) return [];

  const payments = await prisma.payment.findMany({
    where: {
      booking: {
        userId,
      },
    },
    include: {
      booking: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });

  return payments.map(mapPayment);
}

export async function getVendorHistory(ownerUserId: string) {
  if (!process.env.DATABASE_URL) return [];

  const payments = await prisma.payment.findMany({
    where: {
      booking: {
        vehicle: {
          vendor: {
            ownerUserId,
          },
        },
      },
    },
    include: {
      booking: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return payments.map(mapPayment);
}

export async function getAdminHistory(filters?: AdminHistoryFilters) {
  if (!process.env.DATABASE_URL) return [];

  const provider = filters?.provider?.toLowerCase().trim();
  const status = filters?.status?.toUpperCase().trim();
  const allowedStatuses = new Set<PaymentStatus>(["CREATED", "PAID", "FAILED", "REFUNDED"]);
  const statusFilter = status && allowedStatuses.has(status as PaymentStatus) ? (status as PaymentStatus) : undefined;

  const payments = await prisma.payment.findMany({
    where: {
      ...(provider ? { provider } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      booking: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 25,
  });

  return payments.map(mapPayment);
}
