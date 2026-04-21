"use client";

type PaymentProvider = "razorpay" | "stripe" | "paypal" | "cashfree";

interface PaymentGatewaySelectorProps {
  selectedProvider: PaymentProvider;
  onSelect: (provider: PaymentProvider) => void;
}

export function PaymentGatewaySelector({ selectedProvider, onSelect }: PaymentGatewaySelectorProps) {
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
