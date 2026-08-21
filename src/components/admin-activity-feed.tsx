"use client";

import { useEffect, useState } from "react";

type ActivityLog = {
  id: string;
  time: string;
  category: "PAYMENT" | "KYC" | "VEHICLE" | "SYSTEM" | "SUPPORT";
  message: string;
};

const preseededLogs: ActivityLog[] = [
  { id: "1", time: "23:25:01", category: "PAYMENT", message: "Stripe payout of ₹82,400 initiated to HDFC bank account ending in *4938" },
  { id: "2", time: "23:26:12", category: "KYC", message: "KYC verification approved for new vendor: Bangalore Moto Hub" },
  { id: "3", time: "23:27:08", category: "VEHICLE", message: "Vehicle KTM Duke 390 (KA-03-HL-9481) telemetry synchronized successfully" },
  { id: "4", time: "23:28:44", category: "SYSTEM", message: "Automated webhook retry system triggered - 0 errors logged" },
  { id: "5", time: "23:29:19", category: "SUPPORT", message: "Support ticket #8392 marked RESOLVED by Admin: 'Refund processing time query'" },
  { id: "6", time: "23:31:02", category: "PAYMENT", message: "Razorpay callback order_pay_93a8d1e confirmed for user rajesh.kumar@gmail.com (₹3,450)" },
];

const mockTemplates = [
  { category: "PAYMENT" as const, message: "Refund of ₹2,800 processed successfully for booking NG-93821" },
  { category: "KYC" as const, message: "Aadhaar document uploaded for user karthik_sharma99 - validation pending" },
  { category: "VEHICLE" as const, message: "Vehicle Royal Enfield Himalayan (KA-51-EM-2941) state set to MAINTENANCE (Scheduled Service)" },
  { category: "SYSTEM" as const, message: "API Gateway rate limiter cache cleared successfully" },
  { category: "SUPPORT" as const, message: "New support ticket #8401 created: 'Trouble scanning delivery QR code'" },
  { category: "PAYMENT" as const, message: "Stripe invoice generated: NG-INV-99382 for user preeti.sen@outlook.com" },
  { category: "KYC" as const, message: "Driving License verification failed (Expiring within 30 days) for user nitin_v" },
  { category: "VEHICLE" as const, message: "Suzuki Access 125 (KA-05-JK-1922) returned at Indiranagar Hub. Status set to AVAILABLE." }
];

export function AdminActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>(preseededLogs);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomTemplate = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
      const now = new Date();
      const timeString = now.toTimeString().split(" ")[0];
      const newLog: ActivityLog = {
        id: Math.random().toString(),
        time: timeString,
        category: randomTemplate.category,
        message: randomTemplate.message
      };

      setLogs((prev) => {
        const next = [newLog, ...prev];
        return next.slice(0, 7); // keep last 7 items
      });
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const categoryBadges = {
    PAYMENT: "text-emerald-400 border-emerald-950/40 bg-emerald-950/20",
    KYC: "text-blue-400 border-blue-950/40 bg-blue-950/20",
    VEHICLE: "text-amber-400 border-amber-950/40 bg-amber-950/20",
    SYSTEM: "text-purple-400 border-purple-950/40 bg-purple-950/20",
    SUPPORT: "text-rose-400 border-rose-950/40 bg-rose-950/20"
  };

  return (
    <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Real-Time Streams</p>
          <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">Live Activity Console</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Live Monitor Feed</span>
        </div>
      </div>

      {/* Terminal log wrapper */}
      <div className="font-mono text-xs rounded-2xl bg-[#050505] border border-white/5 p-4 space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 animate-fade-in py-0.5 border-b border-white/[0.02] last:border-0 pb-1.5 last:pb-0">
            <span className="text-white/30 font-bold select-none">[{log.time}]</span>
            <span className={`text-[8.5px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md border ${categoryBadges[log.category]}`}>
              {log.category}
            </span>
            <span className="text-white/80 leading-relaxed break-words flex-1">
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
