"use client";

import { Download, Smartphone } from "lucide-react";

type VendorMobileQrCardProps = {
  mobileDashboardUrl: string;
};

export function VendorMobileQrCard({ mobileDashboardUrl }: VendorMobileQrCardProps) {
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
    mobileDashboardUrl
  )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=2&size=400&ecLevel=Q`;

  const handleDownload = async () => {
    try {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrUrl;

      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw QR Code
      ctx.drawImage(qrImg, 0, 0, 400, 400);

      // Download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "nextgear-vendor-quick-manage-qr.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download QR Code:", error);
      // Fallback: open in new tab
      window.open(qrUrl, "_blank");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-[var(--brand-red)]/[0.03] p-6 shadow-2xl hover:border-[var(--brand-red)]/30 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] transition-all duration-500 flex flex-col sm:flex-row items-center gap-6 h-full text-white">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="bg-white p-3 rounded-2xl border border-white/10 shadow-lg">
          <img
            src={`https://quickchart.io/qr?text=${encodeURIComponent(
              mobileDashboardUrl
            )}&dark=000000&dotStyle=rounded&finderStyle=rounded&finderDotStyle=rounded&margin=1&size=100&ecLevel=Q`}
            alt="Vendor Dashboard Mobile QR"
            width={100}
            height={100}
            className="mx-auto"
          />
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 py-1.5 rounded-full transition active:scale-95 cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>Download QR</span>
        </button>
      </div>
      <div className="text-left space-y-2">
        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-[var(--brand-red)]" />
          <span>Scan to Manage on Mobile</span>
        </h3>
        <p className="text-xs text-white/70 leading-relaxed">
          Scan this QR code with your phone to open your Vendor Fleet Panel. Easily toggle any bike online/offline with a single tap or publish new vehicles!
        </p>
        <div className="pt-1">
          <a
            href="/dashboard/mobile-hub"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-600 border border-red-400/40 px-4 py-2 rounded-xl shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <span>📱 Launch Mobile Fleet Control</span>
          </a>
        </div>
      </div>
    </section>
  );
}
