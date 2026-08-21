import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-rose-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 text-center max-w-lg px-6">
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <span className="font-display text-2xl uppercase font-black tracking-widest text-white">
              {settings.brandName || "NEXT GEAR"}
            </span>
          </div>
        </div>
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-rose-600/40 flex items-center justify-center animate-spin [animation-duration:8s]">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-500/60 flex items-center justify-center animate-spin [animation-duration:4s] [animation-direction:reverse]">
                <span className="text-3xl">⚙️</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-rose-600/10 blur-xl" />
          </div>
        </div>
        <h1 className="font-display text-3xl uppercase tracking-widest mb-3 text-white">
          Under Maintenance
        </h1>
        <p className="text-sm text-white/60 leading-relaxed mb-8">
          {settings.maintenanceMessage || "We are upgrading your ride experience. Back in a few minutes!"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition">
            Try Homepage
          </Link>
          <a href={settings.whatsappUrl || "#"} target="_blank" rel="noopener noreferrer" className="rounded-full bg-red-600 hover:bg-red-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition">
            Contact Support
          </a>
        </div>
        <p className="mt-10 text-[10px] text-white/20 uppercase tracking-widest">
          © {new Date().getFullYear()} {settings.brandName || "Next Gear Rentals"}
        </p>
      </div>
    </div>
  );
}
