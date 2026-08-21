"use client";

import { useState } from "react";
import { MockRazorpayModal } from "@/components/mock-razorpay-modal";
import { PaymentGatewaySelector, PaymentProvider } from "@/components/payment-gateway-selector";

import { calculateBookingAmount, formatBookingId } from "@/lib/pricing-tiers";

interface CheckoutFormProps {
  bookingId: string;
  amountINR: number;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export function CheckoutForm({ bookingId, amountINR, onSuccess, onError }: CheckoutFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("payu");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mockRazorpayData, setMockRazorpayData] = useState<{ orderId: string } | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setStatus("processing");

    const bookingAmt = calculateBookingAmount(amountINR);

    try {
      // Step 1: Create checkout order
      const checkoutResponse = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          amountINR: bookingAmt,
          currency: "INR",
          bookingId,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error("Failed to create payment order");
      }

      const checkoutData = await checkoutResponse.json();

      if (selectedProvider === "payu") {
        handlePayUPayment(checkoutData);
        return;
      }

      if (checkoutData.mode === "mock" && selectedProvider !== "razorpay") {
        // Mock auto-success for non-Razorpay providers
        setStatus("success");
        setMessage(`Mock ${selectedProvider} payment successful!`);
        onSuccess?.({ provider: selectedProvider, mode: "mock", status: "PAID" });
        return;
      }

      if (selectedProvider === "razorpay") {
        if (checkoutData.mode === "mock") {
          // Show the mock Razorpay modal UI
          setMockRazorpayData({ orderId: checkoutData.orderId });
          return;
        }
        handleRazorpayPayment(checkoutData);
      } else if (selectedProvider === "stripe") {
        handleStripePayment(checkoutData);
      } else if (selectedProvider === "paypal") {
        handlePayPalPayment(checkoutData);
      } else if (selectedProvider === "cashfree") {
        handleCashfreePayment(checkoutData);
      }
    } catch (error) {
      setStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Payment failed";
      setMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePayUPayment = (checkoutData: any) => {
    if (!checkoutData.actionUrl || !checkoutData.payuParams) {
      throw new Error("PayU checkout initialization failed");
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkoutData.actionUrl;
    form.style.display = "none";

    Object.entries(checkoutData.payuParams).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleRazorpayPayment = (checkoutData: any) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      const logoUrl =
        process.env.NEXT_PUBLIC_RAZORPAY_LOGO_URL?.trim() ||
        `${window.location.origin}/Logo1.png?v=1`;

      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || checkoutData.keyId,
        amount: amountINR * 100,
        currency: "INR",
        name: "Next Gear Rentals",
        description: `Booking ${bookingId}`,
        image: logoUrl,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: "razorpay",
                orderId: `standard_rzp_${bookingId}`,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.verified) {
              setStatus("success");
              setMessage("Payment successful!");
              onSuccess?.(verifyData);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            setStatus("error");
            const errorMsg = error instanceof Error ? error.message : "Verification failed";
            setMessage(errorMsg);
            onError?.(errorMsg);
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9876543210",
        },
        theme: {
          color: "#e63946",
        },
      };

      if (checkoutData.order?.id) {
        options.order_id = checkoutData.order.id;
      }

      const razorpayCheckout = new (window as any).Razorpay(options);
      razorpayCheckout.open();
    };

    document.body.appendChild(script);
  };

  const handleStripePayment = async (checkoutData: any) => {
    // Mock Stripe payment for demo
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStatus("success");
      setMessage("Mock Stripe payment successful!");
      onSuccess?.({ provider: "stripe", mode: "mock", status: "PAID" });
      return;
    }

    // In production, load Stripe.js dynamically
    // const { loadStripe } = await import("@stripe/stripe-js");
    // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    // For demo, simulate payment
    setStatus("success");
    setMessage("Stripe payment successful!");
    onSuccess?.(checkoutData);
  };

  const handlePayPalPayment = (checkoutData: any) => {
    if (checkoutData.approvalUrl) {
      // Redirect to PayPal approval
      window.location.href = checkoutData.approvalUrl;
    } else {
      throw new Error("PayPal approval URL not found");
    }
  };

  const handleCashfreePayment = async (checkoutData: any) => {
    try {
      // Load Cashfree SDK
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;

      script.onload = async () => {
        const Cashfree = (window as any).Cashfree;
        if (!Cashfree) {
          throw new Error("Cashfree SDK not loaded");
        }

        // Initialize Cashfree
        Cashfree.setup({
          mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox",
        });

        try {
          // Get payment session URL from your backend
          const paymentSessionId = checkoutData.paymentSessionId;
          const orderId = checkoutData.orderId;

          // Redirect to Cashfree hosted checkout
          const redirectUrl = `${process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com"}/pg/orders/${orderId}/pay?sessionId=${paymentSessionId}`;

          window.location.href = redirectUrl;
        } catch (error) {
          setStatus("error");
          const errorMsg = error instanceof Error ? error.message : "Payment failed";
          setMessage(errorMsg);
          onError?.(errorMsg);
        }
      };

      script.onerror = () => {
        setStatus("error");
        setMessage("Failed to load Cashfree SDK");
        onError?.("Failed to load Cashfree SDK");
      };

      document.body.appendChild(script);
    } catch (error) {
      setStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Payment failed";
      setMessage(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleMockRazorpaySuccess = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    setMockRazorpayData(null);
    setStatus("success");
    setMessage("Payment successful! Booking confirmed.");
    onSuccess?.({ provider: "razorpay", mode: "mock", status: "PAID", ...paymentData });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 text-center animate-[fade-up_0.6s_ease_forwards] text-white">
        <div className="checkmark-wrapper">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-400">Payment Successful</h3>
          <p className="text-sm text-white/70 mt-1.5">{message || "Your booking has been successfully confirmed."}</p>
        </div>
        <div className="text-[10px] text-white/40 font-mono">
          REF_ID: {formatBookingId(bookingId)}
        </div>
      </div>
    );
  }

  const bookingAmt = calculateBookingAmount(amountINR);
  const balanceAmt = Math.max(0, amountINR - bookingAmt);

  return (
    <div className="space-y-6 text-white">
      {mockRazorpayData && (
        <MockRazorpayModal
          orderId={mockRazorpayData.orderId}
          amount={bookingAmt}
          bookingId={bookingId}
          onSuccess={handleMockRazorpaySuccess}
          onDismiss={() => {
            setMockRazorpayData(null);
            setStatus("idle");
            setMessage("");
          }}
        />
      )}
      <PaymentGatewaySelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />

      <div className="rounded-2xl border border-white/10 p-5 bg-white/[0.02] space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40">Booking Fee (Pay Now)</p>
          <p className="mt-1 text-3xl font-extrabold text-green-400">₹{bookingAmt.toLocaleString("en-IN")}</p>
        </div>
        <div className="flex justify-between text-xs text-white/60 border-t border-white/5 pt-2">
          <span>Remaining Balance (Due at Pickup)</span>
          <span className="font-bold text-amber-400">₹{balanceAmt.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span>Total Rental Price</span>
          <span>₹{amountINR.toLocaleString("en-IN")}</span>
        </div>
        <p className="text-xs text-white/50 pt-1 border-t border-white/5">
          Payment Route: <span className="font-semibold text-[var(--brand-red-soft)]">{selectedProvider.toUpperCase()} SECURE GATEWAY</span>
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            status === "error"
              ? "border-red-950/40 bg-red-950/20 text-red-400"
              : "border-blue-950/40 bg-blue-950/20 text-blue-400"
          }`}
        >
          {message}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full rounded-xl px-4 py-3.5 font-bold text-white transition-all duration-300 shadow-lg cursor-pointer ${
          loading
            ? "bg-white/10 text-white/30 cursor-not-allowed border border-white/5"
            : "bg-[var(--brand-red)] hover:bg-red-600 shadow-red-600/10 hover:shadow-red-600/30 hover:-translate-y-0.5"
        }`}
      >
        {loading ? "Initializing Transaction..." : `Pay Booking Fee of ₹${bookingAmt.toLocaleString("en-IN")} with ${selectedProvider.toUpperCase()}`}
      </button>

      <div className="px-4 py-3 rounded-xl bg-yellow-950/10 border border-yellow-700/25 text-[11px] text-yellow-200/70">
        <p className="font-bold flex items-center gap-1.5 text-yellow-300">
          <span>🔧</span> Sandbox Credentials Notice
        </p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-white/60">
          <li>Razorpay: MOCK verification is enabled by default.</li>
          <li>Stripe & others: Simulated capture handles confirmation automatically.</li>
        </ul>
      </div>
    </div>
  );
}
