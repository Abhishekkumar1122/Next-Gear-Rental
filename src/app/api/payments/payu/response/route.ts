import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runtimeBookings } from "@/lib/runtime-store";
import { verifyPayUResponseHash, PayUResponseParams } from "@/lib/payu";
import { dispatchHtmlEmail } from "@/lib/alert-dispatch";
import { generateBookingConfirmationEmailHtml } from "@/lib/email-templates";
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
            // 1. Update Payment Status to PAID (matching providerPaymentId or bookingId)
            const updateResult = await tx.payment.updateMany({
              where: {
                OR: [
                  { providerPaymentId: txnid },
                  { bookingId: bookingId },
                ],
              },
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

            // If no existing Payment record existed, create one directly
            if (updateResult.count === 0) {
              await tx.payment.create({
                data: {
                  booking: { connect: { id: bookingId } },
                  amountINR: Math.round(amountINR || 0),
                  currency: "INR",
                  status: "PAID",
                  provider: "PAYU",
                  providerPaymentId: txnid,
                  metadataJson: JSON.stringify({
                    mihpayid,
                    bankRefNum,
                    paymentMode,
                    payuParams: params,
                  }),
                },
              });
            }

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
        const cityName = confirmedBooking.cityName || confirmedBooking.city || params.city || "Delhi NCR";
        const startDateStr = confirmedBooking.startDate instanceof Date
          ? confirmedBooking.startDate.toISOString().split("T")[0]
          : String(confirmedBooking.startDate);
        const endDateStr = confirmedBooking.endDate instanceof Date
          ? confirmedBooking.endDate.toISOString().split("T")[0]
          : String(confirmedBooking.endDate);
        const totalAmount = confirmedBooking.totalAmountINR || amountINR;

        // Unified Tri-Party & In-App Alerts (Customer, Vendor, Super Admin)
        try {
          const { dispatchTriPartyBookingAlerts } = await import("@/lib/booking-alerts");
          await dispatchTriPartyBookingAlerts(bookingId);
        } catch (aErr) {
          console.error("[PayU Alert Dispatch Error]", aErr);
        }

        // Instant Cache Busting for Vendor & Customer Dashboards
        try {
          const { revalidatePath } = await import("next/cache");
          revalidatePath("/dashboard/vendor");
          revalidatePath("/dashboard/customer");
          revalidatePath("/dashboard/admin");
        } catch {}
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

          // Explicitly update booking status to CANCELLED so it never appears confirmed in admin/vendor portals
          if (bookingId) {
            await prisma.booking.updateMany({
              where: { id: bookingId },
              data: {
                status: "CANCELLED",
              },
            });
          }
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
