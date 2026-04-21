import { prisma } from "@/lib/prisma";
import { deliveryJobsStore, driversStore } from "@/lib/store";
import { DeliveryJob, DeliveryJobStatus } from "@/lib/types";

const hasDatabase = Boolean(process.env.DATABASE_URL);

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

export async function getDeliveryJobs(options: {
  bookingId?: string;
  status?: string;
  limit?: number;
}) {
  const { bookingId, status, limit } = options;

  if (hasDatabase) {
    const prismaStatus = (status != null)
      ? (status!.toUpperCase() as "SCHEDULED" | "EN_ROUTE" | "ARRIVED" | "COMPLETED" | "CANCELLED")
      : undefined;
    const jobs = await (prisma as any).deliveryJob.findMany({
      where: {
        bookingId: bookingId || undefined,
        status: prismaStatus,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return jobs.map((job: any) => ({
      id: job.id,
      bookingId: job.bookingId,
      type: job.type.toLowerCase() as DeliveryJob["type"],
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
    }));
  }

  const filtered = deliveryJobsStore.filter((job) => {
    if (bookingId && job.bookingId !== bookingId) return false;
    if (status && job.status !== status.toLowerCase()) return false;
    return true;
  });

  return (limit ? filtered.slice(0, limit) : filtered).map((job) => ({ ...job }));
}

export async function getDeliveryJob(jobId: string) {
  if (hasDatabase) {
    const job = await (prisma as any).deliveryJob.findUnique({ where: { id: jobId } });
    if (!job) return null;

    return {
      id: job.id,
      bookingId: job.bookingId,
      type: job.type.toLowerCase() as DeliveryJob["type"],
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
    } satisfies DeliveryJob;
  }

  return deliveryJobsStore.find((job) => job.id === jobId) ?? null;
}

export async function getDrivers() {
  if (hasDatabase) {
    const drivers = await (prisma as any).driver.findMany({ orderBy: { createdAt: "desc" } });
    return drivers.map((driver: any) => ({
      id: driver.id,
      name: driver.name,
      phone: driver.phone ?? undefined,
      vehicleNumber: driver.vehicleNumber ?? undefined,
      active: driver.active,
      currentLat: driver.currentLat ?? undefined,
      currentLng: driver.currentLng ?? undefined,
      lastActiveAt: driver.lastActiveAt?.toISOString(),
    }));
  }

  return driversStore.map((driver) => ({ ...driver }));
}
