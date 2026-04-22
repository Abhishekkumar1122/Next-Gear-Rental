import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const inspectionData = await request.json();

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create or update vendor inspection
    const inspection = await prisma.vendorInspection.upsert({
      where: { bookingId },
      create: {
        bookingId,
        status: "IN_PROGRESS",
        ...inspectionData,
        inspectAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        ...inspectionData,
        inspectAt: new Date(),
      },
    });

    // Calculate damage severity and auto-create charges if needed
    const damageCharges = [];

    // Check body condition
    if (inspectionData.bodyCondition === "damaged") {
      damageCharges.push({
        bookingId,
        chargeType: "body_damage",
        description: "Vehicle body damage detected during inspection",
        severityLevel: "moderate",
        estimatedAmount: 5000,
      });
    }

    // Check engine condition
    if (inspectionData.engineCondition === "damaged") {
      damageCharges.push({
        bookingId,
        chargeType: "engine_damage",
        description: "Vehicle engine damage detected during inspection",
        severityLevel: "severe",
        estimatedAmount: 15000,
      });
    }

    // Check tires condition
    if (inspectionData.tiresCondition === "damaged") {
      damageCharges.push({
        bookingId,
        chargeType: "tire_damage",
        description: "Vehicle tire damage detected during inspection",
        severityLevel: "moderate",
        estimatedAmount: 3000,
      });
    }

    // Check interior condition
    if (
      inspectionData.interiorCondition === "damaged" ||
      inspectionData.interiorCondition === "soiled"
    ) {
      damageCharges.push({
        bookingId,
        chargeType: "interior_damage",
        description: "Vehicle interior damage or soiling detected",
        severityLevel: "moderate",
        estimatedAmount: 4000,
      });
    }

    // Create damage charges
    for (const charge of damageCharges) {
      await prisma.damageCharge.create({ data: charge });
    }

    // Update return request status
    await prisma.returnRequest.updateMany({
      where: { bookingId },
      data: {
        status: "VENDOR_INSPECTED",
      },
    });

    // Log alert
    await prisma.bookingAlertLog.create({
      data: {
        bookingId,
        alertType: "inspection_completed",
        message: `Vendor inspection completed. ${damageCharges.length} damage charge(s) identified.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        inspection,
        damageChargesCreated: damageCharges.length,
        message: "Inspection submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vendor inspection error:", error);
    return NextResponse.json(
      { error: "Failed to submit inspection" },
      { status: 500 }
    );
  }
}

// GET inspection details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const inspection = await prisma.vendorInspection.findUnique({
      where: { bookingId },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "No inspection found" },
        { status: 404 }
      );
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Get inspection error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspection" },
      { status: 500 }
    );
  }
}
