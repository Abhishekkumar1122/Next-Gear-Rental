import { bookingAddOns, calculateDays, calculateHours, getHourlyRate } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { getVehicleAvailabilityOverride } from "@/lib/vehicle-availability-db";
import { resolveVehicleAvailability } from "@/lib/vehicle-availability";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { computePromotionBreakdown, getBookingPromotionsByBookingIds, saveBookingPromotion } from "@/lib/promotions";
import { sendBookingAlert, upsertBookingAlertProfile } from "@/lib/booking-alerts";
import { vehicles } from "@/lib/mock-data";
import { BookingAddOnId, BookingStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

function normalizeStatus(status: string): BookingStatus {
  if (status.toUpperCase() === "CANCELLED") return "cancelled";
  if (status.toUpperCase() === "COMPLETED") return "completed";
  return "confirmed";
}

function getAddOnTotal(addons: BookingAddOnId[], useHourly: boolean, units: number) {
  return addons.reduce((total, addOnId) => {
    const addOn = bookingAddOns.find((item) => item.id === addOnId);
    if (!addOn) return total;
    const rate = useHourly ? addOn.pricePerHourINR : addOn.pricePerDayINR;
    return total + rate * units;
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
  const email = request.nextUrl.searchParams.get("email");

  if (process.env.DATABASE_URL) {
    const bookings = await prisma.booking.findMany({
      where: email
        ? {
            user: {
              email,
            },
          }
        : undefined,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const promotionMap = await getBookingPromotionsByBookingIds(bookings.map((booking) => booking.id));

    return NextResponse.json({
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
        userName: booking.user.name,
        userEmail: booking.user.email,
        city: booking.cityName,
        startDate: booking.startDate.toISOString().slice(0, 10),
        endDate: booking.endDate.toISOString().slice(0, 10),
        totalAmountINR: booking.totalAmountINR,
        currency: booking.currency,
        status: normalizeStatus(booking.status),
        createdAt: booking.createdAt.toISOString(),
        timezone: booking.timezone,
      })),
    });
  }

  const promotionMap = await getBookingPromotionsByBookingIds(bookingsStore.map((booking) => booking.id));

  const bookings = email
    ? bookingsStore.filter((booking) => booking.userEmail.toLowerCase() === email.toLowerCase()).map((booking) => ({
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

  return NextResponse.json({ bookings });
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
  } = payload;

  if (!vehicleId || !userName || !userEmail || !city || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const addOnIds = Array.isArray(addons) ? (addons as BookingAddOnId[]) : [];
  const useHourly = Boolean(startTime && endTime && startDate && endDate && startDate === endDate);

  if (process.env.DATABASE_URL) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const hasActiveBooking =
      (await prisma.booking.count({
        where: {
          vehicleId,
          status: "CONFIRMED",
          endDate: {
            gte: new Date(),
          },
        },
      })) > 0;

    const override = await getVehicleAvailabilityOverride(vehicleId);
    const availability = resolveVehicleAvailability({ vehicleId, hasActiveBooking, override });
    if (availability !== "available") {
      return NextResponse.json({ error: `Vehicle is ${availability}. Please choose another vehicle.` }, { status: 409 });
    }

    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: userName,
      },
      create: {
        name: userName,
        email: userEmail,
        role: "CUSTOMER",
      },
    });

    const units = useHourly
      ? calculateHours(startDate, endDate, startTime, endTime)
      : calculateDays(startDate, endDate);
    const effectiveDailyPrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
    const baseRate = useHourly ? getHourlyRate(effectiveDailyPrice) : effectiveDailyPrice;
    const addOnTotal = getAddOnTotal(addOnIds, useHourly, units);
    const subtotalAmountINR = baseRate * units + addOnTotal;

    const bookingCount = await prisma.booking.count({ where: { userId: user.id } });
    const promotion = await computePromotionBreakdown({
      userEmail,
      city,
      subtotalAmountINR,
      bookingCount,
      couponCode,
      referralCode,
    });
    const totalAmountINR = promotion.payableAmountINR;

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        vehicleId,
        cityName: city,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmountINR,
        currency: currency ?? "INR",
        timezone: timezone ?? "Asia/Kolkata",
        status: "CONFIRMED",
      },
    });

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

    await sendBookingAlert({
      bookingId: booking.id,
      userEmail,
      eventType: "booking_confirmed",
      phone,
      message: `Booking ${booking.id} confirmed for ${city}. Pickup date: ${startDate}.`,
      dedupeKey: `booking-confirmed-${booking.id}`,
    });

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
  const effectiveDailyPrice = getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR);
  const baseRate = useHourly ? getHourlyRate(effectiveDailyPrice) : effectiveDailyPrice;
  const addOnTotal = getAddOnTotal(addOnIds, useHourly, units);
  const subtotalAmountINR = baseRate * units + addOnTotal;
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

  await sendBookingAlert({
    bookingId: booking.id,
    userEmail,
    eventType: "booking_confirmed",
    phone,
    message: `Booking ${booking.id} confirmed for ${city}. Pickup date: ${startDate}.`,
    dedupeKey: `booking-confirmed-${booking.id}`,
  });

  return NextResponse.json({ booking }, { status: 201 });
}