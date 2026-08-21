import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateBookingAmount } from "@/lib/pricing-tiers";
import { getServerSessionUser } from "@/lib/server-session";
import { resolveVendorContext } from "@/lib/vendor-fleet";
import { bookingsStore } from "@/lib/store";
import { vehicles as mockVehicles, vendors as mockVendors } from "@/lib/mock-data";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const handoverSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["release", "return"]),
  odometer: z.number().optional(),
  fuel: z.string().optional(),
  photos: z.array(z.string()).optional(),
  confirmExtraPayment: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const user = await getServerSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // Admin bypasses all vendor ownership checks
    const isAdmin = user.role === "ADMIN";
    let vendorContext: any = null;

    if (!isAdmin) {
      if (user.role !== "VENDOR") {
        return NextResponse.json(
          { error: "Access denied. Only vendors or administrators can scan handover QRs." },
          { status: 403 }
        );
      }
      vendorContext = await resolveVendorContext(user);
      if (!vendorContext) {
        return NextResponse.json({ error: "Vendor context not found." }, { status: 403 });
      }
    }

    let bookingData: any = null;

    if (hasDatabase) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            include: {
              vendor: true,
            },
          },
          user: true,
          payments: {
            where: {
              status: "PAID",
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // Check vendor ownership
      if (!isAdmin && booking.vehicle.vendorId !== vendorContext.id) {
        const ownerName = booking.vehicle.vendor?.businessName ?? "another vendor partner";
        return NextResponse.json(
          { 
            success: false, 
            isUnauthorizedVendor: true,
            ownerVendorName: ownerName,
            vehicleTitle: booking.vehicle.title,
            bookingId: booking.id,
            error: `NOT AUTHORIZED VENDOR: This booking belongs to ${ownerName}. You do not have permission to verify or release this vehicle.` 
          }, 
          { status: 403 }
        );
      }

      bookingData = {
        id: booking.id,
        status: booking.status,
        handoverStatus: booking.handoverStatus,
        cityName: booking.cityName,
        startDate: booking.startDate.toISOString().slice(0, 10),
        endDate: booking.endDate.toISOString().slice(0, 10),
        totalAmountINR: booking.totalAmountINR,
        customerName: booking.user.name,
        customerEmail: booking.user.email,
        customerPhone: booking.user.phone || booking.user.email?.split("@")[0],
        vehicleTitle: booking.vehicle.title,
        vehicleStatus: booking.vehicle.operationalStatus,
        startOdometer: booking.startOdometer,
        endOdometer: booking.endOdometer,
        startFuel: booking.startFuel,
        endFuel: booking.endFuel,
        startPhotos: booking.startPhotos,
        endPhotos: booking.endPhotos,
        amountPaid: booking.payments.reduce((sum: number, p: any) => sum + p.amountINR, 0),
        balanceDue: Math.max(0, booking.totalAmountINR - booking.payments.reduce((sum: number, p: any) => sum + p.amountINR, 0)),
      };
    } else {
      // Mock fallback
      const booking = bookingsStore.find((b) => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const vehicle = mockVehicles.find((v) => v.id === booking.vehicleId);
      if (!vehicle) {
        return NextResponse.json({ error: "Associated vehicle not found" }, { status: 404 });
      }

      const associatedVendor = mockVendors.find((v) => v.id === vehicle.vendorId);

      // Check mock vendor ownership
      if (!isAdmin && vehicle.vendorId !== vendorContext.id) {
        const ownerName = associatedVendor?.businessName ?? "another vendor partner";
        return NextResponse.json(
          { 
            success: false, 
            isUnauthorizedVendor: true,
            ownerVendorName: ownerName,
            vehicleTitle: vehicle.title,
            bookingId: booking.id,
            error: `NOT AUTHORIZED VENDOR: This booking belongs to ${ownerName}. You do not have permission to verify or release this vehicle.` 
          }, 
          { status: 403 }
        );
      }

      bookingData = {
        id: booking.id,
        status: booking.status,
        handoverStatus: booking.handoverStatus ?? "PENDING",
        cityName: booking.city,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmountINR: booking.totalAmountINR,
        customerName: booking.userName,
        customerEmail: booking.userEmail,
        customerPhone: "9876543210",
        vehicleTitle: vehicle.title,
        vehicleStatus: vehicle.operationalStatus,
        startOdometer: null,
        endOdometer: null,
        startFuel: null,
        endFuel: null,
        startPhotos: [],
        endPhotos: [],
        extraChargesPaid: false,
        extraChargesAmount: 0,
        amountPaid: (booking as any).amountPaid ?? calculateBookingAmount(booking.totalAmountINR),
        balanceDue: Math.max(0, booking.totalAmountINR - ((booking as any).amountPaid ?? calculateBookingAmount(booking.totalAmountINR))),
      };
    }

    return NextResponse.json({
      success: true,
      booking: bookingData,
    });
  } catch (error) {
    console.error("Handover GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = handoverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { bookingId, action, odometer, fuel, photos, confirmExtraPayment } = parsed.data;

    const user = await getServerSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const isAdmin = user.role === "ADMIN";
    let vendorContext: any = null;

    if (!isAdmin) {
      if (user.role !== "VENDOR") {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
      vendorContext = await resolveVendorContext(user);
      if (!vendorContext) {
        return NextResponse.json({ error: "Vendor context not found." }, { status: 403 });
      }
    }

    if (hasDatabase) {
      // Fetch booking
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { vehicle: { include: { vendor: true } } },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // Check vendor ownership
      if (!isAdmin && booking.vehicle.vendorId !== vendorContext.id) {
        const ownerName = booking.vehicle.vendor?.businessName ?? "another vendor partner";
        return NextResponse.json(
          { error: `This booking belongs to another vendor (${ownerName}). You do not have permission to modify it.` },
          { status: 403 }
        );
      }

      const statusUpper = booking.status.toUpperCase();
      if (statusUpper === "CANCELLED") {
        return NextResponse.json(
          { error: "This booking has been cancelled. Handover is rejected." },
          { status: 400 }
        );
      }

      if (statusUpper === "COMPLETED") {
        return NextResponse.json(
          { error: "This booking is already completed." },
          { status: 400 }
        );
      }

      if (action === "release" && booking.handoverStatus === "RELEASED") {
        return NextResponse.json(
          { error: "This vehicle has already been released." },
          { status: 400 }
        );
      }

      if (action === "return" && booking.handoverStatus === "RETURNED") {
        return NextResponse.json(
          { error: "This vehicle has already been returned." },
          { status: 400 }
        );
      }

      if (action === "return" && booking.handoverStatus !== "RELEASED") {
        return NextResponse.json(
          { error: "This vehicle cannot be returned because it has not been released yet." },
          { status: 400 }
        );
      }

      if (action === "release") {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: {
              handoverStatus: "RELEASED",
              startOdometer: odometer ?? null,
              startFuel: fuel ?? null,
              startPhotos: photos ?? [],
            },
          }),
          prisma.vehicle.update({
            where: { id: booking.vehicleId },
            data: { operationalStatus: "UNAVAILABLE" },
          }),
        ]);

        const updatedBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { vehicle: true },
        });

        return NextResponse.json({
          success: true,
          booking: {
            id: updatedBooking?.id,
            status: updatedBooking?.status,
            handoverStatus: updatedBooking?.handoverStatus,
            vehicleTitle: updatedBooking?.vehicle.title,
            vehicleStatus: updatedBooking?.vehicle.operationalStatus,
          },
        });
      } else {
        // Return: Calculate extra charges if applicable
        let extraKm = 0;
        let extraKmCharge = 0;
        let extraHours = 0;
        let extraHoursCharge = 0;

        if (booking.startOdometer !== null && odometer !== undefined) {
          const actualKm = Math.max(0, odometer - booking.startOdometer);
          const durationDays = Math.ceil(
            (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) || 1;
          const allowedKm = durationDays * 150;
          extraKm = Math.max(0, actualKm - allowedKm);
          extraKmCharge = extraKm * 10;
        }

        const now = new Date();
        if (now.getTime() > booking.endDate.getTime()) {
          const extraMs = now.getTime() - booking.endDate.getTime();
          extraHours = Math.ceil(extraMs / (1000 * 60 * 60));
          extraHoursCharge = extraHours * 150;
        }

        const totalExtraCharge = extraKmCharge + extraHoursCharge;

        if (totalExtraCharge > 0 && !confirmExtraPayment) {
          return NextResponse.json({
            success: false,
            requiresExtraPayment: true,
            extraChargesAmount: totalExtraCharge,
            extraKm,
            extraKmCharge,
            extraHours,
            extraHoursCharge,
          });
        }

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: {
              handoverStatus: "RETURNED",
              status: "COMPLETED",
              endOdometer: odometer ?? null,
              endFuel: fuel ?? null,
              endPhotos: photos ?? [],
              extraChargesAmount: totalExtraCharge,
              extraChargesPaid: totalExtraCharge > 0,
            },
          }),
          prisma.vehicle.update({
            where: { id: booking.vehicleId },
            data: { operationalStatus: "AVAILABLE" },
          }),
        ]);

        const updatedBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { vehicle: true },
        });

        return NextResponse.json({
          success: true,
          booking: {
            id: updatedBooking?.id,
            status: updatedBooking?.status,
            handoverStatus: updatedBooking?.handoverStatus,
            vehicleTitle: updatedBooking?.vehicle.title,
            vehicleStatus: updatedBooking?.vehicle.operationalStatus,
            extraChargesAmount: updatedBooking?.extraChargesAmount,
            extraChargesPaid: updatedBooking?.extraChargesPaid,
          },
        });
      }
    } else {
      // Mock Fallback POST handler
      const booking = bookingsStore.find((b) => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      const vehicle = mockVehicles.find((v) => v.id === booking.vehicleId);
      if (!vehicle) {
        return NextResponse.json({ error: "Associated vehicle not found" }, { status: 404 });
      }

      // Check mock vendor ownership
      if (!isAdmin && vehicle.vendorId !== vendorContext.id) {
        const associatedVendor = mockVendors.find((v) => v.id === vehicle.vendorId);
        const ownerName = associatedVendor?.businessName ?? "another vendor partner";
        return NextResponse.json(
          { error: `This booking belongs to another vendor (${ownerName}). You do not have permission to modify it.` },
          { status: 403 }
        );
      }

      const statusUpper = booking.status.toUpperCase();
      if (statusUpper === "CANCELLED") {
        return NextResponse.json(
          { error: "This booking has been cancelled. Handover is rejected." },
          { status: 400 }
        );
      }

      if (statusUpper === "COMPLETED") {
        return NextResponse.json(
          { error: "This booking is already completed." },
          { status: 400 }
        );
      }

      if (action === "release" && booking.handoverStatus === "RELEASED") {
        return NextResponse.json(
          { error: "This vehicle has already been released." },
          { status: 400 }
        );
      }

      if (action === "return" && booking.handoverStatus === "RETURNED") {
        return NextResponse.json(
          { error: "This vehicle has already been returned." },
          { status: 400 }
        );
      }

      if (action === "return" && booking.handoverStatus !== "RELEASED") {
        return NextResponse.json(
          { error: "This vehicle cannot be returned because it has not been released yet." },
          { status: 400 }
        );
      }

      if (action === "release") {
        booking.handoverStatus = "RELEASED";
        vehicle.operationalStatus = "UNAVAILABLE" as any;
      } else {
        booking.handoverStatus = "RETURNED";
        booking.status = "COMPLETED" as any;
        vehicle.operationalStatus = "AVAILABLE" as any;
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
          handoverStatus: booking.handoverStatus,
          vehicleTitle: vehicle.title,
          vehicleStatus: vehicle.operationalStatus,
        },
      });
    }
  } catch (error) {
    console.error("Handover API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
