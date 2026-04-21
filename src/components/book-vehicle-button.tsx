"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function BookVehicleButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me");
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isAuthenticated === false) {
      router.push("/login?next=%2Fbook-vehicle");
    } else {
      router.push("/book-vehicle");
    }
  }

  return (
    <a
      href="/book-vehicle"
      onClick={handleClick}
      className={className || "rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/50"}
    >
      Book Vehicle
    </a>
  );
}
