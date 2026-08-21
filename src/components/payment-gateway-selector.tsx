"use client";

export type PaymentProvider = "payu" | "razorpay" | "stripe" | "paypal" | "cashfree";

interface PaymentGatewaySelectorProps {
  selectedProvider: PaymentProvider;
  onSelect: (provider: PaymentProvider) => void;
  allowedProviders?: PaymentProvider[];
}

export function PaymentGatewaySelector({
  selectedProvider,
  onSelect,
  allowedProviders = ["payu", "razorpay", "stripe", "cashfree", "paypal"],
}: PaymentGatewaySelectorProps) {
  const allProviders: { id: PaymentProvider; name: string; description: string; icon: string; connected: boolean }[] = [
    {
      id: "payu",
      name: "PayU India",
      description: "Fastest Checkout. UPI, GPay, Cards, NetBanking",
      icon: "⚡",
      connected: true,
    },
    {
      id: "razorpay",
      name: "Razorpay",
      description: "Best for India. UPI, Cards, Netbanking",
      icon: "🏦",
      connected: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Best international. Cards & Apple Pay",
      icon: "💳",
      connected: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },
    {
      id: "cashfree",
      name: "Cashfree",
      description: "India gateway. UPI, Cards, wallets",
      icon: "💰",
      connected: Boolean(process.env.NEXT_PUBLIC_CASHFREE_APP_ID),
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Global checkout. Multiple currencies",
      icon: "🅿️",
      connected: Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || true),
    },
  ];

  const providers = allProviders.filter((p) => allowedProviders.includes(p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-[0.2em] text-white/50 font-semibold">Select Payment Method</label>
        <span className="hidden sm:inline-block text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/60 font-mono">
          SECURE_SSL_3.0
        </span>
      </div>

      {/* Responsive Touch Cards (Mobile & Desktop) */}
      <div className="grid gap-2.5 sm:gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              className={`relative group text-left rounded-xl border p-3.5 sm:p-3 transition-all duration-300 cursor-pointer overflow-hidden ${
                isSelected
                  ? "bg-gradient-to-br from-red-950/60 via-black to-red-950/40 border-[var(--brand-red)] shadow-[0_0_20px_rgba(225,6,0,0.2)]"
                  : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              {/* Slide overlay for active state highlight */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr from-[var(--brand-red)]/10 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none ${
                  isSelected ? "opacity-100" : "group-hover:opacity-40"
                }`}
              />

              {/* Glowing decorative dot */}
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl transition-transform duration-300 group-hover:scale-110 origin-center">
                      {provider.icon}
                    </div>
                    <p className="font-bold text-xs sm:text-xs text-white tracking-wide">{provider.name}</p>
                  </div>
                  <p className="mt-1 text-[11px] sm:text-[10px] text-white/60 leading-snug">{provider.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[9px]">
                  {provider.connected ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-white/40 font-mono">
                      <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                      Sandbox Test
                    </span>
                  )}
                  {isSelected && <span className="font-extrabold text-[var(--brand-red-soft)] tracking-wider">SELECTED</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
