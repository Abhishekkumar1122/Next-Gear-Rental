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
