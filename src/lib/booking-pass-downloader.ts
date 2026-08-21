"use client";

import { calculateBookingAmount, formatBookingId } from "@/lib/pricing-tiers";

export type PassDetails = {
  id: string;
  customerName: string;
  customerPhone?: string;
  vehicleTitle: string;
  cityName: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  vehicleType?: string;
  vehicleImage?: string;
  rentalDays?: number;
  useHourly?: boolean;
  rentalHours?: number;
  amountPaid?: number;
  vendorName?: string;
  vendorPhone?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  isDoorstepDelivery?: boolean;
  airportPickup?: boolean;
};

// Automatic smart resolver for Hub/Shop location per city & vendor
function resolveHubAndLocationInfo({
  cityName,
  pickupAddress,
  deliveryAddress,
  isDoorstepDelivery,
  airportPickup,
  vendorName,
}: {
  cityName: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  isDoorstepDelivery?: boolean;
  airportPickup?: boolean;
  vendorName?: string;
}) {
  const rawCity = (cityName || "").trim();
  const cleanCity = rawCity.split(",")[0].trim() || "India";
  const norm = rawCity.toLowerCase();
  
  let defaultHubName = vendorName || (cleanCity ? `Next Gear ${cleanCity} Hub` : "Next Gear Central Hub");
  let defaultHubAddress = "";

  if (norm.includes("delhi") || norm.includes("noida") || norm.includes("gurgaon") || norm.includes("gurugram")) {
    defaultHubName = vendorName || "Next Gear Delhi NCR Hub";
    defaultHubAddress = airportPickup
      ? "IGI Airport (T1 & T3) Arrival Express Zone, New Delhi"
      : "Next Gear Verified Partner Station, Delhi NCR";
  } else if (norm.includes("mumbai") || norm.includes("thane") || norm.includes("navi")) {
    defaultHubName = vendorName || "Next Gear Mumbai Hub";
    defaultHubAddress = airportPickup
      ? "Chhatrapati Shivaji Maharaj Airport (T2) Parking Zone, Mumbai"
      : "Next Gear Verified Partner Station, Mumbai";
  } else if (norm.includes("bengaluru") || norm.includes("bangalore")) {
    defaultHubName = vendorName || "Next Gear Bengaluru Hub";
    defaultHubAddress = airportPickup
      ? "Kempegowda International Airport Arrival Bay, Bengaluru"
      : "Next Gear Verified Partner Station, Bengaluru";
  } else if (norm.includes("goa")) {
    defaultHubName = vendorName || "Next Gear Goa Hub";
    defaultHubAddress = airportPickup
      ? "Dabolim / Mopa International Airport Arrival Zone, Goa"
      : "Next Gear Verified Partner Station, Goa";
  } else if (norm.includes("chandigarh") || norm.includes("mohali")) {
    defaultHubName = vendorName || "Next Gear Chandigarh Hub";
    defaultHubAddress = "Next Gear Verified Partner Station, Chandigarh";
  } else if (norm.includes("jaipur")) {
    defaultHubName = vendorName || "Next Gear Jaipur Hub";
    defaultHubAddress = "Next Gear Verified Partner Station, Jaipur";
  } else if (norm.includes("hyderabad")) {
    defaultHubName = vendorName || "Next Gear Hyderabad Hub";
    defaultHubAddress = "Next Gear Verified Partner Station, Hyderabad";
  } else if (norm.includes("pune")) {
    defaultHubName = vendorName || "Next Gear Pune Hub";
    defaultHubAddress = "Next Gear Verified Partner Station, Pune";
  } else {
    defaultHubAddress = `Next Gear Verified Partner Station, ${cleanCity}`;
  }

  const finalHubAddress = pickupAddress && pickupAddress.trim() !== "" ? pickupAddress.trim() : defaultHubAddress;

  // Resolve Customer Card Address Line
  let customerAddressLine = "";
  if (isDoorstepDelivery || deliveryAddress) {
    customerAddressLine = deliveryAddress && deliveryAddress.trim() !== ""
      ? `Doorstep: ${deliveryAddress}`
      : `Doorstep Delivery (On-Location Handover)`;
  } else {
    customerAddressLine = `Customer Hub Pickup (${cleanCity})`;
  }

  return {
    hubName: defaultHubName,
    hubAddress: finalHubAddress,
    customerAddressLine,
  };
}

export async function downloadOfflinePass(booking: PassDetails) {
  try {
    const qrUrl = `${window.location.origin}/dashboard/scan-booking?id=${booking.id}&source=qr`;
    const qrCodeImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
      qrUrl
    )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=200&ecLevel=Q`;

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Formatting raw ISO strings to DD/MM/YYYY HH:MM
    const formatPrintDate = (dateTimeStr: string) => {
      if (!dateTimeStr) return "";
      const dateMatch = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      const timeMatch = dateTimeStr.match(/(\d{2}):(\d{2})/);
      let datePart = dateTimeStr.split(" ")[0];
      const timePart = timeMatch ? timeMatch[0] : "";
      
      if (dateMatch) {
        datePart = `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`;
      }
      return timePart ? `${datePart} ${timePart}` : datePart;
    };

    const formattedStartDate = formatPrintDate(booking.startDate);
    const formattedEndDate = formatPrintDate(booking.endDate);

    const recId = formatBookingId(booking.id, booking.cityName, booking.startDate);
    const vehicleType = booking.vehicleType || "Bike";
    const deposit = vehicleType.toLowerCase() === "car" ? 1999 : 999;

    // Resolve location and Hub details dynamically based on city and vendor shop
    const locationInfo = resolveHubAndLocationInfo({
      cityName: booking.cityName,
      pickupAddress: booking.pickupAddress,
      deliveryAddress: booking.deliveryAddress,
      isDoorstepDelivery: booking.isDoorstepDelivery,
      airportPickup: booking.airportPickup,
      vendorName: booking.vendorName,
    });
    
    // Calculate booking deposit vs pickup balance
    const totalAmount = booking.totalAmountINR;
    const bookingAmount = booking.amountPaid !== undefined && booking.amountPaid !== null
      ? booking.amountPaid
      : calculateBookingAmount(totalAmount);
    const balanceAmount = Math.max(0, totalAmount - bookingAmount);

    // Setup high-quality generic fallbacks matching the booking catalog page
    let vehicleImgSrc = booking.vehicleImage;
    if (!vehicleImgSrc || vehicleImgSrc === "/Logo1.png" || vehicleImgSrc.trim() === "") {
      if (vehicleType.toLowerCase() === "car") {
        vehicleImgSrc = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80";
      } else {
        vehicleImgSrc = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80";
      }
    }

    // Format duration text
    let durationText = "";
    if (booking.useHourly) {
      durationText = `${booking.rentalHours || 24} Hours`;
    } else {
      const days = booking.rentalDays || 2;
      durationText = `${days} Day${days !== 1 ? "s" : ""} (${days * 24} Hours)`;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker is preventing invoice generation. Please allow popups for this site.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Next Gear Booking Receipt - ${recId}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            color: #1e293b;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          body {
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .receipt-card {
            width: 740px;
            max-width: 100%;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 26px 30px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            position: relative;
            page-break-inside: avoid;
          }
          @media print {
            body {
              background: none;
              padding: 0;
              margin: 0;
            }
            .receipt-card {
              border: none;
              box-shadow: none;
              width: 100% !important;
              max-width: 100% !important;
              padding: 2mm 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
          .no-print {
            text-align: center;
            margin-bottom: 14px;
          }
          .print-btn {
            background: #e10600;
            color: white;
            border: none;
            padding: 11px 24px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(225, 6, 0, 0.2);
            transition: all 0.2s ease;
          }
          .print-btn:hover {
            background: #c80500;
          }
          
          /* 1. Header Area */
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
          }
          .logo-side {
            width: 45%;
            text-align: left;
            vertical-align: middle;
          }
          .title-side {
            width: 55%;
            text-align: right;
            vertical-align: middle;
          }
          .receipt-heading {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 12.5px;
            color: #475569;
            font-weight: bold;
            margin-top: 2px;
          }
          
          /* 2. MSME Bar */
          .msme-bar {
            background: #ffd700;
            color: #000000;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 6px;
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #eab308;
          }
          .rec-badge {
            background: #e10600;
            color: white;
            padding: 3px 10px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
            font-size: 12.5px;
          }

          /* 3. Details Cards */
          .details-table {
            width: 100%;
            margin-top: 14px;
            border-collapse: collapse;
          }
          .details-cell {
            width: 50%;
            vertical-align: top;
            padding: 0 8px 0 0;
          }
          .details-cell:last-child {
            padding: 0 0 0 8px;
          }
          .details-card {
            border: 1.5px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .card-title {
            background: #475569;
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 5px 10px;
            margin: -12px -14px 10px -14px;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
          }
          .info-line {
            font-size: 12px;
            margin-bottom: 5px;
            color: #334155;
            line-height: 1.4;
          }
          .info-line:last-child {
            margin-bottom: 0;
          }
          .info-line span.label {
            font-weight: bold;
            color: #64748b;
            margin-right: 4px;
          }

          /* 4. Items Table */
          .items-table {
            width: 100%;
            margin-top: 14px;
            border-collapse: collapse;
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
          }
          .items-table th {
            background: #9e0a0a;
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 9px 10px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table td {
            border-bottom: 1.5px solid #cbd5e1;
            padding: 10px 10px;
            font-size: 12px;
            color: #334155;
          }
          .img-cell {
            width: 90px;
            text-align: center;
            vertical-align: middle;
          }
          .vehicle-img {
            max-width: 80px;
            max-height: 50px;
            object-fit: contain;
            border-radius: 5px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
          }
          .name-subtext {
            font-weight: bold;
            font-size: 12.5px;
            color: #0f172a;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }

          /* 5. Pricing Table */
          .pricing-table {
            width: 300px;
            float: right;
            margin-top: 12px;
            border-collapse: collapse;
          }
          .pricing-table td {
            padding: 5px 10px;
            font-size: 12px;
          }
          .pricing-table tr.total-row td {
            font-weight: bold;
            background: #ffd700;
            color: #000000;
            padding: 8px 12px;
            font-size: 13.5px;
            border-radius: 4px;
          }
          .clear-fix {
            clear: both;
          }

          /* 6. Notes & Guidelines */
          .notes-section {
            text-align: center;
            margin-top: 16px;
            border-top: 1.5px dashed #cbd5e1;
            padding-top: 14px;
          }
          .notes-heading {
            font-size: 16px;
            font-weight: bold;
            color: #e10600;
            margin: 0 0 3px 0;
            letter-spacing: 0.2px;
          }
          .notes-subheading {
            margin: 0;
            font-size: 12.5px;
            font-weight: bold;
            color: #1e293b;
          }
          .bullet-table {
            width: 100%;
            margin-top: 10px;
            font-size: 12px;
            text-align: left;
            color: #475569;
            line-height: 1.5;
          }
          .bullet-table td {
            padding: 4px 0;
            vertical-align: top;
          }
          
          /* 7. Certification & QR Code */
          .cert-qr-table {
            width: 100%;
            margin-top: 16px;
            border-collapse: collapse;
          }
          .cert-text {
            font-size: 12.5px;
            font-weight: bold;
            color: #0f172a;
            vertical-align: middle;
            text-align: left;
            width: 75%;
            line-height: 1.5;
          }
          .qr-side {
            width: 25%;
            text-align: right;
            vertical-align: middle;
          }
          .qr-image {
            width: 82px;
            height: 82px;
            border: 1.5px solid #cbd5e1;
            padding: 3px;
            background: white;
            border-radius: 6px;
            display: inline-block;
          }

          /* 8. Bottom Hub Contact & Support Panel */
          .footer-panel {
            background: #0f172a;
            color: #f8fafc;
            border-radius: 8px;
            padding: 12px 16px;
            margin-top: 16px;
            text-align: center;
            font-size: 11.5px;
            line-height: 1.5;
          }
          .footer-bold {
            color: #ffd700;
            font-weight: bold;
            font-size: 13.5px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
        </div>

        <div class="receipt-card">
          <!-- 1. Header logo and Title -->
          <table class="header-table">
            <tr>
              <td class="logo-side">
                <div style="background: #000000; padding: 8px 14px; border-radius: 8px; display: inline-block; box-shadow: 0 3px 6px rgba(0,0,0,0.15); border: 1px solid #1e293b;">
                  <img src="/Logo1.png" class="logo-img" alt="Next Gear Logo" style="display: block; height: 44px; width: auto;" />
                </div>
              </td>
              <td class="title-side">
                <h1 class="receipt-heading">BOOKING RECEIPT</h1>
                <div class="subtitle">Next Gear Bike And Car Rental</div>
              </td>
            </tr>
          </table>

          <!-- 2. MSME bar -->
          <div class="msme-bar">
            <span>Udyam Registered MSME - UDYAM-PB-11-0049303</span>
            <span class="rec-badge">${recId}</span>
          </div>

          <!-- 3. Details Card blocks -->
          <table class="details-table">
            <tr>
              <td class="details-cell">
                <div class="details-card">
                  <div class="card-title">Customer Details</div>
                  <div class="info-line"><span class="label">Name:</span> ${booking.customerName}</div>
                  <div class="info-line"><span class="label">📍 Address:</span> ${locationInfo.customerAddressLine}</div>
                </div>
              </td>
              <td class="details-cell">
                <div class="details-card">
                  <div class="card-title">Booking Details</div>
                  <div class="info-line"><span class="label">Booking Date:</span> ${currentDate}</div>
                  <div class="info-line"><span class="label">Rental Period:</span> ${formattedStartDate} to ${formattedEndDate}</div>
                  <div class="info-line"><span class="label">Duration:</span> ${durationText}</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- 4. Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Rental Rate</th>
                <th>Deposit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="img-cell">
                  <img src="${vehicleImgSrc}" class="vehicle-img" alt="${booking.vehicleTitle}" onError="this.src='/Logo1.png';" />
                </td>
                <td style="text-align: left; font-weight: 500;">
                  ${vehicleType.toUpperCase()}
                  <div class="name-subtext">${booking.vehicleTitle}</div>
                </td>
                <td style="text-align: center;">${durationText}</td>
                <td style="text-align: center;">₹${deposit.toLocaleString("en-IN")}</td>
                <td style="text-align: right; font-weight: bold;">₹${totalAmount.toLocaleString("en-IN")}</td>
              </tr>
              <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="4" style="text-align: right; border-bottom: none; padding: 7px 10px;">Total</td>
                <td style="text-align: right; border-bottom: none; padding: 7px 10px;">₹${totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <!-- 5. Payment details right table -->
          <table class="pricing-table">
            <tr>
              <td style="text-align: left; color: #64748b;">Booking Amount (Paid)</td>
              <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${bookingAmount.toLocaleString("en-IN")}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align: left;">Balance on Pickup</td>
              <td style="text-align: right;">₹${balanceAmount.toLocaleString("en-IN")}</td>
            </tr>
          </table>
          <div class="clear-fix"></div>

          <!-- 6. Footer Notes / Thank you -->
          <div class="notes-section">
            <h3 class="notes-heading">Thank you for booking with Next Gear!</h3>
            <p class="notes-subheading">Have a safe and enjoyable ride!</p>
            
            <table class="bullet-table">
              <tr>
                <td style="width: 18px; font-weight: bold; color: #e10600;">•</td>
                <td>Please present original Driving License and valid ID proof at the time of pick-up.</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #e10600;">•</td>
                <td>Security deposit (if applicable) is 100% refundable upon vehicle return in original condition.</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #e10600;">•</td>
                <td>Late return charges may apply as per company policy (please inform 3 hours in advance for trip extension).</td>
              </tr>
            </table>
          </div>

          <!-- 7. Certification and QR -->
          <table class="cert-qr-table">
            <tr>
              <td class="cert-text">
                Certified MSME Enterprise under Udyam Registration<br/>
                <span style="color: #9e0a0a; font-size: 14px; font-weight: 800;">UDYAM-PB-11-0049303</span>
              </td>
              <td class="qr-side">
                <img src="${qrCodeImageUrl}" class="qr-image" alt="Verification QR Code" />
              </td>
            </tr>
          </table>

          <!-- 8. Footer Hub Location & Support Email Panel -->
          <div class="footer-panel">
            <div class="footer-bold">${locationInfo.hubName} &nbsp;|&nbsp; 📧 <span style="color: white;">support@next-gear.app</span></div>
            <p style="margin: 4px 0 0 0; color: #f1f5f9; font-size: 11px; font-weight: bold;">
              Pickup Location: ${locationInfo.hubAddress}
            </p>
            <p style="margin: 5px 0 0 0; color: #cbd5e1; font-size: 10px;">
              We provide bikes and cars on rent. For pickup instructions, tour assistance, or support, email us at support@next-gear.app.
            </p>
          </div>
        </div>

        <script>
          window.onload = function() {
            // Wait for all images to complete loading to avoid blank spaces on print
            const images = Array.from(document.querySelectorAll('img'));
            const promises = images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // proceed even if image fails
              });
            });
            Promise.all(promises).then(() => {
              setTimeout(() => {
                window.print();
              }, 350);
            });
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error("Failed to generate booking receipt:", error);
    alert("Could not generate booking receipt. Please try again.");
  }
}
