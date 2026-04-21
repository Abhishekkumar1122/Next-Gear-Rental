import { bookingsStore } from "@/lib/store";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().min(2).max(300).optional(),
});

type RouteParams = {
  params: Promise<{ bookingId: string }>;
};

type RefundablePayment = {
  id: string;
  status: string;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { bookingId } = await params;

  const parse = cancelSchema.safeParse(await request.json().catch(() => ({})));
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid cancellation payload" }, { status: 400 });
  }

  const reason = parse.data.reason ?? "User requested cancellation";

  if (process.env.DATABASE_URL) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
      },
    });

    const refundablePayments = booking.payments.filter((payment: RefundablePayment) =>
      ["PAID", "CREATED"].includes(payment.status),
    );

    await Promise.all(
      refundablePayments.map((payment: RefundablePayment) =>
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            metadataJson: JSON.stringify({ reason, cancelledAt: new Date().toISOString() }),
          },
        }),
      ),
    );

    return NextResponse.json({
      message: "Booking cancelled and refund persisted",
      bookingId: booking.id,
      refundsUpdated: refundablePayments.length,
    });
  }

  const booking = bookingsStore.find((entry) => entry.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  booking.status = "cancelled";

  return NextResponse.json({
    message: "Booking cancelled (fallback mode)",
    bookingId: booking.id,
    reason,
  });
}
