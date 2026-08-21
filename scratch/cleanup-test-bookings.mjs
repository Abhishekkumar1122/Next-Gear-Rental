import { prisma } from "../src/lib/prisma.ts";

async function cleanup() {
  try {
    const deleted = await prisma.booking.deleteMany({
      where: {
        vehicleId: "cmoxak0ck0001l204e1pr2o1l",
      },
    });
    console.log(`Cleaned up ${deleted.count} old test bookings on ₹1 test vehicle`);
  } catch (err) {
    console.log("Cleanup error:", err.message);
  }
}

cleanup();
