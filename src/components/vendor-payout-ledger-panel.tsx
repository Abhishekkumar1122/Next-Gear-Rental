"use client";

import { useEffect, useState } from "react";
import type { VendorPayoutRecord } from "@/lib/vendor-payout-service";

interface VendorPayoutLedgerPanelProps {
  vendor: {
    id: string;
    businessName: string;
    commissionRate: number;
  };
  grossRevenueINR: number;
  totalEarningsINR: number;
}

export function VendorPayoutLedgerPanel({ vendor, grossRevenueINR, totalEarningsINR }: VendorPayoutLedgerPanelProps) {
  const [payouts, setPayouts] = useState<VendorPayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const [viewingInvoiceHtml, setViewingInvoiceHtml] = useState<string | null>(null);

  const commissionAmount = Math.round((grossRevenueINR * (vendor.commissionRate || 15)) / 100);
  const netAvailableINR = Math.max(0, grossRevenueINR - commissionAmount);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/payouts?vendorId=${vendor.id}`);
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts ?? []);
      }
    } catch (e) {
      console.error("Failed to load vendor payouts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayouts();
  }, [vendor.id]);

  const handleRequestPayout = async () => {
    if (netAvailableINR <= 0) {
      setMessage("No net balance available for payout at this time.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setRequesting(true);
    setMessage("");

    try {
      const res = await fetch("/api/vendor/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          vendorName: vendor.businessName,
          grossRevenueINR,
          commissionRate: vendor.commissionRate || 15,
        }),
      });

      if (res.ok) {
        setMessage("🎉 Payout request submitted! Funds will be credited to your bank account via IMPS.");
        void fetchPayouts();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage("Failed to submit payout request.");
      }
    } catch (err) {
      setMessage("Error processing payout request.");
    } finally {
      setRequesting(false);
    }
  };

  const openInvoiceReceipt = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/vendor/payouts?vendorId=${vendor.id}&payoutId=${payoutId}&format=html`);
      if (res.ok) {
        const html = await res.text();
        setViewingInvoiceHtml(html);
      }
    } catch (e) {
      console.error("Failed to fetch GST invoice:", e);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* 3 Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Gross Revenue Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 relative overflow-hidden shadow-lg">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 block">Total Gross Revenue</span>
          <p className="mt-2 text-2xl font-black text-white">₹{grossRevenueINR.toLocaleString()}</p>
          <span className="text-[10px] text-white/40 mt-1 block">Total customer bookings collected</span>
        </div>

        {/* Admin Commission Card */}
        <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-5 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">Platform Fee Share</span>
            <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-300 font-extrabold px-2 py-0.5 rounded-full">
              {vendor.commissionRate || 15}% RATE
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-red-400">- ₹{commissionAmount.toLocaleString()}</p>
          <span className="text-[10px] text-red-300/60 mt-1 block">Next Gear platform commission</span>
        </div>

        {/* Net Vendor Balance Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-black to-emerald-950/20 p-5 relative overflow-hidden shadow-xl shadow-emerald-950/40">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">Net Available Payout</span>
          <p className="mt-2 text-2xl font-black text-emerald-300">₹{netAvailableINR.toLocaleString()}</p>
          
          <button
            onClick={() => void handleRequestPayout()}
            disabled={requesting || netAvailableINR <= 0}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold px-4 py-2.5 text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <span>💸</span>
            <span>{requesting ? "Processing..." : "Request Instant IMPS Payout"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-300 animate-[fade-in_0.2s_ease-out]">
          {message}
        </div>
      )}

      {/* Settlement History Ledger Table */}
      <div className="rounded-3xl border border-white/10 bg-[#0c0c0e] p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
              <span className="text-emerald-400">🛡️</span> Payout & GST Tax Settlement Ledger
            </h3>
            <p className="text-[11px] text-white/50 mt-0.5">Automated bank IMPS transfers & downloadable monthly GST tax invoices.</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white/70">
            {payouts.length} Settlements
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-white/50">No payout settlements recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/50 uppercase tracking-wider font-extrabold">
                  <th className="px-4 py-3.5">Ref # / Date</th>
                  <th className="px-4 py-3.5">Settlement Period</th>
                  <th className="px-4 py-3.5 text-right">Gross Revenue</th>
                  <th className="px-4 py-3.5 text-right">Commission ({vendor.commissionRate || 15}%)</th>
                  <th className="px-4 py-3.5 text-right">Net Payout</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">GST Tax Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3.5 font-mono">
                      <p className="font-extrabold text-white">{item.id}</p>
                      <span className="text-[10px] text-white/40">{new Date(item.requestedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white/80">{item.period}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-white">₹{item.grossRevenueINR.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-red-400">- ₹{item.commissionINR.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-400 text-sm">₹{item.netPayoutINR.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        item.status === "settled"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                          : item.status === "processing"
                          ? "bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse"
                          : "bg-slate-900 text-slate-400 border-white/10"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => void openInvoiceReceipt(item.id)}
                        className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        <span>📄</span>
                        <span>View GST Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GST INVOICE PREVIEW MODAL */}
      {viewingInvoiceHtml && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="w-full max-w-4xl h-[85vh] rounded-3xl border border-white/10 bg-[#0e0e12] p-4 flex flex-col shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2 px-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>📄</span> Official GST Settlement Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const win = window.open("", "_blank");
                    if (win) {
                      win.document.write(viewingInvoiceHtml);
                      win.document.close();
                      win.print();
                    }
                  }}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-1.5 text-xs transition cursor-pointer"
                >
                  🖨️ Print / Download PDF
                </button>
                <button
                  onClick={() => setViewingInvoiceHtml(null)}
                  className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold p-1.5 text-xs transition cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <iframe
              srcDoc={viewingInvoiceHtml}
              className="w-full flex-1 rounded-2xl border border-white/10 bg-black"
              title="GST Settlement Invoice"
            />
          </div>
        </div>
      )}
    </div>
  );
}
