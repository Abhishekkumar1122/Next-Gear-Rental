import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next Gear Rentals',
    short_name: 'Next Gear',
    description: 'Ride Anywhere in India - Premier Self-Drive Bike, Car, and Scooty Rentals',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#e11d48',
    icons: [
      {
        src: '/Logo1.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/Logo1.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
