import { authCookieName, verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

function getRequestHost(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) return forwardedHost;
  return request.headers.get("host") ?? "";
}

function isSameOrigin(request: Request) {
  const host = getRequestHost(request);
  if (!host) return false;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
}

export async function assertAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) return false;

  try {
    const payload = await verifySessionToken(token);
    return String(payload.role) === "ADMIN";
  } catch {
    return false;
  }
}

export async function assertAdminMutationRequest(request: Request) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  if (!isSameOrigin(request)) {
    return { ok: false as const, status: 403, error: "CSRF validation failed" };
  }

  return { ok: true as const };
}
