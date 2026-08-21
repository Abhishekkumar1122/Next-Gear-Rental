import type { MetadataRoute } from "next";
import { getCityLandingItems } from "@/lib/city-seo";
import { BLOG_POSTS } from "@/lib/blogs-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";
  const now = new Date();

  const staticRoutes = [
    "",
    "/blogs",
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
    changeFrequency: path === "" || path === "/blogs" || path === "/cities" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/blogs" || path === "/cities" ? 0.9 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const cityEntries: MetadataRoute.Sitemap = getCityLandingItems().map((city) => ({
    url: `${baseUrl}/cities/${city.slug}`,
    lastModified: now,
    changeFrequency: city.isPriority ? "daily" : "weekly",
    priority: city.isPriority ? 0.85 : 0.65,
  }));

  return [...staticEntries, ...blogEntries, ...cityEntries];
}
