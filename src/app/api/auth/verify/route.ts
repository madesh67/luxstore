import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bodyToken = await request.clone().json().catch(() => ({}));
    const token = searchParams.get("token") || bodyToken.token;

    if (!token) {
      throw new AppError("Verification token is required", 400, "TOKEN_REQUIRED");
    }

    // 1. Fetch token and check expiry
    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      throw new AppError("The verification link is invalid or has expired", 400, "INVALID_TOKEN");
    }

    // 2. Query user profile
    const user = await prisma.user.findUnique({
      where: { email: verificationRecord.email, deletedAt: null },
    });

    if (!user) {
      throw new AppError("User associated with this token not found", 404, "USER_NOT_FOUND");
    }

    // 3. Transaction: Update verified flag, clean token, write audit log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.$transaction(async (tx) => {
      // Mark as verified
      await tx.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });

      // Remove the single use token
      await tx.verificationToken.delete({
        where: { id: verificationRecord.id },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_EMAIL_VERIFIED",
          details: `Email verified successfully from IP: ${ip}`,
          ipAddress: ip,
        },
      });
    });

    return successResponse({
      message: "Your email address has been verified successfully. You can now log in.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
export type PostVerifyType = typeof POST;
