"use client";

import { useState } from "react";

type TrackingState = {
  jobId: string;
  status: string;
  scheduledAt?: string;
  liveLat?: number;
  liveLng?: number;
  lastLocationAt?: string;
  endLat?: number;
  endLng?: number;
};

export function DeliveryTrackingPanel() {
  const [jobId, setJobId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [message, setMessage] = useState("");
  const [track, setTrack] = useState<TrackingState | null>(null);

  async function findByBooking() {
    if (!bookingId) return;
    setMessage("Finding delivery job...");
    setTrack(null);

    const response = await fetch(`/api/delivery/jobs?bookingId=${encodeURIComponent(bookingId)}`);
    const data = await response.json();
    const job = Array.isArray(data.jobs) ? data.jobs[0] : null;

    if (!job) {
      setMessage("No delivery job found for this booking.");
      return;
    }

    setJobId(job.id);
    await trackJob(job.id);
  }

  async function trackJob(id?: string) {
    const target = id ?? jobId;
    if (!target) return;
    setMessage("Fetching live tracking...");
    setTrack(null);

    const response = await fetch(`/api/delivery/jobs/${encodeURIComponent(target)}/track`);
    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.error ?? "Unable to fetch tracking.");
      return;
    }

    setTrack(data as TrackingState);
    setMessage("");
  }

  const hasLocation = typeof track?.liveLat === "number" && typeof track?.liveLng === "number";
  const mapsLink = hasLocation
    ? `https://www.google.com/maps?q=${track?.liveLat},${track?.liveLng}`
    : null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-black/60">Live Tracking</p>
      <h1 className="mt-2 text-2xl font-semibold">Delivery & Pickup Status</h1>
      <p className="mt-2 text-sm text-black/70">Track your driver in real time with location updates.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <input
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            placeholder="Enter job ID"
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
          />
          <button onClick={() => trackJob()} className="w-full rounded-xl border border-black px-3 py-2 text-sm font-semibold">
            Track by job ID
          </button>
        </div>
        <div className="space-y-2">
          <input
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            placeholder="Enter booking ID"
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
          />
          <button onClick={findByBooking} className="w-full rounded-xl border border-black px-3 py-2 text-sm font-semibold">
            Track by booking ID
          </button>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-black/70">{message}</p> : null}

      {track ? (
        <div className="mt-5 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm">
          <p className="font-semibold">Status: {track.status}</p>
          {track.scheduledAt && <p>Scheduled: {new Date(track.scheduledAt).toLocaleString()}</p>}
          {track.lastLocationAt && <p>Last update: {new Date(track.lastLocationAt).toLocaleString()}</p>}
          {hasLocation ? (
            <div className="mt-3 space-y-1">
              <p>Live location: {track.liveLat?.toFixed(5)}, {track.liveLng?.toFixed(5)}</p>
              {mapsLink ? (
                <a className="text-[var(--brand-red)] underline" href={mapsLink} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-black/60">No live coordinates yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
