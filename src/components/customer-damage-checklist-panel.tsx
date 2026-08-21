"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DamageEntry = {
  id: string;
  bookingId: string;
  phase: "pickup" | "dropoff";
  checklist: {
    bodyPanelsOk: boolean;
    lightsOk: boolean;
    tyresOk: boolean;
    windshieldOk: boolean;
    mirrorsOk: boolean;
    interiorOk: boolean;
  };
  fuelLevel: string;
  odometerKm: number;
  notes?: string;
  photoUrls: string[];
  issueCount: number;
  createdAt: string;
};

type BookingLite = {
  id: string;
  vehicleId: string;
  city: string;
  startDate: string;
  endDate: string;
  status: string;
};

const DEFAULT_CHECKLIST: DamageEntry["checklist"] = {
  bodyPanelsOk: true,
  lightsOk: true,
  tyresOk: true,
  windshieldOk: true,
  mirrorsOk: true,
  interiorOk: true,
};

export function CustomerDamageChecklistPanel({ userEmail }: { userEmail: string }) {
  const [entries, setEntries] = useState<DamageEntry[]>([]);
  const [bookings, setBookings] = useState<BookingLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState("");
  const [phase, setPhase] = useState<"pickup" | "dropoff">("pickup");
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [fuelLevel, setFuelLevel] = useState("Full");
  const [odometerKm, setOdometerKm] = useState(0);
  const [notes, setNotes] = useState("");
  const [photoUrlsText, setPhotoUrlsText] = useState("");

  const issueCount = useMemo(() => Object.values(checklist).filter((ok) => !ok).length, [checklist]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [damageRes, bookingRes] = await Promise.all([
        fetch(`/api/damage-checklist?email=${encodeURIComponent(userEmail)}`),
        fetch(`/api/bookings?email=${encodeURIComponent(userEmail)}`),
      ]);

      const damageData = await damageRes.json().catch(() => ({}));
      const bookingData = await bookingRes.json().catch(() => ({}));

      const bookingItems: BookingLite[] = (bookingData.bookings ?? []).map((item: BookingLite) => ({
        id: item.id,
        vehicleId: item.vehicleId,
        city: item.city,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status,
      }));

      setEntries(damageData.entries ?? []);
      setBookings(bookingItems);
      if (!bookingId && bookingItems[0]?.id) {
        setBookingId(bookingItems[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, userEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleCheck(key: keyof DamageEntry["checklist"]) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const photoUrls = photoUrlsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/damage-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, phase, checklist, fuelLevel, odometerKm, notes, photoUrls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Unable to save checklist right now.");
        return;
      }

      setMessage("Damage checklist submitted successfully.");
      setNotes("");
      setPhotoUrlsText("");
      setChecklist(DEFAULT_CHECKLIST);
      await load();
    } catch {
      setMessage("Unable to save checklist right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 text-white">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left">
        <h2 className="text-lg font-bold text-white">Damage Capture Checklist</h2>
        <p className="mt-1 text-sm text-white/50">
          Record pickup/dropoff condition with checklist + photos to reduce damage disputes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 p-4 text-left">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm md:col-span-2 flex flex-col">
            <span className="font-medium text-white/70">Booking</span>
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:outline-none focus:border-white/20"
              required
            >
              {bookings.map((item) => (
                <option key={item.id} value={item.id} className="bg-[var(--brand-ink)] text-white">
                  {item.id} · {item.city} · {item.startDate} to {item.endDate}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm flex flex-col">
            <span className="font-medium text-white/70">Phase</span>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as "pickup" | "dropoff")}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:outline-none focus:border-white/20"
            >
              <option value="pickup" className="bg-[var(--brand-ink)] text-white">Pickup</option>
              <option value="dropoff" className="bg-[var(--brand-ink)] text-white">Dropoff</option>
            </select>
          </label>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <CheckToggle label="Body panels OK" checked={checklist.bodyPanelsOk} onClick={() => toggleCheck("bodyPanelsOk")} />
          <CheckToggle label="Lights OK" checked={checklist.lightsOk} onClick={() => toggleCheck("lightsOk")} />
          <CheckToggle label="Tyres OK" checked={checklist.tyresOk} onClick={() => toggleCheck("tyresOk")} />
          <CheckToggle label="Windshield OK" checked={checklist.windshieldOk} onClick={() => toggleCheck("windshieldOk")} />
          <CheckToggle label="Mirrors OK" checked={checklist.mirrorsOk} onClick={() => toggleCheck("mirrorsOk")} />
          <CheckToggle label="Interior clean/OK" checked={checklist.interiorOk} onClick={() => toggleCheck("interiorOk")} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm flex flex-col">
            <span className="font-medium text-white/70">Fuel Level</span>
            <input
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:outline-none"
              required
            />
          </label>

          <label className="space-y-1 text-sm flex flex-col">
            <span className="font-medium text-white/70">Odometer (km)</span>
            <input
              type="number"
              min={0}
              value={odometerKm}
              onChange={(e) => setOdometerKm(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:outline-none"
              required
            />
          </label>
        </div>

        <label className="space-y-1 text-sm block text-left">
          <span className="font-medium text-white/70">Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:outline-none focus:border-white/20"
            placeholder="Mention scratches, dents, smell, unusual sounds, etc."
          />
        </label>

        <label className="space-y-1 text-sm block text-left">
          <span className="font-medium text-white/70">Photo URLs (one per line)</span>
          <textarea
            rows={3}
            value={photoUrlsText}
            onChange={(e) => setPhotoUrlsText(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:outline-none focus:border-white/20"
            placeholder="https://.../front.jpg"
          />
        </label>

        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">Detected issues in this report: <strong className="text-white">{issueCount}</strong></p>
          <button
            type="submit"
            disabled={submitting || !bookingId}
            className="rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer border-0"
          >
            {submitting ? "Saving..." : "Submit Checklist"}
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-white/70 text-left">{message}</p> : null}

      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-white/5 border border-white/5" />
      ) : (
        <div className="space-y-2 text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Recent reports</h3>
          {entries.length === 0 ? (
            <p className="text-sm text-white/50">No checklists submitted yet.</p>
          ) : (
            entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-white/10 p-3 text-sm bg-white/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    {entry.phase.toUpperCase()} · {entry.bookingId}
                  </p>
                  <span className="text-xs text-white/40">{new Date(entry.createdAt).toLocaleString("en-IN")}</span>
                </div>
                <p className="text-white/60 mt-1">Fuel: {entry.fuelLevel} · Odometer: {entry.odometerKm} km · Issues: {entry.issueCount}</p>
                {entry.notes ? <p className="mt-1 text-white/50">{entry.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CheckToggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition cursor-pointer ${
        checked 
          ? "border-green-500/20 bg-green-500/10 text-green-400" 
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold">{checked ? "OK" : "Issue"}</span>
    </button>
  );
}
