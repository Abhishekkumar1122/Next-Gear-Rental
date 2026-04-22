import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LATE_FEE_PER_DAY = 500; // ₹500 per day late fee

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // Fetch booking and related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        damageCharges: { where: { isApproved: true } },
        rentalSettlement: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If settlement already exists, return it
    if (booking.rentalSettlement) {
      return NextResponse.json({
        success: false,
        message: "Settlement already processed",
        settlement: booking.rentalSettlement,
      });
    }

    // Calculate late fees
    const now = new Date();
    const endDate = new Date(booking.endDate);
    const daysLate = Math.max(
      0,
      Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const lateFeeCharges = daysLate > 0 ? daysLate * LATE_FEE_PER_DAY : 0;

    // Calculate damage charges total
    const totalDamageCharges = booking.damageCharges.reduce(
      (sum, charge) => sum + (charge.approvedAmount || charge.estimatedAmount),
      0
    );

    // Calculate total deductions and refund
    const totalDeductions =
      totalDamageCharges + lateFeeCharges;
    const refundAmount = Math.max(0, booking.totalAmountINR - totalDeductions);

    // Create settlement record
    const settlement = await prisma.rentalSettlement.create({
      data: {
        bookingId,
        originalAmount: booking.totalAmountINR,
        totalDamageCharges,
        lateFeeCharges,
        totalDeductions,
        refundAmount,
        settlementStatus: "PROCESSED",
        settledAt: new Date(),
        settlementNotes: `Late fees: ₹${lateFeeCharges} (${daysLate} days). Damage charges: ₹${totalDamageCharges}`,
      },
    });

    // Update booking status to COMPLETED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    });

    // Update return request status
    await prisma.returnRequest.updateMany({
      where: { bookingId },
      data: { status: "SETTLED" },
    });

    // Log alert
    await prisma.bookingAlertLog.create({
      data: {
        bookingId,
        alertType: "settlement_complete",
        message: `Rental settlement complete. Refund: ₹${refundAmount} (Deductions: ₹${totalDeductions})`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        settlement,
        refundDetails: {
          originalAmount: booking.totalAmountINR,
          damageCharges: totalDamageCharges,
          lateFeeCharges,
          totalDeductions,
          refundAmount,
          daysLate,
        },
        message: "Settlement processed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Settlement error:", error);
    return NextResponse.json(
      { error: "Failed to process settlement" },
      { status: 500 }
    );
  }
}

// GET settlement details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const settlement = await prisma.rentalSettlement.findUnique({
      where: { bookingId },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "No settlement found" },
        { status: 404 }
      );
    }

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Get settlement error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlement" },
      { status: 500 }
    );
  }
}
