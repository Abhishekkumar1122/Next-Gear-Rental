"use client";

import { AdminVendorApplicationsPanel } from "@/components/admin-vendor-applications-panel";
import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { useState, useEffect } from "react";

type ApprovalItem = {
  id: string;
  name: string;
  email: string;
  type: "user" | "vendor";
  status: "pending" | "approved" | "rejected" | "blacklisted";
  createdAt: string;
  kycDocPath?: string;
  blacklistReason?: string;
};

export default function AdminApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "blacklisted" | "all">("all");
  const [message, setMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "pending" || status === "approved" || status === "rejected" || status === "blacklisted" || status === "all") {
      setFilter(status);
    }
  }, []);

  async function fetchApprovals() {
    const status = filter === "all" ? undefined : filter;
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    const [usersRes, vendorsRes] = await Promise.all([
      fetch(`/api/admin/users?${params.toString()}`),
      fetch(`/api/admin/vendors?${params.toString()}`),
    ]);

    const users = await usersRes.json();
    const vendors = await vendorsRes.json();

    const userItems = (users.users || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      type: "user" as const,
      status: u.kycStatus,
      createdAt: u.createdAt,
      kycDocPath: u.kycDocPath,
    }));

    const vendorItems = (vendors.vendors || []).map((v: any) => ({
      id: v.id,
      name: v.businessName,
      email: v.adminEmail || "N/A",
      type: "vendor" as const,
      status: v.status,
      createdAt: v.createdAt,
      kycDocPath: v.kycDocPath,
      blacklistReason: v.reason,
    }));

    const merged = [...userItems, ...vendorItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(merged);
  }

  async function updateApproval(id: string, type: string, status: string, kycDocPath?: string, reason?: string) {
    const endpoint = type === "user" ? `/api/admin/users` : `/api/admin/vendors`;
    const bodyKey = type === "user" ? "userId" : "vendorId";

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [bodyKey]: id, status, kycDocPath, reason }),
    });

    if (res.ok) {
      setMessage(`${type} ${status} successfully!`);
      setSelectedItem(null);
      setTimeout(() => fetchApprovals(), 500);
    } else {
      setMessage("Failed to update approval status.");
    }
  }

  async function blockVendor(item: ApprovalItem) {
    if (item.type !== "vendor") return;
    const reasonInput = window.prompt("Reason for blocking this vendor:", "Violation of privacy policy");
    if (reasonInput === null) return;
    const reason = reasonInput.trim() || "Violation of privacy policy";
    await updateApproval(item.id, item.type, "blacklisted", item.kycDocPath, reason);
  }

  async function handleKYCUpload(item: ApprovalItem, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Mock file upload - in production, would upload to cloud storage
      const fileName = `kyc-${item.type}-${item.id}-${Date.now()}`;
      const docPath = `/uploads/kyc/${fileName}`;

      await updateApproval(item.id, item.type, item.status, docPath);
    } catch (error) {
      setMessage("Failed to upload KYC document.");
    } finally {
      setUploading(false);
    }
  }

  const filtered = filter === "all" ? items : items.filter((item) => item.status === filter);

  return (
    <PageShell title="Admin Approvals" subtitle="Manage user KYC and vendor verification">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/admin" className="w-full rounded-full border border-black/15 px-4 py-2 text-center text-sm font-semibold transition hover:bg-black/[0.02] sm:w-auto">
          ← Admin Dashboard
        </Link>
        <Link href="/dashboard/admin/support-tickets" className="w-full rounded-full border border-black/15 px-4 py-2 text-center text-sm font-semibold transition hover:bg-black/[0.02] sm:w-auto">
          Support Tickets
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["pending", "approved", "rejected", "blacklisted", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === status
                ? "bg-[var(--brand-red)] text-white"
                : "border border-black/10 hover:-translate-y-0.5"
            }`}
          >
            {status === "all" ? "All" : status === "blacklisted" ? "Blocked" : status.charAt(0).toUpperCase() + status.slice(1)} ({
              items.filter((i) => (status === "all" ? true : i.status === status)).length
            })
          </button>
        ))}
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          {message}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-black/10 bg-black/5 p-6 text-center text-sm text-black/60">
            No {filter === "all" ? "approvals" : filter} approvals to show.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.name}</p>
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium">
                      {item.type === "user" ? "Person" : "Vendor"}
                    </span>
                  </div>
                  <p className="text-sm text-black/70">{item.email}</p>
                  <p className="text-xs text-black/60 mt-1">
                    Applied: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.status === "pending" ? (
                    <div className="mt-3 text-xs">
                      <p className="font-semibold text-yellow-700 mb-2">KYC Document Required</p>
                      <label className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 cursor-pointer hover:bg-yellow-100 transition">
                        <span>📄 Upload Document</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleKYCUpload(item, e)}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : item.kycDocPath ? (
                    <p className="text-xs text-blue-600 mt-1">✓ KYC: {item.kycDocPath}</p>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <button
                    onClick={() => updateApproval(item.id, item.type, "approved", item.kycDocPath)}
                    disabled={uploading || item.status === "blacklisted" || (item.type === "user" && item.status !== "pending")}
                    className="w-full rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateApproval(item.id, item.type, "rejected")}
                    disabled={uploading || item.status === "blacklisted" || (item.type === "user" && item.status !== "pending")}
                    className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-1 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto"
                  >
                    Reject
                  </button>
                  {item.type === "vendor" && item.status === "blacklisted" ? (
                    <button
                      onClick={() => updateApproval(item.id, item.type, "approved", item.kycDocPath)}
                      disabled={uploading}
                      className="w-full rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto"
                    >
                      Remove Blacklist
                    </button>
                  ) : item.type === "vendor" ? (
                    <button
                      onClick={() => blockVendor(item)}
                      disabled={uploading}
                      className="w-full rounded-full border border-red-300 bg-red-50 px-4 py-1 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto"
                    >
                      Block Vendor
                    </button>
                  ) : null}
                </div>
              </div>
              {item.status !== "pending" && (
                <div className="mt-3 break-all rounded-lg border border-black/5 bg-black/[0.03] p-2 text-xs text-black/60">
                  Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
              )}
              {item.type === "vendor" && item.status === "blacklisted" ? (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  This vendor is blacklisted and cannot use vendor features until admin removes blacklist.
                  <div className="mt-1 font-medium text-red-800">
                    Reason: {item.blacklistReason || "Violation of privacy policy"}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-black/60">Vendor Onboarding</p>
        <h2 className="mt-1 text-lg font-semibold">KYC Checklist + Automation</h2>
        <p className="mt-1 text-sm text-black/70">
          Vendor registration applications are connected here as well. Complete KYC checklist and auto-generate login credentials.
        </p>
        <div className="mt-4">
          <AdminVendorApplicationsPanel />
        </div>
      </section>
    </PageShell>
  );
}
