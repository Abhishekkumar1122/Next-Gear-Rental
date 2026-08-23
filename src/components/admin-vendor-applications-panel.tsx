"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
  Lock,
  Eye,
  X,
  Copy,
  Check,
  Send,
  ChevronDown,
  Percent,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export type VendorApplicationStatus =
  | "new"
  | "contacted"
  | "kyc-in-progress"
  | "kyc-complete"
  | "credentials-generated"
  | "rejected";

export type VendorKycChecklist = {
  identityVerified: boolean;
  businessProofVerified: boolean;
  bankVerified: boolean;
  agreementAccepted: boolean;
};

export type VendorApplication = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  state: string;
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

export type VendorKycDocument = {
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
  geoLat?: number;
  geoLng?: number;
};

const STATUS_FILTERS: Array<{ id: VendorApplicationStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "kyc-in-progress", label: "KYC In Progress" },
  { id: "kyc-complete", label: "KYC Approved" },
  { id: "credentials-generated", label: "Activated" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_CONFIG: Record<
  VendorApplicationStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  new: {
    label: "New (Application Received)",
    dot: "bg-red-500",
    badge: "bg-red-950/60 text-red-400 border border-red-500/30",
    text: "text-red-400",
  },
  contacted: {
    label: "Contacted",
    dot: "bg-slate-400",
    badge: "bg-slate-900 text-slate-300 border border-slate-700/50",
    text: "text-slate-300",
  },
  "kyc-in-progress": {
    label: "KYC In Progress",
    dot: "bg-amber-400",
    badge: "bg-amber-950/60 text-amber-400 border border-amber-500/30",
    text: "text-amber-400",
  },
  "kyc-complete": {
    label: "KYC Complete (Approved)",
    dot: "bg-cyan-400",
    badge: "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30",
    text: "text-cyan-400",
  },
  "credentials-generated": {
    label: "Activated (Credentials Sent)",
    dot: "bg-emerald-400",
    badge: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30",
    text: "text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-rose-500",
    badge: "bg-rose-950/60 text-rose-500 border border-rose-800/30",
    text: "text-rose-500",
  },
};

const DOC_LABELS: Record<string, { label: string; icon: string }> = {
  "shop-photo": { label: "Shop / Premises Photo", icon: "🏪" },
  aadhaar: { label: "Aadhaar / Owner ID", icon: "🪪" },
  pan: { label: "PAN Card", icon: "🗂️" },
  "business-proof": { label: "Business Proof", icon: "🏢" },
  "bank-proof": { label: "Bank Account Proof", icon: "🏦" },
  "vehicle-rc": { label: "Vehicle RC Copy", icon: "🚗" },
  insurance: { label: "Vehicle Insurance", icon: "🛡️" },
};

export function AdminVendorApplicationsPanel() {
  const router = useRouter();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [activeStatus, setActiveStatus] = useState<VendorApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search.trim()) params.set("query", search.trim());

      const res = await fetch(
        `/api/admin/vendor-applications${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setApplications([]);
        setMessage("Admin session required. Redirecting...");
        router.push(
          "/login?next=" +
            encodeURIComponent("/dashboard/admin?section=vendor-applications")
        );
        return;
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load applications");
      }

      setApplications(data.applications ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load applications"
      );
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
      activated: applications.filter((a) => a.status === "credentials-generated").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  }, [applications]);

  const handleApplicationUpdated = (updated: VendorApplication) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    if (selectedApp && selectedApp.id === updated.id) {
      setSelectedApp(updated);
    }
  };

  return (
    <div className="space-y-5 text-white">
      {/* Overview Stat Tiles */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 text-center text-xs">
        <StatTile label="Total" value={counts.total} />
        <StatTile label="New" value={counts.new} highlight="text-red-400" />
        <StatTile label="Contacted" value={counts.contacted} />
        <StatTile label="KYC Active" value={counts.kycInProgress} highlight="text-amber-400" />
        <StatTile label="KYC Done" value={counts.kycComplete} highlight="text-cyan-400" />
        <StatTile label="Activated" value={counts.activated} highlight="text-emerald-400" />
        <StatTile label="Rejected" value={counts.rejected} highlight="text-rose-500" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0d12]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-lg shadow-black/40">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeStatus === tab.id
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search name, phone, city, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition"
            />
          </div>
          <button
            onClick={() => void fetchApplications()}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/30 text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Applications Table / Compact Row View */}
      <div className="border border-white/10 bg-[#0d0d12]/90 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl shadow-black/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] border-b border-white/10 text-white/40 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Business &amp; Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">Fleet</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applied</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-500" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-white/40">
                    No vendor applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-white/[0.04] transition cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-red-400 transition">
                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                          {app.id}
                        </span>
                      </td>

                      {/* Business & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-red-300 transition text-sm">
                          {app.businessName}
                        </div>
                        <div className="text-white/50 text-[11px] mt-0.5">{app.contactName}</div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <span className="text-white/90 font-medium">{app.city}</span>
                        {app.state && <span className="text-white/40 text-[11px]">, {app.state}</span>}
                      </td>

                      {/* Phone / Email */}
                      <td className="py-3.5 px-4">
                        <div className="text-white/90 font-mono">{app.phone}</div>
                        {app.email && (
                          <div className="text-white/40 text-[11px] truncate max-w-[160px]">
                            {app.email}
                          </div>
                        )}
                      </td>

                      {/* Fleet */}
                      <td className="py-3.5 px-4 text-white/80 font-semibold">{app.fleetSize}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{app.status === "credentials-generated" ? "Activated" : cfg.label.split(" ")[0]}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-white/40 text-[11px] whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 text-white/90 hover:text-white hover:bg-red-600 hover:border-red-600 font-bold transition cursor-pointer text-xs shadow-sm"
                        >
                          <span>Review KYC</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Vendor KYC Review Modal */}
      {selectedApp && (
        <VendorReviewModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleApplicationUpdated}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: number; highlight?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/80 p-3.5 text-center backdrop-blur-xl shadow-md">
      <div className={`text-xl font-black ${highlight || "text-white"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mt-0.5">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive Vendor KYC Review & Verification Modal
// ─────────────────────────────────────────────────────────────────────────────

interface VendorReviewModalProps {
  application: VendorApplication;
  onClose: () => void;
  onUpdate: (updated: VendorApplication) => void;
}

function VendorReviewModal({ application, onClose, onUpdate }: VendorReviewModalProps) {
  const [activeTab, setActiveTab] = useState<"docs" | "checklist" | "credentials">("docs");
  const [documents, setDocuments] = useState<VendorKycDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docReviewingId, setDocReviewingId] = useState<string | null>(null);

  // Form states
  const [status, setStatus] = useState<VendorApplicationStatus>(application.status);
  const [adminNotes, setAdminNotes] = useState(application.adminNotes || "");
  const [checklist, setChecklist] = useState<VendorKycChecklist>({ ...application.kycChecklist });
  const [commissionRate, setCommissionRate] = useState<number>(15);

  // Action loading states
  const [savingStatus, setSavingStatus] = useState(false);
  const [generatingCredentials, setGeneratingCredentials] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const vendorIdKey = application.vendorId || application.id;

  // Load uploaded KYC documents
  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(
        `/api/admin/vendor-documents?vendorId=${encodeURIComponent(vendorIdKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch (e) {
      console.error("Error loading docs:", e);
    } finally {
      setLoadingDocs(false);
    }
  }, [vendorIdKey]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Review single document
  const handleReviewDocument = async (
    docId: string,
    reviewStatus: VendorKycDocument["reviewStatus"],
    reviewNote?: string
  ) => {
    setDocReviewingId(docId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/vendor-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendorIdKey,
          documentId: docId,
          reviewStatus,
          reviewNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update doc review");

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? data.document : d))
      );
      setActionMessage({ type: "success", text: "Document review status saved." });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Review update failed.",
      });
    } finally {
      setDocReviewingId(null);
    }
  };

  // Save Checklist & Application Status (Decoupled, does not send credentials!)
  const handleSaveStatusAndChecklist = async () => {
    setSavingStatus(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          status,
          adminNotes,
          kycChecklist: checklist,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes");

      onUpdate(data.application);
      setActionMessage({
        type: "success",
        text: "Application status & verification notes saved successfully.",
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save.",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  // Generate and Send Credentials (Explicit deliberate action)
  const handleGenerateCredentials = async () => {
    setGeneratingCredentials(true);
    setActionMessage(null);

    try {
      const res = await fetch(
        `/api/admin/vendor-applications/${encodeURIComponent(application.id)}/credentials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commissionRate }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate credentials");

      onUpdate(data.application);
      setStatus("credentials-generated");
      setActionMessage({
        type: "success",
        text: "Vendor account activated & credentials dispatched via Email & WhatsApp!",
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Credentials dispatch failed.",
      });
    } finally {
      setGeneratingCredentials(false);
    }
  };

  const currentCfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const verifiedDocCount = documents.filter((d) => d.reviewStatus === "verified").length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl border border-white/15 bg-[#0e0e13] shadow-2xl shadow-black overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-gradient-to-r from-[#171720] via-[#111116] to-[#0e0e13]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-600/10 border border-red-600/25 flex items-center justify-center text-red-500 font-bold shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-white">{application.businessName}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentCfg.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
                  <span>{currentCfg.label}</span>
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Application ID:{" "}
                <span className="font-mono font-bold text-white/90">
                  {application.id}
                </span>{" "}
                · Applied {new Date(application.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Contact & Details Strip */}
        <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-xs text-white/75">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <span className="truncate font-medium">{application.contactName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <span className="font-mono font-bold text-white/90">{application.phone}</span>
            <button
              onClick={() => copyToClipboard(application.phone, "phone")}
              className="text-white/40 hover:text-white cursor-pointer"
              title="Copy phone"
            >
              {copiedKey === "phone" ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <span className="truncate">{application.email || "No email"}</span>
            {application.email && (
              <button
                onClick={() => copyToClipboard(application.email, "email")}
                className="text-white/40 hover:text-white cursor-pointer"
                title="Copy email"
              >
                {copiedKey === "email" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <span className="truncate">
              {application.city}
              {application.state ? `, ${application.state}` : ""}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-shrink-0 flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-black/40">
          <TabButton
            active={activeTab === "docs"}
            onClick={() => setActiveTab("docs")}
            icon={<FileText className="w-3.5 h-3.5" />}
            label={`1. Document Audit (${documents.length})`}
            badge={verifiedDocCount > 0 ? `${verifiedDocCount} Verified` : undefined}
          />
          <TabButton
            active={activeTab === "checklist"}
            onClick={() => setActiveTab("checklist")}
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            label="2. KYC Checklists & Status"
          />
          <TabButton
            active={activeTab === "credentials"}
            onClick={() => setActiveTab("credentials")}
            icon={<Lock className="w-3.5 h-3.5" />}
            label="3. Send Credentials (Final)"
            badge={application.loginId ? "Activated" : undefined}
          />
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`flex-shrink-0 px-6 py-2.5 text-xs flex items-center justify-between ${
              actionMessage.type === "success"
                ? "bg-emerald-950/50 border-b border-emerald-500/30 text-emerald-300"
                : "bg-red-950/50 border-b border-red-500/30 text-red-300"
            }`}
          >
            <span className="font-medium">{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DOCUMENT AUDIT & GPS */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Uploaded KYC Documents</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Verify shop photo GPS coordinates, ID proofs, and registration documents.
                  </p>
                </div>
                <button
                  onClick={() => void loadDocuments()}
                  className="flex items-center gap-1 text-xs text-white/70 hover:text-white border border-white/10 rounded-xl px-3 py-1.5 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${loadingDocs ? "animate-spin text-red-400" : ""}`}
                  />{" "}
                  Refresh Docs
                </button>
              </div>

              {loadingDocs ? (
                <div className="text-center py-10 text-white/40 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-500" />
                  Loading uploaded documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-white/20" />
                  <p className="text-sm font-bold text-white">No Documents Uploaded Yet</p>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    The vendor has received the upload link via WhatsApp &amp; Email. Once uploaded, documents will appear here with instant preview.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {documents.map((doc) => {
                    const info =
                      DOC_LABELS[doc.documentType] || {
                        label: doc.documentType,
                        icon: "📄",
                      };
                    const isReviewing = docReviewingId === doc.id;
                    const isShopPhoto = doc.documentType === "shop-photo";

                    return (
                      <div
                        key={doc.id}
                        className={`rounded-2xl border p-4.5 space-y-3 transition shadow-md ${
                          doc.reviewStatus === "verified"
                            ? "border-emerald-500/30 bg-emerald-950/15"
                            : doc.reviewStatus === "rejected"
                            ? "border-red-500/30 bg-red-950/15"
                            : doc.reviewStatus === "needs-reupload"
                            ? "border-amber-500/30 bg-amber-950/15"
                            : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{info.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-white">{info.label}</p>
                              <p className="text-[10px] text-white/40 truncate max-w-[180px] mt-0.5">
                                {doc.fileName}
                              </p>
                            </div>
                          </div>

                          <a
                            href={`/api/admin/vendor-documents/${encodeURIComponent(doc.id)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-bold text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition shadow-sm"
                          >
                            <Eye className="w-3 h-3" /> View
                          </a>
                        </div>

                        {/* GPS Location badge for Shop Photo */}
                        {isShopPhoto && (
                          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 p-2.5 text-xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                                <MapPin className="w-3.5 h-3.5" />
                                {doc.geoLat
                                  ? `GPS: ${doc.geoLat.toFixed(5)}, ${doc.geoLng?.toFixed(5)}`
                                  : "No GPS data captured"}
                              </span>
                              {doc.geoLat && (
                                <a
                                  href={`https://www.google.com/maps?q=${doc.geoLat},${doc.geoLng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] underline text-emerald-300 hover:text-white font-bold"
                                >
                                  Open Map ↗
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Document Review Status Selector */}
                        <div className="flex items-center gap-1.5 pt-2.5 border-t border-white/5 flex-wrap">
                          <span className="text-[10px] font-bold text-white/40 uppercase">
                            Audit:
                          </span>
                          <button
                            disabled={isReviewing}
                            onClick={() => void handleReviewDocument(doc.id, "verified")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              doc.reviewStatus === "verified"
                                ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                                : "bg-white/5 text-white/60 hover:bg-emerald-950/50 hover:text-emerald-300 border border-white/10"
                            }`}
                          >
                            ✓ Verify
                          </button>
                          <button
                            disabled={isReviewing}
                            onClick={() =>
                              void handleReviewDocument(
                                doc.id,
                                "needs-reupload",
                                "Please upload a clearer copy."
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              doc.reviewStatus === "needs-reupload"
                                ? "bg-amber-500 text-black font-black shadow-md shadow-amber-500/20"
                                : "bg-white/5 text-white/60 hover:bg-amber-950/50 hover:text-amber-300 border border-white/10"
                            }`}
                          >
                            ⚠️ Re-upload
                          </button>
                          <button
                            disabled={isReviewing}
                            onClick={() =>
                              void handleReviewDocument(doc.id, "rejected", "Document rejected.")
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              doc.reviewStatus === "rejected"
                                ? "bg-red-600 text-white font-black shadow-md shadow-red-600/20"
                                : "bg-white/5 text-white/60 hover:bg-red-950/50 hover:text-red-300 border border-white/10"
                            }`}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KYC CHECKLISTS & STATUS */}
          {activeTab === "checklist" && (
            <div className="space-y-6">
              {/* Checklists */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5.5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">KYC Verification Checklist</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Mark off verified items as you inspect the documents.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ChecklistToggle
                    label="Identity Verified"
                    sublabel="Aadhaar, Voter ID, or Passport"
                    checked={checklist.identityVerified}
                    onChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, identityVerified: checked }))
                    }
                  />
                  <ChecklistToggle
                    label="Business Proof Verified"
                    sublabel="GSTIN, Trade License, or Shop Act"
                    checked={checklist.businessProofVerified}
                    onChange={(checked) =>
                      setChecklist((prev) => ({
                        ...prev,
                        businessProofVerified: checked,
                      }))
                    }
                  />
                  <ChecklistToggle
                    label="Bank Account Verified"
                    sublabel="Passbook or Cancelled Cheque"
                    checked={checklist.bankVerified}
                    onChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, bankVerified: checked }))
                    }
                  />
                  <ChecklistToggle
                    label="Terms & Agreement Accepted"
                    sublabel="Rental partner agreement accepted"
                    checked={checklist.agreementAccepted}
                    onChange={(checked) =>
                      setChecklist((prev) => ({
                        ...prev,
                        agreementAccepted: checked,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Application Status & Notes */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5.5 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Application Status &amp; Admin Notes
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Custom Sleek Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2">
                      Application Status
                    </label>
                    <CustomStatusDropdown
                      value={status}
                      onChange={(newStatus) => setStatus(newStatus)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2">
                      Fleet Size
                    </label>
                    <input
                      disabled
                      value={application.fleetSize}
                      className="w-full rounded-xl border border-white/10 bg-white/5 text-white/60 px-4 py-2.5 text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">
                    Admin Review Notes (Visible on Vendor Check Status page)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Identity verified on call. Awaiting GST certificate clarification."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 text-white px-4 py-2.5 text-xs placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => void handleSaveStatusAndChecklist()}
                    disabled={savingStatus}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {savingStatus ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Save Verification &amp; Notes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS & ACTIVATION */}
          {activeTab === "credentials" && (
            <div className="space-y-6">
              {/* Credentials Card */}
              {application.loginId && application.tempPassword ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4 shadow-xl shadow-emerald-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Vendor Account Activated &amp; Credentials Generated</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full">
                      Active Vendor
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                      <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                        Login Email / Username
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-mono text-xs font-bold text-white">
                          {application.loginId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(application.loginId!, "loginId")}
                          className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
                          title="Copy"
                        >
                          {copiedKey === "loginId" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                      <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                        Temporary Password
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {application.tempPassword}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(application.tempPassword!, "tempPassword")
                          }
                          className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
                          title="Copy"
                        >
                          {copiedKey === "tempPassword" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed pt-1">
                    Credentials have been delivered to{" "}
                    <strong className="text-white">
                      {application.email || application.loginId}
                    </strong>{" "}
                    and WhatsApp number{" "}
                    <strong className="text-white font-mono">{application.phone}</strong>.
                  </p>

                  <button
                    onClick={() => void handleGenerateCredentials()}
                    disabled={generatingCredentials}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 px-4 py-2 text-xs font-bold text-emerald-300 transition cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" /> Re-Send Credentials (Email + WhatsApp)
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#121218]/80 p-6 space-y-6 shadow-xl shadow-black/40">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Generate Vendor Account &amp; Dispatch Credentials</span>
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      This is the final activation stage. When you click the button below, the vendor partner account will be created, and login credentials will be delivered via Email &amp; WhatsApp.
                    </p>
                  </div>

                  {/* Clean Custom Commission Controller */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-xs font-bold text-white">
                        Platform Commission Split (%)
                      </label>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                        Vendor Payout: {Math.max(0, 100 - (commissionRate || 0))}% · Platform: {commissionRate || 0}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Preset Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[10, 15, 18, 20, 25].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setCommissionRate(rate)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                              commissionRate === rate
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-500 scale-105"
                                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                          >
                            {rate}% {rate === 15 && <span className="text-[9px] opacity-80 font-normal ml-0.5">★</span>}
                          </button>
                        ))}
                      </div>

                      {/* Custom Stepper with Generous Width & No Overflow */}
                      <div className="flex items-center rounded-xl border border-white/20 bg-black/80 p-1.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setCommissionRate((prev) => Math.max(1, (prev || 15) - 1))}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                          title="Decrease 1%"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex items-center justify-center px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={commissionRate === 0 ? "" : commissionRate}
                            placeholder="15"
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (!val) {
                                setCommissionRate(0);
                              } else {
                                const num = parseInt(val, 10);
                                setCommissionRate(Math.min(99, Math.max(1, num)));
                              }
                            }}
                            onBlur={() => {
                              if (!commissionRate || commissionRate < 1) setCommissionRate(15);
                            }}
                            className="w-12 bg-transparent text-white font-mono font-black text-center text-sm focus:outline-none placeholder-white/20"
                          />
                          <span className="text-white/40 text-xs font-black ml-0.5">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCommissionRate((prev) => Math.min(99, (prev || 15) + 1))}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                          title="Increase 1%"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Channels Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/40 text-white/70">
                      <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0 font-bold">
                        ✉️
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-white">Email Notification</p>
                        <p className="text-[11px] text-white/40 truncate">{application.email || "No email provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/40 text-white/70">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 font-bold">
                        💬
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-white">WhatsApp Alert</p>
                        <p className="text-[11px] text-white/40 font-mono">{application.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explicit Generate CTA */}
                  <button
                    onClick={() => void handleGenerateCredentials()}
                    disabled={generatingCredentials}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 py-4 px-6 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-emerald-400/30"
                  >
                    {generatingCredentials ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Account &amp; Sending Notifications...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Generate &amp; Dispatch Login Credentials Now</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 px-6 py-3.5 border-t border-white/10 flex items-center justify-between bg-black/40 text-xs text-white/40">
          <span>Application: {application.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/15 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Sleek Dropdown Component (Replacing Native OS Select)
// ─────────────────────────────────────────────────────────────────────────────

function CustomStatusDropdown({
  value,
  onChange,
}: {
  value: VendorApplicationStatus;
  onChange: (val: VendorApplicationStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = STATUS_CONFIG[value] || STATUS_CONFIG.new;

  const options: VendorApplicationStatus[] = [
    "new",
    "contacted",
    "kyc-in-progress",
    "kyc-complete",
    "rejected",
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/50 hover:bg-black/70 px-4 py-2.5 text-xs text-white transition cursor-pointer focus:border-red-500 focus:outline-none shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${current.dot}`} />
          <span className="font-semibold">{current.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/40 transition-transform ${
            open ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-white/15 bg-[#12121a] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 space-y-1">
          {options.map((opt) => {
            const optCfg = STATUS_CONFIG[opt];
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-red-600/20 text-red-300 border border-red-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${optCfg.dot}`} />
                  <span>{optCfg.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-red-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
        active
          ? "border-red-500 text-white bg-white/5 rounded-t-xl"
          : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.02] rounded-t-xl"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {badge}
        </span>
      )}
    </button>
  );
}

function ChecklistToggle({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3.5 p-4 rounded-2xl border transition cursor-pointer shadow-sm ${
        checked
          ? "border-emerald-500/35 bg-emerald-950/25"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
      />
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[11px] text-white/40 mt-0.5">{sublabel}</div>
      </div>
    </label>
  );
}
