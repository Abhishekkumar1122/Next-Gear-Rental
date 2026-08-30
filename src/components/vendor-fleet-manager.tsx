"use client";

import { compressImageClient } from "@/lib/client-image-compressor";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Vehicle, VehicleType } from "@/lib/types";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Search,
  Sparkles,
  Car,
  Bike,
  Calendar,
  DollarSign,
  Plus,
  X,
  Camera,
  Zap,
  Fuel,
  Users,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
  LayoutGrid,
  List,
  Flame,
  ShieldCheck,
  Radio,
  FileCheck,
  Wrench,
  MapPin,
} from "lucide-react";
import { IndiaStateCitySelector } from "@/components/india-state-city-selector";
import { InteractiveLocationPicker, type LocationSelection } from "@/components/interactive-location-picker";

type VendorFleetManagerProps = {
  initialFleetVehicles: Vehicle[];
  vendorId: string;
  bookings?: any[];
};

const PHOTO_SLOTS = [
  { id: 0, title: "Front / Cover", icon: "📸", hint: "Main Listing Cover (Required)", req: true },
  { id: 1, title: "Side View", icon: "🚗", hint: "Side Profile Angle", req: false },
  { id: 2, title: "Rear / Back", icon: "🔍", hint: "Back & Number Plate", req: false },
  { id: 3, title: "Interior / Meter", icon: "✨", hint: "Dashboard / Cockpit", req: false },
];

export function VendorFleetManager({ initialFleetVehicles, vendorId, bookings }: VendorFleetManagerProps) {
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>(initialFleetVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | VehicleType>("all");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc" | "availabilityDesc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeAvailabilityId, setActiveAvailabilityId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingDocsId, setEditingDocsId] = useState<string | null>(null);

  // Draft states
  const [priceDraft, setPriceDraft] = useState("");
  const [addonWaiverDraft, setAddonWaiverDraft] = useState("");
  const [addonRsaDraft, setAddonRsaDraft] = useState("");
  const [addonHelmetDraft, setAddonHelmetDraft] = useState("");
  const [price1HrDraft, setPrice1HrDraft] = useState("");
  const [price3HrDraft, setPrice3HrDraft] = useState("");
  const [price6HrDraft, setPrice6HrDraft] = useState("");
  const [price12HrDraft, setPrice12HrDraft] = useState("");
  const [numberDraft, setNumberDraft] = useState("");
  const [photoDrafts, setPhotoDrafts] = useState<string[]>(["", "", "", ""]);
  const [availabilityDraft, setAvailabilityDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [globalSurgeActive, setGlobalSurgeActive] = useState(false);

  // Docs state mock per vehicle
  const [docsData, setDocsData] = useState<Record<string, { insuranceDays: number; pucDays: number; serviceKm: number; gpsStatus: string }>>({});

  // Primary Garage / Shop Location (1-time saved in vendor settings)
  const [primaryGarageLocation, setPrimaryGarageLocation] = useState<LocationSelection>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`nextgear_vendor_garage_${vendorId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      address: "NextGear Hub, Sector 62, Noida",
      landmark: "Opposite Metro Gate 2",
      lat: 28.5355,
      lng: 77.3910,
      city: "Noida",
      state: "Uttar Pradesh",
    };
  });
  const [showGarageLocationModal, setShowGarageLocationModal] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    title: "",
    state: "Maharashtra",
    city: "Mumbai",
    type: "car" as VehicleType,
    seats: "5",
    pricePerDayINR: "1500",
    vehicleNumber: "",
    imageUrls: ["", "", "", ""],
    locationMode: "default" as "default" | "custom",
    pickupAddress: "",
    pickupLandmark: "",
    latitude: 28.5355,
    longitude: 77.3910,
    useCustomLocation: false,
    addonWaiverPrice: "",
    addonRsaPrice: "",
    addonHelmetPrice: "",
    price1HrINR: "",
    price3HrINR: "",
    price6HrINR: "",
    price12HrINR: "",
  });

  const totalEarningsEstimate = useMemo(() => {
    return fleetVehicles.reduce((sum, vehicle) => sum + vehicle.pricePerDayINR * Math.max(vehicle.availableDates.length, 1), 0);
  }, [fleetVehicles]);

  const displayedVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = fleetVehicles.filter((vehicle) => {
      const matchesType = typeFilter === "all" ? true : vehicle.type === typeFilter;
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : vehicle.title.toLowerCase().includes(normalizedSearch) ||
            vehicle.city.toLowerCase().includes(normalizedSearch) ||
            (vehicle.vehicleNumber && vehicle.vehicleNumber.toLowerCase().includes(normalizedSearch));

      return matchesType && matchesSearch;
    });

    const sorted = [...filtered];
    if (sortBy === "priceAsc") {
      sorted.sort((a, b) => a.pricePerDayINR - b.pricePerDayINR);
    } else if (sortBy === "priceDesc") {
      sorted.sort((a, b) => b.pricePerDayINR - a.pricePerDayINR);
    } else if (sortBy === "availabilityDesc") {
      sorted.sort((a, b) => b.availableDates.length - a.availableDates.length);
    } else {
      sorted.sort((a, b) => b.id.localeCompare(a.id));
    }

    return sorted;
  }, [fleetVehicles, searchTerm, sortBy, typeFilter]);

  useEffect(() => {
    void fetchFleet();
  }, []);

  async function fetchFleet() {
    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch("/api/vendor/fleet", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load vendor fleet");
      }

      const data = (await response.json()) as { vehicles?: Vehicle[] };
      if (Array.isArray(data.vehicles)) {
        setFleetVehicles(data.vehicles);
      }
    } catch {
      setSyncError("Could not sync fleet from server. Showing local data.");
    } finally {
      setIsSyncing(false);
    }
  }

  function showFeedback(message: string) {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 2800);
  }

  async function uploadSingleImage(file: File): Promise<string> {
    const compressed = await compressImageClient(file, 1600, 0.82);
    const formData = new FormData();
    formData.append("file", compressed.file);

    const response = await fetch("/api/vendor/fleet/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Unable to upload image");
    }

    return String(data?.imageUrl || "");
  }

  // Upload individual photo for a slot in Add Form
  async function handleSlotUpload(slotIdx: number, file: File) {
    try {
      setUploadingSlot(slotIdx);
      setSyncError("");
      const url = await uploadSingleImage(file);
      setNewVehicle((prev) => {
        const next = [...prev.imageUrls];
        next[slotIdx] = url;
        return { ...prev, imageUrls: next };
      });
      showFeedback(`Photo ${slotIdx + 1} (${PHOTO_SLOTS[slotIdx].title}) uploaded!`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to upload photo");
    } finally {
      setUploadingSlot(null);
    }
  }

  // Bulk Upload up to 4 images
  async function handleBulkUpload(files: FileList | File[]) {
    try {
      setIsBulkUploading(true);
      setSyncError("");
      const list = Array.from(files).slice(0, 4);
      const results: string[] = [];

      for (const file of list) {
        const url = await uploadSingleImage(file);
        results.push(url);
      }

      setNewVehicle((prev) => {
        const next = [...prev.imageUrls];
        results.forEach((url, i) => {
          if (i < 4) next[i] = url;
        });
        return { ...prev, imageUrls: next };
      });

      showFeedback(`${results.length} photos uploaded to gallery!`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Bulk upload failed");
    } finally {
      setIsBulkUploading(false);
    }
  }

  // Edit photo slot upload
  async function handleEditSlotUpload(slotIdx: number, file: File) {
    try {
      setUploadingSlot(slotIdx);
      setSyncError("");
      const url = await uploadSingleImage(file);
      setPhotoDrafts((prev) => {
        const next = [...prev];
        next[slotIdx] = url;
        return next;
      });
      showFeedback(`Photo ${slotIdx + 1} uploaded. Click Save Photos to apply.`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to upload photo");
    } finally {
      setUploadingSlot(null);
    }
  }

  async function addVehicle() {
    if (!newVehicle.title.trim() || !newVehicle.city.trim()) {
      showFeedback("Enter title and city before adding a vehicle.");
      return;
    }

    const seats = Number(newVehicle.seats);
    const pricePerDayINR = Number(newVehicle.pricePerDayINR);
    if (!Number.isFinite(seats) || seats < 1) {
      showFeedback("Seats must be at least 1.");
      return;
    }

    const validImages = newVehicle.imageUrls.map((u) => u.trim()).filter(Boolean);
    const primaryCover = validImages[0] || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";

    const addonWaiverPrice = newVehicle.addonWaiverPrice ? Number(newVehicle.addonWaiverPrice) : null;
    const addonRsaPrice = newVehicle.addonRsaPrice ? Number(newVehicle.addonRsaPrice) : null;
    const addonHelmetPrice = newVehicle.addonHelmetPrice ? Number(newVehicle.addonHelmetPrice) : null;

    const price1HrINR = newVehicle.price1HrINR ? Number(newVehicle.price1HrINR) : null;
    const price3HrINR = newVehicle.price3HrINR ? Number(newVehicle.price3HrINR) : null;
    const price6HrINR = newVehicle.price6HrINR ? Number(newVehicle.price6HrINR) : null;
    const price12HrINR = newVehicle.price12HrINR ? Number(newVehicle.price12HrINR) : null;

    const isCustom = newVehicle.locationMode === "custom";
    const finalAddress = isCustom ? newVehicle.pickupAddress : primaryGarageLocation.address;
    const finalLandmark = isCustom ? newVehicle.pickupLandmark : primaryGarageLocation.landmark;
    const finalLat = isCustom ? newVehicle.latitude : primaryGarageLocation.lat;
    const finalLng = isCustom ? newVehicle.longitude : primaryGarageLocation.lng;

    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch("/api/vendor/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVehicle.title,
          city: isCustom && newVehicle.city ? newVehicle.city : primaryGarageLocation.city || newVehicle.city,
          type: newVehicle.type,
          seats,
          pricePerDayINR,
          vehicleNumber: newVehicle.vehicleNumber,
          imageUrl: primaryCover,
          imageUrls: validImages.length > 0 ? validImages : [primaryCover],
          pickupAddress: finalAddress || null,
          pickupLandmark: finalLandmark || null,
          latitude: finalLat || null,
          longitude: finalLng || null,
          useCustomLocation: isCustom,
          vendorId,
          addonWaiverPrice,
          addonRsaPrice,
          addonHelmetPrice,
          price1HrINR,
          price3HrINR,
          price6HrINR,
          price12HrINR,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to add vehicle");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => [data.vehicle as Vehicle, ...prev]);
      }

      setShowAddForm(false);
      setNewVehicle({
        title: "",
        state: primaryGarageLocation.state || "Maharashtra",
        city: primaryGarageLocation.city || "Mumbai",
        type: "car",
        seats: "5",
        pricePerDayINR: "1500",
        vehicleNumber: "",
        imageUrls: ["", "", "", ""],
        locationMode: "default",
        pickupAddress: "",
        pickupLandmark: "",
        latitude: primaryGarageLocation.lat,
        longitude: primaryGarageLocation.lng,
        useCustomLocation: false,
        addonWaiverPrice: "",
        addonRsaPrice: "",
        addonHelmetPrice: "",
        price1HrINR: "",
        price3HrINR: "",
        price6HrINR: "",
        price12HrINR: "",
      });
      showFeedback(`Vehicle published with ${validImages.length || 1} photo(s) & GPS pickup pinpoint!`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to add vehicle");
    } finally {
      setIsSyncing(false);
    }
  }

  function beginEditPricing(vehicle: Vehicle) {
    setEditingPriceId((prev) => (prev === vehicle.id ? null : vehicle.id));
    setEditingNumberId(null);
    setEditingPhotoId(null);
    setActiveAvailabilityId(null);
    setEditingDocsId(null);
    setPriceDraft(String(vehicle.pricePerDayINR));
    setAddonWaiverDraft(vehicle.addonWaiverPrice !== undefined && vehicle.addonWaiverPrice !== null ? String(vehicle.addonWaiverPrice) : "");
    setAddonRsaDraft(vehicle.addonRsaPrice !== undefined && vehicle.addonRsaPrice !== null ? String(vehicle.addonRsaPrice) : "");
    setAddonHelmetDraft(vehicle.addonHelmetPrice !== undefined && vehicle.addonHelmetPrice !== null ? String(vehicle.addonHelmetPrice) : "");
    setPrice1HrDraft(vehicle.price1HrINR !== undefined && vehicle.price1HrINR !== null ? String(vehicle.price1HrINR) : "");
    setPrice3HrDraft(vehicle.price3HrINR !== undefined && vehicle.price3HrINR !== null ? String(vehicle.price3HrINR) : "");
    setPrice6HrDraft(vehicle.price6HrINR !== undefined && vehicle.price6HrINR !== null ? String(vehicle.price6HrINR) : "");
    setPrice12HrDraft(vehicle.price12HrINR !== undefined && vehicle.price12HrINR !== null ? String(vehicle.price12HrINR) : "");
  }

  async function savePricing(vehicleId: string) {
    const nextPrice = Number(priceDraft);
    if (!Number.isFinite(nextPrice) || nextPrice < 1) {
      showFeedback("Price must be greater than 0.");
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerDayINR: nextPrice,
          addonWaiverPrice: addonWaiverDraft ? Number(addonWaiverDraft) : null,
          addonRsaPrice: addonRsaDraft ? Number(addonRsaDraft) : null,
          addonHelmetPrice: addonHelmetDraft ? Number(addonHelmetDraft) : null,
          price1HrINR: price1HrDraft ? Number(price1HrDraft) : null,
          price3HrINR: price3HrDraft ? Number(price3HrDraft) : null,
          price6HrINR: price6HrDraft ? Number(price6HrDraft) : null,
          price12HrINR: price12HrDraft ? Number(price12HrDraft) : null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update pricing");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
      }

      setEditingPriceId(null);
      showFeedback("Pricing updated successfully!");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update pricing");
    } finally {
      setIsSyncing(false);
    }
  }

  function beginEditNumber(vehicle: Vehicle) {
    setEditingNumberId((prev) => (prev === vehicle.id ? null : vehicle.id));
    setEditingPriceId(null);
    setEditingPhotoId(null);
    setActiveAvailabilityId(null);
    setEditingDocsId(null);
    setNumberDraft(vehicle.vehicleNumber ?? "");
  }

  async function saveVehicleNumber(vehicleId: string) {
    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleNumber: numberDraft.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update vehicle number");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
      }

      setEditingNumberId(null);
      showFeedback("Vehicle number plate updated!");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update vehicle number");
    } finally {
      setIsSyncing(false);
    }
  }

  function openAvailability(vehicle: Vehicle) {
    setActiveAvailabilityId((prev) => (prev === vehicle.id ? null : vehicle.id));
    setEditingPriceId(null);
    setEditingNumberId(null);
    setEditingPhotoId(null);
    setEditingDocsId(null);
    setAvailabilityDraft(vehicle.availableDates.join("\n"));
  }

  async function saveAvailability(vehicleId: string) {
    const dates = availabilityDraft
      .split(/\n|,/)
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));

    if (dates.length === 0) {
      showFeedback("Add at least one valid date in YYYY-MM-DD format.");
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableDates: dates }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update availability");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
      }

      setActiveAvailabilityId(null);
      showFeedback("Availability dates updated!");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update availability");
    } finally {
      setIsSyncing(false);
    }
  }

  function beginEditPhoto(vehicle: Vehicle) {
    setEditingPhotoId((prev) => (prev === vehicle.id ? null : vehicle.id));
    setEditingPriceId(null);
    setEditingNumberId(null);
    setActiveAvailabilityId(null);
    setEditingDocsId(null);
    const existing = vehicle.imageUrls && vehicle.imageUrls.length > 0 ? [...vehicle.imageUrls] : [];
    while (existing.length < 4) existing.push("");
    setPhotoDrafts(existing.slice(0, 4));
  }

  function beginEditDocs(vehicle: Vehicle) {
    setEditingDocsId((prev) => (prev === vehicle.id ? null : vehicle.id));
    setEditingPriceId(null);
    setEditingNumberId(null);
    setEditingPhotoId(null);
    setActiveAvailabilityId(null);
  }

  async function savePhotos(vehicleId: string) {
    try {
      setIsSyncing(true);
      setSyncError("");

      const validUrls = photoDrafts.map((s) => s.trim()).filter(Boolean);

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: validUrls[0] || "",
          imageUrls: validUrls,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update photos");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
      }

      setEditingPhotoId(null);
      showFeedback("Vehicle photos updated successfully!");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update photos");
    } finally {
      setIsSyncing(false);
    }
  }

  function removeVehicle(vehicleId: string, vehicleTitle: string) {
    setDeleteTarget({ id: vehicleId, title: vehicleTitle });
  }

  async function confirmRemoveVehicle() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to remove vehicle");
      }

      setFleetVehicles((prev) => prev.filter((vehicle) => vehicle.id !== deleteTarget.id));
      if (activeAvailabilityId === deleteTarget.id) setActiveAvailabilityId(null);
      if (editingPriceId === deleteTarget.id) setEditingPriceId(null);
      showFeedback(`"${deleteTarget.title}" removed from fleet catalog.`);
      setDeleteTarget(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to remove vehicle");
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleOperationalStatus(vehicleId: string, nextStatus: "AVAILABLE" | "UNAVAILABLE") {
    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationalStatus: nextStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update status");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
        showFeedback(`Vehicle is now ${nextStatus === "AVAILABLE" ? "Online (Available)" : "Offline (Maintenance)"}.`);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update status");
    } finally {
      setIsSyncing(false);
    }
  }

  async function toggleWeekendSurge(vehicleId: string, nextSurgeActive: boolean) {
    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekendSurgeActive: nextSurgeActive }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update surge pricing");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
        showFeedback(`Weekend surge pricing is now ${nextSurgeActive ? "Enabled (+15%)" : "Disabled"}.`);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update surge pricing");
    } finally {
      setIsSyncing(false);
    }
  }

  const onlineCount = useMemo(() => fleetVehicles.filter((v) => v.operationalStatus !== "UNAVAILABLE").length, [fleetVehicles]);
  const offlineCount = useMemo(() => fleetVehicles.filter((v) => v.operationalStatus === "UNAVAILABLE").length, [fleetVehicles]);
  const avgPricePerDay = useMemo(() => {
    if (fleetVehicles.length === 0) return 0;
    const sum = fleetVehicles.reduce((acc, v) => acc + v.pricePerDayINR, 0);
    return Math.round(sum / fleetVehicles.length);
  }, [fleetVehicles]);

  const carCount = useMemo(() => fleetVehicles.filter((v) => (v.type || "car").toLowerCase() === "car").length, [fleetVehicles]);
  const bikeCount = useMemo(() => fleetVehicles.filter((v) => (v.type || "").toLowerCase().includes("bike")).length, [fleetVehicles]);
  const scooterCount = useMemo(() => fleetVehicles.filter((v) => (v.type || "").toLowerCase().includes("scoot")).length, [fleetVehicles]);

  return (
    <section className="space-y-4 md:space-y-6 text-white pb-6">
      {/* 🌟 KPI STATS: MOBILE HORIZONTAL SWIPE CAROUSEL / DESKTOP 4-COL GRID */}
      <div className="flex md:grid md:grid-cols-4 gap-2.5 md:gap-4 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
        {/* Card 1: Total Fleet & Status */}
        <div className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-1 snap-start relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/40 via-neutral-900/60 to-neutral-950/80 p-3 md:p-4 backdrop-blur-md shadow-lg group hover:border-blue-500/30 transition-all shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-blue-400 truncate">Total Fleet</span>
            <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {onlineCount} Live
            </span>
          </div>
          <div className="mt-1.5 md:mt-2 flex items-baseline justify-between">
            <span className="text-xl md:text-3xl font-black text-white">{fleetVehicles.length}</span>
            <span className="text-[10px] md:text-xs font-semibold text-rose-400">{offlineCount} Off</span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${(onlineCount / (fleetVehicles.length || 1)) * 100}%` }} />
            <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${(offlineCount / (fleetVehicles.length || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Card 2: Average Rental Rate */}
        <div className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-1 snap-start relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/40 via-neutral-900/60 to-neutral-950/80 p-3 md:p-4 backdrop-blur-md shadow-lg group hover:border-emerald-500/30 transition-all shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 truncate">Avg Daily Rate</span>
            <span className="text-[9px] md:text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
              Per Unit
            </span>
          </div>
          <div className="mt-1.5 md:mt-2 flex items-baseline justify-between">
            <span className="text-xl md:text-3xl font-black text-emerald-400 font-mono">₹{avgPricePerDay.toLocaleString("en-IN")}</span>
            <span className="text-[10px] md:text-xs text-white/50">/ 24 hrs</span>
          </div>
          <p className="mt-1.5 text-[9px] md:text-[10px] text-white/40 font-medium truncate">Avg across listings</p>
        </div>

        {/* Card 3: Type Breakdown */}
        <div className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-1 snap-start relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 via-neutral-900/60 to-neutral-950/80 p-3 md:p-4 backdrop-blur-md shadow-lg group hover:border-purple-500/30 transition-all shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-purple-400 truncate">Categories</span>
            <span className="text-[9px] md:text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 shrink-0">
              Mix
            </span>
          </div>
          <div className="mt-1.5 md:mt-2 flex items-center justify-between gap-1 text-[10px] md:text-xs">
            <span className="text-blue-400 font-bold">🚗 {carCount}</span>
            <span className="text-emerald-400 font-bold">🏍️ {bikeCount}</span>
            <span className="text-amber-400 font-bold">🛵 {scooterCount}</span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: `${(carCount / (fleetVehicles.length || 1)) * 100}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${(bikeCount / (fleetVehicles.length || 1)) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(scooterCount / (fleetVehicles.length || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Card 4: Potential Earnings Capacity */}
        <div className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-1 snap-start relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-950/40 via-neutral-900/60 to-neutral-950/80 p-3 md:p-4 backdrop-blur-md shadow-lg group hover:border-amber-500/30 transition-all shrink-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-amber-400 truncate">Est. Yield</span>
            <span className="text-[9px] md:text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 shrink-0">
              Full Cap
            </span>
          </div>
          <div className="mt-1.5 md:mt-2 flex items-baseline justify-between">
            <span className="text-xl md:text-3xl font-black text-amber-400 font-mono">₹{totalEarningsEstimate.toLocaleString("en-IN")}</span>
            <span className="text-[10px] md:text-xs text-amber-300/60">/ day</span>
          </div>
          <p className="mt-1.5 text-[9px] md:text-[10px] text-amber-200/50 font-medium truncate">100% occupancy</p>
        </div>
      </div>

      {/* 🤖 MINI AI DEMAND SURGE RADAR BANNER */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-neutral-900/80 to-neutral-950 p-3 md:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Flame className="w-4 h-4 fill-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-1.5 py-0.2 rounded">
                AI Surge Alert
              </span>
              <span className="text-xs font-bold text-white">Weekend City Demand is High (+20%)</span>
            </div>
            <p className="text-[10px] text-white/50 hidden sm:block">Boost daily rental yield by enabling surge pricing on your fleet</p>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !globalSurgeActive;
            setGlobalSurgeActive(next);
            showFeedback(next ? "🔥 +20% Weekend Surge active across all fleet!" : "Weekend Surge turned off.");
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shrink-0 border ${
            globalSurgeActive
              ? "bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30"
              : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
          }`}
        >
          {globalSurgeActive ? "Surge: ON (+20%)" : "Enable Surge (+20%)"}
        </button>
      </div>

      {/* ⚡ HEADER: COMPACT ON MOBILE WITH INLINE CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 pb-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-md shadow-red-600/30 shrink-0">
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Fleet Management
              <span className="text-xs font-bold text-white/40 md:hidden font-mono">({fleetVehicles.length})</span>
            </h2>
            <p className="text-[11px] text-white/50 hidden md:block">Manage your active vehicle catalog, rates, availability & live statuses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Shop Pin Setup Quick Button */}
          <button
            type="button"
            onClick={() => setShowGarageLocationModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer shrink-0"
            title="Configure your default garage / shop location on Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Shop Pin:</span>
            <span className="text-emerald-400 font-mono text-[11px] truncate max-w-[120px] sm:max-w-[160px]">
              {primaryGarageLocation.address ? primaryGarageLocation.address.split(",")[0] : "Set Shop Pin"}
            </span>
          </button>

          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md active:scale-95 shrink-0 ${
              showAddForm
                ? "bg-white/10 text-white border border-white/20 hover:bg-white/15"
                : "bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-red-600/30 hover:brightness-110 border border-red-400/30"
            }`}
          >
            {showAddForm ? (
              <>
                <X className="w-3.5 h-3.5" /> Close
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add Vehicle
              </>
            )}
          </button>
        </div>
      </div>

      {/* 📍 PRIMARY GARAGE PIN MODAL (MOUNTED TO BODY VIA PORTAL) */}
      {showGarageLocationModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out] overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[82vh] overflow-y-auto rounded-3xl border border-emerald-500/40 bg-[#0e0e10] p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Default Shop / Garage Pin</h3>
                  <p className="text-xs text-white/60">New vehicles will automatically inherit this location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGarageLocationModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <InteractiveLocationPicker
              initialLocation={primaryGarageLocation}
              hideHeader={true}
              onChange={(loc) => {
                setPrimaryGarageLocation(loc);
                if (typeof window !== "undefined") {
                  localStorage.setItem(`nextgear_vendor_garage_${vendorId}`, JSON.stringify(loc));
                }
                setNewVehicle((prev) => ({
                  ...prev,
                  city: loc.city || prev.city,
                  state: loc.state || prev.state,
                  latitude: loc.lat,
                  longitude: loc.lng,
                }));
              }}
            />

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[11px] text-white/50">
                Auto-saves changes in real time
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowGarageLocationModal(false);
                  showFeedback("Default shop location updated successfully!");
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer"
              >
                Save & Close ✅
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🔔 ALERTS & FEEDBACK */}
      {feedback && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
      {syncError && (
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 animate-[fadeIn_0.2s_ease-out]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}
      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
          <span>Syncing changes with server...</span>
        </div>
      )}

      {/* 🔍 STREAMLINED SEARCH & MODERN CATEGORY PILLS BAR + 3D GRID SWITCHER */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-md p-2.5 md:p-3.5 space-y-2.5 shadow-lg">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title, city, number plate..."
              className="w-full pl-9 pr-8 py-2 md:py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs md:text-sm text-white placeholder-white/40 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative w-32 sm:w-44 shrink-0">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "newest" | "priceAsc" | "priceDesc" | "availabilityDesc")
              }
              className="w-full pl-7 pr-7 py-2 md:py-2.5 rounded-xl border border-white/10 bg-black/40 text-[11px] md:text-xs font-semibold text-white focus:border-red-500 appearance-none cursor-pointer truncate"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low</option>
              <option value="priceDesc">Price: High</option>
              <option value="availabilityDesc">Availability</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
          </div>

          {/* 3D Grid vs List View Mode Toggle */}
          <div className="flex items-center gap-1 bg-black/50 border border-white/10 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              title="3D Grid View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
          <button
            onClick={() => setTypeFilter("all")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              typeFilter === "all"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/20 border border-red-400/40"
                : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>All</span>
            <span className="ml-1 px-1 py-0.2 rounded-md bg-black/30 text-[9px] font-mono">{fleetVehicles.length}</span>
          </button>

          <button
            onClick={() => setTypeFilter("car")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              typeFilter === "car"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/20 border border-red-400/40"
                : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5"
            }`}
          >
            <Car className="w-3 h-3" />
            <span>Cars</span>
            <span className="ml-1 px-1 py-0.2 rounded-md bg-black/30 text-[9px] font-mono">{carCount}</span>
          </button>

          <button
            onClick={() => setTypeFilter("bike")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              typeFilter === "bike"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/20 border border-red-400/40"
                : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5"
            }`}
          >
            <Bike className="w-3 h-3" />
            <span>Bikes</span>
            <span className="ml-1 px-1 py-0.2 rounded-md bg-black/30 text-[9px] font-mono">{bikeCount}</span>
          </button>

          <button
            onClick={() => setTypeFilter("scooty")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              typeFilter === "scooty"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/20 border border-red-400/40"
                : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5"
            }`}
          >
            <span>🛵</span>
            <span>Scooters</span>
            <span className="ml-1 px-1 py-0.2 rounded-md bg-black/30 text-[9px] font-mono">{scooterCount}</span>
          </button>

          {(searchTerm || typeFilter !== "all" || sortBy !== "newest") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setSortBy("newest");
              }}
              className="ml-auto px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-red-400 hover:bg-white/10 transition shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ➕ ADD VEHICLE FORM (WITH 4-PHOTO MULTI-ANGLE GALLERY) */}
      {showAddForm && (
        <div className="rounded-3xl border border-red-500/30 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-4 md:p-6 shadow-2xl space-y-4 md:space-y-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-extrabold text-white">Add New Vehicle to Fleet</h3>
                <p className="text-[11px] text-white/50">Fill in details & upload up to 4 multi-angle photos</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-7 space-y-4">
              {/* Basic Details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    Vehicle Model / Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newVehicle.title}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="e.g. Royal Enfield Hunter 350 or Hyundai Creta"
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs md:text-sm text-white placeholder-white/30 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Category</label>
                  <select
                    value={newVehicle.type}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, type: event.target.value as VehicleType }))}
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs md:text-sm text-white focus:border-red-500"
                  >
                    <option value="car">🚗 Car</option>
                    <option value="bike">🏍️ Bike</option>
                    <option value="scooty">🛵 Scooty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={newVehicle.seats}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, seats: event.target.value }))}
                    placeholder="e.g. 2 or 5"
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs md:text-sm text-white placeholder-white/30 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Number Plate (Reg)</label>
                  <input
                    value={newVehicle.vehicleNumber}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
                    placeholder="e.g. DL 01 AB 1234"
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs md:text-sm text-white placeholder-white/30 focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Daily Rate (24 Hours) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={newVehicle.pricePerDayINR}
                      onChange={(event) => setNewVehicle((prev) => ({ ...prev, pricePerDayINR: event.target.value }))}
                      placeholder="1500"
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/30 pl-7 pr-3 py-2 text-xs md:text-sm font-bold text-emerald-300 placeholder-white/30 focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* State & City */}
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Operating City Hub</label>
                <IndiaStateCitySelector
                  selectedState={newVehicle.state}
                  selectedCity={newVehicle.city}
                  onStateChange={(st) => setNewVehicle((prev) => ({ ...prev, state: st }))}
                  onCityChange={(ct) => setNewVehicle((prev) => ({ ...prev, city: ct }))}
                  showAirportHint={false}
                />
              </div>

              {/* 📍 SMART VEHICLE PICKUP LOCATION (DEFAULT VS CUSTOM TOGGLE) */}
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>Pickup Location for this Vehicle</span>
                  </label>
                  <span className="text-[10px] text-white/50">Pinpoint accuracy for customer navigation</span>
                </div>

                {/* Switcher Pills */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setNewVehicle((prev) => ({ ...prev, locationMode: "default", useCustomLocation: false }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newVehicle.locationMode === "default"
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <span>🏠 Use My Default Shop Pin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVehicle((prev) => ({ ...prev, locationMode: "custom", useCustomLocation: true }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newVehicle.locationMode === "custom"
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <span>📍 Custom Pin / Airport Hub</span>
                  </button>
                </div>

                {/* Default Shop Location Info Card */}
                {newVehicle.locationMode === "default" && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-300">
                          {primaryGarageLocation.address || "NextGear Hub, Sector 62, Noida"}
                        </span>
                      </div>
                      {primaryGarageLocation.landmark && (
                        <p className="text-[11px] text-white/60">
                          Landmark: <strong>{primaryGarageLocation.landmark}</strong>
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-white/40">
                        GPS: {primaryGarageLocation.lat.toFixed(4)}, {primaryGarageLocation.lng.toFixed(4)} (Zero-click auto fill)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGarageLocationModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition cursor-pointer border border-white/10 shrink-0"
                    >
                      Change Pin ⚙️
                    </button>
                  </div>
                )}

                {/* Custom Location Interactive Map Picker */}
                {newVehicle.locationMode === "custom" && (
                  <div className="pt-1">
                    <InteractiveLocationPicker
                      initialLocation={{
                        address: newVehicle.pickupAddress || primaryGarageLocation.address,
                        landmark: newVehicle.pickupLandmark || "",
                        lat: newVehicle.latitude || primaryGarageLocation.lat,
                        lng: newVehicle.longitude || primaryGarageLocation.lng,
                        city: newVehicle.city,
                        state: newVehicle.state,
                      }}
                      onChange={(loc) => {
                        setNewVehicle((prev) => ({
                          ...prev,
                          pickupAddress: loc.address,
                          pickupLandmark: loc.landmark,
                          latitude: loc.lat,
                          longitude: loc.lng,
                          city: loc.city || prev.city,
                          state: loc.state || prev.state,
                        }));
                      }}
                      title="Custom Pickup Point for this Vehicle"
                      subtitle="Select exact terminal, yard or branch location on map"
                    />
                  </div>
                )}
              </div>

              {/* 📸 4-PHOTO MULTI-ANGLE GALLERY UPLOADER */}
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className="block text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-red-400" />
                      <span>Vehicle Photo Gallery</span>
                      <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Up to 4 Photos
                      </span>
                    </label>
                    <p className="text-[10px] text-white/50 mt-0.5">Upload cover, side, back & interior shots for maximum bookings</p>
                  </div>

                  {/* Bulk Select Button */}
                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] cursor-pointer transition active:scale-95 border border-white/15 shrink-0">
                    <Upload className="w-3 h-3 text-red-400" />
                    <span>{isBulkUploading ? "Uploading 4..." : "Upload 4 at Once"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                      disabled={isBulkUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 4 Photo Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PHOTO_SLOTS.map((slot) => {
                    const currentUrl = newVehicle.imageUrls[slot.id];
                    const isUploadingThis = uploadingSlot === slot.id;

                    return (
                      <div
                        key={slot.id}
                        className={`relative rounded-2xl border p-2 flex flex-col items-center justify-between transition group/slot aspect-[4/3] sm:aspect-square overflow-hidden ${
                          currentUrl
                            ? "border-emerald-500/40 bg-black/60 shadow-md"
                            : "border-dashed border-white/20 bg-neutral-950/60 hover:border-red-500/50 hover:bg-red-950/10"
                        }`}
                      >
                        {currentUrl ? (
                          <>
                            <img
                              src={currentUrl}
                              alt={slot.title}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/slot:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 rounded-xl">
                              <label className="px-2 py-1 rounded-lg bg-red-600 text-white text-[9px] font-bold cursor-pointer hover:bg-red-500">
                                Replace
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleSlotUpload(slot.id, file);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <button
                              onClick={() => {
                                setNewVehicle((prev) => {
                                  const next = [...prev.imageUrls];
                                  next[slot.id] = "";
                                  return { ...prev, imageUrls: next };
                                });
                              }}
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[10px] shadow hover:bg-red-500"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                            <span className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[8px] font-extrabold text-white truncate text-center">
                              {slot.title}
                            </span>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer p-1">
                            {isUploadingThis ? (
                              <RefreshCw className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <>
                                <span className="text-base mb-0.5">{slot.icon}</span>
                                <span className="text-[10px] font-extrabold text-white leading-tight">
                                  {slot.title}
                                </span>
                                <span className="text-[8px] text-white/40 mt-0.5 block">
                                  {slot.id === 0 ? "Cover Photo *" : "Tap to add"}
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSlotUpload(slot.id, file);
                              }}
                              disabled={isUploadingThis}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Direct Image URL input for primary cover photo */}
                <div className="pt-1">
                  <input
                    value={newVehicle.imageUrls[0]}
                    onChange={(event) => {
                      const url = event.target.value;
                      setNewVehicle((prev) => {
                        const next = [...prev.imageUrls];
                        next[0] = url;
                        return { ...prev, imageUrls: next };
                      });
                    }}
                    placeholder="Or paste Cover Photo URL directly (https://...)"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white placeholder-white/30"
                  />
                </div>
              </div>

              {/* Hourly Rates */}
              <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-3 space-y-2">
                <span className="text-xs font-bold text-white/80 block">Hourly Rates (Optional)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-white/40 block mb-0.5">1-Hr</span>
                    <input
                      type="number"
                      min={0}
                      value={newVehicle.price1HrINR}
                      onChange={(event) => setNewVehicle((prev) => ({ ...prev, price1HrINR: event.target.value }))}
                      placeholder="₹ Optional"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block mb-0.5">3-Hr</span>
                    <input
                      type="number"
                      min={0}
                      value={newVehicle.price3HrINR}
                      onChange={(event) => setNewVehicle((prev) => ({ ...prev, price3HrINR: event.target.value }))}
                      placeholder="₹ Optional"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block mb-0.5">6-Hr</span>
                    <input
                      type="number"
                      min={0}
                      value={newVehicle.price6HrINR}
                      onChange={(event) => setNewVehicle((prev) => ({ ...prev, price6HrINR: event.target.value }))}
                      placeholder="₹ Optional"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block mb-0.5">12-Hr</span>
                    <input
                      type="number"
                      min={0}
                      value={newVehicle.price12HrINR}
                      onChange={(event) => setNewVehicle((prev) => ({ ...prev, price12HrINR: event.target.value }))}
                      placeholder="₹ Optional"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Live Preview */}
            <div className="lg:col-span-5 space-y-2 flex flex-col items-center justify-center">
              <div className="text-center">
                <span className="text-[9px] md:text-[10px] font-extrabold text-red-400 uppercase tracking-widest bg-red-950/60 border border-red-500/30 px-3 py-0.5 rounded-full">
                  👁️ Catalog Live Preview
                </span>
              </div>
              <LiveVehicleCardPreview
                title={newVehicle.title}
                city={newVehicle.city}
                type={newVehicle.type}
                seats={newVehicle.seats}
                pricePerDayINR={newVehicle.pricePerDayINR}
                vehicleNumber={newVehicle.vehicleNumber}
                imageUrl={newVehicle.imageUrls[0]}
                imageUrls={newVehicle.imageUrls.filter(Boolean)}
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-white/70 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={addVehicle}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 transition"
            >
              + Publish Listing ({newVehicle.imageUrls.filter(Boolean).length} Photos)
            </button>
          </div>
        </div>
      )}

      {/* 🏎️ VEHICLE CATALOG: 3D GRID VIEW OR SLEEK LIST VIEW */}
      {fleetVehicles.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-neutral-900/40 p-8 md:p-12 text-center space-y-3">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-2xl md:text-3xl">
            🚗
          </div>
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-bold text-white">No vehicles in your fleet yet</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Start earning by adding your first car, bike, or scooter to the Next Gear rental marketplace.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-600/30 hover:brightness-110 transition"
          >
            + Add Your First Vehicle
          </button>
        </div>
      ) : displayedVehicles.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-neutral-900/40 p-6 text-center space-y-2">
          <p className="text-xs md:text-sm font-semibold text-white/80">No vehicles match your search filter.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("all");
            }}
            className="text-xs text-red-400 hover:underline font-bold"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4.5"
              : "space-y-3 md:space-y-4"
          }
        >
          {displayedVehicles.map((vehicle) => {
            const activeBooking = bookings?.find((b) => {
              const matchesId =
                b.vehicleId === vehicle.id ||
                b.vehicle?.id === vehicle.id ||
                b.vehicleTitle?.toLowerCase() === vehicle.title.toLowerCase();
              const isConfirmed = b.status === "CONFIRMED" || b.status === "PAID" || b.status === "confirmed";
              return matchesId && isConfirmed;
            });

            const isAvailable = (vehicle.operationalStatus ?? "AVAILABLE") === "AVAILABLE";

            const vType = (vehicle.type || "car").toLowerCase();
            const isCar = vType === "car";
            const isBike = vType.includes("bike");
            const isScoot = vType.includes("scoot");
            const photos = vehicle.imageUrls && vehicle.imageUrls.length > 0 ? vehicle.imageUrls : [];

            // Mock telematics data for realistic demo
            const vehicleDocs = docsData[vehicle.id] || {
              insuranceDays: 140,
              pucDays: 12,
              serviceKm: 1200,
              gpsStatus: "Parked at Hub",
            };

            return (
              <div
                key={vehicle.id}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/95 via-neutral-900/80 to-neutral-950/95 backdrop-blur-xl p-3.5 md:p-4 shadow-xl hover:border-red-500/40 hover:shadow-[0_15px_35px_rgba(225,29,72,0.18)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* 3D Depth Top Gradient Glow */}
                <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <div className="space-y-3">
                  {/* Image Banner with Floating Badges */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-[16/10] w-full group/img shadow-inner">
                    <img
                      src={photos[0] || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop"}
                      alt={vehicle.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Floating Category Badge Top-Left */}
                    <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                      {isCar ? "🚗 Car" : isBike ? "🏍️ Bike" : "🛵 Scooter"}
                    </div>

                    {/* Photo Count Pill */}
                    {photos.length > 1 && (
                      <div className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-[9px] font-bold text-white shadow">
                        <Camera className="w-2.5 h-2.5 text-red-400" />
                        <span>{photos.length} Photos</span>
                      </div>
                    )}

                    {/* Live Online/Offline 1-Tap Toggle Top-Right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOperationalStatus(vehicle.id, isAvailable ? "UNAVAILABLE" : "AVAILABLE");
                      }}
                      disabled={isSyncing}
                      title="Tap to toggle Online/Offline"
                      className={`absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition active:scale-90 cursor-pointer backdrop-blur-md border shadow-lg ${
                        isAvailable
                          ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/90"
                          : "bg-amber-950/90 text-amber-300 border-amber-500/50 hover:bg-amber-900/90"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                      <span>{isAvailable ? "Live" : "Offline"}</span>
                    </button>

                    {/* Active In-Ride Banner */}
                    {activeBooking && (
                      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-xl bg-red-600/90 backdrop-blur-md border border-red-400 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>🔴 In-Ride Booking</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Price Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-white tracking-tight truncate group-hover:text-red-400 transition-colors">
                        {vehicle.title}
                      </h3>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-white text-neutral-900 font-mono font-black text-[10px] rounded border border-neutral-300 shadow-sm tracking-wider uppercase shrink-0">
                          <span className="bg-blue-700 text-white text-[6px] font-bold px-0.5 rounded-[1px] leading-none">IND</span>
                          <span>{vehicle.vehicleNumber || "NOT SET"}</span>
                        </div>
                        <span className="text-[10px] text-white/50 truncate">📍 {vehicle.city}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-400 font-mono tracking-tight block">
                        ₹{vehicle.pricePerDayINR.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[9px] text-white/40 block -mt-1">/ 24 hrs</span>
                    </div>
                  </div>

                  {/* 🛡️ FEATURE 4: TELEMATICS, GPS & DOCUMENT STATUS CHIPS */}
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>GPS Live: {vehicleDocs.gpsStatus}</span>
                      </span>
                      <span className="text-white/40 font-mono">📡 Signal 98%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[8px] md:text-[9px] font-semibold text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-blue-300 truncate">
                        📄 Ins: {vehicleDocs.insuranceDays}d
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 truncate">
                        ⚠️ PUC: {vehicleDocs.pucDays}d
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 truncate">
                        🧰 {vehicleDocs.serviceKm} km
                      </span>
                    </div>
                  </div>

                  {/* Specs Chips Row */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-white/60">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                      <Users className="w-3 h-3 text-white/40" /> {vehicle.seats} Seats
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 capitalize">
                      <Fuel className="w-3 h-3 text-white/40" /> {vehicle.fuel || "Petrol"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                      <Calendar className="w-3 h-3 text-white/40" /> {vehicle.availableDates.length}d
                    </span>

                    {/* Surge Toggle Button */}
                    <button
                      onClick={() => toggleWeekendSurge(vehicle.id, !vehicle.weekendSurgeActive)}
                      disabled={isSyncing}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition active:scale-95 cursor-pointer border ${
                        vehicle.weekendSurgeActive
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      <Zap className={`w-2.5 h-2.5 ${vehicle.weekendSurgeActive ? "text-amber-400 fill-amber-400" : "text-white/40"}`} />
                      <span>{vehicle.weekendSurgeActive ? "Surge: ON" : "Surge: OFF"}</span>
                    </button>
                  </div>
                </div>

                {/* 🔴 Active Booking Banner if ongoing */}
                {activeBooking && (
                  <div className="mt-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-2.5 text-[10px] text-white space-y-1">
                    <div className="flex items-center justify-between font-bold text-red-400">
                      <span className="truncate">👤 {activeBooking.user?.name || activeBooking.customerName || "Customer"}</span>
                      <span className="text-emerald-400 font-mono">₹{activeBooking.totalAmountINR}</span>
                    </div>
                    <p className="text-white/50 text-[9px]">
                      Dates: {String(activeBooking.startDate).slice(5, 10)} ➔ {String(activeBooking.endDate).slice(5, 10)}
                    </p>
                  </div>
                )}

                {/* ⚙️ 6-Button Touch Action Bar */}
                <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-6 gap-1 text-center">
                  <button
                    onClick={() => beginEditPricing(vehicle)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[9px] font-bold transition cursor-pointer border ${
                      editingPriceId === vehicle.id
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    }`}
                    title="Edit Pricing"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Rates</span>
                  </button>

                  <button
                    onClick={() => openAvailability(vehicle)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[9px] font-bold transition cursor-pointer border ${
                      activeAvailabilityId === vehicle.id
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    }`}
                    title="Manage Dates"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Dates</span>
                  </button>

                  <button
                    onClick={() => beginEditPhoto(vehicle)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[9px] font-bold transition cursor-pointer border ${
                      editingPhotoId === vehicle.id
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    }`}
                    title="Manage 4 Photos"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Photos</span>
                  </button>

                  <button
                    onClick={() => beginEditDocs(vehicle)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[9px] font-bold transition cursor-pointer border ${
                      editingDocsId === vehicle.id
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    }`}
                    title="Manage Documents & Service"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Docs</span>
                  </button>

                  <button
                    onClick={() => beginEditNumber(vehicle)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[9px] font-bold transition cursor-pointer border ${
                      editingNumberId === vehicle.id
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    }`}
                    title="Edit Plate"
                  >
                    <span className="text-[10px] shrink-0">🇮🇳</span>
                    <span>Plate</span>
                  </button>

                  <button
                    onClick={() => removeVehicle(vehicle.id, vehicle.title)}
                    className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 transition cursor-pointer"
                    title="Delete listing"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Del</span>
                  </button>
                </div>

                {/* 💰 INLINE PRICING DRAWER */}
                {editingPriceId === vehicle.id && (
                  <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-black/90 p-3 space-y-2.5 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Edit Rates (₹)
                      </span>
                      <button onClick={() => setEditingPriceId(null)} className="text-white/40 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-emerald-300 block mb-0.5">24-Hr Daily *</span>
                        <input
                          type="number"
                          min={1}
                          value={priceDraft}
                          onChange={(e) => setPriceDraft(e.target.value)}
                          className="w-full rounded-lg border border-emerald-500/40 bg-black px-2 py-1 text-xs text-emerald-300 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-white/50 block mb-0.5">Waiver (₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={addonWaiverDraft}
                          onChange={(e) => setAddonWaiverDraft(e.target.value)}
                          placeholder="99"
                          className="w-full rounded-lg border border-white/10 bg-black px-2 py-1 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] text-white/60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => savePricing(vehicle.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-[10px] font-bold text-white shadow"
                      >
                        Save Rates
                      </button>
                    </div>
                  </div>
                )}

                {/* 🛡️ INLINE TELEMATICS & DOCS DRAWER */}
                {editingDocsId === vehicle.id && (
                  <div className="mt-3 rounded-2xl border border-cyan-500/40 bg-black/95 p-3 space-y-2.5 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Telematics & Documents
                      </span>
                      <button onClick={() => setEditingDocsId(null)} className="text-white/40 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-white/50 block mb-0.5">Insurance Expiry</span>
                        <input
                          defaultValue="2026-07-15"
                          type="date"
                          className="w-full rounded-lg border border-white/10 bg-black px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-amber-300 block mb-0.5">PUC Renewal Date</span>
                        <input
                          defaultValue="2026-03-12"
                          type="date"
                          className="w-full rounded-lg border border-amber-500/30 bg-black px-2 py-1 text-[11px] text-amber-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                      <span className="text-emerald-400 font-bold">🟢 GPS Hardware Online</span>
                      <button
                        onClick={() => {
                          setEditingDocsId(null);
                          showFeedback("Vehicle documents verified & saved!");
                        }}
                        className="px-3 py-1 rounded-lg bg-cyan-600 text-white font-bold"
                      >
                        Save Records
                      </button>
                    </div>
                  </div>
                )}

                {/* 📅 INLINE DATES DRAWER */}
                {activeAvailabilityId === vehicle.id && (
                  <div className="mt-3 rounded-2xl border border-blue-500/30 bg-black/90 p-3 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Dates (YYYY-MM-DD)
                      </span>
                      <button onClick={() => setActiveAvailabilityId(null)} className="text-white/40 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={availabilityDraft}
                      onChange={(e) => setAvailabilityDraft(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-black p-2 text-[11px] text-white font-mono"
                      placeholder="2026-03-01&#10;2026-03-02"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveAvailabilityId(null)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] text-white/60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveAvailability(vehicle.id)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-[10px] font-bold text-white shadow"
                      >
                        Save Dates
                      </button>
                    </div>
                  </div>
                )}

                {/* 📝 INLINE NUMBER PLATE DRAWER */}
                {editingNumberId === vehicle.id && (
                  <div className="mt-3 rounded-2xl border border-purple-500/30 bg-black/90 p-3 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider">
                        License Plate
                      </span>
                      <button onClick={() => setEditingNumberId(null)} className="text-white/40 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={numberDraft}
                        onChange={(e) => setNumberDraft(e.target.value)}
                        placeholder="DL 01 AB 1234"
                        className="flex-1 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                      />
                      <button
                        onClick={() => saveVehicleNumber(vehicle.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 text-[10px] font-bold text-white shadow"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* 📸 INLINE 4-PHOTO GALLERY DRAWER */}
                {editingPhotoId === vehicle.id && (
                  <div className="mt-3 rounded-2xl border border-purple-500/40 bg-black/95 p-3.5 space-y-3 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Manage 4 Listing Photos
                      </span>
                      <button onClick={() => setEditingPhotoId(null)} className="text-white/40 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PHOTO_SLOTS.map((slot) => {
                        const currentUrl = photoDrafts[slot.id];
                        const isUploadingThis = uploadingSlot === slot.id;

                        return (
                          <div
                            key={slot.id}
                            className={`relative rounded-xl border p-1.5 flex flex-col items-center justify-between aspect-square overflow-hidden ${
                              currentUrl
                                ? "border-purple-500/40 bg-neutral-900 shadow-md"
                                : "border-dashed border-white/20 bg-neutral-950"
                            }`}
                          >
                            {currentUrl ? (
                              <>
                                <img
                                  src={currentUrl}
                                  alt={slot.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => {
                                    setPhotoDrafts((prev) => {
                                      const next = [...prev];
                                      next[slot.id] = "";
                                      return next;
                                    });
                                  }}
                                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] shadow hover:bg-red-500"
                                >
                                  ✕
                                </button>
                                <span className="absolute bottom-1 left-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[7px] font-bold text-white text-center truncate">
                                  {slot.title}
                                </span>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer p-0.5">
                                {isUploadingThis ? (
                                  <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                                ) : (
                                  <>
                                    <span className="text-sm">{slot.icon}</span>
                                    <span className="text-[9px] font-bold text-white/80 leading-none mt-1">
                                      {slot.title}
                                    </span>
                                    <span className="text-[7px] text-white/40 mt-0.5">+ Add</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleEditSlotUpload(slot.id, file);
                                  }}
                                  disabled={isUploadingThis}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => setEditingPhotoId(null)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] text-white/60 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => savePhotos(vehicle.id)}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-[10px] font-extrabold text-white shadow-lg shadow-purple-600/30 active:scale-95"
                      >
                        Save All Photos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🗑️ REMOVE VEHICLE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="max-w-md w-full rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-[#1c080d] via-[#140609] to-[#0d0305] p-5 md:p-6 space-y-4 shadow-[0_0_60px_rgba(239,68,68,0.35)] relative text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-3 bg-red-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-950 border border-red-500/50 flex items-center justify-center text-2xl md:text-3xl shadow-lg relative z-10">
                🗑️
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="inline-block rounded-full bg-red-500/10 border border-red-500/30 px-3 py-0.5 text-[9px] md:text-[10px] font-extrabold text-red-400 uppercase tracking-widest">
                Confirm Listing Removal
              </span>
              <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">Remove "{deleteTarget.title}"?</h3>
              <p className="text-xs text-white/70 leading-relaxed px-2">
                Are you sure you want to remove this vehicle from your active fleet? It will no longer appear on Next Gear marketplace.
              </p>
            </div>

            <div className="bg-red-950/40 border border-red-500/20 rounded-2xl p-3 text-[11px] text-red-300 text-left flex items-start gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <p className="leading-relaxed">
                <strong>Note:</strong> Past booking records and payout history remain safely preserved.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmRemoveVehicle()}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Yes, Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function LiveVehicleCardPreview({
  title,
  city,
  type,
  seats,
  fuel,
  transmission,
  pricePerDayINR,
  vehicleNumber,
  imageUrl,
  imageUrls,
  airportPickup = false,
}: {
  title?: string;
  city?: string;
  type?: string;
  seats?: string | number;
  fuel?: string;
  transmission?: string;
  pricePerDayINR?: string | number;
  vehicleNumber?: string;
  imageUrl?: string;
  imageUrls?: string[];
  airportPickup?: boolean;
}) {
  const displayTitle = title?.trim() || "Vehicle Title / Model";
  const displayCity = city?.trim() || "City Hub";
  const displaySeats = seats || "5";
  const displayFuel = (fuel || "petrol").toLowerCase();
  const displayTrans = (transmission || "manual").toLowerCase();
  const displayPrice = Number(pricePerDayINR) || 1200;
  const displayImages = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  const displayImage =
    displayImages[selectedImgIndex] ||
    displayImages[0] ||
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";

  const t = (type || "car").toLowerCase();
  const isCar = t.includes("car");
  const isBike = t.includes("bike");
  const isScoot = t.includes("scoot");

  const badgeIcon = isBike ? "🏍️" : isScoot ? "🛵" : "🚗";
  const badgeLabel = isBike ? "BIKE" : isScoot ? "SCOOTER" : "CAR";

  return (
    <div className="rounded-3xl border border-red-500/30 bg-gradient-to-b from-[#18080a] via-[#0d070b] to-[#0a0a0a] p-3.5 text-white shadow-2xl relative overflow-hidden max-w-sm w-full mx-auto transition-all">
      {/* Live Badge Watermark Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 border border-red-400 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
          <span>Catalog Live Preview</span>
        </div>
        <span className="text-[10px] font-semibold text-white/50">Next Gear View</span>
      </div>

      {/* Image Banner */}
      <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-inner">
        <img
          src={displayImage}
          alt={displayTitle}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";
          }}
        />
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold text-amber-400 border border-white/15 shadow-lg">
          <span>⭐</span>
          <span>4.9</span>
        </div>

        {/* Multi-Photo Dots Selector */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-20">
            {displayImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImgIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  selectedImgIndex === idx ? "w-4 bg-red-500 shadow" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Title & Badges */}
      <div className="mt-3 space-y-1.5">
        <p className="text-sm md:text-base font-bold text-white line-clamp-1">{displayTitle}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-500/40 px-2 py-0.5 text-[9px] font-black text-red-400 uppercase tracking-wider">
            <span>{badgeIcon}</span>
            <span>{badgeLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 text-[9px] font-semibold text-blue-300">
            📍 {displayCity.split(",")[0]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[9px] font-semibold text-white/80">
            👤 {displaySeats} Seats
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-2 text-xs text-white/70 pt-0.5">
          <span className="capitalize">⛽ {displayFuel}</span>
          <span className="text-white/20">•</span>
          <span className="capitalize">⚙️ {displayTrans}</span>
          <span className="text-white/20">•</span>
          <span>{airportPickup ? "✈️ Airport" : "🏙️ Hub"}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-950/60 px-2.5 py-0.5 text-[9px] font-extrabold text-green-400 border border-green-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            AVAILABLE
          </span>
          {vehicleNumber ? (
            <span className="text-[9px] text-white/40 font-mono tracking-wider">{vehicleNumber}</span>
          ) : null}
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Daily Rate</span>
          <div>
            <span className="text-base md:text-lg font-black text-emerald-400 font-mono">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-white/60"> / day</span>
          </div>
        </div>

        <div className="mt-2.5 flex gap-2">
          <div className="flex-1 text-center rounded-xl border border-white/15 bg-white/5 py-1.5 text-xs font-bold text-white/60 cursor-not-allowed">
            Details
          </div>
          <div className="flex-1 text-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 cursor-not-allowed">
            Book Now →
          </div>
        </div>
      </div>
    </div>
  );
}
