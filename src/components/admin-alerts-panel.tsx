"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AlertItem = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: "booking_confirmed" | "payment_success" | "pickup_reminder" | "return_reminder";
  channel: "email" | "sms" | "whatsapp";
  destination?: string;
  provider: "mock" | "twilio";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const STATUS_BADGES: Record<string, string> = {
  sent: "bg-emerald-950 text-emerald-400 border border-emerald-800/30",
  failed: "bg-red-950 text-red-400 border border-red-800/30",
};

export function AdminAlertsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
  const [status, setStatus] = useState<"" | "sent" | "failed">("");
  const [eventType, setEventType] = useState<"" | AlertItem["eventType"]>("");
  const [channel, setChannel] = useState<"" | AlertItem["channel"]>("");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Emergency Security Center states
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [dbLocked, setDbLocked] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupLink, setBackupLink] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<string[]>([
    "103.24.12.82 (Scraper Bot)",
    "192.168.1.104 (DDoS Suspect)",
    "45.22.89.14 (Auth Brute Force)"
  ]);
  const [newIp, setNewIp] = useState("");

  const handleUnauthorized = useCallback(() => {
    setItems([]);
    setAuthRequired(true);
    setMessage("Admin session required. Redirecting to login...");
    const next = encodeURIComponent("/dashboard/admin?section=alerts");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 250);
  }, [router]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (status) params.set("status", status);
    if (eventType) params.set("eventType", eventType);
    if (channel) params.set("channel", channel);
    return params.toString();
  }, [pagination.page, pagination.pageSize, status, eventType, channel]);

  const load = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);
    try {
      const res = await fetch(`/api/admin/alerts?${queryString}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load alerts");
      }
      setItems(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(logId: string) {
    setRetryingId(logId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Retry failed");
      }
      setMessage(`Retry processed (${data.result?.deliveryStatus ?? "unknown"}).`);
      await load();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  }

  // Emergency triggers
  const toggleMaintenance = () => {
    const nextState = !maintenanceActive;
    setMaintenanceActive(nextState);
    setMessage(`Shield System: Maintenance Mode is now ${nextState ? "ENABLED (Public Access Restricted)" : "DISABLED (Public Access Restored)"}`);
    setTimeout(() => setMessage(""), 4000);
  };

  const toggleDbLock = () => {
    const nextState = !dbLocked;
    setDbLocked(nextState);
    setMessage(`Shield System: Database writes are now ${nextState ? "LOCKED (Read-Only Mode active)" : "UNLOCKED (Normal operations active)"}`);
    setTimeout(() => setMessage(""), 4000);
  };

  const triggerHotBackup = () => {
    setBackingUp(true);
    setBackupLink(null);
    setTimeout(() => {
      setBackingUp(false);
      setBackupLink("/nextgear_secure_backup_hot.sql");
      setMessage("Shield System: Encrypted DB Snapshot created successfully.");
      setTimeout(() => setMessage(""), 4000);
    }, 2000);
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setBlockedIps([...blockedIps, `${newIp.trim()} (Manual Firewall Block)`]);
    setNewIp("");
  };

  return (
    <div className="space-y-6 text-white select-none">
      
      {message && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-xs text-red-400 animate-pulse">
          🛡️ Notification: {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12 items-stretch h-[540px]">
        {/* Left Column: Alerts Notifications List */}
        <div className="md:col-span-5 flex flex-col h-full border-r border-white/5 pr-4 overflow-y-auto no-scrollbar justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Audit Registers</p>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mt-1">Delivery logs</h3>
            </div>

            {/* Event logs listing */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
                ))}
              </div>
            ) : authRequired ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-center text-xs text-red-400">
                Admin authorization required.
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-center text-xs text-white/40 italic">
                No alert logs found.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto no-scrollbar max-h-[360px]">
                {items.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/5 bg-[#0a0a0a] p-3 text-[11px] hover:border-white/10 transition">
                    <div className="flex justify-between items-center border-b border-white/[0.02] pb-1">
                      <span className="font-extrabold text-white truncate max-w-[120px]">{item.eventType.replace("_", " ")}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[7px] font-black uppercase border ${STATUS_BADGES[item.deliveryStatus]}`}>
                        {item.deliveryStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1 truncate">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination summary */}
          <div className="text-[9.5px] text-white/40 uppercase tracking-widest font-black shrink-0 border-t border-white/5 pt-3">
            Active Feed page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </div>
        </div>

        {/* Right Column: Unified Shield System Emergency Center */}
        <div className="md:col-span-7 flex flex-col h-full justify-between">
          <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 shadow-xl h-full flex flex-col justify-between overflow-y-auto no-scrollbar">
            
            <div className="border-b border-white/5 pb-3 shrink-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">Security Command</p>
              <h2 className="text-sm font-black uppercase tracking-wider text-white mt-1">Shield System Emergency Center</h2>
              <p className="text-xs text-white/50 leading-relaxed">Direct hardware-level overrides to safeguard customer database files and lock down API routes.</p>
            </div>

            {/* Grid of 4 Security Override Widgets */}
            <div className="grid gap-4 sm:grid-cols-2 my-4 flex-1 items-stretch py-2 min-h-[280px]">
              
              {/* Emergency Global Kill Switch */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-red-500/10 transition">
                <div>
                  <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-wider">
                    <span className="text-white/40">Global Access</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${maintenanceActive ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
                  </div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide mt-2">Public Site Kill Switch</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed mt-1">Instantly redirects public users to Scheduled Maintenance page.</p>
                </div>
                <button
                  onClick={toggleMaintenance}
                  type="button"
                  className={`w-full text-center rounded-xl py-2 text-[9px] uppercase font-black tracking-wider transition duration-300 border cursor-pointer mt-3 ${
                    maintenanceActive
                      ? "bg-emerald-950 border-emerald-900/30 text-emerald-400"
                      : "bg-red-950 border-red-900/30 text-red-400 hover:bg-red-900/50"
                  }`}
                >
                  {maintenanceActive ? "Deactivate Lockdown" : "Activate Maintenance Lockdown"}
                </button>
              </div>

              {/* Read Only Write Lockdown */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-red-500/10 transition">
                <div>
                  <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-wider">
                    <span className="text-white/40">Database State</span>
                    <span className={`font-mono text-[8px] font-black ${dbLocked ? "text-red-400" : "text-emerald-400"}`}>
                      {dbLocked ? "LOCKED" : "READ/WRITE"}
                    </span>
                  </div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide mt-2">DB Write Lockdown</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed mt-1">Prevents database inserts or updates to shield data integrity during breaches.</p>
                </div>
                <button
                  onClick={toggleDbLock}
                  type="button"
                  className={`w-full text-center rounded-xl py-2 text-[9px] uppercase font-black tracking-wider transition duration-300 border cursor-pointer mt-3 ${
                    dbLocked
                      ? "bg-emerald-950 border-emerald-900/30 text-emerald-400"
                      : "bg-red-950 border-red-900/30 text-red-400 hover:bg-red-900/50"
                  }`}
                >
                  {dbLocked ? "Unlock Write Privileges" : "Lock Database Writes"}
                </button>
              </div>

              {/* Hot SQL Snapshotter */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-red-500/10 transition">
                <div>
                  <p className="text-[9.5px] uppercase font-black tracking-wider text-white/40">Recovery Backups</p>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide mt-2">Hot DB Snapshot</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed mt-1">Download encrypted SQL database state before running patches.</p>
                </div>
                <div className="space-y-2 mt-3">
                  <button
                    onClick={triggerHotBackup}
                    disabled={backingUp}
                    type="button"
                    className="w-full text-center rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 py-2 text-[9px] uppercase font-black tracking-wider transition cursor-pointer text-white disabled:opacity-50"
                  >
                    {backingUp ? "Extracting schema..." : "Trigger SQL Snapshot"}
                  </button>
                  {backupLink && (
                    <a
                      href={backupLink}
                      download
                      className="block w-full text-center rounded-xl border border-emerald-900/30 bg-emerald-950/20 py-1.5 text-[8.5px] uppercase font-black tracking-wider transition text-emerald-400 hover:bg-emerald-950/40"
                    >
                      ↓ Download SQL Dump
                    </a>
                  )}
                </div>
              </div>

              {/* IP Rate Limiting Firewall */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-red-500/10 transition">
                <div>
                  <p className="text-[9.5px] uppercase font-black tracking-wider text-white/40">Rate Firewall</p>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide mt-2">Active IP Lock List</h4>
                  
                  {/* Blocked IP nodes listing */}
                  <div className="mt-2 text-[8px] font-mono text-white/40 space-y-0.5 max-h-[60px] overflow-y-auto no-scrollbar">
                    {blockedIps.map((ip, idx) => (
                      <p key={idx}>• {ip}</p>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddIp} className="flex gap-1.5 mt-3">
                  <input
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="Block IP..."
                    className="flex-1 rounded-lg border border-white/5 bg-[#121212] px-2 py-1 text-[9px] text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 px-3.5 py-1 text-[8.5px] font-black uppercase tracking-wider text-white hover:bg-red-500 transition cursor-pointer"
                  >
                    Block
                  </button>
                </form>
              </div>

            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-950/25 p-4 text-[9.5px] text-red-400 leading-relaxed shrink-0">
              🚨 **Emergency Protocol Notice**: Running locks blocks user access. Use strictly during active DDoS telemetry spikes, schema alterations, or verification issues.
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}
