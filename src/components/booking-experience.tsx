"use client";

import { cityConfigs, toCurrency } from "@/lib/mock-data";
import { Booking, Vehicle } from "@/lib/types";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MockRazorpayModal } from "@/components/mock-razorpay-modal";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOrder = {
  id: string;
  amount?: number;
  currency?: string;
};

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingExperience({ userEmail: initialEmail, userName: initialName }: { userEmail?: string; userName?: string } = {}) {
  const searchParams = useSearchParams();
  const prefilledCity = searchParams.get("city") ?? "Delhi";
  const isNriMode = searchParams.get("nri") === "1";
  const prefilledTimezone = searchParams.get("tz") ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Kolkata";
  const [city, setCity] = useState(prefilledCity);
  const [startDate, setStartDate] = useState(() => offsetDate(1));
  const [endDate, setEndDate] = useState(() => offsetDate(3));
  const [type, setType] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "user@example.com");
  const [fullName, setFullName] = useState(initialName ?? "Riya Verma");
  const [phone, setPhone] = useState("9876543210");
  const [paymentProvider, setPaymentProvider] = useState<"razorpay" | "stripe" | "paypal">(isNriMode ? "stripe" : "razorpay");
  const [timezone, setTimezone] = useState(prefilledTimezone);
  const [nriChecklistAccepted, setNriChecklistAccepted] = useState(!isNriMode);
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [ownReferralCode, setOwnReferralCode] = useState("");
  const [referralEarnedINR, setReferralEarnedINR] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [drivingLicenseNo, setDrivingLicenseNo] = useState("");
  const [governmentIdNo, setGovernmentIdNo] = useState("");
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");
  const [bookingVehicleId, setBookingVehicleId] = useState<string | null>(null);

  // Auto-search when vehicleId + city are passed via URL (e.g. from vehicle detail page)
  useEffect(() => {
    const preCity = searchParams.get("city");
    const preVehicleId = searchParams.get("vehicleId");
    if (preVehicleId || preCity) {
      void (async () => {
        const params = new URLSearchParams();
        if (preCity) params.set("city", preCity);
        const res = await fetch(`/api/vehicles?${params.toString()}`);
        const data = await res.json();
        const list: Vehicle[] = data.vehicles ?? [];
        // If a specific vehicleId was requested, show that vehicle first
        if (preVehicleId) {
          const sorted = [...list].sort((a, b) =>
            a.id === preVehicleId ? -1 : b.id === preVehicleId ? 1 : 0
          );
          setVehicles(sorted);
        } else {
          setVehicles(list);
        }
        setMessage(`Found ${list.length} vehicles.`);
      })();
    }
  }, []);

  useEffect(() => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail.includes("@")) return;

    void (async () => {
      const response = await fetch(`/api/referrals?email=${encodeURIComponent(normalizedEmail)}`);
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));
      const referral = data.referral as { referralCode?: string; successfulReferrals?: number; earnedAmountINR?: number } | undefined;
      setOwnReferralCode(referral?.referralCode ?? "");
      setReferralCount(Number(referral?.successfulReferrals ?? 0));
      setReferralEarnedINR(Number(referral?.earnedAmountINR ?? 0));
    })();
  }, [email]);

  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    bookingId: string;
    amountINR: number;
  } | null>(null);

  async function startLiveRazorpayPayment(params: {
    bookingId: string;
    amountINR: number;
    order: RazorpayOrder;
  }) {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      setMessage("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID. Add it to environment and redeploy.");
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (!existing) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
        document.body.appendChild(script);
      });
    }

    const Razorpay = (window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
    if (!Razorpay) {
      setMessage("Razorpay SDK unavailable. Please refresh and try again.");
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
            razorpayOrderId: params.order.id,
          }),
        });

        const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
          verified?: boolean;
          status?: string;
          error?: string;
        };

        if (verifyResponse.ok && verifyData.verified && verifyData.status === "PAID") {
          setMessage(`✅ Payment successful! Booking ${params.bookingId} confirmed. Confirmation sent on email + WhatsApp.`);
          await fetchHistory();
          return true;
        }

        if (attempt < 4) {
          await wait(2000);
        }
      }

      return false;
    };

    const options = {
      key,
      order_id: params.order.id,
      amount: params.order.amount ?? params.amountINR * 100,
      currency: params.order.currency ?? "INR",
      name: "Next Gear Rentals",
      description: `Booking ${params.bookingId}`,
      image: logoUrl,
      prefill: {
        name: fullName,
        email,
        contact: phone,
      },
      theme: {
        color: "#e63946",
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
            setMessage(verifyData.error ?? "Payment verification failed. Please contact support.");
            return;
          }

          verifiedInHandler = true;
          setMessage(`✅ Payment successful! Booking ${params.bookingId} confirmed. Confirmation sent on email + WhatsApp.`);
          await fetchHistory();
        } catch {
          setMessage("Verifying payment... please wait a few seconds.");
          const verified = await verifyOrderStatus();
          if (!verified) {
            setMessage("Payment status is pending. If amount is deducted, it will auto-confirm shortly.");
          }
        }
      },
      modal: {
        ondismiss: async () => {
          if (verifiedInHandler) return;
          setMessage("Checking payment status...");
          const verified = await verifyOrderStatus();
          if (!verified) {
            setMessage("Payment cancelled or pending. Your booking is reserved for 10 minutes.");
          }
        },
      },
    };

    const checkout = new Razorpay(options);
    checkout.open();
  }

  async function searchVehicles(event: FormEvent) {
    event.preventDefault();
    setMessage("Searching available vehicles...");

    const params = new URLSearchParams({ city, startDate, endDate });
    if (type) params.set("type", type);

    const response = await fetch(`/api/vehicles?${params.toString()}`);
    const data = await response.json();
    setVehicles(data.vehicles ?? []);
    setMessage(`Found ${data.vehicles?.length ?? 0} vehicles.`);
  }

  async function createBooking(vehicleId: string) {
    setBookingVehicleId(vehicleId);
    try {
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        setMessage("Please enter basic customer details (name, email, phone).");
        return;
      }

      if (!drivingLicenseNo.trim() || !governmentIdNo.trim()) {
        setMessage("Please enter Driving License and Government ID numbers.");
        return;
      }

      if (!drivingLicenseFile || !governmentIdFile) {
        setMessage("Please upload Driving License and Government ID files.");
        return;
      }

      if (isNriMode && !nriChecklistAccepted) {
        setMessage("Please confirm NRI document checklist before continuing.");
        return;
      }

      setMessage("Processing payment and creating booking...");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          userName: fullName,
          userEmail: email,
          city,
          startDate,
          endDate,
          addons: [],
          currency: "INR",
          timezone,
          couponCode: couponCode.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          isNri: isNriMode,
          internationalCardPreferred: isNriMode,
          kyc: {
            phone,
            drivingLicenseNo,
            governmentIdNo,
            drivingLicenseFileName: drivingLicenseFile.name,
            governmentIdFileName: governmentIdFile.name,
          },
        }),
      });

      if (!response.ok) {
        setMessage("Booking failed. Please verify required details.");
        return;
      }

      const data = await response.json();
      const bookingId = data.booking.id as string;
      const subtotalAmountINR = Number(data.booking.subtotalAmountINR ?? data.booking.totalAmountINR);
      const couponDiscountINR = Number(data.booking.couponDiscountINR ?? 0);
      const referralDiscountINR = Number(data.booking.referralDiscountINR ?? 0);
      const totalDiscountINR = couponDiscountINR + referralDiscountINR;

      const checkout = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: paymentProvider,
          amountINR: data.booking.totalAmountINR,
          currency: "INR",
          bookingId,
        }),
      });

      if (!checkout.ok) {
        const checkoutErr = await checkout.json().catch(() => ({})) as { error?: string; details?: string };
        const errorMessage = checkoutErr.details
          ? `${checkoutErr.error ?? "Payment initialisation failed"}: ${checkoutErr.details}`
          : (checkoutErr.error ?? "Payment initialisation failed. Your booking was created but payment is incomplete.");
        setMessage(errorMessage);
        return;
      }

      const paymentData = await checkout.json();

      if (paymentProvider === "razorpay" && paymentData.mode === "mock") {
        setMessage("");
        setPendingPayment({
          orderId: paymentData.orderId ?? `mock_rzp_${bookingId}`,
          bookingId,
          amountINR: data.booking.totalAmountINR,
        });
        return;
      }

      if (paymentProvider === "razorpay" && paymentData.mode === "live") {
        const order = paymentData.order as RazorpayOrder | undefined;
        if (!order?.id) {
          setMessage("Razorpay order creation failed. Please try again.");
          return;
        }
        setMessage("Opening Razorpay checkout...");
        await startLiveRazorpayPayment({
          bookingId,
          amountINR: data.booking.totalAmountINR,
          order,
        });
        return;
      }

      const paymentMode = paymentData.mode ? ` (${paymentData.mode})` : "";
      setMessage(
        `Booking confirmed: ${bookingId}. Payment provider: ${paymentProvider}${paymentMode}. ${totalDiscountINR > 0 ? `You saved ₹${totalDiscountINR} (subtotal ₹${subtotalAmountINR}, payable ₹${data.booking.totalAmountINR}). ` : ""}Confirmation shared on email + WhatsApp.`,
      );
      await fetchHistory();
    } catch {
      setMessage("Something went wrong while starting booking. Please try again.");
    } finally {
      setBookingVehicleId(null);
    }
  }

  async function fetchHistory() {
    const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    setBookings(data.bookings ?? []);
  }

  return (
    <section className="fade-up space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
      {pendingPayment && (
        <MockRazorpayModal
          orderId={pendingPayment.orderId}
          amount={pendingPayment.amountINR}
          bookingId={pendingPayment.bookingId}
          onSuccess={async () => {
            const capturedId = pendingPayment.bookingId;
            setPendingPayment(null);
            setMessage(`✅ Payment successful! Booking ${capturedId} confirmed. Confirmation sent on email + WhatsApp.`);
            await fetchHistory();
          }}
          onDismiss={() => {
            setPendingPayment(null);
            setMessage("Payment cancelled. Your booking is reserved for 10 minutes.");
          }}
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Customer Experience</p>
          <h2 className="text-xl font-semibold">User Booking (MVP)</h2>
          <p className="text-sm text-black/70">Login, add basic details, upload IDs, search vehicle, pay, and confirm booking.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1">Instant confirmation</span>
          <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1">OTP login supported</span>
          <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1">KYC upload</span>
        </div>
      </div>

      <form onSubmit={searchVehicles} className="grid gap-3 md:grid-cols-3">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="rounded-xl border border-black/10 px-3 py-2" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-black/10 px-3 py-2" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-xl border border-black/10 px-3 py-2" />
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
          <option value="Asia/Kolkata">Asia/Kolkata</option>
          <option value="Asia/Dubai">Asia/Dubai</option>
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New_York</option>
          <option value="Asia/Singapore">Asia/Singapore</option>
        </select>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
          {cityConfigs.map((item) => (
            <option key={item.name} value={item.name}>{item.name}</option>
          ))}
        </select>

        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2">
          <option value="">All types</option>
          <option value="bike">Bike</option>
          <option value="car">Car</option>
          <option value="scooty">Scooty</option>
        </select>
        <input
          value={drivingLicenseNo}
          onChange={(e) => setDrivingLicenseNo(e.target.value)}
          placeholder="Driving License Number"
          className="rounded-xl border border-black/10 px-3 py-2"
        />
        <input
          value={governmentIdNo}
          onChange={(e) => setGovernmentIdNo(e.target.value)}
          placeholder="Government ID Number (Aadhaar/Passport)"
          className="rounded-xl border border-black/10 px-3 py-2"
        />
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Coupon code (optional)"
          className="rounded-xl border border-black/10 px-3 py-2"
        />
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          placeholder="Referral code (first booking)"
          className="rounded-xl border border-black/10 px-3 py-2"
        />

        <label className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/70">
          Upload Driving License
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDrivingLicenseFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs"
          />
        </label>
        <label className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/70">
          Upload Government ID
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setGovernmentIdFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs"
          />
        </label>

        <select
          value={paymentProvider}
          onChange={(e) => setPaymentProvider(e.target.value as "razorpay" | "stripe" | "paypal")}
          className="rounded-xl border border-black/10 px-3 py-2"
        >
          <option value="razorpay">Razorpay</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
        </select>

        <button type="submit" className="rounded-xl bg-[var(--brand-red)] px-4 py-2 font-semibold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-0.5">Search Vehicles</button>
      </form>

      {isNriMode ? (
        <label className="flex items-start gap-2 rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black/70">
          <input
            type="checkbox"
            checked={nriChecklistAccepted}
            onChange={(event) => setNriChecklistAccepted(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            I confirm I carry passport, visa, and International Driving Permit (or accepted local equivalent) and I prefer international-card-compatible payment methods.
          </span>
        </label>
      ) : null}

      <div className="rounded-2xl border border-black/5 bg-black/[0.03] p-4 text-sm">
        <p><span className="font-medium">MVP Booking Flow:</span> Login (OTP/email) → Basic details → Upload IDs → Search vehicle → Pay → Confirm.</p>
        <p><span className="font-medium">Required:</span> Name, email, phone, dates, license ID, government ID.</p>
        <p><span className="font-medium">Payment:</span> Razorpay/Stripe/PayPal test flow is enabled.</p>
        {isNriMode ? <p><span className="font-medium">NRI Mode:</span> Timezone-aware booking plus international cards guidance is enabled.</p> : null}
        <p><span className="font-medium">Your Referral:</span> {ownReferralCode || "Generating..."} · Successful referrals: {referralCount} · Earned discounts: ₹{referralEarnedINR}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Live Availability</h3>
          <span className="flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs">
            <span className="pulse-dot" aria-hidden="true" />
            Live
          </span>
        </div>
        {message ? <p className="text-xs text-black/60">{message}</p> : null}
        {vehicles.length === 0 ? (
          <p className="text-sm text-black/60">No vehicles loaded yet. Run a search.</p>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{vehicle.title} · {vehicle.type.toUpperCase()}</p>
                <button
                  type="button"
                  onClick={() => createBooking(vehicle.id)}
                  disabled={(vehicle.availabilityStatus ?? "available") !== "available" || bookingVehicleId === vehicle.id}
                  className="rounded-full border border-black/15 px-4 py-1 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(vehicle.availabilityStatus ?? "available") !== "available"
                    ? "Not Available"
                    : bookingVehicleId === vehicle.id
                    ? "Processing..."
                    : "Book Now"}
                </button>
              </div>
              <p className="mt-1 text-xs font-medium text-black/70">
                Status: {(vehicle.availabilityStatus ?? "available").toUpperCase()}
                {vehicle.availabilityMessage ? ` · ${vehicle.availabilityMessage}` : ""}
              </p>
              <p className="text-sm text-black/70">{vehicle.city} · {vehicle.fuel} · {vehicle.transmission} · {vehicle.seats} seats</p>
              <p className="text-sm font-medium text-[var(--brand-red)]">{toCurrency(vehicle.pricePerDayINR, "INR")} / day</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {vehicle.availableDates.map((date) => (
                  <span key={date} className="rounded-full bg-black/5 px-3 py-1">{date}</span>
                ))}
              </div>
              {vehicle.availabilitySlots?.length ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-black/60">Slots for {startDate}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(vehicle.availabilitySlots.find((slot) => slot.date === startDate)?.slots ?? [])
                      .slice(0, 8)
                      .map((slot) => (
                        <span key={`${vehicle.id}-${slot}`} className="rounded-full border border-black/10 px-2 py-0.5">{slot}</span>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Booking History</h3>
          <button onClick={fetchHistory} className="rounded-full border border-black/15 px-4 py-1 text-sm font-semibold transition hover:-translate-y-0.5">Refresh History</button>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-black/60">No bookings yet for this email.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-sm">
              <p className="font-medium">{booking.id} · {booking.status.toUpperCase()}</p>
              <p>{booking.city} · {booking.startDate} to {booking.endDate}</p>
              {booking.startTime && booking.endTime ? (
                <p className="text-black/70">{booking.startTime} - {booking.endTime}{booking.rentalHours ? ` (${booking.rentalHours} hrs)` : ""}</p>
              ) : null}
              {booking.addons && booking.addons.length ? (
                <p className="text-black/70">Add-ons: {booking.addons.join(", ")}</p>
              ) : null}
              {booking.subtotalAmountINR ? (
                <p className="text-black/70">Subtotal: {toCurrency(booking.subtotalAmountINR, booking.currency)}</p>
              ) : null}
              {(booking.couponDiscountINR || booking.referralDiscountINR) ? (
                <p className="text-black/70">
                  Discounts:
                  {booking.couponDiscountINR ? ` Coupon ${booking.couponCode ?? ""} -₹${booking.couponDiscountINR}` : ""}
                  {booking.referralDiscountINR ? ` Referral ${booking.referralCode ?? ""} -₹${booking.referralDiscountINR}` : ""}
                </p>
              ) : null}
              <p className="text-black/70">{toCurrency(booking.totalAmountINR, booking.currency)} · Timezone: {booking.timezone}</p>
            </div>
          ))
        )}
      </div>

      {message ? (
        <div className={`rounded-2xl border p-4 text-sm ${
          message.startsWith("✅")
            ? "border-green-200 bg-green-50 text-green-800"
            : message.startsWith("Payment cancelled")
            ? "border-orange-200 bg-orange-50 text-orange-700"
            : "border-black/5 bg-black/[0.03] text-black/70"
        }`}>
          <p>{message}</p>
          {message.startsWith("✅") && (
            <a
              href="/dashboard/customer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-800"
            >
              View in My Dashboard →
            </a>
          )}
        </div>
      ) : (
        <p className="rounded-2xl border border-black/5 bg-black/[0.03] p-4 text-sm text-black/70">
          Use WhatsApp support for urgent booking help.
        </p>
      )}
    </section>
  );
}