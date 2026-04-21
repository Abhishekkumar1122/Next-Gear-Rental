"use client";

import { PageShell } from "@/components/page-shell";
import { useState, useEffect } from "react";

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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newReply, setNewReply] = useState("");
  const [message, setMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const vendorId = "v1"; // Mock vendor - in production from session

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    const access = await fetch("/api/vendor/fleet", { cache: "no-store" });
    if (access.status === 403) {
      const data = await access.json().catch(() => ({}));
      setIsBlocked(true);
      setMessage(data?.error || "Your vendor account is blacklisted. Vendor features are disabled.");
      return;
    }

    fetchTickets();
  }

  async function fetchTickets() {
    const res = await fetch(`/api/support/tickets?vendorId=${vendorId}`);
    const data = await res.json();
    setTickets(data.tickets || []);
  }

  async function fetchTicketReplies(ticketId: string) {
    const res = await fetch(`/api/support/tickets/replies?ticketId=${ticketId}`);
    const data = await res.json();
    setReplies(data.replies || []);
  }

  async function addReply() {
    if (!selectedTicket || !newReply.trim()) return;

    const res = await fetch("/api/support/tickets/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.id,
        userId: vendorId,
        userName: "You (Vendor)",
        userRole: "vendor",
        message: newReply,
      }),
    });

    if (res.ok) {
      setMessage("Reply sent successfully!");
      setNewReply("");
      fetchTicketReplies(selectedTicket.id);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-700 bg-red-50";
      case "high":
        return "text-orange-700 bg-orange-50";
      case "medium":
        return "text-yellow-700 bg-yellow-50";
      default:
        return "text-blue-700 bg-blue-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100";
      case "in-progress":
        return "bg-yellow-100";
      case "resolved":
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
  };

  const filteredTickets = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);

  if (isBlocked) {
    return (
      <PageShell title="Support Tickets" subtitle="Manage customer and platform support requests">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Your vendor account is blacklisted. You cannot access support ticket actions at this time.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Support Tickets" subtitle="Manage customer and platform support requests">
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Open</p>
          <p className="mt-2 text-2xl font-bold">{tickets.filter((t) => t.status === "open").length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">In Progress</p>
          <p className="mt-2 text-2xl font-bold">{tickets.filter((t) => t.status === "in-progress").length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Resolved</p>
          <p className="mt-2 text-2xl font-bold">{tickets.filter((t) => t.status === "resolved").length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Total</p>
          <p className="mt-2 text-2xl font-bold">{tickets.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Support Requests</h2>
          <div className="flex gap-2">
            {["all", "open", "in-progress", "resolved", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === status
                    ? "bg-[var(--brand-red)] text-white"
                    : "border border-black/15 hover:bg-black/[0.02]"
                }`}
              >
                {status === "all" ? "All" : status.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {selectedTicket ? (
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedTicket(null);
                setReplies([]);
                setNewReply("");
              }}
              className="text-sm text-blue-600 underline hover:no-underline"
            >
              ← Back to tickets
            </button>
            <div className="rounded-lg border border-black/10 bg-black/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedTicket.subject}</p>
                  <p className="mt-1 text-sm text-black/70">{selectedTicket.description}</p>
                  <p className="mt-2 text-xs text-black/60">
                    Category: {selectedTicket.category} • Created: {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Conversation Thread</p>
              {replies.length === 0 ? (
                <p className="text-xs text-black/60">No replies yet.</p>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-lg p-3 text-sm ${
                      reply.userRole === "admin"
                        ? "border border-purple-200 bg-purple-50"
                        : reply.userRole === "vendor"
                        ? "border border-blue-200 bg-blue-50"
                        : "border border-black/10 bg-black/5"
                    }`}
                  >
                    <p className="font-semibold">
                      {reply.userName}
                      {reply.userRole === "admin" && " (Support Admin)"}
                      {reply.userRole === "vendor" && " (Your Reply)"}
                    </p>
                    <p className="mt-1 text-black/80">{reply.message}</p>
                    <p className="mt-1 text-xs text-black/60">{new Date(reply.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            {selectedTicket.status !== "closed" && (
              <div className="mt-4 rounded-lg border border-black/10 bg-black/[0.02] p-3 space-y-2">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Type your response..."
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  rows={3}
                />
                {message && <p className="text-xs text-green-700">{message}</p>}
                <button
                  onClick={addReply}
                  disabled={!newReply.trim()}
                  className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  Send Reply
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTickets.length === 0 ? (
              <p className="text-sm text-black/60">No {statusFilter === "all" ? "support tickets" : statusFilter + " tickets"} found.</p>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    fetchTicketReplies(ticket.id);
                  }}
                  className="w-full rounded-lg border border-black/10 bg-white p-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-black/70">{ticket.description.substring(0, 80)}...</p>
                      <p className="mt-2 text-xs text-black/60">{ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
