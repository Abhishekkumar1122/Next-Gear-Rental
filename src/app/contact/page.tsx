import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactContainerInteractive } from "@/components/contact-container-interactive";
import { getSiteSettings } from "@/lib/site-settings";
import { Headphones, ShieldCheck, MapPin, Zap, MessageSquare } from "lucide-react";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-red-600 selection:text-white flex flex-col justify-between relative overflow-x-clip">
      {/* Animated Floating Background Aura Orbs */}
      <div className="absolute top-[10%] left-[-5%] h-[450px] w-[450px] rounded-full bg-red-600/15 blur-[150px] animate-float-slow pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-5%] h-[400px] w-[400px] rounded-full bg-rose-600/15 blur-[160px] animate-float-reverse pointer-events-none z-0" style={{ animationDelay: "-4s" }} />
      <div className="absolute bottom-[10%] left-[20%] h-[350px] w-[350px] rounded-full bg-amber-600/10 blur-[140px] animate-float-slow pointer-events-none z-0" style={{ animationDelay: "-2s" }} />

      {/* Sticky Glassmorphic Header */}
      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      {/* Main Contact Section */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-10 md:py-12 flex-grow space-y-8">
        
        {/* Futuristic Hero Banner with Animated Laser Border & Glow */}
        <section className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900/90 via-black to-red-950/30 p-6 sm:p-10 shadow-2xl shadow-red-600/10 animate-pulse-glow">
          {/* Top Animated Laser Beam Sweep */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-laser-sweep" />

          {/* Background Ambient Glow Spotlights */}
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-red-600/20 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-rose-600/15 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl animate-slide-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/60 px-3.5 py-1 text-xs font-bold text-red-300 shadow-md shadow-red-600/20">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <Headphones className="w-3.5 h-3.5 text-red-400" />
                <span>Next Gear Concierge Desk • 24/7 Active</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-wider text-white leading-tight">
                How Can We <span className="gradient-text-brand">Help You</span> Today?
              </h1>

              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Have questions about bike or car rentals, airport drop-offs, booking modifications, or vendor onboarding? We are at your service 24x7.
              </p>
            </div>

            {/* Quick Live Guarantee Badges with Hover Scale */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0 animate-slide-right">
              <div className="group/chip rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md flex items-center gap-2.5 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:scale-105">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 group-hover/chip:rotate-12 transition-transform" />
                <div>
                  <p className="text-[10px] font-mono text-white/50 uppercase font-bold">Guarantee</p>
                  <p className="text-xs font-bold text-white">Verified Fleets</p>
                </div>
              </div>

              <div className="group/chip rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md flex items-center gap-2.5 transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-950/30 hover:scale-105">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 group-hover/chip:rotate-12 transition-transform" />
                <div>
                  <p className="text-[10px] font-mono text-white/50 uppercase font-bold">Speed</p>
                  <p className="text-xs font-bold text-white">Instant Booking</p>
                </div>
              </div>

              <div className="group/chip rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md flex items-center gap-2.5 transition-all duration-300 hover:border-rose-500/50 hover:bg-rose-950/30 hover:scale-105">
                <MapPin className="w-5 h-5 text-rose-400 shrink-0 group-hover/chip:rotate-12 transition-transform" />
                <div>
                  <p className="text-[10px] font-mono text-white/50 uppercase font-bold">Coverage</p>
                  <p className="text-xs font-bold text-white">120+ Indian Cities</p>
                </div>
              </div>

              <div className="group/chip rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md flex items-center gap-2.5 transition-all duration-300 hover:border-red-500/50 hover:bg-red-950/30 hover:scale-105">
                <MessageSquare className="w-5 h-5 text-red-400 shrink-0 group-hover/chip:rotate-12 transition-transform" />
                <div>
                  <p className="text-[10px] font-mono text-white/50 uppercase font-bold">Support</p>
                  <p className="text-xs font-bold text-white">24/7 Live Desk</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reel-Inspired Interactive Split Container */}
        <ContactContainerInteractive settings={settings} />

      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
