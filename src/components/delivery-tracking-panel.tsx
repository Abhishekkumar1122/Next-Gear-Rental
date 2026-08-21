"use client";

import { useState, useEffect, useRef } from "react";
import { LiveRouteMap } from "@/components/live-route-map";

type TrackingState = {
  jobId: string;
  status: string;
  scheduledAt?: string;
  liveLat?: number;
  liveLng?: number;
  lastLocationAt?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
};

// Simple haversine-like distance formula in KM for Indian locations
function calculateDistanceKM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function DeliveryTrackingPanel({ bookingId: initialBookingId }: { bookingId?: string }) {
  const [jobId, setJobId] = useState("");
  const [bookingId, setBookingId] = useState(initialBookingId ?? "");
  const [message, setMessage] = useState("");
  const [track, setTrack] = useState<TrackingState | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<"google" | "radar">("google");

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simTotalSteps] = useState(12);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // OTP State
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Automatically clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // 3-second live GPS auto-polling when active tracking job is loaded
  useEffect(() => {
    if (!jobId || isSimulating) return;
    const pollInterval = setInterval(() => {
      fetch(`/api/delivery/jobs/${encodeURIComponent(jobId)}/track`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.status) {
            setTrack(data as TrackingState);
          }
        })
        .catch((e) => console.error("[Live GPS Poll Failed]", e));
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [jobId, isSimulating]);

  // Automatic Rapido/Ola Style Auto-Load & Browser Geolocation
  useEffect(() => {
    const autoInitialize = async () => {
      let targetJobId = "";
      if (initialBookingId) {
        setBookingId(initialBookingId);
        try {
          const res = await fetch(`/api/delivery/jobs?bookingId=${encodeURIComponent(initialBookingId)}`);
          const data = await res.json();
          const job = Array.isArray(data.jobs) ? data.jobs[0] : null;
          if (job) targetJobId = job.id;
        } catch (e) {
          console.error("[Auto-load booking failed]", e);
        }
      }

      if (!targetJobId) {
        // Automatically load latest active delivery job
        try {
          const res = await fetch(`/api/delivery/jobs`);
          const data = await res.json();
          const job = Array.isArray(data.jobs) && data.jobs.length > 0 ? data.jobs[0] : null;
          if (job) targetJobId = job.id;
        } catch (e) {
          console.error("[Auto-load active job failed]", e);
        }
      }

      // Default fallback to job-1 if no jobs exist yet
      if (!targetJobId) targetJobId = "job-1";

      setJobId(targetJobId);

      try {
        const trackRes = await fetch(`/api/delivery/jobs/${encodeURIComponent(targetJobId)}/track`);
        const trackData = await trackRes.json();
        if (trackRes.ok) {
          setTrack(trackData as TrackingState);
          setMessage("");
        }
      } catch (err) {
        console.error("[Auto-track failed]", err);
      }
    };

    autoInitialize();

    // Capture customer's live physical GPS location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setTrack((prev) =>
            prev
              ? {
                  ...prev,
                  endLat: userLat,
                  endLng: userLng,
                }
              : prev
          );
        },
        (err) => console.log("[Customer Location Access Declined]", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [initialBookingId]);

  async function findByBooking() {
    if (!bookingId) return;
    setMessage("Finding delivery job...");
    setTrack(null);
    setOtpSuccess(false);
    setOtpMessage("");

    try {
      const response = await fetch(`/api/delivery/jobs?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await response.json();
      const job = Array.isArray(data.jobs) ? data.jobs[0] : null;

      if (!job) {
        setMessage("No active delivery job found for this booking.");
        return;
      }

      setJobId(job.id);
      await trackJob(job.id);
    } catch (error) {
      setMessage("Error searching for job by booking ID.");
    }
  }

  async function trackJob(id?: string) {
    const target = id ?? jobId;
    if (!target) return;
    setMessage("Fetching live tracking details...");
    setTrack(null);
    setOtpSuccess(false);
    setOtpMessage("");

    try {
      const response = await fetch(`/api/delivery/jobs/${encodeURIComponent(target)}/track`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error ?? "Unable to fetch tracking.");
        return;
      }

      setTrack(data as TrackingState);
      setMessage("");
    } catch (error) {
      setMessage("Failed to retrieve tracking data.");
    }
  }

  // Simulate delivery driver movement
  async function startSimulation() {
    if (!track) return;
    if (isSimulating) return;

    // Default coordinate coordinates if none exist
    const startLat = track.startLat ?? 28.5562;
    const startLng = track.startLng ?? 77.1000;
    const endLat = track.endLat ?? 28.6139;
    const endLng = track.endLng ?? 77.2090;

    setIsSimulating(true);
    setSimStep(0);
    setOtpMessage("");
    setOtpSuccess(false);

    let currentStep = 0;

    // Clear any existing simulation interval
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(async () => {
      currentStep += 1;
      setSimStep(currentStep);

      const ratio = currentStep / simTotalSteps;
      const nextLat = startLat + (endLat - startLat) * ratio;
      const nextLng = startLng + (endLng - startLng) * ratio;

      // Determine next status
      let nextStatus = "en_route";
      if (currentStep === simTotalSteps) {
        nextStatus = "arrived";
      }

      // Update local UI immediately for responsiveness
      setTrack((prev) =>
        prev
          ? {
              ...prev,
              liveLat: nextLat,
              liveLng: nextLng,
              status: nextStatus,
              lastLocationAt: new Date().toISOString(),
            }
          : null
      );

      // POST updated coordinates to API
      try {
        await fetch(`/api/delivery/jobs/${encodeURIComponent(track.jobId)}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: nextLat, lng: nextLng }),
        });

        // Update status via PATCH API
        await fetch(`/api/delivery/jobs/${encodeURIComponent(track.jobId)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, message: `Driver progress update: Step ${currentStep}` }),
        });
      } catch (e) {
        console.error("Failed to sync simulation coordinates to API:", e);
      }

      // If reached target, stop simulation
      if (currentStep >= simTotalSteps) {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
        setIsSimulating(false);
      }
    }, 1500);
  }

  // Handle OTP handoff completion
  async function verifyOtp() {
    if (!track || !otpCode) return;
    setOtpMessage("Verifying OTP handoff...");

    try {
      const response = await fetch(`/api/delivery/jobs/${encodeURIComponent(track.jobId)}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setOtpSuccess(true);
        setOtpMessage("OTP verified! Vehicle handoff successfully completed.");
        setTrack((prev) => (prev ? { ...prev, status: "completed" } : null));
      } else {
        setOtpMessage(data?.error ?? "Incorrect OTP. Please enter the correct code.");
      }
    } catch (e) {
      setOtpMessage("Verification request failed. Try again.");
    }
  }

  // Map latitude/longitude to SVG viewport coordinates (0 to 500 width, 0 to 300 height)
  function getSvgCoords(lat: number, lng: number) {
    const sLat = track?.startLat ?? 28.5562;
    const sLng = track?.startLng ?? 77.1000;
    const eLat = track?.endLat ?? 28.6139;
    const eLng = track?.endLng ?? 77.2090;

    const latDiff = Math.abs(eLat - sLat);
    const lngDiff = Math.abs(eLng - sLng);

    if (latDiff < 0.0001 && lngDiff < 0.0001) {
      return { x: 250, y: 150 };
    }

    const padding = 50;
    const width = 500 - padding * 2;
    const height = 300 - padding * 2;

    const minLat = Math.min(sLat, eLat);
    const maxLat = Math.max(sLat, eLat);
    const minLng = Math.min(sLng, eLng);
    const maxLng = Math.max(sLng, eLng);

    // Map latitude (y-axis inverted in screen coords)
    const yRatio = (lat - minLat) / (maxLat - minLat);
    const y = 300 - (padding + yRatio * height);

    // Map longitude (x-axis)
    const xRatio = (lng - minLng) / (maxLng - minLng);
    const x = padding + xRatio * width;

    return { x, y };
  }

  const sLat = track?.startLat ?? 28.5562;
  const sLng = track?.startLng ?? 77.1000;
  const eLat = track?.endLat ?? 28.6139;
  const eLng = track?.endLng ?? 77.2090;
  const lLat = track?.liveLat ?? sLat;
  const lLng = track?.liveLng ?? sLng;

  const startPos = getSvgCoords(sLat, sLng);
  const endPos = getSvgCoords(eLat, eLng);
  const livePos = getSvgCoords(lLat, lLng);

  const distTotal = calculateDistanceKM(sLat, sLng, eLat, eLng);
  const distRemaining = track?.status === "completed" ? 0 : calculateDistanceKM(lLat, lLng, eLat, eLng);
  const speed = isSimulating ? 45 : track?.status === "en_route" ? 38 : 0;
  const etaMins = speed > 0 ? Math.round((distRemaining / speed) * 60) : 0;

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-black/5 pb-4 gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[var(--brand-red)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-red)]"></span>
            </span>
            Live GPS Telematics
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Live Vehicle Tracking</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Real-time GPS route, driver status, and doorstep delivery ETA</p>
        </div>

        <button
          type="button"
          onClick={() => setShowSearchBox((prev) => !prev)}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl border border-black/15 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          🔍 {showSearchBox ? "Hide Search" : "Search Specific Booking"}
        </button>
      </div>

      {/* Optional Collapsible Search Panel */}
      {showSearchBox && (
        <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:p-5 md:grid-cols-2 animate-fade-in border border-black/10">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search by Job Identifier</label>
            <div className="flex gap-2">
              <input
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="e.g. job-1"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none"
              />
              <button
                onClick={() => trackJob()}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Track
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search by Booking ID</label>
            <div className="flex gap-2">
              <input
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="e.g. bk-1"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none"
              />
              <button
                onClick={findByBooking}
                className="rounded-xl border border-slate-350 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Find Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {jobId && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white">
          <div className="flex items-center gap-2">
            <span>📡 Vendor / Driver Mobile GPS Broadcaster App:</span>
            <span className="text-white/60 font-mono hidden sm:inline">/delivery/track-sender?jobId={jobId}</span>
          </div>
          <a
            href={`/delivery/track-sender?jobId=${encodeURIComponent(jobId)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 font-bold text-white transition"
          >
            Launch Mobile GPS App 🚀
          </a>
        </div>
      )}

      {message ? (
        <div className="mt-4 rounded-xl bg-amber-50/70 border border-amber-200/50 p-3.5 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      {track ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Google Maps / Telematics Map Screen */}
          <div className="flex flex-col lg:col-span-7">
            {/* View Mode Toggle Controls */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-black/10">
                <button
                  type="button"
                  onClick={() => setMapViewMode("google")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mapViewMode === "google"
                      ? "bg-white text-slate-900 shadow border border-black/10"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  🗺️ Google Maps
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode("radar")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mapViewMode === "radar"
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  📡 Telematics Radar
                </button>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${lLat},${lLng}&destination=${eLat},${eLng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                📍 Open in Google Maps
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-1 shadow-2xl">
              <div className="absolute left-4 top-4 z-10 flex gap-2 pointer-events-none">
                <span className="rounded bg-slate-900/95 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {mapViewMode === "google" ? "GOOGLE MAPS LIVE" : "RADAR LIVE FEED"}
                </span>
                {isSimulating && (
                  <span className="rounded bg-amber-500/90 px-2 py-1 text-[10px] font-semibold text-slate-950 animate-pulse">
                    SIMULATION RUNNING
                  </span>
                )}
              </div>

              {mapViewMode === "google" ? (
                <LiveRouteMap
                  startLat={sLat}
                  startLng={sLng}
                  liveLat={lLat}
                  liveLng={lLng}
                  endLat={eLat}
                  endLng={eLng}
                  vehicleType={(track as any).vehicleType ?? "bike"}
                  status={track.status}
                  etaMins={etaMins}
                  distanceKm={Number(distRemaining.toFixed(1))}
                />
              ) : (
                <svg viewBox="0 0 500 300" className="w-full h-auto bg-slate-900 select-none">
                  <defs>
                    <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <pattern id="radar-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                    </pattern>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#radar-grid)" />
                  <circle cx="250" cy="150" r="120" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,6" />
                  <circle cx="250" cy="150" r="220" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,6" />

                  <line
                    x1={startPos.x}
                    y1={startPos.y}
                    x2={endPos.x}
                    y2={endPos.y}
                    stroke="#334155"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={startPos.x}
                    y1={startPos.y}
                    x2={endPos.x}
                    y2={endPos.y}
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="8,6"
                    filter="url(#neon-glow)"
                  />

                  <g transform={`translate(${startPos.x}, ${startPos.y})`}>
                    <circle r="12" fill="#10b981" opacity="0.25" className="animate-ping" />
                    <circle r="7" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                    <circle r="3" fill="#ffffff" />
                    <text y="-14" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 font-sans">
                      HUB
                    </text>
                  </g>

                  <g transform={`translate(${endPos.x}, ${endPos.y})`}>
                    <circle r="12" fill="#ef4444" opacity="0.25" className="animate-ping" />
                    <circle r="7" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
                    <circle r="3" fill="#ffffff" />
                    <text y="-14" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 font-sans">
                      DROP
                    </text>
                  </g>

                  <g transform={`translate(${livePos.x}, ${livePos.y})`}>
                    <circle r="18" fill="#f59e0b" opacity="0.2" />
                    <circle r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" filter="url(#neon-glow)" />
                    <polygon points="-3,4 3,4 0,-5" fill="#0f172a" />
                  </g>
                </svg>
              )}

              <div className="bg-slate-950 p-3 px-4 flex justify-between items-center text-xs font-mono text-slate-400 border-t border-slate-800">
                <span>GPS: {lLat.toFixed(4)}°N, {lLng.toFixed(4)}°E</span>
                <span>JOB: {track.jobId}</span>
              </div>
            </div>

            {/* Sim controller trigger */}
            <div className="mt-4">
              <button
                onClick={startSimulation}
                disabled={isSimulating || track.status === "completed"}
                className={`w-full rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  track.status === "completed"
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : isSimulating
                    ? "bg-amber-500 text-slate-950 cursor-wait font-semibold"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                }`}
              >
                {isSimulating ? (
                  <>
                    <svg className="animate-spin h-4 w-full max-w-[16px] text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Simulating Transit ({simStep}/{simTotalSteps})...
                  </>
                ) : track.status === "completed" ? (
                  "Handoff Verification Completed"
                ) : (
                  "▶ Start GPS Driver Simulation"
                )}
              </button>
            </div>
          </div>

          {/* Details Dashboard Panel */}
          <div className="flex flex-col lg:col-span-5 justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      track.status === "completed"
                        ? "bg-green-150 text-green-700"
                        : track.status === "arrived"
                        ? "bg-amber-100 text-amber-800 font-semibold animate-pulse"
                        : track.status === "en_route"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {track.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Remaining Dist</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {distRemaining.toFixed(2)} km
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Route</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {distTotal.toFixed(2)} km
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Transit Speed</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">{speed} km/h</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estimated ETA</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {track.status === "completed" ? "0 mins" : etaMins > 0 ? `${etaMins} mins` : "Arrived"}
                  </p>
                </div>
              </div>

              {/* Scheduled/Update Timestamps */}
              <div className="space-y-1.5 text-xs text-slate-500">
                {track.scheduledAt && (
                  <p className="flex justify-between">
                    <span className="font-medium">Scheduled Time:</span>
                    <span>{new Date(track.scheduledAt).toLocaleString()}</span>
                  </p>
                )}
                {track.lastLocationAt && (
                  <p className="flex justify-between">
                    <span className="font-medium">Last Ping:</span>
                    <span>{new Date(track.lastLocationAt).toLocaleTimeString()}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Verification / Handoff trigger */}
            {track.status === "arrived" && !otpSuccess && (
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 space-y-3">
                <div className="flex gap-2">
                  <span className="text-xl">🔑</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Verify Driver OTP Handoff</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify OTP to confirm delivery handoff. Hint: Check `deliveryOtpStore` in `store.ts` for this job (e.g. 774542).
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-center font-mono font-semibold tracking-widest text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={verifyOtp}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition whitespace-nowrap"
                  >
                    Confirm Handoff
                  </button>
                </div>

                {otpMessage && (
                  <p className={`text-xs ${otpSuccess ? "text-green-600 font-semibold" : "text-red-500"}`}>
                    {otpMessage}
                  </p>
                )}
              </div>
            )}

            {track.status === "completed" && (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-600 text-lg mb-2">
                  ✓
                </span>
                <h4 className="text-sm font-bold text-green-800">Ride Completed</h4>
                <p className="text-xs text-green-600 mt-1">
                  The vehicle handoff has been completed. Happy riding!
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/30 p-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xl">
            📍
          </span>
          <p className="mt-3 text-sm font-medium text-slate-500">
            No live tracking active. Search above by booking ID (e.g., bk-1) or job ID to monitor progress.
          </p>
        </div>
      )}
    </div>
  );
}
