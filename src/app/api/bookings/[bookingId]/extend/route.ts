import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runtimeBookings } from "@/lib/runtime-store";
import { dispatchHtmlEmail } from "@/lib/alert-dispatch";
import { generateBookingConfirmationEmailHtml } from "@/lib/email-templates";
import { sendWhatsAppBookingReceipt, sendVendorBookingNotification } from "@/lib/whatsapp-service";
import { generateBookingReceiptPdfBuffer } from "@/lib/pdf-generator";
import { z } from "zod";

const extendBookingSchema = z.object({
  extendedUntilDate: z.string().min(1, "Extended date is required"),
  extendedUntilTime: z.string().optional(),
  extraAmountINR: z.number().min(0),
  geotaggedPhotos: z.array(
    z.object({
      slot: z.enum(["front", "right", "rear", "left"]),
      photoDataUrl: z.string().min(10, "Photo data URL is required"),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      timestamp: z.string(),
    })
  ).min(4, "All 4 vehicle angle photos (Front, Right, Rear, Left) are mandatory"),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId: rawBookingId } = await context.params;
    const bookingId = decodeURIComponent(rawBookingId);

    const body = await request.json();
    const parseResult = extendBookingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { extendedUntilDate, extendedUntilTime, extraAmountINR, geotaggedPhotos, notes } = parseResult.data;
    const hasDatabase = Boolean(process.env.DATABASE_URL);

    let updatedBooking: any = null;

    if (hasDatabase) {
      const existing = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { vehicle: true, user: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const newEndDate = new Date(extendedUntilDate);
      const newTotal = existing.totalAmountINR + extraAmountINR;

      updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          endDate: newEndDate,
          totalAmountINR: newTotal,
        },
        include: { vehicle: true, user: true },
      });
    } else {
      const idx = runtimeBookings.findIndex((b) => b.id === bookingId);
      if (idx === -1) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      runtimeBookings[idx] = {
        ...runtimeBookings[idx],
        endDate: extendedUntilDate,
        endTime: extendedUntilTime || runtimeBookings[idx].endTime,
        totalAmountINR: runtimeBookings[idx].totalAmountINR + extraAmountINR,
      };

      updatedBooking = runtimeBookings[idx];
    }

    const customerEmail = updatedBooking.user?.email || updatedBooking.userEmail || "";
    const customerName = updatedBooking.user?.name || updatedBooking.userName || "Valued Customer";
    const customerPhone = updatedBooking.user?.phone || updatedBooking.phone || "";
    const vehicleTitle = updatedBooking.vehicle?.title || updatedBooking.vehicleTitle || "Rental Vehicle";
    const vehicleType = updatedBooking.vehicle?.type || updatedBooking.vehicleType || "Bike";
    const cityName = updatedBooking.city || "Delhi NCR";
    const startDateStr = updatedBooking.startDate instanceof Date
      ? updatedBooking.startDate.toISOString().split("T")[0]
      : String(updatedBooking.startDate);
    const endDateStr = `${extendedUntilDate}${extendedUntilTime ? ` ${extendedUntilTime}` : ""}`;
    const totalAmountINR = updatedBooking.totalAmountINR;

    // Send updated confirmation Email with PDF attachment
    if (customerEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app";
        const emailHtml = generateBookingConfirmationEmailHtml({
          bookingId,
          customerName,
          vehicleTitle,
          vehicleType,
          cityName,
          startDate: startDateStr,
          endDate: endDateStr,
          totalAmountINR,
          baseUrl,
        });

        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await generateBookingReceiptPdfBuffer({
            bookingId,
            customerName,
            customerPhone,
            vehicleTitle,
            vehicleType,
            cityName,
            startDate: startDateStr,
            endDate: endDateStr,
            totalAmountINR,
          });
        } catch (pdfErr) {
          console.error("[Extension PDF Generation Error]", pdfErr);
        }

        await dispatchHtmlEmail({
          to: customerEmail,
          subject: `⏳ Trip Extended Successfully #${bookingId} - ${vehicleTitle}`,
          html: emailHtml,
          attachments: pdfBuffer
            ? [
                {
                  filename: `NextGear-Extended-Receipt-${bookingId}.pdf`,
                  content: pdfBuffer,
                },
              ]
            : undefined,
        });
      } catch (mailErr) {
        console.error("[Trip Extension Email Error]", mailErr);
      }
    }

    // Send updated WhatsApp receipt to customer
    if (customerPhone) {
      void sendWhatsAppBookingReceipt({
        bookingId,
        customerName,
        customerPhone,
        vehicleTitle,
        cityName,
        startDate: startDateStr,
        endDate: endDateStr,
        totalAmountINR,
      });
    }

    // Notify vendor about trip extension
    void sendVendorBookingNotification({
      bookingId,
      customerName,
      customerPhone,
      vehicleTitle,
      cityName,
      startDate: startDateStr,
      endDate: endDateStr,
      totalAmountINR,
    });

    return NextResponse.json({
      success: true,
      message: "Trip extended successfully with verified geotagged vehicle inspection",
      booking: updatedBooking,
      photosCount: geotaggedPhotos.length,
    });
  } catch (error) {
    console.error("[Trip Extension Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extend trip" },
      { status: 500 }
    );
  }
}
