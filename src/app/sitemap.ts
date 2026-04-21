import type { MetadataRoute } from "next";
import { getCityLandingItems } from "@/lib/city-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextgearrentals.in";
  const now = new Date();

  const staticRoutes = [
    "",
    "/cities",
    "/vehicles",
    "/pricing",
    "/about",
    "/contact",
    "/contact-us",
    "/nri-rentals",
    "/faq",
    "/terms-privacy",
    "/terms-and-conditions",
    "/privacy-policy",
    "/shipping-policy",
    "/refund-policy",
    "/cancellation-and-refunds",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/cities" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/cities" ? 0.9 : 0.7,
  }));

  const cityEntries: MetadataRoute.Sitemap = getCityLandingItems().map((city) => ({
    url: `${baseUrl}/cities/${city.slug}`,
    lastModified: now,
    changeFrequency: city.isPriority ? "daily" : "weekly",
    priority: city.isPriority ? 0.85 : 0.65,
  }));

  return [...staticEntries, ...cityEntries];
}
