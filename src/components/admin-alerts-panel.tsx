"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AlertItem = {
  id: string;
  bookingId: string;
  userEmail: string;
  eventType: "booking_confirmed" | "payment_success" | "pickup_reminder" | "return_reminder";
  channel: "email" | "sms" | "whatsapp";
  destination?: string;
  provider: "mock" | "twilio";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function AdminAlertsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
  const [status, setStatus] = useState<"" | "sent" | "failed">("");
  const [eventType, setEventType] = useState<"" | AlertItem["eventType"]>("");
  const [channel, setChannel] = useState<"" | AlertItem["channel"]>("");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleUnauthorized = useCallback(() => {
    setItems([]);
    setAuthRequired(true);
    setMessage("Admin session required. Redirecting to login...");
    const next = encodeURIComponent("/dashboard/admin?section=alerts");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 250);
  }, [router]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));
    if (status) params.set("status", status);
    if (eventType) params.set("eventType", eventType);
    if (channel) params.set("channel", channel);
    return params.toString();
  }, [pagination.page, pagination.pageSize, status, eventType, channel]);

  const load = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);
    try {
      const res = await fetch(`/api/admin/alerts?${queryString}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load alerts");
      }
      setItems(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(logId: string) {
    setRetryingId(logId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Retry failed");
      }
      setMessage(`Retry processed (${data.result?.deliveryStatus ?? "unknown"}).`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-black/60">Alerts</p>
          <h3 className="text-lg font-semibold">Booking Alert Deliveries</h3>
        </div>
        <button
          onClick={() => void load()}
          className="rounded border border-black/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/[0.03]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value as "" | "sent" | "failed"); setPagination((p) => ({ ...p, page: 1 })); }} className="rounded border border-black/15 px-3 py-2 text-sm">
          <option value="">All status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <select value={eventType} onChange={(e) => { setEventType(e.target.value as "" | AlertItem["eventType"]); setPagination((p) => ({ ...p, page: 1 })); }} className="rounded border border-black/15 px-3 py-2 text-sm">
          <option value="">All events</option>
          <option value="booking_confirmed">Booking Confirmed</option>
          <option value="payment_success">Payment Success</option>
          <option value="pickup_reminder">Pickup Reminder</option>
          <option value="return_reminder">Return Reminder</option>
        </select>
        <select value={channel} onChange={(e) => { setChannel(e.target.value as "" | AlertItem["channel"]); setPagination((p) => ({ ...p, page: 1 })); }} className="rounded border border-black/15 px-3 py-2 text-sm">
          <option value="">All channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <button
          onClick={() => void load()}
          className="rounded border border-black px-3 py-2 text-sm"
        >
          Apply
        </button>
      </div>

      {message ? <p className="mt-3 rounded border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">{message}</p> : null}

      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-sm text-black/60">Loading alerts...</p>
        ) : authRequired ? (
          <p className="text-sm text-black/70">Admin authentication is required to view alerts.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-black/60">No alert logs found.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.eventType.replace("_", " ").toUpperCase()} · {item.deliveryStatus.toUpperCase()}</p>
                <span className="text-xs text-black/60">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p>Booking: {item.bookingId} · {item.userEmail}</p>
              <p>Channel: {item.channel.toUpperCase()} · Provider: {item.provider.toUpperCase()} {item.destination ? `· ${item.destination}` : ""}</p>
              <p className="text-black/70">{item.message}</p>
              {item.deliveryError ? <p className="text-red-700">Error: {item.deliveryError}</p> : null}

              {item.deliveryStatus === "failed" ? (
                <button
                  disabled={retryingId === item.id}
                  onClick={() => void retry(item.id)}
                  className="mt-2 rounded border border-black/15 px-3 py-1 text-xs font-semibold transition hover:bg-black/[0.03] disabled:opacity-60"
                >
                  {retryingId === item.id ? "Retrying..." : "Retry Delivery"}
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-black/60">
        <p>Page {pagination.page} of {Math.max(1, pagination.totalPages)} · Total {pagination.totalItems}</p>
        <div className="flex gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            className="rounded border border-black/15 px-3 py-1 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
            className="rounded border border-black/15 px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
