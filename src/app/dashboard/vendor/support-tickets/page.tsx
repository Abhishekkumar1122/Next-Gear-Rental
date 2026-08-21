"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { audioSynth } from "@/lib/audio-effects";
import NotificationBell from "@/components/notification-bell";
import {
  MessageSquare,
  Send,
  Plus,
  ArrowLeft,
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

type SupportTicket = {
  id: string;
  userId: string;
  vendorId?: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TicketReply = {
  id: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
};

export default function VendorSupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newReply, setNewReply] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Active user / vendor states
  const [userProfile, setUserProfile] = useState<any>(null);
  const [vendorDetails, setVendorDetails] = useState<any>(null);

  // New ticket modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Billing");
  const [newPriority, setNewPriority] = useState("medium");
  const [modalError, setModalError] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void initialize();
  }, []);

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies]);

  async function initialize() {
    try {
      // 1. Fetch user session
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setUserProfile(sessionData.user);
      } else {
        router.push("/login");
        return;
      }

      // 2. Fetch fleet to verify blacklist and resolve vendor context
      const fleetRes = await fetch("/api/vendor/fleet", { cache: "no-store" });
      if (fleetRes.status === 403) {
        const data = await fleetRes.json().catch(() => ({}));
        setIsBlocked(true);
        setBlockMessage(data?.error || "Your vendor account is blacklisted. Support features are disabled.");
        setLoading(false);
        return;
      }

      if (fleetRes.ok) {
        const fleetData = await fleetRes.json();
        setVendorDetails(fleetData.vendor);
        await fetchTickets(fleetData.vendor.id);
      }
    } catch (e) {
      console.error("Initialization failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTickets(vId: string) {
    try {
      const res = await fetch(`/api/support/tickets?vendorId=${vId}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error("Failed to load support tickets:", e);
    }
  }

  async function fetchTicketReplies(ticketId: string) {
    try {
      const res = await fetch(`/api/support/tickets/replies?ticketId=${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies || []);
      }
    } catch (e) {
      console.error("Failed to load replies:", e);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !newReply.trim() || !vendorDetails || !userProfile) return;

    try {
      const res = await fetch("/api/support/tickets/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          userId: vendorDetails.id,
          userName: vendorDetails.businessName || userProfile.email.split("@")[0],
          userRole: "vendor",
          message: newReply.trim(),
        }),
      });

      if (res.ok) {
        audioSynth.playAlert();
        setNewReply("");
        await fetchTicketReplies(selectedTicket.id);
      }
    } catch (e) {
      console.error("Failed to add reply:", e);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim() || !vendorDetails || !userProfile) {
      setModalError("Please fill out all required fields.");
      return;
    }

    setIsSubmittingTicket(true);
    setModalError("");

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          userName: vendorDetails.businessName || userProfile.email.split("@")[0],
          userEmail: userProfile.email,
          vendorId: vendorDetails.id,
          category: newCategory,
          subject: newSubject.trim(),
          description: newDescription.trim(),
          priority: newPriority,
        }),
      });

      if (res.ok) {
        audioSynth.playSuccess();
        setIsModalOpen(false);
        setNewSubject("");
        setNewDescription("");
        await fetchTickets(vendorDetails.id);
      } else {
        const data = await res.json();
        setModalError(data.error || "Failed to create support ticket.");
      }
    } catch {
      setModalError("Network error while creating ticket.");
    } finally {
      setIsSubmittingTicket(false);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 border-red-500/20 bg-red-500/10";
      case "high":
        return "text-orange-400 border-orange-500/20 bg-orange-500/10";
      case "medium":
        return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
      default:
        return "text-blue-400 border-blue-500/20 bg-blue-500/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "in-progress":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "resolved":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-white/40 bg-white/5 border-white/10";
    }
  };

  const filteredTickets = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--brand-ink)] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[var(--brand-red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm tracking-wide">Loading support network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white pb-28 md:pb-10 selection:bg-[var(--brand-red)]/30 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-[var(--brand-red)]/[0.08] blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-white/10 bg-[var(--brand-ink)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-4 md:px-6 relative">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-3 flex-shrink-0 transition-all duration-300 hover:scale-105" aria-label="Next Gear Rentals">
              <img
                src="/Logo1.png"
                alt="Next Gear logo"
                className="h-10 w-10 object-contain transition-all duration-300 group-hover:scale-105 filter brightness-110"
              />
              <span className="flex flex-col leading-tight hidden sm:flex text-left">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">Since 2022</span>
                <span className="font-display text-sm uppercase tracking-[0.35em] text-white font-semibold">Next Gear</span>
              </span>
            </Link>
            <span className="hidden md:inline-block text-xs font-semibold text-white/20">|</span>
            <span className="hidden md:inline-block rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-bold text-white/70">
              {vendorDetails?.businessName || "Vendor Partner"}
            </span>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden pointer-events-none flex flex-col items-center leading-none">
            <span className="font-display text-[11px] uppercase tracking-[0.15em] font-black text-white text-center max-w-[150px] truncate">
              {vendorDetails?.businessName || userProfile?.email?.split("@")[0] || "Vendor Partner"}
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em] mt-1 text-[var(--brand-red)] font-semibold">Vendor Partner</span>
          </div>

          <div className="flex items-center gap-3">
            {userProfile && <NotificationBell userId={userProfile.id} role="VENDOR" />}
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-tight">{userProfile?.email?.split("@")[0] || "Vendor Partner"}</p>
              <p className="text-[10px] text-white/50 font-medium leading-none mt-0.5">{userProfile?.email}</p>
            </div>
            <Link
              href="/dashboard/vendor"
              className="hidden md:inline-flex rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:scale-105 cursor-pointer"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-32 md:px-6 md:pt-28 md:pb-10 space-y-6 relative z-10">
        
        {/* Banner Section */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] backdrop-blur-md p-6 shadow-2xl flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--brand-red)] font-bold">Priority Support Line</p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-wide text-white">Vendor Support Desk</h1>
            <p className="mt-2 text-xs text-white/60">Raise queries, verify settlement disputes, and chat with platform administrators.</p>
          </div>
          <div className="flex gap-2">
            {!isBlocked && (
              <button
                onClick={() => {
                  audioSynth.playAlert();
                  setIsModalOpen(true);
                }}
                className="rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider transition hover:brightness-110 flex items-center gap-1.5 shadow-[0_4px_15px_rgba(225,29,72,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Ticket</span>
              </button>
            )}
            <Link href="/dashboard/vendor" className="rounded-xl border border-white/15 bg-white/5 text-white text-xs font-bold px-4 py-2.5 transition hover:bg-white/10 flex items-center justify-center">
              Back to Dashboard
            </Link>
          </div>
        </section>

        {isBlocked ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-950/40 p-5 shadow-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-red-400">Support Access Restricted</h2>
              <p className="mt-1 text-xs text-red-300/80 leading-relaxed">{blockMessage}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Sidebar - Tickets List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.02] p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <div>
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Tickets list</h2>
                    <p className="text-[10px] text-white/50">Select thread to open chat</p>
                  </div>
                  <span className="text-[10px] font-bold text-white/40">{tickets.length} Total</span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1.5 mb-3 border-b border-white/5 pb-3">
                  {["all", "open", "in-progress", "resolved"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        statusFilter === status
                          ? "bg-[var(--brand-red)] text-white font-bold"
                          : "border border-white/10 text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {status === "all" ? "All" : status.replace("-", " ")}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {filteredTickets.length === 0 ? (
                    <div className="py-8 text-center text-white/30">
                      <HelpCircle className="w-8 h-8 mx-auto mb-2 text-white/10" />
                      <p className="text-xs font-semibold">No tickets found</p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const isSelected = ticket.id === selectedTicket?.id;
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicket(ticket);
                            fetchTicketReplies(ticket.id);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex flex-col gap-1.5 ${
                            isSelected
                              ? "border-[var(--brand-red)] bg-[var(--brand-red)]/[0.08] shadow-[0_0_15px_rgba(225,29,72,0.15)]"
                              : "border-white/5 bg-white/[0.01] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
                              #{ticket.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white leading-tight truncate">{ticket.subject}</h4>
                            <p className="text-[10px] text-white/50 truncate">{ticket.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className="text-[8px] text-white/35">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Chat Thread Panel */}
            <div className="lg:col-span-2 space-y-4">
              {selectedTicket ? (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.02] p-4 shadow-xl flex flex-col justify-between h-[580px]">
                  
                  {/* Thread Header */}
                  <div className="border-b border-white/5 pb-3 mb-3 flex items-center justify-between">
                    <div className="space-y-0.5 max-w-[70%]">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--brand-red)]">
                        Active Ticket Context
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">{selectedTicket.subject}</h3>
                      <p className="text-[10px] text-white/50 truncate">{selectedTicket.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTicket(null);
                          setReplies([]);
                        }}
                        className="p-1 rounded-lg border border-white/10 hover:bg-white/5 text-white/70"
                        title="Back to Tickets"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4 scrollbar-thin">
                    {/* Main Description as First Message */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl p-3 text-xs bg-white/5 border border-white/5 text-white/90">
                        <p className="font-bold text-[10px] text-[var(--brand-red)] mb-1 uppercase tracking-wider">Ticket Description</p>
                        <p className="leading-relaxed">{selectedTicket.description}</p>
                        <p className="text-[8px] text-white/40 mt-1.5">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {replies.map((reply) => {
                      const isAdminReply = reply.userRole === "admin";
                      const isVendorReply = reply.userRole === "vendor";

                      return (
                        <div key={reply.id} className={`flex ${isVendorReply ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl p-3 text-xs border ${
                            isAdminReply
                              ? "bg-purple-950/15 border-purple-500/20 text-purple-200"
                              : isVendorReply
                              ? "bg-[var(--brand-red)]/10 border-[var(--brand-red)]/20 text-white"
                              : "bg-white/5 border-white/5 text-white"
                          }`}>
                            <p className="font-bold text-[9px] opacity-60 mb-0.5 uppercase tracking-wide">
                              {isAdminReply ? "Support Admin" : isVendorReply ? "You" : reply.userName}
                            </p>
                            <p className="leading-relaxed">{reply.message}</p>
                            <p className="text-[8px] opacity-45 mt-1.5">{new Date(reply.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </div>

                  {/* Reply Input Form */}
                  {selectedTicket.status !== "closed" ? (
                    <form onSubmit={handleSendReply} className="flex gap-2 border-t border-white/5 pt-3">
                      <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Type your response message..."
                        className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                      />
                      <button
                        type="submit"
                        disabled={!newReply.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-white/5 pt-3 text-center text-xs text-white/40">
                      🔒 This ticket is closed. No further replies allowed.
                    </div>
                  )}

                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-16 text-center text-white/30 h-[580px] flex flex-col items-center justify-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-3 text-white/10" />
                  <h3 className="text-sm font-semibold">Select a Support Conversation</h3>
                  <p className="text-xs text-white/40 mt-1 max-w-sm">Select any ticket from the sidebar queue to open the chat thread, read replies, and consult admins.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition"
              aria-label="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--brand-red)]">
                Create Support Request
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Submit details to platform support admins.</p>
            </div>

            {modalError && (
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </p>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-white/50 block">Ticket Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Withdrawal Transfer Not Received"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-white/50 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-white/20"
                  >
                    <option value="Billing">Billing & Payouts</option>
                    <option value="Scooter Issue">Scooter Maintenance</option>
                    <option value="Settlement">Hub Settlements</option>
                    <option value="App Bug">App Glitch</option>
                    <option value="Others">General Enquiry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-white/50 block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-white/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/50 block">Description Details</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide complete details about the issue..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTicket}
                className="w-full py-3 bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmittingTicket ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>🚀 Submit Support Ticket</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
