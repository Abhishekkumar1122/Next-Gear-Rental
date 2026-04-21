import { verifySessionToken, authCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type PaymentStatusValue = "CREATED" | "PAID" | "FAILED" | "REFUNDED";

type PaymentExportRow = {
  id: string;
  provider: string;
  status: string;
  amountINR: number;
  currency: string;
  bookingId: string;
  booking: {
    user: {
      email: string | null;
    };
  };
  createdAt: Date;
};

function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return "id,provider,status,amountINR,currency,bookingId,customerEmail,createdAt\n";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(","));
  return [headers.join(","), ...lines].join("\n");
}

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    key: getRateLimitKey(request, "admin:finance:export"),
    limit: 15,
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

  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await verifySessionToken(token);
    if (String(payload.role) !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get("provider")?.toLowerCase() ?? "";
  const status = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? "";
  const allowedStatuses = new Set<PaymentStatusValue>(["CREATED", "PAID", "FAILED", "REFUNDED"]);
  const statusFilter =
    status && allowedStatuses.has(status as PaymentStatusValue)
      ? (status as PaymentStatusValue)
      : undefined;

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
    take: 1000,
  });

  const rows = payments.map((payment: PaymentExportRow) => ({
    id: payment.id,
    provider: payment.provider,
    status: payment.status,
    amountINR: payment.amountINR,
    currency: payment.currency,
    bookingId: payment.bookingId,
    customerEmail: payment.booking.user.email ?? "",
    createdAt: payment.createdAt.toISOString(),
  }));

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance-export-${Date.now()}.csv"`,
    },
  });
}
