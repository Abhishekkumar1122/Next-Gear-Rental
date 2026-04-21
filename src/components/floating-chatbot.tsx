"use client";

import { useMemo, useState } from "react";

type Role = "bot" | "user";
type Tool = "none" | "search" | "book" | "cancel" | "history";

type Message = {
  id: string;
  role: Role;
  text: string;
};

type VehicleItem = {
  id: string;
  title: string;
  city: string;
  type: string;
  fuel: string;
  transmission: string;
  pricePerDayINR: number;
  availabilityStatus?: "available" | "booked" | "unavailable" | "maintenance" | "crashed";
  availabilityMessage?: string;
};

type BookingItem = {
  id: string;
  city: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
};

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function formatDateISO(offsetDays = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<Tool>("none");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I’m Next Gear Assistant. I can guide you, search vehicles, do booking, check your bookings, and cancel bookings.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("Customer");
  const [email, setEmail] = useState("user@example.com");
  const [city, setCity] = useState("Delhi");
  const [startDate, setStartDate] = useState(formatDateISO(1));
  const [endDate, setEndDate] = useState(formatDateISO(2));
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [bookingIdToCancel, setBookingIdToCancel] = useState("");
  const [cancelReason, setCancelReason] = useState("User requested cancellation");
  const [bookingHistory, setBookingHistory] = useState<BookingItem[]>([]);

  const unreadHint = useMemo(() => (open ? "" : "Need help?"), [open]);

  function pushMessage(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, text }]);
  }

  function openTool(nextTool: Tool) {
    setTool(nextTool);
    const label =
      nextTool === "search"
        ? "Search Vehicles"
        : nextTool === "book"
        ? "Book Vehicle"
        : nextTool === "cancel"
        ? "Cancel Booking"
        : nextTool === "history"
        ? "My Bookings"
        : "Assistant";
    pushMessage("bot", `Opened: ${label}. Fill details below and I’ll handle it.`);
  }

  async function searchVehicles() {
    setBusy(true);
    try {
      const strictParams = new URLSearchParams({ city, startDate, endDate });
      const strictResponse = await fetch(`/api/vehicles?${strictParams.toString()}`);
      const strictData = await strictResponse.json();
      const strictList = (strictData.vehicles ?? []) as VehicleItem[];

      if (strictList.length > 0) {
        setVehicles(strictList);
        pushMessage("bot", `Found ${strictList.length} vehicles in ${city} for ${startDate} to ${endDate}. Select one below to continue.`);
        return;
      }

      const relaxedParams = new URLSearchParams({ city });
      const relaxedResponse = await fetch(`/api/vehicles?${relaxedParams.toString()}`);
      const relaxedData = await relaxedResponse.json();
      const relaxedList = (relaxedData.vehicles ?? []) as VehicleItem[];
      setVehicles(relaxedList);

      if (relaxedList.length === 0) {
        pushMessage("bot", `No vehicles found in ${city}. Try another city like Delhi, Mumbai, or Goa.`);
      } else {
        pushMessage(
          "bot",
          `No exact match for selected dates, but I found ${relaxedList.length} available vehicles in ${city}. You can still choose one to continue booking.`,
        );
      }
    } catch {
      pushMessage("bot", "Could not search vehicles right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function createBooking(vehicle: VehicleItem) {
    setBusy(true);
    pushMessage("user", `Book ${vehicle.title} (${vehicle.id})`);

    try {
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          userName: name,
          userEmail: email,
          city,
          startDate,
          endDate,
          currency: "INR",
          timezone: "Asia/Kolkata",
        }),
      });

      if (!bookingResponse.ok) {
        const failData = await bookingResponse.json().catch(() => ({}));
        pushMessage("bot", failData.error ?? "Booking failed. Please check your details.");
        return;
      }

      const bookingData = await bookingResponse.json();
      const bookingId = bookingData.booking.id as string;
      const totalAmountINR = bookingData.booking.totalAmountINR as number;

      const checkoutResponse = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "razorpay",
          amountINR: totalAmountINR,
          currency: "INR",
          bookingId,
        }),
      });

      if (!checkoutResponse.ok) {
        const checkoutError = await checkoutResponse.json().catch(() => ({})) as { error?: string; details?: string };
        const errorMessage = checkoutError.details
          ? `${checkoutError.error ?? "Payment initiation failed"}: ${checkoutError.details}`
          : (checkoutError.error ?? "Payment initiation failed. Please try again.");
        pushMessage("bot", errorMessage);
        return;
      }

      const checkoutData = await checkoutResponse.json();

      if (checkoutData.mode === "mock") {
        pushMessage(
          "bot",
          `✅ Booking created: ${bookingId}. Mock Razorpay payment completed. Amount ₹${totalAmountINR.toLocaleString("en-IN")}. Check it in your dashboard.`,
        );
      } else {
        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!key) {
          pushMessage("bot", "Razorpay public key is missing. Please contact support.");
          return;
        }

        const order = checkoutData.order as { id?: string; amount?: number; currency?: string };
        if (!order?.id) {
          pushMessage("bot", "Unable to create Razorpay order. Please try again.");
          return;
        }

        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (!existing) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Razorpay SDK load failed"));
            document.body.appendChild(script);
          });
        }

        const Razorpay = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
        if (!Razorpay) {
          pushMessage("bot", "Razorpay SDK unavailable. Please refresh and retry.");
          return;
        }

        const logoUrl =
          process.env.NEXT_PUBLIC_RAZORPAY_LOGO_URL?.trim() ||
          `${window.location.origin}/Logo1.png?v=1`;

        let verifiedInHandler = false;
        const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const verifyOrderStatus = async () => {
          for (let attempt = 0; attempt < 5; attempt += 1) {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: "razorpay",
                razorpayOrderId: order.id,
              }),
            });

            const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
              verified?: boolean;
              status?: string;
            };

            if (verifyResponse.ok && verifyData.verified && verifyData.status === "PAID") {
              pushMessage(
                "bot",
                `✅ Payment successful for booking ${bookingId}. Amount ₹${totalAmountINR.toLocaleString("en-IN")}.`,
              );
              setTool("history");
              await fetchHistory();
              return true;
            }

            if (attempt < 4) {
              await wait(2000);
            }
          }

          return false;
        };

        const razorpayCheckout = new Razorpay({
          key,
          order_id: order.id,
          amount: order.amount ?? totalAmountINR * 100,
          currency: order.currency ?? "INR",
          name: "Next Gear Rentals",
          description: `Booking ${bookingId}`,
          image: logoUrl,
          prefill: {
            name,
            email,
            contact: "9876543210",
          },
          handler: async (response: RazorpayResponse) => {
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

              const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
                verified?: boolean;
                status?: string;
                error?: string;
              };
              if (!verifyResponse.ok || !verifyData.verified || verifyData.status !== "PAID") {
                pushMessage("bot", verifyData.error ?? "Payment verification failed.");
                return;
              }

              verifiedInHandler = true;
              pushMessage(
                "bot",
                `✅ Payment successful for booking ${bookingId}. Amount ₹${totalAmountINR.toLocaleString("en-IN")}.`,
              );
              setTool("history");
              await fetchHistory();
            } catch {
              pushMessage("bot", "Verifying payment... please wait a few seconds.");
              const verified = await verifyOrderStatus();
              if (!verified) {
                pushMessage("bot", "Payment status is pending. If amount is deducted, it will auto-confirm shortly.");
              }
            }
          },
          modal: {
            ondismiss: async () => {
              if (verifiedInHandler) return;
              pushMessage("bot", "Checking payment status...");
              const verified = await verifyOrderStatus();
              if (!verified) {
                pushMessage("bot", "Payment cancelled or pending. You can retry from Book tool.");
              }
            },
          },
          theme: {
            color: "#e63946",
          },
        });

        razorpayCheckout.open();
      }

      setTool("history");
      await fetchHistory();
    } catch {
      pushMessage("bot", "Something went wrong while booking. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking() {
    if (!bookingIdToCancel.trim()) {
      pushMessage("bot", "Please enter a booking ID to cancel.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/bookings/${bookingIdToCancel.trim()}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "User requested cancellation" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        pushMessage("bot", data.error ?? "Cancellation failed.");
      } else {
        pushMessage("bot", `✅ Booking ${bookingIdToCancel.trim()} cancelled successfully.`);
      }
    } catch {
      pushMessage("bot", "Unable to cancel booking right now.");
    } finally {
      setBusy(false);
    }
  }

  async function fetchHistory() {
    if (!email.trim()) {
      pushMessage("bot", "Please provide your email to fetch bookings.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/bookings?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      const items = (data.bookings ?? []) as BookingItem[];
      setBookingHistory(items);
      pushMessage("bot", `Fetched ${items.length} booking(s) for ${email.trim()}.`);
    } catch {
      pushMessage("bot", "Could not fetch bookings right now.");
    } finally {
      setBusy(false);
    }
  }

  function handleFreeText() {
    if (!input.trim()) return;
    const text = input.trim();
    pushMessage("user", text);
    setInput("");

    const lower = text.toLowerCase();
    if (lower.includes("book")) {
      openTool("book");
      return;
    }
    if (lower.includes("cancel")) {
      openTool("cancel");
      return;
    }
    if (lower.includes("search") || lower.includes("vehicle")) {
      openTool("search");
      return;
    }
    if (lower.includes("my booking") || lower.includes("history") || lower.includes("status")) {
      openTool("history");
      return;
    }

    pushMessage(
      "bot",
      "I can help with: Search Vehicles, Book Vehicle, My Bookings, and Cancel Booking. Use quick actions below.",
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-[var(--brand-ink)] text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Next Gear Assistant</p>
              <p className="text-xs text-white/60">Guide + Booking + Support</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${m.role === "bot" ? "bg-white/10 text-white" : "ml-auto bg-[var(--brand-red)] text-white"}`}>
                {m.text}
              </div>
            ))}

            {tool === "search" && (
              <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/60">Search Vehicles</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs col-span-2" />
                </div>
                <button onClick={() => void searchVehicles()} disabled={busy} className="w-full rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold disabled:opacity-60">{busy ? "Searching..." : "Search"}</button>
              </div>
            )}

            {tool === "book" && (
              <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/60">Book Vehicle via Chat</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs col-span-2" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs col-span-2" />
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs col-span-2" />
                </div>
                <button onClick={() => void searchVehicles()} disabled={busy} className="w-full rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-60">Find Vehicles</button>

                {vehicles.slice(0, 4).map((vehicle) => (
                  <div key={vehicle.id} className="rounded-lg border border-white/15 p-2 text-xs">
                    <p className="font-semibold">{vehicle.title}</p>
                    <p className="text-white/70">{vehicle.city} · {vehicle.type} · ₹{vehicle.pricePerDayINR.toLocaleString("en-IN")}/day</p>
                    <p className="mt-1 text-white/60">
                      {(vehicle.availabilityStatus ?? "available").toUpperCase()}
                      {vehicle.availabilityMessage ? ` · ${vehicle.availabilityMessage}` : ""}
                    </p>
                    <button
                      onClick={() => void createBooking(vehicle)}
                      disabled={busy || (vehicle.availabilityStatus ?? "available") !== "available"}
                      className="mt-2 rounded bg-[var(--brand-red)] px-2.5 py-1 font-semibold text-white disabled:opacity-60"
                    >
                      {(vehicle.availabilityStatus ?? "available") === "available"
                        ? busy
                          ? "Processing..."
                          : "Book This"
                        : "Not Available"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tool === "cancel" && (
              <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/60">Cancel Booking</p>
                <input value={bookingIdToCancel} onChange={(e) => setBookingIdToCancel(e.target.value)} placeholder="Booking ID (e.g. bk-2)" className="w-full rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason" className="w-full rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                <button onClick={() => void cancelBooking()} disabled={busy} className="w-full rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold disabled:opacity-60">{busy ? "Cancelling..." : "Cancel Booking"}</button>
              </div>
            )}

            {tool === "history" && (
              <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/60">My Bookings</p>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded border border-white/20 bg-black/20 px-2 py-1.5 text-xs" />
                <button onClick={() => void fetchHistory()} disabled={busy} className="w-full rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-60">{busy ? "Loading..." : "Fetch Bookings"}</button>
                {bookingHistory.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-white/15 p-2 text-xs">
                    <p className="font-semibold">{booking.id} · {booking.status}</p>
                    <p className="text-white/70">{booking.city} · {booking.startDate} → {booking.endDate}</p>
                    <p className="text-white/70">₹{booking.totalAmountINR.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/15 px-3 py-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => openTool("book")} className="rounded-full border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10">Book</button>
              <button onClick={() => openTool("search")} className="rounded-full border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10">Search</button>
              <button onClick={() => openTool("history")} className="rounded-full border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10">My Bookings</button>
              <button onClick={() => openTool("cancel")} className="rounded-full border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10">Cancel</button>
              <a href="/faq" className="rounded-full border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10">FAQ</a>
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFreeText();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
              />
              <button onClick={handleFreeText} className="rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold text-white">Send</button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-white/20 bg-[var(--brand-red)] px-4 py-3 text-white shadow-lg shadow-red-500/30 transition hover:scale-105"
          aria-label="Open chat assistant"
        >
          <span className="text-base">💬</span>
          <span className="text-sm font-semibold">Chat Assistant</span>
          {unreadHint && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{unreadHint}</span>}
        </button>
      )}
    </div>
  );
}
