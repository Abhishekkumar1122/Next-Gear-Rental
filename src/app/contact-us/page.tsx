import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSiteSettings } from "@/lib/site-settings";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export default async function ContactUsPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        
        <SiteHeader variant="dark" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
        <section className="relative z-10">
          <h1 className="text-4xl font-semibold md:text-5xl mb-3 text-white">Contact Us</h1>
          <p className="text-base text-white/75">Reach our support and business teams for assistance, disputes, or partnerships.</p>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
            <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-semibold text-white">Contact Information</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <Mail className="w-5 h-5 text-[var(--brand-red)] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-white/60">Support Email</p>
                  <p className="text-sm font-semibold text-white">{settings.supportEmail}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Mail className="w-5 h-5 text-[var(--brand-red)] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-white/60">Business Email</p>
                  <p className="text-sm font-semibold text-white">{settings.businessEmail}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-[var(--brand-red)] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-white/60">Phone</p>
                  <p className="text-sm font-semibold text-white">{settings.phone}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15">
                <p className="text-sm text-white/80">Hours: <span className="text-[var(--brand-red)] font-semibold">24x7 Support</span></p>
              </div>
            </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-white mb-4">Send us a Message</h2>
            <p className="text-sm text-white/80 mb-6">
              Need to send us a detailed message? Use our contact form for faster response.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-[var(--brand-red)] text-white rounded-lg font-semibold hover:bg-[var(--brand-red)]/90 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30"
            >
              Open Contact Form
            </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
