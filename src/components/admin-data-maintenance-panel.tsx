"use client";

import { useState } from "react";
import {
  Trash2,
  Download,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
  Layers,
  FileCheck,
  CreditCard,
  Bell,
  Sparkles,
} from "lucide-react";

type MaintenanceActionType = "clean_test_bookings" | "clean_payout_ledger" | "clean_notifications_logs" | "full_production_reset";

export function AdminDataMaintenancePanel() {
  const [selectedAction, setSelectedAction] = useState<MaintenanceActionType | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  }

  async function handleDownloadBackup() {
    try {
      setIsDownloading(true);
      const res = await fetch("/api/admin/maintenance/backup");
      if (!res.ok) {
        throw new Error("Failed to download database backup.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `next-gear-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("💾 Database snapshot backup downloaded successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to download backup.", "error");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleExecuteMaintenance() {
    if (!selectedAction) return;
    if (confirmText !== "CONFIRM_CLEAN") {
      showToast("Please type CONFIRM_CLEAN exactly to proceed.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch("/api/admin/maintenance/clean-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selectedAction,
          confirmation: confirmText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ ${data.message}`, "success");
        setSelectedAction(null);
        setConfirmText("");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast(data.error || "Maintenance task failed.", "error");
      }
    } catch {
      showToast("Network error executing maintenance operation.", "error");
    } finally {
      setIsProcessing(false);
    }
  }

  const actionConfigs: Record<
    MaintenanceActionType,
    { title: string; desc: string; dangerLevel: "Low" | "Medium" | "High"; icon: any; safeDetails: string[] }
  > = {
    clean_test_bookings: {
      title: "Purge Test Bookings & Rental Invoices",
      desc: "Cleans all dummy and test bookings, returns, and payment records created during testing.",
      dangerLevel: "Medium",
      icon: Trash2,
      safeDetails: ["✅ Keeps Fleet Vehicles & Pricing", "✅ Keeps Registered Vendors & Garages", "✅ Keeps Admin Account & Settings"],
    },
    clean_payout_ledger: {
      title: "Reset Vendor Payout & Ledger History",
      desc: "Wipes mock/test payout requests, pending withdrawal tickets, and resets balance ledgers.",
      dangerLevel: "Low",
      icon: CreditCard,
      safeDetails: ["✅ Keeps Vendor Commission Rates", "✅ Keeps Linked Bank & UPI Accounts", "✅ Keeps Vehicle Listings"],
    },
    clean_notifications_logs: {
      title: "Clear Notifications & Webhook Queue",
      desc: "Purges historical test alerts, webhook audit logs, and failed event retries.",
      dangerLevel: "Low",
      icon: Bell,
      safeDetails: ["✅ Keeps Email Templates", "✅ Keeps Broadcast Lists", "✅ Reduces Database Query Footprint"],
    },
    full_production_reset: {
      title: "Full Production Fresh Slate (Day-1 Launch)",
      desc: "Resets all test bookings, payments, and payouts to a squeaky-clean zero state ready for real public launch.",
      dangerLevel: "High",
      icon: ShieldAlert,
      safeDetails: [
        "✅ Keeps All Listed Cars & Bikes",
        "✅ Keeps All Cities & Delivery Hubs",
        "✅ Keeps Admin Login & Site Configuration",
      ],
    },
  };

  return (
    <div className="space-y-6 text-white animate-[fadeIn_0.2s_ease-out]">
      {/* 🔔 Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 text-xs font-bold p-3.5 rounded-2xl border shadow-xl animate-[fadeIn_0.2s_ease-out] ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
              <Database className="w-3.5 h-3.5" /> Ops Database Maintenance Suite
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Data Cleanup & Production Reset Studio
            </h2>
            <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
              Safely purge test bookings, reset vendor payout histories, or prepare the platform for a 100% clean day-one public launch. All fleet vehicles, cities, and master settings remain fully preserved.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-extrabold uppercase tracking-wider text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Generating Backup...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Database Backup (.JSON)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Selective Maintenance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(actionConfigs) as MaintenanceActionType[]).map((actionKey) => {
          const config = actionConfigs[actionKey];
          const Icon = config.icon;

          return (
            <div
              key={actionKey}
              className="rounded-3xl border border-white/10 bg-black/40 hover:bg-white/[0.02] p-5 md:p-6 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-red-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      config.dangerLevel === "High"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : config.dangerLevel === "Medium"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}
                  >
                    {config.dangerLevel} Impact
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm md:text-base font-extrabold text-white">{config.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{config.desc}</p>
                </div>

                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3 space-y-1.5 text-[11px] text-white/70">
                  {config.safeDetails.map((detail, idx) => (
                    <div key={idx}>{detail}</div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedAction(actionKey);
                  setConfirmText("");
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-red-500/40 bg-white/5 hover:bg-red-500/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Execute Cleanup</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 🔒 SECURITY CONFIRMATION MODAL */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="max-w-md w-full rounded-3xl border-2 border-red-500/50 bg-gradient-to-b from-[#180909] via-[#0e0505] to-[#080202] p-6 space-y-5 shadow-[0_0_60px_rgba(239,68,68,0.3)] relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base md:text-lg font-black text-white">
                {actionConfigs[selectedAction].title}
              </h3>
              <p className="text-xs text-white/60">
                This action is irreversible. To confirm execution, type <strong className="text-red-400 font-mono">CONFIRM_CLEAN</strong> in the box below:
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM_CLEAN"
                className="w-full rounded-xl border-2 border-red-500/30 bg-black/60 px-4 py-2.5 text-xs text-center font-mono font-bold text-white uppercase tracking-wider outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setConfirmText("");
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMaintenance}
                disabled={isProcessing || confirmText !== "CONFIRM_CLEAN"}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning...</span>
                  </>
                ) : (
                  "Confirm & Wipe"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
