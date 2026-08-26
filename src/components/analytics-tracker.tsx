"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Send non-blocking visitor ping
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ path: pathname })], {
          type: "application/json",
        });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        void fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: pathname }),
          keepalive: true,
        });
      }
    } catch {}
  }, [pathname]);

  return null;
}
