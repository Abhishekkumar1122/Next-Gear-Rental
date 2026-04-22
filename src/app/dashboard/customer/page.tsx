import { SiteHeader } from "@/components/site-header";
import { getServerSessionUser } from "@/lib/server-session";
import { redirect } from "next/navigation";
import { CustomerDashboardClient } from "@/components/customer-dashboard-client";

export default async function CustomerDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fcustomer");

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-black">
      <SiteHeader variant="light" />
      <main className="mx-auto max-w-5xl p-6 md:p-10">
        <CustomerDashboardClient email={user.email} name={user.email.split("@")[0]} />
      </main>
    </div>
  );
}
