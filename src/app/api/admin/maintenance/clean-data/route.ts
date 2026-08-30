import { NextRequest, NextResponse } from "next/server";
import { assertAdminMutationRequest } from "@/lib/admin-security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await assertAdminMutationRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const payload = await request.json();
    const { action, confirmation } = payload;

    if (confirmation !== "CONFIRM_CLEAN") {
      return NextResponse.json(
        { error: "Security confirmation phrase 'CONFIRM_CLEAN' is required to execute maintenance tasks." },
        { status: 400 }
      );
    }

    const summary: Record<string, any> = {};

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        message: "Development memory mode: mock data cleared successfully.",
        summary: { mode: "memory", action },
      });
    }

    if (action === "clean_test_bookings" || action === "full_production_reset") {
      // 1. Delete Return Requests & Inspections
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "InspectionChecklist"`);
        await prisma.$executeRawUnsafe(`DELETE FROM "ReturnRequest"`);
      } catch (err) {
        console.warn("Could not wipe ReturnRequest/InspectionChecklist:", err);
      }

      // 2. Delete Delivery Jobs linked to bookings
      try {
        await prisma.deliveryJob.deleteMany();
        summary.deliveryJobsCleaned = true;
      } catch (err) {
        console.warn("Could not wipe DeliveryJobs:", err);
      }

      // 3. Delete Payments
      try {
        const deletedPayments = await prisma.payment.deleteMany();
        summary.paymentsCleaned = deletedPayments.count;
      } catch (err) {
        console.warn("Could not wipe Payments:", err);
      }

      // 4. Delete Bookings
      try {
        const deletedBookings = await prisma.booking.deleteMany();
        summary.bookingsCleaned = deletedBookings.count;
      } catch (err) {
        console.warn("Could not wipe Bookings:", err);
      }
    }

    if (action === "clean_payout_ledger" || action === "full_production_reset") {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "VendorPayout"`);
        summary.payoutsCleaned = true;
      } catch (err) {
        console.warn("Could not wipe VendorPayout:", err);
      }
    }

    if (action === "clean_notifications_logs" || action === "full_production_reset") {
      try {
        const deletedNotifications = await prisma.notification.deleteMany();
        summary.notificationsCleaned = deletedNotifications.count;
      } catch (err) {
        console.warn("Could not wipe Notifications:", err);
      }

      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "WebhookRetryQueue"`);
        await prisma.$executeRawUnsafe(`DELETE FROM "WebhookAuditLog"`);
        summary.webhooksCleaned = true;
      } catch (err) {
        console.warn("Could not wipe WebhookLogs:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Maintenance action '${action}' completed successfully.`,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to execute clean data operation" }, { status: 500 });
  }
}
