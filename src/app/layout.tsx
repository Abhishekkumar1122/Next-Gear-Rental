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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app";

export const metadata: Metadata = {
  title: {
    default: "Next Gear Rentals – Ride Anywhere in India",
    template: "%s | Next Gear Rentals",
  },
  description: "Next Gear Rentals - Pan India self-drive bike, car, and scooty rental service. Instant booking, verified fleets across 24+ Indian cities for locals & NRIs.",
  keywords: [
    "Next Gear",
    "Next Gear Rentals",
    "Next Gear Logo",
    "Next Gear App",
    "Next Gear Rental India",
    "Self Drive Bike Rental India",
    "Car Rental India",
    "NRI Scooter Rental",
    "Bengaluru Car Rental",
    "Mumbai Bike Rental",
    "Next Gear Instagram",
    "Next Gear Rentals Instagram",
    "NextGear Instagram",
    "_nextgear_rentals",
    "Next Gear Official Instagram",
    "Next Gear Rental Instagram Profile"
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Next Gear Rentals – Ride Anywhere in India",
    description: "Pan India bike, car, and scooty rentals with airport pickup, verified fleets, and instant booking.",
    url: siteUrl,
    type: "website",
    siteName: "Next Gear Rentals",
    locale: "en_IN",
    images: [
      {
        url: `${siteUrl}/Logo1.png`,
        width: 512,
        height: 512,
        alt: "Next Gear Rentals Official Brand Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Gear Rentals – Ride Anywhere in India",
    description: "Pan India bike, car, and scooty rentals with airport pickup and instant booking.",
    images: [`${siteUrl}/Logo1.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLdOrgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "Next Gear Rentals",
      "alternateName": ["Next Gear", "NextGear", "Next Gear App", "Next Gear India", "_nextgear_rentals"],
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "@id": `${siteUrl}/#logo`,
        "url": `${siteUrl}/Logo1.png`,
        "caption": "Next Gear Rentals Official Brand Logo",
        "width": "512",
        "height": "512"
      },
      "image": `${siteUrl}/Logo1.png`,
      "description": "Next Gear Rentals is India's premier self-drive bike, car, and scooty rental service operating across 12+ states and 24+ cities.",
      "sameAs": [
        siteUrl,
        "https://www.instagram.com/_nextgear_rentals",
        "https://www.instagram.com/_nextgear_rentals?igsh=eDIwN25md2dpYWN1"
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "Next Gear Rentals",
      "publisher": {
        "@id": `${siteUrl}/#organization`
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="me" href="https://www.instagram.com/_nextgear_rentals" />
        <link rel="me" href="https://www.instagram.com/_nextgear_rentals?igsh=eDIwN25md2dpYWN1" />
        <script
          id="json-ld-org"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrgSchema) }}
        />
      </head>
      <body
        className={`${brandDisplay.variable} ${bodySans.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
