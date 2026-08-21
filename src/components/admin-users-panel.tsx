"use client";

import { useEffect, useState, useMemo } from "react";
import { getVipTierBadge, type VipTier } from "@/lib/user-tiers";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "VENDOR" | "ADMIN";
  kycStatus: "pending" | "approved" | "rejected" | "none" | "blacklisted";
  blockCount: number;
  appealText?: string;
  vipTier?: VipTier;
  commissionRate?: number;
  createdAt: string;
};

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

  // Modal edit states
  const [modalVipTier, setModalVipTier] = useState<VipTier>("BRONZE");
  const [modalCommissionRate, setModalCommissionRate] = useState<number>(15);
  const [savingModal, setSavingModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${roleFilter}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [roleFilter]);

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
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedDetailUser.id
              ? {
                  ...u,
                  vipTier: modalVipTier,
                  commissionRate: selectedDetailUser.role === "VENDOR" ? modalCommissionRate : u.commissionRate,
                }
              : u
          )
        );
        setMessage(
          `Successfully updated ${selectedDetailUser.name}'s account settings!`
        );
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

  const toggleBlockStatus = async (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUpdatingId(user.id);
    setMessage("");
    const isBlocked = user.kycStatus === "blacklisted";
    const nextStatus = isBlocked ? "approved" : "blacklisted";

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === user.id) {
              return {
                ...u,
                kycStatus: nextStatus,
                blockCount: isBlocked ? u.blockCount : u.blockCount + 1,
                appealText: isBlocked ? undefined : u.appealText,
              };
            }
            return u;
          })
        );
        setMessage(
          `${user.role === "VENDOR" ? "Vendor" : "Customer"} ${user.name} successfully ${
            isBlocked ? "unblocked" : "blocked"
          }.`
        );
      } else {
        setMessage(`Failed to update ${user.role === "VENDOR" ? "vendor" : "user"} block status.`);
      }
    } catch (err) {
      console.error("Failed to toggle block status:", err);
      setMessage("Error sending account status update.");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (!query) return true;
      return u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
    });
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      users: users.filter((u) => u.role === "USER").length,
      vendors: users.filter((u) => u.role === "VENDOR").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
    };
  }, [users]);

  const getRoleColor = (role: UserRecord["role"]) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-950 text-purple-400 border border-purple-800/30";
      case "VENDOR":
        return "bg-blue-950 text-blue-400 border border-blue-800/30";
      default:
        return "bg-slate-950 text-slate-400 border border-slate-800/30";
    }
  };

  const getKycColor = (status: UserRecord["kycStatus"]) => {
    switch (status) {
      case "approved":
        return "text-emerald-400 font-bold";
      case "rejected":
        return "text-red-400 font-bold";
      case "pending":
        return "text-amber-400 font-bold";
      case "blacklisted":
        return "text-red-500 font-extrabold uppercase line-through";
      default:
        return "text-white/40";
    }
  };

  return (
    <div className="space-y-5 text-white">
      {/* Overview Stat Widgets */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 text-center">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Total Registered</p>
          <p className="mt-1 text-xl font-black text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Customers</p>
          <p className="mt-1 text-xl font-black text-white/90">{stats.users}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Vendors</p>
          <p className="mt-1 text-xl font-black text-cyan-400">{stats.vendors}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[9px] uppercase font-bold tracking-wider text-white/40">Administrators</p>
          <p className="mt-1 text-xl font-black text-[var(--brand-red)]">{stats.admins}</p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-[var(--brand-red-soft)]">
          {message}
        </div>
      )}

      {/* Filter Options */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_180px_auto] text-xs">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email address..."
          className="rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)]"
        />
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full text-left rounded-xl border border-white/5 bg-[#121212] px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-red)] flex justify-between items-center gap-2 cursor-pointer min-w-[180px]"
          >
            <span>
              {roleFilter === "all" && "All System Roles"}
              {roleFilter === "USER" && "Customer"}
              {roleFilter === "VENDOR" && "Vendor"}
              {roleFilter === "ADMIN" && "Administrator"}
            </span>
            <span className="text-[9px] text-white/35">▼</span>
          </button>
          {roleDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setRoleDropdownOpen(false)} />
              <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-white/5 bg-[#121212] p-1.5 shadow-2xl z-40 space-y-0.5">
                {[
                  { id: "all", label: "All System Roles" },
                  { id: "USER", label: "Customer" },
                  { id: "VENDOR", label: "Vendor" },
                  { id: "ADMIN", label: "Administrator" },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setRoleFilter(opt.id as any);
                      setRoleDropdownOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                      roleFilter === opt.id
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
        <button
          onClick={fetchUsers}
          className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2.5 font-bold uppercase tracking-wider text-white transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* User Records Table */}
      <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Accounts Ledger</h3>
            <p className="text-[10px] text-white/35 mt-0.5">💡 Tap any row to view full profile details, assign Gold/Silver VIP Tiers, or edit Vendor Commission Rates!</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/70">
            {filtered.length} Accounts
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">No matching accounts found.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-white/50 uppercase tracking-wider font-extrabold">
                  <th className="px-4 py-3.5">User Identity & VIP Tier</th>
                  <th className="px-4 py-3.5">Email Address</th>
                  <th className="px-4 py-3.5 text-center">System Role</th>
                  <th className="px-4 py-3.5 text-center">KYC Validation</th>
                  <th className="px-4 py-3.5 text-right">Join Date</th>
                  <th className="px-4 py-3.5 text-center">Action Controls</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isBlocked = user.kycStatus === "blacklisted";
                  const badge = getVipTierBadge(user.vipTier || "BRONZE");

                  return (
                    <tr
                      key={user.id}
                      onClick={() => openDetailModal(user)}
                      className="border-b border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-extrabold text-white">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="group-hover:text-[var(--brand-red-soft)] transition">{user.name || "N/A"}</p>
                              {user.role === "USER" && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${badge.className}`}>
                                  {badge.label}
                                </span>
                              )}
                              {user.role === "VENDOR" && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                  💼 {user.commissionRate ?? 15}% Comm
                                </span>
                              )}
                            </div>
                            {user.blockCount > 0 && (
                              <span className="text-[8px] font-black uppercase text-red-400 mt-0.5 tracking-wider bg-red-950/40 border border-red-900/20 px-1.5 py-0.5 rounded-md inline-block">
                                🚫 Blocked {user.blockCount} {user.blockCount === 1 ? "time" : "times"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-white/70 font-mono text-[11px]">{user.email}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center uppercase tracking-wider text-[9px] font-black">
                        <span className={getKycColor(user.kycStatus)}>
                          {user.kycStatus === "none" ? "N/A" : user.kycStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[10px] text-white/40 font-bold">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {user.role !== "ADMIN" ? (
                          <div className="flex justify-center items-center gap-1.5">
                            {user.appealText && (
                              <button
                                onClick={() => setSelectedAppeal(user)}
                                type="button"
                                className="rounded-lg bg-amber-950/60 border border-amber-900/30 text-amber-400 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider hover:bg-amber-900/50 transition cursor-pointer animate-pulse"
                              >
                                💬 Appeal
                              </button>
                            )}
                            <button
                              onClick={(e) => void toggleBlockStatus(user, e)}
                              disabled={updatingId === user.id}
                              className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-50 ${
                                isBlocked
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900/40"
                                  : "bg-red-950 text-red-400 border border-red-900/30 hover:bg-red-900/40"
                              }`}
                            >
                              {updatingId === user.id ? "..." : isBlocked ? "🔓 Unblock" : "🚫 Block"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-white/20 select-none">System Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* USER & VENDOR DETAIL & CONTROL POPUP MODAL */}
      {selectedDetailUser && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0e0e12] p-6 space-y-5 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-950 border border-red-500/40 flex items-center justify-center text-xl font-black text-white shadow-lg">
                  {selectedDetailUser.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{selectedDetailUser.name}</h3>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${getRoleColor(selectedDetailUser.role)}`}>
                      {selectedDetailUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-mono">{selectedDetailUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailUser(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Account Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[9px] font-bold text-white/40 uppercase block">Account ID</span>
                <span className="font-mono text-white text-[11px] truncate block">{selectedDetailUser.id}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[9px] font-bold text-white/40 uppercase block">KYC Status</span>
                <span className={`uppercase font-black text-[11px] ${getKycColor(selectedDetailUser.kycStatus)}`}>
                  {selectedDetailUser.kycStatus}
                </span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[9px] font-bold text-white/40 uppercase block">Joined On</span>
                <span className="font-bold text-white text-[11px]">
                  {new Date(selectedDetailUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* CUSTOMER TIER MANUALLY ASSIGN CONTROL */}
            {selectedDetailUser.role === "USER" && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-black to-amber-950/10 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    👑 Assign VIP Membership Tier
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    MANUAL OVERRIDE
                  </span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Select a VIP tier for this customer to grant custom booking discounts, cashback perks, and zero deposit privileges.
                </p>

                {/* Tier Selector Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as VipTier[]).map((tier) => {
                    const badge = getVipTierBadge(tier);
                    const isSelected = modalVipTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setModalVipTier(tier)}
                        className={`p-2.5 rounded-xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? `${badge.className} ring-2 ring-amber-400 scale-[1.02]`
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white/60"
                        }`}
                      >
                        <span className="text-xs font-extrabold">{badge.label}</span>
                        <span className="text-[8px] opacity-70 uppercase font-mono">
                          {tier === "GOLD" ? "10% Off" : tier === "PLATINUM" ? "VIP Rides" : tier === "SILVER" ? "5% Cash" : "Standard"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VENDOR COMMISSION RATE CONTROL */}
            {selectedDetailUser.role === "VENDOR" && (
              <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-black to-emerald-950/10 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    💼 Vendor Platform Commission Share (%)
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    MODERATOR CONTROL
                  </span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Set the percentage fee retained by Next Gear platform on each booking completed by this vendor.
                </p>

                {/* Stepper + Presets */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-1 bg-black/70 border border-emerald-500/40 rounded-xl p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setModalCommissionRate((prev) => Math.max(0, prev - 1))}
                      className="h-8 w-8 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer"
                    >
                      -
                    </button>
                    <div className="px-2 text-center flex items-center justify-center min-w-[54px]">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={modalCommissionRate}
                        onChange={(e) => setModalCommissionRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-10 bg-transparent text-center text-sm font-black text-emerald-400 focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-black text-emerald-400">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalCommissionRate((prev) => Math.min(100, prev + 1))}
                      className="h-8 w-8 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[10, 15, 18, 20, 25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setModalCommissionRate(rate)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
                          modalCommissionRate === rate
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 border border-emerald-400 font-extrabold"
                            : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={(e) => {
                  void toggleBlockStatus(selectedDetailUser, e);
                  setSelectedDetailUser(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition active:scale-95 cursor-pointer ${
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
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>

                {(selectedDetailUser.role === "USER" || selectedDetailUser.role === "VENDOR") && (
                  <button
                    onClick={() => void saveUserModalDetails()}
                    disabled={savingModal}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-red)] to-red-600 hover:from-red-600 hover:to-red-500 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {savingModal ? "Saving..." : "Save Account Settings ⚡"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Appeal Response Viewer Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">Account Appeal Review</p>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mt-0.5">
                  Dispute Response - {selectedAppeal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppeal(null)}
                type="button"
                className="rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold p-2 text-xs transition active:scale-95 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Submitted Statement</p>
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-white/90 leading-relaxed min-h-[100px] italic">
                "{selectedAppeal.appealText}"
              </div>
            </div>

            <div className="rounded-xl bg-red-950/20 border border-red-500/10 p-3 text-[9px] text-red-400/80 leading-relaxed">
              ⚠️ Note: This account has been blocked **{selectedAppeal.blockCount}** times. Please recheck documents compliance before restoring active fleet access.
            </div>

            <div className="flex gap-2 justify-end pt-2 text-[10px] font-black uppercase tracking-wider">
              <button
                onClick={() => setSelectedAppeal(null)}
                type="button"
                className="rounded-full border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 px-6 py-2.5 cursor-pointer transition"
              >
                Keep Blocked
              </button>
              <button
                onClick={() => {
                  void toggleBlockStatus(selectedAppeal);
                  setSelectedAppeal(null);
                }}
                type="button"
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-2.5 cursor-pointer transition font-bold"
              >
                Approve & Unblock Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
