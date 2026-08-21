"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GpsSenderContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || searchParams.get("bookingId") || "";
  const initialDriverId = searchParams.get("driverId") || "drv-vendor-1";

  const [jobId, setJobId] = useState(initialJobId);
  const [driverId, setDriverId] = useState(initialDriverId);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const startGpsBroadcast = () => {
    if (!jobId.trim()) {
      setErrorMsg("Please enter a valid Delivery Job ID or Booking ID.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setErrorMsg("Geolocation is not supported by your mobile browser.");
      return;
    }

    setErrorMsg("");
    setIsBroadcasting(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
        const acc = Math.round(position.coords.accuracy);

        setCurrentLat(lat);
        setCurrentLng(lng);
        setSpeedKmh(speed);
        setAccuracy(acc);

        const now = Date.now();
        // Throttle updates to max once every 2.5 seconds
        if (now - lastSentRef.current >= 2500) {
          lastSentRef.current = now;
          setLastPingTime(new Date().toLocaleTimeString());
          setUpdateCount((prev) => prev + 1);

          fetch(`/api/delivery/jobs/${encodeURIComponent(jobId.trim())}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat,
              lng,
              accuracy: acc,
              speedKmh: speed,
              driverId: driverId.trim(),
              recordedAt: new Date().toISOString(),
            }),
          }).catch((err) => console.error("[GPS Push Failed]", err));
        }
      },
      (err) => {
        console.error("[Geolocation Error]", err);
        setErrorMsg(`GPS Signal Error: ${err.message}. Please enable High Accuracy Location.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = watchId;
  };

  const stopGpsBroadcast = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcasting(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-6">
      {/* App Header */}
      <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl p-5 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950/80 border border-red-500/40 text-2xl mb-3 animate-pulse">
          📡
        </div>
        <h1 className="text-xl font-black uppercase text-white tracking-wider">Next Gear GPS Broadcaster</h1>
        <p className="text-xs text-white/60 mt-1">
          Live Vehicle & Delivery Location Dispatcher for Vendors & Drivers
        </p>

        {/* Bookmark App Tip */}
        <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/70 text-left flex items-center gap-2">
          <span>📱</span>
          <span><strong>Mobile App Tip:</strong> Tap browser menu → <strong>&quot;Add to Home Screen&quot;</strong> to bookmark as a native app!</span>
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-[#0d0d12] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
        <div>
          <label className="block text-[11px] font-bold uppercase text-white/70 tracking-wider mb-1">
            Delivery Job ID / Booking ID:
          </label>
          <input
            type="text"
            value={jobId}
            disabled={isBroadcasting}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="e.g. del_job_101 or NG849102"
            className="w-full bg-[#181820] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-white/70 tracking-wider mb-1">
            Driver / Executive Name / ID:
          </label>
          <input
            type="text"
            value={driverId}
            disabled={isBroadcasting}
            onChange={(e) => setDriverId(e.target.value)}
            placeholder="e.g. Rahul Sharma (drv-1)"
            className="w-full bg-[#181820] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs font-bold text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        {!isBroadcasting ? (
          <button
            type="button"
            onClick={startGpsBroadcast}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500/50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition cursor-pointer"
          >
            🟢 START LIVE GPS BROADCASTING
          </button>
        ) : (
          <button
            type="button"
            onClick={stopGpsBroadcast}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 transition cursor-pointer"
          >
            🔴 STOP GPS BROADCASTING
          </button>
        )}
      </div>

      {/* Live Telemetry Display */}
      {isBroadcasting && (
        <div className="bg-[#0f0f15] border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE TELEMETRY ACTIVE
            </span>
            <span className="text-[10px] font-mono text-white/50">Pings: {updateCount}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#14141c] border border-white/5 rounded-xl p-3">
              <div className="text-[9px] font-black uppercase text-white/40">Current Speed</div>
              <div className="text-2xl font-black text-white mt-0.5">{speedKmh} <span className="text-xs text-emerald-400">km/h</span></div>
            </div>

            <div className="bg-[#14141c] border border-white/5 rounded-xl p-3">
              <div className="text-[9px] font-black uppercase text-white/40">GPS Accuracy</div>
              <div className="text-2xl font-black text-white mt-0.5">±{accuracy ?? 0} <span className="text-xs text-emerald-400">m</span></div>
            </div>
          </div>

          <div className="bg-[#14141c] border border-white/5 rounded-xl p-3 text-xs space-y-1 font-mono text-white/70">
            <div>Latitude: <span className="text-white font-bold">{currentLat?.toFixed(6) ?? "--"}</span></div>
            <div>Longitude: <span className="text-white font-bold">{currentLng?.toFixed(6) ?? "--"}</span></div>
            <div>Last Ping: <span className="text-emerald-400 font-bold">{lastPingTime ?? "--"}</span></div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function GpsSenderPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-6">
      <Suspense fallback={<div className="text-center py-10 text-xs text-white/50">Loading GPS Broadcaster...</div>}>
        <GpsSenderContent />
      </Suspense>
    </div>
  );
}
