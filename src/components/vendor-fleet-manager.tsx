"use client";

import { useEffect, useMemo, useState } from "react";
import type { Vehicle, VehicleType } from "@/lib/types";
import { formatBookingId } from "@/lib/pricing-tiers";
import { Upload, Image as ImageIcon, CheckCircle, Trash2 } from "lucide-react";

type VendorFleetManagerProps = {
  initialFleetVehicles: Vehicle[];
  vendorId: string;
  bookings?: any[];
};

export function VendorFleetManager({ initialFleetVehicles, vendorId, bookings }: VendorFleetManagerProps) {
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>(initialFleetVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | VehicleType>("all");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc" | "availabilityDesc">("newest");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeAvailabilityId, setActiveAvailabilityId] = useState<string | null>(null);
  const [activeAnalyticsId, setActiveAnalyticsId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [addonWaiverDraft, setAddonWaiverDraft] = useState("");
  const [addonRsaDraft, setAddonRsaDraft] = useState("");
  const [addonHelmetDraft, setAddonHelmetDraft] = useState("");
  const [price1HrDraft, setPrice1HrDraft] = useState("");
  const [price3HrDraft, setPrice3HrDraft] = useState("");
  const [price6HrDraft, setPrice6HrDraft] = useState("");
  const [price12HrDraft, setPrice12HrDraft] = useState("");
  const [numberDraft, setNumberDraft] = useState("");
  const [photoDraft, setPhotoDraft] = useState("");
  const [availabilityDraft, setAvailabilityDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [isUploadingNewPhoto, setIsUploadingNewPhoto] = useState(false);
  const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false);
  const [isDragOverNewPhoto, setIsDragOverNewPhoto] = useState(false);
  const [isDragOverEditPhoto, setIsDragOverEditPhoto] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    title: "",
    city: "",
    type: "car" as VehicleType,
    seats: "5",
    pricePerDayINR: "1500",
    vehicleNumber: "",
    imageUrl: "",
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
          : vehicle.title.toLowerCase().includes(normalizedSearch) || vehicle.city.toLowerCase().includes(normalizedSearch);

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
    setTimeout(() => setFeedback(""), 1800);
  }

  async function uploadImageFile(file: File) {
    const compressedFile = await compressImageFile(file);
    const formData = new FormData();
    formData.append("file", compressedFile);

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

  async function compressImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    if (file.size <= 900 * 1024) {
      return file;
    }

    const imageBitmap = await createImageBitmap(file);
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height));
    const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob) {
      return file;
    }

    return new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function handleNewVehicleFileUpload(file: File) {
    try {
      setIsUploadingNewPhoto(true);
      setSyncError("");
      const imageUrl = await uploadImageFile(file);
      setNewVehicle((prev) => ({ ...prev, imageUrl }));
      showFeedback("Photo uploaded. Save vehicle to attach it.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      setIsUploadingNewPhoto(false);
    }
  }

  async function handleEditVehicleFileUpload(file: File) {
    try {
      setIsUploadingEditPhoto(true);
      setSyncError("");
      const imageUrl = await uploadImageFile(file);
      setPhotoDraft(imageUrl);
      showFeedback("Photo uploaded. Click Save photo to apply.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      setIsUploadingEditPhoto(false);
    }
  }

  async function handleNewVehicleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await handleNewVehicleFileUpload(file);
    event.target.value = "";
  }

  async function handleEditPhotoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await handleEditVehicleFileUpload(file);
    event.target.value = "";
  }

  function onDropNewPhoto(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOverNewPhoto(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void handleNewVehicleFileUpload(file);
  }

  function onDropEditPhoto(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOverEditPhoto(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void handleEditVehicleFileUpload(file);
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
    const addonWaiverPrice = newVehicle.addonWaiverPrice ? Number(newVehicle.addonWaiverPrice) : null;
    const addonRsaPrice = newVehicle.addonRsaPrice ? Number(newVehicle.addonRsaPrice) : null;
    const addonHelmetPrice = newVehicle.addonHelmetPrice ? Number(newVehicle.addonHelmetPrice) : null;

    if (newVehicle.addonWaiverPrice && (isNaN(Number(newVehicle.addonWaiverPrice)) || Number(newVehicle.addonWaiverPrice) < 0)) {
      showFeedback("Damage Waiver price must be a valid number >= 0.");
      return;
    }
    if (newVehicle.addonRsaPrice && (isNaN(Number(newVehicle.addonRsaPrice)) || Number(newVehicle.addonRsaPrice) < 0)) {
      showFeedback("Roadside Assist price must be a valid number >= 0.");
      return;
    }
    if (newVehicle.addonHelmetPrice && (isNaN(Number(newVehicle.addonHelmetPrice)) || Number(newVehicle.addonHelmetPrice) < 0)) {
      showFeedback("Helmet price must be a valid number >= 0.");
      return;
    }

    const price1HrINR = newVehicle.price1HrINR ? Number(newVehicle.price1HrINR) : null;
    const price3HrINR = newVehicle.price3HrINR ? Number(newVehicle.price3HrINR) : null;
    const price6HrINR = newVehicle.price6HrINR ? Number(newVehicle.price6HrINR) : null;
    const price12HrINR = newVehicle.price12HrINR ? Number(newVehicle.price12HrINR) : null;

    if (newVehicle.price1HrINR && (isNaN(Number(newVehicle.price1HrINR)) || Number(newVehicle.price1HrINR) < 0)) {
      showFeedback("Price 1 Hour must be a valid number >= 0.");
      return;
    }
    if (newVehicle.price3HrINR && (isNaN(Number(newVehicle.price3HrINR)) || Number(newVehicle.price3HrINR) < 0)) {
      showFeedback("Price 3 Hours must be a valid number >= 0.");
      return;
    }
    if (newVehicle.price6HrINR && (isNaN(Number(newVehicle.price6HrINR)) || Number(newVehicle.price6HrINR) < 0)) {
      showFeedback("Price 6 Hours must be a valid number >= 0.");
      return;
    }
    if (newVehicle.price12HrINR && (isNaN(Number(newVehicle.price12HrINR)) || Number(newVehicle.price12HrINR) < 0)) {
      showFeedback("Price 12 Hours must be a valid number >= 0.");
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch("/api/vendor/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVehicle.title,
          city: newVehicle.city,
          type: newVehicle.type,
          seats,
          pricePerDayINR,
          vehicleNumber: newVehicle.vehicleNumber,
          imageUrl: newVehicle.imageUrl,
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
      setNewVehicle({ title: "", city: "", type: "car", seats: "5", pricePerDayINR: "1500", vehicleNumber: "", imageUrl: "", addonWaiverPrice: "", addonRsaPrice: "", addonHelmetPrice: "", price1HrINR: "", price3HrINR: "", price6HrINR: "", price12HrINR: "" });
      showFeedback("Vehicle added to your fleet.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to add vehicle");
    } finally {
      setIsSyncing(false);
    }
  }

  function beginEditPricing(vehicle: Vehicle) {
    setEditingPriceId(vehicle.id);
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

    const nextWaiver = addonWaiverDraft ? Number(addonWaiverDraft) : null;
    const nextRsa = addonRsaDraft ? Number(addonRsaDraft) : null;
    const nextHelmet = addonHelmetDraft ? Number(addonHelmetDraft) : null;

    if (addonWaiverDraft && (isNaN(Number(addonWaiverDraft)) || Number(addonWaiverDraft) < 0)) {
      showFeedback("Damage Waiver price must be a valid number >= 0.");
      return;
    }
    if (addonRsaDraft && (isNaN(Number(addonRsaDraft)) || Number(addonRsaDraft) < 0)) {
      showFeedback("Roadside Assist price must be a valid number >= 0.");
      return;
    }
    if (addonHelmetDraft && (isNaN(Number(addonHelmetDraft)) || Number(addonHelmetDraft) < 0)) {
      showFeedback("Helmet price must be a valid number >= 0.");
      return;
    }

    const next1Hr = price1HrDraft ? Number(price1HrDraft) : null;
    const next3Hr = price3HrDraft ? Number(price3HrDraft) : null;
    const next6Hr = price6HrDraft ? Number(price6HrDraft) : null;
    const next12Hr = price12HrDraft ? Number(price12HrDraft) : null;

    if (price1HrDraft && (isNaN(Number(price1HrDraft)) || Number(price1HrDraft) < 0)) {
      showFeedback("Price 1 Hour must be a valid number >= 0.");
      return;
    }
    if (price3HrDraft && (isNaN(Number(price3HrDraft)) || Number(price3HrDraft) < 0)) {
      showFeedback("Price 3 Hours must be a valid number >= 0.");
      return;
    }
    if (price6HrDraft && (isNaN(Number(price6HrDraft)) || Number(price6HrDraft) < 0)) {
      showFeedback("Price 6 Hours must be a valid number >= 0.");
      return;
    }
    if (price12HrDraft && (isNaN(Number(price12HrDraft)) || Number(price12HrDraft) < 0)) {
      showFeedback("Price 12 Hours must be a valid number >= 0.");
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
          addonWaiverPrice: nextWaiver,
          addonRsaPrice: nextRsa,
          addonHelmetPrice: nextHelmet,
          price1HrINR: next1Hr,
          price3HrINR: next3Hr,
          price6HrINR: next6Hr,
          price12HrINR: next12Hr,
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
      showFeedback("Pricing updated.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update pricing");
    } finally {
      setIsSyncing(false);
    }
  }

  function beginEditNumber(vehicle: Vehicle) {
    setEditingNumberId(vehicle.id);
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
      showFeedback("Vehicle number updated.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update vehicle number");
    } finally {
      setIsSyncing(false);
    }
  }

  function openAvailability(vehicle: Vehicle) {
    setActiveAvailabilityId(vehicle.id);
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
      showFeedback("Availability updated.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update availability");
    } finally {
      setIsSyncing(false);
    }
  }

  function beginEditPhoto(vehicle: Vehicle) {
    setEditingPhotoId(vehicle.id);
    setPhotoDraft(vehicle.imageUrls?.[0] ?? "");
  }

  async function savePhoto(vehicleId: string) {
    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photoDraft.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update photo");
      }

      if (data?.vehicle) {
        setFleetVehicles((prev) => prev.map((v) => (v.id === vehicleId ? (data.vehicle as Vehicle) : v)));
      }

      setEditingPhotoId(null);
      showFeedback("Vehicle photo updated.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to update photo");
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
      if (activeAnalyticsId === deleteTarget.id) {
        setActiveAnalyticsId(null);
      }
      if (activeAvailabilityId === deleteTarget.id) {
        setActiveAvailabilityId(null);
      }
      if (editingPriceId === deleteTarget.id) {
        setEditingPriceId(null);
      }
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
        showFeedback(`Vehicle is now ${nextStatus === "AVAILABLE" ? "Listed Online" : "Unlisted Offline"}.`);
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
        showFeedback(`Weekend surge pricing is now ${nextSurgeActive ? "Enabled (+15% Fri-Sun)" : "Disabled"}.`);
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
  const scooterCount = useMemo(() => fleetVehicles.filter((v) => (v.type || "").toLowerCase().includes("scooter")).length, [fleetVehicles]);

  return (
    <section className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-6 shadow-2xl text-white">
      {/* DESKTOP-ONLY FLEET FIGURES & COLOR-CODED STATS BANNER */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Active vs Offline Fleet */}
        <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-slate-900/40 to-slate-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Status Ratio</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {onlineCount} Online
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{fleetVehicles.length} <span className="text-xs font-normal text-white/50">Vehicles</span></span>
            <span className="text-xs font-semibold text-rose-400">{offlineCount} Offline</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${(onlineCount / (fleetVehicles.length || 1)) * 100}%` }} />
            <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${(offlineCount / (fleetVehicles.length || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Card 2: Average Rental Rate */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900/40 to-slate-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Avg Fleet Rate</span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Per Day
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">₹{avgPricePerDay.toLocaleString("en-IN")}</span>
            <span className="text-xs font-medium text-slate-400">Avg / Unit</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 font-medium">Based on {fleetVehicles.length} vehicle listings</p>
        </div>

        {/* Card 3: Type Breakdown */}
        <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-slate-900/40 to-slate-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Type Mix</span>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              Categories
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-1 text-xs">
            <span className="text-blue-400 font-bold">Cars: {carCount}</span>
            <span className="text-emerald-400 font-bold">Bikes: {bikeCount}</span>
            <span className="text-amber-400 font-bold">Scooters: {scooterCount}</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: `${(carCount / (fleetVehicles.length || 1)) * 100}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${(bikeCount / (fleetVehicles.length || 1)) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(scooterCount / (fleetVehicles.length || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Card 4: Potential Earnings Capacity */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900/40 to-slate-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Est. Daily Yield</span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Full Capacity
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">₹{totalEarningsEstimate.toLocaleString("en-IN")}</span>
          </div>
          <p className="mt-2 text-[10px] text-amber-200/60 font-medium">Estimated daily potential if 100% booked</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>⚡</span> Fleet Management
          </h2>
          <p className="text-xs text-white/50 hidden sm:block">Manage listings, set operational status, and publish new vehicles</p>
        </div>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="rounded-full bg-gradient-to-r from-[var(--brand-red)] to-red-600 border border-red-400/40 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          {showAddForm ? "Close Form ✕" : "➕ Add Vehicle"}
        </button>
      </div>

      {feedback ? <p className="mb-3 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">{feedback}</p> : null}
      {syncError ? <p className="mb-3 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{syncError}</p> : null}
      {isSyncing ? <p className="mb-3 text-xs text-white/60 font-medium">Syncing changes with server...</p> : null}

      <div className="mb-4 grid gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 md:grid-cols-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by title or city"
          className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as "all" | VehicleType)}
          className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
        >
          <option value="all">All types</option>
          <option value="car">Car</option>
          <option value="bike">Bike</option>
          <option value="scooty">Scooty</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as "newest" | "priceAsc" | "priceDesc" | "availabilityDesc")
          }
          className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
        >
          <option value="newest">Sort: Newest</option>
          <option value="priceAsc">Sort: Price low to high</option>
          <option value="priceDesc">Sort: Price high to low</option>
          <option value="availabilityDesc">Sort: Most available days</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm("");
            setTypeFilter("all");
            setSortBy("newest");
          }}
          className="rounded-lg border border-white/15 text-white px-3 py-2 text-sm font-semibold transition hover:bg-white/5"
        >
          Reset filters
        </button>
      </div>

      {showAddForm ? (
        <>
          {/* ORIGINAL COMPACT MOBILE FORM (UNTOUCHED FOR MOBILE) */}
          <div className="md:hidden mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="grid gap-2 grid-cols-1">
              <input
                value={newVehicle.title}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Vehicle title"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                value={newVehicle.city}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="City"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <select
                value={newVehicle.type}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, type: event.target.value as VehicleType }))}
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="scooty">Scooty</option>
              </select>
              <input
                type="number"
                min={1}
                value={newVehicle.seats}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, seats: event.target.value }))}
                placeholder="Seats"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={1}
                value={newVehicle.pricePerDayINR}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, pricePerDayINR: event.target.value }))}
                placeholder="Price/day"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.addonWaiverPrice}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, addonWaiverPrice: event.target.value }))}
                placeholder="Waiver Price (₹99)"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.addonRsaPrice}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, addonRsaPrice: event.target.value }))}
                placeholder="RSA Price (₹49)"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.addonHelmetPrice}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, addonHelmetPrice: event.target.value }))}
                placeholder="Helmet Price (₹49)"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.price1HrINR}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, price1HrINR: event.target.value }))}
                placeholder="1-Hr Price"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.price3HrINR}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, price3HrINR: event.target.value }))}
                placeholder="3-Hr Price"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.price6HrINR}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, price6HrINR: event.target.value }))}
                placeholder="6-Hr Price"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                type="number"
                min={0}
                value={newVehicle.price12HrINR}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, price12HrINR: event.target.value }))}
                placeholder="12-Hr Price"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                value={newVehicle.vehicleNumber}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
                placeholder="Vehicle number"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <input
                value={newVehicle.imageUrl}
                onChange={(event) => setNewVehicle((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder="Photo URL"
                className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
              />
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverNewPhoto(true);
                }}
                onDragLeave={() => setIsDragOverNewPhoto(false)}
                onDrop={onDropNewPhoto}
                className={`rounded-lg border border-dashed px-3 py-2 text-sm transition ${
                  isDragOverNewPhoto ? "border-[var(--brand-red)] bg-red-500/10" : "border-white/20 bg-white/5"
                }`}
              >
                <p className="mb-2 text-xs text-white/60">Or upload photo from device</p>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleNewVehicleFileChange} className="text-xs text-white/70" />
                <p className="mt-2 text-xs text-white/40">Drag & drop image here or choose a file</p>
                {isUploadingNewPhoto ? <p className="mt-2 text-xs text-white/60">Uploading image...</p> : null}
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={addVehicle}
                className="w-full rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 shadow-[0_4px_15px_rgba(225,29,72,0.25)]"
              >
                Save Vehicle
              </button>
            </div>
          </div>

          {/* DESKTOP STRUCTURED FORM (EXCLUSIVE TO DESKTOP VIEW) */}
          <div className="hidden md:block mb-6 rounded-2xl border border-slate-800 bg-[#0c101c] p-6 shadow-2xl space-y-5">
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white tracking-wide">Add New Vehicle to Fleet</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in vehicle specifications, pricing, and upload a clear photo</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/40">
                New Listing Form
              </span>
            </div>

            {/* SECTION 1: Basic Specifications (BLUE CARD) */}
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/40">
                  1. Basic Specifications
                </span>
                <span className="text-[10px] font-bold text-blue-400/80">Vehicle Info & Type</span>
              </div>
              <div className="grid gap-4 md:grid-cols-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">
                    Vehicle Title / Model <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={newVehicle.title}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="e.g. Hyundai i20"
                    className="w-full rounded-lg border border-blue-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">
                    City / Location <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={newVehicle.city}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, city: event.target.value }))}
                    placeholder="e.g. Delhi"
                    className="w-full rounded-lg border border-blue-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newVehicle.type}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, type: event.target.value as VehicleType }))}
                    className="w-full rounded-lg border border-blue-900/60 bg-[#090d16] px-3 py-2 text-xs text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-medium"
                  >
                    <option value="car">Car (4-Wheeler)</option>
                    <option value="bike">Bike (Motorcycle)</option>
                    <option value="scooty">Scooter / Scooty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={newVehicle.seats}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, seats: event.target.value }))}
                    placeholder="e.g. 5"
                    className="w-full rounded-lg border border-blue-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">Vehicle Plate Number (Optional)</label>
                  <input
                    value={newVehicle.vehicleNumber}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
                    placeholder="e.g. DL-01-AB-1234"
                    className="w-full rounded-lg border border-blue-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Rental Pricing Structure (EMERALD GREEN CARD) */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/40">
                  2. Rental Pricing Structure (₹ INR)
                </span>
                <span className="text-[10px] font-bold text-emerald-400/80">Daily & Hourly Rates</span>
              </div>

              <div className="grid gap-4 md:grid-cols-5 pt-1">
                {/* Daily Base Price */}
                <div className="md:col-span-2 bg-emerald-950/50 border border-emerald-500/50 p-3 rounded-xl shadow-lg">
                  <label className="block text-[11px] font-extrabold text-emerald-300 mb-1">
                    Base Daily Rate (24 Hours) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-emerald-400">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={newVehicle.pricePerDayINR}
                      onChange={(event) => setNewVehicle((prev) => ({ ...prev, pricePerDayINR: event.target.value }))}
                      placeholder="1500"
                      className="w-full rounded-lg border border-emerald-500/60 bg-[#06140e] pl-7 pr-3 py-1.5 text-sm font-black text-emerald-300 placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-300/70 mt-1 font-medium">Standard full day 24-hr rental price</p>
                </div>

                {/* Hourly Prices */}
                <div>
                  <label className="block text-[11px] font-bold text-emerald-200 mb-1">1-Hr Rate</label>
                  <input
                    type="number"
                    min={0}
                    value={newVehicle.price1HrINR}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, price1HrINR: event.target.value }))}
                    placeholder="₹ Price"
                    className="w-full rounded-lg border border-emerald-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-200 mb-1">3-Hr Rate</label>
                  <input
                    type="number"
                    min={0}
                    value={newVehicle.price3HrINR}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, price3HrINR: event.target.value }))}
                    placeholder="₹ Price"
                    className="w-full rounded-lg border border-emerald-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-200 mb-1">6-Hr Rate</label>
                  <input
                    type="number"
                    min={0}
                    value={newVehicle.price6HrINR}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, price6HrINR: event.target.value }))}
                    placeholder="₹ Price"
                    className="w-full rounded-lg border border-emerald-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-200 mb-1">12-Hr Rate</label>
                  <input
                    type="number"
                    min={0}
                    value={newVehicle.price12HrINR}
                    onChange={(event) => setNewVehicle((prev) => ({ ...prev, price12HrINR: event.target.value }))}
                    placeholder="₹ Price"
                    className="w-full rounded-lg border border-emerald-900/60 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-medium"
                  />
                </div>
              </div>

              {/* Right Column: Live Next Gear Catalog Card Preview */}
              <div className="lg:col-span-5 sticky top-6 space-y-3">
                <div className="text-center pb-1">
                  <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest bg-red-950/50 border border-red-500/30 px-3 py-1 rounded-full">
                    👁️ Customer View Live Preview
                  </span>
                </div>
                <LiveVehicleCardPreview
                  title={newVehicle.title}
                  city={newVehicle.city}
                  type={newVehicle.type}
                  seats={newVehicle.seats}
                  pricePerDayINR={newVehicle.pricePerDayINR}
                  vehicleNumber={newVehicle.vehicleNumber}
                  imageUrl={newVehicle.imageUrl}
                />
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={addVehicle}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-[#ff4d4d] text-white text-xs font-extrabold shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                + Save & Publish Vehicle
              </button>
            </div>
          </div>
        </>
      ) : null}

      {fleetVehicles.length === 0 ? (
        <p className="text-sm text-white/60">No vehicles in your fleet yet.</p>
      ) : displayedVehicles.length === 0 ? (
        <p className="text-sm text-white/60">No vehicles match your current filter.</p>
      ) : (
        <div className="space-y-3">
          {displayedVehicles.map((vehicle) => {
            const activeBooking = bookings?.find((b) => {
              const matchesId = b.vehicleId === vehicle.id || b.vehicle?.id === vehicle.id || b.vehicleTitle?.toLowerCase() === vehicle.title.toLowerCase();
              const isConfirmed = b.status === "CONFIRMED" || b.status === "PAID" || b.status === "confirmed";
              return matchesId && isConfirmed;
            });

            const isAvailable = (vehicle.operationalStatus ?? "AVAILABLE") === "AVAILABLE";

            return (
              <div key={vehicle.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300">
                {vehicle.imageUrls?.[0] ? (
                  <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-[var(--brand-ink)]">
                    <img src={vehicle.imageUrls[0]} alt={vehicle.title} className="h-44 w-full object-cover" loading="lazy" />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-3 md:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-base text-white">{vehicle.title}</p>
                      
                      {activeBooking && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          🔴 BOOKED (IN USE)
                        </span>
                      )}

                      <button
                        onClick={() => toggleOperationalStatus(
                          vehicle.id,
                          isAvailable ? "UNAVAILABLE" : "AVAILABLE"
                        )}
                        disabled={isSyncing}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer border ${
                          isAvailable
                            ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                      >
                        {isAvailable ? "🟢 Active (Online)" : "🛠️ Maintenance (Offline)"}
                      </button>

                      <button
                        onClick={() => toggleWeekendSurge(
                          vehicle.id,
                          !vehicle.weekendSurgeActive
                        )}
                        disabled={isSyncing}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer border ${
                          vehicle.weekendSurgeActive
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                            : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        ⚡ Weekend Surge: {vehicle.weekendSurgeActive ? "ON (+15%)" : "OFF"}
                      </button>
                    </div>
                    <p className="text-sm text-white/70">
                      {vehicle.city} · {vehicle.type.toUpperCase()} · {vehicle.seats} seats
                    </p>
                    <p className="text-xs text-white/50 font-medium font-mono">Number: {vehicle.vehicleNumber || "Not set"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--brand-red)] text-lg">₹{vehicle.pricePerDayINR}/day</p>
                    <p className={`text-xs font-semibold ${activeBooking ? "text-red-400 font-bold" : "text-white/60"}`}>
                      {activeBooking ? "🔴 Currently Booked (1 Active Rental)" : `${vehicle.availableDates.length} available dates`}
                    </p>
                  </div>
                </div>

                {/* Active Customer Booking Banner */}
                {activeBooking && (
                  <div className="mt-3 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-neutral-900/90 to-red-950/20 p-3.5 text-xs text-white space-y-1.5 shadow-lg">
                    <div className="flex items-center justify-between font-bold text-red-400 border-b border-red-500/20 pb-2">
                      <span className="flex items-center gap-1.5 text-xs tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        🎫 ACTIVE CUSTOMER BOOKING DETAILS
                      </span>
                      <span className="text-[10px] bg-red-500/20 px-2.5 py-0.5 rounded-full border border-red-500/30 text-white font-mono">
                        ID: {formatBookingId(activeBooking.id, activeBooking.city)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-white/50 block font-medium">Customer Name</span>
                        <span className="font-bold text-white mt-0.5 block">{activeBooking.user?.name || activeBooking.customerName || activeBooking.userEmail || "Customer"}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block font-medium">Rental Dates</span>
                        <span className="font-bold text-amber-300 mt-0.5 block">
                          {String(activeBooking.startDate).slice(0, 10)} ➔ {String(activeBooking.endDate).slice(0, 10)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50 block font-medium">Booking Amount</span>
                        <span className="font-extrabold text-emerald-400 mt-0.5 block">₹{activeBooking.totalAmountINR}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => beginEditPricing(vehicle)}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/5"
                  >
                    Edit pricing
                  </button>
                  <button
                    onClick={() => beginEditNumber(vehicle)}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/5"
                  >
                    Edit number
                  </button>
                  <button
                    onClick={() => openAvailability(vehicle)}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/5"
                  >
                    Manage availability
                  </button>
                  <button
                    onClick={() => setActiveAnalyticsId((prev) => (prev === vehicle.id ? null : vehicle.id))}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/5"
                  >
                    View analytics
                  </button>
                  <button
                    onClick={() => beginEditPhoto(vehicle)}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/5"
                  >
                    Update photo
                  </button>
                  <button
                    onClick={() => removeVehicle(vehicle.id, vehicle.title)}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/5"
                  >
                    Remove vehicle
                  </button>
                </div>

                {editingPriceId === vehicle.id ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-white">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Price Per Day</span>
                        <input
                          type="number"
                          min={1}
                          value={priceDraft}
                          onChange={(event) => setPriceDraft(event.target.value)}
                          className="w-36 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Damage Waiver (₹99)</span>
                        <input
                          type="number"
                          min={0}
                          value={addonWaiverDraft}
                          onChange={(event) => setAddonWaiverDraft(event.target.value)}
                          placeholder="Fallback: 99"
                          className="w-36 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Roadside Assist (₹49)</span>
                        <input
                          type="number"
                          min={0}
                          value={addonRsaDraft}
                          onChange={(event) => setAddonRsaDraft(event.target.value)}
                          placeholder="Fallback: 49"
                          className="w-36 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Extra Helmet (₹49)</span>
                        <input
                          type="number"
                          min={0}
                          value={addonHelmetDraft}
                          onChange={(event) => setAddonHelmetDraft(event.target.value)}
                          placeholder="Fallback: 49"
                          className="w-36 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">1-Hour Price</span>
                        <input
                          type="number"
                          min={0}
                          value={price1HrDraft}
                          onChange={(event) => setPrice1HrDraft(event.target.value)}
                          placeholder="Optional"
                          className="w-28 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">3-Hour Price</span>
                        <input
                          type="number"
                          min={0}
                          value={price3HrDraft}
                          onChange={(event) => setPrice3HrDraft(event.target.value)}
                          placeholder="Optional"
                          className="w-28 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">6-Hour Price</span>
                        <input
                          type="number"
                          min={0}
                          value={price6HrDraft}
                          onChange={(event) => setPrice6HrDraft(event.target.value)}
                          placeholder="Optional"
                          className="w-28 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white/60 uppercase">12-Hour Price</span>
                        <input
                          type="number"
                          min={0}
                          value={price12HrDraft}
                          onChange={(event) => setPrice12HrDraft(event.target.value)}
                          placeholder="Optional"
                          className="w-28 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => savePricing(vehicle.id)}
                        className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                      >
                        Save pricing
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {editingNumberId === vehicle.id ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-white">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-white/60 uppercase">Vehicle Number</span>
                      <input
                        value={numberDraft}
                        onChange={(event) => setNumberDraft(event.target.value)}
                        placeholder="e.g. DL 3C AB 1234"
                        className="w-64 rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => saveVehicleNumber(vehicle.id)}
                        className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                      >
                        Save number
                      </button>
                      <button
                        onClick={() => setEditingNumberId(null)}
                        className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeAvailabilityId === vehicle.id ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-white">
                    <p className="text-xs text-white/75">
                      Enter available dates (one date per line, YYYY-MM-DD format):
                    </p>
                    <textarea
                      value={availabilityDraft}
                      onChange={(event) => setAvailabilityDraft(event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => saveAvailability(vehicle.id)}
                        className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                      >
                        Save dates
                      </button>
                      <button
                        onClick={() => setActiveAvailabilityId(null)}
                        className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeAnalyticsId === vehicle.id ? (
                  <div className="mt-3 grid gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm md:grid-cols-3 text-white">
                    <div>
                      <p className="text-xs text-white/55">Available Days</p>
                      <p className="font-bold text-white text-base mt-1">{vehicle.availableDates.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/55">Est. Gross Potential</p>
                      <p className="font-bold text-emerald-400 text-base mt-1">₹{(vehicle.pricePerDayINR * Math.max(vehicle.availableDates.length, 1)).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/55">Fleet Est. Potential</p>
                      <p className="font-bold text-emerald-400 text-base mt-1">₹{totalEarningsEstimate.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ) : null}

                {editingPhotoId === vehicle.id ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-white">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/60 uppercase">Photo or Video (.mp4) URL</span>
                          <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
                            ✨ Auto 10s AI Video Showcase
                          </span>
                        </div>
                        <input
                          value={photoDraft}
                          onChange={(event) => setPhotoDraft(event.target.value)}
                          placeholder="Paste image or video URL (.mp4, .webm)"
                          className="rounded-lg border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white placeholder-white/35"
                        />
                      </div>
                      <div
                        onDragOver={(event) => {
                          event.preventDefault();
                          setIsDragOverEditPhoto(true);
                        }}
                        onDragLeave={() => setIsDragOverEditPhoto(false)}
                        onDrop={onDropEditPhoto}
                        className={`rounded-lg border border-dashed px-3 py-2 text-sm transition ${
                          isDragOverEditPhoto ? "border-[var(--brand-red)] bg-red-500/10" : "border-white/20 bg-white/5"
                        }`}
                      >
                        <p className="mb-2 text-xs text-white/60">Or upload photo / video from device</p>
                        <input type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" onChange={handleEditPhotoFileChange} className="text-xs text-white/70" />
                        {isUploadingEditPhoto ? <p className="mt-2 text-xs text-white/60">Uploading media...</p> : null}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => savePhoto(vehicle.id)}
                        className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                      >
                        Save photo
                      </button>
                      <button
                        onClick={() => setEditingPhotoId(null)}
                        className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* STUNNING REMOVE VEHICLE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="max-w-md w-full rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-[#1c080d] via-[#140609] to-[#0d0305] p-6 space-y-5 shadow-[0_0_60px_rgba(239,68,68,0.35)] relative text-center">
            
            {/* Animated Trash Icon with Glowing Halo */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-3 bg-red-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-950 border border-red-500/50 flex items-center justify-center text-3xl shadow-lg relative z-10">
                🗑️
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block rounded-full bg-red-500/10 border border-red-500/30 px-3.5 py-1 text-[10px] font-extrabold text-red-400 uppercase tracking-widest">
                Confirm Fleet Listing Removal
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Remove "{deleteTarget.title}"?
              </h3>
              <p className="text-xs text-white/70 leading-relaxed px-2">
                Are you sure you want to remove this vehicle from your active fleet catalog? It will no longer be visible to customers on Next Gear rentals.
              </p>
            </div>

            <div className="bg-red-950/40 border border-red-500/20 rounded-2xl p-3.5 text-[11px] text-red-300 text-left flex items-start gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <p className="leading-relaxed">
                <strong>Fleet Security Note:</strong> Existing active customer bookings for this vehicle will remain stored safely in your booking history.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmRemoveVehicle()}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Yes, Remove Listing"
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
  airportPickup?: boolean;
}) {
  const displayTitle = title?.trim() || "Vehicle Title / Model";
  const displayCity = city?.trim() || "City Hub";
  const displaySeats = seats || "5";
  const displayFuel = (fuel || "petrol").toLowerCase();
  const displayTrans = (transmission || "manual").toLowerCase();
  const displayPrice = Number(pricePerDayINR) || 1200;
  const displayImage = imageUrl?.trim() || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";

  const t = (type || "car").toLowerCase();
  const isCar = t.includes("car");
  const isBike = t.includes("bike");
  const isScoot = t.includes("scoot");

  const badgeIcon = isBike ? "🏍️" : isScoot ? "🛵" : "🚗";
  const badgeLabel = isBike ? "BIKE" : isScoot ? "SCOOTY" : "CAR font-bold";

  return (
    <div className="rounded-3xl border border-red-500/30 bg-gradient-to-b from-[#18080a] via-[#0d070b] to-[#0a0a0a] p-4 text-white shadow-2xl relative overflow-hidden max-w-sm w-full mx-auto transition-all">
      {/* Live Badge Watermark Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 border border-red-400 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
          <span>Catalog Live Preview</span>
        </div>
        <span className="text-[10px] font-semibold text-white/50">Next Gear View</span>
      </div>

      {/* Image Banner */}
      <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-inner">
        <img
          src={displayImage}
          alt={displayTitle}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";
          }}
        />
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold text-amber-400 border border-white/15 shadow-lg">
          <span>⭐</span>
          <span>4.9</span>
        </div>
      </div>

      {/* Title & Badges */}
      <div className="mt-3.5 space-y-2">
        <p className="text-base font-bold text-white line-clamp-1">
          {displayTitle}
        </p>
        
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-500/40 px-2.5 py-0.5 text-[9px] font-black text-red-400 uppercase tracking-wider">
            <span>{badgeIcon}</span>
            <span>{badgeLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/60 border border-blue-800/40 px-2.5 py-0.5 text-[9px] font-semibold text-blue-300">
            📍 {displayCity.split(",")[0]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[9px] font-semibold text-white/80">
            👤 {displaySeats} Seats
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-2 text-xs text-white/70 pt-1">
          <span className="capitalize">⛽ {displayFuel}</span>
          <span className="text-white/20">•</span>
          <span className="capitalize">⚙️ {displayTrans}</span>
          <span className="text-white/20">•</span>
          <span>{airportPickup ? "✈️ Airport" : "🏙️ Pickup Hub"}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-950/60 px-2.5 py-0.5 text-[9px] font-extrabold text-green-400 border border-green-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            AVAILABLE
          </span>
          {vehicleNumber ? (
            <span className="text-[9px] text-white/40 font-mono tracking-wider">
              {vehicleNumber}
            </span>
          ) : null}
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Daily Rate</span>
          <div>
            <span className="text-lg font-black text-emerald-400 font-mono">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-white/60"> / day</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex-1 text-center rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-bold text-white/60 cursor-not-allowed">
            Details
          </div>
          <div className="flex-1 text-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-2 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 cursor-not-allowed">
            Book Now →
          </div>
        </div>
      </div>
    </div>
  );
}