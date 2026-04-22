import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ damageChargeId: string }> }
) {
  try {
    const { damageChargeId } = await params;
    const body = await request.json();
    const { approvalStatus, approvedAmount } = body;

    // Validate status
    if (!["APPROVED", "REJECTED"].includes(approvalStatus)) {
      return NextResponse.json(
        { error: "Invalid approval status" },
        { status: 400 }
      );
    }

    // Update damage charge
    const updated = await prisma.damageCharge.update({
      where: { id: damageChargeId },
      data: {
        isApproved: approvalStatus === "APPROVED",
        approvedAmount: approvedAmount || undefined,
        approvalNotes: body.notes || undefined,
        updatedAt: new Date(),
      },
    });

    // Log to alert system if approved
    if (approvalStatus === "APPROVED" && updated.bookingId) {
      await prisma.bookingAlertLog.create({
        data: {
          bookingId: updated.bookingId,
          alertType: "DAMAGE_CHARGE_APPROVED",
          message: `Damage charge (${updated.description}) approved: ₹${updated.approvedAmount || updated.estimatedAmount}`,
        },
      });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating damage charge:", error);
    return NextResponse.json(
      { error: "Failed to update damage charge" },
      { status: 500 }
    );
  }
}
