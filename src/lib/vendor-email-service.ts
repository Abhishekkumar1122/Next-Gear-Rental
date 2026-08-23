import { dispatchAlert, dispatchHtmlEmail } from "@/lib/alert-dispatch";
import { wrapInMasterEmailTemplate } from "@/lib/email-templates";

// ─── Application Received Notification ────────────────────────────────────────

interface VendorApplicationReceivedInput {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  applicationId: string;
  baseUrl?: string;
}

export async function sendVendorApplicationReceivedNotification(input: VendorApplicationReceivedInput) {
  const baseUrl = input.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://next-gear.app";
  const uploadUrl = `${baseUrl}/vendor-kyc?id=${encodeURIComponent(input.applicationId)}&phone=${encodeURIComponent(input.phone)}`;

  // 1. Generate HTML Email
  const emailContentHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #f4f4f5; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: rgba(225, 6, 0, 0.15); border: 1px solid rgba(225, 6, 0, 0.3); color: #e10600; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 14px; border-radius: 999px;">
          📋 APPLICATION RECEIVED
        </span>
      </div>

      <h2 style="font-size: 22px; font-weight: 900; color: #ffffff; margin-top: 0; text-align: center;">
        Hi ${input.contactName}! We've received your application.
      </h2>
      <p style="font-size: 14px; color: #a1a1aa; text-align: center; margin-bottom: 28px;">
        Your vendor interest for <strong style="color: #ffffff;">${input.businessName}</strong> has been submitted to Next Gear.
        Our team will review and contact you within <strong style="color: #ffffff;">24 hours</strong>.
      </p>

      <!-- Application ID Box -->
      <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 24px; margin-bottom: 28px; text-align: center;">
        <p style="font-size: 12px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px;">Your Application ID</p>
        <p style="font-size: 28px; font-weight: 900; color: #e10600; font-family: monospace; margin: 0; letter-spacing: 0.1em;">${input.applicationId}</p>
        <p style="font-size: 11px; color: #71717a; margin: 8px 0 0;">Save this ID to check your status and upload documents.</p>
      </div>

      <!-- Upload CTA -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${uploadUrl}" target="_blank" style="display: inline-block; background-color: #e10600; color: #ffffff; font-weight: 900; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(225, 6, 0, 0.4);">
          📎 Upload KYC Documents Now →
        </a>
      </div>

      <!-- Next Steps -->
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px;">
        <p style="font-size: 12px; font-weight: 800; color: #ffffff; text-transform: uppercase; margin-top: 0; margin-bottom: 10px;">📋 What Happens Next:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #a1a1aa; line-height: 1.8;">
          <li>Upload your KYC documents (shop photo, Aadhaar, PAN, RC, etc.).</li>
          <li>Our team verifies documents and contacts you for onboarding.</li>
          <li>Vendor dashboard login credentials are sent on approval.</li>
        </ul>
      </div>
    </div>
  `;

  const fullHtml = wrapInMasterEmailTemplate({
    title: `Application Received — ${input.businessName} [Next Gear]`,
    preheader: `Your Application ID is ${input.applicationId}. Upload documents to speed up verification.`,
    contentHtml: emailContentHtml,
  });

  const emailPromise = dispatchHtmlEmail({
    to: input.email,
    subject: `📋 Application Received — ID: ${input.applicationId} [Next Gear]`,
    html: fullHtml,
  });

  // 2. WhatsApp notification
  const whatsappMessage = `📋 *APPLICATION RECEIVED — NEXT GEAR*

Hi ${input.contactName}! Your vendor application has been submitted successfully.

🆔 *Application ID:* ${input.applicationId}
🏢 *Business:* ${input.businessName}

📎 *Speed up your KYC — upload documents now:*
👉 ${uploadUrl}

Our team will review and contact you within 24 hours.

_Save your Application ID to track status anytime at next-gear.app/vendor-registration_

— Next Gear Partner Team`;

  const whatsappPromise = dispatchAlert({
    channel: "whatsapp",
    to: input.phone,
    message: whatsappMessage,
  });

  await Promise.allSettled([emailPromise, whatsappPromise]);
}

// ─── Vendor Approval Notification ─────────────────────────────────────────────

interface VendorApprovalNotificationInput {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  tempPassword: string;
  commissionRate: number | string;
  baseUrl?: string;
}

export async function sendVendorApprovalEmailAndWhatsApp(input: VendorApprovalNotificationInput) {
  const baseUrl = input.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://next-gear.app";
  const loginUrl = `${baseUrl}/login`;

  // 1. Generate HTML Email Template
  const emailContentHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #f4f4f5; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 14px; rounded-full;">
          🎉 PARTNER APPLICATION APPROVED
        </span>
      </div>

      <h2 style="font-size: 22px; font-weight: 900; color: #ffffff; margin-top: 0; text-align: center;">
        Welcome to Next Gear Fleet Network, ${input.contactName}!
      </h2>
      <p style="font-size: 14px; color: #a1a1aa; text-align: center; margin-bottom: 28px;">
        Your vendor account for <strong style="color: #ffffff;">${input.businessName}</strong> has been officially approved and activated by our team.
      </p>

      <!-- Credentials Box -->
      <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 24px; margin-bottom: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <h3 style="font-size: 13px; font-weight: 800; color: #e10600; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #27272a;">
          🔑 Your Vendor Partner Credentials
        </h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa; width: 140px;">Business Name:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700;">${input.businessName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Login Email ID:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; font-family: monospace;">${input.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Password:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: 800; font-family: monospace; font-size: 16px;">${input.tempPassword}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a1a1aa;">Commission Rate:</td>
            <td style="padding: 8px 0; color: #f59e0b; font-weight: 700;">${input.commissionRate}% Payout Share</td>
          </tr>
        </table>
      </div>

      <!-- Action CTA Button -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #e10600; color: #ffffff; font-weight: 900; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(225, 6, 0, 0.4);">
          🚀 Login to Vendor Dashboard →
        </a>
      </div>

      <!-- Next Steps checklist -->
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px;">
        <p style="font-size: 12px; font-weight: 800; color: #ffffff; text-transform: uppercase; margin-top: 0; margin-bottom: 10px;">
          📋 Quick Start Guide for New Vendors:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #a1a1aa; line-height: 1.8;">
          <li>Log into your vendor portal using the email and password above.</li>
          <li>Add your bikes/cars fleet with photos, pricing, and city location.</li>
          <li>Receive instant booking notifications on email and WhatsApp!</li>
        </ul>
      </div>
    </div>
  `;

  const fullHtml = wrapInMasterEmailTemplate({
    title: `Vendor Account Approved — ${input.businessName}`,
    preheader: `Your Next Gear Vendor account is active. Login ID: ${input.email}`,
    contentHtml: emailContentHtml,
  });

  // 2. Dispatch Email
  const emailPromise = dispatchHtmlEmail({
    to: input.email,
    subject: `🎉 Vendor Partner Approved — ${input.businessName} [Next Gear]`,
    html: fullHtml,
  });

  // 3. Dispatch WhatsApp Notification
  const whatsappMessage = `🎉 *CONGRATULATIONS ${input.contactName.toUpperCase()}!*

Your Next Gear Vendor Account for *${input.businessName}* has been APPROVED!

🔑 *Vendor Login Details:*
• Portal: ${loginUrl}
• Login ID: ${input.email}
• Password: ${input.tempPassword}
• Commission Share: ${input.commissionRate}%

Start adding your fleet to receive instant bookings on Next Gear!`;

  const whatsappPromise = dispatchAlert({
    channel: "whatsapp",
    to: input.phone,
    message: whatsappMessage,
  });

  await Promise.allSettled([emailPromise, whatsappPromise]);
}
