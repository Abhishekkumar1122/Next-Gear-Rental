import { prisma } from "@/lib/prisma";

export type VendorKycDocumentType =
  | "aadhaar"
  | "pan"
  | "driving-license"
  | "vehicle-rc"
  | "insurance"
  | "bank-proof"
  | "other";

export type VendorKycDocument = {
  id: string;
  vendorId: string;
  documentType: VendorKycDocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

type VendorKycDocumentRow = {
  id: string;
  vendor_id: string;
  document_type: VendorKycDocumentType;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: Date;
};

const inMemoryVendorKycDocs = new Map<string, VendorKycDocument[]>();
let ensuredTable = false;

function toVendorKycDocument(row: VendorKycDocumentRow): VendorKycDocument {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    documentType: row.document_type,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedAt: new Date(row.uploaded_at).toISOString(),
  };
}

async function ensureTable() {
  if (ensuredTable || !process.env.DATABASE_URL) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorKycDocument" (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  ensuredTable = true;
}

export async function listVendorKycDocuments(vendorId: string): Promise<VendorKycDocument[]> {
  if (!process.env.DATABASE_URL) {
    return [...(inMemoryVendorKycDocs.get(vendorId) ?? [])].sort((a, b) =>
      b.uploadedAt.localeCompare(a.uploadedAt)
    );
  }

  await ensureTable();

  const rows = await prisma.$queryRawUnsafe<VendorKycDocumentRow[]>(
    `
      SELECT id, vendor_id, document_type, file_name, file_url, mime_type, size_bytes, uploaded_at
      FROM "VendorKycDocument"
      WHERE vendor_id = $1
      ORDER BY uploaded_at DESC
    `,
    vendorId
  );

  return rows.map(toVendorKycDocument);
}

export async function addVendorKycDocument(input: {
  vendorId: string;
  documentType: VendorKycDocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<VendorKycDocument> {
  if (!process.env.DATABASE_URL) {
    const doc: VendorKycDocument = {
      id: `vdoc_${crypto.randomUUID()}`,
      vendorId: input.vendorId,
      documentType: input.documentType,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
    };

    const list = inMemoryVendorKycDocs.get(input.vendorId) ?? [];
    list.unshift(doc);
    inMemoryVendorKycDocs.set(input.vendorId, list);
    return doc;
  }

  await ensureTable();

  const id = `vdoc_${crypto.randomUUID()}`;
  const rows = await prisma.$queryRawUnsafe<VendorKycDocumentRow[]>(
    `
      INSERT INTO "VendorKycDocument" (id, vendor_id, document_type, file_name, file_url, mime_type, size_bytes, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, vendor_id, document_type, file_name, file_url, mime_type, size_bytes, uploaded_at
    `,
    id,
    input.vendorId,
    input.documentType,
    input.fileName,
    input.fileUrl,
    input.mimeType,
    input.sizeBytes
  );

  return toVendorKycDocument(rows[0]);
}

export async function deleteVendorKycDocument(vendorId: string, documentId: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    const list = inMemoryVendorKycDocs.get(vendorId) ?? [];
    const next = list.filter((doc) => doc.id !== documentId);
    const changed = next.length !== list.length;
    inMemoryVendorKycDocs.set(vendorId, next);
    return changed;
  }

  await ensureTable();
  const affected = await prisma.$executeRawUnsafe(
    `DELETE FROM "VendorKycDocument" WHERE id = $1 AND vendor_id = $2`,
    documentId,
    vendorId
  );
  return Number(affected) > 0;
}
