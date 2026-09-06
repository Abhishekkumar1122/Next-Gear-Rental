import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorModerationDetails, setVendorModerationStatus } from "@/lib/vendor-moderation";
import { getUserModerationDetails, setUserModerationStatus } from "@/lib/user-moderation";
import { assertAdminSession, assertAdminMutationRequest } from "@/lib/admin-security";
import { getUserVipDetails, setUserVipTierByAdmin, getUserVipTier, type VipTier } from "@/lib/user-vip-store";
import { getCustomerBookingDocs } from "@/lib/customer-documents";

interface SystemUserRecord {
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
  vipTier: VipTier;
  commissionRate?: number;
  createdAt: string;
  drivingLicenseUrl?: string | null;
  drivingLicenseNo?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarFrontNo?: string | null;
  aadhaarBackUrl?: string | null;
}

// In-memory fallback dataset
const mockUsers: SystemUserRecord[] = [
  {
    id: "usr-1",
    name: "Riya Verma",
    email: "riya@example.com",
    phone: "+91 98765 43210",
    role: "USER",
    kycStatus: "pending",
    blockCount: 0,
    vipTier: "GOLD",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "usr-2",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98111 22233",
    role: "USER",
    kycStatus: "approved",
    blockCount: 1,
    vipTier: "SILVER",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "vnd-m1",
    name: "Speedy Wheels Fleet",
    email: "fleet@speedy.in",
    phone: "+91 99887 76655",
    role: "VENDOR",
    kycStatus: "approved",
    blockCount: 2,
    commissionRate: 15,
    vipTier: "BRONZE",
    appealText: "We apologize for the delayed document upload. Please re-verify our compliance.",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const isAdmin = await assertAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roleFilter = request.nextUrl.searchParams.get("role");
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(5, Number(request.nextUrl.searchParams.get("limit")) || 25));

  if (process.env.DATABASE_URL) {
    try {
      // 1. Construct SQL WHERE clause for fast indexed DB search & filtering
      const where: any = {};

      if (roleFilter && roleFilter !== "all") {
        if (roleFilter === "USER" || roleFilter === "CUSTOMER") {
          where.role = "CUSTOMER";
        } else if (roleFilter === "VENDOR") {
          where.role = "VENDOR";
        } else if (roleFilter === "ADMIN") {
          where.role = "ADMIN";
        }
      }

      if (search) {
        const cleanId = search.trim().replace(/^(VND-|USR-|ADM-)/i, "");
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { id: { contains: cleanId, mode: "insensitive" as const } },
        ];
      }

      // 2. Parallel Fast Aggregations & Paginated Fetch in one roundtrip
      const [totalAccounts, customersCount, vendorsCount, adminsCount, totalFiltered, dbUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "VENDOR" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: { managedVendor: true },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      // 3. Map only the paginated slice
      const mapped: SystemUserRecord[] = await Promise.all(
        dbUsers.map(async (u) => {
          const isVendor = u.role === "VENDOR" || !!u.managedVendor;
          let kycStatus: SystemUserRecord["kycStatus"] = "none";
          let blockCount = 0;
          let appealText: string | undefined;
          let blockReason: string | undefined;
          let blockCustomMessage: string | undefined;
          let blockedAt: string | undefined;
          let commissionRate: number | undefined;

          if (isVendor && u.managedVendor) {
            const moderation = await getVendorModerationDetails(u.managedVendor.id, "approved");
            kycStatus = moderation.status === "blacklisted" ? "blacklisted" : "approved";
            blockCount = moderation.blockCount;
            appealText = moderation.appealText;
            blockReason = moderation.reason;
            blockCustomMessage = moderation.customMessage;
            commissionRate = Number(u.managedVendor.commissionRate);
          } else {
            const userModeration = await getUserModerationDetails(u.id, "approved");
            if (userModeration.status === "blacklisted") {
              kycStatus = "blacklisted";
              blockCount = userModeration.blockCount;
              appealText = userModeration.appealText;
              blockReason = userModeration.reason;
              blockCustomMessage = userModeration.customMessage;
              blockedAt = userModeration.blockedAt;
            } else {
              const userDocs = await prisma.userDocument.findFirst({
                where: { userId: u.id },
              });
              kycStatus = userDocs ? "approved" : "none";
            }
          }

          const userDocData = await getCustomerBookingDocs({
            userId: u.id,
            phone: u.phone,
            email: u.email,
          });

          return {
            id: u.id,
            name: u.name,
            email: u.email || "N/A",
            phone: u.phone || undefined,
            role: u.role === "CUSTOMER" ? "USER" : (u.role as any) || "USER",
            kycStatus: userDocData.hasDocs && kycStatus !== "blacklisted" ? "approved" : kycStatus,
            blockCount,
            appealText,
            blockReason,
            blockCustomMessage,
            blockedAt,
            commissionRate,
            vipTier: (await getUserVipDetails(u.id, u.email || undefined)).tier,
            createdAt: u.createdAt.toISOString(),
            drivingLicenseUrl: userDocData.dlUrl || null,
            drivingLicenseNo: userDocData.dlNo || null,
            aadhaarFrontUrl: userDocData.aadhaarFrontUrl || null,
            aadhaarFrontNo: userDocData.aadhaarFrontNo || null,
            aadhaarBackUrl: userDocData.aadhaarBackUrl || null,
          };
        })
      );

      const totalPages = Math.ceil(totalFiltered / limit) || 1;

      return NextResponse.json({
        users: mapped,
        pagination: {
          page,
          limit,
          totalCount: totalFiltered,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        counts: {
          total: totalAccounts,
          customers: customersCount,
          vendors: vendorsCount,
          admins: adminsCount,
          blocked: 0,
        },
      });
    } catch (err) {
      console.error("Database fetch users list error:", err);
    }
  }

  const mappedWithTiers = mockUsers.map((u) => ({
    ...u,
    vipTier: getUserVipTier(u.email || u.id),
  }));

  let filtered = roleFilter && roleFilter !== "all" 
    ? mappedWithTiers.filter((u) => u.role === roleFilter) 
    : mappedWithTiers;

  if (search) {
    const s = search.toLowerCase().trim();
    const cleanId = s.replace(/^(vnd-|usr-|adm-)/i, "");
    filtered = filtered.filter((u) => 
      u.name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) || 
      (u.phone && u.phone.includes(s)) ||
      u.id.toLowerCase().includes(cleanId)
    );
  }

  return NextResponse.json({
    users: filtered,
    pagination: {
      page: 1,
      limit: 25,
      totalCount: filtered.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    counts: {
      total: mockUsers.length,
      customers: mockUsers.filter((u) => u.role === "USER").length,
      vendors: mockUsers.filter((u) => u.role === "VENDOR").length,
      admins: mockUsers.filter((u) => u.role === "ADMIN").length,
      blocked: 0,
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await request.json();
  const { userId, status, reason, customMessage, vipTier, commissionRate } = payload;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  if (vipTier && ["BRONZE", "SILVER", "GOLD", "PLATINUM"].includes(vipTier)) {
    try {
      await setUserVipTierByAdmin(userId, vipTier as VipTier);
    } catch (vipErr) {
      console.error("[Admin Save VIP Tier Error]", vipErr);
    }
  }

  if (process.env.DATABASE_URL) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { managedVendor: true }
      });

      if (!user) {
        return NextResponse.json({ error: "User account not found" }, { status: 404 });
      }

      if (status && ["pending", "approved", "rejected", "blacklisted"].includes(status)) {
        if (user.managedVendor) {
          await setVendorModerationStatus(
            user.managedVendor.id,
            status as any,
            reason,
            customMessage
          );
        } else {
          await setUserModerationStatus(
            user.id,
            status === "blacklisted" ? "blacklisted" : "approved",
            reason,
            customMessage
          );
        }
      }

      if (commissionRate !== undefined && user.managedVendor) {
        await prisma.vendor.update({
          where: { id: user.managedVendor.id },
          data: { commissionRate: Number(commissionRate) },
        });
      }

      const updatedVip = await getUserVipDetails(user.id, user.email || undefined);
      return NextResponse.json({ success: true, vipTier: updatedVip.tier });
    } catch (err) {
      console.error("Failed to update user status:", err);
      return NextResponse.json({ error: "Database write error" }, { status: 500 });
    }
  }

  // Fallback update
  const match = mockUsers.find((u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (match) {
    if (status && ["pending", "approved", "rejected", "blacklisted"].includes(status)) {
      const isBlocked = status === "blacklisted";
      match.kycStatus = status;
      if (isBlocked) {
        match.blockCount += 1;
        match.appealText = undefined;
        match.blockReason = reason;
        match.blockCustomMessage = customMessage;
        match.blockedAt = new Date().toISOString();
      } else {
        match.blockReason = undefined;
        match.blockCustomMessage = undefined;
      }
    }
    if (vipTier) {
      match.vipTier = vipTier as VipTier;
    }
    if (commissionRate !== undefined) {
      match.commissionRate = Number(commissionRate);
    }
    return NextResponse.json({ user: match, vipTier: getUserVipTier(match.email) });
  }

  return NextResponse.json({ success: true, vipTier });
}
