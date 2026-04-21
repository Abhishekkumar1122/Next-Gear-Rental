"use client";

import { useEffect, useMemo, useState } from "react";
import type { Vehicle, VehicleType } from "@/lib/types";

type VendorFleetManagerProps = {
  initialFleetVehicles: Vehicle[];
  vendorId: string;
};

export function VendorFleetManager({ initialFleetVehicles, vendorId }: VendorFleetManagerProps) {
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>(initialFleetVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | VehicleType>("all");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc" | "availabilityDesc">("newest");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeAvailabilityId, setActiveAvailabilityId] = useState<string | null>(null);
  const [activeAnalyticsId, setActiveAnalyticsId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
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
    if (!Number.isFinite(pricePerDayINR) || pricePerDayINR < 1) {
      showFeedback("Price/day must be at least 1.");
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
      setNewVehicle({ title: "", city: "", type: "car", seats: "5", pricePerDayINR: "1500", vehicleNumber: "", imageUrl: "" });
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
        body: JSON.stringify({ pricePerDayINR: nextPrice }),
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

  async function removeVehicle(vehicleId: string, vehicleTitle: string) {
    const shouldRemove = window.confirm(`Remove ${vehicleTitle} from your fleet?`);
    if (!shouldRemove) {
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError("");

      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to remove vehicle");
      }

      setFleetVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleId));
      if (activeAnalyticsId === vehicleId) {
        setActiveAnalyticsId(null);
      }
      if (activeAvailabilityId === vehicleId) {
        setActiveAvailabilityId(null);
      }
      if (editingPriceId === vehicleId) {
        setEditingPriceId(null);
      }
      showFeedback("Vehicle removed from fleet.");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to remove vehicle");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fleet Management</h2>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        >
          {showAddForm ? "Close" : "+ Add Vehicle"}
        </button>
      </div>

      {feedback ? <p className="mb-3 text-sm text-[var(--brand-red)]">{feedback}</p> : null}
      {syncError ? <p className="mb-3 text-sm text-[var(--brand-red)]">{syncError}</p> : null}
      {isSyncing ? <p className="mb-3 text-xs text-black/60">Syncing with server...</p> : null}

      <div className="mb-4 grid gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-3 md:grid-cols-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by title or city"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as "all" | VehicleType)}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
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
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
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
          className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold transition hover:bg-black/[0.03]"
        >
          Reset filters
        </button>
      </div>

      {showAddForm ? (
        <div className="mb-4 rounded-xl border border-black/10 bg-black/[0.02] p-4">
          <div className="grid gap-2 md:grid-cols-5">
            <input
              value={newVehicle.title}
              onChange={(event) => setNewVehicle((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Vehicle title"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={newVehicle.city}
              onChange={(event) => setNewVehicle((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="City"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <select
              value={newVehicle.type}
              onChange={(event) => setNewVehicle((prev) => ({ ...prev, type: event.target.value as VehicleType }))}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
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
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={newVehicle.pricePerDayINR}
              onChange={(event) => setNewVehicle((prev) => ({ ...prev, pricePerDayINR: event.target.value }))}
              placeholder="Price/day"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={newVehicle.vehicleNumber}
              onChange={(event) => setNewVehicle((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
              placeholder="Vehicle number (e.g. DL01AB1234)"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              value={newVehicle.imageUrl}
              onChange={(event) => setNewVehicle((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="Photo URL (https://...)"
              className="rounded-lg border border-black/15 px-3 py-2 text-sm md:col-span-2"
            />
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOverNewPhoto(true);
              }}
              onDragLeave={() => setIsDragOverNewPhoto(false)}
              onDrop={onDropNewPhoto}
              className={`rounded-lg border border-dashed px-3 py-2 text-sm md:col-span-2 ${
                isDragOverNewPhoto ? "border-[var(--brand-red)] bg-red-50/50" : "border-black/20 bg-white"
              }`}
            >
              <p className="mb-2 text-xs text-black/60">Or upload photo from device</p>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleNewVehicleFileChange} className="text-xs" />
              <p className="mt-2 text-xs text-black/60">Drag & drop image here or choose a file</p>
              {isUploadingNewPhoto ? <p className="mt-2 text-xs text-black/60">Uploading image...</p> : null}
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={addVehicle}
              className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Save Vehicle
            </button>
          </div>
        </div>
      ) : null}

      {fleetVehicles.length === 0 ? (
        <p className="text-sm text-black/60">No vehicles in your fleet yet.</p>
      ) : displayedVehicles.length === 0 ? (
        <p className="text-sm text-black/60">No vehicles match your current filter.</p>
      ) : (
        <div className="space-y-3">
          {displayedVehicles.map((vehicle) => {
            const vehicleEstimate = vehicle.pricePerDayINR * Math.max(vehicle.availableDates.length, 1);

            return (
              <div key={vehicle.id} className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                {vehicle.imageUrls?.[0] ? (
                  <div className="mb-3 overflow-hidden rounded-lg border border-black/10 bg-white">
                    <img src={vehicle.imageUrls[0]} alt={vehicle.title} className="h-36 w-full object-cover" loading="lazy" />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-3 md:items-center">
                  <div>
                    <p className="font-semibold">{vehicle.title}</p>
                    <p className="text-sm text-black/70">
                      {vehicle.city} · {vehicle.type.toUpperCase()} · {vehicle.seats} seats
                    </p>
                    <p className="text-xs text-black/60">Number: {vehicle.vehicleNumber || "Not set"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--brand-red)]">₹{vehicle.pricePerDayINR}/day</p>
                    <p className="text-xs text-black/60">{vehicle.availableDates.length} available dates</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => beginEditPricing(vehicle)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:bg-black/5"
                  >
                    Edit pricing
                  </button>
                  <button
                    onClick={() => beginEditNumber(vehicle)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:bg-black/5"
                  >
                    Edit number
                  </button>
                  <button
                    onClick={() => openAvailability(vehicle)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:bg-black/5"
                  >
                    Manage availability
                  </button>
                  <button
                    onClick={() => setActiveAnalyticsId((prev) => (prev === vehicle.id ? null : vehicle.id))}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:bg-black/5"
                  >
                    View analytics
                  </button>
                  <button
                    onClick={() => beginEditPhoto(vehicle)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:bg-black/5"
                  >
                    Update photo
                  </button>
                  <button
                    onClick={() => removeVehicle(vehicle.id, vehicle.title)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs transition hover:bg-black/5"
                  >
                    Remove vehicle
                  </button>
                </div>

                {editingPriceId === vehicle.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white p-3">
                    <input
                      type="number"
                      min={1}
                      value={priceDraft}
                      onChange={(event) => setPriceDraft(event.target.value)}
                      className="w-36 rounded-lg border border-black/15 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => savePricing(vehicle.id)}
                      className="rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPriceId(null)}
                      className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                {editingNumberId === vehicle.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white p-3">
                    <input
                      value={numberDraft}
                      onChange={(event) => setNumberDraft(event.target.value)}
                      placeholder="Vehicle number"
                      className="w-56 rounded-lg border border-black/15 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => saveVehicleNumber(vehicle.id)}
                      className="rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNumberId(null)}
                      className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                {editingPhotoId === vehicle.id ? (
                  <div className="mt-3 rounded-lg border border-black/10 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={photoDraft}
                        onChange={(event) => setPhotoDraft(event.target.value)}
                        placeholder="https://example.com/vehicle.jpg"
                        className="min-w-[260px] flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => savePhoto(vehicle.id)}
                        className="rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Save photo
                      </button>
                      <button
                        onClick={() => setEditingPhotoId(null)}
                        className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragOverEditPhoto(true);
                      }}
                      onDragLeave={() => setIsDragOverEditPhoto(false)}
                      onDrop={onDropEditPhoto}
                      className={`mt-2 rounded-lg border border-dashed px-3 py-2 ${
                        isDragOverEditPhoto ? "border-[var(--brand-red)] bg-red-50/50" : "border-black/20 bg-black/[0.02]"
                      }`}
                    >
                      <p className="mb-2 text-xs text-black/60">Or upload from device</p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleEditPhotoFileChange}
                        className="text-xs"
                      />
                      <p className="mt-2 text-xs text-black/60">Drag & drop image here or choose a file</p>
                      {isUploadingEditPhoto ? <p className="mt-2 text-xs text-black/60">Uploading image...</p> : null}
                    </div>
                  </div>
                ) : null}

                {activeAvailabilityId === vehicle.id ? (
                  <div className="mt-3 rounded-lg border border-black/10 bg-white p-3">
                    <p className="mb-2 text-xs text-black/60">Add one date per line in YYYY-MM-DD format</p>
                    <textarea
                      value={availabilityDraft}
                      onChange={(event) => setAvailabilityDraft(event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => saveAvailability(vehicle.id)}
                        className="rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Save dates
                      </button>
                      <button
                        onClick={() => setActiveAvailabilityId(null)}
                        className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeAnalyticsId === vehicle.id ? (
                  <div className="mt-3 grid gap-2 rounded-lg border border-black/10 bg-white p-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-xs text-black/60">Available Days</p>
                      <p className="font-semibold">{vehicle.availableDates.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/60">Est. Gross Potential</p>
                      <p className="font-semibold">₹{vehicleEstimate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/60">Fleet Est. Potential</p>
                      <p className="font-semibold">₹{totalEarningsEstimate}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}