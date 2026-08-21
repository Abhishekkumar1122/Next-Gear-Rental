"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ApprovalsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin?section=approvals");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-xs text-white/50 uppercase tracking-widest font-bold">
      Redirecting to approvals ledger...
    </div>
  );
}
