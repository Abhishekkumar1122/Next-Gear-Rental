import { prisma } from "@/lib/prisma";
import { bookingsStore, deliveryJobsStore, deliveryOtpStore } from "@/lib/store";
import { DeliveryJobStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const createJobSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(["delivery", "pickup"]),
  scheduledAt: z.string().optional(),
  assignedDriverId: z.string().optional(),
  startLat: z.number().optional(),
  startLng: z.number().optional(),
  endLat: z.number().optional(),
  endLng: z.number().optional(),
  notes: z.string().optional(),
});

function normalizeStatus(status: string): DeliveryJobStatus {
  switch (status.toUpperCase()) {
    case "EN_ROUTE":
      return "en_route";
    case "ARRIVED":
      return "arrived";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function generateOtp() {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const salt = crypto.randomBytes(4).toString("hex");
  const hash = crypto.createHash("sha256").update(`${otp}|${salt}`).digest("hex");
  return { otp, salt, hash };
}

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("bookingId") ?? undefined;
  const statusParam = request.nextUrl.searchParams.get("status") ?? undefined;

  if (false && hasDatabase) {
    // Prisma code disabled - configure DATABASE_URL to enable
    const prismaStatus = (statusParam != null)
      ? (statusParam!.toUpperCase() as "SCHEDULED" | "EN_ROUTE" | "ARRIVED" | "COMPLETED" | "CANCELLED")
      : undefined;
    const jobs = await (prisma as any).deliveryJob.findMany({
      where: {
        bookingId,
        status: prismaStatus,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      jobs: jobs.map((job: any) => ({
        id: job.id,
        bookingId: job.bookingId,
        type: job.type.toLowerCase(),
        status: normalizeStatus(job.status),
        scheduledAt: job.scheduledAt?.toISOString(),
        assignedDriverId: job.assignedDriverId ?? undefined,
        startLat: job.startLat ?? undefined,
        startLng: job.startLng ?? undefined,
        endLat: job.endLat ?? undefined,
        endLng: job.endLng ?? undefined,
        liveLat: job.liveLat ?? undefined,
        liveLng: job.liveLng ?? undefined,
        lastLocationAt: job.lastLocationAt?.toISOString(),
        notes: job.notes ?? undefined,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        otpHint: job.otpHash ? "**" : undefined,
      })),
    });
  }

  const filtered = deliveryJobsStore.filter((job) => {
    if (bookingId && job.bookingId !== bookingId) return false;
    if (status && job.status !== status) return false;
    return true;
  });

  return NextResponse.json({ jobs: filtered });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createJobSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { bookingId, type, scheduledAt, assignedDriverId, startLat, startLng, endLat, endLng, notes } = parsed.data;

  if (hasDatabase) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { otp, salt, hash } = generateOtp();

    // Prisma code disabled - configure DATABASE_URL to enable
    const job = await (prisma as any).deliveryJob.create({
      data: {
        bookingId,
        type: type.toUpperCase() as "DELIVERY" | "PICKUP",
        status: "SCHEDULED",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        assignedDriverId: assignedDriverId ?? undefined,
        startLat,
        startLng,
        endLat,
        endLng,
        notes,
        otpHash: hash,
        otpSalt: salt,
      },
    });

    await (prisma as any).deliveryEvent.create({
      data: {
        jobId: job.id,
        status: "SCHEDULED",
        message: "Job created",
        createdBy: "system",
      },
    });

    return NextResponse.json({
      job: {
        id: job.id,
        bookingId: job.bookingId,
        type: job.type.toLowerCase(),
        status: normalizeStatus(job.status),
        scheduledAt: job.scheduledAt?.toISOString(),
        assignedDriverId: job.assignedDriverId ?? undefined,
        startLat: job.startLat ?? undefined,
        startLng: job.startLng ?? undefined,
        endLat: job.endLat ?? undefined,
        endLng: job.endLng ?? undefined,
        notes: job.notes ?? undefined,
        createdAt: job.createdAt.toISOString(),
        otpHint: `**${otp.slice(-2)}`,
      },
      otp,
    }, { status: 201 });
  }

  const booking = bookingsStore.find((entry) => entry.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { otp } = generateOtp();
  const jobId = `job-${deliveryJobsStore.length + 1}`;
  deliveryOtpStore[jobId] = otp;

  const job = {
    id: jobId,
    bookingId,
    type,
    status: "scheduled" as const,
    scheduledAt,
    assignedDriverId,
    startLat,
    startLng,
    endLat,
    endLng,
    notes,
    createdAt: new Date().toISOString(),
    otpHint: `**${otp.slice(-2)}`,
  };

  deliveryJobsStore.unshift(job);

  return NextResponse.json({ job, otp }, { status: 201 });
}
