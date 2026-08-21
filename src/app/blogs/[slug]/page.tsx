import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BLOG_POSTS } from "@/lib/blogs-data";
import { SiteFooter } from "@/components/site-footer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    return { title: "Article Not Found | Next Gear Travel Desk" };
  }

  return {
    title: `${post.title} | Next Gear Handbooks`,
    description: post.metaDescription,
    keywords: post.targetKeywords,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      images: [{ url: post.featuredImageUrl }],
      type: "article",
    },
  };
}

function RenderArticleBody({ content }: { content: string }) {
  const sections = content.split("\n\n");

  return (
    <div className="space-y-6 text-sm sm:text-base text-white/85 leading-relaxed">
      {sections.map((sec, idx) => {
        const trimmed = sec.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-2xl sm:text-3xl font-black text-white pt-4 pb-2 border-b border-white/10">
              {trimmed.replace("# ", "")}
            </h1>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300 pt-6 pb-1">
              {trimmed.replace("## ", "")}
            </h2>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-lg font-bold text-white pt-4">
              {trimmed.replace("### ", "")}
            </h3>
          );
        }

        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const items = trimmed.split("\n");
          return (
            <ul key={idx} className="space-y-2 pl-4">
              {items.map((it, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/90">
                  <span className="text-[var(--brand-red)] font-black text-base leading-none">•</span>
                  <span>{it.replace(/^[\*\-]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-base text-white/80 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Next Gear Rentals",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nextgear.co.in/Logo1.png"
      }
    },
    "image": post.featuredImageUrl,
    "mainEntityOfPage": `https://nextgear.co.in/blogs/${post.slug}`
  };

  const faqJsonLd = post.faqSchema && post.faqSchema.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqSchema.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-red-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Header Bar */}
      <header className="border-b border-white/10 bg-neutral-900/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <Image src="/Logo1.png" alt="Next Gear Logo" width={36} height={36} className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
            <div>
              <span className="text-xs sm:text-base font-black tracking-wider text-white group-hover:text-[var(--brand-red)] transition">NEXT GEAR</span>
              <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-red-400 font-bold truncate max-w-[120px] sm:max-w-none">Travel & Rental Guides</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold shrink-0">
            <Link href="/blogs" className="text-[11px] sm:text-xs text-white/70 hover:text-white transition whitespace-nowrap">← All Guides</Link>
            <Link href="/vehicles" className="rounded-full bg-[var(--brand-red)] px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs text-white font-bold hover:bg-red-600 transition shadow-md shadow-red-600/30 whitespace-nowrap">
              🏎️ Book Ride
            </Link>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-10 md:py-16">
        {/* Article Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-white/50 mb-4 sm:mb-6 flex-wrap overflow-hidden">
          <Link href="/" className="hover:text-white transition shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link href="/blogs" className="hover:text-white transition shrink-0">Guides</Link>
          <span className="shrink-0">/</span>
          <span className="text-red-400 font-bold truncate max-w-[140px] sm:max-w-none">{post.title}</span>
        </div>

        {/* Title Header */}
        <header className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-xs font-extrabold text-red-400 uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-[10px] sm:text-xs text-white/60">⏱️ {post.readTime}</span>
            <span className="text-[10px] sm:text-xs text-white/60">• 🗓️ {post.publishedAt}</span>
          </div>

          <h1 className="text-xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            {post.title}
          </h1>

          <p className="text-xs sm:text-base text-white/80 leading-relaxed italic border-l-4 border-[var(--brand-red)] pl-3 sm:pl-4 py-1.5 bg-white/5 rounded-r-xl">
            {post.excerpt}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-[var(--brand-red)] flex items-center justify-center font-bold text-[10px] sm:text-xs text-white shadow-md shadow-red-600/30">
              NG
            </div>
            <div>
              <p className="text-xs font-bold text-white">{post.author}</p>
              <p className="text-[9px] sm:text-[10px] text-white/50">Verified Travel & Mobility Desk</p>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative h-48 sm:h-[420px] w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-10 border border-white/10 shadow-2xl">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Body */}
        <RenderArticleBody content={post.content} />

        {/* Call-to-Action Booking Card */}
        <section className="my-8 sm:my-12 rounded-2xl sm:rounded-3xl border border-red-500/40 bg-gradient-to-r from-neutral-950 via-red-950/60 to-neutral-950 p-4 sm:p-10 text-center space-y-3 sm:space-y-4 shadow-2xl shadow-red-900/30">
          <span className="text-2xl sm:text-3xl">🏎️💨</span>
          <h2 className="text-lg sm:text-3xl font-black text-white">Ready for your trip to {post.city}?</h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Book verified self-drive cars, Royal Enfield Himalayan bikes, and automatic scooties with ₹0 security deposit options & doorstep delivery!
          </p>
          <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center pt-2">
            <Link
              href={`/vehicles?city=${post.city}`}
              className="rounded-full bg-[var(--brand-red)] px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-xs font-black text-white hover:bg-red-600 transition shadow-xl shadow-red-600/40"
            >
              Book Ride in {post.city} →
            </Link>
            <Link
              href="/vehicles"
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Explore Entire Fleet
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        {post.faqSchema && post.faqSchema.length > 0 && (
          <section className="my-8 sm:my-12 space-y-4 sm:space-y-6 border-t border-white/10 pt-6 sm:pt-10">
            <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <span>❓</span> Frequently Asked Questions
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {post.faqSchema.map((faq, idx) => (
                <div key={idx} className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/5 p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
                  <h3 className="text-xs sm:text-base font-bold text-white leading-snug">{faq.question}</h3>
                  <p className="text-[11px] sm:text-sm text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
