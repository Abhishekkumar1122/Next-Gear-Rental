import indiaCitiesByState from "@/lib/india-cities-by-state.json";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export const INDIA_CITIES_BY_STATE: Record<string, string[]> = Object.fromEntries(
  Object.entries(indiaCitiesByState).map(([state, cities]) => [state, uniqueSorted(cities)])
);

export const INDIA_STATES = Object.keys(INDIA_CITIES_BY_STATE).sort((a, b) => a.localeCompare(b));

export const INDIA_CITY_STATE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(INDIA_CITIES_BY_STATE).flatMap(([state, cities]) => cities.map((city) => [city, state]))
);

export function formatCityWithState(cityName: string, stateName?: string) {
  if (!stateName?.trim()) return cityName.trim();
  const city = cityName.trim();
  const state = stateName.trim();
  if (!city) return state;
  return `${city}, ${state}`;
}

export function splitCityAndState(cityValue: string) {
  const value = cityValue.trim();
  if (!value) return { city: "", state: "" };

  if (value.includes(",")) {
    const [city, ...rest] = value.split(",");
    return {
      city: city.trim(),
      state: rest.join(",").trim(),
    };
  }

  return {
    city: value,
    state: INDIA_CITY_STATE_MAP[value] ?? "",
  };
}

export type CityConfig = {
  name: string;
  airport: string;
};

export const cityConfigs: CityConfig[] = Object.entries(INDIA_CITIES_BY_STATE).flatMap(
  ([state, cities]) => cities.map((city) => ({
    name: `${city}, ${state}`,
    airport: `${city} Airport`,
  }))
);

export type AirportHubConfig = {
  id: string;
  name: string;
  code: string;
  cityName: string;
  badge: string;
};

export const MAJOR_AIRPORT_HUBS: AirportHubConfig[] = [
  { id: "goa-dabolim", name: "Goa Dabolim Airport (GOI)", code: "GOI", cityName: "Goa, Goa", badge: "Goa Airport" },
  { id: "goa-mopa", name: "Manohar Airport (Mopa - GOX)", code: "GOX", cityName: "Goa, Goa", badge: "North Goa" },
  { id: "delhi-t3", name: "Delhi IGI Airport (T3 / T2)", code: "DEL", cityName: "Delhi NCR, Delhi", badge: "24x7 Airport Hub" },
  { id: "bangalore-t1", name: "Kempegowda Airport (BLR)", code: "BLR", cityName: "Bengaluru, Karnataka", badge: "Express Hub" },
  { id: "mumbai-t2", name: "Mumbai Airport (BOM T2)", code: "BOM", cityName: "Mumbai, Maharashtra", badge: "Terminal 2" },
  { id: "pune-hub", name: "Pune Airport (PNQ)", code: "PNQ", cityName: "Pune, Maharashtra", badge: "Viman Nagar" },
  { id: "jaipur-hub", name: "Jaipur Airport (JAI)", code: "JAI", cityName: "Jaipur, Rajasthan", badge: "Pink City" },
  { id: "chandigarh-hub", name: "Chandigarh Airport (IXC)", code: "IXC", cityName: "Chandigarh, Punjab", badge: "Hill Gateway" },
  { id: "hyderabad-hub", name: "Hyderabad Airport (HYD)", code: "HYD", cityName: "Hyderabad, Telangana", badge: "Shamshabad" },
];
