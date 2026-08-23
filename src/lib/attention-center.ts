import { prisma } from "@/lib/prisma";
import { getVendorApplications } from "@/lib/vendor-applications";
import { getContactRequests } from "@/lib/contact-requests";
import { supportTickets } from "@/lib/mock-data";
import { unstable_cache } from "next/cache";

export type AttentionItem = {
  id: string;
  title: string;
  count: number;
  category: "approvals" | "finance" | "deliveries" | "inspections" | "refunds" | "damages" | "support" | "leads";
  severity: "critical" | "warning" | "info";
  description: string;
  actionLabel: string;
  targetHref: string;
  icon: string;
};

export type AttentionCenterData = {
  totalPendingCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  items: AttentionItem[];
  lastRefreshedAt: string;
};

export async function fetchAttentionCenterData(): Promise<AttentionCenterData> {
  const isDb = Boolean(process.env.DATABASE_URL);

  let pendingVendorApprovals = 0;
  let paymentWebhookIssues = 0;
  let deliveryDelays = 0;
  let vehiclesPendingInspection = 0;
  let pendingRefunds = 0;
  let pendingDamageSettlements = 0;
  let unresolvedSupportTickets = 0;
  let unreadContactRequests = 0;

  if (isDb) {
    try {
      const [
        vendorApps,
        failedWebhooks,
        failedRetryJobs,
        activeDeliveries,
        pendingInspections,
        refundedPayments,
        unsettledDamages,
        contactReqs,
      ] = await Promise.all([
        getVendorApplications().catch(() => []),
        prisma.webhookEventLog.count({ where: { status: "FAILED" } }).catch(() => 0),
        prisma.webhookRetryJob.count({ where: { status: "FAILED" } }).catch(() => 0),
        prisma.deliveryJob.count({ where: { status: { in: ["SCHEDULED", "EN_ROUTE"] } } }).catch(() => 0),
        prisma.vendorInspection.count({ where: { status: "PENDING" } }).catch(() => 0),
        prisma.payment.count({ where: { status: "REFUNDED" } }).catch(() => 0),
        prisma.damageCharge.count({ where: { isApproved: false } }).catch(() => 0),
        getContactRequests().catch(() => []),
      ]);

      pendingVendorApprovals = vendorApps.filter(
        (a) => a.status === "new" || a.status === "kyc-in-progress" || a.status === "contacted"
      ).length;

      paymentWebhookIssues = failedWebhooks + failedRetryJobs;
      deliveryDelays = activeDeliveries;
      vehiclesPendingInspection = pendingInspections;
      pendingRefunds = refundedPayments;
      pendingDamageSettlements = unsettledDamages;
      unresolvedSupportTickets = supportTickets.filter((t) => t.status === "open").length;
      unreadContactRequests = contactReqs.filter((c) => c.status === "new").length;
    } catch (e) {
      console.warn("[Attention Center Query Warning]", e);
    }
  } else {
    // In-memory fallback
    const apps = await getVendorApplications().catch(() => []);
    pendingVendorApprovals = apps.filter((a) => a.status === "new" || a.status === "kyc-in-progress").length;
    paymentWebhookIssues = 0;
    deliveryDelays = 1;
    vehiclesPendingInspection = 1;
    pendingRefunds = 2;
    pendingDamageSettlements = 1;
    unresolvedSupportTickets = supportTickets.filter((t) => t.status === "open").length;
    const reqs = await getContactRequests().catch(() => []);
    unreadContactRequests = reqs.filter((c) => c.status === "new").length;
  }

  const items: AttentionItem[] = [
    {
      id: "vendor_approvals",
      title: "Pending Vendor Approvals",
      count: pendingVendorApprovals,
      category: "approvals",
      severity: "warning",
      description: "Partner applications & KYC documents awaiting verification",
      actionLabel: "Review KYC →",
      targetHref: "/dashboard/admin?section=vendor-applications",
      icon: "🏢",
    },
    {
      id: "payment_issues",
      title: "Payment & Webhook Issues",
      count: paymentWebhookIssues,
      category: "finance",
      severity: "critical",
      description: "Failed gateway webhook dispatches or retry errors",
      actionLabel: "Inspect Webhooks →",
      targetHref: "/dashboard/admin?section=webhooks",
      icon: "💳",
    },
    {
      id: "delivery_jobs",
      title: "Active & Scheduled Deliveries",
      count: deliveryDelays,
      category: "deliveries",
      severity: "warning",
      description: "Live vehicle drops & driver handovers requiring dispatch",
      actionLabel: "Track Deliveries →",
      targetHref: "/dashboard/admin?section=deliveries",
      icon: "🚚",
    },
    {
      id: "vehicle_inspections",
      title: "Vehicles Pending Inspection",
      count: vehiclesPendingInspection,
      category: "inspections",
      severity: "warning",
      description: "Return checkouts & vehicle handover audit logs",
      actionLabel: "Inspect Vehicles →",
      targetHref: "/dashboard/admin?section=vehicles",
      icon: "🏍️",
    },
    {
      id: "pending_refunds",
      title: "Refunds & Cancellations",
      count: pendingRefunds,
      category: "refunds",
      severity: "critical",
      description: "Cancelled customer bookings with refund transaction records",
      actionLabel: "View Ledger →",
      targetHref: "/dashboard/admin?section=finance&status=REFUNDED",
      icon: "💸",
    },
    {
      id: "damage_settlements",
      title: "Damage Settlement Disputes",
      count: pendingDamageSettlements,
      category: "damages",
      severity: "critical",
      description: "Unapproved vehicle damage charges & deposit deductions",
      actionLabel: "Audit Damages →",
      targetHref: "/dashboard/admin?section=bookings",
      icon: "💥",
    },
    {
      id: "support_tickets",
      title: "Unresolved Support Tickets",
      count: unresolvedSupportTickets,
      category: "support",
      severity: "info",
      description: "Open customer & vendor inquiries needing assistance",
      actionLabel: "Resolve Tickets →",
      targetHref: "/dashboard/admin?section=support",
      icon: "🎫",
    },
    {
      id: "contact_leads",
      title: "Inbound Inquiries & Leads",
      count: unreadContactRequests,
      category: "leads",
      severity: "info",
      description: "New website contact submissions & franchise leads",
      actionLabel: "Open Inbox →",
      targetHref: "/dashboard/admin?section=contact-requests",
      icon: "📬",
    },
  ];

  const totalPendingCount = items.reduce((sum, it) => sum + it.count, 0);
  const criticalCount = items.filter((it) => it.severity === "critical" && it.count > 0).reduce((sum, it) => sum + it.count, 0);
  const warningCount = items.filter((it) => it.severity === "warning" && it.count > 0).reduce((sum, it) => sum + it.count, 0);
  const infoCount = items.filter((it) => it.severity === "info" && it.count > 0).reduce((sum, it) => sum + it.count, 0);

  return {
    totalPendingCount,
    criticalCount,
    warningCount,
    infoCount,
    items,
    lastRefreshedAt: new Date().toISOString(),
  };
}

export const getCachedAttentionCenterData = unstable_cache(
  fetchAttentionCenterData,
  ["admin-attention-center"],
  { revalidate: 30, tags: ["admin-attention"] }
);
