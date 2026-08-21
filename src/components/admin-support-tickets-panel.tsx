"use client";

import { useState, useEffect, useRef } from "react";

type SupportTicket = {
  id: string;
  userId: string;
  vendorId?: string;
  bookingId?: string;
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

export function AdminSupportTicketsPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newReply, setNewReply] = useState("");
  const [message, setMessage] = useState("");
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Canned Responses templates
  const quickReplies = [
    "Thank you for contacting Next Gear. Your refund of the security deposit has been initiated and will reflect in your account within 3-5 business days.",
    "KYC verification completed successfully. Your vendor profile is now active and you can add vehicles to the catalog.",
    "We have updated the pickup coordinates for your delivery. The coordinator's contact details have been dispatched to your registered mobile number.",
    "Apologies for the inconvenience. Our on-ground support executive is dispatched to your coordinate. Please stay near the vehicle."
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const url = new URL("/api/support/tickets", window.location.origin);
    if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    const loadedTickets = data.tickets || [];
    setTickets(loadedTickets);

    // Auto-select first ticket if none selected
    if (loadedTickets.length > 0 && !selectedTicket) {
      handleSelectTicket(loadedTickets[0]);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  async function fetchTicketReplies(ticketId: string) {
    const res = await fetch(`/api/support/tickets/replies?ticketId=${ticketId}`);
    const data = await res.json();
    setReplies(data.replies || []);
  }

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchTicketReplies(ticket.id);
  };

  async function updateTicketStatus(ticketId: string, newStatus: string) {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const res = await fetch("/api/support/tickets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ticketId,
        status: newStatus,
      }),
    });

    if (res.ok) {
      setMessage("Status updated!");
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      fetchTickets();
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function addReply(customText?: string) {
    const textToSend = customText || newReply;
    if (!selectedTicket || !textToSend.trim()) return;

    const res = await fetch("/api/support/tickets/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.id,
        userId: "admin-1",
        userName: "Support Team",
        userRole: "admin",
        message: textToSend,
      }),
    });

    if (res.ok) {
      setNewReply("");
      fetchTicketReplies(selectedTicket.id);
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  // Scroll to chat bottom on replies update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-950/40 border-red-800/30";
      case "high":
        return "text-orange-400 bg-orange-950/40 border-orange-800/30";
      case "medium":
        return "text-yellow-400 bg-yellow-950/40 border-yellow-800/30";
      default:
        return "text-blue-400 bg-blue-950/40 border-blue-800/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-red-400 bg-red-950/40 border-red-800/30";
      case "in-progress":
        return "text-yellow-400 bg-yellow-950/40 border-yellow-800/30";
      case "resolved":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-800/30";
      default:
        return "text-slate-400 bg-slate-950/40 border-slate-800/30";
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    critical: tickets.filter((t) => t.priority === "critical").length,
  };

  return (
    <div className="space-y-6 text-white select-none">
      {/* 5 Stats Cards Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 text-center">
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 shadow-md">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Total Tickets</p>
          <p className="mt-1.5 text-xl font-black text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 shadow-md">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Open Queue</p>
          <p className="mt-1.5 text-xl font-black text-red-400">{stats.open}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 shadow-md">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">In Progress</p>
          <p className="mt-1.5 text-xl font-black text-amber-400">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 shadow-md">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Resolved</p>
          <p className="mt-1.5 text-xl font-black text-emerald-400">{stats.resolved}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 shadow-md col-span-2 lg:col-span-1">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Critical Priority</p>
          <p className="mt-1.5 text-xl font-black text-red-400">{stats.critical}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-6 shadow-xl relative">
        <div className="border-b border-white/5 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Support desk pipeline</p>
            <h2 className="text-sm font-black uppercase tracking-wider text-white mt-1">Direct Helpdesk Messaging</h2>
          </div>

          <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
            {["open", "in-progress", "resolved", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2 border transition cursor-pointer focus:outline-none ${
                  statusFilter === status
                    ? "bg-[var(--brand-red)] text-white border-red-500/25 shadow-lg shadow-red-500/15"
                    : "border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Select Row */}
        <div className="grid gap-3 grid-cols-2 text-[10px]">
          {/* Priority Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
              className="w-full text-left rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] flex justify-between items-center gap-2 cursor-pointer"
            >
              <span>
                {priorityFilter === "all" && "All Priorities"}
                {priorityFilter === "critical" && "Critical Only"}
                {priorityFilter === "high" && "High Only"}
                {priorityFilter === "medium" && "Medium Only"}
                {priorityFilter === "low" && "Low Only"}
              </span>
              <span className="text-[8px] text-white/35">▼</span>
            </button>
            {priorityDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPriorityDropdownOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/5 bg-[#121212] p-1.5 shadow-2xl z-40 space-y-0.5">
                  {[
                    { id: "all", label: "All Priorities" },
                    { id: "critical", label: "Critical Only" },
                    { id: "high", label: "High Only" },
                    { id: "medium", label: "Medium Only" },
                    { id: "low", label: "Low Only" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setPriorityFilter(opt.id);
                        setPriorityDropdownOpen(false);
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                        priorityFilter === opt.id
                          ? "bg-[var(--brand-red)] text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full text-left rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] flex justify-between items-center gap-2 cursor-pointer"
            >
              <span>
                {categoryFilter === "all" && "All Categories"}
                {categoryFilter === "booking" && "Booking Details"}
                {categoryFilter === "payment" && "Payments"}
                {categoryFilter === "vehicle" && "Vehicles"}
                {categoryFilter === "account" && "Account oversight"}
                {categoryFilter === "other" && "Other"}
              </span>
              <span className="text-[8px] text-white/35">▼</span>
            </button>
            {categoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCategoryDropdownOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/5 bg-[#121212] p-1.5 shadow-2xl z-40 space-y-0.5">
                  {[
                    { id: "all", label: "All Categories" },
                    { id: "booking", label: "Booking Details" },
                    { id: "payment", label: "Payments" },
                    { id: "vehicle", label: "Vehicles" },
                    { id: "account", label: "Account oversight" },
                    { id: "other", label: "Other" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setCategoryFilter(opt.id);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                        categoryFilter === opt.id
                          ? "bg-[var(--brand-red)] text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Split Screen Chat Layout */}
        <div className="grid gap-6 md:grid-cols-12 border-t border-white/5 pt-4 h-auto md:h-[480px]">
          
          {/* Left Column: Tickets Queue list */}
          <div className="md:col-span-4 flex flex-col h-[220px] md:h-full md:border-r border-white/5 pr-0 md:pr-4 overflow-y-auto no-scrollbar gap-2 shrink-0">
            <p className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider mb-1">Queue ({filteredTickets.length})</p>
            
            {filteredTickets.length === 0 ? (
              <p className="text-xs text-white/30 italic py-8 text-center">No active tickets.</p>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none flex flex-col gap-1.5 ${
                      isSelected
                        ? "border-[var(--brand-red)] bg-[var(--brand-red-glow)]"
                        : "border-white/5 bg-[#0a0a0a] hover:bg-[#121212]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[8.5px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className="text-[9px] text-white/30 font-medium">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="leading-tight">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{t.subject}</h4>
                      <p className="text-[10px] text-white/50 line-clamp-2 mt-1">{t.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-white/35 font-bold uppercase tracking-wider mt-1 border-t border-white/[0.03] pt-2">
                      <span>User: {t.userId.slice(0, 10)}</span>
                      <span className="text-white/60">{t.category}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Ticket Message Thread */}
          <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
            {selectedTicket ? (
              <div className="flex flex-col h-full justify-between">
                
                {/* Header Information bar */}
                <div className="border-b border-white/5 pb-3.5 mb-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-white">{selectedTicket.subject}</h3>
                    <p className="text-[10px] text-white/50 leading-relaxed mt-1 max-w-xl line-clamp-1">{selectedTicket.description}</p>
                  </div>
                  
                  {/* Quick select status modifiers */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-[8.5px] font-black uppercase border ${getStatusColor(selectedTicket.status)} bg-[#121212] focus:outline-none`}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Message bubbles thread list */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-3 bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 my-2 min-h-[220px] max-h-[300px] md:max-h-none">
                  {/* Root Ticket Description Bubble */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/5 bg-[#121212] p-4.5 max-w-[85%] text-xs">
                      <div className="flex justify-between items-center text-[8.5px] uppercase font-black text-white/35 tracking-wider mb-1">
                        <span>Customer ({selectedTicket.userId})</span>
                        <span>Original Issue</span>
                      </div>
                      <p className="text-white/80 leading-relaxed font-medium">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {replies.map((reply) => {
                    const isAdmin = reply.userRole === "admin";
                    const isSystem = reply.userRole === "system";
                    
                    return (
                      <div
                        key={reply.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-2xl border p-4.5 max-w-[85%] text-xs ${
                            isAdmin
                              ? "border-[var(--brand-red)]/20 bg-[var(--brand-red-glow)]"
                              : isSystem
                              ? "border-purple-500/25 bg-purple-950/10"
                              : "border-white/5 bg-[#121212]"
                          }`}
                        >
                          <div className="flex justify-between items-center gap-6 text-[8.5px] uppercase font-black tracking-wider text-white/35 mb-1.5">
                            <span>{reply.userName} ({reply.userRole})</span>
                            <span>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-white/85 leading-relaxed">{reply.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Canned responses row */}
                <div className="flex gap-1.5 py-1.5 overflow-x-auto no-scrollbar shrink-0 select-none">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => addReply(reply)}
                      title={reply}
                      type="button"
                      className="text-[8.5px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full border border-white/5 bg-[#121212] text-white/60 hover:text-white hover:border-[var(--brand-red)] transition duration-200 shrink-0 cursor-pointer"
                    >
                      Template {i + 1}
                    </button>
                  ))}
                </div>

                {/* Chat input box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addReply();
                  }}
                  className="flex items-center gap-2 mt-1 shrink-0"
                >
                  <input
                    type="text"
                    placeholder="Type your support message here..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="flex-1 rounded-xl border border-white/5 bg-[#0a0a0a] px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--brand-red)]"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--brand-red)] hover:bg-red-600 px-5 py-3 text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-white"
                  >
                    Send Reply
                  </button>
                </form>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-white/30 border border-dashed border-white/5 rounded-2xl bg-[#0a0a0a]">
                <span>Select a ticket from the queue pipeline to display direct correspondence</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
