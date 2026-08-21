"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PayUInAppModalProps {
  actionUrl: string;
  payuParams: Record<string, string>;
  bookingId: string;
  amount: number;
  onClose: () => void;
}

export function PayUInAppModal({
  actionUrl,
  payuParams,
  bookingId,
  amount,
  onClose,
}: PayUInAppModalProps) {
  const [mounted, setMounted] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !formRef.current) return;

    // Automatically submit form into the targeted iframe when component mounts
    const timer = setTimeout(() => {
      if (formRef.current) {
        formRef.current.submit();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.25s_ease_forwards]">
      {/* Container Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-red-500/30 bg-[#0d0d0d] shadow-[0_0_50px_rgba(225,6,0,0.25)] flex flex-col overflow-hidden text-white min-h-[580px] max-h-[92vh]">
        
        {/* PayU Official Live Header */}
        <div className="bg-gradient-to-r from-red-950 via-black to-red-950 px-5 py-4 border-b border-red-500/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-red-600/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wide">PayU Official Gateway</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  IN-WEBSITE
                </span>
              </div>
              <p className="text-[11px] text-white/60 font-mono mt-0.5">Booking #{bookingId}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-black text-emerald-400">₹{amount.toLocaleString("en-IN")}</p>
            <p className="text-[9px] text-white/50 font-mono uppercase tracking-wider">SSL Encrypted 256-bit</p>
          </div>
        </div>

        {/* Hidden Form targeting iframe */}
        <form
          ref={formRef}
          method="POST"
          action={actionUrl}
          target="payu_gateway_iframe"
          className="hidden"
        >
          {Object.entries(payuParams).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={String(v)} />
          ))}
        </form>

        {/* Loading Spinner overlay until PayU iframe renders */}
        {iframeLoading && (
          <div className="absolute inset-0 top-[70px] z-10 flex flex-col items-center justify-center bg-[#0d0d0d]/90 backdrop-blur-sm gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-8 w-8 bg-red-600 shadow-lg shadow-red-600/50" />
            </div>
            <p className="text-xs font-bold text-white/80">Loading PayU Secure Gateway...</p>
            <p className="text-[10px] text-white/40 font-mono">UPI · Cards · NetBanking · Wallets</p>
          </div>
        )}

        {/* Embedded PayU Iframe */}
        <div className="flex-1 w-full bg-white relative overflow-hidden">
          <iframe
            name="payu_gateway_iframe"
            title="PayU Live Gateway"
            onLoad={() => setIframeLoading(false)}
            className="w-full h-full min-h-[500px] border-none"
          />
        </div>

        {/* Footer controls */}
        <div className="bg-black/90 px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span>🔒</span>
            <span>PayU Official Payment Gateway</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white transition active:scale-95 cursor-pointer"
          >
            ✕ Close / Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
