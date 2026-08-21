import Link from "next/link";
import Image from "next/image";
import { BLOG_POSTS } from "@/lib/blogs-data";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Self-Drive Car & Bike Rental Guides | Next Gear Travel Desk",
  description: "Explore official self-drive car rental & bike rental travel guides. Tips for Thar rentals in Goa, Royal Enfield in Manali & scooties in Delhi.",
  keywords: [
    "car rental near me",
    "bike rental near me",
    "car rent in Delhi",
    "bike rent in Manali",
    "scooty rental Delhi",
    "self drive car Goa",
    "Next Gear travel guides",
  ],
  openGraph: {
    title: "Self-Drive Car & Bike Rental Travel Guides | Next Gear",
    description: "Expert travel guides, city pricing breakdowns, and driving rules across India.",
  },
};

export default function BlogsIndexPage() {
  const featuredPost = BLOG_POSTS[0];
  const regularPosts = BLOG_POSTS.slice(1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Next Gear Travel & Rental Guides",
    "description": "Expert guides on car rental, bike rental, and city road trips across India.",
    "publisher": {
      "@type": "Organization",
      "name": "Next Gear Rentals",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nextgear.co.in/Logo1.png"
      }
    },
    "blogPost": BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.publishedAt,
      "url": `https://nextgear.co.in/blogs/${post.slug}`,
      "image": post.featuredImageUrl,
    }))
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-red-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <Link href="/" className="hidden sm:inline hover:text-red-400 transition whitespace-nowrap">Home</Link>
            <Link href="/vehicles" className="hidden sm:inline hover:text-red-400 transition whitespace-nowrap">Fleet</Link>
            <Link href="/cities" className="hidden sm:inline hover:text-red-400 transition whitespace-nowrap">Cities</Link>
            <Link href="/blogs" className="text-red-400 font-bold whitespace-nowrap">Guides</Link>
            <Link href="/vehicles" className="rounded-full bg-[var(--brand-red)] px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs text-white font-bold hover:bg-red-600 transition shadow-md shadow-red-600/30 whitespace-nowrap">
              🏎️ Book Ride
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Magazine Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-red-950/50 via-neutral-950 to-neutral-950 px-6 py-16 md:py-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />

          <div className="relative mx-auto max-w-4xl text-center space-y-4">
            <span className="inline-block rounded-full bg-red-500/10 border border-red-500/30 px-4 py-1.5 text-xs font-black text-red-400 tracking-widest uppercase shadow-lg">
              ⚡ BUDGET FRIENDLY RENTALS STARTING @ ₹99/HR
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white leading-tight">
              Self-Drive Car & Bike <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
                Budget Rental Guides
              </span>
            </h1>
            <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">
              Find budget-friendly self-drive cars, Himalayan motorcycles, and automatic scooters starting at just <strong className="text-white">₹99/hour or ₹399/day</strong> with ₹0 deposit across Delhi, Goa, Manali, and Mumbai.
            </p>
          </div>
        </section>

        {/* Featured Cover Story */}
        {featuredPost && (
          <section className="mx-auto max-w-6xl px-6 -mt-8 relative z-20">
            <div className="group rounded-3xl border border-white/15 bg-neutral-900/90 overflow-hidden shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-red-500/50">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden bg-neutral-950">
                  <Image
                    src={featuredPost.featuredImageUrl}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1 shadow-lg">
                    ⭐ Cover Story
                  </span>
                </div>
                <div className="p-6 md:p-10 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-white/60">
                      <span className="text-red-400 font-bold">{featuredPost.category}</span>
                      <span>•</span>
                      <span>{featuredPost.readTime}</span>
                      <span>•</span>
                      <span>{featuredPost.publishedAt}</span>
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-white group-hover:text-red-400 transition-colors leading-tight">
                      <Link href={`/blogs/${featuredPost.slug}`}>{featuredPost.title}</Link>
                    </h2>
                    <p className="text-xs md:text-sm text-white/75 leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white">
                        NG
                      </div>
                      <span className="text-xs text-white/70 font-semibold">{featuredPost.author}</span>
                    </div>
                    <Link
                      href={`/blogs/${featuredPost.slug}`}
                      className="rounded-full bg-[var(--brand-red)] px-5 py-2 text-xs font-bold text-white hover:bg-red-600 transition shadow-lg shadow-red-600/30"
                    >
                      Read Full Article →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Regular Articles Grid */}
        <section className="mx-auto max-w-6xl px-6 py-12 md:py-16 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Latest Destination Handbooks</h2>
              <p className="text-xs text-white/60">Verified advice for road trips, vehicle selection, and rental policies</p>
            </div>
            <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
              {BLOG_POSTS.length} Published Handbooks
            </span>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col rounded-2xl border border-white/15 bg-white/5 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-600/10"
              >
                <div className="relative h-52 w-full overflow-hidden bg-neutral-900">
                  <Image
                    src={post.featuredImageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-neutral-950/90 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold text-red-400 border border-white/10">
                    {post.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-white/50 font-medium">
                    <span>{post.publishedAt}</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors leading-snug">
                    <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  <div className="pt-3 flex items-center justify-between border-t border-white/10">
                    <span className="text-[10px] text-white/50 font-medium">Hub: {post.city}</span>
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Read Guide →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Popular Rental Hubs Section */}
        <section className="border-t border-white/10 bg-neutral-900/60 px-6 py-12">
          <div className="mx-auto max-w-6xl space-y-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-center">
              🔥 Popular Rental Destinations & City Fleet
            </h2>
            <div className="flex flex-wrap gap-2.5 justify-center text-xs">
              <Link href="/vehicles?city=Delhi&type=car" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:border-red-500 hover:text-white transition">
                🏎️ Car Rental in Delhi
              </Link>
              <Link href="/vehicles?city=Manali&type=bike" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:border-red-500 hover:text-white transition">
                🏍️ Bike Rental in Manali
              </Link>
              <Link href="/vehicles?city=Goa&type=car" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:border-red-500 hover:text-white transition">
                🏖️ Self Drive Car Rental Goa
              </Link>
              <Link href="/vehicles?city=Delhi&type=scooty" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:border-red-500 hover:text-white transition">
                🛵 Scooty Rental Delhi
              </Link>
              <Link href="/vehicles?city=Mumbai&type=car" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:border-red-500 hover:text-white transition">
                🚗 Car Rental Mumbai Airport
              </Link>
              <Link href="/nri-rentals" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:border-red-500 hover:text-white transition">
                🌍 NRI Self Drive Rentals
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
