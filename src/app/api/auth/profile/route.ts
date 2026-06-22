import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";

const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .trim(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .trim(),
});

export async function PATCH(request: NextRequest) {
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

    // 2. Parse and validate body
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);
    const { firstName, lastName } = validatedData;

    // 3. Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        firstName,
        lastName,
      },
    });

    // 4. Log change audit trail
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: "USER_PROFILE_UPDATE",
        details: `Updated name to: ${firstName} ${lastName}`,
        ipAddress: ip,
      },
    });

    return successResponse({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
