import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "nextgear_session";

function dashboardForRole(role: string) {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "VENDOR") return "/dashboard/vendor";
  return "/dashboard/customer";
}

function requiredRoleForPath(pathname: string) {
  if (pathname.startsWith("/dashboard/admin")) return "ADMIN";
  if (pathname.startsWith("/dashboard/vendor")) return "VENDOR";
  return "CUSTOMER";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const requiresLogin = pathname.startsWith("/book-vehicle") || pathname.startsWith("/payment");

  if (!token) {
    if (requiresLogin) {
      const nextPath = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?next=${nextPath}`, request.url));
    }
    return NextResponse.redirect(new URL("/?auth=required", request.url));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (requiresLogin) {
      const nextPath = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?next=${nextPath}`, request.url));
    }
    return NextResponse.redirect(new URL("/?auth=misconfigured", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = String(payload.role ?? "CUSTOMER");

    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
    }

    if (requiresLogin) {
      return NextResponse.next();
    }

    const requiredRole = requiredRoleForPath(pathname);
    if (requiredRole !== role) {
      return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
    }

    return NextResponse.next();
  } catch {
    if (requiresLogin) {
      const nextPath = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?next=${nextPath}`, request.url));
    }
    return NextResponse.redirect(new URL("/?auth=invalid", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/book-vehicle", "/payment"],
};
