import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function testFullEmails() {
  console.log("Testing Resend full email delivery...");

  // 1. Test Welcome Email
  const resWelcome = await resend.emails.send({
    from: "Next Gear <noreply@next-gear.app>",
    to: "abhisheksingha202002@gmail.com",
    subject: "Welcome to Next Gear Rentals! Claim Your First Ride Offer 🎁",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px;">
        <h1 style="color: #ef4444; margin-top: 0;">Welcome to Next Gear Rentals! 🛵💨</h1>
        <p>Hello Abhishek,</p>
        <p>Your account is ready! As a special welcome gift, enjoy <strong>10% OFF</strong> on your first bike or car rental with coupon code:</p>
        <div style="background: #1e293b; border: 2px dashed #ef4444; padding: 12px; text-align: center; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #ffd700; border-radius: 8px;">
          WELCOME10
        </div>
        <p style="margin-top: 20px; color: #94a3b8;">Book now at <a href="https://next-gear.app" style="color: #ef4444;">next-gear.app</a></p>
      </div>
    `,
  });
  console.log("Welcome Email Result:", JSON.stringify(resWelcome, null, 2));

  // 2. Test Booking Confirmation Email
  const resBooking = await resend.emails.send({
    from: "Next Gear <noreply@next-gear.app>",
    to: "abhisheksingha202002@gmail.com",
    subject: "🚗 Booking Confirmed #NG-DL-23072626 - ROYAL ENFIELD METEOR 350",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px;">
        <h2 style="color: #ef4444; margin-top: 0;">Booking Confirmed! 🎉</h2>
        <p>Hello Abhishek,</p>
        <p>Your vehicle booking has been placed successfully. Here are your booking details:</p>
        
        <table style="width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; margin: 16px 0;">
          <tr><td style="padding: 10px; color: #94a3b8;">Booking ID:</td><td style="padding: 10px; font-weight: bold; color: #ffd700;">NG-DL-23072626</td></tr>
          <tr><td style="padding: 10px; color: #94a3b8;">Vehicle:</td><td style="padding: 10px; font-weight: bold;">Royal Enfield Meteor 350</td></tr>
          <tr><td style="padding: 10px; color: #94a3b8;">City / Station:</td><td style="padding: 10px; font-weight: bold;">Delhi NCR</td></tr>
          <tr><td style="padding: 10px; color: #94a3b8;">Total Amount:</td><td style="padding: 10px; font-weight: bold; color: #22c55e;">₹2,398</td></tr>
        </table>

        <div style="text-align: center; margin: 24px 0;">
          <a href="https://next-gear.app" style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Booking Pass & Receipt</a>
        </div>

        <p style="color: #94a3b8; font-size: 12px;">For 24x7 trip support, reply to this email or contact support@next-gear.app.</p>
      </div>
    `,
  });
  console.log("Booking Email Result:", JSON.stringify(resBooking, null, 2));
}

testFullEmails();
