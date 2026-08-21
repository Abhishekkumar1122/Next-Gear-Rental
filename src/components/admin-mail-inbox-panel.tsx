"use client";

import { useState, useEffect, useMemo } from "react";
import { EmailLogEntry } from "@/lib/email-log-store";

export function AdminMailInboxPanel() {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "outgoing" | "incoming">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "sent" | "failed" | "received">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [useBrandedLayout, setUseBrandedLayout] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // View Email Modal State
  const [viewLog, setViewLog] = useState<EmailLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mail");
      const data = await res.json();
      if (data.ok && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("[Fetch Mail Logs Failed]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeMessage) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          message: composeMessage,
          useBrandedTemplate: useBrandedLayout,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSendResult({ type: "success", text: data.message || "Email sent successfully!" });
      setComposeTo("");
      setComposeSubject("");
      setComposeMessage("");
      fetchLogs();

      setTimeout(() => {
        setIsComposeOpen(false);
        setSendResult(null);
      }, 1500);
    } catch (err: any) {
      setSendResult({ type: "error", text: err.message || "Failed to send email" });
    } finally {
      setIsSending(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTo = item.to.toLowerCase().includes(q);
        const matchesFrom = item.from.toLowerCase().includes(q);
        const matchesSub = item.subject.toLowerCase().includes(q);
        const matchesMsg = item.message ? item.message.toLowerCase().includes(q) : false;
        if (!matchesTo && !matchesFrom && !matchesSub && !matchesMsg) return false;
      }
      return true;
    });
  }, [logs, filterType, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const totalSent = logs.filter((l) => l.type === "outgoing" && l.status === "sent").length;
    const totalReceived = logs.filter((l) => l.type === "incoming").length;
    const failedCount = logs.filter((l) => l.status === "failed").length;
    return { totalSent, totalReceived, failedCount, total: logs.length };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📬</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Mail Command Center & Outbox</h2>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Monitor real-time outgoing customer emails, incoming inquiries, and compose branded messages directly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50 rounded-xl px-5 py-2.5 text-xs font-black text-white transition shadow-lg hover:shadow-red-900/30 cursor-pointer"
        >
          <span>➕ Compose New Email</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">Total Sent (Outbox)</div>
            <div className="text-2xl font-black text-white mt-1">{stats.totalSent}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            📤
          </div>
        </div>

        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">Incoming Inquiries (Inbox)</div>
            <div className="text-2xl font-black text-white mt-1">{stats.totalReceived}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
            📥
          </div>
        </div>

        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">Delivery Success Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {stats.total > 0 ? `${Math.round(((stats.totalSent + stats.totalReceived) / (stats.total || 1)) * 100)}%` : "100%"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
            ⚡
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="bg-[#0d0d11] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-2 bg-[#14141a] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterType === "all" ? "bg-[var(--brand-red)] text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            All Messages ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("outgoing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterType === "outgoing" ? "bg-[var(--brand-red)] text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Outbox (Sent)
          </button>
          <button
            type="button"
            onClick={() => setFilterType("incoming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterType === "incoming" ? "bg-[var(--brand-red)] text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            Inbox (Received)
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search email, recipient, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14141a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Mail Logs Table */}
      <div className="bg-[#09090c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121218] border-b border-white/10 text-white/50 uppercase text-[9px] font-black tracking-wider">
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Recipient / From</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-white/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40 text-xs">
                    Loading email records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40 text-xs">
                    No email logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.type === "outgoing" ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          OUTGOING 📤
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-950 text-blue-400 border border-blue-500/30">
                          INCOMING 📥
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-white/60 uppercase">
                      {item.category.replace("_", " ")}
                    </td>

                    <td className="py-3 px-4 font-mono text-white text-xs">
                      {item.type === "outgoing" ? item.to : item.from}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate font-bold text-white">
                      {item.subject}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === "sent" && (
                        <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                          ● DELIVERED
                        </span>
                      )}
                      {item.status === "received" && (
                        <span className="text-blue-400 font-bold text-[10px] flex items-center gap-1">
                          ● RECEIVED
                        </span>
                      )}
                      {item.status === "failed" && (
                        <span className="text-red-400 font-bold text-[10px] flex items-center gap-1">
                          ● FAILED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-white/50 text-[10px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setViewLog(item)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        👁️ View Email
                      </button>

                      {item.type === "incoming" && (
                        <button
                          type="button"
                          onClick={() => {
                            setComposeTo(item.from);
                            setComposeSubject(`Re: ${item.subject}`);
                            setIsComposeOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold transition cursor-pointer"
                        >
                          💬 Reply
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPOSE MAIL MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f13] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                ✏️ Compose Direct Email
              </h3>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">To (Recipient Email):</label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full bg-[#18181f] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">Subject:</label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g. Next Gear Special Offer / Booking Update"
                  className="w-full bg-[#18181f] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">Message Content:</label>
                <textarea
                  required
                  rows={5}
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full bg-[#18181f] border border-white/15 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="brandedToggle"
                  checked={useBrandedLayout}
                  onChange={(e) => setUseBrandedLayout(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-red-600 focus:ring-0"
                />
                <label htmlFor="brandedToggle" className="text-xs text-white/80 cursor-pointer">
                  Use Next Gear Official Executive Branded HTML Template
                </label>
              </div>

              {sendResult && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  sendResult.type === "success" 
                    ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300" 
                    : "bg-red-950/80 border border-red-500/40 text-red-300"
                }`}>
                  {sendResult.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-900/40 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? "Sending..." : "Send Email 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EMAIL FULL MODAL */}
      {viewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f13] border border-white/20 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase font-black tracking-wider">
                  {viewLog.category.replace("_", " ")}
                </span>
                <h3 className="text-sm font-black text-white">{viewLog.subject}</h3>
                <div className="text-[11px] text-white/50 mt-0.5">
                  To: <span className="text-white font-mono">{viewLog.to}</span> | From: <span className="text-white font-mono">{viewLog.from}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewLog(null)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#050505] min-h-[380px]">
              {viewLog.html ? (
                <iframe
                  srcDoc={viewLog.html}
                  className="w-full h-full min-h-[380px] border-none"
                  title="Email Preview"
                />
              ) : (
                <div className="p-4 text-xs font-mono text-white/80 white-space-pre-wrap">
                  {viewLog.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewLog(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
