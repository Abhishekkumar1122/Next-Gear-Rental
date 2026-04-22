import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, userEmail } = await request.json();

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user.email !== userEmail) {
      return NextResponse.json(
        { error: "Unauthorized: Booking does not belong to user" },
        { status: 403 }
      );
    }

    // Check if return already initiated
    const existingReturn = await prisma.returnRequest.findUnique({
      where: { bookingId },
    });

    if (existingReturn) {
      return NextResponse.json(
        { error: "Return already initiated for this booking" },
        { status: 400 }
      );
    }

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        bookingId,
        status: "INITIATED",
      },
    });

    // Log alert
    await prisma.bookingAlertLog.create({
      data: {
        bookingId,
        alertType: "return_initiated",
        message: `Customer initiated return request`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        returnRequest,
        message: "Return initiated successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Return initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate return" },
      { status: 500 }
    );
  }
}
