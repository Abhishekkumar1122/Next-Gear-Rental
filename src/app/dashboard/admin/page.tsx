import { SiteHeader } from "@/components/site-header";
import { AdminSiteSettingsPanel } from "@/components/admin-site-settings-panel";
import { AdminBookingsPanel } from "@/components/admin-bookings-panel";
import { AdminActionPanel } from "@/components/admin-action-panel";
import { AdminContactRequestsPanel } from "@/components/admin-contact-requests-panel";
import { AdminVendorApplicationsPanel } from "@/components/admin-vendor-applications-panel";
import { AdminVehicleInventoryPanel } from "@/components/admin-vehicle-inventory-panel";
import { AdminPromotionsPanel } from "@/components/admin-promotions-panel";
import { AdminAlertsPanel } from "@/components/admin-alerts-panel";
import { getAdminHistory } from "@/lib/dashboard-history";
import { allowedTrendHours, getOpsMetricsReport, normalizeTrendHours } from "@/lib/ops-report";
import { getServerSessionUser } from "@/lib/server-session";
import { getWebhookAuditLogs } from "@/lib/webhook-admin";
import { redirect } from "next/navigation";
import Link from "next/link";

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
  const sectionParam = typeof params.section === "string" ? params.section : "overview";

  const allowedSections = ["overview", "ops", "finance", "bookings", "users-fleet", "vendor-applications", "vehicles", "contact-requests", "alerts", "footer", "support", "webhooks"] as const;
  const activeSection = allowedSections.includes(sectionParam as (typeof allowedSections)[number])
    ? (sectionParam as (typeof allowedSections)[number])
    : "overview";

  const [history, webhookAudit, opsReport] = await Promise.all([
    getAdminHistory({ provider, status }),
    getWebhookAuditLogs({ provider: whProvider, status: whStatus, page: whPage, pageSize: 12 }),
    getOpsMetricsReport({ trendHours: hours }),
  ]);
  const webhookLogs = webhookAudit.items;
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  const mockPayments = [
    { id: "pay-001", provider: "razorpay", status: "PAID", amountINR: 1899, currency: "INR", bookingId: "BK-1001", cityName: "Delhi", customerEmail: "riva@example.com", createdAt: new Date().toISOString() },
    { id: "pay-002", provider: "stripe", status: "PAID", amountINR: 2499, currency: "INR", bookingId: "BK-1002", cityName: "Mumbai", customerEmail: "arun@example.com", createdAt: new Date().toISOString() },
    { id: "pay-003", provider: "paypal", status: "FAILED", amountINR: 1599, currency: "INR", bookingId: "BK-1003", cityName: "Bengaluru", customerEmail: "sara@example.com", createdAt: new Date().toISOString() },
    { id: "pay-004", provider: "razorpay", status: "REFUNDED", amountINR: 1299, currency: "INR", bookingId: "BK-1004", cityName: "Pune", customerEmail: "naveen@example.com", createdAt: new Date().toISOString() },
    { id: "pay-005", provider: "stripe", status: "PAID", amountINR: 2099, currency: "INR", bookingId: "BK-1005", cityName: "Goa", customerEmail: "megha@example.com", createdAt: new Date().toISOString() },
    { id: "pay-006", provider: "razorpay", status: "CREATED", amountINR: 999, currency: "INR", bookingId: "BK-1006", cityName: "Jaipur", customerEmail: "kiran@example.com", createdAt: new Date().toISOString() },
  ];

  const mockBookings = [
    { id: "BK-1001", city: "Delhi", vehicle: "Honda Activa", customer: "Riva Verma", status: "CONFIRMED", amount: 1899 },
    { id: "BK-1002", city: "Mumbai", vehicle: "Hyundai i20", customer: "Arun Shah", status: "CONFIRMED", amount: 2499 },
    { id: "BK-1003", city: "Bengaluru", vehicle: "Royal Enfield", customer: "Sara Iqbal", status: "PENDING", amount: 1599 },
    { id: "BK-1004", city: "Pune", vehicle: "Suzuki Access", customer: "Naveen Rao", status: "REFUNDED", amount: 1299 },
    { id: "BK-1005", city: "Goa", vehicle: "Maruti Swift", customer: "Megha Rao", status: "COMPLETED", amount: 2099 },
    { id: "BK-1006", city: "Jaipur", vehicle: "TVS Ntorq", customer: "Kiran Das", status: "CREATED", amount: 999 },
  ];

  const mockUsers = [
    { name: "Riva Verma", email: "riva@example.com", role: "CUSTOMER", status: "Active" },
    { name: "Arun Shah", email: "arun@example.com", role: "CUSTOMER", status: "Active" },
    { name: "Sara Iqbal", email: "sara@example.com", role: "CUSTOMER", status: "KYC Pending" },
  ];

  const mockVendors = [
    { name: "Metro Fleet Co.", ownerEmail: "vendor1@example.com", status: "Approved", fleetCount: 14 },
    { name: "CityRide Motors", ownerEmail: "vendor2@example.com", status: "Under Review", fleetCount: 7 },
    { name: "Airport Wheels", ownerEmail: "vendor3@example.com", status: "Approved", fleetCount: 9 },
  ];

  const mockFleet = [
    { vehicle: "Honda Activa", type: "Scooter", city: "Delhi", status: "Available" },
    { vehicle: "Hyundai i20", type: "Car", city: "Mumbai", status: "On Trip" },
    { vehicle: "Royal Enfield", type: "Bike", city: "Bengaluru", status: "Service Due" },
    { vehicle: "Maruti Swift", type: "Car", city: "Goa", status: "Available" },
  ];

  const mockTickets = [
    { id: "TCK-1201", subject: "Refund not received", priority: "High", status: "Open", customer: "Riva Verma" },
    { id: "TCK-1202", subject: "KYC verification help", priority: "Medium", status: "In Progress", customer: "Sara Iqbal" },
    { id: "TCK-1203", subject: "Vendor payout query", priority: "Low", status: "Resolved", customer: "Metro Fleet Co." },
  ];

  const financeItems = hasDatabase ? history : mockPayments;
  const bookingCards = hasDatabase
    ? history.slice(0, 6).map((item) => ({
        id: item.bookingId,
        city: item.cityName,
        vehicle: "",
        customer: item.customerEmail || "",
        status: item.status,
        amount: item.amountINR,
      }))
    : mockBookings;

  const paidTotal = financeItems.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.amountINR, 0);
  const refundTotal = financeItems.filter((item) => item.status === "REFUNDED").reduce((sum, item) => sum + item.amountINR, 0);
  const uniqueCustomers = new Set(financeItems.map((item) => item.customerEmail).filter(Boolean)).size;

  const exportParams = new URLSearchParams();
  if (provider) exportParams.set("provider", provider);
  if (status) exportParams.set("status", status);
  exportParams.set("hours", String(hours));

  const sectionTabs = [
    { id: "overview", label: "Overview" },
    { id: "ops", label: "Operations" },
    { id: "finance", label: "Finance" },
    { id: "bookings", label: "Bookings" },
    { id: "users-fleet", label: "Users & Vendors" },
    { id: "vendor-applications", label: "Vendor Applications" },
    { id: "vehicles", label: "Vehicle List" },
    { id: "contact-requests", label: "Contact Requests" },
    { id: "alerts", label: "Alerts" },
    { id: "footer", label: "Footer Management" },
    { id: "support", label: "Support" },
    { id: "webhooks", label: "Webhooks" },
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

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" showBadges={false} brandHref="/dashboard/admin" />
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 md:p-10">
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-xs uppercase tracking-wide text-black/60">Admin Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold">Control Center</h1>
        <p className="mt-2 text-sm text-black/70">Signed in as {user?.email}</p>

        <div className="mt-4 mb-6 flex gap-2 overflow-x-auto pb-1">
          <Link href="/dashboard/admin/approvals" className="shrink-0 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
            User & Vendor Approvals
          </Link>
          <Link href="/dashboard/admin/approvals?status=blacklisted" className="shrink-0 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5">
            Blocked Vendors
          </Link>
          <Link href="/dashboard/admin/support-tickets" className="shrink-0 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
            Support Tickets
          </Link>
          <Link href="/dashboard/admin/payments" className="shrink-0 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
            Payments Dashboard
          </Link>
          <Link href="/dashboard/admin/deliveries" className="shrink-0 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
            Deliveries & Pickups
          </Link>
        </div>

        <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-3">
          <p className="text-xs uppercase tracking-wide text-black/60">Sections</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {sectionTabs.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={buildSectionHref(tab.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-white text-black hover:bg-black/[0.03]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </section>

        {activeSection === "overview" && (
          <>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatCard label="Paid Revenue" value={`₹${paidTotal.toLocaleString("en-IN")}`} helper="From paid transactions" />
          <StatCard label="Refunds" value={`₹${refundTotal.toLocaleString("en-IN")}`} helper="Total refunded" />
          <StatCard label="Active Customers" value={uniqueCustomers.toString()} helper="Unique customer emails" />
          <StatCard label="Payments Tracked" value={financeItems.length.toString()} helper="Latest 25 events" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Card title="User Management" value="Monitor customers and account health" />
          <Card title="Vendor Governance" value="Approve vendors and commission rates" />
          <Card title="Finance Reports" value="Payments, refunds, and settlements" />
        </div>

        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Quick Actions</p>
          <h2 className="mt-1 text-lg font-semibold">Admin Controls</h2>
          <p className="mt-1 text-sm text-black/70">Run high-priority admin operations from one place.</p>
          <div className="mt-4">
            <AdminActionPanel />
          </div>
        </section>
          </>
        )}

        {activeSection === "ops" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-black/60">Operations</p>
            <h2 className="mt-1 text-lg font-semibold">Ops Metrics</h2>
            <p className="mt-1 text-sm text-black/70">Track app counters, database health, and webhook trends.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ops Metrics</h2>
            <form method="get" className="flex w-full flex-wrap items-center gap-2 text-sm sm:w-auto">
              <input type="hidden" name="provider" value={provider} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="whProvider" value={whProvider} />
              <input type="hidden" name="whStatus" value={whStatus} />
              <input type="hidden" name="whPage" value={String(whPage)} />
              <label htmlFor="hours" className="text-black/70">Window</label>
              <select id="hours" name="hours" defaultValue={String(hours)} className="w-full rounded border border-black/15 px-3 py-2 text-sm sm:w-auto">
                {allowedTrendHours.map((h) => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
              <button type="submit" className="w-full rounded border border-black px-3 py-2 text-sm sm:w-auto">Apply</button>
            </form>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-black/10 p-3 text-sm">
              <p className="font-medium">App Counters</p>
              <p className="mt-1 text-xs text-black/60">Process started: {new Date(opsReport.appMetrics.startedAt).toLocaleString()}</p>
              <div className="mt-2 space-y-1">
                {Object.entries(opsReport.appMetrics.counters).length === 0 ? (
                  <p className="text-black/60">No counters recorded yet.</p>
                ) : (
                  Object.entries(opsReport.appMetrics.counters)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([name, count]) => (
                      <p key={name}>{name}: <span className="font-medium">{count}</span></p>
                    ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 p-3 text-sm">
              <p className="font-medium">Database Metrics</p>
              {opsReport.databaseMetrics ? (
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">Webhook Logs</p>
                    <div className="mt-1 space-y-1">
                      {opsReport.databaseMetrics.webhookLogs.length === 0 ? (
                        <p className="text-black/60">No webhook logs.</p>
                      ) : (
                        opsReport.databaseMetrics.webhookLogs.map((item) => (
                          <p key={`webhook-${item.status}`}>{item.status}: <span className="font-medium">{item._count._all}</span></p>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">Retry Jobs</p>
                    <div className="mt-1 space-y-1">
                      {opsReport.databaseMetrics.retryJobs.length === 0 ? (
                        <p className="text-black/60">No retry jobs.</p>
                      ) : (
                        opsReport.databaseMetrics.retryJobs.map((item) => (
                          <p key={`retry-${item.status}`}>{item.status}: <span className="font-medium">{item._count._all}</span></p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-black/60">Database metrics unavailable in mock mode.</p>
              )}
            </div>

            <div className="rounded-lg border border-black/10 p-3 text-sm">
              <p className="font-medium">Last {hours}h Trend</p>
              {opsReport.trends ? (
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">Totals</p>
                    <p>Webhook events: <span className="font-medium">{opsReport.trends.totals.webhookLogs}</span></p>
                    <p>Retry jobs: <span className="font-medium">{opsReport.trends.totals.retryJobs}</span></p>
                    <p className="mt-1 text-xs text-black/60">Since: {new Date(opsReport.trends.windowStart).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">Webhook by status</p>
                    <div className="mt-1 space-y-1">
                      {opsReport.trends.webhookLogs.length === 0 ? (
                        <p className="text-black/60">No events in window.</p>
                      ) : (
                        opsReport.trends.webhookLogs.map((item) => (
                          <p key={`trend-webhook-${item.status}`}>{item.status}: <span className="font-medium">{item._count._all}</span></p>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/60">Retry by status</p>
                    <div className="mt-1 space-y-1">
                      {opsReport.trends.retryJobs.length === 0 ? (
                        <p className="text-black/60">No retries in window.</p>
                      ) : (
                        opsReport.trends.retryJobs.map((item) => (
                          <p key={`trend-retry-${item.status}`}>{item.status}: <span className="font-medium">{item._count._all}</span></p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-black/60">Trend metrics unavailable in mock mode.</p>
              )}
            </div>
          </div>
        </section>
        )}

        {activeSection === "finance" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Finance</p>
          <h2 className="mt-1 text-lg font-semibold">Global Payment & Refund History</h2>
          <p className="mt-1 text-sm text-black/70">Review transactions and export finance reports.</p>

          <form className="grid gap-3 rounded-lg border border-black/10 p-3 md:grid-cols-4" method="get">
            <input type="hidden" name="hours" value={String(hours)} />
            <select name="provider" defaultValue={provider} className="rounded border border-black/15 px-3 py-2 text-sm">
              <option value="">All providers</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
            <select name="status" defaultValue={status} className="rounded border border-black/15 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <button type="submit" className="w-full rounded border border-black px-3 py-2 text-sm md:w-auto">Apply Filters</button>
            <a
              href={`/api/admin/finance/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
              className="w-full rounded border border-black px-3 py-2 text-center text-sm md:w-auto"
            >
              Export CSV
            </a>
          </form>

          {financeItems.length === 0 ? (
            <p className="text-sm text-black/60">No finance events yet.</p>
          ) : (
            financeItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-black/10 p-3 text-sm">
                <p className="font-medium">{item.provider.toUpperCase()} · {item.status}</p>
                <p>Booking: {item.bookingId} · City: {item.cityName}</p>
                <p>Amount: ₹{item.amountINR} {item.currency}</p>
                {item.customerEmail && <p>Customer: {item.customerEmail}</p>}
              </div>
            ))
          )}

          <AdminPromotionsPanel />
        </section>
        )}

        {activeSection === "bookings" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Bookings</p>
          <h2 className="mt-1 text-lg font-semibold">Bookings Overview (Live)</h2>
          <p className="text-sm text-black/60">Every new booking or cancellation is reflected here automatically.</p>
          <div className="mt-3">
            <AdminBookingsPanel />
          </div>
        </section>
        )}

        {activeSection === "users-fleet" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Users & Vendors</p>
          <h2 className="mt-1 text-lg font-semibold">User & Vendor Management</h2>
          <p className="mt-1 text-sm text-black/70">Manage account oversight, roles, and vendor pipeline.</p>

          <div className="mt-4 grid gap-6 2xl:grid-cols-2">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">User + Vendor Management</h2>
            <p className="mt-2 text-sm text-black/70">
              View registrations, approve vendors, and manage roles.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-black/60">Latest Users</p>
                <div className="mt-2 space-y-2">
                  {mockUsers.map((user) => (
                    <div key={user.email} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-black/60">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase text-black/60">{user.role}</p>
                        <p className="text-sm font-medium">{user.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-black/60">Vendor Pipeline</p>
                <div className="mt-2 space-y-2">
                  {mockVendors.map((vendor) => (
                    <div key={vendor.ownerEmail} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-black/60">{vendor.ownerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase text-black/60">Fleet</p>
                        <p className="text-sm font-medium">{vendor.fleetCount} vehicles</p>
                        <p className="text-xs text-black/60">{vendor.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          </div>

        </section>
        )}

        {activeSection === "vehicles" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Vehicle List</p>
          <h2 className="mt-1 text-lg font-semibold">Vehicle Management</h2>
          <p className="mt-1 text-sm text-black/70">Manage fleet list, status, brands, vendor mapping, cities, and trending.</p>

          <section className="mt-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <AdminVehicleInventoryPanel />
          </section>
        </section>
        )}

        {activeSection === "vendor-applications" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Vendor Applications</p>
          <h2 className="mt-1 text-lg font-semibold">Vendor Registration Pipeline</h2>
          <p className="mt-1 text-sm text-black/70">Review registrations, manage KYC stages, and generate login ID/password for approved vendors.</p>

          <section className="mt-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <AdminVendorApplicationsPanel />
          </section>
        </section>
        )}

        {activeSection === "contact-requests" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Contact Requests</p>
          <h2 className="mt-1 text-lg font-semibold">Contact Us Submissions</h2>
          <p className="mt-1 text-sm text-black/70">Messages submitted from Contact page appear here for admin follow-up.</p>

          <section className="mt-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <AdminContactRequestsPanel />
          </section>
        </section>
        )}

        {activeSection === "alerts" && (
        <section className="mt-6">
          <AdminAlertsPanel />
        </section>
        )}

        {activeSection === "footer" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Footer Management</p>
          <h2 className="mt-1 text-lg font-semibold">Site Footer Settings</h2>
          <p className="mt-1 text-sm text-black/70">Manage footer brand, description, contact info, and social links.</p>

          <section className="mt-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <AdminSiteSettingsPanel />
          </section>
        </section>
        )}

        {activeSection === "support" && (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-black/60">Support & Reports</p>
          <h2 className="mt-1 text-lg font-semibold">Ticketing and Exports</h2>
          <p className="mt-1 text-sm text-black/70">Handle customer issues and download operational data.</p>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Support Tickets</h2>
            <p className="mt-2 text-sm text-black/70">
              Track unresolved issues, escalations, and SLA status.
            </p>
            <div className="mt-4 space-y-2">
              {mockTickets.map((ticket) => (
                <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-black/60">{ticket.id} · {ticket.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-black/60">{ticket.priority}</p>
                    <p className="text-sm font-medium">{ticket.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Reports + Export</h2>
            <p className="mt-2 text-sm text-black/70">
              Export finance data and operational metrics for audits.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/api/admin/finance/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
                className="rounded border border-black px-3 py-2 text-sm"
              >
                Export Finance CSV
              </a>
              <button className="rounded border border-black px-3 py-2 text-sm" type="button">
                Download Ops Summary
              </button>
            </div>
          </section>
          </div>
        </section>
        )}

        {activeSection === "webhooks" && (
        <section className="mt-6 space-y-3 rounded-2xl border border-black/10 bg-white p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/60">Webhooks</p>
            <h2 className="mt-1 text-lg font-semibold">Webhook Audit Viewer</h2>
            <p className="mt-1 text-sm text-black/70">Inspect webhook events and retry failed deliveries.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <form action="/api/admin/webhooks/retry-now" method="post">
              <button type="submit" className="rounded border border-black px-3 py-2 text-sm">Run Retry Processor</button>
            </form>
          </div>

          <form className="grid gap-3 rounded-lg border border-black/10 p-3 md:grid-cols-4" method="get">
            <input type="hidden" name="hours" value={String(hours)} />
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="whPage" value="1" />
            <select name="whProvider" defaultValue={whProvider} className="rounded border border-black/15 px-3 py-2 text-sm">
              <option value="">All providers</option>
              <option value="STRIPE">STRIPE</option>
              <option value="RAZORPAY">RAZORPAY</option>
            </select>
            <select name="whStatus" defaultValue={whStatus} className="rounded border border-black/15 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="PROCESSED">PROCESSED</option>
              <option value="FAILED">FAILED</option>
              <option value="DUPLICATE">DUPLICATE</option>
              <option value="IGNORED">IGNORED</option>
            </select>
            <button type="submit" className="w-full rounded border border-black px-3 py-2 text-sm md:w-auto">Apply Audit Filters</button>
            <a href={buildSectionHref("webhooks")} className="w-full rounded border border-black px-3 py-2 text-center text-sm md:w-auto">Reset</a>
          </form>

          {webhookLogs.length === 0 ? (
            <p className="text-sm text-black/60">No webhook logs found.</p>
          ) : (
            <>
              {webhookLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-black/10 p-3 text-sm">
                  <p className="font-medium">{log.provider} · {log.eventType} · {log.status}</p>
                  <p>Event ID: {log.eventId}</p>
                  {log.providerEntityId && <p>Entity: {log.providerEntityId}</p>}
                  {log.errorMessage && <p className="text-red-700">Error: {log.errorMessage}</p>}
                  {log.status === "FAILED" && log.providerEntityId && (
                    <form action="/api/admin/webhooks/requeue" method="post" className="mt-2">
                      <input type="hidden" name="logId" value={log.id} />
                      <button type="submit" className="rounded border border-black px-3 py-1 text-sm">Requeue Event</button>
                    </form>
                  )}
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 p-3 text-sm">
                <p>
                  Page {webhookAudit.pagination.page} of {Math.max(1, webhookAudit.pagination.totalPages)} · Total logs: {webhookAudit.pagination.totalItems}
                </p>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <a
                    href={`/dashboard/admin?provider=${encodeURIComponent(provider)}&status=${encodeURIComponent(status)}&whProvider=${encodeURIComponent(whProvider)}&whStatus=${encodeURIComponent(whStatus)}&whPage=${Math.max(1, whPage - 1)}&hours=${encodeURIComponent(String(hours))}`}
                    className="w-full rounded border border-black px-3 py-1 text-center sm:w-auto"
                  >
                    Previous
                  </a>
                  <a
                    href={`/dashboard/admin?provider=${encodeURIComponent(provider)}&status=${encodeURIComponent(status)}&whProvider=${encodeURIComponent(whProvider)}&whStatus=${encodeURIComponent(whStatus)}&whPage=${Math.min(Math.max(1, webhookAudit.pagination.totalPages), whPage + 1)}&hours=${encodeURIComponent(String(hours))}`}
                    className="w-full rounded border border-black px-3 py-1 text-center sm:w-auto"
                  >
                    Next
                  </a>
                </div>
              </div>
            </>
          )}
        </section>
        )}
      </section>
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-black/70">{value}</p>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/5 p-4">
      <p className="text-xs uppercase tracking-wide text-black/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-black">{value}</p>
      <p className="mt-1 text-xs text-black/60">{helper}</p>
    </div>
  );
}
