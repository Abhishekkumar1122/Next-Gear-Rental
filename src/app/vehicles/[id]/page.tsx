import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { ReviewSection } from "@/components/review-section";
import { toCurrency } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { bookingsStore } from "@/lib/store";
import { vehicles } from "@/lib/mock-data";
import { getEffectiveDailyPrice } from "@/lib/pricing";
import { WaitlistButton } from "@/components/waitlist-button";
import { Vehicle } from "@/lib/types";
import { getVehicleAvailabilityOverrides } from "@/lib/vehicle-availability-db";
import { adminVehicleStatusStore, resolveVehicleAvailability } from "@/lib/vehicle-availability";
import { getImageMapForVehicles } from "@/lib/vendor-fleet-media";
import { getVehicleNumberMap } from "@/lib/vendor-fleet-vehicle-number";
import { VehicleVideoShowcase } from "@/components/vehicle-video-showcase";
import { DestinationWeatherWidget } from "@/components/destination-weather-widget";
import { VehicleReviews } from "@/components/vehicle-reviews";
import { ShieldCheck, Zap, CheckCircle2, Headphones, MapPin, Sparkles } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

async function getVehicleById(id: string): Promise<Vehicle | null> {
  if (process.env.DATABASE_URL) {
    const [record, activeBookings, overrides, imageMap, vehicleNumberMap] = await Promise.all([
      prisma.vehicle.findUnique({
        where: { id },
        include: { city: true },
      }),
      prisma.booking.findMany({
        where: {
          vehicleId: id,
          status: "CONFIRMED",
          endDate: { gte: new Date() },
        },
        select: { endDate: true },
        orderBy: { endDate: "desc" },
        take: 1,
      }),
      getVehicleAvailabilityOverrides(),
      getImageMapForVehicles([id]),
      getVehicleNumberMap([id]),
    ]);

    if (!record) return null;

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
      ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
      : vehicle.availabilityStatus === "booked"
      ? "bg-blue-950/80 text-blue-400 border-blue-500/40"
      : vehicle.availabilityStatus === "maintenance"
      ? "bg-amber-950/80 text-amber-400 border-amber-500/40"
      : vehicle.availabilityStatus === "crashed"
      ? "bg-rose-950/80 text-rose-400 border-rose-500/40"
      : "bg-red-950/80 text-red-400 border-red-500/40";

  const isBike = vehicle.type.toLowerCase().includes("bike") || vehicle.type.toLowerCase().includes("scoot");
  const fallbackImg = isBike
    ? "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80"
    : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80";

  return (
    <PageShell title="" subtitle="" variant="dark">
      {/* Main Container */}
      <div className="space-y-8 relative">
        {/* Ambient Lighting Orbs */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/15 blur-[140px] pointer-events-none rounded-full" />
        
        {/* Top Breadcrumb & Brand Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-neutral-900/80 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <Link href="/vehicles" className="text-xs font-bold text-white/70 hover:text-white transition flex items-center gap-1">
              ← Fleet Catalog
            </Link>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-2">
              <Image
                src="/Logo1.png"
                alt="Next Gear Logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              />
              <span className="text-xs font-black uppercase tracking-wider text-red-400">Next Gear Verified Fleet</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase shadow-md ${badgeClass}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              {vehicle.availabilityStatus ?? "available"}
            </span>
          </div>
        </div>

        {/* 2-Column Mobile-First Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start relative z-10">
          
          {/* LEFT COLUMN: Media Showcase, Specs, Weather & Reviews */}
          <div className="space-y-8 min-w-0">
            {/* Compact Mobile-Friendly Showcase Container */}
            <div className="rounded-3xl border border-white/15 bg-neutral-950 p-3 shadow-2xl overflow-hidden hover:border-red-500/40 transition-colors duration-500">
              <VehicleVideoShowcase
                title={vehicle.title}
                type={vehicle.type}
                city={vehicle.city}
                seats={vehicle.seats}
                pricePerDayINR={vehicle.pricePerDayINR}
                availabilityStatus={vehicle.availabilityStatus}
                imageUrls={vehicle.imageUrls || []}
                fallbackImage={fallbackImg}
              />
            </div>

            {/* Vehicle Specifications Grid */}
            <div className="rounded-3xl border border-white/15 bg-neutral-900/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-xs uppercase tracking-[0.25em] text-red-400 font-black flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Vehicle Specifications
              </h3>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                <DetailCard label="Fuel Type" value={vehicle.fuel} icon="⛽" />
                <DetailCard label="Transmission" value={vehicle.transmission} icon="⚙️" />
                <DetailCard label="Pickup Point" value={vehicle.airportPickup ? "Airport Pickup" : "City Hub"} icon="📍" />
                <DetailCard label="Seating" value={`${vehicle.seats} Seats`} icon="👤" />
                {vehicle.vehicleNumber ? <DetailCard label="Vehicle No." value={vehicle.vehicleNumber} icon="🔢" /> : null}
                {vehicle.mileageKmpl ? <DetailCard label="Mileage" value={`${vehicle.mileageKmpl} km/l`} icon="🏎️" /> : null}
                {vehicle.engineCc ? <DetailCard label="Engine" value={`${vehicle.engineCc} cc`} icon="⚡" /> : null}
                {vehicle.rangeKm ? <DetailCard label="EV Range" value={`${vehicle.rangeKm} km`} icon="🔋" /> : null}
              </div>
            </div>

            {/* Destination Trip Weather Widget */}
            <DestinationWeatherWidget city={vehicle.city} />

            {/* Verified Rider Reviews Section */}
            <VehicleReviews rating={vehicle.rating ?? 4.9} />
          </div>

          {/* RIGHT COLUMN: Sticky Pricing, Perks & Instant Booking Card */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900/95 via-neutral-950 to-black p-6 sm:p-8 shadow-2xl shadow-red-600/10 backdrop-blur-2xl space-y-6">
              
              {/* Title & Badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/80 border border-blue-500/40 px-3 py-1 text-xs font-bold text-blue-300">
                    <MapPin className="w-3 h-3 text-blue-400" /> {vehicle.city}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-white/80">
                    🏎️ {vehicle.type.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-white/80">
                    👤 {vehicle.seats} SEATS
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider leading-tight">
                  {vehicle.title}
                </h1>
                <p className="text-xs text-white/60 mt-1">Verified self-drive fleet with zero security deposit option.</p>
              </div>

              {/* Price Banner Box */}
              <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-black p-4 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400/80">Daily Rental Rate</p>
                  <p className="text-3xl font-black text-emerald-400 mt-0.5 font-mono">
                    {toCurrency(vehicle.pricePerDayINR, "INR")}
                    <span className="text-xs text-white/60 font-normal"> / day</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                    ⚡ Instant Booking
                  </span>
                </div>
              </div>

              {/* Verified Perks & Guarantees Checklist */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <p className="text-xs uppercase font-bold tracking-wider text-white/50">Next Gear Guarantee</p>
                <div className="space-y-2 text-xs font-bold text-white/90">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Sanitized Helmets & Clean Interiors</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero Security Deposit Option (DigiLocker Verified)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant WhatsApp Booking Pass & E-Receipt</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>24x7 Roadside Assistance & Live Helpline</span>
                  </div>
                </div>
              </div>

              {/* Booking CTA Button */}
              <div className="pt-2">
                {(vehicle.availabilityStatus ?? "available") === "available" ? (
                  <Link
                    href={`/book-vehicle?vehicleId=${encodeURIComponent(vehicle.id)}&city=${encodeURIComponent(vehicle.city)}`}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 py-4 text-sm font-black text-white shadow-2xl shadow-red-600/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/80 active:scale-95 cursor-pointer overflow-hidden"
                  >
                    <span className="relative z-10">Book {vehicle.title} Now →</span>
                  </Link>
                ) : (
                  <WaitlistButton vehicleId={vehicle.id} city={vehicle.city} />
                )}
              </div>

              {/* Availability Calendar Slots */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/50">Open Availability Slots</p>
                <div className="grid gap-2 grid-cols-2">
                  {vehicle.availabilitySlots?.length ? (
                    vehicle.availabilitySlots.slice(0, 4).map((slot) => (
                      <div key={slot.date} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-[11px]">
                        <p className="font-bold text-white">{slot.date}</p>
                        <p className="text-[10px] text-emerald-400 font-medium">Open Slot</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                      <span>Available 365 Days</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReviewSection vehicleId={id} />
    </PageShell>
  );
}

function DetailCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white backdrop-blur-md hover:border-red-500/40 transition-colors shadow-md">
      <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </p>
      <p className="mt-1 font-black text-white text-xs sm:text-sm truncate">{value}</p>
    </div>
  );
}
