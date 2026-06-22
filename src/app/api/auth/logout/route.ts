import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken } from "@/lib/jwt";
import { clearAuthCookies } from "@/lib/cookies";

export async function POST(request: NextRequest) {
  try {
    const refreshTokenCookie = request.cookies.get("refreshToken")?.value;

    if (refreshTokenCookie) {
      const payload = await verifyRefreshToken(refreshTokenCookie);
      
      if (payload) {
        // Invalidate session state in database
        await prisma.$transaction(async (tx) => {
          // Delete refresh tokens for this JTI/user
          await tx.refreshToken.deleteMany({
            where: { jti: payload.jti },
          });

          // Delete session matching this user and IP
          const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
          await tx.session.deleteMany({
            where: {
              userId: payload.userId,
              ipAddress: ip,
            },
          });

          // Write audit log
          await tx.auditLog.create({
            data: {
              userId: payload.userId,
              action: "USER_LOGOUT",
              details: `User logged out from IP: ${ip}`,
              ipAddress: ip,
            },
          });
        });
      }
    }

    // Set up standard success response and clear authorization cookies
    const response = successResponse({ message: "Logout successful" });
    clearAuthCookies(response);
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
