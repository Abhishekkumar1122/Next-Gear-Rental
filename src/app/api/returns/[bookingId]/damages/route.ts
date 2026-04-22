import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // Fetch all damage charges for this booking
    const charges = await prisma.damageCharge.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        charges,
        total: charges.length,
        totalCost: charges.reduce((sum, c) => sum + c.estimatedAmount, 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching damage charges:", error);
    return NextResponse.json(
      { error: "Failed to fetch damage charges" },
      { status: 500 }
    );
  }
}
