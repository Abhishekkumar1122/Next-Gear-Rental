"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type VendorKycDocument = {
  id: string;
  vendorId: string;
  documentType: (typeof documentTypeOptions)[number]["id"];
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewStatus: "pending" | "verified" | "rejected" | "needs-reupload";
  reviewNote?: string;
  reviewedAt?: string;
};

const documentTypeOptions = [
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "pan", label: "PAN Card" },
  { id: "business-proof", label: "Business Proof" },
  { id: "driving-license", label: "Driving License" },
  { id: "vehicle-rc", label: "Vehicle RC" },
  { id: "insurance", label: "Insurance" },
  { id: "bank-proof", label: "Bank Proof" },
  { id: "other", label: "Other" },
] as const;

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getReviewLabel(status: VendorKycDocument["reviewStatus"]) {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  if (status === "needs-reupload") return "Needs Reupload";
  return "Pending Review";
}

export function VendorProfileDocumentsPanel() {
  const [documents, setDocuments] = useState<VendorKycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<(typeof documentTypeOptions)[number]["id"]>("aadhaar");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const documentTypeMap = useMemo(
    () => new Map(documentTypeOptions.map((item) => [item.id, item.label])),
    []
  );

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/vendor/profile-documents", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load documents");
      }
      setDocuments(data.documents ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  async function uploadDocument() {
    if (!selectedFile) {
      setMessage("Please choose a document file to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("documentType", documentType);
      formData.set("file", selectedFile);

      const res = await fetch("/api/vendor/profile-documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setDocuments((prev) => [data.document, ...prev]);
      setSelectedFile(null);
      setMessage("Document uploaded successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(documentId: string) {
    setDeletingId(documentId);
    setMessage("");

    try {
      const res = await fetch(`/api/vendor/profile-documents/${documentId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Delete failed");
      }

      setDocuments((prev) => prev.filter((item) => item.id !== documentId));
      setMessage("Document removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-4 sm:p-6 shadow-2xl text-white relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Vendor Profile</p>
          <h2 className="mt-1 text-lg font-semibold text-white">KYC Documents</h2>
          <p className="mt-1 text-sm text-white/70">Upload important verification documents for onboarding and compliance.</p>
        </div>
        <button
          onClick={() => void fetchDocuments()}
          className="rounded border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[200px_1fr_auto]">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as (typeof documentTypeOptions)[number]["id"])}
          className="w-full max-w-full rounded border border-white/15 bg-[var(--brand-ink)] px-3 py-2.5 text-sm text-white focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]"
        >
          {documentTypeOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>

        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="w-full max-w-full rounded border border-white/15 bg-[var(--brand-ink)] px-3 py-2 text-sm text-white file:mr-4 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
        />

        <button
          onClick={() => void uploadDocument()}
          disabled={uploading}
          className="w-full rounded bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 shadow-[0_4px_15px_rgba(225,29,72,0.25)]"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {message ? <p className="mt-3 rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/75">{message}</p> : null}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-white/50">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-white/50">No documents uploaded yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-white/10 bg-white/[0.01] p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-white">{documentTypeMap.get(doc.documentType) ?? doc.documentType}</p>
                <p className="text-xs text-white/50">{new Date(doc.uploadedAt).toLocaleString()}</p>
              </div>
              <p className="mt-1 text-white/70">{doc.fileName} · {formatFileSize(doc.sizeBytes)}</p>
              <p className="mt-1 text-xs font-semibold text-white/60">Review: {getReviewLabel(doc.reviewStatus)}</p>
              {doc.reviewNote ? <p className="mt-1 rounded border border-yellow-500/20 bg-yellow-550/10 px-2 py-1 text-xs text-yellow-200">Admin note: {doc.reviewNote}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/5"
                >
                  View
                </a>
                <button
                  onClick={() => void deleteDocument(doc.id)}
                  disabled={deletingId === doc.id}
                  className="rounded border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                >
                  {deletingId === doc.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
