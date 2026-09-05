import { calculateDays, calculateHours, getHourlyRate, calculateHourlyBaseCost, calculateDailyVehicleCost } from "@/lib/pricing";
import { bookingAddOns, vehicles } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { getVehicleAvailabilityOverride } from "@/lib/vehicle-availability-db";
import { resolveVehicleAvailability } from "@/lib/vehicle-availability";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { computePromotionBreakdown, getBookingPromotionsByBookingIds, saveBookingPromotion } from "@/lib/promotions";
import { sendBookingAlert, upsertBookingAlertProfile } from "@/lib/booking-alerts";
import { getSiteSettings } from "@/lib/site-settings-server";
import { calculateBookingAmount } from "@/lib/pricing-tiers";
import { getServerSessionUser } from "@/lib/server-session";
import { sendWhatsAppBookingReceipt } from "@/lib/whatsapp-service";
import { Prisma } from "@prisma/client";
import { BookingAddOnId, BookingStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

function normalizeStatus(status: string): BookingStatus {
  if (status.toUpperCase() === "CANCELLED") return "cancelled";
  if (status.toUpperCase() === "COMPLETED") return "completed";
  if (status.toUpperCase() === "PENDING") return "pending";
  return "confirmed";
}

function getAddOnTotalForVehicle(
  addons: BookingAddOnId[],
  useHourly: boolean,
  units: number,
  qty: number,
  vehicle: { addonWaiverPrice?: number | null; addonRsaPrice?: number | null; addonHelmetPrice?: number | null }
) {
  return addons.reduce((total, addOnId) => {
    if (addOnId === "waiver") {
      const dailyWaiver = vehicle.addonWaiverPrice ?? 99;
      const rate = useHourly ? Math.ceil(dailyWaiver / 10) : dailyWaiver;
      return total + rate * units * qty;
    }
    if (addOnId === "rsa") {
      const dailyRsa = vehicle.addonRsaPrice ?? 49;
      const rate = useHourly ? Math.ceil(dailyRsa / 10) : dailyRsa;
      return total + rate * units * qty;
    }
    if (addOnId === "helmet") {
      const rate = vehicle.addonHelmetPrice ?? 50;
      return total + rate * qty;
    }
    const addOn = bookingAddOns.find((item) => item.id === addOnId);
    if (!addOn) return total;
    const rate = useHourly ? addOn.pricePerHourINR : addOn.pricePerDayINR;
    return total + rate * units * qty;
  }, 0);
}

function getHourlyAvailability(vehicle: { availabilitySlots?: { date: string; slots: string[] }[] }, startDate: string, startTime: string, endTime: string) {
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);
  if (Number.isNaN(startHour) || Number.isNaN(endHour) || startHour >= endHour) return false;
  const requested = Array.from({ length: endHour - startHour }, (_, index) => `${String(startHour + index).padStart(2, "0")}:00`);
  const dayAvailability = vehicle.availabilitySlots?.find((slot) => slot.date === startDate);
  if (!dayAvailability) return false;
  return requested.every((slot) => dayAvailability.slots.includes(slot));
}

export async function GET(request: NextRequest) {
  const requestedEmail = request.nextUrl.searchParams.get("email");
  const requestedPhone = request.nextUrl.searchParams.get("phone");
  const user = await getServerSessionUser();

  if (!user && !requestedEmail && !requestedPhone) {
    return NextResponse.json({ error: "Access denied. Authentication required." }, { status: 401 });
  }

  let whereClause: any = undefined;

  if (user?.role === "ADMIN") {
    // Admin sees ALL bookings by default, or specific customer if queried
    if (requestedEmail) {
      whereClause = { user: { email: { equals: requestedEmail, mode: "insensitive" as const } } };
    } else if (requestedPhone) {
      const cleanReqPhone = requestedPhone.replace(/\D/g, "").slice(-10);
      whereClause = {
        OR: [
          { user: { phone: cleanReqPhone } },
          { user: { email: { equals: `${cleanReqPhone}@guest.next-gear.app`, mode: "insensitive" as const } } },
        ],
      };
    }
    // If no requestedEmail/requestedPhone, whereClause remains undefined => returns ALL bookings!
  } else {
    // Customer query: Strictly matches user's own identity (id, email, or verified phone)
    const sessionEmail = user?.email && !user.email.endsWith("@guest.next-gear.app") ? user.email : null;
    const sessionPhone = user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : null;
    const searchEmail = requestedEmail || sessionEmail;
    const searchPhone = requestedPhone ? requestedPhone.replace(/\D/g, "").slice(-10) : sessionPhone;
    const userId = user?.id;

    whereClause = {
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(searchEmail ? [{ user: { email: { equals: searchEmail, mode: "insensitive" as const } } }] : []),
        ...(searchPhone
          ? [
              { user: { phone: searchPhone } },
              { user: { email: { equals: `${searchPhone}@guest.next-gear.app`, mode: "insensitive" as const } } },
            ]
          : []),
      ],
    };
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(5, Number(request.nextUrl.searchParams.get("limit")) || 25));

  if (process.env.DATABASE_URL) {
    const [totalCount, bookings] = await Promise.all([
      prisma.booking.count({ where: whereClause }),
      prisma.booking.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          vehicleId: true,
          cityName: true,
          startDate: true,
          endDate: true,
          totalAmountINR: true,
          currency: true,
          timezone: true,
          status: true,
          handoverStatus: true,
          startOdometer: true,
          endOdometer: true,
          startFuel: true,
          endFuel: true,
          startPhotos: true,
          endPhotos: true,
          extraChargesPaid: true,
          extraChargesAmount: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          payments: true,
          vehicle: {
            include: {
              vendor: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const promotionMap = await getBookingPromotionsByBookingIds(bookings.map((booking) => booking.id));

    return NextResponse.json({
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
      bookings: bookings.map((booking) => ({
        ...(promotionMap.get(booking.id)
          ? {
              subtotalAmountINR: promotionMap.get(booking.id)?.subtotalAmountINR,
              couponCode: promotionMap.get(booking.id)?.couponCode,
              couponDiscountINR: promotionMap.get(booking.id)?.couponDiscountINR,
              referralCode: promotionMap.get(booking.id)?.referralCode,
              referralDiscountINR: promotionMap.get(booking.id)?.referralDiscountINR,
            }
          : {}),
        id: booking.id,
        vehicleId: booking.vehicleId,
        vehicleTitle: booking.vehicle?.title || "Vehicle",
        vehicleFuel: booking.vehicle?.fuel || "petrol",
        userName: booking.user.name,
        userEmail: booking.user.email,
        city: booking.cityName,
        startDate: booking.startDate.toISOString().slice(0, 10),
        endDate: booking.endDate.toISOString().slice(0, 10),
        totalAmountINR: booking.totalAmountINR,
        amountPaid: booking.payments
          .filter((p) => p.status === "PAID")
          .reduce((sum, p) => sum + p.amountINR, 0),
        paymentStatus: booking.payments.some((p) => p.status === "PAID")
          ? "PAID"
          : booking.status === "CANCELLED"
            ? "REFUNDED"
            : booking.payments.some((p) => p.status === "FAILED")
              ? "FAILED"
              : booking.status === "CONFIRMED"
                ? "PAID"
                : "PENDING",
        paymentProvider: booking.payments[0]?.provider ? booking.payments[0].provider.toUpperCase() : "PAYU",
        payments: booking.payments.map((p) => ({
          id: p.id,
          provider: p.provider,
          amountINR: p.amountINR,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
        currency: booking.currency,
        status: normalizeStatus(booking.status),
        createdAt: booking.createdAt.toISOString(),
        timezone: booking.timezone,
        handoverStatus: booking.handoverStatus,
        startOdometer: booking.startOdometer,
        endOdometer: booking.endOdometer,
        vendorName: booking.vehicle?.vendor?.businessName || null,
        vendorPhone: booking.vehicle?.vendor?.contactPhone || null,
      })),
    });
  }

  const promotionMap = await getBookingPromotionsByBookingIds(bookingsStore.map((booking) => booking.id));

  const filterEmail = requestedEmail || (user?.email && !user.email.endsWith("@guest.next-gear.app") ? user.email : null);
  const filterPhone = requestedPhone?.replace(/\D/g, "").slice(-10) || (user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : null);

  const bookings = (filterEmail || filterPhone) && user?.role !== "ADMIN"
    ? bookingsStore.filter((booking) => {
        const emailMatch = filterEmail && booking.userEmail.toLowerCase() === filterEmail.toLowerCase();
        const phoneMatch = filterPhone && ((booking as any).customerPhone?.includes(filterPhone) || booking.userEmail.startsWith(filterPhone));
        return emailMatch || phoneMatch;
      }).map((booking) => ({
        ...booking,
        ...(promotionMap.get(booking.id)
          ? {
              subtotalAmountINR: promotionMap.get(booking.id)?.subtotalAmountINR,
              couponCode: promotionMap.get(booking.id)?.couponCode,
              couponDiscountINR: promotionMap.get(booking.id)?.couponDiscountINR,
              referralCode: promotionMap.get(booking.id)?.referralCode,
              referralDiscountINR: promotionMap.get(booking.id)?.referralDiscountINR,
            }
          : {}),
      }))
    : bookingsStore.map((booking) => ({
        ...booking,
        ...(promotionMap.get(booking.id)
          ? {
              subtotalAmountINR: promotionMap.get(booking.id)?.subtotalAmountINR,
              couponCode: promotionMap.get(booking.id)?.couponCode,
              couponDiscountINR: promotionMap.get(booking.id)?.couponDiscountINR,
              referralCode: promotionMap.get(booking.id)?.referralCode,
              referralDiscountINR: promotionMap.get(booking.id)?.referralDiscountINR,
            }
          : {}),
      }));

  const mappedBookings = bookings.map((booking) => ({
    ...booking,
    amountPaid: (booking as any).amountPaid ?? calculateBookingAmount(booking.totalAmountINR),
  }));

  return NextResponse.json({ bookings: mappedBookings });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const {
    vehicleId,
    userName,
    userEmail,
    city,
    startDate,
    endDate,
    startTime,
    endTime,
    addons,
    currency,
    timezone,
    couponCode,
    referralCode,
    phone,
    quantity,
    deliveryMode,
    deliveryAddress,
    deliveryLandmark,
    deliveryLat,
    deliveryLng,
    deliveryFeeINR,
    deliveryDistanceKm,
  } = payload;

  const qty = Math.max(1, Number(quantity ?? 1));
  const settings = await getSiteSettings();
  const multiVehicleMinQty = Number(settings.multiVehicleMinQty || 3);
  const multiVehicleDiscountPercent = Number(settings.multiVehicleDiscountPercent || 10);
  const durationDiscountMinDays = Number(settings.durationDiscountMinDays || 4);
  const durationDiscountFreeDays = Number(settings.durationDiscountFreeDays || 1);

  const cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(-10) : "";
  const effectiveEmail = userEmail && userEmail.trim().includes("@") && !userEmail.endsWith("@example.com")
    ? userEmail.trim().toLowerCase()
    : (cleanPhone ? `${cleanPhone}@guest.next-gear.app` : "");

  if (!vehicleId || !userName || (!effectiveEmail && !cleanPhone) || !city || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 15-second Idempotency check to prevent duplicate bookings from double clicks
  if (process.env.DATABASE_URL) {
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const existingPending = await prisma.booking.findFirst({
      where: {
        ...(effectiveEmail ? { user: { email: { equals: effectiveEmail, mode: "insensitive" } } } : {}),
        vehicleId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdAt: { gte: fifteenSecondsAgo },
      },
    });

    if (existingPending) {
      console.log(`[Idempotency active] Returning existing pending booking ${existingPending.id} to prevent duplicates`);
      return NextResponse.json({
        booking: {
          id: existingPending.id,
          vehicleId: existingPending.vehicleId,
          userName,
          userEmail: effectiveEmail,
          city: existingPending.cityName,
          startDate: existingPending.startDate.toISOString().slice(0, 10),
          endDate: existingPending.endDate.toISOString().slice(0, 10),
          totalAmountINR: existingPending.totalAmountINR,
          currency: existingPending.currency,
          status: normalizeStatus(existingPending.status),
          createdAt: existingPending.createdAt.toISOString(),
        },
        payuCheckout: null,
      }, { status: 201 });
    }
  }

  if (new Date(endDate) < new Date(startDate)) {
    return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
  }

  const addOnIds = Array.isArray(addons) ? (addons as BookingAddOnId[]) : [];
  const useHourly = Boolean(startTime && endTime && startDate && endDate && startDate === endDate);

  if (process.env.DATABASE_URL) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const isTestRideVehicle = vehicle.pricePerDayINR <= 1 || vehicle.title.toLowerCase().includes("test");

    let bookingResult: any = null;
    let userResult: any = null;
    let conflictError: string | null = null;
    let subtotalAmountINR = 0;
    let totalAmountINR = 0;
    let promotionResult: any = null;
    let units = 0;

    try {
      await prisma.$transaction(async (tx) => {
        // Lock the vehicle row using SELECT ... FOR UPDATE to serialize operations on this vehicle
        await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${vehicleId} FOR UPDATE`;

        // Perform the availability checks within the transaction
        const hasActiveBooking = isTestRideVehicle
          ? false
          : (await tx.booking.count({
              where: {
                vehicleId,
                status: "CONFIRMED",
                startDate: {
                  lte: new Date(endDate),
                },
                endDate: {
                  gte: new Date(startDate),
                },
              },
            })) > 0;

        if (hasActiveBooking) {
          conflictError = "This vehicle is already booked for the selected dates. Please select different dates or choose another ride.";
          throw new Error(conflictError);
        }

        const override = await getVehicleAvailabilityOverride(vehicleId);
        const availability = isTestRideVehicle ? "available" : resolveVehicleAvailability({ vehicleId, hasActiveBooking, override });
        if (availability !== "available") {
          conflictError = `Vehicle is ${availability}. Please choose another vehicle or different dates.`;
          throw new Error("AV_CONFLICT");
        }

        // Upsert user inside the transaction
        userResult = await tx.user.upsert({
          where: { email: effectiveEmail },
          update: {
            name: userName,
            ...(cleanPhone ? { phone: cleanPhone } : {}),
            timezone: timezone ?? "Asia/Kolkata",
          },
          create: {
            email: effectiveEmail,
            name: userName,
            phone: cleanPhone || null,
            role: "CUSTOMER",
            timezone: timezone ?? "Asia/Kolkata",
          },
        });

        // Compute price details (safe inside transaction since it's just JS calculations)
        units = useHourly
          ? calculateHours(startDate, endDate, startTime, endTime)
          : calculateDays(startDate, endDate);

        let vehicleCost = 0;
        if (useHourly) {
          const hourlyBaseCost = calculateHourlyBaseCost(vehicle, units);
          vehicleCost = hourlyBaseCost * qty;
        } else {
          const baseDailyCost = calculateDailyVehicleCost(vehicle, startDate, endDate);
          const effectiveDailyPrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
          let durationDiscount = 0;
          if (units >= durationDiscountMinDays) {
            durationDiscount = durationDiscountFreeDays * effectiveDailyPrice;
          }
          vehicleCost = (baseDailyCost - durationDiscount) * qty;
        }

        if (qty >= multiVehicleMinQty) {
          const bulkDiscount = Math.floor((vehicleCost * multiVehicleDiscountPercent) / 100);
          vehicleCost = vehicleCost - bulkDiscount;
        }

        const addOnTotal = getAddOnTotalForVehicle(addOnIds, useHourly, units, qty, vehicle);
        const deliveryFee = deliveryMode === "doorstep" && Number(deliveryFeeINR) > 0 ? Number(deliveryFeeINR) : 0;
        subtotalAmountINR = vehicleCost + addOnTotal + deliveryFee;

        const bookingCount = await tx.booking.count({ where: { userId: userResult.id } });
        promotionResult = await computePromotionBreakdown({
          userEmail,
          city,
          subtotalAmountINR,
          bookingCount,
          couponCode,
          referralCode,
        });
        totalAmountINR = promotionResult.payableAmountINR;

        const isOnlinePayment = Boolean(payload.paymentProvider === "payu" || payload.paymentProvider === "razorpay" || payload.paymentProvider === "stripe") && totalAmountINR > 0;
        const initialStatus = isOnlinePayment ? "PENDING" : "CONFIRMED";

        bookingResult = await tx.booking.create({
          data: {
            userId: userResult.id,
            vehicleId,
            cityName: city,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            totalAmountINR,
            currency: currency ?? "INR",
            timezone: timezone ?? "Asia/Kolkata",
            status: initialStatus,
            deliveryMode: deliveryMode === "doorstep" ? "doorstep" : "self_pickup",
            deliveryAddress: deliveryAddress ? String(deliveryAddress) : null,
            deliveryLandmark: deliveryLandmark ? String(deliveryLandmark) : null,
            deliveryLat: deliveryLat ? Number(deliveryLat) : null,
            deliveryLng: deliveryLng ? Number(deliveryLng) : null,
            deliveryFeeINR: deliveryFee,
            deliveryDistanceKm: deliveryDistanceKm ? Number(deliveryDistanceKm) : null,
          },
        });
      });
    } catch (e: any) {
      if (conflictError) {
        return NextResponse.json({ error: conflictError }, { status: 409 });
      }
      throw e;
    }

    const booking = bookingResult;
    const user = userResult;
    const promotion = promotionResult;
    const isOnlinePayment = Boolean(payload.paymentProvider === "payu" || payload.paymentProvider === "razorpay" || payload.paymentProvider === "stripe") && totalAmountINR > 0;

    const confirmMsg = `🚗 *NEXT GEAR RENTALS - BOOKING CONFIRMED* 📄\n\n` +
      `Hello *${userName || userEmail.split("@")[0]}*,\nYour booking has been placed successfully!\n\n` +
      `📌 *Booking ID:* ${booking.id}\n` +
      `🚘 *Vehicle:* ${vehicle.title}\n` +
      `📍 *City:* ${city}\n` +
      `🗓️ *Dates:* ${startDate} to ${endDate}\n\n` +
      `🧾 *E-RECEIPT BREAKDOWN*\n` +
      `▫️ Subtotal: ₹${subtotalAmountINR.toLocaleString("en-IN")}\n` +
      (promotion.couponDiscountINR ? `▫️ Coupon Discount: -₹${promotion.couponDiscountINR.toLocaleString("en-IN")}\n` : "") +
      (promotion.referralDiscountINR ? `▫️ Referral Discount: -₹${promotion.referralDiscountINR.toLocaleString("en-IN")}\n` : "") +
      `▫️ *Total Paid:* ₹${totalAmountINR.toLocaleString("en-IN")}\n\n` +
      `🎟️ *Download Booking Pass & e-Receipt:*\n${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app"}/api/bookings/${booking.id}/pass\n\n` +
      `Thank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
    // Non-blocking background notification pipeline for instant gateway redirect
    void (async () => {
      try {
        await saveBookingPromotion({
          bookingId: booking.id,
          userEmail,
          subtotalAmountINR,
          couponCode: promotion.couponCode,
          couponDiscountINR: promotion.couponDiscountINR,
          referralCode: promotion.referralCode,
          referralDiscountINR: promotion.referralDiscountINR,
          totalAmountINR,
        });

        await upsertBookingAlertProfile({
          userEmail,
          phone,
          preferredChannel: phone ? "whatsapp" : "email",
        });

        // ⚠️ CRITICAL: If this booking requires online payment gateway verification (PayU/Razorpay/Stripe),
        // DO NOT send confirmation emails, WhatsApp, or vendor notifications yet!
        // Those alerts will be triggered ONLY after payment gateway verifies success in the callback/webhook.
        if (isOnlinePayment) {
          return;
        }

      } catch (err) {
        console.error("[Booking Alert Profile Setup Error]", err);
      }

      // Send notifications to vendor and admin in background
      try {
        const vendor = await prisma.vendor.findFirst({
          where: {
            vehicles: {
              some: {
                id: vehicleId,
              },
            },
          },
          include: {
            ownerUser: true,
          },
        });

        if (vendor?.ownerUser) {
          await prisma.notification.create({
            data: {
              userId: vendor.ownerUser.id,
              bookingId: booking.id,
              title: "New Booking Received! 🎉",
              message: `${userName} booked ${vehicle.title} from ${startDate} to ${endDate}`,
              type: "booking",
            },
          });
        }

        const admin = await prisma.user.findFirst({
          where: { role: "ADMIN" },
        });

        if (admin) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              bookingId: booking.id,
              title: "New Booking - Admin Alert 📊",
              message: `${userName} booked ${vehicle.title} for ₹${totalAmountINR} in ${city}`,
              type: "booking",
            },
          });
        }

        const { dispatchTriPartyBookingAlerts } = await import("@/lib/booking-alerts");
        await dispatchTriPartyBookingAlerts(booking.id);
      } catch (notificationError) {
        console.error("Background notification error:", notificationError);
      }
    })();

    let payuCheckout = null;
    if (payload.paymentProvider === "payu") {
      const { getPayUConfig, generatePayUHash } = await import("@/lib/payu");
      const { key, mode, endpointUrl } = getPayUConfig();
      const txnid = `NG_PAYU_${booking.id.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;
      const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const reqProto = request.headers.get("x-forwarded-proto") || (reqHost?.includes("localhost") || reqHost?.includes("127.0.0.1") ? "http" : "https");
      const baseUrl = reqHost ? `${reqProto}://${reqHost}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      const surl = `${baseUrl}/api/payments/payu/response`;
      const furl = `${baseUrl}/api/payments/payu/response`;
      const payableAmt = payload.paymentOption === "full" ? totalAmountINR : calculateBookingAmount(totalAmountINR);
      const productinfo = vehicle.title.slice(0, 100);

      const hash = generatePayUHash({
        txnid,
        amount: payableAmt,
        productinfo,
        firstname: userName.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Rider",
        email: userEmail,
        phone: (phone || "9999999999").replace(/\D/g, "").slice(-10) || "9999999999",
        surl,
        furl,
        udf1: booking.id,
        udf2: "nextgear_web",
      });

      void prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: "payu",
          amountINR: payableAmt,
          currency: currency ?? "INR",
          status: "CREATED",
          providerPaymentId: txnid,
          metadataJson: JSON.stringify({
            provider: "payu",
            mode,
            txnid,
            amountINR: payableAmt,
            surl,
            furl,
          }),
        },
      }).catch(console.error);

      payuCheckout = {
        actionUrl: endpointUrl,
        payuParams: {
          key,
          txnid,
          amount: Number(payableAmt).toFixed(2),
          productinfo,
          firstname: userName.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Rider",
          email: userEmail,
          phone: (phone || "9999999999").replace(/\D/g, "").slice(-10) || "9999999999",
          surl,
          furl,
          hash,
          udf1: booking.id,
          udf2: "nextgear_web",
          service_provider: "payu_paisa",
        },
      };
    }

    return NextResponse.json(
      {
        booking: {
          subtotalAmountINR,
          couponCode: promotion.couponCode,
          couponDiscountINR: promotion.couponDiscountINR,
          referralCode: promotion.referralCode,
          referralDiscountINR: promotion.referralDiscountINR,
          promoMessages: promotion.messages,
          id: booking.id,
          vehicleId: booking.vehicleId,
          userName,
          userEmail,
          city: booking.cityName,
          startDate: booking.startDate.toISOString().slice(0, 10),
          endDate: booking.endDate.toISOString().slice(0, 10),
          startTime: startTime ?? undefined,
          endTime: endTime ?? undefined,
          rentalHours: useHourly ? units : undefined,
          addons: addOnIds,
          totalAmountINR: booking.totalAmountINR,
          currency: booking.currency,
          status: normalizeStatus(booking.status),
          createdAt: booking.createdAt.toISOString(),
          timezone: booking.timezone,
        },
        payuCheckout,
      },
      { status: 201 },
    );
  }

  const vehicle = vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const hasActiveBooking = bookingsStore.some(
    (entry) =>
      entry.vehicleId === vehicleId &&
      entry.status === "confirmed" &&
      entry.endDate >= new Date().toISOString().slice(0, 10),
  );
  const availability = resolveVehicleAvailability({ vehicleId, hasActiveBooking });
  if (availability !== "available") {
    return NextResponse.json({ error: `Vehicle is ${availability}. Please choose another vehicle.` }, { status: 409 });
  }

  if (useHourly && startTime && endTime) {
    const hasAvailability = getHourlyAvailability(vehicle, startDate, startTime, endTime);
    if (!hasAvailability) {
      return NextResponse.json({ error: "Selected time slots are unavailable" }, { status: 409 });
    }
  }

  const units = useHourly
    ? calculateHours(startDate, endDate, startTime, endTime)
    : calculateDays(startDate, endDate);

  let vehicleCost = 0;
  if (useHourly) {
    const hourlyBaseCost = calculateHourlyBaseCost(vehicle, units);
    vehicleCost = hourlyBaseCost * qty;
  } else {
    const baseDailyCost = calculateDailyVehicleCost(vehicle, startDate, endDate);
    const effectiveDailyPrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
    let durationDiscount = 0;
    if (units >= durationDiscountMinDays) {
      durationDiscount = durationDiscountFreeDays * effectiveDailyPrice;
    }
    vehicleCost = (baseDailyCost - durationDiscount) * qty;
  }

  // Bulk Booking Quantity discount calculation
  if (qty >= multiVehicleMinQty) {
    const bulkDiscount = Math.floor((vehicleCost * multiVehicleDiscountPercent) / 100);
    vehicleCost = vehicleCost - bulkDiscount;
  }

  const addOnTotal = getAddOnTotalForVehicle(addOnIds, useHourly, units, qty, vehicle);
  const subtotalAmountINR = vehicleCost + addOnTotal;
  const bookingCount = bookingsStore.filter((entry) => entry.userEmail.toLowerCase() === userEmail.toLowerCase()).length;
  const promotion = await computePromotionBreakdown({
    userEmail,
    city,
    subtotalAmountINR,
    bookingCount,
    couponCode,
    referralCode,
  });
  const totalAmountINR = promotion.payableAmountINR;

  const booking = {
    subtotalAmountINR,
    couponCode: promotion.couponCode,
    couponDiscountINR: promotion.couponDiscountINR,
    referralCode: promotion.referralCode,
    referralDiscountINR: promotion.referralDiscountINR,
    promoMessages: promotion.messages,
    id: `bk-${bookingsStore.length + 1}`,
    vehicleId,
    userName,
    userEmail,
    city,
    startDate,
    endDate,
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
    rentalHours: useHourly ? units : undefined,
    addons: addOnIds,
    totalAmountINR,
    currency: currency ?? "INR",
    status: "confirmed" as const,
    createdAt: new Date().toISOString(),
    timezone: timezone ?? "Asia/Kolkata",
    quantity: qty,
  };

  bookingsStore.unshift(booking);

  await saveBookingPromotion({
    bookingId: booking.id,
    userEmail,
    subtotalAmountINR,
    couponCode: promotion.couponCode,
    couponDiscountINR: promotion.couponDiscountINR,
    referralCode: promotion.referralCode,
    referralDiscountINR: promotion.referralDiscountINR,
    totalAmountINR,
  });

  await upsertBookingAlertProfile({
    userEmail,
    phone,
    preferredChannel: phone ? "whatsapp" : "email",
  });

  const passUrl = `/api/bookings/${booking.id}/pass`;
  const confirmMsg = `🚗 *NEXT GEAR RENTALS - BOOKING CONFIRMED* 📄\n\n` +
    `Hello *${userName}*,\nYour booking has been placed successfully!\n\n` +
    `📌 *Booking ID:* ${booking.id}\n` +
    `🚘 *Vehicle:* ${vehicle.title}\n` +
    `📍 *City:* ${city}\n` +
    `🗓️ *Dates:* ${startDate} to ${endDate}\n\n` +
    `🧾 *E-RECEIPT BREAKDOWN*\n` +
    `▫️ Subtotal: ₹${subtotalAmountINR.toLocaleString("en-IN")}\n` +
    (promotion.couponDiscountINR ? `▫️ Coupon Discount: -₹${promotion.couponDiscountINR.toLocaleString("en-IN")}\n` : "") +
    (promotion.referralDiscountINR ? `▫️ Referral Discount: -₹${promotion.referralDiscountINR.toLocaleString("en-IN")}\n` : "") +
    `▫️ *Total Payable:* ₹${totalAmountINR.toLocaleString("en-IN")}\n\n` +
    `🎟️ *Download Booking Pass & e-Receipt:*\n${passUrl}\n\n` +
    `Thank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

  // Non-blocking background notification pipeline for instant gateway redirect
  void (async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
    try {
      const { generateBookingConfirmationEmailHtml } = await import("@/lib/email-templates");
      const { dispatchHtmlEmail } = await import("@/lib/alert-dispatch");
      const { generateBookingReceiptPdfBuffer } = await import("@/lib/pdf-generator");

      const emailHtml = generateBookingConfirmationEmailHtml({
        bookingId: booking.id,
        customerName: userName || userEmail.split("@")[0],
        vehicleTitle: vehicle.title,
        vehicleType: vehicle.type,
        vehicleImage: vehicle.imageUrls?.[0] || "",
        cityName: city,
        startDate: `${startDate}${startTime ? ` ${startTime}` : ""}`,
        endDate: `${endDate}${endTime ? ` ${endTime}` : ""}`,
        totalAmountINR,
        subtotalAmountINR,
        discountINR: (subtotalAmountINR - totalAmountINR) > 0 ? (subtotalAmountINR - totalAmountINR) : 0,
        baseUrl,
      });

      let pdfBuffer: Buffer | undefined;
      try {
        pdfBuffer = await generateBookingReceiptPdfBuffer({
          bookingId: booking.id,
          customerName: userName || userEmail.split("@")[0],
          customerPhone: phone,
          vehicleTitle: vehicle.title,
          vehicleType: vehicle.type,
          vehicleImage: vehicle.imageUrls?.[0] || "",
          cityName: city,
          startDate: `${startDate}${startTime ? ` ${startTime}` : ""}`,
          endDate: `${endDate}${endTime ? ` ${endTime}` : ""}`,
          totalAmountINR,
          subtotalAmountINR,
          discountINR: (subtotalAmountINR - totalAmountINR) > 0 ? (subtotalAmountINR - totalAmountINR) : 0,
        });
      } catch (pdfErr) {
        console.error("[PDF Generation Error]", pdfErr);
      }

      await dispatchHtmlEmail({
        to: userEmail,
        subject: `🚗 Booking Confirmed #${booking.id} - ${vehicle.title}`,
        html: emailHtml,
        attachments: pdfBuffer
          ? [
              {
                filename: `NextGear-Booking-Receipt-${booking.id}.pdf`,
                content: pdfBuffer,
              },
            ]
          : undefined,
      });
    } catch (err) {
      console.error("[Booking Confirmation In-Memory HTML Email Error]", err);
    }

    try {
      if (phone) {
        void sendWhatsAppBookingReceipt({
          bookingId: booking.id,
          customerName: userName,
          customerPhone: phone,
          vehicleTitle: vehicle.title,
          cityName: city,
          startDate: `${startDate}${startTime ? ` ${startTime}` : ""}`,
          endDate: `${endDate}${endTime ? ` ${endTime}` : ""}`,
          totalAmountINR,
          subtotalAmountINR,
          discountINR: (subtotalAmountINR - totalAmountINR) > 0 ? (subtotalAmountINR - totalAmountINR) : 0,
          passUrl,
        });
      }

      const { sendVendorBookingNotification } = await import("@/lib/whatsapp-service");
      void sendVendorBookingNotification({
        bookingId: booking.id,
        customerName: userName || userEmail.split("@")[0],
        customerPhone: phone,
        vehicleTitle: vehicle.title,
        cityName: city,
        startDate: `${startDate}${startTime ? ` ${startTime}` : ""}`,
        endDate: `${endDate}${endTime ? ` ${endTime}` : ""}`,
        totalAmountINR,
      });
    } catch (vErr) {
      console.error("[Vendor WhatsApp Alert Fallback Error]", vErr);
    }
  })();

  return NextResponse.json({ booking }, { status: 201 });
}