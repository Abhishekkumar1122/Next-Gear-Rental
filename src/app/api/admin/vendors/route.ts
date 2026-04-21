import { vendors } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { getVendorModerationDetails, getVendorModerationMap, setVendorModerationStatus, type VendorModerationStatus } from "@/lib/vendor-moderation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as VendorModerationStatus | null;

  if (process.env.DATABASE_URL) {
    const dbVendors = await prisma.vendor.findMany({
      include: {
        ownerUser: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const moderationMap = await getVendorModerationMap(dbVendors.map((item) => item.id), "approved");
    const moderationDetails = await Promise.all(
      dbVendors.map(async (item) => {
        const details = await getVendorModerationDetails(item.id, "approved");
        return [item.id, details.reason] as const;
      })
    );
    const moderationReasonMap = new Map(moderationDetails);

    const mapped = dbVendors.map((item) => ({
      id: item.id,
      businessName: item.businessName,
      phone: item.contactPhone,
      commissionRate: Number(item.commissionRate),
      status: moderationMap.get(item.id) ?? "approved",
      reason: moderationReasonMap.get(item.id),
      adminEmail: item.ownerUser?.email ?? undefined,
      createdAt: item.createdAt.toISOString(),
    }));

    const filtered = status ? mapped.filter((vendor) => vendor.status === status) : mapped;
    return NextResponse.json({ vendors: filtered });
  }

  let filtered = vendors;
  if (status) {
    filtered = vendors.filter((vendor) => vendor.status === status);
  }

  return NextResponse.json({ vendors: filtered });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json();
  const { vendorId, status, kycDocPath, reason } = payload;

  if (!vendorId || !status || !["pending", "approved", "rejected", "blacklisted"].includes(status)) {
    return NextResponse.json({ error: "Invalid status or missing vendorId" }, { status: 400 });
  }

  const nextStatus = status as VendorModerationStatus;

  if (process.env.DATABASE_URL) {
    const existing = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        ownerUser: { select: { email: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    await setVendorModerationStatus(vendorId, nextStatus, reason);

    return NextResponse.json({
      vendor: {
        id: existing.id,
        businessName: existing.businessName,
        phone: existing.contactPhone,
        commissionRate: Number(existing.commissionRate),
        status: nextStatus,
        adminEmail: existing.ownerUser?.email ?? undefined,
        reason: nextStatus === "blacklisted" ? String(reason ?? "Violation of privacy policy") : undefined,
        kycDocPath,
        createdAt: existing.createdAt.toISOString(),
      },
    });
  }

  const vendor = vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  vendor.status = nextStatus;
  if (kycDocPath) {
    vendor.kycDocPath = kycDocPath;
  }

  await setVendorModerationStatus(vendorId, nextStatus, reason);

  return NextResponse.json({ vendor });
}
