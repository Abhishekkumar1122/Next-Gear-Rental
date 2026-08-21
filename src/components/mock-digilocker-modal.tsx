"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface MockDigiLockerModalProps {
  onSuccess: (data: {
    fullName: string;
    drivingLicenseNo: string;
    governmentIdNo: string;
    drivingLicenseFileName: string;
    governmentIdFileName: string;
  }) => void;
  onDismiss: () => void;
  defaultPhone?: string;
  defaultName?: string;
}

export function MockDigiLockerModal({ onSuccess, onDismiss, defaultPhone = "", defaultName = "" }: MockDigiLockerModalProps) {
  const [step, setStep] = useState<"credentials" | "otp" | "consent" | "success">("credentials");
  const [identifier, setIdentifier] = useState(defaultPhone || "9876543210");
  const [pin, setPin] = useState("123456");
  const [otp, setOtp] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleNext = () => {
    setError("");
    if (!identifier.trim()) {
      setError("Please enter your Mobile or Aadhaar number.");
      return;
    }
    if (pin.length < 6) {
      setError("Please enter your 6-digit Security PIN.");
      return;
    }
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    setError("");
    if (otp.length < 6) {
      setError("Please enter the 6-digit OTP sent to your mobile.");
      return;
    }
    setStep("consent");
  };

  const handleGrantConsent = () => {
    setProcessing(true);
    setError("");
    
    // Simulate API fetch from DigiLocker
    setTimeout(() => {
      setProcessing(false);
      setStep("success");
      
      setTimeout(() => {
        onSuccess({
          fullName: defaultName || "Riya Verma",
          drivingLicenseNo: `DL-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
          governmentIdNo: `Aadhaar: ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          drivingLicenseFileName: "digilocker-driving-license-signed.pdf",
          governmentIdFileName: "digilocker-aadhaar-signed.pdf",
        });
      }, 1200);
    }, 1500);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-[#0B1528] border border-white/10 text-white flex flex-col max-h-[90vh]">
        
        {/* Header (DigiLocker Brand Identity) */}
        <div className="bg-[#0b2240] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Tricolor bar representation */}
            <div className="flex flex-col w-1.5 h-8 justify-between">
              <div className="h-2.5 w-full bg-[#FF9933] rounded-t" />
              <div className="h-2.5 w-full bg-white" />
              <div className="h-2.5 w-full bg-[#138808] rounded-b" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider text-white">DigiLocker</span>
                <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1 py-0.5 text-[8px] font-bold text-sky-400 uppercase tracking-widest">Verified</span>
              </div>
              <p className="text-[10px] text-white/50">Government of India</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onDismiss}
            className="text-white/40 hover:text-white transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-sky-500/5 border-b border-sky-500/10 px-6 py-2 flex items-center gap-2 text-[10px] text-sky-300">
          <span>🔒</span> Secure document verification via National Portal
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {step === "credentials" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-white">Verify with Aadhaar / Mobile</h3>
                <p className="text-xs text-white/50 mt-1">Enter your credentials registered with DigiLocker to auto-fill KYC</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wide">Aadhaar / Mobile Number</label>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter 12-digit Aadhaar or Mobile"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wide">6-Digit Security PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter security PIN"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition duration-300"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/20 active:scale-[0.99] transition duration-300 cursor-pointer"
              >
                Send OTP
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-white">Enter OTP</h3>
                <p className="text-xs text-white/50 mt-1">We have sent a 6-digit OTP to your phone registered with Aadhaar ending in XXXX</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wide">Verification OTP</label>
                  <input
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="mt-1 w-full text-center tracking-[0.7em] font-mono rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-lg text-white placeholder-white/20 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition duration-300"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 py-3 text-xs font-bold text-white/70 hover:text-white transition duration-300 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/20 active:scale-[0.99] transition duration-300 cursor-pointer"
                >
                  Verify OTP
                </button>
              </div>
            </div>
          )}

          {step === "consent" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-white">Aadhaar & DL Access Consent</h3>
                <p className="text-xs text-white/50 mt-1">Next Gear Rentals requests permission to retrieve the following digitally signed documents:</p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-3 text-xs text-white/80">
                  <span className="text-base">✓</span>
                  <div>
                    <p className="font-bold">Aadhaar Card (Identity & Address)</p>
                    <p className="text-[10px] text-white/40">Issued by UIDAI</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/80">
                  <span className="text-base">✓</span>
                  <div>
                    <p className="font-bold">Driving License (Eligibility Check)</p>
                    <p className="text-[10px] text-white/40">Issued by Ministry of Road Transport & Highways</p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-white/40 leading-relaxed text-center">
                By clicking "Grant Access", you authorize DigiLocker to share these documents securely. The connection is encrypted and compliant with CPA 2019 & IT Act 2000.
              </p>

              <button
                type="button"
                disabled={processing}
                onClick={handleGrantConsent}
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/20 active:scale-[0.99] transition duration-300 disabled:opacity-50 disabled:cursor-wait cursor-pointer flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching documents...
                  </>
                ) : (
                  "Grant Access & Retrieve"
                )}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 p-4 text-emerald-400 border border-emerald-500/20 animate-[pulse_2s_infinite]">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wide">Verification Success</h3>
                <p className="text-xs text-white/60 mt-1">Driving License & Aadhaar fetched successfully</p>
              </div>
              <p className="text-[10px] text-white/40 italic">Auto-filling checkout fields... Please wait</p>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
