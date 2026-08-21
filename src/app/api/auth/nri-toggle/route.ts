import { prisma } from "@/lib/prisma";
import { getServerSessionUser } from "@/lib/server-session";
import { NextResponse } from "next/server";

const hasDatabase = Boolean(process.env.DATABASE_URL);

export async function PATCH() {
  const user = await getServerSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (hasDatabase) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { isNri: true },
      });
    } catch (error) {
      console.error("Failed to update user isNri in database:", error);
      return NextResponse.json({ error: "Failed to update NRI status in database" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, isNri: true });
}
