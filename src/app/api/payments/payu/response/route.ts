import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runtimeBookings } from "@/lib/runtime-store";
import { verifyPayUResponseHash, PayUResponseParams } from "@/lib/payu";
import { dispatchHtmlEmail } from "@/lib/alert-dispatch";
import { generateBookingConfirmationEmailHtml } from "@/lib/email-templates";
import { sendWhatsAppBookingReceipt, sendVendorBookingNotification } from "@/lib/whatsapp-service";
import { generateBookingReceiptPdfBuffer } from "@/lib/pdf-generator";

export async function POST(request: NextRequest) {
  const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const reqProto = request.headers.get("x-forwarded-proto") || (reqHost?.includes("localhost") || reqHost?.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = reqHost ? `${reqProto}://${reqHost}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  try {
    const formData = await request.formData();
    const params: PayUResponseParams = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const txnid = params.txnid || "";
    const bookingId = params.udf1 || txnid.replace(/^NG_PAYU_/, "").split("_")[0] || "";
    const status = (params.status || "").toLowerCase();
    const mihpayid = params.mihpayid || "";
    const bankRefNum = params.bank_ref_num || "";
    const paymentMode = params.mode || "PayU";
    const amountINR = params.amount ? Math.round(Number(params.amount)) : 0;
    const errorMessage = params.error_Message || params.error || "Payment failed or cancelled";

    const isHashValid = verifyPayUResponseHash(params);

    if (!isHashValid) {
      console.error("[PayU Security Warning] Invalid response hash detected for txnid:", txnid, params);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/customer?bookingId=${encodeURIComponent(bookingId)}&payment=tampered`,
        { status: 303 }
      );
    }

    const hasDatabase = Boolean(process.env.DATABASE_URL);

    if (status === "success") {
      let confirmedBooking: any = null;

      if (hasDatabase) {
        // Update payment and booking within a transaction to enforce concurrency check
        try {
          await prisma.$transaction(async (tx) => {
            // 1. Update Payment Status to PAID
            await tx.payment.updateMany({
              where: { providerPaymentId: txnid },
              data: {
                status: "PAID",
                metadataJson: JSON.stringify({
                  mihpayid,
                  bankRefNum,
                  paymentMode,
                  payuParams: params,
                }),
              },
            });

            // 2. Fetch booking details to lock vehicle
            const booking = await tx.booking.findUnique({
              where: { id: bookingId },
              include: { vehicle: true },
            });

            if (!booking) {
              throw new Error("Booking not found");
            }

            // 3. PostgreSQL Row-level locking to serialize checks on this vehicle
            await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${booking.vehicleId} FOR UPDATE`;

            // 4. Overlap double-booking verification check
            const isTestRideVehicle = booking.vehicle.pricePerDayINR <= 1 || booking.vehicle.title.toLowerCase().includes("test");
            const hasOverlap = isTestRideVehicle
              ? false
              : (await tx.booking.count({
                  where: {
                    vehicleId: booking.vehicleId,
                    status: "CONFIRMED",
                    id: { not: bookingId },
                    startDate: { lte: booking.endDate },
                    endDate: { gte: booking.startDate },
                  },
                })) > 0;

            if (hasOverlap) {
              console.error(`[Double-Booking Guard] Blocking overlapping confirmation for booking ${bookingId}`);
              confirmedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                  status: "CANCELLED",
                  handoverStatus: "CONFLICT",
                },
                include: { user: true, vehicle: true },
              });
            } else {
              confirmedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                  status: "CONFIRMED",
                },
                include: { user: true, vehicle: true },
              });
            }
          });
        } catch (txErr) {
          console.error("[PayU Transaction Fail]", txErr);
          try {
            confirmedBooking = await prisma.booking.findUnique({
              where: { id: bookingId },
              include: { user: true, vehicle: true },
            });
          } catch {}
        }
      } else {
        // Runtime Store fallback
        const idx = runtimeBookings.findIndex((b) => b.id === bookingId);
        if (idx !== -1) {
          runtimeBookings[idx].status = "confirmed";
          confirmedBooking = runtimeBookings[idx];
        }
      }

      // Trigger Instant Delivery Pipeline: Email with PDF pass + WhatsApp alerts
      if (confirmedBooking) {
        const customerEmail = confirmedBooking.user?.email || confirmedBooking.userEmail || params.email || "";
        const customerName = confirmedBooking.user?.name || confirmedBooking.userName || params.firstname || "Valued Rider";
        const customerPhone = confirmedBooking.user?.phone || confirmedBooking.phone || params.phone || "";
        const vehicleTitle = confirmedBooking.vehicle?.title || confirmedBooking.vehicleTitle || params.productinfo || "Rental Vehicle";
        const vehicleType = confirmedBooking.vehicle?.type || confirmedBooking.vehicleType || "Bike";
        const cityName = confirmedBooking.city || "Delhi NCR";
        const startDateStr = confirmedBooking.startDate instanceof Date
          ? confirmedBooking.startDate.toISOString().split("T")[0]
          : String(confirmedBooking.startDate);
        const endDateStr = confirmedBooking.endDate instanceof Date
          ? confirmedBooking.endDate.toISOString().split("T")[0]
          : String(confirmedBooking.endDate);
        const totalAmount = confirmedBooking.totalAmountINR || amountINR;

        // 1. Dispatch Email with Attached PDF Pass
        if (customerEmail) {
          try {
            const emailHtml = generateBookingConfirmationEmailHtml({
              bookingId,
              customerName,
              vehicleTitle,
              vehicleType,
              cityName,
              startDate: startDateStr,
              endDate: endDateStr,
              totalAmountINR: totalAmount,
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
                totalAmountINR: totalAmount,
              });
            } catch (pdfErr) {
              console.error("[PayU PDF Generation Error]", pdfErr);
            }

            await dispatchHtmlEmail({
              to: customerEmail,
              subject: `✅ Booking Confirmed #${bookingId} - ${vehicleTitle} [PayU Paid]`,
              html: emailHtml,
              attachments: pdfBuffer
                ? [
                    {
                      filename: `NextGear-Receipt-${bookingId}.pdf`,
                      content: pdfBuffer,
                    },
                  ]
                : undefined,
            });
          } catch (mailErr) {
            console.error("[PayU Email Dispatch Error]", mailErr);
          }
        }

        // 2. Dispatch Customer WhatsApp with 1-Click Google Maps Link
        if (customerPhone) {
          void sendWhatsAppBookingReceipt({
            bookingId,
            customerName,
            customerPhone,
            vehicleTitle,
            cityName,
            startDate: startDateStr,
            endDate: endDateStr,
            totalAmountINR: totalAmount,
          });
        }

        // 3. Dispatch Vendor Booking Alert
        void sendVendorBookingNotification({
          bookingId,
          customerName,
          customerPhone,
          vehicleTitle,
          cityName,
          startDate: startDateStr,
          endDate: endDateStr,
          totalAmountINR: totalAmount,
        });
      }

      return NextResponse.redirect(
        `${baseUrl}/book-vehicle?bookingId=${encodeURIComponent(bookingId)}&payment=success&txnid=${encodeURIComponent(txnid)}`,
        { status: 303 }
      );
    } else {
      // Payment Failed or Cancelled by User
      if (hasDatabase) {
        try {
          await prisma.payment.updateMany({
            where: { providerPaymentId: txnid },
            data: {
              status: "FAILED",
              metadataJson: JSON.stringify({
                errorMessage,
                payuParams: params,
              }),
            },
          });
        } catch (e) {
          console.warn("[PayU Payment Fail Update Warn]", e);
        }
      }

      return NextResponse.redirect(
        `${baseUrl}/book-vehicle?bookingId=${encodeURIComponent(bookingId)}&payment=failed&reason=${encodeURIComponent(errorMessage)}`,
        { status: 303 }
      );
    }
  } catch (error) {
    console.error("[PayU Response Handler Error]", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/customer?payment=error&message=${encodeURIComponent("Failed to process payment callback")}`,
      { status: 303 }
    );
  }
}
