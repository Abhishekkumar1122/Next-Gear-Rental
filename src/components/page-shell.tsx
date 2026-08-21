import { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type PageShellProps = {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  children: ReactNode;
  variant?: "light" | "dark";
  plainHeader?: boolean;
  hideFooterOnMobile?: boolean;
};

export function PageShell({ title, subtitle, children, variant = "light", plainHeader = false, hideFooterOnMobile = false }: PageShellProps) {
  const isDark = variant === "dark";

  return (
    <div className={isDark ? "min-h-screen bg-[var(--brand-ink)] text-white" : "min-h-screen bg-[var(--brand-cream)] text-black"}>
      <div className={`sticky top-0 z-50 ${isDark ? "bg-[var(--brand-ink)]" : "bg-white"}`}>
        <SiteHeader variant={isDark ? "dark" : "light"} />
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
        {title ? (
          plainHeader ? (
            <div className="relative z-10 px-2">
              <h1 className={isDark ? "text-3xl sm:text-4xl font-semibold text-white md:text-5xl" : "text-2xl sm:text-3xl font-semibold"}>
                {title}
              </h1>
              <p className={isDark ? "mt-3 text-base text-white/70" : "mt-2 text-sm text-black/70"}>{subtitle}</p>
            </div>
          ) : (
            <section className={isDark ? "relative rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 shadow-2xl shadow-red-500/15 md:p-10" : "rounded-2xl border border-black/10 bg-white p-6 shadow-sm"}>
              {isDark && (
                <>
                  <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
                  <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
                </>
              )}
              <div className={isDark ? "relative z-10" : ""}>
                <h1 className={isDark ? "text-3xl sm:text-4xl font-semibold text-white md:text-5xl" : "text-2xl sm:text-3xl font-semibold"}>
                  {title}
                </h1>
                <p className={isDark ? "mt-4 max-w-2xl text-sm text-white/75 md:text-base" : "mt-2 text-sm text-black/70"}>{subtitle}</p>
              </div>
            </section>
          )
        ) : null}
        {children}
      </main>
      <div className={hideFooterOnMobile ? "hidden sm:block" : ""}>
        <SiteFooter />
      </div>
    </div>
  );
}
