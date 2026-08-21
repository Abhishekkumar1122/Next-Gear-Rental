"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type AnnouncementData = {
  active: boolean;
  text: string;
  url: string;
  bgColor: string;
  textColor: string;
};

export function AnnouncementBanner() {
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.announcementActive === "true") {
          setData({
            active: true,
            text: d.settings.announcementText || "",
            url: d.settings.announcementUrl || "",
            bgColor: d.settings.announcementBgColor || "#dc2626",
            textColor: d.settings.announcementTextColor || "#ffffff",
          });
        }
      })
      .catch(() => {});
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => setDismissed(true), 350);
  }

  if (!data?.active || dismissed) return null;

  const messageContent = (
    <span
      className="whitespace-nowrap text-[11px] sm:text-xs font-bold tracking-wider"
      style={{ color: data.textColor }}
    >
      {data.text}
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-100%); }
        }
        @keyframes pulseGlowBg {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes sweep {
          0%   { left: -80%; }
          100% { left: 140%; }
        }
        .banner-bounce { animation: bannerIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .banner-exit   { animation: bannerOut 0.35s ease-in forwards; }
      `}</style>

      <div className={`relative z-[60] w-full overflow-hidden ${visible ? "banner-bounce" : "banner-exit"}`}>
        <div
          className="relative flex items-center justify-between w-full overflow-hidden"
          style={{
            background: `linear-gradient(90deg, rgba(0,0,0,0.2) 0%, ${data.bgColor} 50%, rgba(0,0,0,0.2) 100%), ${data.bgColor}`,
            backgroundSize: "300% 100%",
            animation: "pulseGlowBg 5s ease infinite",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Sweeping shimmer streak */}
          <div
            className="absolute top-0 bottom-0 w-28 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              animation: "sweep 4s linear infinite",
            }}
          />

          {/* Left badge */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 z-10">
            <span className="text-sm" style={{ animation: "bounce 1.5s infinite" }}>📢</span>
            <span
              className="hidden sm:block text-[9px] font-black uppercase tracking-[0.18em] rounded-md px-1.5 py-0.5"
              style={{
                background: "rgba(0,0,0,0.2)",
                color: data.textColor,
                border: `1px solid ${data.textColor}40`
              }}
            >
              Live
            </span>
          </div>

          {/* Scrolling marquee */}
          <div className="flex-1 overflow-hidden relative z-10 py-[7px]">
            <div
              className="flex gap-14 w-max"
              style={{ animation: "marquee 20s linear infinite" }}
            >
              {[...Array(8)].map((_, i) => (
                <span key={i} className="flex items-center gap-3 flex-shrink-0">
                  {data.url ? (
                    <Link href={data.url} className="hover:underline underline-offset-2 decoration-red-300/50">
                      {messageContent}
                    </Link>
                  ) : (
                    messageContent
                  )}
                  <span className="text-red-300/40 text-[10px] font-bold">✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* Dismiss button */}
          <div className="flex-shrink-0 pr-3 z-10">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer"
              style={{ color: data.textColor + "90" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
