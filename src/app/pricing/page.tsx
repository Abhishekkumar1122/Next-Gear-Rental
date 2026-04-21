import { PageShell } from "@/components/page-shell";

const plans = [
  {
    icon: "🛵",
    name: "City Starter",
    price: "INR 499/day",
    description: "Scooty and bike rentals for quick commutes.",
    perks: ["Helmet included", "Basic insurance", "24x7 support"],
  },
  {
    icon: "🚙",
    name: "Comfort Drive",
    price: "INR 1,899/day",
    description: "Sedans and compact SUVs for family travel.",
    perks: ["Roadside assistance", "Airport pickup", "Flexible cancellation"],
  },
  {
    icon: "🚗",
    name: "Premium Tour",
    price: "INR 3,499/day",
    description: "Premium cars with concierge delivery.",
    perks: ["Luxury fleet", "Dedicated manager", "Priority support"],
  },
];

export default function PricingPage() {
  return (
    <PageShell
      variant="dark"
      title="Pricing"
      subtitle="Transparent rates with no hidden charges. Choose a plan that matches your journey."
    >
      <section className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-5 shadow-lg shadow-red-500/10">
            <div className="text-3xl mb-3">{plan.icon}</div>
            <p className="text-sm font-semibold text-white">{plan.name}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-red)]">{plan.price}</p>
            <p className="mt-2 text-sm text-white/70">{plan.description}</p>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {plan.perks.map((perk) => (
                <p key={perk}>- {perk}</p>
              ))}
            </div>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
