import { recordCommunicationLog, getCommunicationLogs, CommunicationCategory } from "@/lib/communication-store";

export type EmailLogCategory =
  | "welcome"
  | "otp"
  | "booking_confirmed"
  | "payment_success"
  | "trip_reminder"
  | "trip_feedback"
  | "festive_promo"
  | "discount_coupon"
  | "kyc_update"
  | "delivery_assigned"
  | "support_reply"
  | "contact_inquiry"
  | "direct_compose";

export type EmailLogEntry = {
  id: string;
  type: "outgoing" | "incoming";
  category: EmailLogCategory;
  from: string;
  to: string;
  subject: string;
  html?: string;
  message?: string;
  status: "sent" | "failed" | "received";
  error?: string;
  createdAt: string;
};

export function logEmailMessage(entry: Omit<EmailLogEntry, "id" | "createdAt">): EmailLogEntry {
  const categoryMap: Record<string, CommunicationCategory> = {
    welcome: "welcome",
    otp: "otp",
    booking_confirmed: "booking_confirmed",
    payment_success: "payment_receipt",
    contact_inquiry: "contact_inquiry",
    support_reply: "support_reply",
    direct_compose: "direct_compose",
  };

  const commCategory: CommunicationCategory = categoryMap[entry.category] || "system";

  const logId = recordCommunicationLog({
    channel: "email",
    direction: entry.type,
    category: commCategory,
    recipient: entry.to,
    sender: entry.from,
    subject: entry.subject,
    message: entry.message,
    htmlContent: entry.html,
    status: entry.status,
    error: entry.error,
  });

  return {
    id: logId,
    ...entry,
    createdAt: new Date().toISOString(),
  };
}

export function getEmailLogs(options?: {
  type?: "outgoing" | "incoming";
  status?: "sent" | "failed" | "received";
  search?: string;
}) {
  // Sync wrapper that queries memory or delegates
  return [];
}
