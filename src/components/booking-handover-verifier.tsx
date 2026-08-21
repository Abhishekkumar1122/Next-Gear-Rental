"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { audioSynth } from "@/lib/audio-effects";
import { Zap, Search, Camera, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    Html5Qrcode?: any;
  }
}

export function BookingHandoverVerifier() {
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const scannerRef = useRef<any>(null);
  const router = useRouter();

  // Camera & Flash States
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Dynamically load html5-qrcode script when scanner is activated
  useEffect(() => {
    if (isScanning && !scriptLoaded) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
      };
      document.body.appendChild(script);
      return () => {
        // Clean up script if unmounted during load
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isScanning, scriptLoaded]);

  // Initialize and start scanner once script is loaded and scanning is active
  useEffect(() => {
    let active = true;
    if (isScanning && scriptLoaded && typeof window !== "undefined" && window.Html5Qrcode) {
      const startScanner = async () => {
        try {
          setError("");
          setIsTorchOn(false);
          setTorchSupported(false);

          // Wait a brief moment to let any previous teardown release camera hardware
          await new Promise(resolve => setTimeout(resolve, 350));
          if (!active) return;

          const html5QrCode = new window.Html5Qrcode("qr-reader");
          scannerRef.current = html5QrCode;

          // Start environment camera first (handles permission prompt correctly)
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            async (decodedText: string) => {
              audioSynth.playSuccess();
              await stopScanner();

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
              router.push(targetUrl);
            },
            () => {}
          );

          if (!active) {
            void html5QrCode.stop().catch(() => {});
            return;
          }

          // Enumerate devices list now that permission is active
          try {
            const devices = await window.Html5Qrcode.getCameras();
            if (active) {
              setCameras(devices);
              const backCam = devices.find(d => 
                d.label.toLowerCase().includes("back") || 
                d.label.toLowerCase().includes("environment")
              );
              const initialIndex = backCam ? devices.indexOf(backCam) : 0;
              setCurrentCameraIndex(initialIndex);
            }
          } catch (e) {
            console.warn("Could not retrieve camera list after startup:", e);
          }

          // Check if torch/flashlight is supported on active track
          const hasTorch = typeof html5QrCode.getRunningTrackCapabilities === "function" &&
                           !!html5QrCode.getRunningTrackCapabilities()?.torch;
          if (active) {
            setTorchSupported(hasTorch);
          }
        } catch (err) {
          console.error("Scanner start error:", err);
          if (active) {
            setError("Could not access camera. Please check permissions.");
            setIsScanning(false);
          }
        }
      };

      void startScanner();
    }

    return () => {
      active = false;
      // Clean up camera stream on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        void scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning, scriptLoaded]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop().catch(() => {});
        }
      } catch (e) {
        // Suppress cleanup error on DOM unmount
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setIsTorchOn(false);
    setTorchSupported(false);
  };

  const toggleTorch = async () => {
    if (scannerRef.current && typeof scannerRef.current.applyVideoConstraints === "function") {
      const capabilities = typeof scannerRef.current.getRunningTrackCapabilities === "function"
        ? scannerRef.current.getRunningTrackCapabilities()
        : null;
      if (capabilities && "torch" in capabilities) {
        const newTorchState = !isTorchOn;
        try {
          await scannerRef.current.applyVideoConstraints({
            advanced: [{ torch: newTorchState } as any]
          });
          setIsTorchOn(newTorchState);
        } catch (err) {
          console.error("Failed to toggle torch:", err);
        }
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setIsTorchOn(false);
      setTorchSupported(false);

      await scannerRef.current.start(
        cameras[nextIndex].id,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText: string) => {
          audioSynth.playSuccess();
          void stopScanner();
          if (decodedText.includes("/dashboard/scan-booking")) {
            try {
              const url = new URL(decodedText);
              url.searchParams.set("source", "qr");
              router.push(url.pathname + url.search);
            } catch {
              router.push(`${decodedText}&source=qr`);
            }
          } else {
            router.push(`/dashboard/scan-booking?id=${encodeURIComponent(decodedText)}&source=qr`);
          }
        },
        () => {}
      );

      const hasTorch = typeof scannerRef.current.getRunningTrackCapabilities === "function" &&
                       !!scannerRef.current.getRunningTrackCapabilities()?.torch;
      setTorchSupported(hasTorch);
    } catch (err) {
      console.error("Failed to switch camera:", err);
      setError("Failed to switch to the next camera.");
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
    void stopScanner();
    router.push(`/dashboard/scan-booking?id=${encodeURIComponent(cleanId)}&source=qr`);
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
            <div id="qr-reader" className="w-full h-56 bg-slate-900 rounded-xl overflow-hidden" />
            
            {/* Up & Down Animated Cyber Laser Scanline */}
            {!error && scriptLoaded && (
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

            {!scriptLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-xs text-white/70 z-30">
                Initializing camera modules...
              </div>
            )}
            {scriptLoaded && (
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
                {cameras.length > 1 && (
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
            )}
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
            onClick={() => setIsScanning(true)}
            className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white py-2.5 text-xs font-bold transition hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Scan QR via Camera / Webcam</span>
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 font-semibold mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
