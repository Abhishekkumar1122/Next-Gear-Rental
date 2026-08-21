import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Locating Hunter 350 vehicle...");
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      title: {
        contains: "Hunter",
        mode: "insensitive"
      }
    }
  });

  if (!vehicle) {
    console.log("Hunter 350 not found in database. Finding first available vehicle...");
    const firstVehicle = await prisma.vehicle.findFirst();
    if (!firstVehicle) {
      console.log("No vehicles found in database.");
      return;
    }
    await seedImages(firstVehicle.id, firstVehicle.title);
  } else {
    await seedImages(vehicle.id, vehicle.title);
  }
}

async function seedImages(vehicleId, title) {
  console.log(`Clearing existing media for ${title} (${vehicleId})...`);
  await prisma.$executeRawUnsafe(`DELETE FROM "VendorVehicleMedia" WHERE vehicle_id = '${vehicleId}'`);

  console.log("Inserting 3 high-quality sample image URLs...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO "VendorVehicleMedia" (vehicle_id, image_url, sort_order)
    VALUES 
      ('${vehicleId}', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', 0),
      ('${vehicleId}', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', 1),
      ('${vehicleId}', 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=800&q=80', 2)
  `);

  console.log(`Successfully seeded 3 image slideshow records for ${title}!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
