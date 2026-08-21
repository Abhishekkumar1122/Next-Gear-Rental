import { createContactRequest } from "@/lib/contact-requests";
import { NextResponse } from "next/server";
import { z } from "zod";

const contactPayloadSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address (e.g. name@gmail.com)").max(160),
  phone: z.string().trim().min(7, "Please enter a valid phone number").max(24),
  message: z.string().trim().min(2, "Message must be at least 2 characters").max(1200),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = contactPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstErrorMessage =
      fieldErrors.email?.[0] ||
      fieldErrors.message?.[0] ||
      fieldErrors.fullName?.[0] ||
      fieldErrors.phone?.[0] ||
      "Invalid contact message details. Please check your input.";

    return NextResponse.json(
      { error: firstErrorMessage, details: fieldErrors },
      { status: 400 }
    );
  }

  const contactRequest = await createContactRequest(parsed.data);

  try {
    const { logEmailMessage } = await import("@/lib/email-log-store");
    logEmailMessage({
      type: "incoming",
      category: "contact_inquiry",
      from: parsed.data.email,
      to: "support@next-gear.app",
      subject: `Inquiry from ${parsed.data.fullName} (${parsed.data.phone})`,
      message: parsed.data.message,
      status: "received",
    });
  } catch (e) {
    console.error("[Contact Email Log Failed]", e);
  }

  // Send real email via Resend if RESEND_API_KEY is configured
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const { generateContactAdminAlertHtml, generateContactReceiptEmailHtml } = await import("@/lib/email-templates");
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Next Gear <noreply@next-gear.app>";
      const supportEmail = "support@next-gear.app";

      // 1. Send alert to support team
      await resend.emails.send({
        from: fromEmail,
        to: supportEmail,
        subject: `⚡ [New Inquiry] ${parsed.data.fullName} - Next Gear Contact`,
        html: generateContactAdminAlertHtml({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
        }),
      });

      // 2. Send confirmation receipt to customer
      await resend.emails.send({
        from: fromEmail,
        to: parsed.data.email,
        subject: "✨ We received your message - NEXT GEAR Support",
        html: generateContactReceiptEmailHtml({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
        }),
      });
    } catch (err) {
      console.error("[Contact API] Failed to send email via Resend:", err);
    }
  }

  return NextResponse.json({ message: "Message sent successfully", contactRequest }, { status: 201 });
}
