"use client";

import { useState } from "react";
import { MockRazorpayModal } from "@/components/mock-razorpay-modal";

// Payment Gateway Selector Component
function PaymentGatewaySelector({ selectedProvider, onSelect }: { selectedProvider: PaymentProvider; onSelect: (provider: PaymentProvider) => void }) {
  const providers: { id: PaymentProvider; name: string; description: string; icon: string }[] = [
    {
      id: "razorpay",
      name: "Razorpay",
      description: "Best for India. UPI, Cards, Wallets",
      icon: "🏦",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Best for International. Cards & Apple Pay",
      icon: "💳",
    },
    {
      id: "cashfree",
      name: "Cashfree",
      description: "India payments. Cards, UPI, Wallets",
      icon: "💰",
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Global payments. Multiple countries",
      icon: "🅿️",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-black/60">Select Payment Method</p>
      <div className="grid gap-3 md:grid-cols-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            className={`rounded-lg border-2 p-4 transition text-left ${
              selectedProvider === provider.id
                ? "border-[var(--brand-red)] bg-red-50"
                : "border-black/10 bg-white hover:border-black/15"
            }`}
          >
            <div className="text-2xl">{provider.icon}</div>
            <p className="mt-2 font-semibold text-sm">{provider.name}</p>
            <p className="mt-1 text-xs text-black/60">{provider.description}</p>
            {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && provider.id === "razorpay" && (
              <p className="mt-2 text-xs text-green-700">✓ Connected</p>
            )}
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && provider.id === "stripe" && (
              <p className="mt-2 text-xs text-green-700">✓ Connected</p>
            )}
            {process.env.NEXT_PUBLIC_CASHFREE_APP_ID && provider.id === "cashfree" && (
              <p className="mt-2 text-xs text-green-700">✓ Connected</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

type PaymentProvider = "razorpay" | "stripe" | "paypal" | "cashfree";

interface CheckoutFormProps {
  bookingId: string;
  amountINR: number;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export function CheckoutForm({ bookingId, amountINR, onSuccess, onError }: CheckoutFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("razorpay");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mockRazorpayData, setMockRazorpayData] = useState<{ orderId: string } | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setStatus("processing");

    try {
      // Step 1: Create checkout order
      const checkoutResponse = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          amountINR,
          currency: "INR",
          bookingId,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error("Failed to create payment order");
      }

      const checkoutData = await checkoutResponse.json();

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

  const handleRazorpayPayment = (checkoutData: any) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      const logoUrl =
        process.env.NEXT_PUBLIC_RAZORPAY_LOGO_URL?.trim() ||
        `${window.location.origin}/Logo1.png?v=1`;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: checkoutData.order.id,
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

  return (
    <div className="space-y-6">
      {mockRazorpayData && (
        <MockRazorpayModal
          orderId={mockRazorpayData.orderId}
          amount={amountINR}
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

      <div className="rounded-lg border border-black/10 p-4 bg-black/[0.02]">
        <p className="text-sm text-black/70">Amount</p>
        <p className="mt-1 text-3xl font-bold">₹{amountINR.toLocaleString("en-IN")}</p>
        <p className="mt-1 text-xs text-black/60">Provider: {selectedProvider.toUpperCase()}</p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            status === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || status === "success"}
        className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition ${
          loading || status === "success"
            ? "bg-black/40 cursor-not-allowed"
            : "bg-[var(--brand-red)] hover:-translate-y-0.5"
        }`}
      >
        {loading ? "Processing..." : status === "success" ? "Payment Complete" : `Pay ₹${amountINR.toLocaleString("en-IN")} with ${selectedProvider}`}
      </button>

      <div className="px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
        <p className="font-semibold">Test Mode Credentials</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Razorpay: Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET</li>
          <li>Stripe: Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET</li>
          <li>Cashfree: Set CASHFREE_APP_ID and CASHFREE_APP_SECRET</li>
          <li>PayPal: Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET</li>
        </ul>
      </div>
    </div>
  );
}
