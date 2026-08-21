"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SupportTicketsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin?section=support");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-xs text-white/50 uppercase tracking-widest font-bold">
      Redirecting to support ticket inbox...
    </div>
  );
}
