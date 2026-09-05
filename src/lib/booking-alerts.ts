import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchAlert, type AlertChannel } from "@/lib/alert-dispatch";
import { formatBookingId } from "@/lib/pricing-tiers";

export type BookingAlertEvent = "booking_confirmed" | "payment_success" | "pickup_reminder" | "return_reminder";

type AlertProfile = {
  userEmail: string;
  phone?: string;
  preferredChannel: AlertChannel;
};

type AlertLog = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  channel: AlertChannel;
  destination?: string;
  provider: "mock" | "twilio" | "whatsapp_cloud";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  dedupeKey?: string;
  createdAt: string;
};

const inMemoryProfiles = new Map<string, AlertProfile>();
const inMemoryLogs: AlertLog[] = [];

let hasEnsuredTables = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string) {
  if (!phone) return undefined;
  const value = phone.replace(/[^\d+]/g, "").trim();
  return value || undefined;
}

async function ensureBookingAlertTables() {
  if (!process.env.DATABASE_URL || hasEnsuredTables) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingAlertProfile" (
      user_email TEXT PRIMARY KEY,
      phone TEXT,
      preferred_channel TEXT NOT NULL DEFAULT 'email',
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingAlertLog" (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      event_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      destination TEXT,
      provider TEXT NOT NULL,
      delivery_status TEXT NOT NULL,
      delivery_error TEXT,
      message TEXT NOT NULL,
      dedupe_key TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure snake_case columns exist on the database table in case it was created by Prisma via schema.prisma with camelCase columns
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS booking_id TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS user_email TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS event_type TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS channel TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS destination TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS provider TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS delivery_status TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS delivery_error TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS dedupe_key TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`);
  
  // Ensure camelCase columns exist in case it was created via raw script
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "bookingId" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "alertType" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "BookingAlertLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3)`);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BookingAlertLog_booking_event_idx"
    ON "BookingAlertLog"(booking_id, event_type)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BookingAlertLog_user_email_idx"
    ON "BookingAlertLog"(user_email)
  `);

  hasEnsuredTables = true;
}

export async function upsertBookingAlertProfile(input: {
  userEmail: string;
  phone?: string;
  preferredChannel?: AlertChannel;
}) {
  const userEmail = normalizeEmail(input.userEmail);
  const phone = normalizePhone(input.phone);
  const preferredChannel: AlertChannel = input.preferredChannel ?? (phone ? "whatsapp" : "email");

  if (!userEmail) return;

  if (!process.env.DATABASE_URL) {
    inMemoryProfiles.set(userEmail, { userEmail, phone, preferredChannel });
    return;
  }

  await ensureBookingAlertTables();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "BookingAlertProfile" (user_email, phone, preferred_channel, updated_at)
      VALUES (${userEmail}, ${phone ?? null}, ${preferredChannel}, NOW())
      ON CONFLICT (user_email)
      DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, "BookingAlertProfile".phone),
        preferred_channel = EXCLUDED.preferred_channel,
        updated_at = NOW()
    `,
  );
}

async function getBookingAlertProfile(userEmail: string): Promise<AlertProfile | undefined> {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!process.env.DATABASE_URL) {
    return inMemoryProfiles.get(normalizedEmail);
  }

  await ensureBookingAlertTables();
  const rows = await prisma.$queryRaw<
    { user_email: string; phone: string | null; preferred_channel: string }[]
  >(Prisma.sql`
    SELECT user_email, phone, preferred_channel
    FROM "BookingAlertProfile"
    WHERE LOWER(user_email) = LOWER(${normalizedEmail})
    LIMIT 1
  `);

  if (!rows.length) return undefined;
  return {
    userEmail: rows[0].user_email,
    phone: rows[0].phone ?? undefined,
    preferredChannel:
      rows[0].preferred_channel === "sms"
        ? "sms"
        : rows[0].preferred_channel === "whatsapp"
        ? "whatsapp"
        : "email",
  };
}

async function isDuplicateAlert(input: {
  bookingId: string;
  eventType: BookingAlertEvent;
  dedupeKey?: string;
}) {
  if (!input.dedupeKey) return false;

  if (!process.env.DATABASE_URL) {
    return inMemoryLogs.some(
      (item) =>
        item.bookingId === input.bookingId &&
        item.eventType === input.eventType &&
        item.dedupeKey === input.dedupeKey &&
        item.deliveryStatus === "sent",
    );
  }

  await ensureBookingAlertTables();
  const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "BookingAlertLog"
    WHERE booking_id = ${input.bookingId}
      AND event_type = ${input.eventType}
      AND dedupe_key = ${input.dedupeKey}
      AND delivery_status = 'sent'
  `);

  return Number(rows[0]?.count ?? 0) > 0;
}

export async function sendBookingAlert(input: {
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  message: string;
  phone?: string;
  forceChannel?: AlertChannel;
  dedupeKey?: string;
}) {
  const bookingId = input.bookingId.trim();
  const userEmail = normalizeEmail(input.userEmail);

  if (!bookingId || !userEmail || !input.message.trim()) {
    return { sent: false, reason: "invalid_payload" as const };
  }

  if (await isDuplicateAlert({ bookingId, eventType: input.eventType, dedupeKey: input.dedupeKey })) {
    return { sent: false, reason: "duplicate" as const };
  }

  const profile = await getBookingAlertProfile(userEmail);
  const phone = normalizePhone(input.phone) ?? profile?.phone;

  const selectedChannel: AlertChannel = input.forceChannel
    ? input.forceChannel
    : phone
    ? profile?.preferredChannel === "email"
      ? "sms"
      : profile?.preferredChannel ?? "whatsapp"
    : "email";

  const destination = selectedChannel === "email" ? userEmail : phone;
  if (!destination) {
    return { sent: false, reason: "missing_destination" as const };
  }

  // Dual simultaneous dispatch to BOTH Email and WhatsApp
  const dispatch = await dispatchAlert({
    channel: "email",
    to: userEmail,
    message: input.message,
  });

  if (phone) {
    await dispatchAlert({
      channel: "whatsapp",
      to: phone,
      message: input.message,
    });
  }

  const record: AlertLog = {
    id: randomUUID(),
    bookingId,
    userEmail,
    eventType: input.eventType,
    channel: selectedChannel,
    destination,
    provider: dispatch.provider,
    deliveryStatus: dispatch.deliveryStatus,
    deliveryError: dispatch.error,
    message: input.message,
    dedupeKey: input.dedupeKey,
    createdAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    inMemoryLogs.unshift(record);
    return { sent: dispatch.deliveryStatus === "sent", reason: "ok" as const };
  }

  await ensureBookingAlertTables();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "BookingAlertLog" (
        id, booking_id, user_email, event_type, channel, destination, provider, delivery_status,
        delivery_error, message, dedupe_key, created_at,
        "bookingId", "alertType", "sentAt", "createdAt"
      )
      VALUES (
        ${record.id}, ${record.bookingId}, ${record.userEmail}, ${record.eventType}, ${record.channel}, ${record.destination ?? null},
        ${record.provider}, ${record.deliveryStatus}, ${record.deliveryError ?? null}, ${record.message},
        ${record.dedupeKey ?? null}, NOW(),
        ${record.bookingId}, ${record.eventType}, NOW(), NOW()
      )
    `,
  );

  return { sent: dispatch.deliveryStatus === "sent", reason: "ok" as const };
}

export async function sendPaymentSuccessAlertByProviderPaymentId(providerPaymentId: string) {
  if (!process.env.DATABASE_URL || !providerPaymentId.trim()) return;

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId },
    select: { bookingId: true },
  });

  if (payment?.bookingId) {
    await prisma.booking.updateMany({
      where: { id: payment.bookingId, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
    await dispatchTriPartyBookingAlerts(payment.bookingId);
  }
}

const triPartyDispatchedDedupe = new Set<string>();

export async function dispatchTriPartyBookingAlerts(bookingId: string) {
  if (!bookingId || !bookingId.trim()) return;

  const cleanId = bookingId.trim();

  // Auto-transition booking from PENDING to CONFIRMED if database is active
  if (process.env.DATABASE_URL) {
    try {
      await prisma.booking.updateMany({
        where: { id: cleanId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
    } catch (e) {
      console.error("[Booking Confirm Status Sync Error]", e);
    }
  }

  if (triPartyDispatchedDedupe.has(cleanId)) {
    console.log(`[TriParty Alert Dedupe] Suppressing duplicate tri-party alert dispatch for booking ${cleanId}`);
    return;
  }
  triPartyDispatchedDedupe.add(cleanId);
  setTimeout(() => triPartyDispatchedDedupe.delete(cleanId), 60 * 60 * 1000);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
  const passLink = `${baseUrl.replace(/\/$/, "")}/api/bookings/${bookingId}/pass`;

  let bookingData: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    vehicleTitle: string;
    cityName: string;
    startDate: string;
    endDate: string;
    totalAmountINR: number;
    vendorPhone?: string;
    vendorEmail?: string;
    vendorName?: string;
    vendorUserId?: string;
  } | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          vehicle: {
            include: {
              vendor: {
                include: {
                  ownerUser: true,
                },
              },
            },
          },
        },
      });

      if (b) {
        bookingData = {
          id: b.id,
          customerName: b.user.name || "Valued Customer",
          customerEmail: b.user.email || "",
          customerPhone: b.user.phone || undefined,
          vehicleTitle: b.vehicle.title,
          cityName: b.cityName,
          startDate: b.startDate.toISOString().slice(0, 10),
          endDate: b.endDate.toISOString().slice(0, 10),
          totalAmountINR: b.totalAmountINR,
          vendorPhone: b.vehicle.vendor?.ownerUser?.phone || b.vehicle.vendor?.contactPhone || undefined,
          vendorEmail: b.vehicle.vendor?.ownerUser?.email || undefined,
          vendorName: b.vehicle.vendor?.businessName || b.vehicle.vendor?.ownerUser?.name || "Hub Vendor",
          vendorUserId: b.vehicle.vendor?.ownerUser?.id || undefined,
        };
      }
    } catch (e) {
      console.error("[Prisma TriParty Fetch Failed]", e);
    }
  }

  // Fallback to memory store if database is empty or not configured
  if (!bookingData) {
    try {
      const { bookingsStore } = await import("@/lib/store");
      const b = bookingsStore.find((item) => item.id === bookingId);
      if (b) {
        bookingData = {
          id: b.id,
          customerName: b.userName || "Valued Customer",
          customerEmail: b.userEmail || "",
          customerPhone: (b as any).userPhone || (b as any).phone || "9523765172",
          vehicleTitle: (b as any).vehicleTitle || "Rental Vehicle",
          cityName: b.city,
          startDate: b.startDate,
          endDate: b.endDate,
          totalAmountINR: b.totalAmountINR,
          vendorPhone: "9523765172",
          vendorEmail: "vendor@next-gear.app",
          vendorName: "Next Gear Hub Vendor",
        };
      }
    } catch (err) {
      console.error("[Memory TriParty Fetch Failed]", err);
    }
  }

  if (!bookingData) return;

  const { dispatchHtmlEmail, dispatchAlert } = await import("@/lib/alert-dispatch");
  const { generateBookingConfirmationEmailHtml } = await import("@/lib/email-templates");

  const prettyId = formatBookingId(bookingData.id, bookingData.cityName, bookingData.startDate);

  const dispatchTasks: Promise<unknown>[] = [];

  // 1. CUSTOMER ALERTS (Email + WhatsApp + SMS)
  if (bookingData.customerEmail) {
    try {
      const html = generateBookingConfirmationEmailHtml({
        bookingId: prettyId,
        customerName: bookingData.customerName,
        vehicleTitle: bookingData.vehicleTitle,
        cityName: bookingData.cityName,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalAmountINR: bookingData.totalAmountINR,
        baseUrl,
      });

      let pdfBuffer: Buffer | undefined;
      try {
        const { generateBookingReceiptPdfBuffer } = await import("@/lib/pdf-generator");
        pdfBuffer = await generateBookingReceiptPdfBuffer({
          bookingId: prettyId,
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          vehicleTitle: bookingData.vehicleTitle,
          cityName: bookingData.cityName,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          totalAmountINR: bookingData.totalAmountINR,
          bookingAmount: bookingData.totalAmountINR,
          balanceAmount: 0,
        });
      } catch (pdfErr) {
        console.error("[Customer PDF Pass Generation Error]", pdfErr);
      }

      dispatchTasks.push(
        dispatchHtmlEmail({
          to: bookingData.customerEmail,
          subject: `🚗 Booking Confirmed #${prettyId} - ${bookingData.vehicleTitle}`,
          html,
          attachments: pdfBuffer
            ? [
                {
                  filename: `NextGear-Booking-Pass-${prettyId}.pdf`,
                  content: pdfBuffer,
                },
              ]
            : undefined,
        })
      );
    } catch (err) {
      console.error("[Customer Email Alert Failed]", err);
    }
  }

  const customerWaMsg = `💳 *NEXT GEAR RENTALS - BOOKING CONFIRMED* ✅\n\nHello *${bookingData.customerName}*,\nYour rental booking has been successfully confirmed!\n\n📌 *Booking ID:* \`${prettyId}\`\n🚘 *Vehicle:* *${bookingData.vehicleTitle}*\n📍 *City:* ${bookingData.cityName}\n🗓️ *Dates:* ${bookingData.startDate} to ${bookingData.endDate}\n💰 *Total Paid:* *₹${bookingData.totalAmountINR.toLocaleString("en-IN")}*\n\n🎟️ *Download Booking Pass & e-Receipt:*\n${passLink}\n\n📞 *24/7 Helpline:* +91-9523765172\nThank you for choosing NEXT GEAR Rentals! Drive safe! 🛵💨`;

  if (bookingData.customerPhone) {
    try {
      const { sendWhatsAppBookingReceipt } = await import("@/lib/whatsapp-service");
      dispatchTasks.push(
        sendWhatsAppBookingReceipt({
          bookingId: bookingData.id,
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          vehicleTitle: bookingData.vehicleTitle,
          cityName: bookingData.cityName,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          totalAmountINR: bookingData.totalAmountINR,
        })
      );
    } catch (waErr) {
      console.error("[Customer WhatsApp Alert Failed]", waErr);
    }
    dispatchTasks.push(dispatchAlert({ channel: "sms", to: bookingData.customerPhone, message: customerWaMsg }));
  }

  // 2. VENDOR ALERT (WhatsApp + SMS)
  const vendorTargetPhone = bookingData.vendorPhone || process.env.ADMIN_CONTACT_PHONE || "9523765172";
  if (vendorTargetPhone) {
    const vendorWaMsg = `🔔 *NEXT GEAR VENDOR ALERT - NEW BOOKING RECEIVED!* 🚘\n\nHello *${bookingData.vendorName || "Fleet Partner"}*,\nA new booking has been placed for your vehicle!\n\n📌 *Booking ID:* \`${prettyId}\`\n🚘 *Vehicle:* *${bookingData.vehicleTitle}*\n👤 *Customer:* *${bookingData.customerName}* (${bookingData.customerPhone || "Mobile"})\n📍 *City:* ${bookingData.cityName}\n🗓️ *Rental Dates:* ${bookingData.startDate} to ${bookingData.endDate}\n💰 *Booking Value:* ₹${bookingData.totalAmountINR.toLocaleString("en-IN")}\n\nPlease inspect and prepare the vehicle for handover. 🛵`;
    try {
      const { sendVendorBookingNotification } = await import("@/lib/whatsapp-service");
      dispatchTasks.push(
        sendVendorBookingNotification({
          bookingId: bookingData.id,
          vendorPhone: vendorTargetPhone,
          vendorName: bookingData.vendorName || "Fleet Partner",
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          vehicleTitle: bookingData.vehicleTitle,
          cityName: bookingData.cityName,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          totalAmountINR: bookingData.totalAmountINR,
        })
      );
    } catch (vErr) {
      console.error("[Vendor WhatsApp Alert Failed]", vErr);
    }
    dispatchTasks.push(dispatchAlert({ channel: "sms", to: vendorTargetPhone, message: vendorWaMsg }));
  }

  // 3. SUPER ADMIN ALERT (WhatsApp + SMS + Email + In-App to Super Admin)
  const adminPhone = process.env.ADMIN_ALERT_PHONE || "9523765172";
  const vendorPayoutEst = Math.round(bookingData.totalAmountINR * 0.8);
  const platformMarginEst = bookingData.totalAmountINR - vendorPayoutEst;

  const adminWaMsg = `⚡ *NEXT GEAR ADMIN ALERT - NEW BOOKING CONFIRMED!* 🚀\n\n` +
    `📌 *Booking ID:* \`${prettyId}\`\n` +
    `🚘 *Vehicle Booked:* *${bookingData.vehicleTitle}*\n` +
    `📍 *City Hub:* ${bookingData.cityName}\n\n` +
    `🏢 *VENDOR (VEHICLE OWNER):*\n` +
    `▫️ *Vendor:* *${bookingData.vendorName || "Fleet Partner"}*\n` +
    (bookingData.vendorPhone ? `▫️ *Phone:* ${bookingData.vendorPhone}\n` : "") +
    (bookingData.vendorEmail ? `▫️ *Email:* ${bookingData.vendorEmail}\n` : "") +
    `\n` +
    `👤 *CUSTOMER DETAILS:*\n` +
    `▫️ *Name:* *${bookingData.customerName}*\n` +
    (bookingData.customerPhone ? `▫️ *Phone:* ${bookingData.customerPhone}\n` : "") +
    (bookingData.customerEmail ? `▫️ *Email:* ${bookingData.customerEmail}\n` : "") +
    `\n` +
    `💰 *PAYMENT & REVENUE:*\n` +
    `▫️ *Total Paid by Customer:* *₹${bookingData.totalAmountINR.toLocaleString("en-IN")}*\n` +
    `▫️ *Vendor Payout Share (80%):* ₹${vendorPayoutEst.toLocaleString("en-IN")}\n` +
    `▫️ *Platform Commission (20%):* ₹${platformMarginEst.toLocaleString("en-IN")}\n\n` +
    `🗓️ *Trip Dates:* ${bookingData.startDate} to ${bookingData.endDate}\n\n` +
    `🔗 *Admin Portal:* ${baseUrl}/dashboard/admin?section=bookings`;

  dispatchTasks.push(
    dispatchAlert({
      channel: "whatsapp",
      to: adminPhone,
      message: adminWaMsg,
      templateName: "admin_booking_alert",
      templateParams: [
        prettyId,
        bookingData.vehicleTitle,
        bookingData.cityName,
        bookingData.vendorName || "Fleet Partner",
        bookingData.vendorPhone || "N/A",
        bookingData.customerName,
        bookingData.customerPhone || "N/A",
        `₹${bookingData.totalAmountINR.toLocaleString("en-IN")}`,
        `₹${vendorPayoutEst.toLocaleString("en-IN")}`,
        `₹${platformMarginEst.toLocaleString("en-IN")}`,
        bookingData.startDate,
        bookingData.endDate,
      ],
    })
  );
  dispatchTasks.push(dispatchAlert({ channel: "sms", to: adminPhone, message: adminWaMsg }));

  await Promise.allSettled(dispatchTasks);

  // 4. IN-APP NOTIFICATIONS (Specific Vendor + Admins)
  if (process.env.DATABASE_URL) {
    try {
      // Notify ONLY the specific vendor who owns this booked vehicle
      if (bookingData.vendorUserId) {
        await prisma.notification.create({
          data: {
            userId: bookingData.vendorUserId,
            bookingId: bookingData.id,
            title: `New Booking: ${bookingData.vehicleTitle} 🎉`,
            message: `${bookingData.customerName} booked your vehicle for ₹${bookingData.totalAmountINR.toLocaleString("en-IN")} from ${bookingData.startDate} to ${bookingData.endDate}.`,
            type: "booking",
          },
        });
      }

      // Notify Super Admins
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            bookingId: bookingData.id,
            title: `🚗 New Booking: ${bookingData.vehicleTitle} (Vendor: ${bookingData.vendorName})`,
            message: `Customer ${bookingData.customerName} (${bookingData.customerPhone || "N/A"}) booked for ₹${bookingData.totalAmountINR.toLocaleString("en-IN")} in ${bookingData.cityName}. Vendor: ${bookingData.vendorName} (${bookingData.vendorPhone || "N/A"}).`,
            type: "booking",
          },
        });
      }
    } catch (notifErr) {
      console.error("[In-App Notification Error]", notifErr);
    }
  }

  // 5. SUPER ADMIN EMAIL ALERT
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || "admin@next-gear.app";
  try {
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 0.5px;">⚡ NEW PLATFORM BOOKING — ADMIN ALERT</h2>
          <p style="margin: 6px 0 0; color: #93c5fd; font-size: 14px; font-weight: bold;">Booking ID: #${prettyId}</p>
        </div>
        <div style="padding: 24px;">
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #334155;">
            <h3 style="margin-top: 0; color: #38bdf8; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #334155; padding-bottom: 8px;">🚘 Vehicle & Trip Details</h3>
            <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${bookingData.vehicleTitle}</p>
            <p style="margin: 6px 0;"><strong>City Hub:</strong> ${bookingData.cityName}</p>
            <p style="margin: 6px 0;"><strong>Rental Period:</strong> ${bookingData.startDate} to ${bookingData.endDate}</p>
          </div>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #334155;">
            <h3 style="margin-top: 0; color: #f59e0b; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #334155; padding-bottom: 8px;">🏢 Vendor (Vehicle Owner)</h3>
            <p style="margin: 6px 0;"><strong>Business / Owner:</strong> ${bookingData.vendorName || "Fleet Partner"}</p>
            <p style="margin: 6px 0;"><strong>Contact Phone:</strong> ${bookingData.vendorPhone || "N/A"}</p>
            <p style="margin: 6px 0;"><strong>Email:</strong> ${bookingData.vendorEmail || "N/A"}</p>
          </div>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #334155;">
            <h3 style="margin-top: 0; color: #10b981; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #334155; padding-bottom: 8px;">👤 Customer Details</h3>
            <p style="margin: 6px 0;"><strong>Full Name:</strong> ${bookingData.customerName}</p>
            <p style="margin: 6px 0;"><strong>Phone:</strong> ${bookingData.customerPhone || "N/A"}</p>
            <p style="margin: 6px 0;"><strong>Email:</strong> ${bookingData.customerEmail || "N/A"}</p>
          </div>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #334155;">
            <h3 style="margin-top: 0; color: #ec4899; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #334155; padding-bottom: 8px;">💰 Payment & Revenue Split</h3>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Total Paid:</strong> <span style="color: #4ade80; font-weight: bold;">₹${bookingData.totalAmountINR.toLocaleString("en-IN")}</span></p>
            <p style="margin: 6px 0;"><strong>Vendor Payout Share (80%):</strong> ₹${vendorPayoutEst.toLocaleString("en-IN")}</p>
            <p style="margin: 6px 0;"><strong>Platform Commission (20%):</strong> ₹${platformMarginEst.toLocaleString("en-IN")}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${baseUrl}/dashboard/admin?section=bookings" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Open Admin Bookings Dashboard</a>
          </div>
        </div>
      </div>
    `;

    void dispatchHtmlEmail({
      to: adminEmail,
      subject: `⚡ [ADMIN ALERT] New Booking: ${bookingData.vehicleTitle} - Vendor: ${bookingData.vendorName} (₹${bookingData.totalAmountINR})`,
      html: adminEmailHtml,
    });
  } catch (adminMailErr) {
    console.error("[Admin Email Alert Failed]", adminMailErr);
  }
}

export type AlertLogListItem = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: BookingAlertEvent;
  channel: AlertChannel;
  destination?: string;
  provider: "mock" | "twilio" | "whatsapp_cloud";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  createdAt: string;
};

export async function listBookingAlertLogs(options?: {
  status?: "sent" | "failed";
  eventType?: BookingAlertEvent;
  channel?: AlertChannel;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 20));

  if (!process.env.DATABASE_URL) {
    const filtered = inMemoryLogs.filter((item) => {
      if (options?.status && item.deliveryStatus !== options.status) return false;
      if (options?.eventType && item.eventType !== options.eventType) return false;
      if (options?.channel && item.channel !== options.channel) return false;
      return true;
    });
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }

  await ensureBookingAlertTables();
  const whereSql = Prisma.sql`
    WHERE 1=1
      ${options?.status ? Prisma.sql`AND delivery_status = ${options.status}` : Prisma.empty}
      ${options?.eventType ? Prisma.sql`AND event_type = ${options.eventType}` : Prisma.empty}
      ${options?.channel ? Prisma.sql`AND channel = ${options.channel}` : Prisma.empty}
  `;

  const countRows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "BookingAlertLog"
    ${whereSql}
  `);

  const rows = await prisma.$queryRaw<
    {
      id: string;
      booking_id: string;
      user_email: string;
      event_type: string;
      channel: string;
      destination: string | null;
      provider: string;
      delivery_status: string;
      delivery_error: string | null;
      message: string;
      created_at: Date;
    }[]
  >(Prisma.sql`
    SELECT id, booking_id, user_email, event_type, channel, destination, provider, delivery_status, delivery_error, message, created_at
    FROM "BookingAlertLog"
    ${whereSql}
    ORDER BY created_at DESC
    OFFSET ${(page - 1) * pageSize}
    LIMIT ${pageSize}
  `);

  const items: AlertLogListItem[] = rows.map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    userEmail: row.user_email,
    eventType: (row.event_type as BookingAlertEvent) || "booking_confirmed",
    channel: row.channel === "sms" ? "sms" : row.channel === "whatsapp" ? "whatsapp" : "email",
    destination: row.destination ?? undefined,
    provider: row.provider === "twilio" ? "twilio" : row.provider === "whatsapp_cloud" ? "whatsapp_cloud" : "mock",
    deliveryStatus: row.delivery_status === "failed" ? "failed" : "sent",
    deliveryError: row.delivery_error ?? undefined,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  }));

  const totalItems = Number(countRows[0]?.count ?? 0);
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

export async function retryBookingAlert(logId: string) {
  const targetId = logId.trim();
  if (!targetId) throw new Error("logId is required");

  let log: AlertLog | undefined;

  if (!process.env.DATABASE_URL) {
    log = inMemoryLogs.find((item) => item.id === targetId);
  } else {
    await ensureBookingAlertTables();
    const rows = await prisma.$queryRaw<
      {
        id: string;
        booking_id: string;
        user_email: string;
        event_type: string;
        channel: string;
        destination: string | null;
        message: string;
      }[]
    >(Prisma.sql`
      SELECT id, booking_id, user_email, event_type, channel, destination, message
      FROM "BookingAlertLog"
      WHERE id = ${targetId}
      LIMIT 1
    `);

    if (rows.length) {
      log = {
        id: rows[0].id,
        bookingId: rows[0].booking_id,
        userEmail: rows[0].user_email,
        eventType: rows[0].event_type as BookingAlertEvent,
        channel: rows[0].channel === "sms" ? "sms" : rows[0].channel === "whatsapp" ? "whatsapp" : "email",
        destination: rows[0].destination ?? undefined,
        provider: "mock",
        deliveryStatus: "failed",
        message: rows[0].message,
        createdAt: new Date().toISOString(),
      };
    }
  }

  if (!log) throw new Error("Alert log not found");

  const profile = await getBookingAlertProfile(log.userEmail);
  const destination = log.destination ?? (log.channel === "email" ? log.userEmail : profile?.phone);
  if (!destination) throw new Error("Missing destination for retry");

  const dispatch = await dispatchAlert({
    channel: log.channel,
    to: destination,
    message: log.message,
  });

  const retryRecord: AlertLog = {
    id: randomUUID(),
    bookingId: log.bookingId,
    userEmail: log.userEmail,
    eventType: log.eventType,
    channel: log.channel,
    destination,
    provider: dispatch.provider,
    deliveryStatus: dispatch.deliveryStatus,
    deliveryError: dispatch.error,
    message: log.message,
    dedupeKey: `retry-${targetId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    inMemoryLogs.unshift(retryRecord);
  } else {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "BookingAlertLog" (
          id, booking_id, user_email, event_type, channel, destination, provider, delivery_status,
          delivery_error, message, dedupe_key, created_at,
          "bookingId", "alertType", "sentAt", "createdAt"
        )
        VALUES (
          ${retryRecord.id}, ${retryRecord.bookingId}, ${retryRecord.userEmail}, ${retryRecord.eventType},
          ${retryRecord.channel}, ${retryRecord.destination ?? null}, ${retryRecord.provider}, ${retryRecord.deliveryStatus},
          ${retryRecord.deliveryError ?? null}, ${retryRecord.message}, ${retryRecord.dedupeKey ?? null}, NOW(),
          ${retryRecord.bookingId}, ${retryRecord.eventType}, NOW(), NOW()
        )
      `,
    );
  }

  return { ok: dispatch.deliveryStatus === "sent", deliveryStatus: dispatch.deliveryStatus, provider: dispatch.provider };
}
