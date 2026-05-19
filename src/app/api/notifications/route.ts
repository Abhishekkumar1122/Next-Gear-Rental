import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/notifications
 * Fetch notifications for authenticated user
 * Query params:
 *   - userId: string (required) - User ID to fetch notifications for
 *   - limit: number (optional) - Max notifications to return (default: 20)
 *   - isRead: boolean (optional) - Filter by read status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
    const isReadParam = request.nextUrl.searchParams.get("isRead");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const whereCondition: any = { userId };

    if (isReadParam !== null) {
      whereCondition.isRead = isReadParam === "true";
    }

    let notifications: any[] = [];
    let unreadCount = 0;

    try {
      notifications = await prisma.notification.findMany({
        where: whereCondition,
        include: {
          booking: {
            include: {
              vehicle: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      // Count unread notifications
      unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (dbError) {
      // If database fails, return empty notifications gracefully
      console.warn("Database error fetching notifications:", dbError);
      // Return empty notifications instead of failing - UI will handle gracefully
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        status: "offline",
      });
    }

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create a new notification (internal, called by booking system)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, bookingId, title, message, type } = await request.json();

    if (!userId || !bookingId || !title || !message || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        bookingId,
        title,
        message,
        type,
      },
      include: {
        booking: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
