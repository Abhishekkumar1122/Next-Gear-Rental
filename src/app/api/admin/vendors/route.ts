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

  const url = request.nextUrl;
  const status = url.searchParams.get("status") as VendorModerationStatus | null;
  const search = url.searchParams.get("search")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit")) || 25));

  if (process.env.DATABASE_URL) {
    const where: any = {};
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" as const } },
        { contactPhone: { contains: search } },
      ];
    }

    const [totalCount, dbVendors] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        select: {
          id: true,
          businessName: true,
          contactPhone: true,
          commissionRate: true,
          createdAt: true,
          ownerUser: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const moderationMap = await getVendorModerationMap(dbVendors.map((item) => item.id), "approved");

    const mapped = dbVendors.map((item) => ({
      id: item.id,
      businessName: item.businessName,
      phone: item.contactPhone,
      commissionRate: Number(item.commissionRate),
      status: moderationMap.get(item.id) ?? "approved",
      adminEmail: item.ownerUser?.email ?? undefined,
      createdAt: item.createdAt.toISOString(),
    }));

    const filtered = status ? mapped.filter((vendor) => vendor.status === status) : mapped;
    return NextResponse.json({
      vendors: filtered,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
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
