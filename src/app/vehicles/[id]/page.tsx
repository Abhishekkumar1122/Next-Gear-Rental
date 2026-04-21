import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { ReviewSection } from "@/components/review-section";
import { vehicles, toCurrency } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { WaitlistButton } from "@/components/waitlist-button";
import { Vehicle } from "@/lib/types";
import { getVehicleAvailabilityOverrides } from "@/lib/vehicle-availability-db";
import { adminVehicleStatusStore, resolveVehicleAvailability } from "@/lib/vehicle-availability";
import { getImageMapForVehicles } from "@/lib/vendor-fleet-media";
import { getVehicleNumberMap } from "@/lib/vendor-fleet-vehicle-number";

type Props = {
  params: Promise<{ id: string }>;
};

async function getVehicleById(id: string): Promise<Vehicle | null> {
  if (process.env.DATABASE_URL) {
    const record = await prisma.vehicle.findUnique({
      where: { id },
      include: { city: true },
    });

    if (!record) return null;

    const activeBookings = await prisma.booking.findMany({
      where: {
        vehicleId: id,
        status: "CONFIRMED",
        endDate: { gte: new Date() },
      },
      select: { endDate: true },
      orderBy: { endDate: "desc" },
      take: 1,
    });

    const overrides = await getVehicleAvailabilityOverrides();
    const override = overrides.get(id);
    const hasActiveBooking = activeBookings.length > 0;
    const availabilityStatus = resolveVehicleAvailability({
      vehicleId: id,
      hasActiveBooking,
      override,
    });
    const bookedUntil = activeBookings[0]?.endDate.toISOString().slice(0, 10);
    const availabilityMessage =
      availabilityStatus === "booked"
        ? `Booked until ${bookedUntil ?? "upcoming date"}`
        : availabilityStatus === "maintenance"
        ? override?.note || "Under maintenance"
        : availabilityStatus === "crashed"
        ? override?.note || "Temporarily unavailable due to incident"
        : availabilityStatus === "unavailable"
        ? override?.note || "Currently unavailable"
        : "Available now";

      const imageMap = await getImageMapForVehicles([id]);
      const vehicleNumberMap = await getVehicleNumberMap([id]);

    return {
      id: record.id,
      title: record.title,
      city: record.city.name,
      type: record.type as Vehicle["type"],
      fuel: record.fuel as Vehicle["fuel"],
      transmission: record.transmission as Vehicle["transmission"],
      seats: record.seats,
      pricePerDayINR: getEffectiveDailyPrice(record.type, record.pricePerDayINR),
      availableDates: [],
      vendorId: record.vendorId ?? undefined,
      airportPickup: record.airportPickup,
      availabilityStatus,
      availabilityMessage,
      bookedUntil,
      adminNote: override?.note,
      imageUrls: imageMap.get(id) ?? [],
      vehicleNumber: vehicleNumberMap.get(id),
    };
  }

  const vehicle = vehicles.find((item) => item.id === id) ?? null;
  if (!vehicle) return null;
  const todayIso = new Date().toISOString().slice(0, 10);

  const hasActiveBooking = bookingsStore.some(
    (entry) => entry.vehicleId === id && entry.status === "confirmed" && entry.endDate >= todayIso,
  );
  const override = adminVehicleStatusStore[id];
  const bookedUntil = bookingsStore
    .filter((entry) => entry.vehicleId === id && entry.status === "confirmed" && entry.endDate >= todayIso)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0]?.endDate;

  const availabilityStatus = resolveVehicleAvailability({
    vehicleId: id,
    hasActiveBooking,
    override,
  });
  const availabilityMessage =
    availabilityStatus === "booked"
      ? `Booked until ${bookedUntil ?? "upcoming date"}`
      : availabilityStatus === "maintenance"
      ? override?.note || "Under maintenance"
      : availabilityStatus === "crashed"
      ? override?.note || "Temporarily unavailable due to incident"
      : availabilityStatus === "unavailable"
      ? override?.note || "Currently unavailable"
      : "Available now";

  return {
    ...vehicle,
    pricePerDayINR: getEffectiveDailyPrice(vehicle.type, vehicle.pricePerDayINR),
    availabilityStatus,
    availabilityMessage,
    bookedUntil,
    adminNote: override?.note,
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const badgeClass =
    vehicle.availabilityStatus === "available"
      ? "bg-green-50 text-green-700 border-green-200"
      : vehicle.availabilityStatus === "booked"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : vehicle.availabilityStatus === "maintenance"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : vehicle.availabilityStatus === "crashed"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <PageShell
      title={vehicle.title}
      subtitle={`Explore details, pricing, and availability in ${vehicle.city}.`}
    >
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Vehicle details</p>
            <h2 className="mt-1 text-xl font-semibold">{vehicle.title}</h2>
            <p className="mt-2 text-sm text-black/70">
              {vehicle.city} · {vehicle.type.toUpperCase()} · {vehicle.seats} seats
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${badgeClass}`}>
                {vehicle.availabilityStatus ?? "available"}
              </span>
              <span className="text-xs text-black/60">{vehicle.availabilityMessage ?? "Available now"}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Price</p>
            <p className="text-2xl font-semibold text-[var(--brand-red)]">
              {toCurrency(vehicle.pricePerDayINR, "INR")} / day
            </p>
          </div>
        </div>

        {vehicle.imageUrls?.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-black/10">
              <img
                src={vehicle.imageUrls[0]}
                alt={vehicle.title}
                className="h-64 w-full object-cover"
              />
            </div>
            <div className="grid gap-3">
              {vehicle.imageUrls.slice(1, 3).map((url, index) => (
                <div key={`${vehicle.id}-thumb-${index}`} className="overflow-hidden rounded-2xl border border-black/10">
                  <img src={url} alt={`${vehicle.title} view ${index + 2}`} className="h-30 w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-black/10 bg-black/5 p-6 text-sm text-black/60">
            Vehicle gallery will be available soon.
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <DetailCard label="Fuel" value={vehicle.fuel} />
          <DetailCard label="Transmission" value={vehicle.transmission} />
          {vehicle.vehicleNumber ? <DetailCard label="Vehicle Number" value={vehicle.vehicleNumber} /> : null}
          <DetailCard label="Pickup" value={vehicle.airportPickup ? "Airport pickup available" : "City pickup only"} />
          <DetailCard label="Seats" value={`${vehicle.seats} seats`} />
          {vehicle.mileageKmpl ? <DetailCard label="Mileage" value={`${vehicle.mileageKmpl} km/l`} /> : null}
          {vehicle.engineCc ? <DetailCard label="Engine" value={`${vehicle.engineCc} cc`} /> : null}
          {vehicle.rangeKm ? <DetailCard label="Range" value={`${vehicle.rangeKm} km`} /> : null}
          {vehicle.rating ? <DetailCard label="Rating" value={`${vehicle.rating.toFixed(1)} / 5`} /> : null}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Availability calendar</h3>
          <p className="mt-1 text-xs text-black/60">Highlighted dates are available.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {vehicle.availabilitySlots?.length ? (
              vehicle.availabilitySlots.slice(0, 6).map((slot) => (
                <div key={slot.date} className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs">
                  <p className="font-semibold text-black">{slot.date}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {slot.slots.slice(0, 6).map((time) => (
                      <span key={`${slot.date}-${time}`} className="rounded-full border border-black/15 bg-white px-2 py-0.5">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : vehicle.availableDates.length === 0 ? (
              <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs">Schedule on request</span>
            ) : (
              vehicle.availableDates.slice(0, 12).map((date) => (
                <div key={date} className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs">
                  <p className="font-semibold text-black">{date}</p>
                  <p className="text-black/60">Available</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/vehicles"
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
          >
            Back to catalog
          </Link>
          <Link
            href={
              (vehicle.availabilityStatus ?? "available") === "available"
                ? `/book-vehicle?vehicleId=${encodeURIComponent(vehicle.id)}&city=${encodeURIComponent(vehicle.city)}`
                : "#"
            }
            aria-disabled={(vehicle.availabilityStatus ?? "available") !== "available"}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              (vehicle.availabilityStatus ?? "available") === "available"
                ? "bg-[var(--brand-red)] text-white shadow-lg shadow-red-500/25 hover:-translate-y-0.5"
                : "border border-black/15 text-black/50 cursor-not-allowed"
            }`}
          >
            {(vehicle.availabilityStatus ?? "available") === "available" ? "Book now" : "Not available"}
          </Link>
          {(vehicle.availabilityStatus ?? "available") !== "available" ? (
            <WaitlistButton vehicleId={vehicle.id} city={vehicle.city} />
          ) : null}
        </div>
      </section>

      <ReviewSection vehicleId={id} />
    </PageShell>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-black/50">{label}</p>
      <p className="mt-2 font-semibold text-black">{value}</p>
    </div>
  );
}
