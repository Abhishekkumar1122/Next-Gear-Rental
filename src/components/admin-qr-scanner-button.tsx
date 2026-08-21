"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { audioSynth } from "@/lib/audio-effects";

declare global {
  interface Window {
    Html5Qrcode?: any;
  }
}

export function AdminQRScannerButton() {
  const router = useRouter();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const scannerRef = useRef<any>(null);



  // Handle scanner initial setup
  useEffect(() => {
    let active = true;
    if (isScanModalOpen) {
      const startScanner = async () => {
        try {
          setScannerError("");
          setIsTorchOn(false);
          setTorchSupported(false);

          await new Promise((resolve) => setTimeout(resolve, 350));
          if (!active) return;

          const html5QrCode = new Html5Qrcode("admin-qr-reader");
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          };

          const handleScanSuccess = (decodedText: string) => {
            audioSynth.playSuccess();
            void stopScanner();

            // Redirection logic based on scanned code content
            if (decodedText.includes("scan-booking") || decodedText.startsWith("bk-")) {
              let bookingId = decodedText;
              if (decodedText.includes("?id=")) {
                const url = new URL(decodedText);
                bookingId = url.searchParams.get("id") || decodedText;
              }
              router.push(`/dashboard/scan-booking?id=${encodeURIComponent(bookingId)}&source=qr`);
            } else if (decodedText.startsWith("vnd-") || decodedText.includes("vendor")) {
              let vendorId = decodedText;
              if (decodedText.includes("id=")) {
                const url = new URL(decodedText);
                vendorId = url.searchParams.get("id") || decodedText;
              }
              router.push(`/dashboard/admin?section=approvals&status=all`);
            } else if (decodedText.startsWith("usr-") || decodedText.includes("user")) {
              let userId = decodedText;
              if (decodedText.includes("id=")) {
                const url = new URL(decodedText);
                userId = url.searchParams.get("id") || decodedText;
              }
              router.push(`/dashboard/admin?section=approvals&status=all`);
            } else {
              // Default fallback
              router.push(`/dashboard/scan-booking?id=${encodeURIComponent(decodedText)}&source=qr`);
            }
          };

          // Start environment camera first
          let started = false;
          try {
            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              handleScanSuccess,
              () => {}
            );
            started = true;
          } catch (envErr) {
            console.warn("Environment camera failed in admin, trying user camera:", envErr);
          }

          if (!started && active) {
            try {
              await html5QrCode.start(
                { facingMode: "user" },
                config,
                handleScanSuccess,
                () => {}
              );
              started = true;
            } catch (userErr) {
              console.error("Both environment and user cameras failed in admin:", userErr);
              throw userErr;
            }
          }

          if (!active) {
            void html5QrCode.stop().catch(console.error);
            return;
          }

          // Query available video cameras
          try {
            const devices = await Html5Qrcode.getCameras();
            if (active) {
              setCameras(devices);
              const backCam = devices.find((d: any) =>
                d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment")
              );
              if (backCam) {
                const idx = devices.indexOf(backCam);
                setCurrentCameraIndex(idx);
              }
            }
          } catch (e) {
            console.warn("Could not query cameras list:", e);
          }

          // Check if torch/flash is supported
          const hasTorch = typeof html5QrCode.getRunningTrackCapabilities === "function" &&
            !!(html5QrCode.getRunningTrackCapabilities() as any)?.torch;
          if (active) {
            setTorchSupported(hasTorch);
          }
        } catch (err) {
          console.error("Scanner failed to start:", err);
          if (active) {
            setScannerError("Could not start camera scanner. Verify permissions.");
          }
        }
      };

      void startScanner();
    }

    return () => {
      active = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        void scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanModalOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanModalOpen(false);
  };

  const toggleTorch = async () => {
    if (scannerRef.current && typeof scannerRef.current.applyVideoConstraints === "function") {
      const nextTorch = !isTorchOn;
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch (e) {
        console.warn("Failed to toggle torch:", e);
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.start(
        cameras[nextIdx].id,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText: string) => {
          audioSynth.playSuccess();
          void stopScanner();
          router.push(`/dashboard/scan-booking?id=${encodeURIComponent(decodedText)}&source=qr`);
        },
        () => {}
      );
    } catch (e) {
      console.error("Failed to switch camera:", e);
      setScannerError("Failed to switch camera device.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsScanModalOpen(true)}
        type="button"
        className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-[10px] uppercase font-black tracking-wider text-white transition duration-300 cursor-pointer flex items-center gap-1.5"
      >
        📷 Scan QR
      </button>

      {/* QR Code Scanner Overlay Modal */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/40">Camera Scan</p>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mt-0.5">Admin QR Verifier</h3>
              </div>
              <button
                onClick={() => void stopScanner()}
                type="button"
                className="rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold p-2 text-xs transition active:scale-95 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Live Camera View Container */}
            <div className="relative aspect-square w-full rounded-2xl border border-white/5 bg-black overflow-hidden flex items-center justify-center">
              <div id="admin-qr-reader" className="w-full h-full" />
              {scannerError && (
                <p className="absolute inset-x-4 text-center text-xs font-bold text-red-400 bg-black/80 py-3 rounded-xl">
                  {scannerError}
                </p>
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

              {cameras.length > 1 && (
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
