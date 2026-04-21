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
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];

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
      setMessage("Status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="New" value={counts.new} />
        <StatCard label="In Progress" value={counts.inProgress} />
        <StatCard label="Resolved" value={counts.resolved} />
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, message"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((item) => {
            const active = activeStatus === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveStatus(item.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black/80 hover:bg-black/[0.03]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => void fetchRequests()}
          className="w-full rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.03] lg:w-auto"
        >
          Refresh
        </button>
      </div>

      {message && <p className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">{message}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-lg bg-black/[0.05]" />
          ))}
        </div>
      ) : authRequired ? (
        <p className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black/70">
          Admin authentication is required to view contact requests.
        </p>
      ) : requests.length === 0 ? (
        <p className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black/60">No contact requests found.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{request.fullName}</p>
                  <p className="break-all text-black/60">{request.email} · {request.phone}</p>
                  <p className="mt-1 text-xs text-black/50">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-black/15 px-2.5 py-0.5 text-xs font-semibold uppercase text-black/70">
                    {request.status}
                  </span>
                  <select
                    value={request.status}
                    onChange={(e) => void updateStatus(request.id, e.target.value as ContactRequestStatus)}
                    disabled={updatingId === request.id}
                    className="rounded border border-black/15 px-2 py-1 text-xs"
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <p className="mt-2 rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black/80">
                {request.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-black/60">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
