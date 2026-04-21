export type AlertChannel = "email" | "sms" | "whatsapp";

export type AlertDispatchInput = {
  channel: AlertChannel;
  to: string;
  message: string;
};

export type AlertDispatchResult = {
  provider: "mock" | "twilio";
  deliveryStatus: "sent" | "failed";
  providerMessageId?: string;
  error?: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "").trim();
}

export async function dispatchAlert(input: AlertDispatchInput): Promise<AlertDispatchResult> {
  const to = input.to.trim();
  if (!to || !input.message.trim()) {
    return { provider: "mock", deliveryStatus: "failed", error: "Missing destination or message" };
  }

  if (input.channel === "sms" || input.channel === "whatsapp") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = input.channel === "whatsapp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_PHONE_NUMBER;

    if (sid && token && from) {
      try {
        const body = new URLSearchParams();
        body.set("To", input.channel === "whatsapp" ? `whatsapp:${normalizePhone(to)}` : normalizePhone(to));
        body.set("From", input.channel === "whatsapp" ? `whatsapp:${normalizePhone(from)}` : normalizePhone(from));
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

  return {
    provider: "mock",
    deliveryStatus: "sent",
    providerMessageId: `mock-${Date.now()}`,
  };
}
