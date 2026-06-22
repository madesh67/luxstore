import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/schemas/auth";
import { isRateLimited } from "@/lib/rate-limiter";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  try {
    // 1. Rate limiting: Max 3 requests per IP in 15 minutes
    const limitResult = await isRateLimited(`forgot-password:${ip}`, 3, 15 * 60 * 1000);
    if (limitResult.limited) {
      return errorResponse(
        "Too many password reset requests. Please try again in 15 minutes.",
        429,
        "RATE_LIMIT_ERROR",
        { resetTime: limitResult.resetTime }
      );
    }

    // 2. Parse and validate schema
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // 3. Search user
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    // 4. If user exists, create token and send email
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      await prisma.$transaction(async (tx) => {
        // Revoke any previous reset tokens for this email
        await tx.passwordResetToken.deleteMany({
          where: { email },
        });

        // Store new token
        await tx.passwordResetToken.create({
          data: {
            email,
            token,
            expiresAt,
          },
        });

        // Log forgot-password audit trail
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_FORGOT_PASSWORD_REQUEST",
            details: `Requested reset token from IP: ${ip}`,
            ipAddress: ip,
          },
        });
      });

      // Send the email asynchronously
      await sendPasswordResetEmail(email, token);
    }

    // 5. Always return a generic success message to prevent user enumeration
    return successResponse({
      message: "If that email address is registered, we have sent a link to reset your password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
