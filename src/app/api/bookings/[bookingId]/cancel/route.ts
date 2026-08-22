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
  amountINR: number;
  status: string;
};

function calculateRefund(startDate: Date, amount: number) {
  const now = new Date();
  const startTime = new Date(startDate).getTime();
  const diffMs = startTime - now.getTime();
  const hoursDiff = diffMs / (1000 * 60 * 60);

  let refundPercent = 0;
  let description = "";

  if (hoursDiff > 24) {
    refundPercent = 100;
    description = "Cancelled > 24 hours prior: 100% refund";
  } else if (hoursDiff >= 12) {
    refundPercent = 50;
    description = "Cancelled 12-24 hours prior: 50% refund, 50% cancellation fee";
  } else if (hoursDiff > 0) {
    refundPercent = 0;
    description = "Cancelled < 12 hours prior: 0% refund, 100% cancellation fee";
  } else {
    refundPercent = 0;
    description = "Cancelled after rental start: 0% refund";
  }

  const refundAmount = Math.round((amount * refundPercent) / 100);
  const cancellationFee = amount - refundAmount;

  return {
    refundPercent,
    refundAmount,
    cancellationFee,
    description,
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { bookingId } = await params;

  if (process.env.DATABASE_URL) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const totalAmount = booking.totalAmountINR;
    const { refundPercent, refundAmount, cancellationFee, description } = calculateRefund(
      booking.startDate,
      totalAmount
    );

    return NextResponse.json({
      bookingId: booking.id,
      totalAmount,
      refundPercent,
      refundAmount,
      cancellationFee,
      description,
      startDate: booking.startDate,
    });
  }

  const booking = bookingsStore.find((entry) => entry.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Fallback mode
  const totalAmount = booking.totalAmountINR;
  const { refundPercent, refundAmount, cancellationFee, description } = calculateRefund(
    new Date(booking.startDate),
    totalAmount
  );

  return NextResponse.json({
    bookingId: booking.id,
    totalAmount,
    refundPercent,
    refundAmount,
    cancellationFee,
    description,
    startDate: booking.startDate,
  });
}

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

    const currentStatus = booking.status.toUpperCase();
    if (currentStatus === "COMPLETED") {
      return NextResponse.json({ error: "Cannot cancel a completed booking." }, { status: 400 });
    }
    if (currentStatus === "CANCELLED") {
      return NextResponse.json({ error: "This booking is already cancelled." }, { status: 400 });
    }

    const { refundPercent, refundAmount, cancellationFee, description } = calculateRefund(
      booking.startDate,
      booking.totalAmountINR
    );

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
      },
    });

    const refundablePayments = booking.payments.filter((payment: RefundablePayment) =>
      ["PAID", "CREATED"].includes(payment.status)
    );

    await Promise.all(
      refundablePayments.map((payment: RefundablePayment) =>
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            metadataJson: JSON.stringify({
              reason,
              cancelledAt: new Date().toISOString(),
              refundPercent,
              refundAmount,
              cancellationFee,
              description,
            }),
          },
        })
      )
    );

    return NextResponse.json({
      message: "Booking cancelled and refund processed",
      bookingId: booking.id,
      refundsUpdated: refundablePayments.length,
      refundPercent,
      refundAmount,
      cancellationFee,
      description,
    });
  }

  const booking = bookingsStore.find((entry) => entry.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { refundPercent, refundAmount, cancellationFee, description } = calculateRefund(
    new Date(booking.startDate),
    booking.totalAmountINR
  );

  booking.status = "cancelled";

  return NextResponse.json({
    message: "Booking cancelled (fallback mode)",
    bookingId: booking.id,
    reason,
    refundPercent,
    refundAmount,
    cancellationFee,
    description,
  });
}
