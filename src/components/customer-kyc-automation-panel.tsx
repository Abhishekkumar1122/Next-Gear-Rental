"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type KycEntry = {
  id: string;
  fullName: string;
  documentType: "aadhaar" | "pan" | "license" | "passport";
  documentNumber: string;
  dob: string;
  expiryDate?: string;
  score: number;
  status: "approved" | "review" | "rejected";
  flags: string[];
  createdAt: string;
};

const docTypeLabels: Record<KycEntry["documentType"], string> = {
  aadhaar: "Aadhaar",
  pan: "PAN",
  license: "Driving License",
  passport: "Passport",
};

export function CustomerKycAutomationPanel({ userEmail, defaultName }: { userEmail: string; defaultName: string }) {
  const [entries, setEntries] = useState<KycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState(defaultName);
  const [documentType, setDocumentType] = useState<KycEntry["documentType"]>("aadhaar");
  const [documentNumber, setDocumentNumber] = useState("");
  const [dob, setDob] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const latest = useMemo(() => entries[0], [entries]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kyc?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json().catch(() => ({}));
      setEntries(data.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          documentType,
          documentNumber,
          dob,
          expiryDate: expiryDate || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Unable to process KYC right now.");
        return;
      }

      setMessage("KYC auto-check completed. Scroll down to review score and flags.");
      setDocumentNumber("");
      setExpiryDate("");
      await load();
    } catch {
      setMessage("Unable to process KYC right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
        <h2 className="text-lg font-bold">KYC Automation Flow</h2>
        <p className="mt-1 text-sm text-black/60">
          Submit your document details for instant format, age, and expiry validation before manual approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-black/10 p-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Full Name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Document Type</span>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as KycEntry["documentType"])}
            className="w-full rounded-lg border border-black/15 px-3 py-2"
          >
            <option value="aadhaar">Aadhaar</option>
            <option value="pan">PAN</option>
            <option value="license">Driving License</option>
            <option value="passport">Passport</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Document Number</span>
          <input
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Date of Birth</span>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Document Expiry (optional)</span>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2"
          />
        </label>

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Running checks..." : "Run KYC Auto-Check"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-black/70">{message}</p> : null}

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-black/5" />
      ) : latest ? (
        <div className="rounded-xl border border-black/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-black/50">Latest Result</p>
              <p className="text-sm font-semibold text-black">
                {docTypeLabels[latest.documentType]} · {latest.documentNumber}
              </p>
              <p className="text-xs text-black/50">{new Date(latest.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{latest.score}/100</p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  latest.status === "approved"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : latest.status === "review"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {latest.status}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/50">Validation flags</p>
            {latest.flags.length === 0 ? (
              <p className="mt-1 text-sm text-green-700">No issues found in automated checks.</p>
            ) : (
              <ul className="mt-1 list-disc list-inside text-sm text-black/70 space-y-1">
                {latest.flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-black/60">No KYC checks submitted yet.</p>
      )}
    </div>
  );
}
