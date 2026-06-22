import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import { cookies } from "next/headers";

export interface SessionUser {
  userId: string;
  role: string;
  email: string;
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  let token = request.cookies.get("accessToken")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    if (!payload) return null;
    return {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function getCartSession(request: NextRequest) {
  const user = await getSessionUser(request);
  const cookieStore = await cookies();
  let guestToken = cookieStore.get("guestToken")?.value || null;

  if (!user && !guestToken) {
    // Generate a secure guest token
    guestToken = `guest_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    cookieStore.set("guestToken", guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  return {
    userId: user?.userId || null,
    guestToken,
  };
}
