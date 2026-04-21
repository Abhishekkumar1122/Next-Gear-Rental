import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Rental Cities in India | Next Gear Rentals",
  description:
    "Browse Next Gear Rentals city coverage across India, including Delhi NCR, Noida, Punjab, Phagwara, and major airport hubs.",
  alternates: {
    canonical: "/cities",
  },
  openGraph: {
    title: "All Rental Cities in India | Next Gear Rentals",
    description:
      "Browse Next Gear Rentals city coverage across India, including Delhi NCR, Noida, Punjab, Phagwara, and major airport hubs.",
    type: "website",
    url: "/cities",
  },
};

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
