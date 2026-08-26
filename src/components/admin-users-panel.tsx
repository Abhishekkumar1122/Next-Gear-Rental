"use client";

import { useEffect, useState, useMemo } from "react";
import { getVipTierBadge, type VipTier } from "@/lib/user-tiers";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  ChevronDown,
  Percent,
  Sparkles,
  FileText,
  User,
  Building2,
} from "lucide-react";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "VENDOR" | "ADMIN";
  kycStatus: "pending" | "approved" | "rejected" | "none" | "blacklisted";
  blockCount: number;
  appealText?: string;
  blockReason?: string;
  blockCustomMessage?: string;
  blockedAt?: string;
  vipTier?: VipTier;
  commissionRate?: number;
  createdAt: string;
};

const VENDOR_BLOCK_TEMPLATES = [
  {
    id: "vendor_policy",
    label: "Policy & Agreement Violation",
    icon: "📜",
    message: "Violation of Next Gear vendor partner standards, code of conduct, or rental agreement.",
  },
  {
    id: "vendor_kyc",
    label: "KYC / Document Verification Failure",
    icon: "🪪",
    message: "Incomplete, invalid, or falsified identity/business documents. Re-verification required.",
  },
  {
    id: "vendor_offline",
    label: "Offline Deals & Fee Evasion",
    icon: "💸",
    message: "Direct off-platform rental deals or fee evasion detected on registered fleet vehicles.",
  },
  {
    id: "vendor_maintenance",
    label: "Unsafe Vehicle / Poor Maintenance",
    icon: "⚠️",
    message: "Multiple customer complaints received regarding vehicle breakdown or safety hazards.",
  },
  {
    id: "vendor_cancellation",
    label: "Excessive Booking Cancellations",
    icon: "🚫",
    message: "Unjustified cancellations or refusal to hand over vehicles to confirmed customers.",
  },
  {
    id: "vendor_custom",
    label: "Custom / Other Reason",
    icon: "✍️",
    message: "",
  },
];

const USER_BLOCK_TEMPLATES = [
  {
    id: "user_rash_driving",
    label: "Vehicle Misuse & Rash Driving",
    icon: "🏎️",
    message: "Reckless driving, overspeeding, or violation of traffic safety rules reported on rented vehicle.",
  },
  {
    id: "user_payment_default",
    label: "Payment Default & Dues",
    icon: "💳",
    message: "Unpaid rental dues, unhandled toll charges, or disputed transaction chargebacks.",
  },
  {
    id: "user_fake_id",
    label: "Fake ID / Document Impersonation",
    icon: "🪪",
    message: "Document mismatch or fraudulent driving license provided during booking verification.",
  },
  {
    id: "user_late_return",
    label: "Late Return without Intimation",
    icon: "⏰",
    message: "Failure to return vehicle on scheduled time without prior extension or communication.",
  },
  {
    id: "user_damage_dispute",
    label: "Unsettled Vehicle Damage",
    icon: "💥",
    message: "Vehicle returned with damage and refusal to cooperate with inspection damage settlement.",
  },
  {
    id: "user_custom",
    label: "Custom / Other Reason",
    icon: "✍️",
    message: "",
  },
];

export function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "USER" | "VENDOR" | "ADMIN">("all");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<UserRecord | null>(null);
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserRecord | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [counts, setCounts] = useState<{
    total: number;
    customers: number;
    vendors: number;
    admins: number;
    blocked: number;
  }>({
    total: 0,
    customers: 0,
    vendors: 0,
    admins: 0,
    blocked: 0,
  });

  // Modal edit states
  const [modalVipTier, setModalVipTier] = useState<VipTier>("BRONZE");
  const [modalCommissionRate, setModalCommissionRate] = useState<number>(15);
  const [savingModal, setSavingModal] = useState(false);

  // Block Modal state
  const [blockingTarget, setBlockingTarget] = useState<UserRecord | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [blockReasonTitle, setBlockReasonTitle] = useState<string>("");
  const [blockCustomMessage, setBlockCustomMessage] = useState<string>("");
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const fetchUsers = async (
    role = roleFilter,
    search = searchTerm,
    pageNumber = page,
    pageSize = limit
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role,
        search,
        page: String(pageNumber),
        limit: String(pageSize),
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount ?? 0);
          setTotalPages(data.pagination.totalPages ?? 1);
        }
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced server search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      void fetchUsers(roleFilter, searchTerm, 1, limit);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, limit]);

  const openDetailModal = (user: UserRecord) => {
    setSelectedDetailUser(user);
    setModalVipTier(user.vipTier || "BRONZE");
    setModalCommissionRate(user.commissionRate ?? 15);
  };

  const saveUserModalDetails = async () => {
    if (!selectedDetailUser) return;
    setSavingModal(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedDetailUser.id,
          vipTier: selectedDetailUser.role === "USER" ? modalVipTier : undefined,
          commissionRate: selectedDetailUser.role === "VENDOR" ? modalCommissionRate : undefined,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedDetailUser.id
              ? {
                  ...u,
                  vipTier: modalVipTier,
                  commissionRate:
                    selectedDetailUser.role === "VENDOR" ? modalCommissionRate : u.commissionRate,
                }
              : u
          )
        );
        setMessage(`Successfully updated ${selectedDetailUser.name}'s account settings!`);
        setTimeout(() => setMessage(""), 3000);
        setSelectedDetailUser(null);
      } else {
        setMessage("Failed to update user details.");
      }
    } catch (err) {
      console.error("Failed to save modal details:", err);
      setMessage("Error updating account.");
    } finally {
      setSavingModal(false);
    }
  };

  // Open Block Modal or Unblock directly
  const handleInitiateBlockOrUnblock = (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isBlocked = user.kycStatus === "blacklisted";

    if (isBlocked) {
      // Direct Unblock Flow
      void executeUnblock(user);
    } else {
      // Open Block Modal with default template
      const templates = user.role === "VENDOR" ? VENDOR_BLOCK_TEMPLATES : USER_BLOCK_TEMPLATES;
      const defaultTpl = templates[0];
      setBlockingTarget(user);
      setSelectedTemplateId(defaultTpl.id);
      setBlockReasonTitle(defaultTpl.label);
      setBlockCustomMessage(defaultTpl.message);
    }
  };

  const executeUnblock = async (user: UserRecord) => {
    setUpdatingId(user.id);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: "approved",
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  kycStatus: "approved",
                  blockReason: undefined,
                  blockCustomMessage: undefined,
                }
              : u
          )
        );
        setMessage(`Account ${user.name} successfully unblocked.`);
      } else {
        setMessage("Failed to unblock account.");
      }
    } catch (err) {
      console.error("Failed to unblock:", err);
      setMessage("Error sending account status update.");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const executeBlockWithReason = async () => {
    if (!blockingTarget) return;
    setSubmittingBlock(true);
    setMessage("");

    const reason = blockReasonTitle.trim() || "Policy Violation";
    const customMessage = blockCustomMessage.trim() || reason;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: blockingTarget.id,
          status: "blacklisted",
          reason,
          customMessage,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === blockingTarget.id
              ? {
                  ...u,
                  kycStatus: "blacklisted",
                  blockCount: u.blockCount + 1,
                  blockReason: reason,
                  blockCustomMessage: customMessage,
                  appealText: undefined,
                }
              : u
          )
        );
        setMessage(`Account ${blockingTarget.name} has been blocked.`);
        setBlockingTarget(null);
        if (selectedDetailUser && selectedDetailUser.id === blockingTarget.id) {
          setSelectedDetailUser(null);
        }
      } else {
        setMessage("Failed to block account.");
      }
    } catch (err) {
      console.error("Failed to block:", err);
      setMessage("Error executing account suspension.");
    } finally {
      setSubmittingBlock(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleTemplateSelect = (tpl: { id: string; label: string; message: string }) => {
    setSelectedTemplateId(tpl.id);
    setBlockReasonTitle(tpl.label);
    setBlockCustomMessage(tpl.message);
  };

  const getRoleColor = (role: UserRecord["role"]) => {
    switch (role) {
      case "ADMIN":
        return "border-purple-500/30 bg-purple-500/10 text-purple-400";
      case "VENDOR":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
      case "USER":
      default:
        return "border-white/10 bg-white/5 text-white/70";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat Tiles */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Accounts</p>
          <p className="text-2xl font-black text-white mt-0.5">{counts.total || totalCount || users.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Customers</p>
          <p className="text-2xl font-black text-white/90 mt-0.5">{counts.customers}</p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-center">
          <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">Vendors</p>
          <p className="text-2xl font-black text-blue-400 mt-0.5">{counts.vendors}</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-center">
          <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider">Suspended / Blocked</p>
          <p className="text-2xl font-black text-red-400 mt-0.5">{counts.blocked}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0d12]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-lg shadow-black/40">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {(["all", "USER", "VENDOR", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                roleFilter === r
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {r === "all" ? "All Roles" : r === "USER" ? "Customers" : r === "VENDOR" ? "Vendors" : "Admins"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search user, vendor, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition"
            />
          </div>
          <button
            onClick={() => void fetchUsers()}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/30 text-xs text-amber-300 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Users & Fleet Table */}
      <div className="border border-white/10 bg-[#0d0d12]/90 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl shadow-black/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] border-b border-white/10 text-white/40 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User / Partner</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status & Moderation</th>
                <th className="py-3.5 px-4">Tier / Split</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-500" />
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-white/40">
                    No accounts found matching search.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isBlocked = user.kycStatus === "blacklisted";
                  return (
                    <tr
                      key={user.id}
                      onClick={() => openDetailModal(user)}
                      className="hover:bg-white/[0.03] transition cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-red-300 transition text-sm">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono mt-0.5 truncate max-w-[180px]">
                          {user.id}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-white/90 font-mono text-xs">{user.email}</div>
                        {user.phone && (
                          <div className="text-white/40 text-[11px] font-mono mt-0.5">{user.phone}</div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950/80 border border-red-500/40 text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span>BLOCKED</span>
                            </span>
                            {user.blockReason && (
                              <p className="text-[10px] text-red-300/80 truncate max-w-[180px]">
                                {user.blockReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>APPROVED</span>
                          </span>
                        )}
                      </td>

                      {/* Tier / Split */}
                      <td className="py-3.5 px-4">
                        {user.role === "VENDOR" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                            <span>💼 {user.commissionRate ?? 15}% COMM</span>
                          </span>
                        ) : (
                          (() => {
                            const badge = getVipTierBadge(user.vipTier || "BRONZE");
                            return (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            );
                          })()
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-white/40 text-[11px] whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.appealText && isBlocked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppeal(user);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-500/30 hover:bg-amber-900/60 text-amber-300 font-bold text-[10px] uppercase transition cursor-pointer"
                            >
                              Appeal Pending
                            </button>
                          )}

                          <button
                            onClick={(e) => handleInitiateBlockOrUnblock(user, e)}
                            disabled={updatingId === user.id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm ${
                              isBlocked
                                ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-black hover:border-emerald-600"
                                : "bg-red-950/80 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600"
                            }`}
                          >
                            {updatingId === user.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isBlocked ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>UNBLOCK</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>BLOCK</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 Pagination Footer Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-white/10 bg-white/[0.02]">
          <div className="text-xs text-white/50">
            Showing <span className="font-bold text-white">{(page - 1) * limit + 1}</span> to{" "}
            <span className="font-bold text-white">{Math.min(page * limit, totalCount || users.length)}</span> of{" "}
            <span className="font-bold text-white">{(totalCount || users.length).toLocaleString("en-IN")}</span> accounts
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <span>Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  const newL = Number(e.target.value);
                  setLimit(newL);
                  setPage(1);
                  void fetchUsers(roleFilter, searchTerm, 1, newL);
                }}
                className="bg-black/80 border border-white/15 text-white rounded-lg px-2 py-1 text-xs outline-none cursor-pointer focus:border-red-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const newP = page - 1;
                  setPage(newP);
                  void fetchUsers(roleFilter, searchTerm, newP, limit);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white transition cursor-pointer"
              >
                ◀ Prev
              </button>
              <span className="text-xs text-white/70 px-2 font-mono">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const newP = page + 1;
                  setPage(newP);
                  void fetchUsers(roleFilter, searchTerm, newP, limit);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white transition cursor-pointer"
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          ACCOUNT DETAIL & SETTINGS MODAL
         ───────────────────────────────────────────────────────────────────────── */}
      {selectedDetailUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0e0e13] p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 font-bold text-lg">
                  {selectedDetailUser.role === "VENDOR" ? (
                    <Building2 className="w-6 h-6" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedDetailUser.name}</h3>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleColor(
                        selectedDetailUser.role
                      )}`}
                    >
                      {selectedDetailUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 font-mono mt-0.5">{selectedDetailUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailUser(null)}
                className="p-1.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metadata Info */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-[10px] font-bold text-white/40 uppercase">Account ID</p>
                <p className="font-mono text-white/80 truncate mt-0.5">{selectedDetailUser.id}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-[10px] font-bold text-white/40 uppercase">KYC Status</p>
                <p
                  className={`font-bold mt-0.5 ${
                    selectedDetailUser.kycStatus === "blacklisted" ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {selectedDetailUser.kycStatus === "blacklisted" ? "BLOCKED" : "APPROVED"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-[10px] font-bold text-white/40 uppercase">Joined On</p>
                <p className="text-white/80 mt-0.5">
                  {new Date(selectedDetailUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Blocked Reason Card if currently blocked */}
            {selectedDetailUser.kycStatus === "blacklisted" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 space-y-1.5">
                <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Account Suspended</span>
                </p>
                <p className="text-xs text-red-200/90 leading-relaxed font-semibold">
                  Reason: {selectedDetailUser.blockReason || "Policy Violation"}
                </p>
                {selectedDetailUser.blockCustomMessage && (
                  <p className="text-[11px] text-red-300/70 italic">
                    Note: "{selectedDetailUser.blockCustomMessage}"
                  </p>
                )}
              </div>
            )}

            {/* VIP Tier Selector for Customers */}
            {selectedDetailUser.role === "USER" && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <label className="block text-xs font-bold text-white">VIP Membership Tier</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as VipTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setModalVipTier(tier)}
                      className={`p-2 rounded-xl text-center border text-xs font-black transition cursor-pointer ${
                        modalVipTier === tier
                          ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Commission Split Controller */}
            {selectedDetailUser.role === "VENDOR" && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white">
                    Vendor Platform Commission Split (%)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Vendor Payout: {100 - modalCommissionRate}%
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[10, 15, 18, 20, 25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setModalCommissionRate(rate)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          modalCommissionRate === rate
                            ? "bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500 scale-105"
                            : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center rounded-xl border border-white/20 bg-black/80 p-1">
                    <button
                      type="button"
                      onClick={() => setModalCommissionRate((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={modalCommissionRate}
                      onChange={(e) => {
                        const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                        setModalCommissionRate(isNaN(num) ? 0 : Math.min(99, Math.max(1, num)));
                      }}
                      className="w-10 bg-transparent text-white font-mono font-bold text-center text-xs focus:outline-none"
                    />
                    <span className="text-white/40 text-xs font-bold mr-1">%</span>
                    <button
                      type="button"
                      onClick={() => setModalCommissionRate((prev) => Math.min(99, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={(e) => handleInitiateBlockOrUnblock(selectedDetailUser, e)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDetailUser.kycStatus === "blacklisted"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50"
                    : "bg-red-950 text-red-400 border border-red-500/30 hover:bg-red-900/50"
                }`}
              >
                {selectedDetailUser.kycStatus === "blacklisted" ? "🔓 Unblock Account" : "🚫 Block Account"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDetailUser(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void saveUserModalDetails()}
                  disabled={savingModal}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {savingModal ? "Saving..." : "Save Account Settings ⚡"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          BLOCK ACCOUNT REASON & CUSTOM MESSAGE MODAL
         ───────────────────────────────────────────────────────────────────────── */}
      {blockingTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-red-500/30 bg-[#0e0e14] p-6 space-y-5 shadow-2xl shadow-red-950/50 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Block {blockingTarget.role === "VENDOR" ? "Vendor Partner" : "Customer"}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950 border border-red-500/30 text-red-400">
                      Suspension
                    </span>
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Account: <strong className="text-white">{blockingTarget.name}</strong> ({blockingTarget.email})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBlockingTarget(null)}
                className="p-1.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-white">
                1. Select Reason Template:
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(blockingTarget.role === "VENDOR" ? VENDOR_BLOCK_TEMPLATES : USER_BLOCK_TEMPLATES).map(
                  (tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleTemplateSelect(tpl)}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "border-red-500 bg-red-950/40 text-white shadow-md shadow-red-950/50"
                            : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-base shrink-0">{tpl.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{tpl.label}</p>
                          <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5">{tpl.message || "Custom explanation"}</p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Reason Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white">
                2. Reason Summary / Title:
              </label>
              <input
                type="text"
                value={blockReasonTitle}
                onChange={(e) => setBlockReasonTitle(e.target.value)}
                placeholder="e.g. Policy & Standards Violation"
                className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 font-semibold"
              />
            </div>

            {/* Custom Message to Blocked User / Vendor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white">
                  3. Detailed Message (Visible to {blockingTarget.role === "VENDOR" ? "Vendor" : "User"}):
                </label>
                <span className="text-[10px] text-white/40">Visible on Dashboard &amp; Login</span>
              </div>
              <textarea
                rows={3}
                value={blockCustomMessage}
                onChange={(e) => setBlockCustomMessage(e.target.value)}
                placeholder="Write specific details explaining why the account is suspended and how they can appeal..."
                className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 leading-relaxed"
              />
            </div>

            {/* Warning Info */}
            <div className="rounded-xl border border-red-500/20 bg-red-950/25 p-3 text-[11px] text-red-300/90 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                Blocking will disable active vehicle bookings and fleet operations for this account. They will see this exact message when logging in or viewing their dashboard.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setBlockingTarget(null)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeBlockWithReason()}
                disabled={submittingBlock}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {submittingBlock ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Blocking...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Confirm &amp; Block Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          APPEAL VIEWER MODAL
         ───────────────────────────────────────────────────────────────────────── */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e13] p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Account Appeal Review</p>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Dispute Statement - {selectedAppeal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="p-1.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Submitted Statement</p>
              <div className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-white/90 leading-relaxed min-h-[90px] italic">
                "{selectedAppeal.appealText}"
              </div>
            </div>

            <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-3 text-[11px] text-red-300 leading-relaxed">
              ⚠️ Note: This account has been blocked <strong>{selectedAppeal.blockCount}</strong> times.
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                onClick={() => setSelectedAppeal(null)}
                className="rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 px-5 py-2 cursor-pointer transition"
              >
                Keep Blocked
              </button>
              <button
                onClick={() => {
                  void executeUnblock(selectedAppeal);
                  setSelectedAppeal(null);
                }}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold px-5 py-2 cursor-pointer transition shadow-md shadow-emerald-600/30"
              >
                Approve &amp; Unblock Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
