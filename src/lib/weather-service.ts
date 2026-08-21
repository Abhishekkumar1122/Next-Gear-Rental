export interface CityWeatherData {
  cityName: string;
  temperatureC: number;
  condition: string;
  conditionIcon: string;
  humidityPercent: number;
  windSpeedKmh: number;
  snowfallCm: number;
  isSnowing: boolean;
  aqiValue: number;
  aqiStatus: "Good" | "Moderate" | "Poor" | "Unhealthy" | "Severe";
  aqiColor: string;
  ridingAdvice: string;
  ridingSuitability: "EXCELLENT" | "GOOD" | "CAUTION" | "CHALLENGING";
  suitabilityBadgeColor: string;
  forecast: {
    dayName: string;
    tempMaxC: number;
    tempMinC: number;
    condition: string;
    snowfallCm: number;
    rainProbability: number;
  }[];
}

// Indian Rental Cities Coordinates & Climate Profiles
const INDIAN_CITIES_COORDS: Record<
  string,
  { lat: number; lon: number; isMountain?: boolean }
> = {
  delhi: { lat: 28.6139, lon: 77.209 },
  "new delhi": { lat: 28.6139, lon: 77.209 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  goa: { lat: 15.2993, lon: 74.124 },
  manali: { lat: 32.2432, lon: 77.1892, isMountain: true },
  shimla: { lat: 31.1048, lon: 77.1734, isMountain: true },
  leh: { lat: 34.1526, lon: 77.5771, isMountain: true },
  srinagar: { lat: 34.0837, lon: 74.7973, isMountain: true },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  udaipur: { lat: 24.5854, lon: 73.7125 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  pune: { lat: 18.5204, lon: 73.8567 },
  chandigarh: { lat: 30.7333, lon: 76.7794 },
  dehradun: { lat: 30.3165, lon: 78.0322, isMountain: true },
  rishikesh: { lat: 30.0869, lon: 78.2676, isMountain: true },
  kochi: { lat: 9.9312, lon: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
};

function getAqiStatus(aqi: number) {
  if (aqi <= 50) return { status: "Good" as const, color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40" };
  if (aqi <= 100) return { status: "Moderate" as const, color: "text-amber-400 border-amber-500/30 bg-amber-950/40" };
  if (aqi <= 200) return { status: "Poor" as const, color: "text-orange-400 border-orange-500/30 bg-orange-950/40" };
  if (aqi <= 300) return { status: "Unhealthy" as const, color: "text-rose-400 border-rose-500/30 bg-rose-950/40" };
  return { status: "Severe" as const, color: "text-purple-400 border-purple-500/30 bg-purple-950/40" };
}

function generateRidingAdvice(
  cityName: string,
  tempC: number,
  snowfallCm: number,
  windSpeed: number,
  isMountain: boolean
) {
  if (snowfallCm > 0 || (isMountain && tempC <= 2)) {
    return {
      advice: "❄️ Snowfall alert! Road surfaces may be slippery. Anti-skid tire chains and heavy thermal gear recommended.",
      suitability: "CHALLENGING" as const,
      color: "bg-cyan-950/60 text-cyan-300 border-cyan-500/40",
    };
  }
  if (windSpeed > 30) {
    return {
      advice: "💨 High wind speeds detected. Maintain firm grip on handlebars & keep safe distance from heavy vehicles.",
      suitability: "CAUTION" as const,
      color: "bg-amber-950/60 text-amber-300 border-amber-500/40",
    };
  }
  if (tempC > 38) {
    return {
      advice: "☀️ Hot weather alert! Stay hydrated, wear UV protective riding jacket & helmet visor.",
      suitability: "GOOD" as const,
      color: "bg-orange-950/60 text-orange-300 border-orange-500/40",
    };
  }
  return {
    advice: "🟢 Optimal riding weather! Great visibility and comfortable road temperatures.",
    suitability: "EXCELLENT" as const,
    color: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
  };
}

export async function getCityWeather(cityName: string): Promise<CityWeatherData> {
  const normalized = cityName.toLowerCase().trim();
  const location = INDIAN_CITIES_COORDS[normalized] || { lat: 28.6139, lon: 77.209 }; // Default Delhi
  const isMountain = !!location.isMountain;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,snowfall&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_probability_max&timezone=auto`,
      { next: { revalidate: 3600 } } // Cache weather for 1 hour
    );

    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      const daily = data.daily;

      const tempC = Math.round(current?.temperature_2m ?? 24);
      const humidity = Math.round(current?.relative_humidity_2m ?? 55);
      const windSpeed = Math.round(current?.wind_speed_10m ?? 12);
      const snowfall = current?.snowfall ?? 0;
      const isSnowing = snowfall > 0 || (isMountain && tempC <= 1);

      // Condition text & icon mapping
      let condition = "Clear & Sunny";
      let conditionIcon = "☀️";
      if (isSnowing) {
        condition = "Snowfall & Frost";
        conditionIcon = "❄️";
      } else if (humidity > 80) {
        condition = "Mist & High Humidity";
        conditionIcon = "🌫️";
      } else if (tempC > 32) {
        condition = "Warm & Clear";
        conditionIcon = "🌤️";
      }

      // Simulated AQI based on city profile
      const rawAqi = normalized.includes("delhi")
        ? 142
        : normalized.includes("leh") || normalized.includes("goa")
        ? 32
        : 78;
      const aqiInfo = getAqiStatus(rawAqi);
      const adviceInfo = generateRidingAdvice(cityName, tempC, snowfall, windSpeed, isMountain);

      // Build 3-day forecast
      const days = ["Today", "Tomorrow", "Day 3"];
      const forecast = days.map((dayName, idx) => ({
        dayName,
        tempMaxC: Math.round(daily?.temperature_2m_max?.[idx] ?? tempC + 2),
        tempMinC: Math.round(daily?.temperature_2m_min?.[idx] ?? tempC - 4),
        snowfallCm: daily?.snowfall_sum?.[idx] ?? (isSnowing ? 2.5 : 0),
        rainProbability: daily?.precipitation_probability_max?.[idx] ?? 10,
        condition: isSnowing ? "Snowfall ❄️" : "Sunny ☀️",
      }));

      return {
        cityName,
        temperatureC: tempC,
        condition,
        conditionIcon,
        humidityPercent: humidity,
        windSpeedKmh: windSpeed,
        snowfallCm: snowfall,
        isSnowing,
        aqiValue: rawAqi,
        aqiStatus: aqiInfo.status,
        aqiColor: aqiInfo.color,
        ridingAdvice: adviceInfo.advice,
        ridingSuitability: adviceInfo.suitability,
        suitabilityBadgeColor: adviceInfo.color,
        forecast,
      };
    }
  } catch (err) {
    console.warn("Weather API fetch fallback:", err);
  }

  // Instant Fallback Data
  const isMountainCity = normalized.includes("leh") || normalized.includes("manali") || normalized.includes("shimla");
  const fallbackTemp = isMountainCity ? 4 : 26;
  const fallbackSnow = isMountainCity ? 1.2 : 0;
  const aqiInfo = getAqiStatus(isMountainCity ? 28 : 110);
  const adviceInfo = generateRidingAdvice(cityName, fallbackTemp, fallbackSnow, 14, isMountainCity);

  return {
    cityName,
    temperatureC: fallbackTemp,
    condition: isMountainCity ? "Light Snowfall" : "Pleasant & Clear",
    conditionIcon: isMountainCity ? "❄️" : "☀️",
    humidityPercent: 52,
    windSpeedKmh: 14,
    snowfallCm: fallbackSnow,
    isSnowing: isMountainCity,
    aqiValue: isMountainCity ? 28 : 110,
    aqiStatus: aqiInfo.status,
    aqiColor: aqiInfo.color,
    ridingAdvice: adviceInfo.advice,
    ridingSuitability: adviceInfo.suitability,
    suitabilityBadgeColor: adviceInfo.color,
    forecast: [
      { dayName: "Today", tempMaxC: fallbackTemp + 3, tempMinC: fallbackTemp - 3, snowfallCm: fallbackSnow, rainProbability: 15, condition: isMountainCity ? "Snowfall ❄️" : "Sunny ☀️" },
      { dayName: "Tomorrow", tempMaxC: fallbackTemp + 4, tempMinC: fallbackTemp - 2, snowfallCm: fallbackSnow, rainProbability: 10, condition: isMountainCity ? "Snowfall ❄️" : "Sunny ☀️" },
      { dayName: "Day 3", tempMaxC: fallbackTemp + 5, tempMinC: fallbackTemp - 1, snowfallCm: 0, rainProbability: 5, condition: "Clear 🌤️" },
    ],
  };
}
