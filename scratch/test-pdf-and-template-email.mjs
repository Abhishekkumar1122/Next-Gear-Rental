import { Resend } from "resend";
import { generateBookingReceiptPdfBuffer } from "../src/lib/pdf-generator.ts";
import { generateBookingConfirmationEmailHtml } from "../src/lib/email-templates.ts";

const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  console.log("Generating Master Template HTML & PDF with Vehicle Photo...");

  const bookingId = "NG-DL-23072626";
  const vehicleTitle = "Royal Enfield Meteor 350";
  const vehicleType = "Bike";
  const vehicleImage = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80";
  const cityName = "Delhi NCR";
  const customerName = "Abhishek Singh";
  const startDate = "14/08/2026 09:00";
  const endDate = "16/08/2026 09:00";
  const totalAmountINR = 2398;
  const baseUrl = "https://next-gear.app";

  // 1. Generate Rich Master Template HTML with vehicle image
  const emailHtml = generateBookingConfirmationEmailHtml({
    bookingId,
    customerName,
    vehicleTitle,
    vehicleType,
    vehicleImage,
    cityName,
    startDate,
    endDate,
    totalAmountINR,
    subtotalAmountINR: 2398,
    discountINR: 0,
    baseUrl,
  });

  // 2. Generate Single Page PDF E-Receipt with embedded Vehicle photo
  const pdfBuffer = await generateBookingReceiptPdfBuffer({
    bookingId,
    customerName,
    customerPhone: "9523765172",
    vehicleTitle,
    vehicleType,
    vehicleImage,
    cityName,
    startDate,
    endDate,
    totalAmountINR,
    subtotalAmountINR: 2398,
    discountINR: 0,
    bookingAmount: 750,
    balanceAmount: 1648,
    pickupAddress: "Next Gear Verified Partner Station, Delhi NCR",
  });

  console.log(`PDF Generated successfully with Vehicle Image! Size: ${pdfBuffer.length} bytes`);

  // 3. Send Email with Master Template + PDF Attachment via Resend
  const res = await resend.emails.send({
    from: "Next Gear <noreply@next-gear.app>",
    to: "abhisheksingha202002@gmail.com",
    subject: `🚗 Booking Confirmed #${bookingId} - ${vehicleTitle}`,
    html: emailHtml,
    attachments: [
      {
        filename: `NextGear-Booking-Receipt-${bookingId}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  console.log("Resend Result with Vehicle Photo:", JSON.stringify(res, null, 2));
}

run();
