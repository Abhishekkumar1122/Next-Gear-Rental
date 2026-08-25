import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { generateBookingReceiptPdfBuffer } from "@/lib/pdf-generator";

type RouteParams = {
  params: Promise<{ bookingId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  let bookingData: {
    id: string;
    customerName: string;
    customerPhone?: string;
    vehicleTitle: string;
    vehicleType?: string;
    cityName: string;
    startDate: string;
    endDate: string;
    totalAmountINR: number;
    subtotalAmountINR?: number;
    discountINR?: number;
    amountPaid?: number;
    pickupAddress?: string;
  } | null = null;

  if (process.env.DATABASE_URL) {
    try {
      let booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          vehicle: {
            include: {
              vendor: true,
            },
          },
          payments: {
            where: { status: "PAID" },
          },
        },
      });

      if (!booking) {
        const allRecent = await prisma.booking.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
            vehicle: {
              include: {
                vendor: true,
              },
            },
            payments: {
              where: { status: "PAID" },
            },
          },
        });
        const { formatBookingId } = await import("@/lib/pricing-tiers");
        booking = allRecent.find((b) => formatBookingId(b.id, b.cityName, b.startDate) === bookingId) || null;
      }

      if (booking) {
        const paidAmount = booking.payments.reduce((sum, p) => sum + p.amountINR, 0);
        bookingData = {
          id: booking.id,
          customerName: booking.user.name || "Valued Rider",
          customerPhone: booking.user.phone || undefined,
          vehicleTitle: booking.vehicle?.title || "Rental Vehicle",
          vehicleType: booking.vehicle?.type || "Bike / Car",
          cityName: booking.cityName || "Delhi NCR",
          startDate: booking.startDate.toISOString().slice(0, 10),
          endDate: booking.endDate.toISOString().slice(0, 10),
          totalAmountINR: booking.totalAmountINR,
          amountPaid: paidAmount,
          pickupAddress: booking.vehicle?.vendor?.businessName
            ? `${booking.vehicle.vendor.businessName}, ${booking.cityName}`
            : `Next Gear Hub, ${booking.cityName}`,
        };
      }
    } catch (err) {
      console.error("[Pass Generator DB Error]", err);
    }
  }

  // Fallback to in-memory store
  if (!bookingData) {
    const { formatBookingId } = await import("@/lib/pricing-tiers");
    const memoryBooking = bookingsStore.find(
      (b) => b.id === bookingId || formatBookingId(b.id, b.city, b.startDate) === bookingId
    );
    if (memoryBooking) {
      bookingData = {
        id: memoryBooking.id,
        customerName: memoryBooking.userName || "Valued Rider",
        customerPhone: (memoryBooking as any).customerPhone || undefined,
        vehicleTitle: memoryBooking.vehicleTitle || "Rental Vehicle",
        vehicleType: memoryBooking.vehicleFuel || "Bike / Car",
        cityName: memoryBooking.city || "Delhi NCR",
        startDate: memoryBooking.startDate,
        endDate: memoryBooking.endDate,
        totalAmountINR: memoryBooking.totalAmountINR,
        amountPaid: memoryBooking.totalAmountINR,
        pickupAddress: `Next Gear Hub, ${memoryBooking.city}`,
      };
    }
  }

  if (!bookingData) {
    return NextResponse.json({ error: "Booking pass not found" }, { status: 404 });
  }

  try {
    const { formatBookingId } = await import("@/lib/pricing-tiers");
    const displayId = formatBookingId(bookingData.id, bookingData.cityName, bookingData.startDate);

    const pdfBuffer = await generateBookingReceiptPdfBuffer({
      bookingId: displayId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      vehicleTitle: bookingData.vehicleTitle,
      vehicleType: bookingData.vehicleType,
      cityName: bookingData.cityName,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalAmountINR: bookingData.totalAmountINR,
      pickupAddress: bookingData.pickupAddress,
    });

    const isDownload = request.nextUrl.searchParams.get("download") === "1";
    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="NextGear-Booking-Pass-${displayId}.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (pdfErr) {
    console.error("[Pass PDF Generation Error]", pdfErr);
    return NextResponse.json({ error: "Failed to generate digital pass" }, { status: 500 });
  }
}
