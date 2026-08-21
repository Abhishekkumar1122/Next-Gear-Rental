import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorModerationDetails, setVendorModerationStatus } from "@/lib/vendor-moderation";
import { assertAdminSession, assertAdminMutationRequest } from "@/lib/admin-security";
import { getUserVipTier, setUserVipTier, type VipTier } from "@/lib/user-tiers";

interface SystemUserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "VENDOR" | "ADMIN";
  kycStatus: "pending" | "approved" | "rejected" | "none" | "blacklisted";
  blockCount: number;
  appealText?: string;
  vipTier: VipTier;
  commissionRate?: number;
  createdAt: string;
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

  if (process.env.DATABASE_URL) {
    try {
      const dbUsers = await prisma.user.findMany({
        include: { managedVendor: true },
        orderBy: { createdAt: "desc" },
      });

      const mapped: SystemUserRecord[] = await Promise.all(
        dbUsers.map(async (u) => {
          const isVendor = u.role === "VENDOR" || !!u.managedVendor;
          let kycStatus: SystemUserRecord["kycStatus"] = "none";
          let blockCount = 0;
          let appealText: string | undefined;
          let commissionRate: number | undefined;

          if (isVendor && u.managedVendor) {
            const moderation = await getVendorModerationDetails(u.managedVendor.id, "approved");
            kycStatus = moderation.status === "blacklisted" ? "blacklisted" : "approved";
            blockCount = moderation.blockCount;
            appealText = moderation.appealText;
            commissionRate = Number(u.managedVendor.commissionRate);
          } else {
            const userDocs = await prisma.userDocument.findFirst({
              where: { userId: u.id },
            });
            kycStatus = userDocs ? "approved" : "none";
          }

          return {
            id: u.id,
            name: u.name,
            email: u.email || "N/A",
            phone: u.phone || undefined,
            role: u.role === "CUSTOMER" ? "USER" : (u.role as any) || "USER",
            kycStatus,
            blockCount,
            appealText,
            commissionRate,
            vipTier: getUserVipTier(u.email || u.id),
            createdAt: u.createdAt.toISOString(),
          };
        })
      );

      const filtered = roleFilter && roleFilter !== "all" 
        ? mapped.filter(u => u.role === roleFilter) 
        : mapped;

      return NextResponse.json({ users: filtered });
    } catch (err) {
      console.error("Database fetch users list error:", err);
      return NextResponse.json({ error: "Failed to load database users" }, { status: 500 });
    }
  }

  const mappedWithTiers = mockUsers.map(u => ({
    ...u,
    vipTier: getUserVipTier(u.email || u.id),
  }));

  const filtered = roleFilter && roleFilter !== "all" 
    ? mappedWithTiers.filter(u => u.role === roleFilter) 
    : mappedWithTiers;

  return NextResponse.json({ users: filtered });
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdminMutationRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = await request.json();
  const { userId, status, vipTier, commissionRate } = payload;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  if (vipTier) {
    setUserVipTier(userId, vipTier as VipTier);
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
          await setVendorModerationStatus(user.managedVendor.id, status as any, "Direct moderator blacklist update");
        }
      }

      if (commissionRate !== undefined && user.managedVendor) {
        await prisma.vendor.update({
          where: { id: user.managedVendor.id },
          data: { commissionRate: Number(commissionRate) },
        });
      }

      return NextResponse.json({ success: true, vipTier: getUserVipTier(user.email || userId) });
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
