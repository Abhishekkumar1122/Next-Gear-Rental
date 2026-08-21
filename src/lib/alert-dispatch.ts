export type AlertChannel = "email" | "sms" | "whatsapp";

export type AlertDispatchInput = {
  channel: AlertChannel;
  to: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
  templateLang?: string;
};

export type AlertDispatchResult = {
  provider: "mock" | "twilio" | "whatsapp_cloud";
  deliveryStatus: "sent" | "failed";
  providerMessageId?: string;
  error?: string;
};

function normalizePhone(phone: string) {
  const digitsOnly = phone.replace(/[^\d+]/g, "").trim();
  if (!digitsOnly) return "";
  if (digitsOnly.startsWith("+")) return digitsOnly;
  if (digitsOnly.length === 10) return `+91${digitsOnly}`;
  return `+${digitsOnly}`;
}

export async function dispatchAlert(input: AlertDispatchInput): Promise<AlertDispatchResult> {
  const to = input.to.trim();
  if (!to || !input.message.trim()) {
    return { provider: "mock", deliveryStatus: "failed", error: "Missing destination or message" };
  }

  // Handle Email Channel via Resend
  if (input.channel === "email" && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const { wrapInMasterEmailTemplate } = await import("@/lib/email-templates");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Next Gear <noreply@next-gear.app>";

      const html = wrapInMasterEmailTemplate({
        title: "NEXT GEAR Notification",
        preheader: input.message.slice(0, 100),
        contentHtml: `<div style="font-size: 14px; line-height: 1.6; color: #f4f4f5; white-space: pre-wrap;">${input.message}</div>`,
      });

      const res = await resend.emails.send({
        from: fromEmail,
        to,
        subject: "NEXT GEAR Notification",
        html,
      });

      if (res.error) {
        console.error("[Resend Notification Error]", res.error);
        return {
          provider: "mock",
          deliveryStatus: "failed",
          error: res.error.message,
        };
      }

      console.log(`[Resend Notification Sent] ID: ${res.data?.id} | To: ${to}`);
      return {
        provider: "mock",
        deliveryStatus: "sent",
        providerMessageId: res.data?.id ?? `resend-${Date.now()}`,
      };
    } catch (err) {
      console.error("[Email Dispatch Failed]", err);
      return {
        provider: "mock",
        deliveryStatus: "failed",
        error: err instanceof Error ? err.message : "Email dispatch failed",
      };
    }
  }

  if (input.channel === "whatsapp") {
    // 1. Check for Meta WhatsApp Cloud API credentials
    const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId) {
      try {
        const recipientPhone = normalizePhone(to).replace("+", "");
        console.log(`[Meta WhatsApp] Dispatching to recipientPhone: ${recipientPhone}...`);

        const requestBody = input.templateName
          ? {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: recipientPhone,
              type: "template",
              template: {
                name: input.templateName,
                language: { code: input.templateLang || "en_US" },
                components: input.templateParams && input.templateParams.length > 0
                  ? [
                      {
                        type: "body",
                        parameters: input.templateParams.map((val) => ({ type: "text", text: val })),
                      },
                    ]
                  : undefined,
              },
            }
          : {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: recipientPhone,
              type: "text",
              text: { preview_url: true, body: input.message },
            };

        const response = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${metaToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          messages?: { id: string }[];
          error?: { message: string; code?: number; type?: string; fbtrace_id?: string; error_data?: { details?: string } };
        };

        if (!response.ok) {
          console.error(`[Meta WhatsApp Failed] Status: ${response.status}`, JSON.stringify(payload, null, 2));
          return {
            provider: "whatsapp_cloud",
            deliveryStatus: "failed",
            error: payload.error?.error_data?.details || payload.error?.message || `Meta Cloud API error (${response.status})`,
          };
        }

        console.log(`[Meta WhatsApp Success] Message ID: ${payload.messages?.[0]?.id}`);
        return {
          provider: "whatsapp_cloud",
          deliveryStatus: "sent",
          providerMessageId: payload.messages?.[0]?.id,
        };
      } catch (error) {
        console.error(`[Meta WhatsApp Exception]`, error);
        return {
          provider: "whatsapp_cloud",
          deliveryStatus: "failed",
          error: error instanceof Error ? error.message : "Meta Cloud API request failed",
        };
      }
    }
  }

  if (input.channel === "sms" || input.channel === "whatsapp") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = input.channel === "whatsapp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_PHONE_NUMBER;

    if (sid && token && from) {
      try {
        const formattedTo = normalizePhone(to);
        const formattedFrom = normalizePhone(from);

        const body = new URLSearchParams();
        body.set("To", input.channel === "whatsapp" ? `whatsapp:${formattedTo}` : formattedTo);
        body.set("From", input.channel === "whatsapp" ? `whatsapp:${formattedFrom}` : formattedFrom);
        body.set("Body", input.message);

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        const payload = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
        if (!response.ok) {
          return {
            provider: "twilio",
            deliveryStatus: "failed",
            error: payload.message || `Twilio error (${response.status})`,
          };
        }

        return {
          provider: "twilio",
          deliveryStatus: "sent",
          providerMessageId: payload.sid,
        };
      } catch (error) {
        return {
          provider: "twilio",
          deliveryStatus: "failed",
          error: error instanceof Error ? error.message : "Twilio request failed",
        };
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[WhatsApp/SMS Mock Dispatch] Channel: ${input.channel} | To: ${to}\nMessage:\n${input.message}`);
  }

  return {
    provider: "mock",
    deliveryStatus: "sent",
    providerMessageId: `mock-${Date.now()}`,
  };
}

export async function dispatchHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}): Promise<AlertDispatchResult> {
  const to = input.to.trim();
  if (!to || !input.html.trim()) {
    return { provider: "mock", deliveryStatus: "failed", error: "Missing destination or html" };
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Next Gear <noreply@next-gear.app>";

      const res = await resend.emails.send({
        from: fromEmail,
        to,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      });

      if (res.error) {
        console.error(`[Resend HTML Email Error] To: ${to} | Error:`, res.error);
        return {
          provider: "mock",
          deliveryStatus: "failed",
          error: res.error.message,
        };
      }

      console.log(`[Resend HTML Email Sent Successfully] ID: ${res.data?.id} | To: ${to} | Subject: ${input.subject}`);
      return {
        provider: "mock",
        deliveryStatus: "sent",
        providerMessageId: res.data?.id ?? `resend-${Date.now()}`,
      };
    } catch (err) {
      console.error("[HTML Email Dispatch Failed]", err);
      return {
        provider: "mock",
        deliveryStatus: "failed",
        error: err instanceof Error ? err.message : "HTML email dispatch failed",
      };
    }
  }

  try {
    const { logEmailMessage } = await import("@/lib/email-log-store");
    logEmailMessage({
      type: "outgoing",
      category: "direct_compose",
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@next-gear.app",
      to,
      subject: input.subject,
      html: input.html,
      status: "sent",
    });
  } catch (e) {
    console.error("[Email Log Error]", e);
  }

  console.log(`[Mock HTML Email Sent] To: ${to} | Subject: ${input.subject}`);
  return { provider: "mock", deliveryStatus: "sent", providerMessageId: `mock-${Date.now()}` };
}
