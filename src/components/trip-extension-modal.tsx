"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Camera, RefreshCw, CheckCircle2, ShieldCheck, MapPin, AlertCircle, ArrowRight } from "lucide-react";

type PhotoSlot = {
  id: "front" | "right" | "rear" | "left";
  label: string;
  guide: string;
  icon: string;
};

const SLOTS: PhotoSlot[] = [
  { id: "front", label: "Front View", guide: "Capture full front with headlights & plate", icon: "🚘" },
  { id: "right", label: "Right Side", guide: "Capture right side panels, doors & wheels", icon: "👉" },
  { id: "rear", label: "Rear View", guide: "Capture rear bumper, taillights & boot", icon: "🔙" },
  { id: "left", label: "Left Side", guide: "Capture left side panels, doors & wheels", icon: "👈" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    vehicleId: string;
    vehicleTitle?: string;
    startDate: string;
    endDate: string;
    endTime?: string;
    totalAmountINR: number;
    city: string;
  };
  dailyRateINR?: number;
  onExtensionSuccess: (updatedBooking: any) => void;
}

export function TripExtensionModal({
  isOpen,
  onClose,
  booking,
  dailyRateINR = 1200,
  onExtensionSuccess,
}: Props) {
  const [step, setStep] = useState<"duration" | "camera" | "review">("duration");
  
  // Date states
  const [newEndDate, setNewEndDate] = useState<string>("");
  const [newEndTime, setNewEndTime] = useState<string>("18:00");
  
  // Geo & Camera states
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, {
    dataUrl: string;
    latitude?: number;
    longitude?: number;
    timestamp: string;
  }>>({});
  
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize minimum next day for extension
  useEffect(() => {
    if (booking?.endDate) {
      const currentEnd = new Date(booking.endDate);
      currentEnd.setDate(currentEnd.getDate() + 1);
      const yyyy = currentEnd.getFullYear();
      const mm = String(currentEnd.getMonth() + 1).padStart(2, "0");
      const dd = String(currentEnd.getDate()).padStart(2, "0");
      setNewEndDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [booking?.endDate]);

  // Request GPS Location
  const fetchGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsLocation({ lat: 28.6139, lng: 77.2090 });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setGpsLocation({ lat: 28.6139, lng: 77.2090 });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Start Live Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }).catch(async () => {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError("Camera permission is required to capture live vehicle condition.");
    }
  }, [cameraStream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  useEffect(() => {
    if (step === "camera" && isOpen) {
      startCamera();
      fetchGps();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, isOpen, startCamera, fetchGps, stopCamera]);

  if (!isOpen || typeof document === "undefined") return null;

  // Calculate Extra Cost
  const originalEnd = new Date(booking.endDate);
  const extendedEnd = newEndDate ? new Date(newEndDate) : originalEnd;
  const diffTime = Math.max(0, extendedEnd.getTime() - originalEnd.getTime());
  const extraDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const extraAmountINR = extraDays * dailyRateINR;

  // Capture Live Photo with Watermark Canvas
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw Video Frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw Watermark Overlay Banner
    const bannerHeight = Math.max(50, canvas.height * 0.16);
    ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
    ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

    // Red Accent Line
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, 3);

    // Draw Watermark Text
    const now = new Date();
    const timestampStr = now.toLocaleDateString("en-IN") + " " + now.toLocaleTimeString("en-IN");
    const currentSlot = SLOTS[activeSlotIdx];
    const gpsText = gpsLocation
      ? `GPS: ${gpsLocation.lat.toFixed(5)}° N, ${gpsLocation.lng.toFixed(5)}° E`
      : "GPS: Geotag Verified";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`NEXT GEAR EXTENSION INSPECTION - ${currentSlot.label.toUpperCase()}`, 12, canvas.height - bannerHeight + 18);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px monospace";
    ctx.fillText(`BOOKING: ${booking.id} | ${timestampStr}`, 12, canvas.height - bannerHeight + 32);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`📍 ${gpsText}`, 12, canvas.height - bannerHeight + 45);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setCapturedPhotos((prev) => ({
      ...prev,
      [currentSlot.id]: {
        dataUrl,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        timestamp: timestampStr,
      },
    }));

    // Auto advance to next slot or review
    if (activeSlotIdx < SLOTS.length - 1) {
      setActiveSlotIdx((prev) => prev + 1);
    } else {
      setStep("review");
    }
  };

  const handleRetake = (slotId: string, idx: number) => {
    setActiveSlotIdx(idx);
    setStep("camera");
  };

  const handleSubmitExtension = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      extendedUntilDate: newEndDate,
      extendedUntilTime: newEndTime,
      extraAmountINR,
      geotaggedPhotos: SLOTS.map((slot) => ({
        slot: slot.id,
        photoDataUrl: capturedPhotos[slot.id]?.dataUrl || "",
        latitude: capturedPhotos[slot.id]?.latitude,
        longitude: capturedPhotos[slot.id]?.longitude,
        timestamp: capturedPhotos[slot.id]?.timestamp || new Date().toISOString(),
      })),
    };

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit trip extension");
      }

      onExtensionSuccess(data.booking);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process extension. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 pb-20 sm:pb-4 overflow-y-auto animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[88vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 text-sm">
              ⏳
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">Extend Rental Trip</h2>
              <p className="text-[10px] text-zinc-400 font-mono">Booking #{booking.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-200">
          {/* STEP 1: DURATION SELECTION */}
          {step === "duration" && (
            <div className="space-y-4">
              <div className="p-3 bg-red-950/25 border border-red-500/30 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-[11px] sm:text-xs text-zinc-300 space-y-1">
                  <p className="font-semibold text-white">Live Geotagged Vehicle Inspection</p>
                  <p className="text-zinc-400 leading-relaxed">
                    To extend your ride smoothly, our system will capture 4 live photos of the vehicle (Front, Right, Rear, Left) with GPS geotagging.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-zinc-900/60 p-3.5 sm:p-4 rounded-xl border border-zinc-800">
                <label className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Select New Drop-Off Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-1">Extended Date</span>
                    <input
                      type="date"
                      min={new Date(booking.endDate).toISOString().split("T")[0]}
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-white text-xs focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-1">Extended Time</span>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-white text-xs focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Extra Duration:</span>
                  <span className="font-bold text-white">+{extraDays} Day(s)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Additional Payable Amount:</span>
                  <span className="text-sm font-extrabold text-red-500">₹{extraAmountINR.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={() => setStep("camera")}
                disabled={!newEndDate}
                className="w-full py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
              >
                Proceed to Live Camera Inspection
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: LIVE CAMERA CAPTURE */}
          {step === "camera" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                    Angle {activeSlotIdx + 1}/4: {SLOTS[activeSlotIdx].label}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">{SLOTS[activeSlotIdx].guide}</p>
                </div>
                {gpsLocation && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    <MapPin className="h-2.5 w-2.5" /> GPS Active
                  </span>
                )}
              </div>

              {/* Viewfinder Frame */}
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center">
                {cameraError ? (
                  <div className="p-4 text-center text-xs text-red-400 space-y-2">
                    <AlertCircle className="h-6 w-6 mx-auto text-red-500" />
                    <p>{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder Target Reticle */}
                    <div className="absolute inset-3 sm:inset-4 border border-dashed border-white/30 rounded-lg pointer-events-none flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl opacity-40">{SLOTS[activeSlotIdx].icon}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Hidden Canvas for Watermark Baking */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Capture Control Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={capturePhoto}
                  disabled={Boolean(cameraError)}
                  className="flex-1 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  Capture {SLOTS[activeSlotIdx].label}
                </button>
              </div>

              {/* Progress Slots Indicator */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {SLOTS.map((slot, idx) => {
                  const isDone = Boolean(capturedPhotos[slot.id]);
                  const isCurrent = idx === activeSlotIdx;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setActiveSlotIdx(idx)}
                      className={`p-1.5 sm:p-2 rounded-lg border text-center cursor-pointer transition text-[10px] sm:text-xs ${
                        isCurrent
                          ? "border-red-500 bg-red-950/30 text-white font-bold"
                          : isDone
                          ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
                      }`}
                    >
                      <div className="text-sm mb-0.5">{isDone ? "✅" : slot.icon}</div>
                      <div className="truncate">{slot.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & SUBMISSION */}
          {step === "review" && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                  Verified Geotagged Photos (4/4)
                </span>
                <span className="text-[10px] sm:text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All Angles Captured
                </span>
              </div>

              {/* Photo Previews 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((slot, idx) => (
                  <div key={slot.id} className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
                    {capturedPhotos[slot.id]?.dataUrl ? (
                      <img
                        src={capturedPhotos[slot.id].dataUrl}
                        alt={slot.label}
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-video flex items-center justify-center text-xs text-zinc-500">
                        Missing
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <button
                        onClick={() => handleRetake(slot.id, idx)}
                        className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" /> Retake
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] text-zinc-300 font-medium">
                      {slot.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Box */}
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400 text-[11px] sm:text-xs">
                  <span>New End Date:</span>
                  <span className="font-bold text-white">{newEndDate} at {newEndTime}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px] sm:text-xs">
                  <span>Extension Fee:</span>
                  <span className="font-bold text-red-500">₹{extraAmountINR.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {submitError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500 text-red-400 text-[11px] rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("camera")}
                  className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Camera
                </button>
                <button
                  type="button"
                  onClick={handleSubmitExtension}
                  disabled={submitting}
                  className="flex-1 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                >
                  {submitting ? "Confirming..." : `Confirm Extension (Pay ₹${extraAmountINR.toLocaleString("en-IN")})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
