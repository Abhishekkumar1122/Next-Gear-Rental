"use client";

import Link from "next/link";
import { useState } from "react";

type WaitlistButtonProps = {
  vehicleId: string;
  city: string;
  className?: string;
};

export function WaitlistButton({ vehicleId, city, className }: WaitlistButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<
    { id: string; title: string; city: string; type: string; seats: number; pricePerDayINR: number }[]
  >([]);

  async function submitJoin(email?: string) {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, city, email }),
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function handleJoin() {
    setIsSubmitting(true);
    setMessage(null);
    setAlternatives([]);

    try {
      let { response, data } = await submitJoin();

      if (response.status === 401) {
        const email = window.prompt("Enter your email to join the waitlist:")?.trim();
        if (!email) {
          setMessage("Email is required to join the waitlist.");
          return;
        }

        ({ response, data } = await submitJoin(email));
      }

      if (!response.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Unable to join waitlist right now.");
        return;
      }

      setMessage(data.alreadyJoined ? "You are already in this waitlist." : "Waitlist joined. We will notify you once available.");
      setAlternatives(Array.isArray(data.alternatives) ? data.alternatives : []);
    } catch {
      setMessage("Unable to join waitlist right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleJoin()}
        disabled={isSubmitting}
        className={
          className ||
          "rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isSubmitting ? "Joining..." : "Join waitlist"}
      </button>
      {message ? <p className="mt-1 text-xs text-black/60">{message}</p> : null}
      {alternatives.length ? (
        <div className="mt-2 rounded-lg border border-black/10 bg-black/[0.02] p-2 text-xs">
          <p className="font-semibold text-black/70">Instant alternatives you can book now:</p>
          <div className="mt-1 flex flex-col gap-1">
            {alternatives.map((item) => (
              <Link
                key={item.id}
                href={`/book-vehicle?vehicleId=${encodeURIComponent(item.id)}&city=${encodeURIComponent(item.city)}`}
                className="rounded-md border border-black/10 bg-white px-2 py-1 text-black/80 hover:bg-black/5"
              >
                {item.title} · {item.type} · {item.seats} seats · INR {item.pricePerDayINR}/day
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
