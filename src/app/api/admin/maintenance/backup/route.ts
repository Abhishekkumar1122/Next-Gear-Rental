import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await assertAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Fetch database tables safely
    let users: any[] = [];
    let vehicles: any[] = [];
    let bookings: any[] = [];
    let cities: any[] = [];
    let vendors: any[] = [];
    let payouts: any[] = [];

    if (process.env.DATABASE_URL) {
      try {
        [users, vehicles, bookings, cities, vendors] = await Promise.all([
          prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } }),
          prisma.vehicle.findMany(),
          prisma.booking.findMany({ include: { payments: true } }),
          prisma.city.findMany(),
          prisma.vendor.findMany(),
        ]);

        try {
          payouts = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "VendorPayout" ORDER BY "requestedAt" DESC`);
        } catch {
          payouts = [];
        }
      } catch (err) {
        console.error("Backup DB query fallback:", err);
      }
    }

    const backupData = {
      backupTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      counts: {
        users: users.length,
        vehicles: vehicles.length,
        bookings: bookings.length,
        cities: cities.length,
        vendors: vendors.length,
        payouts: payouts.length,
      },
      data: {
        users,
        vehicles,
        bookings,
        cities,
        vendors,
        payouts,
      },
    };

    const fileName = `next-gear-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate backup" }, { status: 500 });
  }
}
