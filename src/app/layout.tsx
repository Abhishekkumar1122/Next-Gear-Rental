import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const brandDisplay = Bebas_Neue({
  variable: "--font-brand-display",
  subsets: ["latin"],
  weight: "400",
});

const bodySans = Plus_Jakarta_Sans({
  variable: "--font-body-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next Gear Rentals – Ride Anywhere in India",
  description: "Pan India bike, car, and scooty rental MVP for Indians and NRIs",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextgearrentals.in"),
  openGraph: {
    title: "Next Gear Rentals – Ride Anywhere in India",
    description: "Pan India bike, car, and scooty rentals with airport pickup and instant booking.",
    type: "website",
    siteName: "Next Gear Rentals",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Gear Rentals – Ride Anywhere in India",
    description: "Pan India bike, car, and scooty rentals with airport pickup and instant booking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${brandDisplay.variable} ${bodySans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
