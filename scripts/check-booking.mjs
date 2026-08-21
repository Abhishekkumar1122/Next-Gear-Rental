import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      payments: true,
    },
  });

  console.log("=== RECENT BOOKINGS ===");
  console.log(JSON.stringify(bookings, null, 2));

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("=== RECENT PAYMENTS ===");
  console.log(JSON.stringify(payments, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
