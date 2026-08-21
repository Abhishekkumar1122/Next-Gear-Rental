"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ContactRequestStatus = "new" | "in-progress" | "resolved";

type ContactRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
};

const statusOptions: Array<{ id: ContactRequestStatus | "all"; label: string }> = [
  { id: "all", label: "All Statuses" },
  { id: "new", label: "New" },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];

const STATUS_BADGES: Record<ContactRequestStatus, string> = {
  new: "bg-red-950 text-red-400 border border-red-800/30",
  "in-progress": "bg-amber-950 text-amber-400 border border-amber-800/30",
  resolved: "bg-emerald-950 text-emerald-400 border border-emerald-800/30",
};

export function AdminContactRequestsPanel() {
  const router = useRouter();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [activeStatus, setActiveStatus] = useState<ContactRequestStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleUnauthorized = useCallback(() => {
    setRequests([]);
    setAuthRequired(true);
    setMessage("Admin session required. Redirecting to login...");
    const next = encodeURIComponent("/dashboard/admin?section=contact-requests");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 250);
  }, [router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setAuthRequired(false);

    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search.trim()) params.set("query", search.trim());

      const url = `/api/admin/contact-requests${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load contact requests");
      }

      setRequests(data.requests ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load contact requests");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, handleUnauthorized, search]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const counts = useMemo(() => {
    return {
      total: requests.length,
      new: requests.filter((item) => item.status === "new").length,
      inProgress: requests.filter((item) => item.status === "in-progress").length,
      resolved: requests.filter((item) => item.status === "resolved").length,
    };
  }, [requests]);

  async function updateStatus(id: string, status: ContactRequestStatus) {
    setUpdatingId(id);
    setMessage("");

    try {
      const res = await fetch("/api/admin/contact-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update status");
      }

      setRequests((prev) => prev.map((item) => (item.id === id ? data.request : item)));
      setMessage("Status updated successfully.");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Metrics Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 text-center">
        <StatTile label="Total Requests" value={counts.total} />
        <StatTile label="New Inquiries" value={counts.new} />
        <StatTile label="In Progress" value={counts.inProgress} />
        <StatTile label="Resolved" value={counts.resolved} />
      </div>

      {/* Filter Options */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_180px_auto] text-xs">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or message keywords..."
          className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        />
        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        >
          {statusOptions.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[#121212]">
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => void fetchRequests()}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 font-bold uppercase tracking-wider text-white transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/25 px-4 py-2.5 text-xs text-red-400">
          {message}
        </div>
      )}

      {/* Inquiries Ledger */}
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
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 text-center text-xs text-white/50">
          No contact requests found matching criteria.
        </div>
      ) : (
        <div className="space-y-3.5">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition duration-300">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <p className="font-extrabold text-white text-sm">{request.fullName}</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {request.email} · <span className="text-white/40">{request.phone}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border ${STATUS_BADGES[request.status]}`}>
                    {request.status}
                  </span>
                  <select
                    value={request.status}
                    onChange={(e) => void updateStatus(request.id, e.target.value as ContactRequestStatus)}
                    disabled={updatingId === request.id}
                    className="rounded-lg border border-white/10 bg-[#121212] px-2.5 py-1 text-[10px] uppercase font-bold text-white focus:outline-none focus:border-[var(--brand-red)]"
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="mt-3.5 rounded-xl border border-white/5 bg-white/[0.01] p-3.5 text-xs text-white/80 leading-relaxed">
                {request.message}
              </div>

              <div className="mt-3.5 flex justify-end text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Submitted: {new Date(request.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center hover:border-red-500/20 transition">
      <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
