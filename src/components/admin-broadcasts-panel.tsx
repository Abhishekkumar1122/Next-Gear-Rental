"use client";

import { useEffect, useState } from "react";
import { 
  Send, 
  MessageSquare, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Zap, 
  Flame, 
  Clock, 
  Smartphone, 
  Gift, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import type { BroadcastTemplate, BroadcastLog } from "@/lib/broadcasts-store";

export function AdminBroadcastsPanel() {
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("weekend-20-flash");
  
  // Composer Form
  const [title, setTitle] = useState("🔥 Weekend Flash Sale - Flat 20% OFF!");
  const [promoCode, setPromoCode] = useState("WEEKEND20");
  const [discount, setDiscount] = useState("20% OFF");
  const [messageText, setMessageText] = useState("");
  const [channelType, setChannelType] = useState<"whatsapp_channel" | "whatsapp_group">("whatsapp_channel");
  const [testPhone, setTestPhone] = useState("");
  
  // UI states
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/broadcasts");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
          setLogs(data.logs || []);
          if (data.templates && data.templates.length > 0) {
            const first = data.templates[0];
            setSelectedTemplateId(first.id);
            setTitle(first.title);
            setPromoCode(first.promoCode);
            setDiscount(first.discount);
            setMessageText(first.messageTemplate);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  function handleSelectTemplate(tpl: BroadcastTemplate) {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.title);
    setPromoCode(tpl.promoCode);
    setDiscount(tpl.discount);
    setMessageText(tpl.messageTemplate);
  }

  function copyToClipboard() {
    void navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(null as any), 2500);
  }

  async function handleShareWhatsApp(target: "channel" | "group") {
    // 1. Log broadcast to server
    try {
      await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          promoCode,
          messageText,
          channelType: target === "channel" ? "whatsapp_channel" : "whatsapp_group"
        })
      });
      // Refresh logs
      const res = await fetch("/api/admin/broadcasts");
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } catch {
      // Continue
    }

    // 2. Open WhatsApp Web/App with pre-filled text
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  }

  async function handleSendTestMessage() {
    if (!testPhone.trim()) {
      setStatusFeedback({ type: "error", text: "Please enter a valid 10-digit mobile number for test send." });
      return;
    }
    setSendingTest(true);
    setStatusFeedback(null);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[TEST] ${title}`,
          promoCode,
          messageText,
          channelType,
          testPhone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test message");
      setStatusFeedback({ type: "success", text: `Test WhatsApp message triggered successfully to ${testPhone}!` });
    } catch (err: any) {
      setStatusFeedback({ type: "error", text: err.message || "Failed to dispatch test message" });
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-white/50 text-xs font-mono">
        <span className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin mr-2" />
        Loading Broadcast Hub...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-black p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>WhatsApp Channel & VIP Group Broadcast Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white flex items-center gap-2">
              Weekend Offers & Flash Campaigns <Flame className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed">
              Broadcast high-converting weekend discounts, last-minute fleet drops, and promo codes directly to your WhatsApp Channel, WhatsApp Community, and VIP riders in 1-click.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleShareWhatsApp("channel")}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Broadcast to Channel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Campaign Templates */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
          <Gift className="w-4 h-4 text-red-400" /> 1-Click Ready Campaign Templates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "border-emerald-500/80 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                      {tpl.discount}
                    </span>
                    {isSelected && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2">{tpl.title}</h4>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                  <span>Code: <strong className="text-emerald-400">{tpl.promoCode}</strong></span>
                  <span className="text-[10px] text-white/40">Select →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Composer & Realistic Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
              <span>✍️</span> Broadcast Message Composer
            </h3>
            <span className="text-[10px] font-mono text-white/40">WhatsApp Markdown Supported</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/70">Campaign Title / Subject</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Weekend Flash Sale"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/70">Promo Coupon Code</label>
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs font-mono font-bold text-emerald-400 placeholder-white/30 focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. WEEKEND20"
              />
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
              <label>WhatsApp Message Content</label>
              <span className="text-white/40 font-mono text-[10px]">{messageText.length} characters</span>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-white/15 bg-black/60 p-4 font-sans text-xs text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 leading-relaxed font-medium resize-y"
              placeholder="Type your WhatsApp notification text..."
            />
          </div>

          {/* Quick Formatting Helpers */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-white/60">
            <span className="text-white/40 font-mono font-bold">Quick Insert:</span>
            <button
              type="button"
              onClick={() => setMessageText((prev) => prev + " *BOLD_TEXT*")}
              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/15 text-white"
            >
              *Bold*
            </button>
            <button
              type="button"
              onClick={() => setMessageText((prev) => prev + " _ITALIC_TEXT_")}
              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/15 text-white"
            >
              _Italic_
            </button>
            <button
              type="button"
              onClick={() => setMessageText((prev) => prev + " 🚗 🏍️ 🚀 🎟️ 💰 ✅")}
              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/15 text-white"
            >
              + Emojis
            </button>
            <button
              type="button"
              onClick={() => setMessageText((prev) => prev + " https://next-gear.app/vehicles?promo=" + promoCode)}
              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/15 text-white"
            >
              + Booking Link
            </button>
          </div>

          {/* Action Dispatch Buttons */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleShareWhatsApp("channel")}
              className="flex-1 min-w-[180px] rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 p-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Post to WhatsApp Channel</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareWhatsApp("group")}
              className="flex-1 min-w-[180px] rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 p-3 text-xs font-bold text-white shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Forward to VIP Group</span>
            </button>

            <button
              type="button"
              onClick={copyToClipboard}
              className="px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          {/* Test Dispatch to Admin Mobile */}
          <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white/80 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Send Test Preview to Personal WhatsApp
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 9523765172"
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={sendingTest}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
              >
                {sendingTest ? "Sending..." : "Send Test"}
              </button>
            </div>
            {statusFeedback && (
              <p className={`text-[11px] font-bold ${statusFeedback.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                {statusFeedback.text}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Realistic WhatsApp Phone Mockup (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-[32px] border-4 border-neutral-800 bg-[#0b141a] p-3 shadow-2xl relative overflow-hidden">
            {/* Phone Top Speaker & Camera Notch */}
            <div className="flex justify-center mb-2">
              <div className="h-4 w-28 bg-neutral-900 rounded-full flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                <span className="h-1 w-6 rounded-full bg-neutral-700" />
              </div>
            </div>

            {/* WhatsApp Header Bar */}
            <div className="bg-[#1f2c34] rounded-2xl p-3 flex items-center gap-3 border-b border-white/5 mb-3 shadow-md">
              <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center font-black text-white text-xs border border-white/20 shadow">
                NG
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-white truncate">Next Gear Rentals™</h4>
                  <span className="h-3 w-3 rounded-full bg-emerald-500 text-[8px] text-black flex items-center justify-center font-bold">✓</span>
                </div>
                <p className="text-[10px] text-emerald-400/90 font-medium truncate">Official Verified Channel • 14.8K Followers</p>
              </div>
            </div>

            {/* Chat Bubble Area */}
            <div className="space-y-2 min-h-[380px] max-h-[440px] overflow-y-auto p-1 text-xs">
              <div className="flex justify-center my-2">
                <span className="text-[9px] font-bold text-white/40 bg-[#182229] px-2.5 py-0.5 rounded-full">
                  TODAY
                </span>
              </div>

              {/* Message Bubble */}
              <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none shadow-md space-y-2 border border-emerald-600/30">
                <div className="whitespace-pre-wrap text-[11px] leading-relaxed break-words font-normal">
                  {messageText || "Type your message in the composer to preview it live..."}
                </div>
                <div className="flex justify-end items-center gap-1 text-[9px] text-white/60">
                  <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-emerald-300">✓✓</span>
                </div>
              </div>
            </div>

            {/* Phone Bottom Pill */}
            <div className="pt-2 flex justify-center">
              <div className="h-1 w-20 bg-neutral-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History & Logs */}
      <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
              <span>📜</span> Recent Broadcast Activity Log
            </h3>
            <p className="text-xs text-white/50">History of promo messages dispatched to WhatsApp channels and groups</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">{logs.length} Broadcasts Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Campaign / Title</th>
                <th className="py-2.5 px-3">Channel Target</th>
                <th className="py-2.5 px-3">Promo Code</th>
                <th className="py-2.5 px-3">Sent At</th>
                <th className="py-2.5 px-3">Sent By</th>
                <th className="py-2.5 px-3">Est. Reach</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3 font-bold text-white">{log.title}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                      {log.channelType === "whatsapp_channel" ? "📢 WA Channel" : "👥 WA Group"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">{log.promoCode || "—"}</td>
                  <td className="py-3 px-3 text-white/60">{new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="py-3 px-3 text-white/70">{log.sentBy}</td>
                  <td className="py-3 px-3 font-mono font-bold text-white/90">~{log.reachEstimate.toLocaleString()} riders</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/30">
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
