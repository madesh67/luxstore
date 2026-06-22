import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setAuthCookies, clearAuthCookies } from "@/lib/cookies";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const oldTokenCookie = request.cookies.get("refreshToken")?.value;

    if (!oldTokenCookie) {
      throw new AppError("Refresh token required", 401, "REFRESH_TOKEN_REQUIRED");
    }

    // 1. Verify Refresh Token JWT signature
    const payload = await verifyRefreshToken(oldTokenCookie);
    if (!payload) {
      const response = errorResponse("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
      clearAuthCookies(response);
      return response;
    }

    // 2. Query JTI from database
    const dbToken = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    // Token Abuse Detection: If JTI not found in database or is revoked,
    // we assume the token was compromised or reused. As a security countermeasure,
    // we revoke all sessions and refresh tokens for this user.
    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      await prisma.$transaction(async (tx) => {
        // Revoke all refresh tokens
        await tx.refreshToken.deleteMany({
          where: { userId: payload.userId },
        });
        // Invalidate all active sessions
        await tx.session.deleteMany({
          where: { userId: payload.userId },
        });
        // Write security breach log
        await tx.auditLog.create({
          data: {
            userId: payload.userId,
            action: "SECURITY_BREACH_REFRESH_TOKEN_REUSE",
            details: `Refresh token reuse or invalid JTI detected. Revoked all sessions.`,
            ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          },
        });
      });

      const response = errorResponse("Session compromised. Please log in again.", 401, "TOKEN_COMPROMISED");
      clearAuthCookies(response);
      return response;
    }

    // 3. Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
    });

    if (!user) {
      throw new AppError("User not found or suspended", 401, "USER_SUSPENDED");
    }

    // 4. Perform Refresh Token Rotation (RTR)
    const newJti = crypto.randomUUID();
    const newAccessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      jti: newJti,
    });

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.$transaction(async (tx) => {
      // Delete old token
      await tx.refreshToken.delete({
        where: { id: dbToken.id },
      });

      // Save new token
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          jti: newJti,
          expiresAt: refreshExpiry,
        },
      });
    });

    // 5. Respond and update cookies
    const response = successResponse({
      message: "Tokens refreshed successfully",
      accessToken: newAccessToken,
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
