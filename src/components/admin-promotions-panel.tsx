"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type CouponCampaign = {
  code: string;
  title: string;
  description?: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minSubtotalINR?: number;
  maxDiscountINR?: number;
  city?: string;
  eligibility: "all" | "first_ride" | "repeat";
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive: boolean;
};

type CampaignForm = {
  code: string;
  title: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: string;
  minSubtotalINR: string;
  maxDiscountINR: string;
  city: string;
  eligibility: "all" | "first_ride" | "repeat";
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
};

const defaultForm: CampaignForm = {
  code: "",
  title: "",
  description: "",
  discountType: "percent",
  discountValue: "10",
  minSubtotalINR: "",
  maxDiscountINR: "",
  city: "",
  eligibility: "all",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perUserLimit: "",
  isActive: true,
};

export function AdminPromotionsPanel() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CouponCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CampaignForm>({ ...defaultForm });

  const handleUnauthorized = useCallback(() => {
    setCampaigns([]);
    setAuthRequired(true);
    setMessage("Admin session required. Redirecting to login...");
    const next = encodeURIComponent("/dashboard/admin?section=finance");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 250);
  }, [router]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);
    const response = await fetch("/api/admin/promotions", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      setLoading(false);
      return;
    }
    if (response.ok) {
      setCampaigns(data.campaigns ?? []);
    }
    setLoading(false);
  }, [handleUnauthorized]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return campaigns;
    return campaigns.filter((item) => item.code.toLowerCase().includes(query) || item.title.toLowerCase().includes(query));
  }, [campaigns, search]);

  async function saveCampaign(payload: CouponCampaign) {
    setSavingCode(payload.code);
    setMessage("");

    try {
      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save campaign");
      }

      setMessage(`Saved campaign ${payload.code}`);
      await fetchCampaigns();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save campaign");
    } finally {
      setSavingCode(null);
    }
  }

  async function createCampaign() {
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    const discountValue = Number(form.discountValue);
    if (!code || !title || !Number.isFinite(discountValue) || discountValue <= 0) {
      setMessage("Code, title, and valid discount value are required.");
      return;
    }

    await saveCampaign({
      code,
      title,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      minSubtotalINR: form.minSubtotalINR ? Number(form.minSubtotalINR) : undefined,
      maxDiscountINR: form.maxDiscountINR ? Number(form.maxDiscountINR) : undefined,
      city: form.city.trim() || undefined,
      eligibility: form.eligibility,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
      isActive: form.isActive,
    });

    setForm({ ...defaultForm });
  }

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-black/60">Promotions</p>
          <h3 className="text-lg font-semibold">Coupon Campaign Manager</h3>
        </div>
        <button
          onClick={() => void fetchCampaigns()}
          className="rounded border border-black/15 px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03]"
        >
          Refresh
        </button>
      </div>

      {message ? <p className="mt-2 rounded border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">{message}</p> : null}

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="Code (e.g., FIRSTRIDE15)" className="rounded border border-black/15 px-3 py-2 text-sm" />
        <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Campaign title" className="rounded border border-black/15 px-3 py-2 text-sm" />
        <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" className="rounded border border-black/15 px-3 py-2 text-sm" />

        <select value={form.discountType} onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as "percent" | "flat" }))} className="rounded border border-black/15 px-3 py-2 text-sm">
          <option value="percent">Percent</option>
          <option value="flat">Flat INR</option>
        </select>
        <input value={form.discountValue} onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))} placeholder="Discount value" className="rounded border border-black/15 px-3 py-2 text-sm" />
        <input value={form.minSubtotalINR} onChange={(e) => setForm((prev) => ({ ...prev, minSubtotalINR: e.target.value }))} placeholder="Min subtotal" className="rounded border border-black/15 px-3 py-2 text-sm" />

        <input value={form.maxDiscountINR} onChange={(e) => setForm((prev) => ({ ...prev, maxDiscountINR: e.target.value }))} placeholder="Max discount" className="rounded border border-black/15 px-3 py-2 text-sm" />
        <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="City (optional)" className="rounded border border-black/15 px-3 py-2 text-sm" />
        <select value={form.eligibility} onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value as "all" | "first_ride" | "repeat" }))} className="rounded border border-black/15 px-3 py-2 text-sm">
          <option value="all">All users</option>
          <option value="first_ride">First ride</option>
          <option value="repeat">Repeat users</option>
        </select>

        <input type="date" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} className="rounded border border-black/15 px-3 py-2 text-sm" />
        <input type="date" value={form.endsAt} onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))} className="rounded border border-black/15 px-3 py-2 text-sm" />
        <input value={form.usageLimit} onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))} placeholder="Total usage limit" className="rounded border border-black/15 px-3 py-2 text-sm" />

        <input value={form.perUserLimit} onChange={(e) => setForm((prev) => ({ ...prev, perUserLimit: e.target.value }))} placeholder="Per user limit" className="rounded border border-black/15 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded border border-black/15 px-3 py-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
          Active
        </label>
        <button onClick={() => void createCampaign()} className="rounded bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">
          Create / Save
        </button>
      </div>

      <div className="mt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns"
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-sm text-black/60">Loading campaigns...</p>
        ) : authRequired ? (
          <p className="text-sm text-black/70">Admin authentication is required to manage promotions.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-black/60">No campaigns found.</p>
        ) : (
          filtered.map((item) => (
            <div key={item.code} className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.code} · {item.title}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-black/15 bg-black/[0.03] text-black/60"}`}>
                  {item.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <p className="mt-1 text-xs text-black/65">
                {item.discountType === "percent" ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`}
                {item.minSubtotalINR ? ` · Min ₹${item.minSubtotalINR}` : ""}
                {item.maxDiscountINR ? ` · Max ₹${item.maxDiscountINR}` : ""}
                {item.city ? ` · City ${item.city}` : ""}
                {item.eligibility !== "all" ? ` · ${item.eligibility.replace("_", " ")}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  disabled={savingCode === item.code}
                  onClick={() => void saveCampaign({ ...item, isActive: !item.isActive })}
                  className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-60"
                >
                  {savingCode === item.code ? "Saving..." : item.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  disabled={savingCode === item.code}
                  onClick={() => setForm({
                    code: item.code,
                    title: item.title,
                    description: item.description ?? "",
                    discountType: item.discountType,
                    discountValue: String(item.discountValue),
                    minSubtotalINR: item.minSubtotalINR ? String(item.minSubtotalINR) : "",
                    maxDiscountINR: item.maxDiscountINR ? String(item.maxDiscountINR) : "",
                    city: item.city ?? "",
                    eligibility: item.eligibility,
                    startsAt: item.startsAt ? item.startsAt.slice(0, 10) : "",
                    endsAt: item.endsAt ? item.endsAt.slice(0, 10) : "",
                    usageLimit: item.usageLimit ? String(item.usageLimit) : "",
                    perUserLimit: item.perUserLimit ? String(item.perUserLimit) : "",
                    isActive: item.isActive,
                  })}
                  className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-60"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
