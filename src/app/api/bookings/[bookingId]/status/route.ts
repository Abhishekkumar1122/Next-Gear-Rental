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
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, vehicle: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const dbStatus = status.toUpperCase() as "CONFIRMED" | "COMPLETED" | "CANCELLED";

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: dbStatus },
    });

    if (dbStatus === "COMPLETED" && booking.user?.phone) {
      try {
        const { dispatchAlert } = await import("@/lib/alert-dispatch");
        const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://next-gear.app"}/api/bookings/${booking.id}/pass`;
        void dispatchAlert({
          channel: "whatsapp",
          to: booking.user.phone,
          message: `Your rental for ${booking.vehicle?.title || "Vehicle"} is completed. Thank you! Download invoice: ${invoiceLink}`,
          templateName: "rental_completed_invoice",
          templateParams: [
            booking.user.name || "Valued Rider",
            booking.id,
            booking.vehicle?.title || "Rental Vehicle",
            booking.totalAmountINR.toLocaleString("en-IN"),
            invoiceLink,
          ],
        });
      } catch (e) {
        console.error("[Completion WhatsApp Alert Error]", e);
      }
    }

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
