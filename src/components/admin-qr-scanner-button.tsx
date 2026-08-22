"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { audioSynth } from "@/lib/audio-effects";

export function AdminQRScannerButton() {
  const router = useRouter();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [cameras, setCameras] = useState<any[]>([]);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
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
        setCameras(videoDevices);
      } catch (e) {
        console.warn("Failed to list admin cameras:", e);
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

  const startScanningFlow = async () => {
    setScannerError("");
    setIsTorchOn(false);
    setTorchSupported(false);

    try {
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
        console.warn("Admin ideal constraints failed, trying simple constraints:", firstErr);
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: activeFacingMode },
            audio: false
          });
        } catch (secondErr) {
          console.warn("Admin facingMode constraints failed, falling back to raw video:true:", secondErr);
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      });

      streamRef.current = stream;
      setIsScanModalOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          videoRef.current.play().catch((playErr) => {
            console.error("Admin video play failed:", playErr);
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
              
              if (decodedText.includes("scan-booking") || decodedText.startsWith("bk-")) {
                let bookingId = decodedText;
                if (decodedText.includes("?id=")) {
                  const url = new URL(decodedText);
                  bookingId = url.searchParams.get("id") || decodedText;
                }
                router.push(`/dashboard/scan-booking?id=${encodeURIComponent(bookingId)}&source=qr`);
              } else if (decodedText.startsWith("vnd-") || decodedText.includes("vendor")) {
                router.push(`/dashboard/admin?section=approvals&status=all`);
              } else if (decodedText.startsWith("usr-") || decodedText.includes("user")) {
                router.push(`/dashboard/admin?section=approvals&status=all`);
              } else {
                router.push(`/dashboard/scan-booking?id=${encodeURIComponent(decodedText)}&source=qr`);
              }
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
      console.error("Admin scanner failed to start:", err);
      const errStr = String(err);
      const isInteractionError = errStr.includes("interact") || errStr.includes("interaction");
      const isPermissionDenied = (err?.name === "NotAllowedError" || errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) && !isInteractionError;

      if (isInteractionError) {
        setScannerError("INTERACTION_REQUIRED");
      } else if (isPermissionDenied) {
        setScannerError("PERMISSION_DENIED");
      } else {
        setScannerError("Could not start camera scanner. Verify permissions.");
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
    setIsScanModalOpen(false);
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

  return (
    <>
      <button
        onClick={startScanningFlow}
        type="button"
        className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-[10px] uppercase font-black tracking-wider text-white transition duration-300 cursor-pointer flex items-center gap-1.5"
      >
        📷 Scan QR
      </button>

      {isScanModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/40">Camera Scan</p>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mt-0.5">Admin QR Verifier</h3>
              </div>
              <button
                onClick={stopScanner}
                type="button"
                className="rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold p-2 text-xs transition active:scale-95 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Live Camera View Container */}
            <div className="relative aspect-square w-full rounded-2xl border border-white/5 bg-black overflow-hidden flex items-center justify-center">
              {!scannerError && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover rounded-2xl"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {scannerError === "INTERACTION_REQUIRED" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2.5">
                  <span className="text-xl">👆</span>
                  <p className="text-xs font-bold text-amber-400">Interaction Required</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed px-4">
                    Please tap anywhere on the screen first to activate the camera feed.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerError("");
                      setIsScanModalOpen(false);
                      setTimeout(startScanningFlow, 200);
                    }}
                    className="w-full py-2 px-3 text-[10px] font-bold rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white transition cursor-pointer"
                  >
                    Activate Camera Feed
                  </button>
                </div>
              )}
              
              {scannerError === "PERMISSION_DENIED" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2.5">
                  <span className="text-2xl">📵</span>
                  <p className="text-xs font-bold text-red-400">Camera Access Blocked</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Browser settings me camera access block ho rakha hai.
                  </p>
                  <div className="text-left w-full bg-white/5 rounded-lg p-2.5 space-y-1">
                    <p className="text-[8px] text-white">🔒 <strong>Chrome:</strong> URL bar ke pass lock 🔒 icon tap karein → Camera → Allow</p>
                    <p className="text-[8px] text-white">🍎 <strong>Safari/iOS:</strong> Settings → Safari → Camera → Allow</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerError("");
                      setIsScanModalOpen(false);
                      setTimeout(startScanningFlow, 200);
                    }}
                    className="w-full py-2 px-3 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                  >
                    Allow karne ke baad Retry karein
                  </button>
                </div>
              )}

              {scannerError && scannerError !== "PERMISSION_DENIED" && scannerError !== "INTERACTION_REQUIRED" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-2.5">
                  <span className="text-xl">⚠️</span>
                  <p className="text-[10px] text-amber-300 font-medium leading-relaxed">{scannerError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerError("");
                      setIsScanModalOpen(false);
                      setTimeout(startScanningFlow, 200);
                    }}
                    className="w-full py-2 px-3 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions (Torch & Camera Flip) */}
            <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider justify-between pt-2">
              {torchSupported ? (
                <button
                  onClick={toggleTorch}
                  type="button"
                  className={`rounded-xl border px-4 py-2 cursor-pointer transition ${
                    isTorchOn
                      ? "bg-amber-950 border-amber-900/30 text-amber-400"
                      : "border-white/5 bg-white/5 text-white/70"
                  }`}
                >
                  ⚡ {isTorchOn ? "Flash On" : "Flash Off"}
                </button>
              ) : (
                <span className="text-white/20 px-2 py-2">Flash Unsupported</span>
              )}

              {hasMultipleCameras && (
                <button
                  onClick={switchCamera}
                  type="button"
                  className="rounded-xl border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 px-4 py-2 cursor-pointer transition"
                >
                  🔄 Switch Camera
                </button>
              )}
            </div>

            <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 text-[9px] text-white/40 leading-relaxed text-center">
              Position a customer's Booking QR or Vendor Details QR code inside the camera focus box.
            </div>

          </div>
        </div>
      )}
    </>
  );
}
