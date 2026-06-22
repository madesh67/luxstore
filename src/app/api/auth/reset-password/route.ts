import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/schemas/auth";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || (await request.clone().json()).token;

    if (!token) {
      throw new AppError("Reset token is required", 400, "TOKEN_REQUIRED");
    }

    // 1. Fetch token and validate expiration
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new AppError("The reset link is invalid or has expired", 400, "INVALID_TOKEN");
    }

    // 2. Validate password fields
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);
    const { password } = validatedData;

    // 3. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email, deletedAt: null },
    });

    if (!user) {
      throw new AppError("User associated with this token not found", 404, "USER_NOT_FOUND");
    }

    // 4. Hash new password with bcrypt
    const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Commit transaction: update password, prune tokens, and revoke sessions
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Delete the used reset token (one-time use)
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      // Force session logout across all devices for security
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
      await tx.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Log password reset event
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_PASSWORD_RESET_SUCCESS",
          details: `Password reset success from IP: ${ip}`,
          ipAddress: ip,
        },
      });
    });

    return successResponse({
      message: "Your password has been successfully reset. Please log in with your new password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
