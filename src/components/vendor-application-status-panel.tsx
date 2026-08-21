"use client";

import { useMemo, useState } from "react";

type VendorApplicationStatus =
  | "new"
  | "contacted"
  | "kyc-in-progress"
  | "kyc-complete"
  | "credentials-generated"
  | "rejected";

type VendorKycChecklist = {
  identityVerified: boolean;
  businessProofVerified: boolean;
  bankVerified: boolean;
  agreementAccepted: boolean;
};

type VendorApplicationLookup = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  city: string;
  fleetSize: string;
  status: VendorApplicationStatus;
  kycChecklist: VendorKycChecklist;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  kycApprovedAt?: string;
  onboardingAutomatedAt?: string;
  hasVendorAccount: boolean;
};

type VendorKycDocument = {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewStatus: "pending" | "verified" | "rejected" | "needs-reupload";
  reviewNote?: string;
  reviewedAt?: string;
};

const documentTypes = [
  { id: "aadhaar", label: "Aadhaar / Owner ID" },
  { id: "pan", label: "PAN Card" },
  { id: "business-proof", label: "Business Proof" },
  { id: "bank-proof", label: "Bank Proof" },
  { id: "vehicle-rc", label: "Vehicle RC" },
  { id: "insurance", label: "Insurance" },
  { id: "other", label: "Other" },
];

const statusCopy: Record<VendorApplicationStatus, { label: string; helper: string }> = {
  new: {
    label: "Application Received",
    helper: "Your application is in the queue. Upload documents to speed up verification.",
  },
  contacted: {
    label: "Contacted",
    helper: "Our team has contacted you or will continue the onboarding conversation.",
  },
  "kyc-in-progress": {
    label: "KYC In Progress",
    helper: "Your documents are being reviewed. Upload anything requested by the admin note.",
  },
  "kyc-complete": {
    label: "KYC Approved",
    helper: "KYC is approved. Vendor login credentials are being prepared.",
  },
  "credentials-generated": {
    label: "Vendor Account Created",
    helper: "Your vendor account is ready. Use the credentials shared by the Next Gear team.",
  },
  rejected: {
    label: "Application Rejected",
    helper: "This application was rejected. Contact support if you think this needs review.",
  },
};

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

function getReviewClassName(status: VendorKycDocument["reviewStatus"]) {
  if (status === "verified") return "border-green-500/20 bg-green-950/20 text-green-400";
  if (status === "rejected") return "border-red-500/20 bg-red-950/20 text-red-400";
  if (status === "needs-reupload") return "border-yellow-500/20 bg-yellow-950/20 text-yellow-400";
  return "border-white/10 bg-white/5 text-white/60";
}

export function VendorApplicationStatusPanel() {
  const [applicationId, setApplicationId] = useState("");
  const [phone, setPhone] = useState("");
  const [application, setApplication] = useState<VendorApplicationLookup | null>(null);
  const [documents, setDocuments] = useState<VendorKycDocument[]>([]);
  const [documentType, setDocumentType] = useState(documentTypes[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const documentLabelMap = useMemo(
    () => new Map(documentTypes.map((item) => [item.id, item.label])),
    []
  );

  const checklistRows = useMemo(() => {
    if (!application) return [];
    return [
      { label: "Identity verified", done: application.kycChecklist.identityVerified },
      { label: "Business proof verified", done: application.kycChecklist.businessProofVerified },
      { label: "Bank details verified", done: application.kycChecklist.bankVerified },
      { label: "Agreement accepted", done: application.kycChecklist.agreementAccepted },
    ];
  }, [application]);

  async function checkStatus() {
    setLoading(true);
    setMessage("");
    setApplication(null);
    setDocuments([]);

    try {
      const res = await fetch("/api/vendor-registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to find application status");
      }

      setApplication(data.application);
      setDocuments(data.documents ?? []);
      setMessage("Application found.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to find application status");
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument() {
    if (!application) {
      setMessage("Check your application status first.");
      return;
    }
    if (!selectedFile) {
      setMessage("Choose a file before uploading.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("applicationId", application.id);
      formData.set("phone", phone);
      formData.set("documentType", documentType);
      formData.set("file", selectedFile);

      const res = await fetch("/api/vendor-registration/status/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to upload document");
      }

      setDocuments((prev) => [data.document, ...prev]);
      setSelectedFile(null);
      setMessage("Document uploaded. Admin can now review it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload document");
    } finally {
      setUploading(false);
    }
  }

  const status = application ? statusCopy[application.status] : null;
  const canUpload = application && application.status !== "rejected" && application.status !== "credentials-generated";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl sm:p-8 accent-border hover:border-white/20 transition-all duration-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Already applied?</p>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2 uppercase tracking-wider text-[var(--brand-red-soft)] mt-1">
            Check application status
          </h2>
          <p className="text-xs text-white/60 leading-relaxed mb-6">
            Enter your application ID and registered phone number to track approval and upload KYC documents.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">Application ID</label>
          <input
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="e.g. SHOP1234"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-white/70">Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Registered phone number"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:border-[var(--brand-red)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void checkStatus()}
            disabled={loading}
            className="w-full md:w-auto rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/75">
          {message}
        </p>
      )}

      {application && status ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{application.businessName}</p>
                <p className="mt-1 text-xs text-white/60">
                  {application.contactName} · {application.city} · Fleet: {application.fleetSize}
                </p>
                <p className="mt-1 break-all text-xs text-white/40">Application ID: {application.id}</p>
              </div>
              <span className="rounded-full bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-4.5 py-1.5 text-xs font-semibold text-white shadow-md">
                {status.label}
              </span>
            </div>
            <p className="mt-4 text-xs text-white/70 leading-relaxed">{status.helper}</p>
            {application.adminNotes ? (
              <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-950/20 px-4 py-3 text-xs text-yellow-400 leading-relaxed">
                <span className="font-bold">Admin note:</span> {application.adminNotes}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {checklistRows.map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 text-xs transition-all duration-300 ${item.done ? "border-green-500/20 bg-green-950/10 text-green-400" : "border-white/10 bg-white/[0.01] text-white/50"}`}>
                <p className="font-bold uppercase tracking-wider text-[10px]">
                  {item.done ? "✓ Verified" : "⏳ Pending"}
                </p>
                <p className="mt-2 font-medium text-white">{item.label}</p>
              </div>
            ))}
          </div>

          {canUpload ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-white">Upload KYC document</p>
              <p className="mt-1 text-xs text-white/50">Accepted formats: PDF, JPG, PNG, WEBP. Max size: 8MB.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#161616] text-white px-4 py-3 text-sm focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {documentTypes.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#161616] text-white">{item.label}</option>
                  ))}
                </select>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-white px-4 py-2.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:transition-colors hover:file:bg-white/20"
                />
                <button
                  type="button"
                  onClick={() => void uploadDocument()}
                  disabled={uploading}
                  className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-red-600/50 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-sm font-semibold text-white">Uploaded documents</p>
            {documents.length === 0 ? (
              <p className="mt-3 text-xs text-white/50">No documents uploaded yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-4 text-xs hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{documentLabelMap.get(doc.documentType) ?? doc.documentType}</p>
                        <span className={`rounded-full border px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider ${getReviewClassName(doc.reviewStatus)}`}>
                          {getReviewLabel(doc.reviewStatus)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-white/50">
                        {doc.fileName} · {formatFileSize(doc.sizeBytes)} · {new Date(doc.uploadedAt).toLocaleString()}
                      </p>
                      {doc.reviewNote ? (
                        <p className="mt-2 rounded border border-yellow-500/20 bg-yellow-950/20 px-3 py-1.5 text-yellow-400">
                          <span className="font-bold">Admin note:</span> {doc.reviewNote}
                        </p>
                      ) : null}
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200">
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
