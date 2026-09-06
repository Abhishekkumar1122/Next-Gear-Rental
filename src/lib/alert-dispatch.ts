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
  let digitsOnly = phone.replace(/[^\d+]/g, "").trim();
  if (!digitsOnly) return "";
  if (digitsOnly.startsWith("+")) {
    digitsOnly = digitsOnly.replace(/^\+/, "");
  }
  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1);
  }
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }
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

      const resResult: AlertDispatchResult = res.error
        ? { provider: "mock", deliveryStatus: "failed", error: res.error.message }
        : { provider: "mock", deliveryStatus: "sent", providerMessageId: res.data?.id ?? `resend-${Date.now()}` };

      try {
        const { recordCommunicationLog } = await import("@/lib/communication-store");
        recordCommunicationLog({
          channel: "email",
          direction: "outgoing",
          category: input.templateName?.includes("otp") ? "otp" : "system",
          recipient: to,
          sender: fromEmail,
          subject: "NEXT GEAR Notification",
          message: input.message,
          htmlContent: html,
          status: resResult.deliveryStatus,
          error: resResult.error,
        });
      } catch (logErr) {
        console.warn("[Communication Log Error]", logErr);
      }

      if (res.error) {
        console.error("[Resend Notification Error]", res.error);
        return resResult;
      }

      console.log(`[Resend Notification Sent] ID: ${res.data?.id} | To: ${to}`);
      return resResult;
    } catch (err) {
      console.error("[Email Dispatch Failed]", err);
      const errResult: AlertDispatchResult = {
        provider: "mock",
        deliveryStatus: "failed",
        error: err instanceof Error ? err.message : "Email dispatch failed",
      };
      try {
        const { recordCommunicationLog } = await import("@/lib/communication-store");
        recordCommunicationLog({
          channel: "email",
          direction: "outgoing",
          category: "system",
          recipient: to,
          sender: "noreply@next-gear.app",
          subject: "NEXT GEAR Notification",
          message: input.message,
          status: "failed",
          error: errResult.error,
        });
      } catch {}
      return errResult;
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

        const templateLang = input.templateLang || "en";
        let components: Array<{ type: string; parameters?: Array<{ type: string; text?: string; [key: string]: unknown }>; sub_type?: string; index?: string }> | undefined = undefined;

        if (input.templateParams && input.templateParams.length > 0) {
          components = [
            {
              type: "body",
              parameters: input.templateParams.map((val) => ({ type: "text", text: val })),
            },
          ];

          if (input.templateName?.startsWith("auth_")) {
            components.push({
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: input.templateParams[0] }],
            });
          }
        }

        const requestBody = input.templateName
          ? {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: recipientPhone,
              type: "template",
              template: {
                name: input.templateName,
                language: { code: templateLang },
                components,
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

        const isSuccess = response.ok;
        const resultErr = !isSuccess
          ? payload.error?.error_data?.details || payload.error?.message || `Meta Cloud API error (${response.status})`
          : undefined;

        const waResult: AlertDispatchResult = {
          provider: "whatsapp_cloud",
          deliveryStatus: isSuccess ? "sent" : "failed",
          providerMessageId: payload.messages?.[0]?.id,
          error: resultErr,
        };

        try {
          const { recordCommunicationLog } = await import("@/lib/communication-store");
          const isOtp = input.templateName?.includes("auth") || input.templateName?.includes("otp") || input.message.toLowerCase().includes("verification code");
          recordCommunicationLog({
            channel: "whatsapp",
            direction: "outgoing",
            category: isOtp ? "otp" : input.templateName?.includes("booking") ? "booking_confirmed" : "system",
            recipient: to,
            sender: "Next Gear WhatsApp",
            subject: input.templateName ? `WhatsApp: ${input.templateName}` : "WhatsApp Alert",
            message: input.message,
            status: waResult.deliveryStatus,
            error: waResult.error,
          });
        } catch {}

        if (!isSuccess) {
          console.error(`[Meta WhatsApp Failed] Status: ${response.status}`, JSON.stringify(payload, null, 2));
        } else {
          console.log(`[Meta WhatsApp Success] Message ID: ${payload.messages?.[0]?.id}`);
        }

        return waResult;
      } catch (error) {
        console.error(`[Meta WhatsApp Exception]`, error);
        const waErr: AlertDispatchResult = {
          provider: "whatsapp_cloud",
          deliveryStatus: "failed",
          error: error instanceof Error ? error.message : "Meta Cloud API request failed",
        };
        try {
          const { recordCommunicationLog } = await import("@/lib/communication-store");
          recordCommunicationLog({
            channel: "whatsapp",
            direction: "outgoing",
            category: input.templateName?.includes("auth") ? "otp" : "system",
            recipient: to,
            sender: "Next Gear WhatsApp",
            subject: "WhatsApp Alert",
            message: input.message,
            status: "failed",
            error: waErr.error,
          });
        } catch {}
        return waErr;
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
        const twilioResult: AlertDispatchResult = {
          provider: "twilio",
          deliveryStatus: response.ok ? "sent" : "failed",
          providerMessageId: payload.sid,
          error: !response.ok ? (payload.message || `Twilio error (${response.status})`) : undefined,
        };

        try {
          const { recordCommunicationLog } = await import("@/lib/communication-store");
          recordCommunicationLog({
            channel: input.channel,
            direction: "outgoing",
            category: "system",
            recipient: to,
            sender: "Next Gear " + input.channel.toUpperCase(),
            subject: `${input.channel.toUpperCase()} Alert`,
            message: input.message,
            status: twilioResult.deliveryStatus,
            error: twilioResult.error,
          });
        } catch {}

        return twilioResult;
      } catch (error) {
        const twilioErr: AlertDispatchResult = {
          provider: "twilio",
          deliveryStatus: "failed",
          error: error instanceof Error ? error.message : "Twilio request failed",
        };
        try {
          const { recordCommunicationLog } = await import("@/lib/communication-store");
          recordCommunicationLog({
            channel: input.channel,
            direction: "outgoing",
            category: "system",
            recipient: to,
            sender: "Next Gear " + input.channel.toUpperCase(),
            subject: `${input.channel.toUpperCase()} Alert`,
            message: input.message,
            status: "failed",
            error: twilioErr.error,
          });
        } catch {}
        return twilioErr;
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[WhatsApp/SMS Mock Dispatch] Channel: ${input.channel} | To: ${to}\nMessage:\n${input.message}`);
  }

  try {
    const { recordCommunicationLog } = await import("@/lib/communication-store");
    recordCommunicationLog({
      channel: input.channel,
      direction: "outgoing",
      category: input.templateName?.includes("otp") || input.templateName?.includes("auth") ? "otp" : "system",
      recipient: to,
      sender: "Next Gear " + input.channel.toUpperCase(),
      subject: `${input.channel.toUpperCase()} Message`,
      message: input.message,
      status: "sent",
    });
  } catch {}

  return {
    provider: "mock",
    deliveryStatus: "sent",
    providerMessageId: `mock-${Date.now()}`,
  };
}

const sentEmailDedupe = new Set<string>();

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

  const dedupeKey = `${to.toLowerCase()}:${input.subject.trim()}`;
  if (sentEmailDedupe.has(dedupeKey)) {
    console.log(`[Email Dedupe Guard] Suppressing duplicate email to ${to} for subject "${input.subject}"`);
    return {
      provider: "mock",
      deliveryStatus: "sent",
      providerMessageId: `dedupe-suppressed-${Date.now()}`,
    };
  }
  sentEmailDedupe.add(dedupeKey);
  setTimeout(() => sentEmailDedupe.delete(dedupeKey), 10 * 60 * 1000);

  const subLower = input.subject.toLowerCase();
  const category = subLower.includes("otp") || subLower.includes("verification")
    ? "otp"
    : subLower.includes("reset")
    ? "password_reset"
    : subLower.includes("booking")
    ? "booking_confirmed"
    : subLower.includes("welcome")
    ? "welcome"
    : "direct_compose";

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

      const emailResult: AlertDispatchResult = res.error
        ? { provider: "mock", deliveryStatus: "failed", error: res.error.message }
        : { provider: "mock", deliveryStatus: "sent", providerMessageId: res.data?.id ?? `resend-${Date.now()}` };

      try {
        const { recordCommunicationLog } = await import("@/lib/communication-store");
        recordCommunicationLog({
          channel: "email",
          direction: "outgoing",
          category,
          recipient: to,
          sender: fromEmail,
          subject: input.subject,
          message: input.subject,
          htmlContent: input.html,
          status: emailResult.deliveryStatus,
          error: emailResult.error,
        });
      } catch (logErr) {
        console.warn("[Communication Store Resend Log Warning]", logErr);
      }

      if (res.error) {
        console.error(`[Resend HTML Email Error] To: ${to} | Error:`, res.error);
        return emailResult;
      }

      console.log(`[Resend HTML Email Sent Successfully] ID: ${res.data?.id} | To: ${to} | Subject: ${input.subject}`);
      return emailResult;
    } catch (err) {
      console.error("[HTML Email Dispatch Failed]", err);
      const errResult: AlertDispatchResult = {
        provider: "mock",
        deliveryStatus: "failed",
        error: err instanceof Error ? err.message : "HTML email dispatch failed",
      };
      try {
        const { recordCommunicationLog } = await import("@/lib/communication-store");
        recordCommunicationLog({
          channel: "email",
          direction: "outgoing",
          category,
          recipient: to,
          sender: "noreply@next-gear.app",
          subject: input.subject,
          message: input.subject,
          htmlContent: input.html,
          status: "failed",
          error: errResult.error,
        });
      } catch {}
      return errResult;
    }
  }

  try {
    const { recordCommunicationLog } = await import("@/lib/communication-store");
    recordCommunicationLog({
      channel: "email",
      direction: "outgoing",
      category,
      recipient: to,
      sender: process.env.RESEND_FROM_EMAIL ?? "noreply@next-gear.app",
      subject: input.subject,
      message: input.subject,
      htmlContent: input.html,
      status: "sent",
    });
  } catch (e) {
    console.error("[Email Log Error]", e);
  }

  console.log(`[Mock HTML Email Sent] To: ${to} | Subject: ${input.subject}`);
  return { provider: "mock", deliveryStatus: "sent", providerMessageId: `mock-${Date.now()}` };
}
