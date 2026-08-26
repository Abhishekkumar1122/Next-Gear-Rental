export type BroadcastTemplate = {
  id: string;
  title: string;
  category: "weekend" | "flash_sale" | "festive" | "fleet_alert" | "nri_special";
  promoCode: string;
  discount: string;
  targetFleet: string;
  messageTemplate: string;
};

export type BroadcastLog = {
  id: string;
  title: string;
  channelType: "whatsapp_channel" | "whatsapp_group" | "direct_sms" | "email";
  promoCode?: string;
  messageText: string;
  sentAt: string;
  sentBy: string;
  status: "delivered" | "sent" | "shared";
  reachEstimate: number;
};

export const DEFAULT_BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    id: "weekend-20-flash",
    title: "🔥 Weekend Flash Sale - Flat 20% OFF!",
    category: "weekend",
    promoCode: "WEEKEND20",
    discount: "20% OFF",
    targetFleet: "Mahindra Thar 4x4, Royal Enfield Himalayan 450, BMW G310 GS",
    messageTemplate: `🔥 *NEXT GEAR WEEKEND FLASH SALE IS LIVE!* 🚀

Planning an epic weekend road trip with friends or family? 🛣️ Grab premium bikes & luxury cars with *FLAT 20% OFF*!

🌟 *Weekend Special Highlights:*
✅ Zero Security Deposit on verified profiles
✅ 2 Complimentary ISI Helmets & Mobile Mounts
✅ 24x7 On-Road Assistance across 120+ Indian Cities
✅ Unlimited Kilometers option available

🎟️ *Use Promo Code:* *WEEKEND20*
💰 *Discount:* Flat 20% Instant OFF on all 2+ day bookings!
🚘 *Top Picks This Weekend:*
• Mahindra Thar 4x4 Hardtop
• Royal Enfield Himalayan 450
• BMW G310 GS Adventure
• Hyundai Creta Automatic

⚡ *Hurry! Only 12 slots left for this Saturday & Sunday!*
👉 *Book Instantly:* https://next-gear.app/vehicles?promo=WEEKEND20&src=wa_channel

_Next Gear Rentals • India's #1 Self-Drive Mobility Network_`
  },
  {
    id: "monsoon-roadtrip",
    title: "🌧️ Monsoon Getaway & 4x4 Mountain Pass",
    category: "weekend",
    promoCode: "MONSOON30",
    discount: "30% OFF",
    targetFleet: "4x4 SUVs & Adventure Touring Bikes",
    messageTemplate: `🌧️ *MONSOON ROAD TRIP READY? FLAT 30% OFF!* 🏔️

The hills are calling! Experience lush green highways, misty ghats, and roaring waterfalls with Next Gear's rugged fleet.

🛡️ *Monsoon Safety Kit Included Free:*
• Waterproof riding jackets & mobile rain covers
• All-Terrain tire verified vehicles
• 100% Comprehensive Zero-Dep Insurance

🎟️ *Exclusive Coupon:* *MONSOON30*
📍 *Available At:* Delhi NCR, Chandigarh, Dehradun, Manali, Mumbai, Pune, Bangalore & Goa

📲 *Reserve Your Machine Now:*
👉 https://next-gear.app/vehicles?promo=MONSOON30&src=wa_group

_Safe riding with Next Gear Rentals!_ 🏍️💨`
  },
  {
    id: "last-minute-thursday",
    title: "⚡ Last-Minute Weekend Booking Alert",
    category: "weekend",
    promoCode: "QUICKRIDE",
    discount: "₹500 Flat OFF",
    targetFleet: "All Scooters, Bikes & Compact SUVs",
    messageTemplate: `⚡ *LAST-MINUTE WEEKEND FLEET DROP!* 🏎️

No weekend plans yet? We just unlocked *15 fresh vehicles* at your nearest Hub Station with express instant pickup!

🔑 *Highlights:*
• Instant 10-minute pickup with digital Aadhaar QR
• Clean, sanitized, and full-tank ready
• Flat ₹500 discount with code *QUICKRIDE*

📲 *Check available vehicles right now:*
👉 https://next-gear.app/vehicles?promo=QUICKRIDE&src=wa_channel

_Offer valid till tonight 11:59 PM only!_`
  },
  {
    id: "nri-airport-pass",
    title: "🌍 NRI & Airport Express Priority Pass",
    category: "nri_special",
    promoCode: "GLOBALRIDER",
    discount: "15% OFF",
    targetFleet: "Toyota Fortuner, BMW, Scorpio-N, Harley Davidson",
    messageTemplate: `🌍 *FLYING INTO INDIA THIS MONTH?* ✈️🚗

Skip local taxi hassles! Next Gear delivers luxury cars & super-bikes right at the Airport Terminal Exit with express digital passport onboarding.

🪪 International Driving Permit (IDP) & Passports accepted with instant Gemini AI Verification!

🎟️ *Special NRI Code:* *GLOBALRIDER*
👉 *Learn More & Pre-Book:* https://next-gear.app/nri-rentals?promo=GLOBALRIDER`
  }
];

// In-memory persistent logs during server runtime
let broadcastLogs: BroadcastLog[] = [
  {
    id: "log-1",
    title: "Weekend Flash Sale 20% OFF Broadcast",
    channelType: "whatsapp_channel",
    promoCode: "WEEKEND20",
    messageText: "Next Gear Weekend Flash Sale is live across Delhi & Goa hubs...",
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "Admin",
    status: "delivered",
    reachEstimate: 1420
  },
  {
    id: "log-2",
    title: "Monsoon Mountain Roadtrip Alert",
    channelType: "whatsapp_group",
    promoCode: "MONSOON30",
    messageText: "Monsoon Road Trip special offer for VIP group riders...",
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: "Admin",
    status: "delivered",
    reachEstimate: 850
  }
];

export function getBroadcastLogs(): BroadcastLog[] {
  return broadcastLogs;
}

export function saveBroadcastLog(log: Omit<BroadcastLog, "id" | "sentAt">): BroadcastLog {
  const newLog: BroadcastLog = {
    ...log,
    id: `log-${Date.now()}`,
    sentAt: new Date().toISOString()
  };
  broadcastLogs = [newLog, ...broadcastLogs];
  return newLog;
}
