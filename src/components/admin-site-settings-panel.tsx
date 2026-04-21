"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SiteSettingsForm = {
  brandName: string;
  sinceText: string;
  description: string;
  supportEmail: string;
  businessEmail: string;
  phone: string;
  whatsappUrl: string;
  instagramUrl: string;
  logoUrl: string;
};

type FooterSettingsSection = "brand" | "description" | "contact" | "social";

const initialForm: SiteSettingsForm = {
  brandName: "",
  sinceText: "",
  description: "",
  supportEmail: "",
  businessEmail: "",
  phone: "",
  whatsappUrl: "",
  instagramUrl: "",
  logoUrl: "",
};

export function AdminSiteSettingsPanel() {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<FooterSettingsSection>("brand");

  function handleUnauthorized() {
    setAuthRequired(true);
    setMessage("Admin session required. Redirecting to login...");
    const next = encodeURIComponent("/dashboard/admin?section=footer");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 250);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      const res = await fetch("/api/admin/site-settings", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;

      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setMessage(data.error ?? "Failed to load site settings");
        setLoading(false);
        return;
      }

      setForm(data.settings ?? initialForm);
      setLoading(false);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      handleUnauthorized();
      setSaving(false);
      return;
    }
    if (!res.ok) {
      setMessage(data.error ?? "Failed to save site settings");
      setSaving(false);
      return;
    }

    setForm(data.settings ?? form);
    setMessage("Footer settings saved and now live.");
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-black/60">Loading footer settings...</p>;
  }

  if (authRequired) {
    return <p className="text-sm text-black/70">Admin authentication is required to access footer settings.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60">Site Footer Settings</p>
        <h3 className="text-lg font-semibold">Footer Management</h3>
        <p className="text-sm text-black/70">Use sub-headers to manage one settings block at a time.</p>
      </div>

      <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
        <p className="text-xs uppercase tracking-wide text-black/60">Sub Header Sections</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: "brand", label: "Brand" },
            { id: "description", label: "Description" },
            { id: "contact", label: "Contact" },
            { id: "social", label: "Social Links" },
          ].map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as FooterSettingsSection)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black/80 hover:bg-black/[0.03]"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {message && <p className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">{message}</p>}

      {activeSection === "brand" && (
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-xs uppercase tracking-wide text-black/60">Brand</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <input
              value={form.brandName}
              onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))}
              placeholder="Brand name"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={form.sinceText}
              onChange={(e) => setForm((prev) => ({ ...prev, sinceText: e.target.value }))}
              placeholder="Since text"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="Logo URL (public path or https link)"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
            />
          </div>
        </div>
      )}

      {activeSection === "description" && (
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-xs uppercase tracking-wide text-black/60">Description</p>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Footer brand description"
            className="mt-2 min-h-[90px] w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
        </div>
      )}

      {activeSection === "contact" && (
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-xs uppercase tracking-wide text-black/60">Contact</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <input
              value={form.supportEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
              placeholder="Support email"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={form.businessEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, businessEmail: e.target.value }))}
              placeholder="Business email"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
            />
          </div>
        </div>
      )}

      {activeSection === "social" && (
        <div className="rounded-xl border border-black/10 p-3">
          <p className="text-xs uppercase tracking-wide text-black/60">Social Links</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <input
              value={form.whatsappUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsappUrl: e.target.value }))}
              placeholder="WhatsApp link"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
              placeholder="Instagram link"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <button
        onClick={() => void save()}
        disabled={saving}
        className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Footer Settings"}
      </button>
    </div>
  );
}
