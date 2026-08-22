"use client";

import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";

import { audioSynth } from "@/lib/audio-effects";
import { Zap, Search, Camera, RefreshCw } from "lucide-react";

export function BookingHandoverVerifier() {
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  // Custom Camera States
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check if multiple cameras are available
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        console.warn("Failed to list cameras:", e);
      }
    };
    void checkCameras();
  }, []);

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Set default facingMode based on device type on mount or when scanning starts
  useEffect(() => {
    if (isScanning) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setFacingMode(isMobile ? "environment" : "user");
    }
  }, [isScanning]);

  const startScanningFlow = async () => {
    setError("");
    setIsTorchOn(false);
    setTorchSupported(false);

    try {
      // 1. Request camera stream directly inside the user gesture handler (synchronous tick)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const activeFacingMode = isMobile ? "environment" : "user";
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: activeFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }).catch(async (firstErr) => {
        console.warn("Ideal constraints failed, trying simple constraints:", firstErr);
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: activeFacingMode },
            audio: false
          });
        } catch (secondErr) {
          console.warn("FacingMode constraints failed, falling back to raw video:true (diag page style):", secondErr);
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      });

      streamRef.current = stream;
      
      // 2. Set scanning UI active
      setIsScanning(true);

      // 3. Bind stream to video element once it renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          videoRef.current.play().catch((playErr) => {
            console.error("Video play failed:", playErr);
          });
        }

        // Start scanning loop using jsQR
        const scanFrame = () => {
          if (!streamRef.current || !videoRef.current || !canvasRef.current) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              audioSynth.playSuccess();
              stopScanner();
              const decodedText = code.data;
              let targetUrl = `/dashboard/scan-booking?id=${encodeURIComponent(decodedText)}&source=qr`;

              if (decodedText.includes("mobile-hub") || decodedText.includes("/dashboard/vendor")) {
                targetUrl = "/dashboard/mobile-hub";
              } else if (decodedText.includes("/dashboard/scan-booking")) {
                try {
                  const url = new URL(decodedText);
                  url.searchParams.set("source", "qr");
                  targetUrl = url.pathname + url.search;
                } catch {
                  targetUrl = decodedText.includes("?") ? `${decodedText}&source=qr` : `${decodedText}?source=qr`;
                }
              }
              window.location.href = targetUrl;
              return;
            }
          }
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        };

        animationFrameRef.current = requestAnimationFrame(scanFrame);

        // Check if torch/flashlight is supported
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const capabilities = videoTrack.getCapabilities() as any;
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
            }
          } catch (capErr) {
            console.warn("Could not read capabilities:", capErr);
          }
        }
      }, 150);

    } catch (err: any) {
      console.error("Camera start error:", err);
      const errStr = String(err);
      const isInteractionError = errStr.includes("interact") || errStr.includes("interaction");
      const isPermissionDenied = (err?.name === "NotAllowedError" || errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) && !isInteractionError;
      
      if (isInteractionError) {
        setError("INTERACTION_REQUIRED");
      } else if (isPermissionDenied) {
        setError("PERMISSION_DENIED");
      } else {
        setError("Could not access camera. Please check permissions.");
      }
    }
  };

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setIsTorchOn(false);
    setTorchSupported(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const newTorchState = !isTorchOn;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newTorchState } as any]
        });
        setIsTorchOn(newTorchState);
      } catch (err) {
        console.error("Failed to toggle torch:", err);
      }
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = bookingId.trim();
    if (!cleanId) {
      setError("Please enter a valid Booking ID.");
      return;
    }
    setError("");
    audioSynth.playSuccess();
    stopScanner();
    window.location.href = `/dashboard/scan-booking?id=${encodeURIComponent(cleanId)}&source=qr`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] p-6 shadow-2xl hover:border-[var(--brand-red)]/30 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] transition-all duration-500 flex flex-col justify-between min-h-[300px] text-white">
      <div className="space-y-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--brand-red)] shrink-0" />
          <span>Booking Handover Center</span>
        </h3>
        <p className="text-xs text-white/70 leading-relaxed">
          Verify booking QR codes in real-time. Use your webcam to scan a customer's QR code, or manually enter their Booking ID.
        </p>
      </div>

      {isScanning ? (
        <div className="mt-4 space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black p-1">
            <div className="w-full h-56 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center">
              
              {/* Direct HTML5 Video Feed */}
              {!error && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover rounded-xl"
                />
              )}

              {/* Hidden canvas for image analysis */}
              <canvas ref={canvasRef} className="hidden" />

              {error === "INTERACTION_REQUIRED" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2.5">
                  <span className="text-xl">👆</span>
                  <p className="text-[11px] font-bold text-amber-400">Interaction Required</p>
                  <p className="text-[9px] text-slate-300 leading-relaxed px-2">
                    Please tap anywhere inside this box to activate the camera feed.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setError("");
                      setIsScanning(false);
                      setTimeout(startScanningFlow, 200);
                    }}
                    className="w-full py-1.5 px-3 text-[10px] font-bold rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white transition cursor-pointer"
                  >
                    Activate Camera Feed
                  </button>
                </div>
              )}

              {error === "PERMISSION_DENIED" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2">
                  <span className="text-xl">📵</span>
                  <p className="text-[11px] font-bold text-red-400">Camera Access Blocked</p>
                  <p className="text-[9px] text-slate-300 leading-relaxed">
                    Browser settings me camera access block ho rakha hai.
                  </p>
                  <div className="text-left w-full bg-white/5 rounded-lg p-2 space-y-1">
                    <p className="text-[8px] text-white">🔒 <strong>Chrome:</strong> URL bar ke pass lock 🔒 icon tap karein → Camera → Allow</p>
                    <p className="text-[8px] text-white">🍎 <strong>Safari/iOS:</strong> Settings → Safari → Camera → Allow</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setError("");
                      setIsScanning(false);
                      setTimeout(startScanningFlow, 200);
                    }}
                    className="w-full py-1.5 px-3 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                  >
                    Allow karne ke baad Retry karein
                  </button>
                </div>
              )}

              {error && error !== "PERMISSION_DENIED" && error !== "INTERACTION_REQUIRED" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2">
                  <span className="text-xl">⚠️</span>
                  <p className="text-[10px] text-amber-300 font-medium leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setError("");
                      setIsScanning(false);
                      setTimeout(startScanningFlow, 200);
                    }}
                    className="w-full py-1.5 px-3 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* Up & Down Animated Cyber Laser Scanline */}
            {!error && (
              <>
                <div className="pointer-events-none absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444,_0_0_25px_#ef4444] z-20 animate-scanline" />
                
                {/* Corner Target Reticles */}
                <div className="pointer-events-none absolute inset-4 border border-dashed border-red-500/20 rounded-xl z-10">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-sm" />
                </div>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-30">
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full border border-white/20 text-white transition active:scale-95 cursor-pointer backdrop-blur-md ${
                    isTorchOn ? "bg-[var(--brand-red)]/85" : "bg-black/60 hover:bg-black/80"
                  }`}
                  title="Toggle Flashlight"
                >
                  <Zap className="w-4 h-4" fill={isTorchOn ? "currentColor" : "none"} />
                </button>
              )}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition active:scale-95 cursor-pointer"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={stopScanner}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:brightness-110 text-white py-2.5 text-xs font-semibold transition cursor-pointer shadow-lg"
          >
            Cancel Scanning
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Manual Form */}
          <form onSubmit={handleVerify} className="space-y-2.5">
            <input
              type="text"
              value={bookingId}
              onChange={(e) => {
                setBookingId(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter Booking ID (e.g. cmqzy...)"
              className="w-full rounded-xl border border-white/15 bg-[var(--brand-ink)] px-4 py-2.5 text-xs text-white placeholder-white/35 transition focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] hover:brightness-110 text-white py-2.5 text-xs font-bold transition hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(225,29,72,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Verify Booking ID</span>
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] text-white/35 font-bold uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Camera Trigger */}
          <button
            onClick={startScanningFlow}
            className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white py-2.5 text-xs font-bold transition hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Scan QR via Camera / Webcam</span>
          </button>
        </div>
      )}

      {error && error !== "PERMISSION_DENIED" && error !== "INTERACTION_REQUIRED" && (
        <p className="text-xs text-red-400 font-semibold mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
