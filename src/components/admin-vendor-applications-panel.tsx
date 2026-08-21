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
  vendorId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewStatus: "pending" | "verified" | "rejected" | "needs-reupload";
  reviewNote?: string;
  reviewedAt?: string;
};

const statuses: Array<{ id: VendorApplicationStatus | "all"; label: string }> = [
  { id: "all", label: "All Application Statuses" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "kyc-in-progress", label: "KYC In Progress" },
  { id: "kyc-complete", label: "KYC Complete" },
  { id: "credentials-generated", label: "Credentials Generated" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_BADGES: Record<VendorApplicationStatus, string> = {
  new: "bg-red-950 text-red-400 border border-red-800/30",
  contacted: "bg-slate-950 text-slate-400 border border-slate-800/30",
  "kyc-in-progress": "bg-amber-950 text-amber-400 border border-amber-800/30",
  "kyc-complete": "bg-cyan-950 text-cyan-400 border border-cyan-800/30",
  "credentials-generated": "bg-emerald-950 text-emerald-400 border border-emerald-800/30",
  rejected: "bg-red-950 text-red-500 border border-red-800/20",
};

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
  const [commissionDrafts, setCommissionDrafts] = useState<Record<string, number>>({});
  const [documentsByApplication, setDocumentsByApplication] = useState<Record<string, VendorKycDocument[]>>({});
  const [loadingDocumentsId, setLoadingDocumentsId] = useState<string | null>(null);
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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
        setMessage("Admin session required. Please sign in again.");
        const next = encodeURIComponent("/dashboard/admin?section=vendor-applications");
        setTimeout(() => {
          router.push(`/login?next=${next}`);
        }, 250);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load vendor applications");
      }

      setApplications(data.applications ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load vendor applications");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, router, search]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const counts = useMemo(() => {
    return {
      total: applications.length,
      new: applications.filter((a) => a.status === "new").length,
      contacted: applications.filter((a) => a.status === "contacted").length,
      kycInProgress: applications.filter((a) => a.status === "kyc-in-progress").length,
      kycComplete: applications.filter((a) => a.status === "kyc-complete").length,
      credentialsGenerated: applications.filter((a) => a.status === "credentials-generated").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  }, [applications]);

  async function updateApplication(id: string, payload: Partial<VendorApplication>) {
    setUpdatingId(id);
    setMessage("");

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update application");
      }

      setApplications((prev) => prev.map((item) => (item.id === id ? data.application : item)));
      setMessage("Vendor application status updated successfully.");
      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update application");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleUnauthorized() {
    setAuthRequired(true);
    setMessage("Admin session required. Redirecting to login...");
    const next = encodeURIComponent("/dashboard/admin?section=vendor-applications");
    setTimeout(() => {
      router.push(`/login?next=${next}`);
    }, 250);
  }

  async function loadKycDocuments(applicationId: string, vendorId: string) {
    if (!vendorId) return;
    setLoadingDocumentsId(applicationId);
    try {
      const res = await fetch(`/api/admin/vendor-documents?vendorId=${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentsByApplication((prev) => ({ ...prev, [applicationId]: data.documents ?? [] }));
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoadingDocumentsId(null);
    }
  }

  async function reviewDocument(applicationId: string, doc: VendorKycDocument, reviewStatus: VendorKycDocument["reviewStatus"]) {
    setReviewingDocumentId(doc.id);
    try {
      const res = await fetch("/api/admin/vendor-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, reviewStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocumentsByApplication((prev) => ({
          ...prev,
          [applicationId]: prev[applicationId].map((d) => (d.id === doc.id ? data.document : d)),
        }));
      }
    } catch (error) {
      console.error("Failed to review document:", error);
    } finally {
      setReviewingDocumentId(null);
    }
  }

  async function updateChecklist(id: string, checklistPatch: Partial<VendorKycChecklist>) {
    const app = applications.find((a) => a.id === id);
    if (!app) return;

    const mergedChecklist = { ...app.kycChecklist, ...checklistPatch };
    await updateApplication(id, { kycChecklist: mergedChecklist });
  }

  async function generateCredentials(id: string) {
    setUpdatingId(id);
    setMessage("");

    const commissionRate = commissionDrafts[id] ?? 15;

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-credentials", id, commissionRate }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate credentials");
      }

      setApplications((prev) => prev.map((item) => (item.id === id ? data.application : item)));
      setMessage("Onboarding credentials generated successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate credentials");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Overview Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6 text-center">
        <StatTile label="Total Applications" value={counts.total} />
        <StatTile label="New Registrants" value={counts.new} />
        <StatTile label="Contacted" value={counts.contacted} />
        <StatTile label="KYC Active" value={counts.kycInProgress} />
        <StatTile label="KYC Verifications" value={counts.kycComplete} />
        <StatTile label="Rejected" value={counts.rejected} />
      </div>

      {/* Filter Row */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_210px_auto] text-xs">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name, city, contact person, or telephone..."
          className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        />
        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        >
          {statuses.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[#121212]">
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => void fetchApplications()}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 font-bold uppercase tracking-wider text-white transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/25 px-4 py-2.5 text-xs text-red-400">
          {message}
        </div>
      )}

      {/* Applications list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : authRequired ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-center text-xs text-red-400">
          Admin authorization required.
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 text-center text-xs text-white/50">
          No vendor applications found matching criteria.
        </div>
      ) : (
        <div className="space-y-3.5">
          {applications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition duration-300">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <p className="font-extrabold text-white text-sm">{item.businessName}</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {item.contactName} · <span className="text-white/40">{item.phone}</span> · <span className="text-white font-bold">{item.city}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border ${STATUS_BADGES[item.status]}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {item.kycApprovedAt && (
                <p className="mt-2 text-xs font-bold text-emerald-400">
                  ✓ KYC Approved At: {new Date(item.kycApprovedAt).toLocaleString()}
                </p>
              )}

              <div className="mt-3.5 grid gap-2.5 md:grid-cols-[180px_1fr_auto] text-xs">
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                    disabled={updatingId === item.id}
                    className="w-full text-left rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)] flex justify-between items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="capitalize">{item.status.replace(/-/g, " ")}</span>
                    <span className="text-[9px] text-white/35">▼</span>
                  </button>
                  {openDropdownId === item.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenDropdownId(null)} />
                      <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-white/5 bg-[#121212] p-1.5 shadow-2xl z-40 max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
                        {[
                          { id: "new", label: "New" },
                          { id: "contacted", label: "Contacted" },
                          { id: "kyc-in-progress", label: "KYC In Progress" },
                          { id: "kyc-complete", label: "KYC Complete" },
                          { id: "credentials-generated", label: "Credentials Generated" },
                          { id: "rejected", label: "Rejected" },
                        ].map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => {
                              void updateApplication(item.id, { status: opt.id as any });
                              setOpenDropdownId(null);
                            }}
                            className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                              item.status === opt.id
                                ? "bg-[var(--brand-red)] text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <input
                  value={noteDrafts[item.id] ?? item.adminNotes ?? ""}
                  onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Review findings notes (checked docs, call verified, etc.)"
                  className="rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2 text-white focus:outline-none focus:border-[var(--brand-red)]"
                />

                <button
                  onClick={() => void updateApplication(item.id, { adminNotes: noteDrafts[item.id] ?? "" })}
                  disabled={updatingId === item.id}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 font-bold uppercase tracking-wider text-white transition cursor-pointer text-xs"
                >
                  Save Note
                </button>
              </div>

              {/* KYC Checkbox list */}
              <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.01] p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/50">KYC Verify Checklists</p>
                  {item.vendorId && (
                    <button
                      onClick={() => void loadKycDocuments(item.id, item.vendorId!)}
                      disabled={loadingDocumentsId === item.id}
                      className="text-[9px] uppercase font-black text-cyan-400 hover:underline transition cursor-pointer"
                    >
                      {loadingDocumentsId === item.id ? "Loading..." : "📁 Audit Uploaded Documents"}
                    </button>
                  )}
                </div>

                {documentsByApplication[item.id] && (
                  <div className="space-y-2 border-b border-white/5 pb-3">
                    {documentsByApplication[item.id].length === 0 ? (
                      <p className="text-[10px] text-white/40">No KYC document files uploaded by vendor yet.</p>
                    ) : (
                      documentsByApplication[item.id].map((doc) => (
                        <div key={doc.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-extrabold uppercase text-[10px] text-white">{doc.documentType.replace("_", " ")}</p>
                            <a href={doc.fileUrl} target="_blank" className="text-[9px] text-cyan-400 hover:underline">
                              View File: {doc.fileName} ({Math.round(doc.sizeBytes / 1024)} KB)
                            </a>
                          </div>
                          <div className="flex gap-1.5 text-[9px] font-black uppercase tracking-wider">
                            <span className={`px-2 py-0.5 rounded-full border ${
                              doc.reviewStatus === "verified"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30"
                                : doc.reviewStatus === "rejected"
                                ? "bg-red-950 text-red-400 border border-red-900/30"
                                : "bg-slate-950 text-slate-400 border border-slate-800/30"
                            }`}>
                              {doc.reviewStatus}
                            </span>
                            <button
                              onClick={() => void reviewDocument(item.id, doc, "verified")}
                              disabled={reviewingDocumentId === doc.id}
                              className="rounded px-2 py-0.5 text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 hover:bg-emerald-950/40 transition cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => void reviewDocument(item.id, doc, "rejected")}
                              disabled={reviewingDocumentId === doc.id}
                              className="rounded px-2 py-0.5 text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2 text-xs text-white/80">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.identityVerified}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) => void updateChecklist(item.id, { identityVerified: e.target.checked })}
                      className="accent-[var(--brand-red)]"
                    />
                    <span>Identity verified (Aadhaar / Passport)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.businessProofVerified}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) => void updateChecklist(item.id, { businessProofVerified: e.target.checked })}
                      className="accent-[var(--brand-red)]"
                    />
                    <span>Business proof verified (GSTIN / Trade)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.bankVerified}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) => void updateChecklist(item.id, { bankVerified: e.target.checked })}
                      className="accent-[var(--brand-red)]"
                    />
                    <span>Bank account verified (Passbook / Cancelled check)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.kycChecklist.agreementAccepted}
                      disabled={updatingId === item.id || item.status === "rejected"}
                      onChange={(e) => void updateChecklist(item.id, { agreementAccepted: e.target.checked })}
                      className="accent-[var(--brand-red)]"
                    />
                    <span>Partner terms & agreement accepted</span>
                  </label>
                </div>
              </div>

              {/* Login details generation & Email Dispatch */}
              <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Commission Rate (%) Custom Control Bar */}
                  <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-emerald-950/40 via-black to-emerald-950/20 border border-emerald-500/40 rounded-2xl p-2.5 shadow-lg shadow-emerald-950/40">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💼</span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Commission Share</span>
                        <span className="text-[9px] text-white/50 font-mono">Platform payout split %</span>
                      </div>
                    </div>

                    {/* Stepper Control: [-] 15% [+] */}
                    <div className="flex items-center gap-1 bg-black/70 border border-emerald-500/40 rounded-xl p-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => {
                          const curr = commissionDrafts[item.id] ?? 15;
                          setCommissionDrafts((prev) => ({ ...prev, [item.id]: Math.max(0, curr - 1) }));
                        }}
                        className="h-7 w-7 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer select-none"
                      >
                        -
                      </button>

                      <div className="px-1.5 text-center flex items-center justify-center min-w-[50px]">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={commissionDrafts[item.id] ?? 15}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                            setCommissionDrafts((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-9 bg-transparent text-center text-sm font-black text-emerald-400 focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-xs font-black text-emerald-400">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const curr = commissionDrafts[item.id] ?? 15;
                          setCommissionDrafts((prev) => ({ ...prev, [item.id]: Math.min(100, curr + 1) }));
                        }}
                        className="h-7 w-7 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex items-center gap-1">
                      {[10, 15, 18, 20, 25].map((rate) => {
                        const isSelected = (commissionDrafts[item.id] ?? 15) === rate;
                        return (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setCommissionDrafts((prev) => ({ ...prev, [item.id]: rate }))}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition active:scale-95 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 border border-emerald-400 font-extrabold"
                                : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                            }`}
                          >
                            {rate}%
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => void generateCredentials(item.id)}
                    disabled={updatingId === item.id || item.status === "rejected"}
                    className="rounded-full border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4.5 py-2.5 text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <span>⚡</span>
                    <span>{item.status === "credentials-generated" ? "✅ Credentials & Email Sent (Re-send Email)" : "Approve & Send ID Password Email 📧"}</span>
                  </button>
                </div>

                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Submitted: {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {item.loginId && item.tempPassword && (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-400 space-y-2 shadow-lg shadow-emerald-950/50">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold uppercase text-[11px] text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Vendor Account Activated & Email Credentials Dispatched! 📧
                    </p>
                    <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                      AUTOMATED EMAIL & WHATSAPP SENT
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                    <p className="break-all font-mono bg-black/40 p-2 rounded-lg"><span className="text-white/60">LOGIN EMAIL ID:</span> <strong className="text-white">{item.loginId}</strong></p>
                    <p className="break-all font-mono bg-black/40 p-2 rounded-lg"><span className="text-white/60">TEMP PASSWORD:</span> <strong className="text-emerald-400 font-bold">{item.tempPassword}</strong></p>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed pt-1">The approval email and WhatsApp notification containing these login credentials and portal access link have been automatically dispatched to the vendor contact.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center hover:border-red-500/20 transition">
      <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
