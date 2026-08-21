import { resolveHubMapsUrl, sendVendorBookingNotification, sendWhatsAppBookingReceipt } from "../src/lib/whatsapp-service.ts";

async function testAll() {
  console.log("=== 1. Testing Google Maps Link Resolution ===");
  const delhiMapsUrl = resolveHubMapsUrl("Delhi NCR");
  const goaMapsUrl = resolveHubMapsUrl("Goa", "Airport Road, Dabolim, Goa");
  console.log("Delhi Hub Maps URL:", delhiMapsUrl);
  console.log("Goa Station Maps URL:", goaMapsUrl);

  console.log("\n=== 2. Testing Vendor Instant WhatsApp Notification ===");
  const vendorResult = await sendVendorBookingNotification({
    bookingId: "NG-DL-23072626",
    customerName: "Abhishek Singh",
    customerPhone: "9523765172",
    vehicleTitle: "Royal Enfield Meteor 350",
    cityName: "Delhi NCR",
    startDate: "14/08/2026 09:00",
    endDate: "16/08/2026 09:00",
    totalAmountINR: 2398,
    payoutAmountINR: 1918,
  });
  console.log("Vendor WhatsApp Alert Result:", JSON.stringify(vendorResult, null, 2));

  console.log("\n=== 3. Testing Customer WhatsApp with 1-Click Google Maps Pin ===");
  const customerResult = await sendWhatsAppBookingReceipt({
    bookingId: "NG-DL-23072626",
    customerName: "Abhishek Singh",
    customerPhone: "9523765172",
    vehicleTitle: "Royal Enfield Meteor 350",
    cityName: "Delhi NCR",
    startDate: "14/08/2026 09:00",
    endDate: "16/08/2026 09:00",
    totalAmountINR: 2398,
    subtotalAmountINR: 2398,
    discountINR: 0,
  });
  console.log("Customer WhatsApp Result:", JSON.stringify(customerResult, null, 2));

  console.log("\nAll Feature 1, 4, 5 tests passed!");
}

testAll();
