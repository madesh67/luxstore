import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/schemas/auth";
import { verifyAccessToken } from "@/lib/jwt";
import { clearAuthCookies } from "@/lib/cookies";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user from request cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken) {
      throw new AppError("Unauthorized access", 401, "UNAUTHORIZED");
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      throw new AppError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED");
    }

    // 2. Parse and validate schemas
    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;

    // 3. Query user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
    });

    if (!user) {
      throw new AppError("User profile not found", 404, "USER_NOT_FOUND");
    }

    // 4. Compare current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 400, "INCORRECT_PASSWORD");
    }

    // 5. Hash new password
    const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 6. Save update and clear active sessions (forces relog across all devices for security)
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Clear refresh tokens and active sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
      await tx.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_PASSWORD_CHANGE_SUCCESS",
          details: `Password changed successfully from IP: ${ip}`,
          ipAddress: ip,
        },
      });
    });

    // We clear cookies because all user sessions are invalidated
    const response = successResponse({
      message: "Your password has been changed. Please log in again with your new credentials.",
    });
    clearAuthCookies(response);
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
