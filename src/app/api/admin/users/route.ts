import { users } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as "pending" | "approved" | "rejected" | null;

  let filtered = users;
  if (status) {
    filtered = users.filter((user) => user.kycStatus === status);
  }

  return NextResponse.json({ users: filtered });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json();
  const { userId, status, kycDocPath } = payload;

  if (!userId || !status || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status or missing userId" }, { status: 400 });
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  user.kycStatus = status;
  if (kycDocPath) {
    user.kycDocPath = kycDocPath;
  }

  return NextResponse.json({ user });
}
