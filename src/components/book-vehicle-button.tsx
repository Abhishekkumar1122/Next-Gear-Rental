import Link from "next/link";

export function BookVehicleButton({ className }: { className?: string }) {
  return (
    <Link
      href="/vehicles"
      className={className || "rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/50"}
    >
      Book Now
    </Link>
  );
}

