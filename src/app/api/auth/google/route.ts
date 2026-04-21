import { authCookieName, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const googleAuthSchema = z.object({
  token: z.string(),
});

async function verifyGoogleToken(token: string) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + token);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || "Invalid token");
    }

    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      sub: data.sub,
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    throw new Error("Token verification failed");
  }
}

export async function POST(request: Request) {
  try {
    const parseResult = googleAuthSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { token } = parseResult.data;
    const googleUser = await verifyGoogleToken(token);

    const hasDatabase = Boolean(process.env.DATABASE_URL);
    let user: { id: string; email: string | null; role: string } | null = null;

    if (hasDatabase) {
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        // Create new user if doesn't exist
        user = await prisma.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            role: "CUSTOMER",
            // No password for OAuth users
          },
          select: { id: true, email: true, role: true },
        });
      }
    } else {
      const found = runtimeUsers.find((u) => u.email.toLowerCase() === googleUser.email.toLowerCase());
      if (found) {
        user = {
          id: found.id,
          email: found.email,
          role: found.role,
        };
      } else {
        // Create new user in runtime store
        const newUser = {
          id: `usr-${runtimeUsers.length + 1}`,
          name: googleUser.name,
          email: googleUser.email,
          role: "CUSTOMER" as const,
          passwordHash: "", // Empty password for OAuth users
        };
        runtimeUsers.push(newUser);
        user = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        };
      }
    }

    if (!user || !user.email) {
      return NextResponse.json({ error: "Failed to create user or authenticate" }, { status: 500 });
    }

    const sessionToken = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({ message: "Login successful" });
    response.cookies.set(authCookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
