import { splitCityAndState } from "@/lib/india-locations";
import { cityConfigs, vehicles } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type CoverageCity = {
  name: string;
  state: string;
  displayName: string;
  airport: string;
  vehicleCount: number;
  vehicleTypes: string[];
};

function toCoverageCity(params: {
  name: string;
  airport?: string | null;
  vehicleTypes?: string[];
}) {
  const parsed = splitCityAndState(params.name);
  const cityName = parsed.city || params.name;
  const stateName = parsed.state || "";
  const displayName = stateName ? `${cityName}, ${stateName}` : cityName;
  const vehicleTypes = Array.from(new Set((params.vehicleTypes ?? []).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const city: CoverageCity = {
    name: cityName,
    state: stateName,
    displayName,
    airport: params.airport?.trim() || "Airport details coming soon",
    vehicleCount: vehicleTypes.length ? 0 : 0,
    vehicleTypes,
  };

  return city;
}

export async function GET() {
  if (process.env.DATABASE_URL) {
    const dbCities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        vehicles: {
          select: { type: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const cities: CoverageCity[] = dbCities.map((city) => {
      const base = toCoverageCity({
        name: city.name,
        airport: city.airportName,
        vehicleTypes: city.vehicles.map((vehicle) => vehicle.type),
      });
      return {
        ...base,
        vehicleCount: city.vehicles.length,
      };
    });

    const totalCities = cities.length;
    const airportHubs = cities.filter((city) => city.airport && city.airport !== "Airport details coming soon").length;
    const vehiclesAvailable = cities.reduce((sum, city) => sum + city.vehicleCount, 0);
    const statesCovered = new Set(cities.map((city) => city.state).filter(Boolean)).size;

    return NextResponse.json(
      {
        stats: {
          totalCities,
          airportHubs,
          vehiclesAvailable,
          statesCovered,
        },
        cities,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          "Pragma": "public",
        },
      }
    );
  }

  const cities: CoverageCity[] = cityConfigs.map((city) => {
    const cityVehicles = vehicles.filter((vehicle) => vehicle.city === city.name);
    const base = toCoverageCity({
      name: city.name,
      airport: city.airport,
      vehicleTypes: cityVehicles.map((vehicle) => vehicle.type),
    });

    return {
      ...base,
      vehicleCount: cityVehicles.length,
    };
  });

  const totalCities = cities.length;
  const airportHubs = cities.filter((city) => city.airport && city.airport !== "Airport details coming soon").length;
  const vehiclesAvailable = cities.reduce((sum, city) => sum + city.vehicleCount, 0);
  const statesCovered = new Set(cities.map((city) => city.state).filter(Boolean)).size;

  return NextResponse.json(
    {
      stats: {
        totalCities,
        airportHubs,
        vehiclesAvailable,
        statesCovered,
      },
      cities,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Pragma": "public",
      },
    }
  );
}
