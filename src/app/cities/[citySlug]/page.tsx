import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getCityLandingBySlug, getCityLandingItems, getPriorityCitySeoContent } from "@/lib/city-seo";

type Props = {
  params: Promise<{ citySlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getCityLandingBySlug(citySlug);
  if (!city) {
    return { title: "City not found | Next Gear Rentals" };
  }
  const priorityContent = getPriorityCitySeoContent(city.slug);

  const location = `${city.cityName}, ${city.stateName}`;
  const title = `Bike & Car Rental in ${location} | Next Gear Rentals`;
  const description = `Book bike, scooty, and car rentals in ${location} with airport pickup, verified fleet, transparent pricing, and instant booking confirmation.`;

  return {
    title,
    description,
    keywords: [
      `bike rental ${city.cityName}`,
      `car rental ${city.cityName}`,
      `scooty rental ${city.cityName}`,
      `${city.cityName} airport vehicle rental`,
      `self drive rental ${city.cityName}`,
      ...(priorityContent?.commuteKeywords ?? []),
    ],
    alternates: { canonical: `/cities/${city.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/cities/${city.slug}`,
      siteName: "Next Gear Rentals",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CityLandingPage({ params }: Props) {
  const { citySlug } = await params;
  const city = getCityLandingBySlug(citySlug);
  if (!city) notFound();
  const priorityContent = getPriorityCitySeoContent(city.slug);

  const related = getCityLandingItems()
    .filter((item) => item.slug !== city.slug && item.stateName === city.stateName)
    .slice(0, 8);
  const fallbackRelated =
    related.length > 0
      ? related
      : getCityLandingItems().filter((item) => item.slug !== city.slug).slice(0, 8);

  const location = `${city.cityName}, ${city.stateName}`;
  const cityPageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextgearrentals.in"}/cities/${city.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": cityPageUrl,
        name: `Bike & Car Rental in ${location}`,
        description: `Book bike, scooty, and car rentals in ${location} with airport and city pickup options.`,
        url: cityPageUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextgearrentals.in"}/` },
          { "@type": "ListItem", position: 2, name: "Cities", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextgearrentals.in"}/cities` },
          { "@type": "ListItem", position: 3, name: location, item: cityPageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: (priorityContent?.faq?.length
          ? priorityContent.faq
          : [
              {
                question: `Can I book airport pickup in ${city.cityName}?`,
                answer: `Yes. Next Gear supports airport and nearby hub pickup in ${city.cityName} based on vehicle availability and time slot selection.`,
              },
              {
                question: `Do you offer hourly and daily rentals in ${city.cityName}?`,
                answer: `Yes. You can choose hourly, daily, and extended plans in ${city.cityName} with instant booking confirmation.`,
              },
            ]
        ).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <PageShell
      title={`Bike & Car Rental in ${location}`}
      subtitle={`Airport-ready fleet in ${location} with quick verification, transparent pricing, and same-day pickup options.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">City guide</p>
        <h2 className="mt-1 text-xl font-semibold">Why rent in {location}?</h2>
        <p className="mt-2 text-sm text-black/70">
          Get bikes and cars near {city.airport}. Choose hourly or daily rentals with digital KYC, real-time availability,
          and transparent pricing.
        </p>
        {priorityContent ? (
          <p className="mt-3 rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black/75">
            {priorityContent.intro}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/book-vehicle?city=${encodeURIComponent(city.cityName)}`}
            className="rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/25"
          >
            Book in {city.cityName}
          </Link>
          <Link
            href={`/vehicles?city=${encodeURIComponent(city.cityName)}`}
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-semibold"
          >
            View vehicles
          </Link>
        </div>
      </section>

      {priorityContent ? (
        <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Top service areas in {city.cityName}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {priorityContent.serviceAreas.map((area) => (
              <p key={area} className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/75">
                {area}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">FAQs for {location} rentals</h3>
        <div className="mt-3 space-y-3 text-sm text-black/75">
          {(priorityContent?.faq?.length
            ? priorityContent.faq
            : [
                {
                  question: `Can I book airport pickup in ${city.cityName}?`,
                  answer: `Yes. Airport and nearby pickup hubs are available in ${city.cityName} for selected vehicles.`,
                },
                {
                  question: `Do you support daily and hourly booking plans in ${city.cityName}?`,
                  answer: `Yes. You can select hourly, daily, and extended plans based on your trip duration.`,
                },
              ]
          ).map((item) => (
            <div key={item.question} className="rounded-xl border border-black/10 p-3">
              <p className="font-medium text-black">{item.question}</p>
              <p className="mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Explore more cities in and around {city.stateName}</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {fallbackRelated.map((item) => (
            <Link
              key={item.slug}
              href={`/cities/${item.slug}`}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm transition hover:bg-black/5"
            >
              Bike rental in {item.cityName}, {item.stateName}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
