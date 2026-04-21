"use client";

import { INDIA_CITIES_BY_STATE, INDIA_STATES } from "@/lib/india-locations";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";

type VehicleStatus = "available" | "booked" | "unavailable" | "maintenance" | "crashed";

type AdminVehicle = {
  id: string;
  title: string;
  vehicleNumber?: string;
  imageUrl?: string;
  type: string;
  fuel: string;
  transmission: string;
  seats: number;
  city: string;
  cityId?: string;
  vendorId?: string;
  pricePerDayINR: number;
  airportPickup?: boolean;
  status: VehicleStatus;
  hasActiveBooking: boolean;
  statusMessage?: string;
  note?: string;
  bookedUntil?: string;
  isTrending?: boolean;
  trendingBadge?: string;
  trendingRank?: number;
};

type CityOption = {
  id: string;
  name: string;
  state?: string;
  displayName?: string;
  airportName?: string;
};

type VendorOption = {
  id: string;
  businessName: string;
};

const statusStyles: Record<VehicleStatus, string> = {
  available: "bg-green-50 text-green-700 border-green-200",
  booked: "bg-blue-50 text-blue-700 border-blue-200",
  unavailable: "bg-red-50 text-red-700 border-red-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  crashed: "bg-rose-50 text-rose-700 border-rose-200",
};

export function AdminVehicleInventoryPanel() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [workspaceMode, setWorkspaceMode] = useState<"fleet" | "status" | "create" | "brands" | "contacts" | "cities" | "trending">("fleet");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fleetPage, setFleetPage] = useState(1);
  const [vehicleView, setVehicleView] = useState<"all" | "car" | "bike" | "scooty" | "vendor">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [creatingCity, setCreatingCity] = useState(false);
  const [savingCityId, setSavingCityId] = useState<string | null>(null);
  const [deletingCityId, setDeletingCityId] = useState<string | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [savingVehicleId, setSavingVehicleId] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [togglingTrendingId, setTogglingTrendingId] = useState<string | null>(null);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [isDragOverCreateImage, setIsDragOverCreateImage] = useState(false);
  const [isDragOverEditImage, setIsDragOverEditImage] = useState(false);
  const [trendingSearch, setTrendingSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [trendingBadgeDrafts, setTrendingBadgeDrafts] = useState<Record<string, string>>({});
  const [trendingRankDrafts, setTrendingRankDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [statusToSet, setStatusToSet] = useState<"available" | "unavailable" | "maintenance" | "crashed">("available");
  const [note, setNote] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [editSelectedState, setEditSelectedState] = useState("all");
  const [vehicleForm, setVehicleForm] = useState({
    title: "",
    vehicleNumber: "",
    imageUrl: "",
    type: "bike",
    fuel: "petrol",
    transmission: "manual",
    seats: "2",
    pricePerDayINR: "",
    cityId: "",
    vendorId: "",
    airportPickup: false,
  });
  const [cityForm, setCityForm] = useState({
    cityName: "",
    stateName: "Delhi",
    airportName: "",
    customCityName: "",
  });
  const [cityEditForm, setCityEditForm] = useState({
    cityName: "",
    stateName: "Delhi",
    airportName: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    vehicleNumber: "",
    imageUrl: "",
    type: "bike",
    fuel: "petrol",
    transmission: "manual",
    seats: "2",
    pricePerDayINR: "",
    cityId: "",
    vendorId: "",
    airportPickup: false,
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vehicles", { cache: "no-store" });
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
      setCities(data.cities ?? []);
      setVendors(data.vendors ?? []);

      if (!vehicleForm.cityId && data.cities?.length) {
        setVehicleForm((prev) => ({ ...prev, cityId: data.cities[0].id }));
      }
    } finally {
      setLoading(false);
    }
  }, [vehicleForm.cityId]);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (vehicleView === "vendor" && !vehicle.vendorId) return false;
      if (vehicleView !== "all" && vehicleView !== "vendor" && vehicle.type !== vehicleView) return false;
      if (statusFilter !== "all" && vehicle.status !== statusFilter) return false;
      if (!query) return true;
      return (
        vehicle.id.toLowerCase().includes(query) ||
        vehicle.title.toLowerCase().includes(query) ||
        vehicle.city.toLowerCase().includes(query) ||
        vehicle.type.toLowerCase().includes(query)
      );
    });
  }, [vehicles, search, statusFilter, vehicleView]);

  const vehicleViewCounts = useMemo(() => {
    const all = vehicles.length;
    const car = vehicles.filter((item) => item.type === "car").length;
    const bike = vehicles.filter((item) => item.type === "bike").length;
    const scooty = vehicles.filter((item) => item.type === "scooty").length;
    const vendor = vehicles.filter((item) => Boolean(item.vendorId)).length;
    return { all, car, bike, scooty, vendor };
  }, [vehicles]);

  useEffect(() => {
    setTrendingBadgeDrafts((prev) => {
      const next = { ...prev };
      for (const vehicle of vehicles) {
        if (typeof next[vehicle.id] === "undefined") {
          next[vehicle.id] = vehicle.trendingBadge || "Trending";
        }
      }
      return next;
    });

    setTrendingRankDrafts((prev) => {
      const next = { ...prev };
      for (const vehicle of vehicles) {
        if (typeof next[vehicle.id] === "undefined") {
          next[vehicle.id] = String(vehicle.trendingRank || 99);
        }
      }
      return next;
    });
  }, [vehicles]);

  const trendingManagerVehicles = useMemo(() => {
    const query = trendingSearch.trim().toLowerCase();
    return [...vehicles]
      .filter((vehicle) => {
        if (!query) return true;
        return (
          vehicle.title.toLowerCase().includes(query) ||
          vehicle.city.toLowerCase().includes(query) ||
          vehicle.type.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (Boolean(a.isTrending) !== Boolean(b.isTrending)) {
          return a.isTrending ? -1 : 1;
        }
        const rankA = a.trendingRank ?? 999;
        const rankB = b.trendingRank ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        return a.title.localeCompare(b.title);
      });
  }, [vehicles, trendingSearch]);

  const brandRows = useMemo(() => {
    const byBrand = new Map<string, {
      total: number;
      available: number;
      booked: number;
      maintenance: number;
      totalPrice: number;
      cities: Set<string>;
    }>();

    for (const vehicle of vehicles) {
      const brand = (vehicle.title.split(" ")[0] || "Unknown").trim();
      const existing = byBrand.get(brand) ?? {
        total: 0,
        available: 0,
        booked: 0,
        maintenance: 0,
        totalPrice: 0,
        cities: new Set<string>(),
      };

      existing.total += 1;
      existing.totalPrice += vehicle.pricePerDayINR;
      existing.cities.add(vehicle.city);
      if (vehicle.status === "available") existing.available += 1;
      if (vehicle.status === "booked") existing.booked += 1;
      if (vehicle.status === "maintenance") existing.maintenance += 1;
      byBrand.set(brand, existing);
    }

    const query = brandSearch.trim().toLowerCase();
    return Array.from(byBrand.entries())
      .map(([brand, metrics]) => ({
        brand,
        total: metrics.total,
        available: metrics.available,
        booked: metrics.booked,
        maintenance: metrics.maintenance,
        avgPrice: Math.round(metrics.totalPrice / Math.max(1, metrics.total)),
        cityCount: metrics.cities.size,
      }))
      .filter((item) => (query ? item.brand.toLowerCase().includes(query) : true))
      .sort((a, b) => b.total - a.total || a.brand.localeCompare(b.brand));
  }, [vehicles, brandSearch]);

  const contactRows = useMemo(() => {
    const vendorVehicleCount = vehicles.reduce<Record<string, number>>((acc, vehicle) => {
      if (!vehicle.vendorId) return acc;
      acc[vehicle.vendorId] = (acc[vehicle.vendorId] || 0) + 1;
      return acc;
    }, {});

    const query = contactSearch.trim().toLowerCase();
    return vendors
      .map((vendor) => ({
        id: vendor.id,
        businessName: vendor.businessName,
        fleetCount: vendorVehicleCount[vendor.id] || 0,
      }))
      .filter((vendor) => {
        if (!query) return true;
        return vendor.businessName.toLowerCase().includes(query) || vendor.id.toLowerCase().includes(query);
      })
      .sort((a, b) => b.fleetCount - a.fleetCount || a.businessName.localeCompare(b.businessName));
  }, [vendors, vehicles, contactSearch]);

  const editingVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === editingVehicleId) ?? null,
    [vehicles, editingVehicleId]
  );

  const fleetSummary = useMemo(() => {
    const available = filtered.filter((vehicle) => vehicle.status === "available").length;
    const booked = filtered.filter((vehicle) => vehicle.status === "booked").length;
    const unavailable = filtered.filter((vehicle) => vehicle.status === "unavailable").length;
    const maintenance = filtered.filter((vehicle) => vehicle.status === "maintenance").length;
    const crashed = filtered.filter((vehicle) => vehicle.status === "crashed").length;
    return { total: filtered.length, available, booked, unavailable, maintenance, crashed };
  }, [filtered]);

  const fleetPageSize = 10;
  const totalFleetPages = Math.max(1, Math.ceil(filtered.length / fleetPageSize));
  const paginatedVehicles = useMemo(() => {
    const safePage = Math.min(fleetPage, totalFleetPages);
    const start = (safePage - 1) * fleetPageSize;
    return filtered.slice(start, start + fleetPageSize);
  }, [filtered, fleetPage, totalFleetPages]);

  useEffect(() => {
    setFleetPage(1);
  }, [search, statusFilter, vehicleView]);

  useEffect(() => {
    if (fleetPage > totalFleetPages) {
      setFleetPage(totalFleetPages);
    }
  }, [fleetPage, totalFleetPages]);

  const availableStates = useMemo(() => {
    const statesFromCities = Array.from(new Set(cities.map((city) => city.state).filter(Boolean) as string[]));
    const merged = Array.from(new Set([...statesFromCities, ...INDIA_STATES]));
    return ["all", ...merged.sort((a, b) => a.localeCompare(b))];
  }, [cities]);

  const createStateCities = useMemo(() => {
    return cities.filter((city) => {
      if (!selectedState || selectedState === "all") return true;
      return city.state === selectedState;
    });
  }, [cities, selectedState]);

  const editStateCities = useMemo(() => {
    return cities.filter((city) => {
      if (!editSelectedState || editSelectedState === "all") return true;
      return city.state === editSelectedState;
    });
  }, [cities, editSelectedState]);

  useEffect(() => {
    if (!cities.length) return;

    if (!selectedState) setSelectedState("all");

    if (!vehicleForm.cityId) return;
    const city = cities.find((item) => item.id === vehicleForm.cityId);
    if (!city || (selectedState !== "all" && selectedState && city.state !== selectedState)) {
      const nextCity = selectedState === "all"
        ? cities[0]
        : cities.find((item) => item.state === selectedState) || cities[0];
      if (nextCity) {
        setVehicleForm((prev) => ({ ...prev, cityId: nextCity.id }));
      }
    }
  }, [cities, selectedState, vehicleForm.cityId]);

  const filteredCities = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    if (!query) return cities;

    return cities.filter((city) => {
      const label = (city.displayName ?? city.name).toLowerCase();
      const airport = (city.airportName ?? "").toLowerCase();
      return label.includes(query) || airport.includes(query);
    });
  }, [cities, citySearch]);

  async function uploadAdminVehicleImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/vehicles/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to upload image");
    }

    return String(data.imageUrl ?? "");
  }

  async function handleCreateImageFile(file: File) {
    setUploadingCreateImage(true);
    setMessage("");
    try {
      const imageUrl = await uploadAdminVehicleImage(file);
      setVehicleForm((prev) => ({ ...prev, imageUrl }));
      setMessage("Vehicle image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingCreateImage(false);
    }
  }

  async function handleCreateImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleCreateImageFile(file);
    event.target.value = "";
  }

  function handleCreateDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOverCreateImage(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void handleCreateImageFile(file);
  }

  async function handleEditImageFile(file: File) {
    setUploadingEditImage(true);
    setMessage("");
    try {
      const imageUrl = await uploadAdminVehicleImage(file);
      setEditForm((prev) => ({ ...prev, imageUrl }));
      setMessage("Vehicle image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingEditImage(false);
    }
  }

  async function handleEditImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleEditImageFile(file);
    event.target.value = "";
  }

  function handleEditDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOverEditImage(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void handleEditImageFile(file);
  }

  const stateCitySuggestions = useMemo(() => {
    const base = INDIA_CITIES_BY_STATE[cityForm.stateName] ?? [];
    const existing = cities
      .filter((city) => city.state === cityForm.stateName)
      .map((city) => city.name)
      .filter(Boolean);

    return Array.from(new Set([...base, ...existing])).sort((a, b) => a.localeCompare(b));
  }, [cities, cityForm.stateName]);

  useEffect(() => {
    if (!stateCitySuggestions.length) {
      setCityForm((prev) => ({ ...prev, cityName: "" }));
      return;
    }

    if (!cityForm.customCityName && (!cityForm.cityName || !stateCitySuggestions.includes(cityForm.cityName))) {
      setCityForm((prev) => ({ ...prev, cityName: stateCitySuggestions[0] }));
    }
  }, [stateCitySuggestions, cityForm.cityName, cityForm.customCityName]);

  async function setVehicleStatus(vehicleId: string) {
    setUpdatingId(vehicleId);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusToSet,
          note: note || undefined,
          unavailableUntil: untilDate || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update status");
      }

      setMessage(`Vehicle ${vehicleId} marked ${statusToSet}.`);
      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update vehicle status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function createVehicle() {
    setCreatingVehicle(true);
    setMessage("");

    try {
      if (!vehicleForm.vehicleNumber.trim()) {
        throw new Error("Vehicle number is required");
      }
      if (!vehicleForm.imageUrl.trim()) {
        throw new Error("Vehicle photo is required");
      }

      const payload = {
        title: vehicleForm.title.trim(),
        vehicleNumber: vehicleForm.vehicleNumber.trim(),
        imageUrl: vehicleForm.imageUrl.trim(),
        type: vehicleForm.type as "bike" | "car" | "scooty",
        fuel: vehicleForm.fuel as "petrol" | "diesel" | "electric",
        transmission: vehicleForm.transmission as "manual" | "automatic",
        seats: Number(vehicleForm.seats),
        pricePerDayINR: Number(vehicleForm.pricePerDayINR),
        cityId: vehicleForm.cityId,
        cityName: cities.find((item) => item.id === vehicleForm.cityId)?.displayName ?? cities.find((item) => item.id === vehicleForm.cityId)?.name,
        vendorId: vehicleForm.vendorId || undefined,
        airportPickup: vehicleForm.airportPickup,
      };

      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create vehicle");
      }

      setMessage(`Vehicle created: ${data.vehicle?.title ?? payload.title}`);
      setVehicleForm((prev) => ({
        ...prev,
        title: "",
        vehicleNumber: "",
        imageUrl: "",
        seats: "2",
        pricePerDayINR: "",
        vendorId: "",
        airportPickup: false,
      }));
      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create vehicle");
    } finally {
      setCreatingVehicle(false);
    }
  }

  async function createCity() {
    setCreatingCity(true);
    setMessage("");

    try {
      const effectiveCityName = cityForm.customCityName.trim() || cityForm.cityName.trim();
      if (!effectiveCityName) {
        throw new Error("Please select or enter a city name");
      }

      const payload = {
        cityName: effectiveCityName,
        stateName: cityForm.stateName,
        airportName: cityForm.airportName.trim() || undefined,
      };

      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create city");
      }

      setMessage(`City saved: ${data.city?.displayName ?? payload.cityName}`);
      setCityForm((prev) => ({ ...prev, cityName: "", airportName: "", customCityName: "" }));
      await fetchVehicles();

      if (data.city?.id) {
        setVehicleForm((prev) => ({ ...prev, cityId: data.city.id }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create city");
    } finally {
      setCreatingCity(false);
    }
  }

  function startEditingCity(city: CityOption) {
    setEditingCityId(city.id);
    setCityEditForm({
      cityName: city.name,
      stateName: city.state || "Delhi",
      airportName: city.airportName || "",
    });
  }

  async function saveCity(cityId: string) {
    setSavingCityId(cityId);
    setMessage("");

    try {
      const payload = {
        cityName: cityEditForm.cityName.trim(),
        stateName: cityEditForm.stateName,
        airportName: cityEditForm.airportName.trim() || undefined,
      };

      const res = await fetch(`/api/admin/cities/${cityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update city");
      }

      setMessage(`City updated: ${data.city?.displayName ?? payload.cityName}`);
      setEditingCityId(null);
      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update city");
    } finally {
      setSavingCityId(null);
    }
  }

  async function deleteCity(city: CityOption) {
    const confirmed = window.confirm(`Delete city ${city.displayName ?? city.name}?`);
    if (!confirmed) return;

    setDeletingCityId(city.id);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/cities/${city.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete city");
      }

      setMessage(`City deleted: ${city.displayName ?? city.name}`);

      if (vehicleForm.cityId === city.id) {
        setVehicleForm((prev) => ({ ...prev, cityId: "" }));
      }
      if (editForm.cityId === city.id) {
        setEditForm((prev) => ({ ...prev, cityId: "" }));
      }

      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete city");
    } finally {
      setDeletingCityId(null);
    }
  }

  function startEditing(vehicle: AdminVehicle) {
    const city = cities.find((item) => item.id === vehicle.cityId);
    setEditSelectedState(city?.state || "all");
    setEditingVehicleId(vehicle.id);
    setEditForm({
      title: vehicle.title,
      vehicleNumber: vehicle.vehicleNumber ?? "",
      imageUrl: vehicle.imageUrl ?? "",
      type: vehicle.type,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      seats: String(vehicle.seats),
      pricePerDayINR: String(vehicle.pricePerDayINR),
      cityId: vehicle.cityId ?? "",
      vendorId: vehicle.vendorId ?? "",
      airportPickup: Boolean(vehicle.airportPickup),
    });
  }

  async function saveVehicle(vehicleId: string) {
    setSavingVehicleId(vehicleId);
    setMessage("");

    try {
      const payload = {
        title: editForm.title.trim(),
        vehicleNumber: editForm.vehicleNumber.trim() || undefined,
        imageUrl: editForm.imageUrl.trim() || undefined,
        type: editForm.type as "bike" | "car" | "scooty",
        fuel: editForm.fuel as "petrol" | "diesel" | "electric",
        transmission: editForm.transmission as "manual" | "automatic",
        seats: Number(editForm.seats),
        pricePerDayINR: Number(editForm.pricePerDayINR),
        cityId: editForm.cityId,
        cityName: cities.find((item) => item.id === editForm.cityId)?.displayName ?? cities.find((item) => item.id === editForm.cityId)?.name,
        vendorId: editForm.vendorId || undefined,
        airportPickup: editForm.airportPickup,
      };

      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update vehicle");
      }

      setMessage(`Vehicle updated: ${data.vehicle?.title ?? payload.title}`);
      setEditingVehicleId(null);
      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update vehicle");
    } finally {
      setSavingVehicleId(null);
    }
  }

  async function deleteVehicle(vehicleId: string) {
    const confirmed = window.confirm("Delete this vehicle? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingVehicleId(vehicleId);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete vehicle");
      }

      setMessage(`Vehicle deleted: ${vehicleId}`);
      if (editingVehicleId === vehicleId) {
        setEditingVehicleId(null);
      }
      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete vehicle");
    } finally {
      setDeletingVehicleId(null);
    }
  }

  async function updateTrending(vehicle: AdminVehicle, isTrending: boolean) {
    setTogglingTrendingId(vehicle.id);
    setMessage("");

    try {
      const badge = isTrending
        ? (trendingBadgeDrafts[vehicle.id]?.trim() || vehicle.trendingBadge || "Trending")
        : undefined;
      const rankValue = isTrending
        ? Number(trendingRankDrafts[vehicle.id] || vehicle.trendingRank || 99)
        : undefined;

      const res = await fetch("/api/admin/trending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          isTrending,
          badge,
          rank: Number.isFinite(rankValue) ? rankValue : 99,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update trending ride");
      }

      setMessage(isTrending ? `Trending set: ${vehicle.title}` : `Trending removed: ${vehicle.title}`);
      await fetchVehicles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update trending ride");
    } finally {
      setTogglingTrendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
        <p className="text-xs uppercase tracking-wide text-black/60">Admin Workspace</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: "fleet", label: "Fleet List" },
            { id: "status", label: "Status Management" },
            { id: "create", label: "Add Vehicle" },
            { id: "brands", label: "Brand Management" },
            { id: "contacts", label: "Vendor Contacts" },
            { id: "cities", label: "City Management" },
            { id: "trending", label: "Trending Manager" },
          ].map((tab) => {
            const active = workspaceMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setWorkspaceMode(tab.id as "fleet" | "status" | "create" | "brands" | "contacts" | "cities" | "trending")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black/80 hover:bg-black/[0.03]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {message && <p className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">{message}</p>}

      {workspaceMode !== "fleet" && (
      <div className="rounded-lg border border-black/10 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {workspaceMode === "create"
              ? "Add Vehicle"
              : workspaceMode === "status"
              ? "Status Management"
              : workspaceMode === "brands"
              ? "Brand Management"
              : workspaceMode === "contacts"
              ? "Vendor Contact Management"
              : workspaceMode === "cities"
              ? "City Management"
              : "Trending Manager"}
          </h3>
          <span className="text-xs text-black/60">
            {workspaceMode === "create"
              ? "Create directly from admin UI"
              : workspaceMode === "status"
              ? "Set availability and apply to vehicles quickly"
              : workspaceMode === "brands"
              ? "View fleet by brand and monitor inventory"
              : workspaceMode === "contacts"
              ? "Track vendors and assigned fleet volume"
              : workspaceMode === "cities"
              ? "Add, search, edit, delete cities"
              : "Choose home trending rides and set labels"}
          </span>
        </div>

        {workspaceMode === "status" && (
        <>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vehicle name, id, city"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | VehicleStatus)}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="unavailable">Unavailable</option>
            <option value="maintenance">Maintenance</option>
            <option value="crashed">Crashed</option>
          </select>
        </div>

        <div className="mt-3 grid gap-2 rounded-lg border border-black/10 p-3 md:grid-cols-2">
          <select
            value={statusToSet}
            onChange={(e) => setStatusToSet(e.target.value as "available" | "unavailable" | "maintenance" | "crashed")}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="available">Set Available</option>
            <option value="unavailable">Set Unavailable</option>
            <option value="maintenance">Set Maintenance</option>
            <option value="crashed">Set Crashed</option>
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason/note"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={untilDate}
            onChange={(e) => setUntilDate(e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
          />
        </div>

        <div className="mt-3 space-y-2">
          {loading ? (
            [1, 2, 3].map((item) => (
              <div key={`status-skeleton-${item}`} className="h-14 animate-pulse rounded-lg bg-black/[0.05]" />
            ))
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60">No vehicles available for status update.</p>
          ) : (
            filtered.map((vehicle) => (
              <div key={`status-${vehicle.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{vehicle.title}</p>
                  <p className="text-xs text-black/60">{vehicle.city} · {vehicle.type.toUpperCase()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusStyles[vehicle.status]}`}>
                    {vehicle.status}
                  </span>
                  <button
                    disabled={updatingId === vehicle.id}
                    onClick={() => void setVehicleStatus(vehicle.id)}
                    className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {updatingId === vehicle.id ? "Applying..." : "Apply Selected Status"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}

        {workspaceMode === "brands" && (
        <>
        <input
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          placeholder="Search brand name"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
        />

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brandRows.length === 0 ? (
            <p className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60 sm:col-span-2 lg:col-span-3">No brands found.</p>
          ) : (
            brandRows.map((brand) => (
              <div key={brand.brand} className="rounded-lg border border-black/10 p-3 text-sm">
                <p className="font-semibold">{brand.brand}</p>
                <p className="mt-1 text-xs text-black/60">Vehicles: {brand.total} · Cities: {brand.cityCount}</p>
                <p className="mt-1 text-xs text-black/60">Available: {brand.available} · Booked: {brand.booked} · Maintenance: {brand.maintenance}</p>
                <p className="mt-1 text-xs font-semibold text-black/80">Avg Price: ₹{brand.avgPrice.toLocaleString("en-IN")}/day</p>
              </div>
            ))
          )}
        </div>
        </>
        )}

        {workspaceMode === "contacts" && (
        <>
        <input
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          placeholder="Search vendor by name or id"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
        />

        <div className="mt-3 space-y-2">
          {contactRows.length === 0 ? (
            <p className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60">No vendor contacts found.</p>
          ) : (
            contactRows.map((vendor) => (
              <div key={vendor.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{vendor.businessName}</p>
                  <p className="text-xs text-black/60">Vendor ID: {vendor.id}</p>
                </div>
                <p className="text-xs font-semibold text-black/80">Assigned fleet: {vendor.fleetCount}</p>
              </div>
            ))
          )}

          <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">
            Vehicles without vendor assignment: {vehicles.filter((vehicle) => !vehicle.vendorId).length}
          </div>
        </div>
        </>
        )}

        {workspaceMode === "create" && (
        <>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={vehicleForm.title}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Vehicle title"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={vehicleForm.vehicleNumber}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
            placeholder="Vehicle number (required)"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={vehicleForm.imageUrl}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="Vehicle photo URL (required)"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <select
            value={vehicleForm.type}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="scooty">Scooty</option>
          </select>
          <select
            value={vehicleForm.fuel}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, fuel: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
          </select>
          <select
            value={vehicleForm.transmission}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, transmission: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>

          <input
            value={vehicleForm.seats}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, seats: e.target.value }))}
            placeholder="Seats"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            value={vehicleForm.pricePerDayINR}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, pricePerDayINR: e.target.value }))}
            placeholder="Price per day (INR)"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <select
            value={selectedState}
            onChange={(e) => {
              const state = e.target.value;
              setSelectedState(state);
                const nextCity = state === "all"
                  ? cities[0]
                  : cities.find((item) => item.state === state);
              if (nextCity) {
                setVehicleForm((prev) => ({ ...prev, cityId: nextCity.id }));
              }
            }}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            {availableStates.map((state) => (
                <option key={state} value={state}>{state === "all" ? "All States" : state}</option>
            ))}
          </select>
          <select
            value={vehicleForm.cityId}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, cityId: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="">Select city</option>
            {createStateCities.map((city) => (
              <option key={city.id} value={city.id}>{city.displayName ?? city.name}</option>
            ))}
          </select>
          <select
            value={vehicleForm.vendorId}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, vendorId: e.target.value }))}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="">No vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>{vendor.businessName}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOverCreateImage(true);
            }}
            onDragLeave={() => setIsDragOverCreateImage(false)}
            onDrop={handleCreateDrop}
            className={`cursor-pointer rounded border px-3 py-1 text-xs font-semibold transition ${
              isDragOverCreateImage ? "border-black bg-black/[0.03] text-black" : "border-black/15 text-black/70"
            }`}
          >
            {isDragOverCreateImage ? "Drop Photo" : "Upload or Drop Photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleCreateImageUpload}
              className="ml-2 text-xs"
            />
          </label>
          {uploadingCreateImage ? <span className="text-xs text-black/60">Uploading image...</span> : null}
          <label className="flex items-center gap-2 text-sm text-black/70">
            <input
              type="checkbox"
              checked={vehicleForm.airportPickup}
              onChange={(e) => setVehicleForm((prev) => ({ ...prev, airportPickup: e.target.checked }))}
            />
            Airport pickup available
          </label>

          <button
            onClick={() => void createVehicle()}
            disabled={creatingVehicle}
            className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {creatingVehicle ? "Creating..." : "Create Vehicle"}
          </button>
        </div>
        </>
        )}

        {workspaceMode === "cities" && (
        <>
        <div className="mt-4 rounded-lg border border-black/10 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Add City / State</h4>
            <span className="text-xs text-black/60">Add any city from any state</span>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={cityForm.stateName}
              onChange={(e) => setCityForm((prev) => ({ ...prev, stateName: e.target.value, customCityName: "" }))}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              {INDIA_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <select
              value={cityForm.cityName}
              onChange={(e) => setCityForm((prev) => ({ ...prev, cityName: e.target.value }))}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              {!stateCitySuggestions.length ? (
                <option value="">No cities available</option>
              ) : (
                stateCitySuggestions.map((cityName) => (
                  <option key={cityName} value={cityName}>{cityName}</option>
                ))
              )}
            </select>
            <input
              value={cityForm.airportName}
              onChange={(e) => setCityForm((prev) => ({ ...prev, airportName: e.target.value }))}
              placeholder="Airport name (optional)"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
            />
            <input
              value={cityForm.customCityName}
              onChange={(e) => setCityForm((prev) => ({ ...prev, customCityName: e.target.value }))}
              placeholder="City not in list? Enter custom city"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
            />
          </div>

          <div className="mt-3">
            <button
              onClick={() => void createCity()}
              disabled={creatingCity}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.03] disabled:opacity-60"
            >
              {creatingCity ? "Saving city..." : "Save City"}
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-black/10 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">City Management</h4>
              <span className="text-xs text-black/60">Search, edit, delete</span>
            </div>

            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city or airport"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />

            <div className="mt-3 space-y-2">
              {filteredCities.length === 0 ? (
                <p className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60">No cities found.</p>
              ) : (
                filteredCities.map((city) => (
                  <div key={city.id} className="rounded-lg border border-black/10 p-2">
                    {editingCityId === city.id ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={cityEditForm.cityName}
                          onChange={(e) => setCityEditForm((prev) => ({ ...prev, cityName: e.target.value }))}
                          placeholder="City name"
                          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                        />
                        <select
                          value={cityEditForm.stateName}
                          onChange={(e) => setCityEditForm((prev) => ({ ...prev, stateName: e.target.value }))}
                          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                        >
                          {INDIA_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        <input
                          value={cityEditForm.airportName}
                          onChange={(e) => setCityEditForm((prev) => ({ ...prev, airportName: e.target.value }))}
                          placeholder="Airport name"
                          className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
                        />
                        <div className="flex flex-wrap gap-2 md:col-span-2">
                          <button
                            onClick={() => void saveCity(city.id)}
                            disabled={savingCityId === city.id}
                            className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                          >
                            {savingCityId === city.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingCityId(null)}
                            disabled={savingCityId === city.id}
                            className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div>
                          <p className="font-medium">{city.displayName ?? city.name}</p>
                          {city.airportName && <p className="text-xs text-black/60">{city.airportName}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEditingCity(city)}
                            disabled={deletingCityId === city.id}
                            className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void deleteCity(city)}
                            disabled={deletingCityId === city.id}
                            className="rounded border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                          >
                            {deletingCityId === city.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </>
        )}

        {workspaceMode === "trending" && (
        <>
        <div className="rounded-lg border border-black/10 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-black/60">Homepage cards</p>
            <p className="text-xs text-black/60">Set rank 1/2/3 for display order</p>
          </div>

          <input
            value={trendingSearch}
            onChange={(e) => setTrendingSearch(e.target.value)}
            placeholder="Search vehicles for trending"
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />

          <div className="mt-3 space-y-2">
            {trendingManagerVehicles.length === 0 ? (
              <p className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60">No vehicles found.</p>
            ) : (
              trendingManagerVehicles.map((vehicle) => (
                <div key={`trend-${vehicle.id}`} className="rounded-lg border border-black/10 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{vehicle.title}</p>
                      <p className="text-xs text-black/60">
                        {vehicle.city} · {vehicle.type.toUpperCase()} · ₹{vehicle.pricePerDayINR.toLocaleString("en-IN")}/day
                      </p>
                    </div>
                    {vehicle.isTrending && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        LIVE TRENDING
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_120px_auto_auto]">
                    <input
                      value={trendingBadgeDrafts[vehicle.id] ?? vehicle.trendingBadge ?? "Trending"}
                      onChange={(e) => setTrendingBadgeDrafts((prev) => ({ ...prev, [vehicle.id]: e.target.value }))}
                      placeholder="Badge label"
                      className="rounded border border-black/15 px-3 py-1.5 text-xs"
                    />
                    <input
                      value={trendingRankDrafts[vehicle.id] ?? String(vehicle.trendingRank ?? 99)}
                      onChange={(e) => setTrendingRankDrafts((prev) => ({ ...prev, [vehicle.id]: e.target.value }))}
                      placeholder="Rank"
                      className="rounded border border-black/15 px-3 py-1.5 text-xs"
                    />
                    <button
                      disabled={togglingTrendingId === vehicle.id}
                      onClick={() => void updateTrending(vehicle, true)}
                      className="rounded border border-black/15 px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-50"
                    >
                      {togglingTrendingId === vehicle.id ? "Saving..." : vehicle.isTrending ? "Save Trending" : "Set Trending"}
                    </button>
                    <button
                      disabled={togglingTrendingId === vehicle.id || !vehicle.isTrending}
                      onClick={() => void updateTrending(vehicle, false)}
                      className="rounded border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </>
        )}
      </div>
      )}

      {workspaceMode === "fleet" && (
      <>
      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bike/car by name, id, city"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | VehicleStatus)}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="unavailable">Unavailable</option>
          <option value="maintenance">Maintenance</option>
          <option value="crashed">Crashed</option>
        </select>
        <button
          onClick={() => void fetchVehicles()}
          className="w-full rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.03] md:col-span-2"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
        <p className="text-xs uppercase tracking-wide text-black/60">Vehicle List</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Vehicles", count: vehicleViewCounts.all },
            { id: "car", label: "Cars", count: vehicleViewCounts.car },
            { id: "bike", label: "Bikes", count: vehicleViewCounts.bike },
            { id: "scooty", label: "Scooty", count: vehicleViewCounts.scooty },
            { id: "vendor", label: "Vendor Vehicles", count: vehicleViewCounts.vendor },
          ].map((view) => {
            const active = vehicleView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setVehicleView(view.id as "all" | "car" | "bike" | "scooty" | "vendor")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black/80 hover:bg-black/[0.03]"
                }`}
              >
                {view.label} ({view.count})
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs">
            <p className="text-black/55">Total</p>
            <p className="font-semibold">{fleetSummary.total}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
            <p>Available</p>
            <p className="font-semibold">{fleetSummary.available}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <p>Booked</p>
            <p className="font-semibold">{fleetSummary.booked}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <p>Unavailable</p>
            <p className="font-semibold">{fleetSummary.unavailable}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p>Maintenance</p>
            <p className="font-semibold">{fleetSummary.maintenance}</p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <p>Crashed</p>
            <p className="font-semibold">{fleetSummary.crashed}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-lg bg-black/[0.05]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-3 text-sm text-black/60">No vehicles found in this section.</p>
      ) : (
        <div className="space-y-2">
          {paginatedVehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{vehicle.title} ({vehicle.type.toUpperCase()})</p>
                  <p className="text-black/60">{vehicle.city} · ₹{vehicle.pricePerDayINR.toLocaleString("en-IN")}/day</p>
                  <p className="text-xs text-black/55">Vehicle No: {vehicle.vehicleNumber || "Not set"}</p>
                  {vehicle.imageUrl ? (
                    <div className="mt-2 overflow-hidden rounded border border-black/10 bg-white">
                      <img src={vehicle.imageUrl} alt={vehicle.title} className="h-16 w-24 object-cover" loading="lazy" />
                    </div>
                  ) : null}
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusStyles[vehicle.status]}`}>
                  {vehicle.status}
                </span>
              </div>
              {vehicle.vendorId && <p className="mt-1 text-xs text-black/55">Vendor vehicle</p>}
              {vehicle.isTrending && (
                <p className="mt-1 text-xs font-semibold text-[var(--brand-red)]">
                  Trending on home page{vehicle.trendingBadge ? ` · ${vehicle.trendingBadge}` : ""}
                </p>
              )}
              {vehicle.statusMessage && <p className="mt-1 text-xs text-black/60">{vehicle.statusMessage}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  disabled={deletingVehicleId === vehicle.id}
                  onClick={() => startEditing(vehicle)}
                  className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  disabled={togglingTrendingId === vehicle.id}
                  onClick={() => void updateTrending(vehicle, !vehicle.isTrending)}
                  className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-50"
                >
                  {togglingTrendingId === vehicle.id
                    ? "Updating..."
                    : vehicle.isTrending
                    ? "Remove Trending"
                    : "Set Trending"}
                </button>
                <button
                  disabled={deletingVehicleId === vehicle.id}
                  onClick={() => void deleteVehicle(vehicle.id)}
                  className="rounded border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingVehicleId === vehicle.id ? "Deleting..." : "Delete"}
                </button>
                {vehicle.hasActiveBooking && (
                  <span className="text-xs text-blue-700">Booked by active confirmed booking</span>
                )}
              </div>
            </div>
          ))}

          {editingVehicle && (
            <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Edit Vehicle</h4>
                <button
                  disabled={savingVehicleId === editingVehicle.id}
                  onClick={() => setEditingVehicleId(null)}
                  className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-50"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-black/60">{editingVehicle.title} ({editingVehicle.type.toUpperCase()})</p>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Vehicle title"
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <input
                  value={editForm.vehicleNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                  placeholder="Vehicle number"
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <input
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Vehicle photo URL"
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="scooty">Scooty</option>
                </select>
                <select
                  value={editForm.fuel}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fuel: e.target.value }))}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                </select>
                <select
                  value={editForm.transmission}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, transmission: e.target.value }))}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
                <input
                  value={editForm.seats}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, seats: e.target.value }))}
                  placeholder="Seats"
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <input
                  value={editForm.pricePerDayINR}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pricePerDayINR: e.target.value }))}
                  placeholder="Price per day (INR)"
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <select
                  value={editSelectedState}
                  onChange={(e) => {
                    const state = e.target.value;
                    setEditSelectedState(state);
                    const nextCity = state === "all"
                      ? cities[0]
                      : cities.find((item) => item.state === state);
                    if (nextCity) {
                      setEditForm((prev) => ({ ...prev, cityId: nextCity.id }));
                    }
                  }}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  {availableStates.map((state) => (
                    <option key={state} value={state}>{state === "all" ? "All States" : state}</option>
                  ))}
                </select>
                <select
                  value={editForm.cityId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cityId: e.target.value }))}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="">Select city</option>
                  {editStateCities.map((city) => (
                    <option key={city.id} value={city.id}>{city.displayName ?? city.name}</option>
                  ))}
                </select>
                <select
                  value={editForm.vendorId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                  className="rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="">No vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>{vendor.businessName}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOverEditImage(true);
                  }}
                  onDragLeave={() => setIsDragOverEditImage(false)}
                  onDrop={handleEditDrop}
                  className={`cursor-pointer rounded border px-3 py-1 text-xs font-semibold transition ${
                    isDragOverEditImage ? "border-black bg-black/[0.03] text-black" : "border-black/15 text-black/70"
                  }`}
                >
                  {isDragOverEditImage ? "Drop Photo" : "Upload or Drop Photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleEditImageUpload}
                    className="ml-2 text-xs"
                  />
                </label>
                {uploadingEditImage ? <span className="text-xs text-black/60">Uploading image...</span> : null}
                <label className="flex items-center gap-2 text-sm text-black/70">
                  <input
                    type="checkbox"
                    checked={editForm.airportPickup}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, airportPickup: e.target.checked }))}
                  />
                  Airport pickup available
                </label>
                <button
                  disabled={savingVehicleId === editingVehicle.id}
                  onClick={() => void saveVehicle(editingVehicle.id)}
                  className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                >
                  {savingVehicleId === editingVehicle.id ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {filtered.length > fleetPageSize && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs text-black/70">
              <p>
                Showing {(fleetPage - 1) * fleetPageSize + 1}-{Math.min(fleetPage * fleetPageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFleetPage((prev) => Math.max(1, prev - 1))}
                  disabled={fleetPage === 1}
                  className="rounded border border-black/15 px-3 py-1 font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {fleetPage} / {totalFleetPages}</span>
                <button
                  onClick={() => setFleetPage((prev) => Math.min(totalFleetPages, prev + 1))}
                  disabled={fleetPage === totalFleetPages}
                  className="rounded border border-black/15 px-3 py-1 font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
