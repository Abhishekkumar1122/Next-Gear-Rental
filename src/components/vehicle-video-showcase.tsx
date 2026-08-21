"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Film, Image as ImageIcon, Sparkles, Maximize2, ShieldCheck, Compass, Eye } from "lucide-react";
import { isVideoUrl } from "@/lib/vendor-fleet-media";

interface VehicleVideoShowcaseProps {
  title: string;
  type: string;
  city: string;
  seats: number;
  pricePerDayINR: number;
  availabilityStatus?: string;
  imageUrls: string[];
  fallbackImage: string;
}

export type CameraAngle = "orbit" | "sweep" | "hero" | "auto";

export function VehicleVideoShowcase({
  title,
  type,
  city,
  seats,
  pricePerDayINR,
  availabilityStatus = "available",
  imageUrls,
  fallbackImage,
}: VehicleVideoShowcaseProps) {
  // Separate video URLs and static image URLs
  const videoUrls = imageUrls.filter((url) => isVideoUrl(url));
  const photoUrls = imageUrls.filter((url) => !isVideoUrl(url));
  
  // If no photo URLs, use fallback
  const displayPhotos = photoUrls.length > 0 ? photoUrls : [fallbackImage];
  const hasVideo = videoUrls.length > 0;

  // Active view tab: "showcase" (10s animation), "photos", "video"
  const [activeTab, setActiveTab] = useState<"showcase" | "photos" | "video">(
    hasVideo ? "video" : "showcase"
  );

  // Selected 3D Camera Angle Preset: "auto" (cycles all), "orbit", "sweep", "hero"
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>("auto");

  // 10-Second Showcase State
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100% over 10 seconds
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const showcaseContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Selected main photo for photos gallery tab
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // 10-Second Video Showcase Loop Timer (10,000 ms)
  useEffect(() => {
    if (activeTab !== "showcase" || !isPlaying) return;

    const interval = 50; // update every 50ms
    const step = (interval / 10000) * 100; // % per step

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          // Switch photo if multiple exist
          if (displayPhotos.length > 1) {
            setActivePhotoIndex((p) => (p + 1) % displayPhotos.length);
          }
          return 0; // loop back to 0
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeTab, isPlaying, displayPhotos.length]);

  // Audio synthesis effect for 10s video engine rumble when un-muted
  useEffect(() => {
    if (!isMuted && isPlaying && activeTab === "showcase") {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(55, ctx.currentTime); // Low engine hum 55Hz
          gain.gain.setValueAtTime(0.04, ctx.currentTime);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          oscillatorRef.current = osc;
        }
      } catch (e) {
        console.warn("Web Audio API error:", e);
      }
    } else {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {}
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
    }

    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {}
      }
    };
  }, [isMuted, isPlaying, activeTab]);

  const toggleFullscreen = () => {
    if (!showcaseContainerRef.current) return;
    if (!document.fullscreenElement) {
      showcaseContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedSeconds = ((progress / 100) * 10).toFixed(1);

  // Compute 3D Camera Angle Transform based on active angle and progress
  const getCameraTransform = () => {
    if (!isPlaying) return "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";

    const p = progress / 100; // 0 to 1

    // Determine effective mode when "auto" is selected (switch angle phase every 3.3s)
    let currentMode = cameraAngle;
    if (cameraAngle === "auto") {
      if (p < 0.33) currentMode = "orbit";
      else if (p < 0.66) currentMode = "sweep";
      else currentMode = "hero";
    }

    if (currentMode === "orbit") {
      // 3D Perspective Orbit: Smooth Y-axis rotation (-12deg to +12deg) and X tilt (4deg to -4deg)
      const rotY = -12 + p * 24;
      const rotX = 5 - p * 10;
      const scale = 1.06 + Math.sin(p * Math.PI) * 0.14;
      const transX = (p - 0.5) * 20;
      return `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale}) translateX(${transX}px)`;
    }

    if (currentMode === "sweep") {
      // Wide-to-Tight Angle Sweep: Diagonally swoops from wide left-angle to tight right-angle
      const rotY = 14 - p * 28;
      const rotX = -6 + p * 12;
      const scale = 1.03 + p * 0.22;
      const transX = -15 + p * 30;
      const transY = -8 + p * 16;
      return `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale}) translate(${transX}px, ${transY}px)`;
    }

    // Hero Low Angle Shot: Upward perspective tilt giving a powerful, wide stance
    const rotY = -8 + Math.sin(p * Math.PI * 2) * 10;
    const rotX = 10 - p * 12;
    const scale = 1.1 + p * 0.15;
    const transY = 10 - p * 20;
    return `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale}) translateY(${transY}px)`;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-neutral-950/80 p-4 shadow-2xl backdrop-blur-xl">
      {/* Navigation Tabs Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("showcase")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "showcase"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-900/40 ring-1 ring-white/20"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
            <span>10s Video Showcase</span>
            <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-amber-200">
              3D AI View
            </span>
          </button>

          {hasVideo && (
            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "video"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/40 ring-1 ring-white/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Film className="h-4 w-4 text-rose-300" />
              <span>HD Video</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "photos"
                ? "bg-white/20 text-white shadow-md ring-1 ring-white/20"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Photos ({displayPhotos.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Next Gear Verified 3D Media</span>
        </div>
      </div>

      {/* 3D CAMERA ANGLE SELECTION BAR (When in 10s Showcase Mode) */}
      {activeTab === "showcase" && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] p-2 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-white/90">3D Camera Angle:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setCameraAngle("auto")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                cameraAngle === "auto"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              🔄 Multi-Angle Loop
            </button>

            <button
              onClick={() => setCameraAngle("orbit")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                cameraAngle === "orbit"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              📐 3D Orbit View
            </button>

            <button
              onClick={() => setCameraAngle("sweep")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                cameraAngle === "sweep"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              🏎️ Angle Sweep
            </button>

            <button
              onClick={() => setCameraAngle("hero")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                cameraAngle === "hero"
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              🔍 Low Hero Angle
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: 10-SECOND AUTOMATED VIDEO SHOWCASE WITH 3D PERSPECTIVE ANGLES */}
      {activeTab === "showcase" && (
        <div
          ref={showcaseContainerRef}
          className="relative h-[250px] sm:h-[320px] md:h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black group shadow-2xl"
          style={{ perspective: "1200px" }}
        >
          {/* Animated 3D Vehicle Image Canvas */}
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
            <img
              src={displayPhotos[activePhotoIndex]}
              alt={`${title} 3D angle animation`}
              className="h-full w-full object-cover transition-transform ease-linear"
              style={{
                transform: getCameraTransform(),
                transformOrigin: "center center",
                transition: "transform 100ms linear",
                backfaceVisibility: "hidden",
                filter: isPlaying ? "brightness(1.04) contrast(1.05)" : "brightness(1)",
              }}
            />

            {/* Specular 3D Lens Flare Sweep & Gradient Vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />
            
            {/* Dynamic Metallic Light Beam Sweep */}
            {isPlaying && (
              <div
                className="pointer-events-none absolute inset-0 opacity-25 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                style={{
                  transform: `translateX(${(progress / 100) * 220 - 110}%) skewX(-30deg)`,
                  transition: "transform 100ms linear",
                }}
              />
            )}
          </div>

          {/* TOP HUD BAR */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
            {/* Live Rec & Active Angle Badge */}
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="text-white uppercase tracking-wider text-[11px]">
                10s 3D {cameraAngle.toUpperCase()} ANGLE
              </span>
            </div>

            {/* Price Badge */}
            <div className="rounded-full border border-amber-500/40 bg-black/80 px-3 py-1 text-xs font-bold text-amber-400 backdrop-blur-md shadow-lg">
              ₹{pricePerDayINR.toLocaleString("en-IN")} / day
            </div>
          </div>

          {/* CENTER OVERLAY ON PAUSE */}
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 transition hover:bg-black/20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-600/50 hover:scale-110 transition">
                <Play className="h-8 w-8 ml-1" />
              </div>
            </button>
          )}

          {/* BOTTOM HUD OVERLAY & CONTROLS */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
            {/* Vehicle Title HUD info */}
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  {type} · {city} · {seats} Seats
                </span>
                <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">
                  {title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-lg border border-white/20 bg-black/60 p-2 text-white hover:bg-white/20 transition"
                  title={isMuted ? "Enable Sound" : "Mute Sound"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-lg border border-white/20 bg-black/60 p-2 text-white hover:bg-white/20 transition"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-red-400" />}
                </button>

                <button
                  onClick={() => {
                    setProgress(0);
                    setIsPlaying(true);
                  }}
                  className="rounded-lg border border-white/20 bg-black/60 p-2 text-white hover:bg-white/20 transition"
                  title="Replay 3D Animation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="rounded-lg border border-white/20 bg-black/60 p-2 text-white hover:bg-white/20 transition"
                  title="Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 10-Second Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-white/70">
                <span>0:0{Math.floor(Number(formattedSeconds))}s</span>
                <span className="text-amber-400 font-bold tracking-wider">3D ANGLE CAMERA SHOWCASE</span>
                <span>0:10s</span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-500 transition-all ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NATIVE HD VIDEO PLAYER */}
      {activeTab === "video" && hasVideo && (
        <div className="relative h-[250px] sm:h-[320px] md:h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <video
            src={videoUrls[0]}
            controls
            autoPlay
            loop
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* TAB 3: PHOTO GALLERY */}
      {activeTab === "photos" && (
        <div className="space-y-3">
          <div className="relative h-[250px] sm:h-[320px] md:h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <img
              src={displayPhotos[selectedPhotoIndex]}
              alt={`${title} view ${selectedPhotoIndex + 1}`}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Photo Thumbnails */}
          {displayPhotos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {displayPhotos.map((url, idx) => (
                <button
                  key={`thumb-${idx}`}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                    selectedPhotoIndex === idx
                      ? "border-red-500 ring-2 ring-red-500/50 scale-105"
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="thumbnail" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
