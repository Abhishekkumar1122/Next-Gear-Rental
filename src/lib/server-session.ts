import { authCookieName, verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getServerSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return null;

  try {
    const payload = await verifySessionToken(token);
    return {
      id: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      role: String(payload.role ?? "CUSTOMER"),
    };
  } catch {
    return null;
  }
}
