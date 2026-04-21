"use client";

import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { useState, useEffect } from "react";

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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newReply, setNewReply] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const url = new URL("/api/support/tickets", window.location.origin);
    if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    setTickets(data.tickets || []);
  }

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  async function fetchTicketReplies(ticketId: string) {
    const res = await fetch(`/api/support/tickets/replies?ticketId=${ticketId}`);
    const data = await res.json();
    setReplies(data.replies || []);
  }

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

  async function addReply() {
    if (!selectedTicket || !newReply.trim()) return;

    const res = await fetch("/api/support/tickets/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.id,
        userId: "admin-1",
        userName: "Support Team",
        userRole: "admin",
        message: newReply,
      }),
    });

    if (res.ok) {
      setMessage("Reply sent!");
      setNewReply("");
      fetchTicketReplies(selectedTicket.id);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-700 bg-red-50 border-red-200";
      case "high":
        return "text-orange-700 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 border-red-300";
      case "in-progress":
        return "bg-yellow-100 border-yellow-300";
      case "resolved":
        return "bg-green-100 border-green-300";
      default:
        return "bg-gray-100 border-gray-300";
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
    <PageShell title="Support Tickets Management" subtitle="Monitor and manage all customer & vendor support requests">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/admin" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
          ← Admin Dashboard
        </Link>
        <Link href="/dashboard/admin/approvals" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.02]">
          Approvals
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Total Tickets</p>
          <p className="mt-2 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Open</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{stats.open}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">In Progress</p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{stats.resolved}</p>
        </div>
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-xs text-black/60">Critical</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{stats.critical}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Ticket Queue</h2>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex gap-2">
            <p className="text-xs font-semibold text-black/60">Status:</p>
            {["open", "in-progress", "resolved", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === status
                    ? "bg-[var(--brand-red)] text-white"
                    : "border border-black/15 hover:bg-black/[0.02]"
                }`}
              >
                {status.replace("-", " ")}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <p className="text-xs font-semibold text-black/60">Priority:</p>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex gap-2">
            <p className="text-xs font-semibold text-black/60">Category:</p>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="all">All</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="vehicle">Vehicle</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
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
              ← Back to queue
            </button>

            <div className="rounded-lg border border-black/10 bg-black/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold">{selectedTicket.subject}</p>
                  <p className="mt-1 text-sm text-black/70">{selectedTicket.description}</p>
                  <p className="mt-2 text-xs text-black/60">
                    User ID: {selectedTicket.userId} • Category: {selectedTicket.category}
                  </p>
                  {selectedTicket.vendorId && (
                    <p className="text-xs text-black/60">Vendor ID: {selectedTicket.vendorId}</p>
                  )}
                  {selectedTicket.bookingId && (
                    <p className="text-xs text-black/60">Booking ID: {selectedTicket.bookingId}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold border ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                    className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold border ${getStatusColor(selectedTicket.status)} cursor-pointer`}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Conversation</p>
              {replies.length === 0 ? (
                <p className="text-xs text-black/60">No replies yet.</p>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-lg p-3 text-sm border ${
                      reply.userRole === "admin"
                        ? "border-purple-200 bg-purple-50"
                        : reply.userRole === "vendor"
                        ? "border-blue-200 bg-blue-50"
                        : "border-black/10 bg-black/5"
                    }`}
                  >
                    <p className="font-semibold">
                      {reply.userName}
                      {reply.userRole === "admin" && " (You - Admin)"}
                      {reply.userRole === "vendor" && " (Vendor)"}
                      {reply.userRole === "customer" && " (Customer)"}
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
                  placeholder="Type admin response..."
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  rows={3}
                />
                {message && <p className="text-xs text-green-700">{message}</p>}
                <button
                  onClick={addReply}
                  disabled={!newReply.trim()}
                  className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  Send Admin Response
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTickets.length === 0 ? (
              <p className="text-sm text-black/60">No tickets found.</p>
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
                      <p className="mt-1 text-xs text-black/70">{ticket.description.substring(0, 100)}...</p>
                      <p className="mt-2 text-xs text-black/60">
                        {ticket.category} • User: {ticket.userId} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold border whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold border whitespace-nowrap ${getStatusColor(ticket.status)}`}>
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
