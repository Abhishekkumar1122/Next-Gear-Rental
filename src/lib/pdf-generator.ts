import { jsPDF } from "jspdf";
import { NEXT_GEAR_LOGO_BASE64 } from "@/lib/logo-base64";

export type BookingPdfDetails = {
  bookingId: string;
  customerName: string;
  customerPhone?: string;
  vehicleTitle: string;
  vehicleType?: string;
  vehicleImage?: string;
  cityName: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  subtotalAmountINR?: number;
  discountINR?: number;
  bookingAmount?: number;
  balanceAmount?: number;
  pickupAddress?: string;
};

async function fetchImageBase64(url?: string): Promise<string | null> {
  if (!url || url.trim() === "" || url === "/Logo1.png") return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateBookingReceiptPdfBuffer(details: BookingPdfDetails): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;

  // Background white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(margin, 12, contentWidth, 24, "F");

  // Embed Logo Image
  try {
    if (NEXT_GEAR_LOGO_BASE64) {
      doc.addImage(NEXT_GEAR_LOGO_BASE64, "PNG", margin + 4, 14, 19, 19);
    }
  } catch (err) {
    console.error("[PDF Logo Error]", err);
  }

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("NEXT GEAR RENTALS", margin + 26, 22);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("Next Gear Bike And Car Rental", margin + 26, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68); // Brand red
  doc.text("BOOKING RECEIPT", pageWidth - margin - 6, 22, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text("Official E-Receipt Pass", pageWidth - margin - 6, 29, { align: "right" });

  // 2. MSME Yellow Bar
  let y = 40;
  doc.setFillColor(255, 215, 0); // Gold yellow
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Udyam Registered MSME - UDYAM-PB-11-0049303", margin + 4, y + 5.5);

  // Red ID badge
  doc.setFillColor(225, 6, 0);
  doc.roundedRect(pageWidth - margin - 36, y + 1.2, 32, 5.6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(details.bookingId, pageWidth - margin - 20, y + 5, { align: "center" });

  // 3. Customer & Booking Details Cards (2 Column)
  y = 52;
  const colWidth = (contentWidth - 6) / 2;

  // Left Card: Customer Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colWidth, 32, 2, 2, "FD");

  doc.setFillColor(71, 85, 105);
  doc.roundedRect(margin, y, colWidth, 6.5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CUSTOMER DETAILS", margin + 4, y + 4.5);

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Name: ${details.customerName}`, margin + 4, y + 13);
  doc.text(`Location: Customer Hub Pickup (${details.cityName})`, margin + 4, y + 20);
  doc.text(`Status: Verified Active Rental`, margin + 4, y + 27);

  // Right Card: Booking Details
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, y, colWidth, 32, 2, 2, "FD");

  doc.setFillColor(71, 85, 105);
  doc.roundedRect(rightColX, y, colWidth, 6.5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BOOKING DETAILS", rightColX + 4, y + 4.5);

  const currentDateStr = new Date().toLocaleDateString("en-IN");
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Booking Date: ${currentDateStr}`, rightColX + 4, y + 13);
  doc.text(`Rental Start: ${details.startDate}`, rightColX + 4, y + 20);
  doc.text(`Rental End: ${details.endDate}`, rightColX + 4, y + 27);

  // Fetch Vehicle Photo & QR Code in parallel
  const isCar = (details.vehicleType || "").toLowerCase().includes("car") || details.vehicleTitle.toLowerCase().includes("car");
  const fallbackVehicleImg = isCar
    ? "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300&q=80"
    : "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&q=80";
  const targetVehicleImg = details.vehicleImage || fallbackVehicleImg;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(details.bookingId)}`;

  const [vehicleImgData, qrImgData] = await Promise.all([
    fetchImageBase64(targetVehicleImg),
    fetchImageBase64(qrUrl),
  ]);

  // 4. Vehicle Items Table
  y = 90;
  doc.setFillColor(158, 10, 10); // Red Table Header
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("VEHICLE", margin + 4, y + 5.5);
  doc.text("CATEGORY", margin + 78, y + 5.5);
  doc.text("CITY", margin + 110, y + 5.5);
  doc.text("SECURITY DEPOSIT", margin + 138, y + 5.5);
  doc.text("TOTAL", pageWidth - margin - 4, y + 5.5, { align: "right" });

  // Table Row
  y = 98;
  const rowHeight = 18;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, rowHeight, "FD");

  // Draw Vehicle Photo Thumbnail if available
  if (vehicleImgData) {
    try {
      doc.addImage(vehicleImgData, "JPEG", margin + 3, y + 2, 22, 14);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(details.vehicleTitle, margin + 28, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text((details.vehicleType || "Bike").toUpperCase(), margin + 28, y + 13);
    } catch {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(details.vehicleTitle, margin + 4, y + 10);
    }
  } else {
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(details.vehicleTitle, margin + 4, y + 10);
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text((details.vehicleType || "Bike").toUpperCase(), margin + 78, y + 10.5);
  doc.text(details.cityName, margin + 110, y + 10.5);
  const depositVal = (details.vehicleType || "bike").toLowerCase() === "car" ? "Rs. 1,999" : "Rs. 999";
  doc.text(depositVal, margin + 138, y + 10.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 6, 0);
  doc.text(`Rs. ${details.totalAmountINR.toLocaleString("en-IN")}`, pageWidth - margin - 4, y + 10.5, { align: "right" });

  // 5. Pricing Breakdown Box (Right Aligned)
  y = 120;
  const priceBoxWidth = 92;
  const priceBoxX = pageWidth - margin - priceBoxWidth;

  const bookingAmt = details.bookingAmount ?? Math.round(details.totalAmountINR * 0.3);
  const balanceAmt = details.balanceAmount ?? Math.max(0, details.totalAmountINR - bookingAmt);

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(priceBoxX, y, priceBoxWidth, 22, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Booking Amount (Paid):", priceBoxX + 4, y + 7);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`Rs. ${bookingAmt.toLocaleString("en-IN")}`, pageWidth - margin - 4, y + 7, { align: "right" });

  // Total Yellow Row
  doc.setFillColor(255, 215, 0);
  doc.roundedRect(priceBoxX + 1, y + 11, priceBoxWidth - 2, 9, 1, 1, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Balance on Pickup:", priceBoxX + 4, y + 17);
  doc.text(`Rs. ${balanceAmt.toLocaleString("en-IN")}`, pageWidth - margin - 4, y + 17, { align: "right" });

  // 6. Important Terms & Notes
  y = 148;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0); // reset dash

  y += 6;
  doc.setTextColor(225, 6, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Thank you for booking with Next Gear!", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text("Have a safe and enjoyable ride!", pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const bulletPoints = [
    "• Please present original Driving License and valid ID proof at the time of pick-up.",
    "• Security deposit (if applicable) is 100% refundable upon vehicle return in original condition.",
    "• Late return charges may apply as per company policy (please inform 3 hours in advance for trip extension).",
  ];

  bulletPoints.forEach((bp) => {
    doc.text(bp, margin + 4, y);
    y += 5.5;
  });

  // 7. MSME Certification & QR Box
  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Certified MSME Enterprise under Government of India", margin + 6, y + 7);
  doc.setTextColor(158, 10, 10);
  doc.setFontSize(10);
  doc.text("UDYAM-PB-11-0049303", margin + 6, y + 14);

  // Embed QR code on right of certification box
  if (qrImgData) {
    try {
      doc.addImage(qrImgData, "PNG", pageWidth - margin - 20, y + 2, 18, 18);
    } catch {}
  }

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Scan QR for verification pass", pageWidth - margin - 24, y + 12, { align: "right" });

  // 8. Bottom Hub Location & Support Box
  y += 28;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");

  doc.setTextColor(255, 215, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Next Gear ${details.cityName} Hub   |   Email: support@next-gear.app`, pageWidth / 2, y + 7, { align: "center" });

  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const locationLine = details.pickupAddress || `Next Gear Verified Partner Station, ${details.cityName}`;
  doc.text(`Pickup Location: ${locationLine}`, pageWidth / 2, y + 13, { align: "center" });

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text("We provide bikes and cars on rent. For pickup assistance, tour guidance or support, email support@next-gear.app.", pageWidth / 2, y + 19, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
