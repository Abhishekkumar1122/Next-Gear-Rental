#!/usr/bin/env node

/**
 * Test script to create multiple vehicles and track the count
 * Run with: node test-vehicle-creation.mjs
 */

const BASE_URL = "http://localhost:3000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "dev_token";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getVehicleCount() {
  const res = await fetch(`${BASE_URL}/api/admin/vehicles`, {
    headers: {
      "Authorization": `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  return data.vehicles?.length ?? 0;
}

async function createVehicle(number) {
  const res = await fetch(`${BASE_URL}/api/admin/vehicles`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Test Vehicle ${number}`,
      type: number % 3 === 0 ? "car" : number % 3 === 1 ? "bike" : "scooty",
      fuel: "petrol",
      transmission: "manual",
      seats: 2,
      pricePerDayINR: 500 + number * 100,
      vehicleNumber: `TEST-${Date.now()}-${number}`,
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
      cityName: "Delhi",
      cityId: "delhi",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ Vehicle ${number} failed:`, data.error);
    return false;
  }

  console.log(`✅ Vehicle ${number} created:`, data.vehicle?.title);
  return true;
}

async function main() {
  console.log("🧪 TEST: Vehicle Creation Limit\n");

  let initialCount = 0;
  try {
    initialCount = await getVehicleCount();
    console.log(`📊 Initial vehicle count: ${initialCount}\n`);
  } catch (error) {
    console.error("❌ Failed to fetch initial count. Is the server running?");
    process.exit(1);
  }

  console.log("Creating 5 test vehicles...\n");

  for (let i = 1; i <= 5; i++) {
    const success = await createVehicle(i);
    if (!success) {
      console.error(`⛔ Stopped at vehicle ${i}`);
      break;
    }

    await sleep(500);

    const count = await getVehicleCount();
    console.log(`  → Total vehicles now: ${count}`);
    console.log();
  }

  const finalCount = await getVehicleCount();
  console.log(`\n📊 Final vehicle count: ${finalCount}`);
  console.log(`✨ Created: ${finalCount - initialCount} vehicles\n`);

  if (finalCount - initialCount === 5) {
    console.log("✅ SUCCESS: All 5 vehicles created!"
);
  } else if (finalCount - initialCount < 5) {
    console.log(`⚠️  WARNING: Only ${finalCount - initialCount} of 5 vehicles created`);
  }
}

main().catch(console.error);
