import { vendors } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { getVendorModerationDetails, getVendorModerationMap, setVendorModerationStatus, type VendorModerationStatus } from "@/lib/vendor-moderation";
import { sendVendorApprovalEmailAndWhatsApp } from "@/lib/vendor-email-service";
import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession, assertAdminMutationRequest } from "@/lib/admin-security";

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await request.json();
  const { vendorId, status, kycDocPath, reason, commissionRate, password } = payload;

  if (!vendorId || !status || !["pending", "approved", "rejected", "blacklisted"].includes(status)) {
    return NextResponse.json({ error: "Invalid status or missing vendorId" }, { status: 400 });
  }

  const nextStatus = status as VendorModerationStatus;

  if (process.env.DATABASE_URL) {
    const existing = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        ownerUser: { select: { email: true, name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const newCommissionRate = commissionRate !== undefined ? Number(commissionRate) : Number(existing.commissionRate);

    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        commissionRate: newCommissionRate,
      },
    });

    await setVendorModerationStatus(vendorId, nextStatus, reason);

    if (nextStatus === "approved" && existing.ownerUser?.email) {
      void sendVendorApprovalEmailAndWhatsApp({
        businessName: existing.businessName,
        contactName: existing.ownerUser.name || existing.businessName,
        email: existing.ownerUser.email,
        phone: existing.contactPhone,
        tempPassword: password || "NextGear#2026",
        commissionRate: newCommissionRate,
      });
    }

    return NextResponse.json({
      vendor: {
        id: existing.id,
        businessName: existing.businessName,
        phone: existing.contactPhone,
        commissionRate: newCommissionRate,
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
  if (commissionRate !== undefined) {
    vendor.commissionRate = Number(commissionRate);
  }
  if (kycDocPath) {
    vendor.kycDocPath = kycDocPath;
  }

  await setVendorModerationStatus(vendorId, nextStatus, reason);

  if (nextStatus === "approved" && vendor.adminEmail) {
    void sendVendorApprovalEmailAndWhatsApp({
      businessName: vendor.businessName,
      contactName: vendor.businessName,
      email: vendor.adminEmail,
      phone: vendor.phone,
      tempPassword: password || "NextGear#2026",
      commissionRate: vendor.commissionRate,
    });
  }

  return NextResponse.json({ vendor });
}
