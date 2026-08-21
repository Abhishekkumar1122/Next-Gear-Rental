import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { dispatchAlert } from "../src/lib/alert-dispatch";

async function main() {
  console.log("Sending live Meta WhatsApp test message to +91 9523765172...");
  const res = await dispatchAlert({
    channel: "whatsapp",
    to: "9523765172",
    message: `🏎️ *NEXT GEAR RENTALS — OFFICIAL WHATSAPP ALERT*

Welcome to Next Gear Rentals! Your Meta WhatsApp Cloud API integration is 100% Live & Active!

• Sender: Next Gear (+91 87892 21215)
• Target: +91 9523765172
• Status: Verified Connected
• Timestamp: ${new Date().toLocaleString()}

Self-drive bikes & luxury car rentals booking passes will be delivered right here!`,
  });
  console.log("Dispatch Result:", JSON.stringify(res, null, 2));
}

main();
