"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function HeaderAuthButton({
  variant = "light",
  isScrolled = false,
}: {
  variant?: "dark" | "light";
  isScrolled?: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDark = variant === "dark";

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch {
      // User not authenticated
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  if (isLoading) {
    return null;
  }

  if (user) {
    const dashboardHref = user.role === "ADMIN"
      ? "/dashboard/admin"
      : user.role === "VENDOR"
        ? "/dashboard/vendor"
        : "/dashboard/customer";

    return (
      <div className="flex items-center gap-2">
        {/* Hide user email when floating navbar is active on scroll to prevent congestion */}
        {!isScrolled && (
          <Link
            href={dashboardHref}
            title={user.email}
            className={`hidden text-xs sm:inline-block max-w-[140px] truncate transition-colors hover:text-[var(--brand-red)] ${isDark ? "text-white/70" : "text-black/60"}`}
          >
            {user.email}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition hover:scale-105 ${
            isDark
              ? "border-white/30 hover:bg-white/10 text-white"
              : "border-black/20 hover:bg-black/5 text-black"
          }`}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition hover:scale-105 sm:text-sm ${
        isDark
          ? "bg-[var(--brand-red)] text-white shadow-lg shadow-red-500/30"
          : "bg-[var(--brand-red)] text-white shadow-lg shadow-red-500/20"
      }`}
    >
      Login / Sign Up
    </Link>
  );
}
