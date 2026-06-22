import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError, AppError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas/auth";
import { isRateLimited } from "@/lib/rate-limiter";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  
  try {
    // 1. Rate Limiting: Max 5 registration attempts per IP in 15 minutes
    const limitResult = await isRateLimited(`register:${ip}`, 5, 15 * 60 * 1000);
    if (limitResult.limited) {
      return errorResponse(
        "Too many registration attempts. Please try again later.",
        429,
        "RATE_LIMIT_ERROR",
        { resetTime: limitResult.resetTime }
      );
    }

    // 2. Parse and Validate body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { firstName, lastName, email, password } = validatedData;

    // 3. Check uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("Email is already registered", 400, "EMAIL_EXISTS");
    }

    // 4. Hash password with bcrypt
    const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Database transaction: Create user, cart, wishlist, and verification token
    const { user, tokenRecord } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          role: "CUSTOMER",
          isEmailVerified: false,
        },
      });

      // Initialize empty cart & wishlist for the new user
      await tx.cart.create({
        data: { userId: newUser.id },
      });
      await tx.wishlist.create({
        data: { userId: newUser.id },
      });

      // Generate verification token (expires in 24 hours)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newVerificationToken = await tx.verificationToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Write initial audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: "USER_REGISTER",
          details: `User registered with email: ${email}`,
          ipAddress: ip,
        },
      });

      return { user: newUser, tokenRecord: newVerificationToken };
    });

    // 6. Send verification email
    await sendVerificationEmail(email, tokenRecord.token);

    // 7. Return success response (excluding password hash)
    return successResponse(
      {
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
