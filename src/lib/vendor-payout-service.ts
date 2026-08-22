import { dispatchAlert, dispatchHtmlEmail } from "@/lib/alert-dispatch";
import { wrapInMasterEmailTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

export type PayoutStatus = "pending" | "processing" | "settled" | "failed";

export type VendorPayoutRecord = {
  id: string;
  vendorId: string;
  vendorName: string;
  period: string;
  grossRevenueINR: number;
  commissionRate: number;
  commissionINR: number;
  gstOnCommissionINR: number;
  netPayoutINR: number;
  status: PayoutStatus;
  bankAccountMasked: string;
  upiIdMasked: string;
  settlementTxnRef?: string;
  settledAt?: string;
  requestedAt: string;
};

// Fallback in-memory store for mock development mode
const payoutRecords: VendorPayoutRecord[] = [
  {
    id: "SETTLE-9901",
    vendorId: "v1",
    vendorName: "Metro Wheels Fleet",
    period: "Aug 15 - Aug 21, 2026",
    grossRevenueINR: 42000,
    commissionRate: 15,
    commissionINR: 6300,
    gstOnCommissionINR: 1134,
    netPayoutINR: 35700,
    status: "settled",
    bankAccountMasked: "HDFC Bank (•••• 4829)",
    upiIdMasked: "metrowheels@okhdfcbank",
    settlementTxnRef: "IMPS/623910283741/SETTLE",
    settledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "SETTLE-9902",
    vendorId: "v1",
    vendorName: "Metro Wheels Fleet",
    period: "Aug 01 - Aug 14, 2026",
    grossRevenueINR: 88500,
    commissionRate: 15,
    commissionINR: 13275,
    gstOnCommissionINR: 2389.5,
    netPayoutINR: 75225,
    status: "settled",
    bankAccountMasked: "HDFC Bank (•••• 4829)",
    upiIdMasked: "metrowheels@okhdfcbank",
    settlementTxnRef: "IMPS/623901198822/SETTLE",
    settledAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let hasEnsuredPayoutTable = false;

async function ensurePayoutTable() {
  if (!process.env.DATABASE_URL || hasEnsuredPayoutTable) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VendorPayout" (
        "id" TEXT PRIMARY KEY,
        "vendorId" TEXT NOT NULL,
        "vendorName" TEXT NOT NULL,
        "period" TEXT NOT NULL,
        "grossRevenueINR" INTEGER NOT NULL,
        "commissionRate" INTEGER NOT NULL,
        "commissionINR" INTEGER NOT NULL,
        "gstOnCommissionINR" DOUBLE PRECISION NOT NULL,
        "netPayoutINR" INTEGER NOT NULL,
        "status" TEXT NOT NULL,
        "bankAccountMasked" TEXT NOT NULL,
        "upiIdMasked" TEXT NOT NULL,
        "settlementTxnRef" TEXT,
        "settledAt" TIMESTAMP(3),
        "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "VendorPayout_vendor_idx"
      ON "VendorPayout"("vendorId", "requestedAt" DESC)
    `);

    hasEnsuredPayoutTable = true;
  } catch (err) {
    console.error("Failed to automatically provision VendorPayout table:", err);
  }
}

export async function getVendorPayouts(vendorId: string): Promise<VendorPayoutRecord[]> {
  if (!process.env.DATABASE_URL) {
    return payoutRecords.filter((r) => r.vendorId === vendorId || vendorId === "all");
  }

  try {
    const query = vendorId === "all"
      ? `SELECT * FROM "VendorPayout" ORDER BY "requestedAt" DESC`
      : `SELECT * FROM "VendorPayout" WHERE "vendorId" = $1 ORDER BY "requestedAt" DESC`;
    
    const rows = vendorId === "all"
      ? await prisma.$queryRawUnsafe<any[]>(query)
      : await prisma.$queryRawUnsafe<any[]>(query, vendorId);

    return rows.map((row) => ({
      id: row.id,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      period: row.period,
      grossRevenueINR: Number(row.grossRevenueINR),
      commissionRate: Number(row.commissionRate),
      commissionINR: Number(row.commissionINR),
      gstOnCommissionINR: Number(row.gstOnCommissionINR),
      netPayoutINR: Number(row.netPayoutINR),
      status: row.status as PayoutStatus,
      bankAccountMasked: row.bankAccountMasked,
      upiIdMasked: row.upiIdMasked,
      settlementTxnRef: row.settlementTxnRef || undefined,
      settledAt: row.settledAt ? new Date(row.settledAt).toISOString() : undefined,
      requestedAt: new Date(row.requestedAt).toISOString(),
    }));
  } catch (err) {
    console.error("Failed to query VendorPayouts, falling back to mock:", err);
    return payoutRecords.filter((r) => r.vendorId === vendorId || vendorId === "all");
  }
}

export async function requestVendorPayout(input: {
  vendorId: string;
  vendorName: string;
  grossRevenueINR: number;
  commissionRate: number;
  bankAccountMasked?: string;
  upiIdMasked?: string;
}): Promise<VendorPayoutRecord> {
  const commissionINR = Math.round((input.grossRevenueINR * input.commissionRate) / 100);
  const gstOnCommissionINR = Math.round(commissionINR * 0.18);
  const netPayoutINR = input.grossRevenueINR - commissionINR;

  const newRecord: VendorPayoutRecord = {
    id: `SETTLE-${Math.floor(1000 + Math.random() * 9000)}`,
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    period: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")} - ${new Date().toLocaleDateString("en-IN")}`,
    grossRevenueINR: input.grossRevenueINR,
    commissionRate: input.commissionRate,
    commissionINR,
    gstOnCommissionINR,
    netPayoutINR,
    status: "processing",
    bankAccountMasked: input.bankAccountMasked || "HDFC Bank (•••• 4829)",
    upiIdMasked: input.upiIdMasked || "vendor@upi",
    requestedAt: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    payoutRecords.unshift(newRecord);
    return newRecord;
  }

  await ensurePayoutTable();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "VendorPayout" (
        "id", "vendorId", "vendorName", "period", "grossRevenueINR", "commissionRate", 
        "commissionINR", "gstOnCommissionINR", "netPayoutINR", "status", 
        "bankAccountMasked", "upiIdMasked", "requestedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      newRecord.id,
      newRecord.vendorId,
      newRecord.vendorName,
      newRecord.period,
      newRecord.grossRevenueINR,
      newRecord.commissionRate,
      newRecord.commissionINR,
      newRecord.gstOnCommissionINR,
      newRecord.netPayoutINR,
      newRecord.status,
      newRecord.bankAccountMasked,
      newRecord.upiIdMasked
    );
  } catch (err) {
    console.error("Failed to insert VendorPayout, storing in mock memory:", err);
    payoutRecords.unshift(newRecord);
  }

  return newRecord;
}

export async function approveVendorPayout(payoutId: string, txnRef?: string, vendorEmail?: string, vendorPhone?: string) {
  let record: VendorPayoutRecord | null = null;

  if (!process.env.DATABASE_URL) {
    const r = payoutRecords.find((r) => r.id === payoutId);
    if (r) {
      r.status = "settled";
      r.settlementTxnRef = txnRef || `IMPS/${Date.now()}/SETTLE`;
      r.settledAt = new Date().toISOString();
      record = r;
    }
  } else {
    await ensurePayoutTable();
    try {
      const finalTxnRef = txnRef || `IMPS/${Date.now()}/SETTLE`;
      const settledAt = new Date();
      await prisma.$executeRawUnsafe(
        `UPDATE "VendorPayout"
         SET "status" = 'settled', "settlementTxnRef" = $1, "settledAt" = $2
         WHERE "id" = $3`,
        finalTxnRef,
        settledAt,
        payoutId
      );

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "VendorPayout" WHERE "id" = $1`,
        payoutId
      );
      if (rows && rows.length > 0) {
        const row = rows[0];
        record = {
          id: row.id,
          vendorId: row.vendorId,
          vendorName: row.vendorName,
          period: row.period,
          grossRevenueINR: Number(row.grossRevenueINR),
          commissionRate: Number(row.commissionRate),
          commissionINR: Number(row.commissionINR),
          gstOnCommissionINR: Number(row.gstOnCommissionINR),
          netPayoutINR: Number(row.netPayoutINR),
          status: row.status as PayoutStatus,
          bankAccountMasked: row.bankAccountMasked,
          upiIdMasked: row.upiIdMasked,
          settlementTxnRef: row.settlementTxnRef || undefined,
          settledAt: row.settledAt ? new Date(row.settledAt).toISOString() : undefined,
          requestedAt: new Date(row.requestedAt).toISOString(),
        };
      }
    } catch (err) {
      console.error("Failed to approve VendorPayout in DB:", err);
    }
  }

  if (!record) return null;

  // Send Email & WhatsApp Payout Confirmation
  if (vendorEmail) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #f4f4f5; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 999px; text-transform: uppercase;">
            ✅ PAYOUT SETTLED SUCCESSFULLY
          </span>
        </div>

        <h2 style="color: #ffffff; text-align: center; font-size: 20px; font-weight: 900; margin-top: 0;">
          ₹${record.netPayoutINR.toLocaleString()} Transferred to Your Account!
        </h2>
        <p style="color: #a1a1aa; text-align: center; font-size: 13px; margin-bottom: 24px;">
          Your payout request <strong>#${record.id}</strong> for ${record.vendorName} has been processed and credited via IMPS/UPI.
        </p>

        <!-- Settlement Receipt Box -->
        <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">Gross Revenue:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">₹${record.grossRevenueINR.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">Platform Commission (${record.commissionRate}%):</td>
              <td style="padding: 6px 0; color: #ef4444; font-weight: 700; text-align: right;">- ₹${record.commissionINR.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">GST on Commission (18%):</td>
              <td style="padding: 6px 0; color: #a1a1aa; text-align: right;">₹${record.gstOnCommissionINR.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #10b981; font-weight: 900; font-size: 15px;">NET SETTLED AMOUNT:</td>
              <td style="padding: 10px 0; color: #10b981; font-weight: 900; font-size: 16px; text-align: right;">₹${record.netPayoutINR.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; font-size: 12px; color: #a1a1aa;">
          <p style="margin: 0;"><strong>Bank Account:</strong> ${record.bankAccountMasked}</p>
          <p style="margin: 4px 0 0 0;"><strong>Transaction Ref:</strong> <span style="font-family: monospace; color: #ffffff;">${record.settlementTxnRef}</span></p>
        </div>
      </div>
    `;

    const fullHtml = wrapInMasterEmailTemplate({
      title: `Payout Settled — ₹${record.netPayoutINR.toLocaleString()}`,
      preheader: `Your Next Gear Vendor payout #${record.id} has been credited to your bank account.`,
      contentHtml: htmlContent,
    });

    void dispatchHtmlEmail({
      to: vendorEmail,
      subject: `💸 Payout Settled: ₹${record.netPayoutINR.toLocaleString()} Credited [Next Gear]`,
      html: fullHtml,
    });
  }

  if (vendorPhone) {
    void dispatchAlert({
      channel: "whatsapp",
      to: vendorPhone,
      message: `💸 *PAYOUT SETTLED — NEXT GEAR*

Vendor: *${record.vendorName}*
Net Amount Credited: *₹${record.netPayoutINR.toLocaleString()}*
Bank Account: ${record.bankAccountMasked}
Transaction Ref: ${record.settlementTxnRef}

Thank you for being a valued Next Gear Fleet Partner!`,
    });
  }

  return record;
}

export function generateGstTaxInvoiceHtml(record: VendorPayoutRecord): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>GST Settlement Invoice - ${record.id}</title>
      <style>
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 40px; }
        .invoice-card { max-width: 750px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 20px; padding: 36px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #27272a; padding-bottom: 24px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #e10600; letter-spacing: 0.1em; text-transform: uppercase; }
        .badge { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; }
        .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 28px; font-size: 13px; }
        .info-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px; }
        th { text-align: left; padding: 12px; background: rgba(255,255,255,0.05); color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 14px 12px; border-bottom: 1px solid #27272a; color: #f4f4f5; }
        .total-row td { font-weight: 900; font-size: 16px; color: #10b981; border-top: 2px solid #27272a; border-bottom: none; }
        .footer { text-align: center; font-size: 11px; color: #71717a; margin-top: 28px; border-top: 1px solid #27272a; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="logo">NEXT GEAR</div>
            <p style="font-size: 11px; color: #71717a; margin: 4px 0 0 0;">NEXT GEAR RENTALS PRIVATE LIMITED</p>
            <p style="font-size: 10px; color: #71717a; margin: 2px 0 0 0;">GSTIN: 07AAACN9988C1Z4 | CIN: U50100DL2022PTC398102</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">OFFICIAL GST SETTLEMENT RECEIPT</span>
            <p style="font-size: 13px; font-weight: 800; color: #ffffff; margin: 10px 0 0 0;">INV #${record.id}</p>
            <p style="font-size: 11px; color: #a1a1aa; margin: 2px 0 0 0;">Date: ${new Date(record.settledAt || record.requestedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="grid">
          <div class="info-box">
            <p style="font-size: 10px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; margin: 0 0 8px 0;">PAYOUT RECIPIENT VENDOR:</p>
            <p style="font-weight: 800; color: #ffffff; font-size: 15px; margin: 0;">${record.vendorName}</p>
            <p style="color: #a1a1aa; margin: 4px 0 0 0;">Account: ${record.bankAccountMasked}</p>
            <p style="color: #a1a1aa; margin: 2px 0 0 0;">UPI ID: ${record.upiIdMasked}</p>
          </div>
          <div class="info-box">
            <p style="font-size: 10px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; margin: 0 0 8px 0;">SETTLEMENT DETAILS:</p>
            <p style="color: #f4f4f5; margin: 0;">Period: <strong>${record.period}</strong></p>
            <p style="color: #f4f4f5; margin: 4px 0 0 0;">Bank Txn Ref: <strong style="font-family: monospace; color: #10b981;">${record.settlementTxnRef || "PENDING"}</strong></p>
            <p style="color: #f4f4f5; margin: 2px 0 0 0;">Status: <strong style="color: #10b981; text-transform: uppercase;">${record.status}</strong></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description / Particulars</th>
              <th>Calculation Formula</th>
              <th style="text-align: right;">Amount (₹ INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Total Gross Rental Revenue</strong></td>
              <td>Total customer booking charges collected</td>
              <td style="text-align: right; font-weight: 700;">₹${record.grossRevenueINR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Platform Service Fee / Commission</td>
              <td>${record.commissionRate}% of Gross Revenue</td>
              <td style="text-align: right; color: #ef4444; font-weight: 700;">- ₹${record.commissionINR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>CGST on Commission (9%)</td>
              <td>9% of Platform Fee</td>
              <td style="text-align: right; color: #a1a1aa;">₹${(record.gstOnCommissionINR / 2).toFixed(2)}</td>
            </tr>
            <tr>
              <td>SGST on Commission (9%)</td>
              <td>9% of Platform Fee</td>
              <td style="text-align: right; color: #a1a1aa;">₹${(record.gstOnCommissionINR / 2).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>NET AMOUNT TRANSFERRED TO VENDOR BANK</td>
              <td>Gross Revenue minus Platform Fee</td>
              <td style="text-align: right;">₹${record.netPayoutINR.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated GST tax settlement statement issued by Next Gear Rentals Pvt Ltd.</p>
          <p>Next Gear Operations Desk | Support: support@next-gear.app | +91 90000 00000</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
