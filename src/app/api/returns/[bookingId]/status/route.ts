import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // Fetch return request with booking
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { bookingId },
      include: {
        booking: {
          select: { id: true, endDate: true },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }

    // Fetch vendor inspection
    const inspection = await prisma.vendorInspection.findUnique({
      where: { bookingId },
    });

    // Fetch rental settlement to get settledAt date
    const settlement = await prisma.rentalSettlement.findUnique({
      where: { bookingId },
    });

    // Fetch damage charges
    const damages = await prisma.damageCharge.findMany({
      where: { bookingId },
    });

    const estimatedCharges = damages.reduce((sum, d) => sum + d.estimatedAmount, 0);

    return NextResponse.json(
      {
        returnId: returnRequest.id,
        status: returnRequest.status,
        createdAt: returnRequest.createdAt,
        approvedAt: returnRequest.approvedAt,
        inspectionCompletedAt: inspection?.createdAt,
        settledAt: settlement?.settledAt,
        vehicleCondition: inspection ? {
          fuelLevel: inspection.fuelLevel,
          odometerReading: inspection.odometerReading,
          conditions: `Body: ${inspection.bodyCondition}, Engine: ${inspection.engineCondition}, Tires: ${inspection.tiresCondition}, Interior: ${inspection.interiorCondition}`,
        } : null,
        damageCount: damages.length,
        estimatedCharges,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching return status:", error);
    return NextResponse.json(
      { error: "Failed to fetch return status" },
      { status: 500 }
    );
  }
}
