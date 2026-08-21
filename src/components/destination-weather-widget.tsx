"use client";

import React, { useState, useEffect } from "react";
import { CloudSnow, Thermometer, Wind, Droplets, Activity, ShieldAlert, Sparkles, MapPin, Calendar } from "lucide-react";
import { getCityWeather, CityWeatherData } from "@/lib/weather-service";

interface DestinationWeatherWidgetProps {
  city: string;
}

export function DestinationWeatherWidget({ city }: DestinationWeatherWidgetProps) {
  const [weather, setWeather] = useState<CityWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      try {
        setLoading(true);
        const data = await getCityWeather(city);
        if (isMounted) setWeather(data);
      } catch (err) {
        console.error("Failed to load weather widget:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [city]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 backdrop-blur-xl animate-pulse">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="h-4 w-40 rounded-full bg-white/10" />
          <div className="h-6 w-24 rounded-full bg-white/10" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/5 p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const currentForecast = weather.forecast[selectedDayIndex] || weather.forecast[0];

  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 p-5 shadow-2xl backdrop-blur-xl">
      {/* Widget Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
            <span className="text-xl">{weather.conditionIcon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <MapPin className="h-3.5 w-3.5 text-red-400" />
              <span className="font-semibold text-white/90">{weather.cityName} Trip Weather</span>
            </div>
            <p className="text-sm font-bold text-white capitalize">{weather.condition}</p>
          </div>
        </div>

        {/* Forecast Days Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
          {weather.forecast.map((fc, idx) => (
            <button
              key={fc.dayName}
              onClick={() => setSelectedDayIndex(idx)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                selectedDayIndex === idx
                  ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {fc.dayName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {/* Temperature Box */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Temperature</span>
            <Thermometer className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-1 text-2xl font-black text-white">
            {selectedDayIndex === 0 ? `${weather.temperatureC}°C` : `${currentForecast.tempMaxC}°C`}
          </p>
          <p className="mt-0.5 text-[10px] text-white/50">
            High: {currentForecast.tempMaxC}°C · Low: {currentForecast.tempMinC}°C
          </p>
        </div>

        {/* Snowfall / Rain Box */}
        <div className={`rounded-2xl border p-3.5 backdrop-blur-md ${
          weather.isSnowing
            ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-200"
            : "border-white/10 bg-white/[0.03] text-white"
        }`}>
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Snowfall / Precip</span>
            <CloudSnow className={`h-4 w-4 ${weather.isSnowing ? "text-cyan-300 animate-bounce" : "text-sky-400"}`} />
          </div>
          <p className="mt-1 text-2xl font-black">
            {currentForecast.snowfallCm > 0 ? `${currentForecast.snowfallCm} cm` : `${currentForecast.rainProbability}%`}
          </p>
          <p className="mt-0.5 text-[10px] text-white/50">
            {weather.isSnowing ? "❄️ Active Snow Alert" : "Precipitation Chance"}
          </p>
        </div>

        {/* Air Quality Index (AQI) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Air Quality (AQI)</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{weather.aqiValue}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${weather.aqiColor}`}>
              {weather.aqiStatus}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-white/50">Clean air index</p>
        </div>

        {/* Humidity & Wind */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Wind & Humidity</span>
            <Wind className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-1 text-lg font-black text-white">
            {weather.windSpeedKmh} km/h
          </p>
          <p className="mt-0.5 text-[10px] text-white/50 flex items-center gap-1">
            <Droplets className="h-3 w-3 text-cyan-400 inline" /> {weather.humidityPercent}% Humidity
          </p>
        </div>
      </div>

      {/* Riding & Driving Advisory Banner */}
      <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs font-semibold backdrop-blur-md ${weather.suitabilityBadgeColor}`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{weather.ridingAdvice}</span>
        </div>

        <div className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-white/10">
          Suitability: {weather.ridingSuitability}
        </div>
      </div>
    </div>
  );
}
