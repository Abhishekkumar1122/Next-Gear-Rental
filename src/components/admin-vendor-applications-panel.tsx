"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type VendorApplication = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  city: string;
  fleetSize: string;
  status: VendorApplicationStatus;
  kycChecklist: VendorKycChecklist;
  adminNotes?: string;
  loginId?: string;
  tempPassword?: string;
  vendorUserId?: string;
  vendorId?: string;
  onboardingAutomatedAt?: string;
  kycApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type VendorKycDocument = {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  uploadedAt: string;
};

const statuses: Array<{ id: VendorApplicationStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "kyc-in-progress", label: "KYC In Progress" },
  { id: "kyc-complete", label: "KYC Complete" },
  { id: "credentials-generated", label: "Credentials Generated" },
  { id: "rejected", label: "Rejected" },
];

export function AdminVendorApplicationsPanel() {
  const router = useRouter();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [activeStatus, setActiveStatus] = useState<VendorApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [documentsByApplication, setDocumentsByApplication] = useState<Record<string, VendorKycDocument[]>>({});
  const [loadingDocumentsId, setLoadingDocumentsId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setAuthRequired(false);

    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search.trim()) params.set("query", search.trim());

      const res = await fetch(`/api/admin/vendor-applications${params.toString() ? `?${params.toString()}` : ""}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setApplications([]);
        setAuthRequired(true);
        setMessage("Admin session required. Please sign in again to access vendor applications.");
        const next = encodeURIComponent("/dashboard/admin?section=vendor-applications");
        setTimeout(() => {
          router.push(`/login?next=${next}`);
        }, 250);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load vendor applications");
      }

      const items = data.applications ?? [];
      setApplications(items);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (typeof next[item.id] === "undefined") {
            next[item.id] = item.adminNotes || "";
          }
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load vendor applications");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const summary = useMemo(() => {
    return {
      total: applications.length,
      new: applications.filter((item) => item.status === "new").length,
      kycComplete: applications.filter((item) => item.status === "kyc-complete").length,
      credentialed: applications.filter((item) => item.status === "credentials-generated").length,
    };
  }, [applications]);

  async function updateApplication(applicationId: string, patch: { status?: VendorApplicationStatus; adminNotes?: string }) {
    setUpdatingId(applicationId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: applicationId, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update application");
      }

      setApplications((prev) => prev.map((item) => (item.id === applicationId ? data.application : item)));
      setMessage("Vendor application updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update application");
    } finally {
      setUpdatingId(null);
    }
  }

  async function generateCredentials(applicationId: string) {
    setUpdatingId(applicationId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-credentials", id: applicationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate credentials");
      }

      setApplications((prev) => prev.map((item) => (item.id === applicationId ? data.application : item)));
      setMessage("Vendor login ID and temporary password generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate credentials");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateChecklist(applicationId: string, checklistPatch: Partial<VendorKycChecklist>) {
    setUpdatingId(applicationId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-kyc-checklist",
          id: applicationId,
          checklist: checklistPatch,
          adminNotes: noteDrafts[applicationId] ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update KYC checklist");
      }

      setApplications((prev) => prev.map((item) => (item.id === applicationId ? data.application : item)));
      setMessage("KYC checklist updated. Onboarding automation applied.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update KYC checklist");
    } finally {
      setUpdatingId(null);
    }
  }

  async function loadDocuments(applicationId: string, vendorId?: string) {
    if (!vendorId) {
      setMessage("Generate vendor credentials first so documents can be linked to a vendor account.");
      return;
    }

    setLoadingDocumentsId(applicationId);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/vendor-documents?vendorId=${encodeURIComponent(vendorId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setApplications([]);
        setAuthRequired(true);
        setMessage("Admin session required. Please sign in again to access vendor applications.");
        const next = encodeURIComponent("/dashboard/admin?section=vendor-applications");
        setTimeout(() => {
          router.push(`/login?next=${next}`);
        }, 250);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load vendor documents");
      }

      setDocumentsByApplication((prev) => ({
        ...prev,
        [applicationId]: data.documents ?? [],
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load vendor documents");
    } finally {
      setLoadingDocumentsId(null);
    }
  }

  async function approveAfterDocumentReview(item: VendorApplication) {
    const docs = documentsByApplication[item.id] ?? [];
    if (docs.length === 0) {
      setMessage("Please load and review at least one uploaded document before approving KYC.");
      return;
    }

    await updateChecklist(item.id, {
      identityVerified: true,
      businessProofVerified: true,
      bankVerified: true,
      agreementAccepted: true,
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={summary.total} />
        <StatCard label="New" value={summary.new} />
        <StatCard label="KYC Complete" value={summary.kycComplete} />
        <StatCard label="Credentials Issued" value={summary.credentialed} />
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business, contact, phone, city"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statuses.map((item) => {
            const active = activeStatus === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveStatus(item.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black/80 hover:bg-black/[0.03]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => void fetchApplications()}
          className="w-full rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.03] lg:w-auto"
        >
          Refresh
        </button>
      </div>

      {message && <p className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">{message}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg bg-black/[0.05]" />
          ))}
        </div>
      ) : authRequired ? (
        <p className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black/70">
          Admin authentication is required to view vendor applications. Re-login as admin and refresh.
        </p>
      ) : applications.length === 0 ? (
        <p className="rounded-lg border border-black/10 px-3 py-2 text-sm text-black/60">No vendor applications found.</p>
      ) : (
        <div className="space-y-2">
          {applications.map((item) => (
            <div key={item.id} className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.businessName}</p>

              <div className="mt-2 rounded-lg border border-black/10 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Uploaded KYC Documents</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void loadDocuments(item.id, item.vendorId)}
                      disabled={loadingDocumentsId === item.id}
                      className="rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-60"
                    >
                      {loadingDocumentsId === item.id ? "Loading..." : "Load Documents"}
                    </button>
                    <button
                      onClick={() => void approveAfterDocumentReview(item)}
                      disabled={updatingId === item.id || item.status === "credentials-generated"}
                      className="rounded border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                    >
                      Approve KYC (After Review)
                    </button>
                  </div>
                </div>

                {(documentsByApplication[item.id] ?? []).length === 0 ? (
                  <p className="mt-2 text-xs text-black/60">No documents loaded yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {(documentsByApplication[item.id] ?? []).map((doc) => (
                      <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-black/10 px-2 py-1 text-xs">
                        <p className="text-black/75">{doc.documentType} · {doc.fileName} · {(doc.sizeBytes / 1024).toFixed(1)} KB</p>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="rounded border border-black/15 px-2 py-0.5 font-semibold text-black/70 hover:bg-black/[0.03]">
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                  <p className="break-words text-black/60">{item.contactName} · {item.phone} · {item.city}</p>
                  <p className="text-xs text-black/50">Fleet: {item.fleetSize} · Applied: {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-black/15 px-2.5 py-0.5 text-xs font-semibold uppercase text-black/70">
                  {item.status}
                </span>
              </div>

              {item.kycApprovedAt ? (
                <p className="mt-1 text-xs font-semibold text-green-700">
                  KYC approved at: {new Date(item.kycApprovedAt).toLocaleString()}
                </p>
              ) : null}

              <div className="mt-2 grid gap-2 xl:grid-cols-[220px_1fr_auto]">
                <select
                  value={item.status}
                  onChange={(e) => void updateApplication(item.id, { status: e.target.value as VendorApplicationStatus })}
                  disabled={updatingId === item.id}
                  className="rounded border border-black/15 px-2 py-1 text-xs"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="kyc-in-progress">KYC In Progress</option>
                  <option value="kyc-complete">KYC Complete</option>
                  <option value="credentials-generated">Credentials Generated</option>
                  <option value="rejected">Rejected</option>
                </select>

                <input
                  value={noteDrafts[item.id] ?? ""}
                  onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Admin note (KYC docs checked, call done, etc.)"
                  className="rounded border border-black/15 px-2 py-1 text-xs"
                />

                <button
                  onClick={() => void updateApplication(item.id, { adminNotes: noteDrafts[item.id] ?? "" })}
                  disabled={updatingId === item.id}
                  className="w-full rounded border border-black/15 px-3 py-1 text-xs font-semibold text-black/70 transition hover:bg-black/[0.03] disabled:opacity-50 xl:w-auto"
                >
                  Save Note
                </button>
              </div>

              <div className="mt-2 rounded-lg border border-black/10 bg-black/[0.02] p-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-black/60">KYC Checklist Workflow</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.identityVerified}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) =>
                        void updateChecklist(item.id, { identityVerified: e.target.checked })
                      }
                    />
                    Identity document verified
                  </label>
                  <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.businessProofVerified}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) =>
                        void updateChecklist(item.id, { businessProofVerified: e.target.checked })
                      }
                    />
                    Business proof verified
                  </label>
                  <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.bankVerified}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) =>
                        void updateChecklist(item.id, { bankVerified: e.target.checked })
                      }
                    />
                    Bank details verified
                  </label>
                  <label className="flex items-center gap-2 text-xs text-black/75">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.agreementAccepted}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) =>
                        void updateChecklist(item.id, { agreementAccepted: e.target.checked })
                      }
                    />
                    Agreement accepted
                  </label>
                </div>
                <p className="mt-2 text-xs text-black/60">
                  Automation: When all checklist items are complete, vendor credentials are generated automatically.
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void generateCredentials(item.id)}
                  disabled={updatingId === item.id || (item.status !== "kyc-complete" && item.status !== "credentials-generated")}
                  className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                >
                  {item.status === "credentials-generated" ? "Re-show Credentials" : "Generate Login ID + Password"}
                </button>
              </div>

              {item.loginId && item.tempPassword && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                  <p className="break-all"><span className="font-semibold">Login ID:</span> {item.loginId}</p>
                  <p className="break-all"><span className="font-semibold">Temporary Password:</span> {item.tempPassword}</p>
                  {item.onboardingAutomatedAt && (
                    <p><span className="font-semibold">Automated At:</span> {new Date(item.onboardingAutomatedAt).toLocaleString()}</p>
                  )}
                  <p className="mt-1 text-green-700/80">Share securely and ask vendor to reset password after first login.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-black/60">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
