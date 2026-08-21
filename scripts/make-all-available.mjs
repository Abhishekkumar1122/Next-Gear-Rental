import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database reset to make all vehicles available...");

  // 1. Clear overrides
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "VehicleAvailabilityOverride"');
    console.log("✓ Truncated VehicleAvailabilityOverride table.");
  } catch (e) {
    console.log("Note: VehicleAvailabilityOverride table truncation skipped or not defined in schema (using defaults).", e.message);
  }

  // 2. Set all bookings status to CANCELLED or COMPLETED (so they don't block vehicles)
  const bookingsReset = await prisma.booking.updateMany({
    where: {
      status: "CONFIRMED",
    },
    data: {
      status: "COMPLETED",
    },
  });
  console.log(`✓ Updated ${bookingsReset.count} confirmed bookings to COMPLETED status.`);

  // 3. Reset all vehicle operational statuses to AVAILABLE
  const vehiclesReset = await prisma.vehicle.updateMany({
    data: {
      operationalStatus: "AVAILABLE",
    },
  });
  console.log(`✓ Reset ${vehiclesReset.count} database vehicles to AVAILABLE operationalStatus.`);

  console.log("Database reset complete. All vehicles (including all bikes) are now available for testing!");
}

main()
  .catch((e) => {
    console.error("Error running availability reset script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
