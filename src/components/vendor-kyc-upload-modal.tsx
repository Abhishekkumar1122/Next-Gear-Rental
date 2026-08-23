"use client";

import { compressImageClient } from "@/lib/client-image-compressor";
import { useState, useRef, useCallback } from "react";
import { X, Upload, MapPin, CheckCircle2, AlertTriangle, Loader2, Camera, FileText, ShieldCheck } from "lucide-react";

interface VendorKycUploadModalProps {
  applicationId: string;
  phone: string;
  onClose: () => void;
}

type DocItem = {
  id: string;
  label: string;
  icon: string;
  required: boolean;
  isShopPhoto?: boolean;
};

const DOC_LIST: DocItem[] = [
  { id: "shop-photo", label: "Shop / Premises Photo", icon: "📸", required: true, isShopPhoto: true },
  { id: "aadhaar", label: "Aadhaar / Owner ID", icon: "🪪", required: true },
  { id: "pan", label: "PAN Card", icon: "🗂️", required: true },
  { id: "business-proof", label: "Business Proof (Registration)", icon: "🏢", required: true },
  { id: "bank-proof", label: "Bank Proof (Passbook / Cheque)", icon: "🏦", required: true },
  { id: "vehicle-rc", label: "Vehicle RC", icon: "🚗", required: true },
  { id: "insurance", label: "Insurance Certificate", icon: "🛡️", required: false },
];

type UploadStatus = "idle" | "uploading" | "done" | "error";

type DocState = {
  file: File | null;
  status: UploadStatus;
  error: string;
  geoLat?: number;
  geoLng?: number;
  geoError?: string;
};

export function VendorKycUploadModal({ applicationId, phone, onClose }: VendorKycUploadModalProps) {
  const [docStates, setDocStates] = useState<Record<string, DocState>>(
    () => Object.fromEntries(DOC_LIST.map((d) => [d.id, { file: null, status: "idle", error: "" }]))
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requestGeo = useCallback((docId: string) => {
    if (!navigator.geolocation) {
      setDocStates((prev) => ({ ...prev, [docId]: { ...prev[docId], geoError: "GPS not supported on this device." } }));
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setDocStates((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], geoLat: pos.coords.latitude, geoLng: pos.coords.longitude, geoError: undefined },
        }));
      },
      (err) => {
        setGeoLoading(false);
        setDocStates((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], geoError: err.code === 1 ? "Location access denied. Please allow GPS to continue." : "Could not get location. Try again." },
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleFileChange = (docId: string, file: File | null, isShopPhoto?: boolean) => {
    setDocStates((prev) => ({ ...prev, [docId]: { ...prev[docId], file, status: "idle", error: "" } }));
    if (isShopPhoto && file) requestGeo(docId);
  };

  const uploadDoc = async (doc: DocItem) => {
    const state = docStates[doc.id];
    if (!state.file) return;
    if (doc.isShopPhoto && !state.geoLat) {
      setDocStates((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], error: "GPS location is required for shop photo. Please allow location access." } }));
      return;
    }
    setDocStates((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: "uploading", error: "" } }));
    try {
      let fileToUpload = state.file;
      if (state.file.type.startsWith("image/")) {
        const compressed = await compressImageClient(state.file, 1600, 0.82);
        fileToUpload = compressed.file;
      }

      const fd = new FormData();
      fd.set("applicationId", applicationId);
      fd.set("phone", phone);
      fd.set("documentType", doc.id);
      fd.set("file", fileToUpload);
      if (state.geoLat != null) fd.set("geoLat", String(state.geoLat));
      if (state.geoLng != null) fd.set("geoLng", String(state.geoLng));

      const res = await fetch("/api/vendor-registration/status/documents", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDocStates((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: "done" } }));
    } catch (err) {
      setDocStates((prev) => ({
        ...prev,
        [doc.id]: { ...prev[doc.id], status: "error", error: err instanceof Error ? err.message : "Upload failed" },
      }));
    }
  };

  const doneCount = Object.values(docStates).filter((s) => s.status === "done").length;
  const totalRequired = DOC_LIST.filter((d) => d.required).length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-neutral-900 to-[#0a0a0a]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FileText className="w-4 h-4 text-red-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-red-400">KYC Document Upload</p>
            </div>
            <h2 className="text-lg font-black text-white">Upload Your Documents</h2>
            <p className="text-xs text-white/50 mt-0.5">
              Application ID: <span className="font-mono font-bold text-white/80">{applicationId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>{doneCount} of {DOC_LIST.length} uploaded</span>
            <span className="text-emerald-400 font-bold">
              {doneCount >= totalRequired ? "✓ Required docs done!" : `${totalRequired - doneCount} required remaining`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${(doneCount / DOC_LIST.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Doc list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 mt-2">
          {DOC_LIST.map((doc) => {
            const state = docStates[doc.id];
            const isDone = state.status === "done";
            const isUploading = state.status === "uploading";
            const borderClass = isDone
              ? "border-emerald-500/30 bg-emerald-950/10"
              : state.status === "error"
              ? "border-red-500/30 bg-red-950/10"
              : "border-white/10 bg-white/[0.02] hover:border-white/20";

            return (
              <div key={doc.id} className={`rounded-2xl border p-4 transition-all duration-300 ${borderClass}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isDone ? "bg-emerald-950/60" : "bg-white/5"}`}>
                    {isDone ? "✅" : doc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">{doc.label}</p>
                      {doc.required && !isDone && (
                        <span className="text-[10px] font-black text-red-400 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Required</span>
                      )}
                      {!doc.required && !isDone && (
                        <span className="text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Optional</span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">✓ Uploaded</span>
                      )}
                    </div>

                    {doc.isShopPhoto && !isDone && (
                      <div className={`mt-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${state.geoLat ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" : state.geoError ? "bg-red-950/40 border border-red-500/20 text-red-400" : "bg-amber-950/40 border border-amber-500/20 text-amber-400"}`}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {state.geoLat ? (
                          <span>📍 GPS captured: {state.geoLat.toFixed(5)}, {state.geoLng?.toFixed(5)}</span>
                        ) : state.geoError ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{state.geoError}</span>
                            <button onClick={() => requestGeo(doc.id)} className="underline font-bold cursor-pointer">Retry GPS</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>GPS location required for shop photo</span>
                            {geoLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <button onClick={() => requestGeo(doc.id)} className="underline font-bold cursor-pointer">Get GPS Location</button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!isDone && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <input
                          ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] ?? null, doc.isShopPhoto)}
                        />
                        <button
                          onClick={() => fileInputRefs.current[doc.id]?.click()}
                          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 font-semibold hover:bg-white/10 transition cursor-pointer"
                        >
                          {doc.isShopPhoto ? <Camera className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                          {state.file ? (state.file.name.length > 24 ? state.file.name.slice(0, 24) + "..." : state.file.name) : "Choose File"}
                        </button>
                        {state.file && (
                          <button
                            onClick={() => void uploadDoc(doc)}
                            disabled={isUploading || (!!doc.isShopPhoto && !state.geoLat)}
                            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isUploading ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                            ) : (
                              <><Upload className="w-3.5 h-3.5" /> Upload</>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {state.error && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        {state.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-neutral-900/60">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PDF, JPG, PNG, WEBP &middot; Max 8MB each</span>
          </div>
          {doneCount >= totalRequired ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> All Done! ✓
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 transition cursor-pointer"
            >
              Upload Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
