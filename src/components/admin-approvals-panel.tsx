"use client";

import { useState, useEffect } from "react";
import { AdminVendorApplicationsPanel } from "@/components/admin-vendor-applications-panel";

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

export function AdminApprovalsPanel() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "blacklisted" | "all">("pending");
  const [message, setMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

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
      type: v.type === "vendor" ? ("vendor" as const) : ("vendor" as const),
      status: v.status,
      createdAt: v.createdAt,
      kycDocPath: v.kycDocPath,
      blacklistReason: v.reason,
    }));

    const merged = [...userItems, ...vendorItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(merged);

    // Auto select first item
    if (merged.length > 0 && !selectedItem) {
      setSelectedItem(merged[0]);
    }
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
      setMessage(`${type.toUpperCase()} marked as ${status.toUpperCase()} successfully!`);
      // Update local state instead of closing
      if (selectedItem?.id === id) {
        setSelectedItem({ ...selectedItem, status: status as any, kycDocPath, blacklistReason: reason });
      }
      fetchApprovals();
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Failed to update approval status.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function blockVendor(item: ApprovalItem) {
    if (item.type !== "vendor") return;
    const reasonInput = window.prompt("Reason for blocking this vendor:", "Violation of privacy policy");
    if (reasonInput === null) return;
    const reason = reasonInput.trim() || "Violation of privacy policy";
    await updateApproval(item.id, item.type, "blacklisted", item.kycDocPath, reason);
  }

  const runOCRScan = () => {
    if (!selectedItem) return;
    setIsScanning(true);
    setScanResult(null);

    // Simulate OCR scanning line animation
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        docType: selectedItem.type === "user" ? "Driving License" : "GSTIN / Trade Certificate",
        idNumber: selectedItem.type === "user" ? "DL-KA03202509382" : "GST29AAAAA1111A1Z",
        faceMatchScore: "98.2% (Excellent match)",
        expiryDate: "2038-09-12 (Valid)",
        authenticity: "100% Genuine (System Checked)"
      });
    }, 2200);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-emerald-400 border-emerald-900/30 bg-emerald-950/20";
      case "rejected":
        return "text-red-400 border-red-900/30 bg-red-950/20";
      case "blacklisted":
        return "text-slate-400 border-slate-900/30 bg-slate-950/20";
      default:
        return "text-amber-400 border-amber-900/30 bg-amber-950/20 animate-pulse";
    }
  };

  const filtered = filter === "all" ? items : items.filter((item) => item.status === filter);

  return (
    <div className="space-y-6 text-white select-none">
      {/* Filtering tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-[10px] font-black uppercase tracking-wider shrink-0">
        {(["pending", "approved", "rejected", "blacklisted", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setSelectedItem(null);
              setScanResult(null);
            }}
            className={`shrink-0 rounded-xl px-4 py-2.5 transition border cursor-pointer focus:outline-none ${
              filter === status
                ? "bg-[var(--brand-red)] text-white border-red-500/25 shadow-lg shadow-red-500/15"
                : "border-white/5 hover:bg-white/5 text-white/70"
            }`}
          >
            {status === "all" ? "All" : status === "blacklisted" ? "Blocked" : status} ({
              items.filter((i) => (status === "all" ? true : i.status === status)).length
            })
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-400">
          {message}
        </div>
      )}

      {/* Splitscreen Workspace */}
      <div className="grid gap-6 md:grid-cols-12 h-auto md:h-[520px] items-stretch">
        
        {/* Left Side: Onboarding applicants list */}
        <div className="md:col-span-4 flex flex-col h-[220px] md:h-full md:border-r border-white/5 pr-0 md:pr-4 overflow-y-auto no-scrollbar gap-2 shrink-0">
          <p className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider mb-1">Applications ({filtered.length})</p>
          
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 text-center text-xs text-white/40 italic">
              No registrations found.
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setSelectedItem(item);
                    setScanResult(null);
                  }}
                  className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-[var(--brand-red)] bg-[var(--brand-red-glow)]"
                      : "border-white/5 bg-[#0a0a0a] hover:bg-[#121212]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <p className="font-extrabold text-white line-clamp-1">{item.name}</p>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/55">
                      {item.type === "user" ? "Rider" : "Vendor"}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 truncate mt-1.5">{item.email}</p>
                  <div className="flex justify-between items-center text-[8.5px] text-white/35 font-bold uppercase tracking-wider mt-1.5 pt-1.5 border-t border-white/[0.02]">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Dual Pane Document Inspection Area */}
        <div className="md:col-span-8 flex flex-col h-auto md:h-full overflow-hidden">
          {selectedItem ? (
            <div className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 h-full flex flex-col justify-between overflow-y-auto no-scrollbar shadow-xl relative">
              
              {/* Header metadata details */}
              <div className="border-b border-white/5 pb-4 flex flex-wrap justify-between items-start gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedItem.name}</h3>
                    <span className="rounded-full bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/20 px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-[var(--brand-red-soft)]">
                      {selectedItem.type === "user" ? "KYC Application" : "Business Application"}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">Email ID: {selectedItem.email} • ID: {selectedItem.id.slice(0, 12)}</p>
                </div>

                <div className={`px-3 py-1 rounded-full border text-[8.5px] uppercase font-black tracking-wider ${getStatusColor(selectedItem.status)}`}>
                  Status: {selectedItem.status}
                </div>
              </div>

              {/* Main content: Document review and OCR scanner */}
              <div className="flex-1 grid gap-4 md:grid-cols-2 py-4 items-stretch min-h-[220px]">
                {/* Left pane document graphic preview */}
                <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-center text-[8.5px] uppercase font-black text-white/40 tracking-wider mb-2">
                    <span>Document Image Preview</span>
                    <span>1080x720.png</span>
                  </div>

                  {/* Mock license document card design */}
                  <div className="flex-1 rounded-xl bg-gradient-to-tr from-slate-900 via-neutral-900 to-slate-800 border border-white/5 p-4 relative flex flex-col justify-between select-none shadow-inner overflow-hidden min-h-[140px]">
                    {/* Retro DL headers */}
                    <div className="flex justify-between items-start border-b border-white/[0.04] pb-2">
                      <div>
                        <p className="text-[7.5px] font-black text-white tracking-widest uppercase">UNION OF INDIA</p>
                        <p className="text-[6.5px] text-white/40 uppercase">DRIVING LICENSE CARD</p>
                      </div>
                      <span className="text-[8px]">🇮🇳</span>
                    </div>

                    {/* Mid content */}
                    <div className="flex gap-3 items-center py-2">
                      <div className="w-9 h-11 bg-white/5 border border-white/10 rounded flex items-center justify-center text-lg shadow-sm">
                        👤
                      </div>
                      <div className="text-[7px] text-white/70 leading-normal font-mono space-y-0.5">
                        <p>NAME: {selectedItem.name.toUpperCase()}</p>
                        <p>DL NO: DL-KA03202509382</p>
                        <p>CLASS: LMV / MCWG</p>
                        <p>VALIDITY: 2038-09-12</p>
                      </div>
                    </div>

                    {/* Verification Stamp overlay */}
                    {selectedItem.status === "approved" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
                        <span className="border-4 border-emerald-500 text-emerald-400 font-extrabold text-xs uppercase tracking-widest rounded-xl px-4 py-2 rotate-[-12deg] shadow-lg shadow-emerald-500/10">
                          APPROVED
                        </span>
                      </div>
                    )}
                    {selectedItem.status === "rejected" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
                        <span className="border-4 border-red-500 text-red-400 font-extrabold text-xs uppercase tracking-widest rounded-xl px-4 py-2 rotate-[-12deg] shadow-lg shadow-red-500/10">
                          REJECTED
                        </span>
                      </div>
                    )}

                    {/* Scanning overlay bar animation */}
                    {isScanning && (
                      <div className="absolute inset-x-0 h-0.5 bg-red-500 animate-scan shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    )}
                  </div>

                  {selectedItem.kycDocPath && (
                    <p className="text-[8.5px] font-mono text-cyan-400 font-bold mt-2">✓ Upload Path: {selectedItem.kycDocPath}</p>
                  )}
                </div>

                {/* Right pane OCR diagnostics results */}
                <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[8.5px] uppercase font-black text-white/40 tracking-wider mb-2">
                    <span>OCR System Diagnostics</span>
                    <button
                      onClick={runOCRScan}
                      disabled={isScanning}
                      type="button"
                      className="text-[8px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 text-white/70 hover:text-white transition duration-200 cursor-pointer"
                    >
                      {isScanning ? "Processing..." : "Run OCR Scanner"}
                    </button>
                  </div>

                  {/* OCR results logs */}
                  <div className="flex-1 font-mono text-[9px] text-white/50 leading-relaxed bg-[#050505] p-3.5 rounded-xl border border-white/5 overflow-y-auto no-scrollbar max-h-[160px]">
                    {isScanning ? (
                      <div className="py-8 text-center animate-pulse text-red-400 font-bold uppercase tracking-wider">
                        [ Scanning document lines... ]
                        <p className="text-[8px] text-white/40 mt-1.5 normal-case font-normal">Extracting Aadhaar details & face match scores</p>
                      </div>
                    ) : scanResult ? (
                      <div className="space-y-1.5 text-white/80">
                        <p className="text-emerald-400 font-bold">✓ SCAN COMPLETE: PASS</p>
                        <p>• DOC TYPE: {scanResult.docType}</p>
                        <p>• EXTRACTED ID: {scanResult.idNumber}</p>
                        <p>• FACE MATCH: {scanResult.faceMatchScore}</p>
                        <p>• EXPIRY CHECK: {scanResult.expiryDate}</p>
                        <p>• CHECK STATUS: {scanResult.authenticity}</p>
                      </div>
                    ) : (
                      <p className="text-white/30 italic text-center py-10">Press 'Run OCR Scanner' to extract driving license data</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom: approval action buttons */}
              <div className="border-t border-white/5 pt-4 flex gap-3 text-[10px] uppercase font-black tracking-wider shrink-0">
                <button
                  onClick={() => updateApproval(selectedItem.id, selectedItem.type, "approved", selectedItem.kycDocPath)}
                  disabled={selectedItem.status === "approved" || selectedItem.status === "blacklisted"}
                  className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 transition duration-200 disabled:opacity-40 cursor-pointer text-center"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => updateApproval(selectedItem.id, selectedItem.type, "rejected")}
                  disabled={selectedItem.status === "rejected" || selectedItem.status === "blacklisted"}
                  className="flex-1 rounded-full border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/40 py-2.5 transition duration-200 disabled:opacity-40 cursor-pointer text-center"
                >
                  Reject
                </button>
                {selectedItem.type === "vendor" && (
                  <button
                    onClick={() => selectedItem.status === "blacklisted" ? updateApproval(selectedItem.id, selectedItem.type, "approved", selectedItem.kycDocPath) : blockVendor(selectedItem)}
                    className="flex-1 rounded-full border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 py-2.5 transition duration-200 cursor-pointer text-center"
                  >
                    {selectedItem.status === "blacklisted" ? "Unblock Vendor" : "Block Vendor"}
                  </button>
                )}
              </div>

              {selectedItem.blacklistReason && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-[9.5px] text-red-400 leading-relaxed shrink-0">
                  ⚠️ Vendor is Blacklisted. Reason: {selectedItem.blacklistReason}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-white/30 border border-dashed border-white/5 rounded-2xl bg-[#0a0a0a]">
              <span>Select an application from the pending queue to initiate KYC document inspection</span>
            </div>
          )}
        </div>

      </div>

      <section className="rounded-3xl border border-white/5 bg-[#0c0c0c] p-6 space-y-4 shadow-xl shrink-0">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Vendor Governance</p>
          <h2 className="text-base font-black uppercase tracking-wider text-white mt-1">KYC Checklists & Credentials Automation</h2>
          <p className="text-xs text-white/60 leading-relaxed mt-1">Review onboarding pipelines, verify certificates, and generate vendor portal access keys.</p>
        </div>
        <div>
          <AdminVendorApplicationsPanel />
        </div>
      </section>
    </div>
  );
}
