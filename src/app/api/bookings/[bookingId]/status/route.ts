import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled"]),
});

type RouteParams = {
  params: Promise<{ bookingId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { bookingId } = await params;

  const parse = updateStatusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
  }

  const { status } = parse.data;

  if (process.env.DATABASE_URL) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const dbStatus = status.toUpperCase() as "CONFIRMED" | "COMPLETED" | "CANCELLED";

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: dbStatus },
    });

    return NextResponse.json({
      message: "Booking status updated",
      bookingId,
      status,
    });
  }

  const booking = bookingsStore.find((entry) => entry.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  booking.status = status;

  return NextResponse.json({
    message: "Booking status updated (fallback mode)",
    bookingId,
    status,
  });
}
