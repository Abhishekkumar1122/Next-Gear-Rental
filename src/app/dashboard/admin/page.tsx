import { SiteHeader } from "@/components/site-header";
import { AdminSiteSettingsPanel } from "@/components/admin-site-settings-panel";
import { AdminBookingsPanel } from "@/components/admin-bookings-panel";
import { AdminActionPanel } from "@/components/admin-action-panel";
import { AdminContactRequestsPanel } from "@/components/admin-contact-requests-panel";
import { AdminVendorApplicationsPanel } from "@/components/admin-vendor-applications-panel";
import { AdminVehicleInventoryPanel } from "@/components/admin-vehicle-inventory-panel";
import { AdminPromotionsPanel } from "@/components/admin-promotions-panel";
import { AdminAlertsPanel } from "@/components/admin-alerts-panel";
import { AdminBroadcastsPanel } from "@/components/admin-broadcasts-panel";
import { getAdminHistory } from "@/lib/dashboard-history";
import { allowedTrendHours, getOpsMetricsReport, normalizeTrendHours } from "@/lib/ops-report";
import { getServerSessionUser } from "@/lib/server-session";
import { getWebhookAuditLogs } from "@/lib/webhook-admin";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/notification-bell";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminThemeSwitcher } from "@/components/admin-theme-switcher";
import { AdminQRScannerButton } from "@/components/admin-qr-scanner-button";
import { AdminCommandPalette } from "@/components/admin-command-palette";
import { AdminActivityFeed } from "@/components/admin-activity-feed";
import { formatBookingId } from "@/lib/pricing-tiers";
import { getDeliveryJobs, getDrivers } from "@/lib/delivery-data";
import { AdminPaymentsPanel } from "@/components/admin-payments-panel";
import { AdminSupportTicketsPanel } from "@/components/admin-support-tickets-panel";
import { AdminDeliveriesPanel } from "@/components/admin-deliveries-panel";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { AdminJobsPanel } from "@/components/admin-jobs-panel";
import { AdminEmailTemplatesPanel } from "@/components/admin-email-templates-panel";
import { AdminMailInboxPanel } from "@/components/admin-mail-inbox-panel";
import { AdminAttentionCenter } from "@/components/admin-attention-center";
import { AdminCitiesPanel } from "@/components/admin-cities-panel";
import { AdminInspectionsPanel } from "@/components/admin-inspections-panel";
import { AdminOverviewKpis } from "@/components/admin-overview-kpis";
import { getCachedAttentionCenterData } from "@/lib/attention-center";
import { getCachedAdminKpiAggregates } from "@/lib/admin-kpi-aggregates";

import { AdminOverviewClient } from "@/components/admin-overview-client";
import { AdminDataMaintenancePanel } from "@/components/admin-data-maintenance-panel";

export const dynamic = "force-dynamic";

// Cache admin data to reduce database load
const getCachedAdminHistory = unstable_cache(
  async (provider: string, status: string) => getAdminHistory({ provider, status }),
  ["admin-history"],
  { revalidate: 90, tags: ["admin-data"] }
);

const getCachedWebhookAuditLogs = unstable_cache(
  async (provider: string, status: string, page: number) => 
    getWebhookAuditLogs({ provider, status, page, pageSize: 12 }),
  ["webhook-audit"],
  { revalidate: 90, tags: ["admin-data"] }
);

const getCachedOpsReport = unstable_cache(
  async (hours: number) => getOpsMetricsReport({ trendHours: hours }),
  ["ops-report"],
  { revalidate: 90, tags: ["admin-data"] }
);

function generateSparkline(values: number[], width = 100, height = 30): { linePath: string; areaPath: string; lastX: number; lastY: number } {
  const defaultRes = {
    linePath: `M 2 ${height - 4} L ${width - 2} ${height - 4}`,
    areaPath: `M 2 30 L 2 ${height - 4} L ${width - 2} ${height - 4} L ${width - 2} 30 Z`,
    lastX: width - 2,
    lastY: height - 4
  };

  if (!values || values.length < 2) {
    return defaultRes;
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = values.map((val, idx) => {
    const x = 2 + (idx / (values.length - 1)) * (width - 4);
    const y = height - 4 - ((val - minVal) / range) * (height - 8);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
  }

  let areaPath = `M 2 30 L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    areaPath += ` L ${points[i].x} ${points[i].y}`;
  }
  areaPath += ` L ${points[points.length - 1].x} 30 Z`;

  const lastPoint = points[points.length - 1];

  return {
    linePath,
    areaPath,
    lastX: lastPoint.x,
    lastY: lastPoint.y
  };
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard/customer");
  }
  const params = await searchParams;
  const provider = typeof params.provider === "string" ? params.provider : "";
  const status = typeof params.status === "string" ? params.status : "";
  const whProvider = typeof params.whProvider === "string" ? params.whProvider : "";
  const whStatus = typeof params.whStatus === "string" ? params.whStatus : "";
  const whPage = typeof params.whPage === "string" ? Math.max(1, Number(params.whPage) || 1) : 1;
  const hours = normalizeTrendHours(typeof params.hours === "string" ? params.hours : undefined);
  const daysParam = typeof params.days === "string" ? params.days : "30";
  const sectionParam = typeof params.section === "string" ? params.section : "overview";

  const allowedSections = ["overview", "attention-center", "ops", "finance", "bookings", "users-fleet", "vendor-applications", "vehicles", "cities", "inspections", "contact-requests", "alerts", "broadcasts", "mail-inbox", "email-templates", "settings", "maintenance", "footer", "support", "webhooks", "deliveries", "careers-jobs"] as const;
  let activeSection = allowedSections.includes(sectionParam as (typeof allowedSections)[number])
    ? (sectionParam as (typeof allowedSections)[number])
    : "overview";
  if (activeSection === "footer") {
    activeSection = "settings";
  }

  const [history, webhookAudit, opsReport, deliveryJobs, driversList, attentionData, kpiAggregates] = await Promise.all([
    getCachedAdminHistory(provider, status),
    getCachedWebhookAuditLogs(whProvider, whStatus, whPage),
    getCachedOpsReport(hours),
    getDeliveryJobs({ limit: 50 }).catch(() => []),
    getDrivers().catch(() => []),
    getCachedAttentionCenterData().catch(() => ({
      totalPendingCount: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      items: [],
      lastRefreshedAt: new Date().toISOString(),
    })),
    getCachedAdminKpiAggregates().catch(() => ({
      totalUsers: 0,
      totalVendors: 0,
      totalVehicles: 0,
      activeBookings: 0,
      todayBookings: 0,
      pendingPayments: 0,
      revenue: { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 },
      todayRefunds: 0,
      lastRefreshedAt: new Date().toISOString(),
    })),
  ]);
  const webhookLogs = webhookAudit.items;

  // Dynamic Date Range Filter Cutoff logic
  const now = new Date();
  let cutoffDate = new Date();
  if (daysParam === "7") {
    cutoffDate.setDate(now.getDate() - 7);
  } else if (daysParam === "30") {
    cutoffDate.setDate(now.getDate() - 30);
  } else if (daysParam === "365") {
    cutoffDate.setDate(now.getDate() - 365);
  } else {
    cutoffDate = new Date(0); // All time
  }

  const financeItems = history.filter((item) => !item.createdAt || new Date(item.createdAt) >= cutoffDate);

  const bookingCards = financeItems.slice(0, 6).map((item) => ({
    id: item.bookingId,
    city: item.cityName,
    vehicle: "",
    customer: item.customerEmail || "",
    status: item.status,
    amount: item.amountINR,
  }));

  const paidTotal = financeItems.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.amountINR, 0);
  const refundTotal = financeItems.filter((item) => item.status === "REFUNDED").reduce((sum, item) => sum + item.amountINR, 0);
  const uniqueCustomers = new Set(financeItems.map((item) => item.customerEmail).filter(Boolean)).size;

  // Sorted payments to build chronological data graphs
  const chronologicalPayments = [...financeItems].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  // 1. Paid Revenue trend sparkline
  let paidSum = 0;
  const paidTrend = chronologicalPayments
    .filter((item) => item.status === "PAID")
    .map((item) => {
      paidSum += item.amountINR;
      return paidSum;
    });
  const paidSparkline = generateSparkline(paidTrend);

  // 2. Refunds trend sparkline
  let refundSum = 0;
  const refundTrend = chronologicalPayments
    .filter((item) => item.status === "REFUNDED")
    .map((item) => {
      refundSum += item.amountINR;
      return refundSum;
    });
  const refundSparkline = generateSparkline(refundTrend);

  // 3. Active Riders trend sparkline
  let riderCount = 0;
  const seenEmails = new Set();
  const ridersTrend = chronologicalPayments.map((item) => {
    if (item.customerEmail && !seenEmails.has(item.customerEmail)) {
      seenEmails.add(item.customerEmail);
      riderCount += 1;
    }
    return riderCount;
  });
  const ridersSparkline = generateSparkline(ridersTrend);

  // 4. Bookings count trend sparkline
  let bookingCount = 0;
  const bookingsTrend = chronologicalPayments.map(() => {
    bookingCount += 1;
    return bookingCount;
  });
  const bookingsSparkline = generateSparkline(bookingsTrend);

  // 5. Total Site Visits dynamic sparkline (simulated based on selected period length)
  let visitsCount = 30;
  if (daysParam === "7") visitsCount = 7;
  else if (daysParam === "365") visitsCount = 12;
  else if (daysParam === "all") visitsCount = 24;

  const visitsData: number[] = [];
  let currentVisits = 5000;
  for (let i = 0; i < visitsCount; i++) {
    const change = Math.sin(i * 1.5) * 1500 + Math.cos(i * 0.8) * 800;
    currentVisits = Math.max(1000, currentVisits + change);
    visitsData.push(currentVisits);
  }
  const visitsSparkline = generateSparkline(visitsData);

  const exportParams = new URLSearchParams();
  if (provider) exportParams.set("provider", provider);
  if (status) exportParams.set("status", status);
  exportParams.set("hours", String(hours));

  const sectionTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    {
      id: "attention-center",
      label: "Attention Center",
      icon: "🔥",
      badge: attentionData.totalPendingCount > 0 ? String(attentionData.totalPendingCount) : undefined,
    },
    { id: "finance", label: "Payments", icon: "💰" },
    { id: "deliveries", label: "Deliveries", icon: "🚚" },
    { id: "bookings", label: "Bookings", icon: "📅" },
    { id: "support", label: "Support Tickets", icon: "🎫" },
    { id: "ops", label: "Operations", icon: "⚙️" },
    { id: "users-fleet", label: "Users & Vendors", icon: "👤" },
    { id: "vendor-applications", label: "Vendor Applications", icon: "📝" },
    { id: "vehicles", label: "Vehicle List", icon: "🏍️" },
    { id: "cities", label: "Locations & Cities", icon: "🏙️" },
    { id: "inspections", label: "Inspections & Damages", icon: "🔍" },
    { id: "careers-jobs", label: "Jobs & Careers", icon: "💼" },
    { id: "contact-requests", label: "Contact Requests", icon: "✉️" },
    { id: "alerts", label: "Alerts", icon: "⚠️" },
    { id: "broadcasts", label: "WhatsApp & Offers Broadcast", icon: "📢" },
    { id: "mail-inbox", label: "Mail Command Center", icon: "📬" },
    { id: "email-templates", label: "Email & WhatsApp Templates", icon: "✉️" },
    { id: "settings", label: "Site Settings", icon: "⚙️" },
    { id: "maintenance", label: "Data Maintenance & Clean Slate", icon: "🧹" },
    { id: "webhooks", label: "Webhooks", icon: "⚡" },
  ] as const;

  function buildSectionHref(sectionId: (typeof sectionTabs)[number]["id"]) {
    const query = new URLSearchParams();
    query.set("section", sectionId);
    if (provider) query.set("provider", provider);
    if (status) query.set("status", status);
    if (whProvider) query.set("whProvider", whProvider);
    if (whStatus) query.set("whStatus", whStatus);
    query.set("whPage", String(whPage));
    query.set("hours", String(hours));
    return `/dashboard/admin?${query.toString()}`;
  }

  // Pre-build sidebar links
  const sidebarLinks = sectionTabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    href: buildSectionHref(tab.id)
  }));

  // Calculations for Status Donut Chart
  const totalPayments = financeItems.length || 1;
  const paidCount = financeItems.filter((item) => item.status === "PAID").length;
  const refundedCount = financeItems.filter((item) => item.status === "REFUNDED").length;
  const failedCount = financeItems.filter((item) => item.status === "FAILED" || item.status === "CREATED").length;

  const pctPaid = Math.round((paidCount / totalPayments) * 100);
  const pctRefunded = Math.round((refundedCount / totalPayments) * 100);
  const pctFailed = 100 - pctPaid - pctRefunded;

  // Real database monthly revenue trends (All 12 dynamic calendar months, Jan - Dec)
  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const realMonthlyRevenueData = monthsShort.map((m) => ({
    month: m,
    revenue: 0,
    bookings: 0,
  }));

  financeItems.forEach((item) => {
    if (!item.createdAt) return;
    const date = new Date(item.createdAt);
    const monthName = monthsShort[date.getMonth()];
    const targetMonth = realMonthlyRevenueData.find((m) => m.month === monthName);
    if (targetMonth) {
      if (item.status === "PAID") {
        targetMonth.revenue += item.amountINR;
      }
      targetMonth.bookings += 1;
    }
  });

  const maxRev = Math.max(...realMonthlyRevenueData.map((m) => m.revenue), 100);
  const maxBook = Math.max(...realMonthlyRevenueData.map((m) => m.bookings), 10);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row">
      <AdminCommandPalette />
      <style dangerouslySetInnerHTML={{ __html: `
        /* High-tech SaaS Design System Overrides */
        .theme-dark-admin-subpanels {
          font-family: inherit;
        }
        /* Tables & Lists */
        .theme-dark-admin-subpanels table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
        }
        .theme-dark-admin-subpanels th {
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          font-size: 9px !important;
          color: rgba(255, 255, 255, 0.4) !important;
          background-color: rgba(255, 255, 255, 0.02) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 14px 16px !important;
        }
        .theme-dark-admin-subpanels td {
          padding: 14px 16px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          color: rgba(255, 255, 255, 0.85) !important;
          font-size: 11px !important;
        }
        .theme-dark-admin-subpanels tr:hover td {
          background-color: rgba(255, 255, 255, 0.015) !important;
        }
        /* Inputs & Select Options */
        .theme-dark-admin-subpanels input,
        .theme-dark-admin-subpanels select,
        .theme-dark-admin-subpanels textarea {
          background-color: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          border-radius: 10px !important;
          font-size: 11px !important;
          padding: 8px 12px !important;
          transition: all 150ms ease !important;
        }
        .theme-dark-admin-subpanels input:focus,
        .theme-dark-admin-subpanels select:focus,
        .theme-dark-admin-subpanels textarea:focus {
          border-color: rgba(239, 68, 68, 0.4) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.1) !important;
          outline: none !important;
        }
        /* Overwriting default cards */
        .theme-dark-admin-subpanels .bg-white {
          background-color: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 14px !important;
          color: #ffffff !important;
        }
        .theme-dark-admin-subpanels .border-gray-200,
        .theme-dark-admin-subpanels .border-gray-300,
        .theme-dark-admin-subpanels .border-black\\/10,
        .theme-dark-admin-subpanels .border-black\\/5 {
          border-color: rgba(255, 255, 255, 0.06) !important;
        }
        .theme-dark-admin-subpanels .text-black,
        .theme-dark-admin-subpanels .text-gray-900 {
          color: #ffffff !important;
        }
        .theme-dark-admin-subpanels .text-black\\/60,
        .theme-dark-admin-subpanels .text-black\\/70,
        .theme-dark-admin-subpanels .text-black\\/50,
        .theme-dark-admin-subpanels .text-gray-500,
        .theme-dark-admin-subpanels .text-gray-600 {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        /* Buttons styling */
        .theme-dark-admin-subpanels button {
          border-radius: 10px !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          font-weight: 700 !important;
          letter-spacing: 0.05em !important;
          transition: all 150ms ease !important;
        }
        .theme-dark-admin-subpanels button.bg-blue-600,
        .theme-dark-admin-subpanels button.bg-blue-500 {
          background-color: rgba(14, 165, 233, 0.15) !important;
          color: rgb(56, 189, 248) !important;
          border: 1px solid rgba(14, 165, 233, 0.3) !important;
        }
        .theme-dark-admin-subpanels button.bg-blue-600:hover,
        .theme-dark-admin-subpanels button.bg-blue-500:hover {
          background-color: rgba(14, 165, 233, 0.25) !important;
        }
        .theme-dark-admin-subpanels button.bg-red-600,
        .theme-dark-admin-subpanels button.bg-red-500 {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: rgb(248, 113, 113) !important;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
        }
        .theme-dark-admin-subpanels button.bg-red-600:hover,
        .theme-dark-admin-subpanels button.bg-red-500:hover {
          background-color: rgba(239, 68, 68, 0.25) !important;
        }
        /* Translucent Alert Badges */
        .theme-dark-admin-subpanels .bg-green-50,
        .theme-dark-admin-subpanels .bg-green-100 {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: rgb(52, 211, 153) !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
        }
        .theme-dark-admin-subpanels .bg-blue-50,
        .theme-dark-admin-subpanels .bg-blue-100 {
          background-color: rgba(14, 165, 233, 0.1) !important;
          color: rgb(56, 189, 248) !important;
          border: 1px solid rgba(14, 165, 233, 0.2) !important;
        }
        .theme-dark-admin-subpanels .bg-red-50,
        .theme-dark-admin-subpanels .bg-red-100 {
          background-color: rgba(239, 68, 68, 0.1) !important;
          color: rgb(248, 113, 113) !important;
          border: 1px solid rgba(239, 68, 68, 0.2) !important;
        }
        .theme-dark-admin-subpanels .bg-amber-50,
        .theme-dark-admin-subpanels .bg-amber-100 {
          background-color: rgba(245, 158, 11, 0.1) !important;
          color: rgb(251, 191, 36) !important;
          border: 1px solid rgba(245, 158, 11, 0.2) !important;
        }
        .theme-dark-admin-subpanels .bg-rose-50,
        .theme-dark-admin-subpanels .bg-rose-100 {
          background-color: rgba(244, 63, 94, 0.1) !important;
          color: rgb(251, 113, 133) !important;
          border: 1px solid rgba(244, 63, 94, 0.2) !important;
        }
        .theme-dark-admin-subpanels .text-green-700,
        .theme-dark-admin-subpanels .text-green-800 {
          color: rgb(52, 211, 153) !important;
        }
        .theme-dark-admin-subpanels .text-blue-700,
        .theme-dark-admin-subpanels .text-blue-800 {
          color: rgb(56, 189, 248) !important;
        }
        .theme-dark-admin-subpanels .text-red-700,
        .theme-dark-admin-subpanels .text-red-800 {
          color: rgb(248, 113, 113) !important;
        }
        .theme-dark-admin-subpanels .text-yellow-700,
        .theme-dark-admin-subpanels .text-yellow-800,
        .theme-dark-admin-subpanels .text-amber-700,
        .theme-dark-admin-subpanels .text-amber-800 {
          color: rgb(251, 191, 36) !important;
        }
        .theme-dark-admin-subpanels .bg-\\[var\\(--brand-cream\\)\\],
        .theme-dark-admin-subpanels .bg-neutral-50 {
          background-color: transparent !important;
        }
      ` }} />
      <AdminSidebar
        activeSection={activeSection}
        email={user?.email || "admin@next-gear.app"}
        userName={user?.role === "ADMIN" ? "Next Gear Admin" : (user?.email?.split("@")[0] || "Admin")}
        links={sidebarLinks}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[#0b0b0b] border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest shrink-0">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[var(--brand-red-soft)] font-extrabold">{activeSection === "settings" ? "SITE SETTINGS" : activeSection}</span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
            <div className="hidden md:flex gap-2 text-[10px] uppercase font-black tracking-wider">
              <Link href={buildSectionHref("attention-center")} className="rounded-xl border border-red-500/20 bg-red-950/30 hover:bg-red-950/50 text-red-400 px-3.5 py-2 transition duration-300">
                Attention Hub
              </Link>
              <Link href={buildSectionHref("support")} className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 transition duration-300">
                Tickets
              </Link>
              <Link href={buildSectionHref("finance")} className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 transition duration-300">
                Payments
              </Link>
              <Link href={buildSectionHref("deliveries")} className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 transition duration-300">
                Deliveries
              </Link>
            </div>
            <AdminQRScannerButton />
            <AdminThemeSwitcher />
            <div className="flex items-center gap-2 md:gap-3 border-l border-white/5 pl-2 md:pl-4">
              <NotificationBell userId={user.id} role="ADMIN" />
            </div>
          </div>
        </header>

        {/* Main Content Area - Reduced vertical padding so graphs and metrics sit higher */}
        <main className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar theme-dark-admin-subpanels">
          
          {activeSection === "overview" && (
            <div className="space-y-4">
              {/* Sleek Compact Header Card (Image 1 Refinement) */}
              <div className="rounded-2xl border border-[var(--brand-red)]/20 bg-gradient-to-r from-[var(--brand-red)]/[0.04] via-black to-black p-3.5 md:p-4 relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-center text-base shrink-0">
                    🚀
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black font-display uppercase tracking-wider text-white">
                        Welcome back, Next Gear Admin!
                      </h2>
                      <span className="inline-block rounded-full bg-emerald-950/60 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-400 border border-emerald-500/20">
                        SYSTEM READY
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                      Fleet, vendor pipeline, and payment gateways are online.
                    </p>
                  </div>
                </div>

                {/* Date range picker tabs */}
                <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider self-end md:self-center shrink-0">
                  {[
                    { id: "7", label: "7 Days" },
                    { id: "30", label: "30 Days" },
                    { id: "365", label: "1 Year" },
                    { id: "all", label: "All Time" }
                  ].map((d) => {
                    const isAct = daysParam === d.id;
                    const linkQuery = new URLSearchParams();
                    linkQuery.set("section", "overview");
                    linkQuery.set("days", d.id);
                    if (provider) linkQuery.set("provider", provider);
                    if (status) linkQuery.set("status", status);
                    
                    return (
                      <Link
                        key={d.id}
                        href={`/dashboard/admin?${linkQuery.toString()}`}
                        className={`rounded-lg px-2.5 py-1 border transition duration-200 ${
                          isAct
                            ? "bg-[var(--brand-red)] border-red-500/20 text-white shadow-sm"
                            : "border-white/5 hover:bg-white/5 text-white/50"
                        }`}
                      >
                        {d.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <AdminOverviewClient
                daysParam={daysParam}
                paidTotal={paidTotal}
                totalRefunds={refundTotal}
                totalBookings={financeItems.length}
                activeRidersCount={uniqueCustomers}
                paidCount={paidCount}
                refundedCount={refundedCount}
                failedCount={failedCount}
                totalPayments={totalPayments}
                pctPaid={pctPaid}
                pctRefunded={pctRefunded}
                pctFailed={pctFailed}
                monthlyRevenueData={realMonthlyRevenueData}
                revenueSparkline={paidSparkline}
                bookingsSparkline={bookingsSparkline}
                activeRidersSparkline={ridersSparkline}
                refundsSparkline={refundSparkline}
                visitsSparkline={visitsSparkline}
              />
            </div>
          )}

          {activeSection === "attention-center" && (
            <div className="space-y-6">
              <AdminAttentionCenter initialData={attentionData} />
            </div>
          )}

          {activeSection === "ops" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
              <div className="border-b border-white/5 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Operations</p>
                  <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Diagnostics & System Status</h2>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">Monitor process timers, database triggers, and audit queue volumes.</p>
                </div>
                
                <form method="get" className="flex items-center gap-2.5 text-xs text-white">
                  <input type="hidden" name="section" value="ops" />
                  <input type="hidden" name="provider" value={provider} />
                  <input type="hidden" name="status" value={status} />
                  <input type="hidden" name="whProvider" value={whProvider} />
                  <input type="hidden" name="whStatus" value={whStatus} />
                  <input type="hidden" name="whPage" value={String(whPage)} />
                  <label htmlFor="hours" className="text-white/50 font-semibold uppercase tracking-wider">Trend Window</label>
                  <select id="hours" name="hours" defaultValue={String(hours)} className="rounded-xl border border-white/5 bg-white/5 px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--brand-red)]">
                    {allowedTrendHours.map((h) => (
                      <option key={h} value={h} className="bg-[#121212]">{h} Hours</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-xl bg-[var(--brand-red)] hover:bg-red-600 px-4 py-2 font-bold tracking-wider uppercase transition cursor-pointer">Apply</button>
                </form>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                  <p className="text-xs font-black uppercase tracking-wider text-white/80 border-b border-white/5 pb-2">🔋 App Process</p>
                  <p className="text-[10px] text-white/40">Started At: <span className="font-medium text-white">{new Date(opsReport.appMetrics.startedAt).toLocaleString()}</span></p>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(opsReport.appMetrics.counters).length === 0 ? (
                      <p className="text-white/40">No hits recorded.</p>
                    ) : (
                      Object.entries(opsReport.appMetrics.counters)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([name, count]) => (
                          <div key={name} className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-white/60">{name}:</span>
                            <span className="font-extrabold text-white">{count}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                  <p className="text-xs font-black uppercase tracking-wider text-white/80 border-b border-white/5 pb-2">💾 Database State</p>
                  {opsReport.databaseMetrics ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Total Webhook Logs</p>
                        <div className="mt-1.5 space-y-1 text-xs">
                          {opsReport.databaseMetrics.webhookLogs.length === 0 ? (
                            <p className="text-white/40">No webhook logs.</p>
                          ) : (
                            opsReport.databaseMetrics.webhookLogs.map((item) => (
                              <div key={`webhook-${item.status}`} className="flex justify-between border-b border-white/5 pb-1">
                                <span className="text-white/60">{item.status}:</span>
                                <span className="font-bold text-white">{item._count._all}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Total Retry Jobs</p>
                        <div className="mt-1.5 space-y-1 text-xs">
                          {opsReport.databaseMetrics.retryJobs.length === 0 ? (
                            <p className="text-white/40">No retry jobs.</p>
                          ) : (
                            opsReport.databaseMetrics.retryJobs.map((item) => (
                              <div key={`retry-${item.status}`} className="flex justify-between border-b border-white/5 pb-1">
                                <span className="text-white/60">{item.status}:</span>
                                <span className="font-bold text-white">{item._count._all}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">No metrics found.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                  <p className="text-xs font-black uppercase tracking-wider text-white/80 border-b border-white/5 pb-2">⚡ Window Trend ({hours}h)</p>
                  {opsReport.trends && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Totals in Window</p>
                        <div className="mt-1.5 text-xs space-y-1">
                          <p>Webhooks: <span className="font-bold text-white">{opsReport.trends.totals.webhookLogs}</span></p>
                          <p>Retry Jobs: <span className="font-bold text-white">{opsReport.trends.totals.retryJobs}</span></p>
                          <p className="text-[9px] text-white/40 mt-1 italic">Since: {new Date(opsReport.trends.windowStart).toLocaleString()}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Webhooks by Status</p>
                        <div className="mt-1.5 space-y-1 text-xs">
                          {opsReport.trends.webhookLogs.length === 0 ? (
                            <p className="text-white/40">No events found.</p>
                          ) : (
                            opsReport.trends.webhookLogs.map((item) => (
                              <div key={`trend-webhook-${item.status}`} className="flex justify-between border-b border-white/5 pb-1">
                                <span className="text-white/60">{item.status}:</span>
                                <span className="font-bold text-white">{item._count._all}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeSection === "finance" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Finance Control</p>
                  <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Transaction Ledger & Export</h2>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">Inspect live cashflows and download financial spreadsheets.</p>
                </div>
                <AdminPaymentsPanel initialPayments={financeItems.map(item => ({
                  id: item.id,
                  provider: item.provider as any,
                  status: item.status as any,
                  amountINR: item.amountINR,
                  currency: "INR",
                  bookingId: item.bookingId,
                  cityName: item.cityName,
                  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
                  updatedAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
                }))} />
              </div>

              <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
                <AdminPromotionsPanel />
              </div>
            </div>
          )}

          {activeSection === "bookings" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Bookings</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Live Reservation Queue</h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Every system reservation, handoff status, and cancellation event is audited below.</p>
              </div>
              <div>
                <AdminBookingsPanel />
              </div>
            </section>
          )}

          {activeSection === "deliveries" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Logistics</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Deliveries & Pickups Dispatch</h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Manage delivery drivers, schedule bookings, and track live statuses.</p>
              </div>
              <AdminDeliveriesPanel 
                jobs={deliveryJobs.map((j: any) => ({
                  id: j.id,
                  type: j.type,
                  status: j.status,
                  bookingId: j.bookingId,
                  scheduledAt: j.scheduledAt ? new Date(j.scheduledAt).toISOString() : undefined,
                  assignedDriverId: j.assignedDriverId || undefined,
                  notes: j.notes || undefined,
                  liveLat: j.liveLat || undefined,
                  liveLng: j.liveLng || undefined,
                }))} 
                drivers={driversList.map((d: any) => ({
                  id: d.id,
                  name: d.name,
                }))} 
              />
            </section>
          )}

          {activeSection === "users-fleet" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Oversight</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">User & Vendor Management</h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Oversight profiles, user permissions, and commission accounts.</p>
              </div>
              <AdminUsersPanel />
            </section>
          )}

          {activeSection === "vehicles" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Fleet</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Vehicle Inventory Registry</h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Update vehicle status, map vendor owners, and set trending priority tags.</p>
              </div>
              <div>
                <AdminVehicleInventoryPanel />
              </div>
            </section>
          )}

          {activeSection === "cities" && (
            <AdminCitiesPanel />
          )}

          {activeSection === "inspections" && (
            <AdminInspectionsPanel />
          )}

          {activeSection === "vendor-applications" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Onboarding</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Vendor Application Pipeline</h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Review onboarding requests, verify vendor KYC, and generate backend portal access keys.</p>
              </div>
              <div>
                <AdminVendorApplicationsPanel />
              </div>
            </section>
          )}

          {activeSection === "contact-requests" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Inquiries</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Contact Submissions</h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Messages and feedback inquiries submitted by riders.</p>
              </div>
              <div>
                <AdminContactRequestsPanel />
              </div>
            </section>
          )}

          {activeSection === "alerts" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl">
              <AdminAlertsPanel />
            </section>
          )}

          {activeSection === "broadcasts" && (
            <AdminBroadcastsPanel />
          )}

          {activeSection === "settings" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Master Controls</p>
                <h2 className="text-base font-black uppercase tracking-wider text-white mt-1 flex items-center gap-2">
                  <span>⚙️</span> Global Platform & Site Settings
                </h2>
                <p className="text-xs text-white/60 leading-relaxed mt-1">Configure vehicle card themes, brand identity, payment gateways, automated discounts, operational controls, and SEO metadata.</p>
              </div>
              <div>
                <AdminSiteSettingsPanel />
              </div>
            </section>
          )}

          {activeSection === "support" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
                <div className="border-b border-white/5 pb-4 flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Helpdesk</p>
                    <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Support Tickets Management</h2>
                    <p className="text-xs text-white/60 leading-relaxed mt-1">Verify SLA responses, reply to customer issues, and handle operational disputes.</p>
                  </div>
                  <div>
                    <a
                      href={`/api/admin/finance/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
                      className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2.5 font-bold tracking-wider uppercase text-[10px] text-white transition flex items-center justify-center cursor-pointer"
                    >
                      Export System CSV
                    </a>
                  </div>
                </div>
                <AdminSupportTicketsPanel />
              </div>
            </div>
          )}

          {activeSection === "webhooks" && (
            <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-6">
              <div className="border-b border-white/5 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Webhooks</p>
                  <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Webhook Audit Logs</h2>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">Inspect live API payload deliveries, verify signatures, and requeue tasks.</p>
                </div>
                
                <form action="/api/admin/webhooks/retry-now" method="post">
                  <button type="submit" className="rounded-xl bg-[var(--brand-red)] hover:bg-red-600 px-4 py-2.5 font-bold tracking-wider uppercase text-xs transition cursor-pointer text-white">Run Retry Processor</button>
                </form>
              </div>

              {/* Filtering form */}
              <form className="grid gap-3 rounded-2xl border border-white/5 bg-white/[0.01] p-4 md:grid-cols-3 text-xs" method="get">
                <input type="hidden" name="section" value="webhooks" />
                <input type="hidden" name="hours" value={String(hours)} />
                <input type="hidden" name="provider" value={provider} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="whPage" value="1" />
                <select name="whProvider" defaultValue={whProvider} className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)]">
                  <option value="">All API providers</option>
                  <option value="STRIPE">STRIPE Gateway</option>
                  <option value="RAZORPAY">RAZORPAY Gateway</option>
                </select>
                <select name="whStatus" defaultValue={whStatus} className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)]">
                  <option value="">All event statuses</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="PROCESSED">PROCESSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="DUPLICATE">DUPLICATE</option>
                  <option value="IGNORED">IGNORED</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-xl bg-[var(--brand-red)] hover:bg-red-600 py-2.5 font-bold tracking-wider uppercase transition cursor-pointer text-white">Filter</button>
                  <a href={buildSectionHref("webhooks")} className="flex-1 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 py-2.5 text-center font-bold tracking-wider uppercase transition flex items-center justify-center text-white">Reset</a>
                </div>
              </form>

              {/* Audit logs listing */}
              <div className="space-y-3">
                {webhookLogs.length === 0 ? (
                  <p className="text-xs text-white/40">No webhook audit events recorded matching filters.</p>
                ) : (
                  <>
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-2 hover:bg-white/[0.03] transition">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="font-extrabold uppercase text-white">{log.provider} · {log.eventType}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            log.status === "PROCESSED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30"
                              : log.status === "FAILED"
                              ? "bg-red-950 text-red-400 border border-red-800/30"
                              : "bg-slate-950 text-slate-400 border border-slate-800/30"
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-white/60">Event ID: <span className="font-mono text-white">{log.eventId}</span></p>
                        {log.providerEntityId && <p className="text-[10px] text-white/40">Entity ID: {log.providerEntityId}</p>}
                        {log.errorMessage && <p className="text-red-400 font-medium">Error message: {log.errorMessage}</p>}
                        {log.status === "FAILED" && log.providerEntityId && (
                          <form action="/api/admin/webhooks/requeue" method="post" className="mt-2.5">
                            <input type="hidden" name="logId" value={log.id} />
                            <button type="submit" className="rounded-lg bg-red-950 hover:bg-red-900 border border-red-800/30 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-red-400 transition cursor-pointer">Requeue Event Task</button>
                          </form>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-xs text-white/50">
                      <p>
                        Page {webhookAudit.pagination.page} of {Math.max(1, webhookAudit.pagination.totalPages)} · Total events: {webhookAudit.pagination.totalItems}
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <a
                          href={`/dashboard/admin?provider=${encodeURIComponent(provider)}&status=${encodeURIComponent(status)}&whProvider=${encodeURIComponent(whProvider)}&whStatus=${encodeURIComponent(whStatus)}&whPage=${Math.max(1, whPage - 1)}&hours=${encodeURIComponent(String(hours))}&section=webhooks`}
                          className="flex-1 sm:flex-initial rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2 text-center font-bold uppercase transition text-white"
                        >
                          Prev
                        </a>
                        <a
                          href={`/dashboard/admin?provider=${encodeURIComponent(provider)}&status=${encodeURIComponent(status)}&whProvider=${encodeURIComponent(whProvider)}&whStatus=${encodeURIComponent(whStatus)}&whPage=${Math.min(Math.max(1, webhookAudit.pagination.totalPages), whPage + 1)}&hours=${encodeURIComponent(String(hours))}&section=webhooks`}
                          className="flex-1 sm:flex-initial rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2 text-center font-bold uppercase transition text-white"
                        >
                          Next
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {activeSection === "careers-jobs" && (
            <AdminJobsPanel />
          )}

          {activeSection === "mail-inbox" && (
            <AdminMailInboxPanel />
          )}

          {activeSection === "email-templates" && (
            <AdminEmailTemplatesPanel />
          )}

          {activeSection === "maintenance" && (
            <AdminDataMaintenancePanel />
          )}
        </main>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  trend: string;
  isPositive: boolean;
  accentColor: "red" | "yellow" | "cyan" | "purple";
  linePath: string;
  areaPath: string;
  dotX?: number;
  dotY?: number;
};

function StatCard({ label, value, helper, icon, trend, isPositive, accentColor, linePath, areaPath, dotX, dotY }: StatCardProps) {
  const config = {
    red: {
      borderHover: "hover:border-red-500/40",
      glowBg: "bg-red-500/5",
      glowHover: "group-hover:bg-red-500/10",
      iconBg: "bg-red-950/40 border-red-800/30 text-red-400 shadow-red-950/20",
      sparklineColor: "text-red-500",
      shadowGlow: "shadow-red-950/5"
    },
    yellow: {
      borderHover: "hover:border-amber-500/40",
      glowBg: "bg-amber-500/5",
      glowHover: "group-hover:bg-amber-500/10",
      iconBg: "bg-amber-950/40 border-amber-800/30 text-amber-400 shadow-amber-950/20",
      sparklineColor: "text-amber-500",
      shadowGlow: "shadow-amber-950/5"
    },
    cyan: {
      borderHover: "hover:border-cyan-500/40",
      glowBg: "bg-cyan-500/5",
      glowHover: "group-hover:bg-cyan-500/10",
      iconBg: "bg-cyan-950/40 border-cyan-800/30 text-cyan-400 shadow-cyan-950/20",
      sparklineColor: "text-cyan-500",
      shadowGlow: "shadow-cyan-950/5"
    },
    purple: {
      borderHover: "hover:border-purple-500/40",
      glowBg: "bg-purple-500/5",
      glowHover: "group-hover:bg-purple-500/10",
      iconBg: "bg-purple-950/40 border-purple-800/30 text-purple-400 shadow-purple-950/20",
      sparklineColor: "text-purple-500",
      shadowGlow: "shadow-purple-950/5"
    }
  };

  const style = config[accentColor] || config.red;

  return (
    <div className={`rounded-2xl border border-white/5 bg-[#0c0c0c] p-5 shadow-lg relative overflow-hidden transition-all duration-300 ${style.borderHover} ${style.shadowGlow} group flex flex-col justify-between h-48`}>
      {/* Sparkline Background Area Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
        <svg className={`w-full h-full ${style.sparklineColor}`} viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${accentColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Filled Area */}
          <path
            d={areaPath}
            fill={`url(#grad-${accentColor})`}
          />
          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Pulsing indicator dot */}
          {dotX !== undefined && dotY !== undefined && (
            <>
              <circle cx={dotX} cy={dotY} r="1.5" className="fill-white" />
              <circle cx={dotX} cy={dotY} r="3.5" className="fill-emerald-400/50 animate-ping" />
            </>
          )}
        </svg>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-sm shadow-md ${style.iconBg} select-none`}>
            {icon}
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
            isPositive 
              ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/30" 
              : "text-rose-400 bg-rose-950/40 border-rose-900/30"
          }`}>
            {trend}
          </span>
        </div>

        <div className="mt-4.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-2 text-2xl font-black text-white tracking-tight leading-none">{value}</p>
          <p className="mt-1.5 text-[9px] text-white/50">{helper}</p>
        </div>
      </div>
    </div>
  );
}
