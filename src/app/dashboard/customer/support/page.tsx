"use client";

import { PageShell } from "@/components/page-shell";
import { useState, useEffect } from "react";

type SupportTicket = {
  id: string;
  userId: string;
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

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "booking" as const,
    priority: "medium" as const,
  });
  const [message, setMessage] = useState("");
  const userId = "u1"; // Mock user - in production from session

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const res = await fetch(`/api/support/tickets?userId=${userId}`);
    const data = await res.json();
    setTickets(data.tickets || []);
  }

  async function fetchTicketReplies(ticketId: string) {
    const res = await fetch(`/api/support/tickets/replies?ticketId=${ticketId}`);
    const data = await res.json();
    setReplies(data.replies || []);
  }

  async function createTicket() {
    if (!newTicket.subject || !newTicket.description) {
      setMessage("Subject and description are required.");
      return;
    }

    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        userName: "User Name",
        userEmail: "user@example.com",
        ...newTicket,
      }),
    });

    if (res.ok) {
      setMessage("Ticket created successfully!");
      setNewTicket({ subject: "", description: "", category: "booking", priority: "medium" });
      setShowCreateForm(false);
      fetchTickets();
    } else {
      setMessage("Failed to create ticket.");
    }
  }

  async function addReply() {
    if (!selectedTicket || !newReply.trim()) return;

    const res = await fetch("/api/support/tickets/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.id,
        userId,
        userName: "You",
        userRole: "customer",
        message: newReply,
      }),
    });

    if (res.ok) {
      setNewReply("");
      fetchTicketReplies(selectedTicket.id);
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

  return (
    <PageShell title="Support Center" subtitle="View and manage your support tickets">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Open Tickets</p>
          <p className="mt-2 text-2xl font-bold">{tickets.filter((t) => t.status === "open").length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">In Progress</p>
          <p className="mt-2 text-2xl font-bold">{tickets.filter((t) => t.status === "in-progress").length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5 p-4">
          <p className="text-xs text-black/60">Total Tickets</p>
          <p className="mt-2 text-2xl font-bold">{tickets.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Tickets</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-full bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            + New Ticket
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-4 rounded-lg border border-black/10 bg-black/[0.02] p-4 space-y-3">
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="Subject"
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
            <textarea
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Describe your issue..."
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              rows={3}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm"
              >
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="vehicle">Vehicle</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </select>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            {message && <p className="text-xs text-green-700">{message}</p>}
            <div className="flex gap-2">
              <button
                onClick={createTicket}
                className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Create Ticket
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedTicket ? (
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedTicket(null);
                setReplies([]);
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
              <p className="text-sm font-semibold">Conversation</p>
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`rounded-lg p-3 text-sm ${
                    reply.userRole === "admin" ? "border border-green-200 bg-green-50" : "border border-black/10 bg-black/5"
                  }`}
                >
                  <p className="font-semibold">{reply.userName} {reply.userRole === "admin" && "(Support Team)"}</p>
                  <p className="mt-1 text-black/80">{reply.message}</p>
                  <p className="mt-1 text-xs text-black/60">{new Date(reply.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {selectedTicket.status !== "closed" && (
              <div className="mt-4 rounded-lg border border-black/10 bg-black/[0.02] p-3 space-y-2">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Add a reply..."
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  rows={2}
                />
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
            {tickets.length === 0 ? (
              <p className="text-sm text-black/60">No support tickets yet.</p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    fetchTicketReplies(ticket.id);
                  }}
                  className="w-full rounded-lg border border-black/10 bg-white p-3 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-black/60">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
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
