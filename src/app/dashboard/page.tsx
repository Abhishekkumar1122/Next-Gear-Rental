import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server-session";

export default async function DashboardRootPage() {
  const user = await getServerSessionUser();
  const role = user?.role ?? "CUSTOMER";

  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (role === "VENDOR") {
    redirect("/dashboard/vendor");
  }

  redirect("/dashboard/customer");
}
