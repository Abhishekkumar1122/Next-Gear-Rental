"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type WaitlistEntry = {
  id: string;
  vehicleId: string;
  vehicleTitle?: string;
  userEmail: string;
  city: string;
  status: "pending" | "notified" | "cancelled";
  createdAt: string;
  notifiedAt?: string;
};

type WaitlistNotification = {
  id: string;
  waitlistId: string;
  vehicleId: string;
  vehicleTitle?: string;
  userEmail: string;
  channel: "email" | "sms";
  provider: "mock" | "twilio";
  deliveryStatus: "sent" | "failed";
  deliveryError?: string;
  message: string;
  createdAt: string;
};

export function CustomerWaitlistPanel({ userEmail }: { userEmail: string }) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [notifications, setNotifications] = useState<WaitlistNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
      setNotifications(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-xl bg-black/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">My Waitlist</h2>
          <p className="text-sm text-black/60">Track unavailable rides and alerts when they are released.</p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-lg border border-black/10 px-4 py-1.5 text-sm font-medium transition hover:bg-black/5"
        >
          ↻ Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center">
          <p className="font-semibold text-black/70">No waitlist entries yet</p>
          <p className="mt-1 text-sm text-black/50">When a vehicle is unavailable, tap “Join waitlist” and it will appear here.</p>
          <Link
            href="/vehicles"
            className="mt-4 inline-block rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white transition hover:scale-105"
          >
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-black/10 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Vehicle: {entry.vehicleTitle || entry.vehicleId}</p>
                  <p className="text-xs text-black/50">City: {entry.city}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    entry.status === "pending"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : entry.status === "notified"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-black/15 bg-black/5 text-black/70"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-black/50">
                Joined: {new Date(entry.createdAt).toLocaleString("en-IN")}
                {entry.notifiedAt ? ` · Notified: ${new Date(entry.notifiedAt).toLocaleString("en-IN")}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-black/50">Notification history</h3>
        {notifications.length === 0 ? (
          <p className="text-sm text-black/60">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm">
                <p className="text-xs font-semibold text-black/60">Vehicle: {item.vehicleTitle || item.vehicleId}</p>
                <p className="text-black/80">{item.message}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-black/15 px-2 py-0.5 uppercase text-black/60">{item.channel}</span>
                  <span className="rounded-full border border-black/15 px-2 py-0.5 uppercase text-black/60">{item.provider}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 uppercase ${
                      item.deliveryStatus === "sent"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {item.deliveryStatus}
                  </span>
                </div>
                {item.deliveryError ? <p className="mt-1 text-xs text-red-600">{item.deliveryError}</p> : null}
                <p className="mt-1 text-xs text-black/50">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
