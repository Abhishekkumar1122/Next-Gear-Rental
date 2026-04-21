import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@nextgear.in";
  const vendorEmail = "vendor@nextgear.in";
  const customerEmail = "customer@nextgear.in";

  const [delhi, mumbai, bengaluru] = await Promise.all([
    prisma.city.upsert({ where: { name: "Delhi" }, update: { airportName: "Indira Gandhi International Airport", isActive: true }, create: { name: "Delhi", airportName: "Indira Gandhi International Airport", isActive: true } }),
    prisma.city.upsert({ where: { name: "Mumbai" }, update: { airportName: "Chhatrapati Shivaji Maharaj Airport", isActive: true }, create: { name: "Mumbai", airportName: "Chhatrapati Shivaji Maharaj Airport", isActive: true } }),
    prisma.city.upsert({ where: { name: "Bengaluru" }, update: { airportName: "Kempegowda International Airport", isActive: true }, create: { name: "Bengaluru", airportName: "Kempegowda International Airport", isActive: true } }),
  ]);

  const passwordHash = await bcrypt.hash("Password@123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Next Gear Admin", role: "ADMIN", passwordHash },
    create: { name: "Next Gear Admin", email: adminEmail, role: "ADMIN", passwordHash },
  });

  const vendorOwner = await prisma.user.upsert({
    where: { email: vendorEmail },
    update: { name: "Metro Wheels Owner", role: "VENDOR", passwordHash },
    create: { name: "Metro Wheels Owner", email: vendorEmail, role: "VENDOR", passwordHash },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { name: "Sample Customer", role: "CUSTOMER", passwordHash },
    create: { name: "Sample Customer", email: customerEmail, role: "CUSTOMER", passwordHash },
  });

  const vendor = await prisma.vendor.upsert({
    where: { ownerUserId: vendorOwner.id },
    update: { businessName: "Metro Wheels", contactPhone: "+91-9000011111", commissionRate: "20.00" },
    create: { businessName: "Metro Wheels", contactPhone: "+91-9000011111", commissionRate: "20.00", ownerUserId: vendorOwner.id },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { id: "seed-vehicle-1" },
    update: {
      title: "Hyundai i20",
      type: "car",
      fuel: "petrol",
      transmission: "automatic",
      seats: 5,
      pricePerDayINR: 2300,
      airportPickup: true,
      cityId: delhi.id,
      vendorId: vendor.id,
    },
    create: {
      id: "seed-vehicle-1",
      title: "Hyundai i20",
      type: "car",
      fuel: "petrol",
      transmission: "automatic",
      seats: 5,
      pricePerDayINR: 2300,
      airportPickup: true,
      cityId: delhi.id,
      vendorId: vendor.id,
    },
  });

  await prisma.booking.upsert({
    where: { id: "seed-booking-1" },
    update: {
      userId: customer.id,
      vehicleId: vehicle.id,
      cityName: delhi.name,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-03"),
      totalAmountINR: 4600,
      currency: "INR",
      timezone: "Asia/Kolkata",
      status: "CONFIRMED",
    },
    create: {
      id: "seed-booking-1",
      userId: customer.id,
      vehicleId: vehicle.id,
      cityName: delhi.name,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-03"),
      totalAmountINR: 4600,
      currency: "INR",
      timezone: "Asia/Kolkata",
      status: "CONFIRMED",
    },
  });

  console.log("Phase 3 seed completed");
  console.log({
    adminLogin: adminUser.email,
    vendorLogin: vendorOwner.email,
    customerLogin: customer.email,
    defaultPassword: "Password@123",
    citiesSeeded: [delhi.name, mumbai.name, bengaluru.name],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
