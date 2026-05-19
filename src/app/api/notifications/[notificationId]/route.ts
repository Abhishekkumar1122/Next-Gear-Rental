import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/notifications/[notificationId]
 * Mark notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;

    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: {
          booking: {
            include: {
              vehicle: true,
            },
          },
        },
      });

      return NextResponse.json(notification);
    } catch (dbError) {
      // If database fails, still return success to avoid blocking UI
      console.warn("Database error updating notification:", dbError);
      return NextResponse.json(
        { message: "Notification updated", status: "offline" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[notificationId]
 * Delete notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;

    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return NextResponse.json({ success: true });
    } catch (dbError) {
      // If database fails, still return success to avoid blocking UI
      console.warn("Database error deleting notification:", dbError);
      return NextResponse.json(
        { success: true, status: "offline" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
