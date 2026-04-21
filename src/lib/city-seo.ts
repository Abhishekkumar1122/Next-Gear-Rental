import { INDIA_CITIES_BY_STATE } from "@/lib/india-locations";
import { cityConfigs } from "@/lib/mock-data";

export type CityLandingItem = {
  cityName: string;
  stateName: string;
  slug: string;
  airport: string;
  isPriority: boolean;
};

export type PriorityCitySeoContent = {
  intro: string;
  serviceAreas: string[];
  commuteKeywords: string[];
  faq: {
    question: string;
    answer: string;
  }[];
};

export function toCitySlug(cityName: string) {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toStateAwareSlug(cityName: string, stateName: string, duplicateCount: number) {
  const base = toCitySlug(cityName);
  if (duplicateCount <= 1) return base;
  return `${base}-${toCitySlug(stateName)}`;
}

function toAirportLabel(cityName: string, stateName: string) {
  return `${cityName} airport / ${stateName} pickup hub`;
}

export function getCityLandingItems(): CityLandingItem[] {
  const cityNameCounts = new Map<string, number>();
  for (const cities of Object.values(INDIA_CITIES_BY_STATE)) {
    for (const cityName of cities) {
      const key = toCitySlug(cityName);
      cityNameCounts.set(key, (cityNameCounts.get(key) ?? 0) + 1);
    }
  }

  const fallbackAirports = new Map(
    cityConfigs.map((city) => [toCitySlug(city.name), city.airport]),
  );

  const priorityCityKeys = new Set([
    "delhi",
    "delhi-ncr",
    "noida",
    "phagwara",
  ]);

  const items: CityLandingItem[] = [];
  for (const [stateName, cities] of Object.entries(INDIA_CITIES_BY_STATE)) {
    for (const cityName of cities) {
      const cityKey = toCitySlug(cityName);
      const slug = toStateAwareSlug(cityName, stateName, cityNameCounts.get(cityKey) ?? 1);
      items.push({
        cityName,
        stateName,
        slug,
        airport: fallbackAirports.get(cityKey) ?? toAirportLabel(cityName, stateName),
        isPriority: priorityCityKeys.has(cityKey),
      });
    }
  }

  const hasDelhiNcr = items.some((item) => item.slug === "delhi-ncr");
  if (!hasDelhiNcr) {
    items.push({
      cityName: "Delhi NCR",
      stateName: "Delhi",
      slug: "delhi-ncr",
      airport: "Indira Gandhi International Airport",
      isPriority: true,
    });
  }

  return Array.from(new Map(items.map((item) => [item.slug, item])).values()).sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    if (a.cityName !== b.cityName) return a.cityName.localeCompare(b.cityName);
    return a.stateName.localeCompare(b.stateName);
  });
}

export function getCityLandingBySlug(slug: string) {
  return getCityLandingItems().find((item) => item.slug === slug);
}

export function getPriorityCitySeoContent(slug: string): PriorityCitySeoContent | null {
  const map: Record<string, PriorityCitySeoContent> = {
    "delhi-ncr": {
      intro:
        "Delhi NCR rentals are optimized for airport arrivals, business travel, and weekend intercity movement across Delhi, Gurugram, Noida, and Ghaziabad.",
      serviceAreas: [
        "IGI Airport (T1/T2/T3)",
        "Connaught Place",
        "Gurugram Cyber City",
        "Noida Sector 18",
        "Ghaziabad transit hubs",
      ],
      commuteKeywords: ["delhi ncr bike rental", "delhi ncr car rental", "igi airport self drive rental"],
      faq: [
        {
          question: "Can I pickup in Delhi and drop in another NCR city?",
          answer:
            "Yes, cross-city NCR routing is supported on eligible vehicles with transparent fare adjustments shown at checkout.",
        },
        {
          question: "Is airport pickup available for late-night arrivals in Delhi NCR?",
          answer:
            "Yes, time-slot based airport pickup is available for selected vehicles, including late-night windows depending on fleet availability.",
        },
      ],
    },
    noida: {
      intro:
        "Noida rentals are tailored for metro-connected daily commute, IT office corridors, and quick airport transfers with flexible hourly and daily plans.",
      serviceAreas: ["Noida Sector 18", "Noida Sector 62", "Greater Noida", "Pari Chowk", "Yamuna Expressway corridor"],
      commuteKeywords: ["noida bike rental", "noida self drive car", "greater noida scooty rental"],
      faq: [
        {
          question: "Do you provide rentals in Greater Noida and Pari Chowk?",
          answer:
            "Yes, Greater Noida and Pari Chowk are active service zones with availability based on selected date and pickup slot.",
        },
        {
          question: "Can I use a Noida rental for Delhi office commute?",
          answer:
            "Yes, intercity commute between Noida and Delhi is supported with clear distance and usage terms at booking time.",
        },
      ],
    },
    phagwara: {
      intro:
        "Phagwara rentals support local city rides, Punjab highway travel, and student mobility with quick verification and budget-friendly plans.",
      serviceAreas: ["Phagwara city center", "LPU area", "GT Road corridor", "Jalandhar route", "Ludhiana route"],
      commuteKeywords: ["phagwara bike rental", "phagwara car rental", "punjab self drive rental"],
      faq: [
        {
          question: "Is vehicle pickup available near LPU in Phagwara?",
          answer:
            "Yes, pickup around major student and residential zones including LPU-side locations is available for supported vehicles.",
        },
        {
          question: "Can I book for Punjab intercity travel from Phagwara?",
          answer:
            "Yes, intercity travel across Punjab is available with plan and distance conditions visible before payment.",
        },
      ],
    },
    delhi: {
      intro:
        "Delhi rentals are designed for airport arrivals, office commute, and city touring with instant booking and transparent pricing.",
      serviceAreas: ["IGI Airport", "South Delhi", "Connaught Place", "Karol Bagh", "Dwarka"],
      commuteKeywords: ["delhi bike rental", "delhi airport car rental", "self drive in delhi"],
      faq: [
        {
          question: "Do you offer airport pickup in Delhi?",
          answer: "Yes, IGI airport pickup is available for selected inventory and time slots.",
        },
        {
          question: "Are hourly rentals available in Delhi?",
          answer: "Yes, you can choose hourly, daily, and extended plans directly while booking.",
        },
      ],
    },
  };

  return map[slug] ?? null;
}
