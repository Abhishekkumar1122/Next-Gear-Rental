"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationCategory,
  CommunicationStatus,
  CommunicationLogSummary,
  CommunicationLogDetail,
} from "@/lib/communication-store";

export function AdminMailInboxPanel() {
  const [logs, setLogs] = useState<CommunicationLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    totalOtps: 0,
    failedCount: 0,
    total: 0,
    successRate: 100,
  });

  // Filter States
  const [filterDirection, setFilterDirection] = useState<"all" | "outgoing" | "incoming">("all");
  const [filterChannel, setFilterChannel] = useState<"all" | "email" | "whatsapp" | "sms">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "otp" | "booking_confirmed" | "contact_inquiry" | "welcome">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "sent" | "received" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [useBrandedLayout, setUseBrandedLayout] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // View Email / Message Modal State
  const [selectedLogSummary, setSelectedLogSummary] = useState<CommunicationLogSummary | null>(null);
  const [viewLogDetail, setViewLogDetail] = useState<CommunicationLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDirection !== "all") params.set("direction", filterDirection);
      if (filterChannel !== "all") params.set("channel", filterChannel);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("limit", "100");

      const res = await fetch(`/api/admin/mail?${params.toString()}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.logs)) {
        setLogs(data.logs);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("[Fetch Mail Logs Failed]", err);
    } finally {
      setLoading(false);
    }
  }, [filterDirection, filterChannel, filterCategory, filterStatus, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Load complete HTML/body only when opening detail modal (zero RAM/bandwidth waste during list browsing)
  const handleOpenDetail = async (item: CommunicationLogSummary) => {
    setSelectedLogSummary(item);
    setViewLogDetail(null);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/admin/mail/${item.id}`);
      const data = await res.json();
      if (data.ok && data.log) {
        setViewLogDetail(data.log);
      } else {
        // Fallback to summary snippet if detail not returned
        setViewLogDetail({
          ...item,
          message: item.snippet,
        });
      }
    } catch {
      setViewLogDetail({
        ...item,
        message: item.snippet,
      });
    } finally {
      setDetailLoading(false);
    }
  };

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
      if (filterDirection !== "all" && item.direction !== filterDirection) return false;
      if (filterChannel !== "all" && item.channel !== filterChannel) return false;
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesRec = item.recipient.toLowerCase().includes(q);
        const matchesSend = item.sender.toLowerCase().includes(q);
        const matchesSub = item.subject.toLowerCase().includes(q);
        const matchesSnip = item.snippet.toLowerCase().includes(q);
        if (!matchesRec && !matchesSend && !matchesSub && !matchesSnip) return false;
      }
      return true;
    });
  }, [logs, filterDirection, filterChannel, filterCategory, filterStatus, searchQuery]);

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
            Real-time audit log of all communications: Emails, WhatsApp alerts, OTPs, verification passes, and incoming customer inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 bg-[#181820] hover:bg-[#20202a] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50 rounded-xl px-5 py-2.5 text-xs font-black text-white transition shadow-lg hover:shadow-red-900/30 cursor-pointer"
          >
            <span>➕ Compose New Email</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Outbox Total Sent */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">Total Sent (Outbox)</div>
            <div className="text-2xl font-black text-white mt-1">{stats.totalSent}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            📤
          </div>
        </div>

        {/* Incoming Inquiries */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">Incoming Inquiries (Inbox)</div>
            <div className="text-2xl font-black text-white mt-1">{stats.totalReceived}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
            📥
          </div>
        </div>

        {/* Total OTPs & Auth Messages */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">OTPs & Verifications</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.totalOtps}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
            🔑
          </div>
        </div>

        {/* Delivery Success Rate */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-white/50 tracking-wider">Delivery Success Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {stats.successRate}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
            ⚡
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Channel Pills */}
      <div className="bg-[#0d0d11] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Direction Tabs */}
          <div className="flex items-center gap-2 bg-[#14141a] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setFilterDirection("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterDirection === "all" ? "bg-[var(--brand-red)] text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              All Messages ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterDirection("outgoing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterDirection === "outgoing" ? "bg-[var(--brand-red)] text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Outbox (Sent)
            </button>
            <button
              type="button"
              onClick={() => setFilterDirection("incoming")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterDirection === "incoming" ? "bg-[var(--brand-red)] text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Inbox (Received)
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search phone, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14141a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Quick Category / Channel Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 mr-1">Filter Channel:</span>
          
          <button
            type="button"
            onClick={() => { setFilterChannel("all"); setFilterCategory("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
              filterChannel === "all" && filterCategory === "all"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            All Channels
          </button>

          <button
            type="button"
            onClick={() => { setFilterChannel("email"); setFilterCategory("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
              filterChannel === "email" && filterCategory === "all"
                ? "bg-red-950 text-red-300 border border-red-500/50"
                : "bg-white/5 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            <span>📧</span> Emails
          </button>

          <button
            type="button"
            onClick={() => { setFilterChannel("whatsapp"); setFilterCategory("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
              filterChannel === "whatsapp" && filterCategory === "all"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                : "bg-white/5 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            <span>💬</span> WhatsApp
          </button>

          <button
            type="button"
            onClick={() => { setFilterCategory("otp"); setFilterChannel("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
              filterCategory === "otp"
                ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                : "bg-white/5 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            <span>🔑</span> OTPs & Logins
          </button>

          <button
            type="button"
            onClick={() => { setFilterCategory("booking_confirmed"); setFilterChannel("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
              filterCategory === "booking_confirmed"
                ? "bg-blue-950 text-blue-300 border border-blue-500/50"
                : "bg-white/5 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            <span>📋</span> Bookings
          </button>

          <button
            type="button"
            onClick={() => { setFilterCategory("contact_inquiry"); setFilterChannel("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
              filterCategory === "contact_inquiry"
                ? "bg-purple-950 text-purple-300 border border-purple-500/50"
                : "bg-white/5 text-white/60 hover:text-white border border-transparent"
            }`}
          >
            <span>📩</span> Customer Inquiries
          </button>
        </div>
      </div>

      {/* Communication Audit Table */}
      <div className="bg-[#09090c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121218] border-b border-white/10 text-white/50 uppercase text-[9px] font-black tracking-wider">
                <th className="py-3.5 px-4">Direction</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Recipient / Sender</th>
                <th className="py-3.5 px-4">Subject & Preview</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-white/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40 text-xs">
                    <span className="animate-pulse">Loading communication audit records...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40 text-xs">
                    No communication records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition group">
                    {/* Direction */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.direction === "outgoing" ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          OUTGOING 📤
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-950 text-blue-400 border border-blue-500/30">
                          INCOMING 📥
                        </span>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] uppercase">
                      {item.channel === "whatsapp" && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          💬 WHATSAPP
                        </span>
                      )}
                      {item.channel === "email" && (
                        <span className="text-red-400 flex items-center gap-1 font-bold">
                          📧 EMAIL
                        </span>
                      )}
                      {item.channel === "sms" && (
                        <span className="text-amber-400 flex items-center gap-1 font-bold">
                          📱 SMS
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-white/70 uppercase">
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Recipient / Sender */}
                    <td className="py-3 px-4 font-mono text-white text-xs max-w-[180px] truncate">
                      {item.direction === "outgoing" ? item.recipient : item.sender}
                    </td>

                    {/* Subject & Snippet */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-white truncate text-xs">{item.subject}</div>
                      {item.snippet && item.snippet !== item.subject && (
                        <div className="text-[11px] text-white/50 truncate mt-0.5 font-normal">
                          {item.snippet}
                        </div>
                      )}
                    </td>

                    {/* Status */}
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
                        <span
                          title={item.error || "Delivery failed"}
                          className="text-red-400 font-bold text-[10px] flex items-center gap-1 cursor-help"
                        >
                          ● FAILED ⚠️
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-white/50 text-[10px] whitespace-nowrap font-mono">
                      {new Date(item.createdAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        👁️ View
                      </button>

                      {item.direction === "incoming" && (
                        <button
                          type="button"
                          onClick={() => {
                            const matchEmail = item.sender.match(/<([^>]+)>/) || [null, item.sender];
                            const emailTarget = matchEmail[1] || item.sender;
                            setComposeTo(emailTarget);
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
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
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
                  className="rounded border-white/20 bg-white/10 text-red-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="brandedToggle" className="text-xs text-white/80 cursor-pointer">
                  Use Next Gear Official Executive Branded HTML Template
                </label>
              </div>

              {sendResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    sendResult.type === "success"
                      ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/80 border border-red-500/40 text-red-300"
                  }`}
                >
                  {sendResult.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
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

      {/* VIEW COMMUNICATION FULL MODAL */}
      {selectedLogSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f13] border border-white/20 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-red-400 uppercase font-black tracking-wider bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                    {selectedLogSummary.channel.toUpperCase()} • {selectedLogSummary.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-mono text-white/50">
                    {new Date(selectedLogSummary.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white mt-1.5">{selectedLogSummary.subject}</h3>
                <div className="text-[11px] text-white/50 mt-0.5 font-mono">
                  To: <span className="text-white font-bold">{selectedLogSummary.recipient}</span> | From:{" "}
                  <span className="text-white">{selectedLogSummary.sender}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLogSummary(null);
                  setViewLogDetail(null);
                }}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#050505] min-h-[380px] relative">
              {detailLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40">
                  <span className="animate-pulse">Loading message content...</span>
                </div>
              ) : viewLogDetail?.htmlContent ? (
                <iframe
                  srcDoc={viewLogDetail.htmlContent}
                  className="w-full h-full min-h-[380px] border-none"
                  title="Communication Preview"
                />
              ) : (
                <div className="p-6 text-xs text-white/90 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto max-h-[460px]">
                  {viewLogDetail?.message || selectedLogSummary.snippet || "(No text content)"}
                </div>
              )}
            </div>

            {selectedLogSummary.error && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-xs text-red-300 font-mono">
                <span className="font-bold">Error Notice:</span> {selectedLogSummary.error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div>
                {selectedLogSummary.direction === "incoming" && (
                  <button
                    type="button"
                    onClick={() => {
                      const matchEmail = selectedLogSummary.sender.match(/<([^>]+)>/) || [null, selectedLogSummary.sender];
                      const emailTarget = matchEmail[1] || selectedLogSummary.sender;
                      setComposeTo(emailTarget);
                      setComposeSubject(`Re: ${selectedLogSummary.subject}`);
                      setSelectedLogSummary(null);
                      setIsComposeOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    💬 Reply to Message
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedLogSummary(null);
                  setViewLogDetail(null);
                }}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
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
