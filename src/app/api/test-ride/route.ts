import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, city, vehicleType, message } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number" }, { status: 400 });
    }

    const settings = await getSiteSettings();

    // Send WhatsApp notification to admin
    const adminPhone = settings.phone || "9523765172";
    const whatsappMsg = encodeURIComponent(
      `🏍️ NEW ₹1 TEST RIDE REQUEST!\n\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `City: ${city || "Not specified"}\n` +
      `Vehicle Type: ${vehicleType || settings.testRideVehicleType}\n` +
      `Message: ${message || "None"}\n\n` +
      `Reply to confirm the test ride booking!`
    );

    // Try to notify via Resend email if configured
    let emailSent = false;
    if (process.env.RESEND_API_KEY && settings.businessEmail) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Next Gear <noreply@next-gear.app>",
          to: [settings.businessEmail],
          subject: `🏍️ New ₹1 Test Ride Request — ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px;">
              <h2 style="color: #dc2626;">🏍️ New ₹1 Test Ride Request</h2>
              <table style="width:100%; border-collapse: collapse;">
                <tr><td style="padding:8px; font-weight:bold;">Name</td><td style="padding:8px;">${name}</td></tr>
                <tr><td style="padding:8px; font-weight:bold;">Phone</td><td style="padding:8px;">${phone}</td></tr>
                <tr><td style="padding:8px; font-weight:bold;">City</td><td style="padding:8px;">${city || "Not specified"}</td></tr>
                <tr><td style="padding:8px; font-weight:bold;">Vehicle Type</td><td style="padding:8px;">${vehicleType || settings.testRideVehicleType}</td></tr>
                <tr><td style="padding:8px; font-weight:bold;">Message</td><td style="padding:8px;">${message || "None"}</td></tr>
              </table>
              <p style="color:#666;">Reply to confirm this test ride booking.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (e) {
        console.warn("Email notification failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Test ride request submitted successfully!",
      whatsappUrl: `https://wa.me/${adminPhone}?text=${whatsappMsg}`,
      emailSent,
    });
  } catch (err) {
    console.error("Test ride API error:", err);
    return NextResponse.json({ error: "Failed to submit test ride request" }, { status: 500 });
  }
}
