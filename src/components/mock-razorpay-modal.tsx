"use client";

import { useState } from "react";

type PaymentMethod = "card" | "upi" | "netbanking" | "wallet";

interface MockRazorpayModalProps {
  orderId: string;
  amount: number; // in INR
  bookingId: string;
  onSuccess: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
}

const TEST_CARDS = [
  { label: "Visa (Success)", number: "4111 1111 1111 1111", expiry: "12/28", cvv: "123" },
  { label: "Mastercard (Success)", number: "5267 3181 8797 5449", expiry: "12/28", cvv: "456" },
  { label: "Fail card", number: "4000 0000 0000 0002", expiry: "12/28", cvv: "000" },
];

export function MockRazorpayModal({ orderId, amount, bookingId, onSuccess, onDismiss }: MockRazorpayModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upi, setUpi] = useState("success@razorpay");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [bank, setBank] = useState("hdfc");
  const [wallet, setWallet] = useState("paytm");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [otp, setOtp] = useState("");

  const handlePay = () => {
    setError("");
    // Simulate failure for specific test card
    if (method === "card" && cardNumber.replace(/\s/g, "") === "4000000000000002") {
      setError("Your card was declined. Please try a different card.");
      return;
    }
    if (method === "upi" && !upi.includes("@")) {
      setError("Invalid UPI ID. It must contain @.");
      return;
    }
    setStep("otp");
  };

  const handleOtpVerify = () => {
    if (otp.length < 4) {
      setError("Enter a valid OTP.");
      return;
    }
    setProcessing(true);
    setError("");
    // Simulate async verification
    setTimeout(() => {
      setProcessing(false);
      setStep("done");
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockSignature = `sig_mock_${Date.now()}`;
      setTimeout(() => {
        onSuccess({
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: orderId,
          razorpay_signature: mockSignature,
        });
      }, 800);
    }, 1500);
  };

  const methods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: "upi", label: "UPI", icon: "📲" },
    { id: "card", label: "Card", icon: "💳" },
    { id: "netbanking", label: "Netbanking", icon: "🏦" },
    { id: "wallet", label: "Wallets", icon: "👛" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Razorpay-style header */}
        <div className="bg-[#072654] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#528FF0] flex items-center justify-center text-white font-bold text-xs">NG</div>
            <div>
              <p className="text-white text-xs font-semibold">Next Gear Rentals</p>
              <p className="text-white/60 text-xs">{bookingId}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-lg font-bold">₹{amount.toLocaleString("en-IN")}</p>
            <p className="text-white/50 text-[10px] uppercase tracking-widest">Test Mode</p>
          </div>
        </div>

        {/* Test mode banner */}
        <div className="bg-yellow-400 px-4 py-1.5 text-xs font-semibold text-yellow-900 flex items-center gap-2 flex-shrink-0">
          <span>🔧</span> Mock Integration — Test payments only
        </div>

        {/* Body */}
        <div className="bg-white flex-1 overflow-y-auto">
          {step === "form" && (
            <>
              {/* Method tabs */}
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setError(""); }}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-all ${
                      method === m.id
                        ? "border-b-2 border-[#528FF0] text-[#528FF0]"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                {/* UPI */}
                {method === "upi" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">UPI ID</label>
                    <input
                      value={upi}
                      onChange={(e) => setUpi(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#528FF0] focus:outline-none"
                      placeholder="yourname@upi"
                    />
                    <p className="text-xs text-gray-400">Test IDs: <code className="bg-gray-100 px-1 rounded">success@razorpay</code></p>
                  </div>
                )}

                {/* Card */}
                {method === "card" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Test Cards</label>
                      <div className="mt-1 space-y-1">
                        {TEST_CARDS.map((c) => (
                          <button
                            key={c.number}
                            onClick={() => { setCardNumber(c.number); setExpiry(c.expiry); setCvv(c.cvv); }}
                            className={`w-full text-left rounded border px-2 py-1.5 text-xs transition ${
                              cardNumber === c.number ? "border-[#528FF0] bg-blue-50 text-[#528FF0]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {c.label} — {c.number}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#528FF0] focus:outline-none font-mono"
                      placeholder="Card Number"
                      maxLength={19}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#528FF0] focus:outline-none"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#528FF0] focus:outline-none"
                        placeholder="CVV"
                        maxLength={3}
                        type="password"
                      />
                    </div>
                  </div>
                )}

                {/* Netbanking */}
                {method === "netbanking" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Bank</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["hdfc", "sbi", "icici", "axis", "kotak", "pnb"].map((b) => (
                        <button
                          key={b}
                          onClick={() => setBank(b)}
                          className={`rounded-lg border py-3 text-xs font-semibold uppercase transition ${
                            bank === b ? "border-[#528FF0] bg-blue-50 text-[#528FF0]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">You will be redirected to a mock bank page.</p>
                  </div>
                )}

                {/* Wallet */}
                {method === "wallet" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Wallet</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "paytm", label: "Paytm", icon: "💙" },
                        { id: "phonepe", label: "PhonePe", icon: "💜" },
                        { id: "amazon", label: "Amazon Pay", icon: "🟠" },
                        { id: "freecharge", label: "Freecharge", icon: "🟢" },
                      ].map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setWallet(w.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                            wallet === w.id ? "border-[#528FF0] bg-blue-50 text-[#528FF0]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <span>{w.icon}</span>{w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
                )}

                <button
                  onClick={handlePay}
                  className="w-full rounded-xl bg-[#528FF0] py-3 text-sm font-bold text-white transition hover:bg-[#3a7bd5] active:scale-95"
                >
                  Pay ₹{amount.toLocaleString("en-IN")}
                </button>
              </div>
            </>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">📱</div>
                <p className="font-semibold text-gray-800">OTP Verification</p>
                <p className="mt-1 text-xs text-gray-500">
                  {method === "upi" ? `Enter OTP sent to your UPI app (${upi})` : "Enter OTP sent to your registered mobile"}
                </p>
              </div>
              <p className="text-center text-xs text-blue-600 bg-blue-50 rounded-lg py-2 px-3">
                🔧 Test OTP: use any 4-digit number (e.g. <strong>1234</strong>)
              </p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/, "");
                      const arr = otp.split("");
                      arr[i] = val;
                      setOtp(arr.join("").slice(0, 4));
                      if (val && i < 3) {
                        const next = document.getElementById(`otp-${i + 1}`);
                        next?.focus();
                      }
                    }}
                    id={`otp-${i}`}
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 text-center text-lg font-bold focus:border-[#528FF0] focus:outline-none"
                  />
                ))}
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 text-center">{error}</div>
              )}
              <button
                onClick={handleOtpVerify}
                disabled={processing}
                className="w-full rounded-xl bg-[#528FF0] py-3 text-sm font-bold text-white transition hover:bg-[#3a7bd5] disabled:opacity-60"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying...
                  </span>
                ) : "Verify & Pay"}
              </button>
              <button onClick={() => setStep("form")} className="w-full text-xs text-gray-400 hover:text-gray-600 transition">← Back</button>
            </div>
          )}

          {/* Success Step */}
          {step === "done" && (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl animate-[fade-up_0.4s_ease_forwards]">✅</div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Payment Successful!</p>
                <p className="text-sm text-gray-500 mt-1">₹{amount.toLocaleString("en-IN")} paid via {method.toUpperCase()}</p>
              </div>
              <p className="text-xs text-gray-400">Redirecting to booking confirmation...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>🔒</span>
            <span>Secured by <strong>Razorpay</strong> (Mock)</span>
          </div>
          <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-red-500 transition">✕ Cancel</button>
        </div>
      </div>
    </div>
  );
}
